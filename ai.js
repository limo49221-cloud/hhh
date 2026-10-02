/* =====================================================
   ai.js · AI 模式（可选开关）
   和原字卡系统完全独立
   ===================================================== */

window.AI_MODE = {
  enabled: false,          // 总开关
  provider: "deepseek",    // deepseek / gemini / custom
  apiKey: "",
  model: "deepseek-chat",
  endpoint: "https://api.deepseek.com/chat/completions",
  systemPrompt: "",
  maxHistory: 20,          // 带多少条历史给 AI
  temperature: 0.9,
  useAI: {
    chat:    true,         // 聊天用 AI
    poke:    false,        // 拍一拍用 AI（默认关）
    moments: true,         // 朋友圈用 AI
    letters: true          // 信件用 AI
  }
};

// 从 localStorage 读配置
function loadAIConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("aiConfig") || "null");
    if (saved) Object.assign(window.AI_MODE, saved);
  } catch (e) {}
}
function saveAIConfig() {
  try {
    localStorage.setItem("aiConfig", JSON.stringify(window.AI_MODE));
  } catch (e) {}
}

// 拼 system prompt
function buildSystemPrompt() {
  if (window.AI_MODE.systemPrompt) return window.AI_MODE.systemPrompt;
  const s = window.state && window.state.settings ? window.state.settings : {};
  const taName = s.taName || "TA";
  return `你是${taName}，在和一个亲密的人微信聊天。
要求：
- 说话简短，像微信聊天，一句话不超过 30 字
- 不要用"作为AI""我是助手"这种词
- 可以有情绪，可以撒娇、嘴硬、开玩笑
- 不要每次都问问题，有时只是回应
- 用中文，口语化`;
}

// 核心：问 AI
async function askAI(userText) {
  const cfg = window.AI_MODE;
  if (!cfg.enabled) return null;
  if (!cfg.apiKey) {
    console.warn("[AI] 没填 API Key");
    return null;
  }

  // 拿最近 N 条聊天历史
  const history = [];
  if (window.state && Array.isArray(window.state.messages)) {
    const recent = window.state.messages
      .filter(m => m.type !== "system" && m.type !== "poke" && !m.recalled)
      .slice(-cfg.maxHistory);
    recent.forEach(m => {
      if (!m.text) return;
      history.push({
        role: m.from === "me" ? "user" : "assistant",
        content: m.text
      });
    });
  }

  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...history,
    { role: "user", content: userText }
  ];

  try {
    if (cfg.provider === "gemini") {
      return await askGemini(messages);
    }
    return await askOpenAICompatible(messages);
  } catch (e) {
    console.error("[AI] 请求失败", e);
    return null;
  }
}

// OpenAI 兼容格式（DeepSeek / 通义 / 智谱 / OpenAI 都是这个格式）
async function askOpenAICompatible(messages) {
  const cfg = window.AI_MODE;
  const res = await fetch(cfg.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + cfg.apiKey
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: cfg.temperature
    })
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[AI] HTTP", res.status, err);
    return null;
  }
  const data = await res.json();
  return data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content.trim()
    : null;
}

// Gemini 格式
async function askGemini(messages) {
  const cfg = window.AI_MODE;
  const sys = messages.find(m => m.role === "system");
  const rest = messages.filter(m => m.role !== "system");
  const contents = rest.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: sys ? { parts: [{ text: sys.content }] } : undefined,
      contents,
      generationConfig: { temperature: cfg.temperature }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[AI] Gemini HTTP", res.status, err);
    return null;
  }
  const data = await res.json();
  return data.candidates && data.candidates[0] && data.candidates[0].content
    ? data.candidates[0].content.parts.map(p => p.text).join("").trim()
    : null;
}

// 初始化
loadAIConfig();

window.__ai = {
  askAI,
  saveAIConfig,
  loadAIConfig,
  getConfig: () => window.AI_MODE
};