/* =====================================================
   我的小站 · 完整版（带搜索）
   ===================================================== */

const store = {
  get(key, def) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v === null ? def : v; }
    catch (e) { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { console.warn("存储失败", e); }
  }
};

const state = {
  settings: store.get("settings", {
    myName: "我", taName: "TA",
    myAvatar: "", taAvatar: "",
    bgColor: "#ededed", bgImage: "",
    myBubbleColor: "#95ec69", taBubbleColor: "#ffffff",
    fontSize: 17,
    replyDelayMin: 1, replyDelayMax: 3,
    readNoReplyProb: 10,
    pokeBackProb: 50, pokeCardProb: 50,
    voiceProb: 15, imgProb: 15,
    callRejectProb: 50,
    moodProb: 30, intentProb: 30,
    taMomentsProb: 30,
    taCommentProb: 50,    
    searchLinkProb: 10,
    suggestProb: 5
  }),
  cards: store.get("cards", { categories: [] }),
  pokeTexts: store.get("pokeTexts", ["拍了拍我的头", "拍了拍我的肩膀", "拍了拍我的脸"]),
  messages: store.get("messages", []),
  favoritesMine: store.get("favoritesMine", []),
  favoritesTa: store.get("favoritesTa", []),
  emojis: store.get("emojis", []),
  moments: store.get("moments", []),
  water: store.get("water", { date: "", count: 0, goal: 8 }),
  wishlist: store.get("wishlist", []),
  suggestHistory: store.get("suggestHistory", []),
  pomodoro: store.get("pomodoro", { focusMin: 25, shortMin: 5, longMin: 15, todayCount: 0, totalCount: 0, date: "" }),
  desktopIcons: store.get("desktopIcons", null)
};

function saveSettings() { store.set("settings", state.settings); }
function saveCards() { store.set("cards", state.cards); }
function savePokeTexts() { store.set("pokeTexts", state.pokeTexts); }
function saveMessages() { store.set("messages", state.messages); }
function saveFavMine() { store.set("favoritesMine", state.favoritesMine); }
function saveFavTa() { store.set("favoritesTa", state.favoritesTa); }
function saveEmojis() { store.set("emojis", state.emojis); }
function saveMoments() { store.set("moments", state.moments); }
function saveWater() { store.set("water", state.water); }
function saveWishlist() { store.set("wishlist", state.wishlist); }
function saveSuggestHistory() { store.set("suggestHistory", state.suggestHistory); }
function savePomodoro() { store.set("pomodoro", state.pomodoro); }
function saveDesktopIcons() { store.set("desktopIcons", state.desktopIcons); }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function nowBeijing() {
  const d = new Date();
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 8 * 3600000);
}
function fmtTime(d) { return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function fmtFull(d) { return `${d.getMonth()+1}月${d.getDate()}日 ${fmtTime(d)}`; }
function fmtDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { if (!arr || !arr.length) return null; return arr[Math.floor(Math.random() * arr.length)]; }
function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function compressImage(file, maxW = 1000, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;z-index:9999;pointer-events:none;";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1500);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}
document.querySelectorAll("[data-back]").forEach(btn => {
  btn.addEventListener("click", () => showScreen("desktop"));
});

const SUGGEST_TYPES = [
  { key: "book",  label: "书籍",  platforms: [
    { name: "豆瓣",     icon: "📖", url: "https://search.douban.com/book/subject_search?search_text=" },
    { name: "当当",     icon: "🛍️", url: "https://search.dangdang.com/?key=" },
    { name: "京东图书", icon: "📚", url: "https://search.jd.com/Search?keyword=" },
    { name: "百度",     icon: "🔍", url: "https://www.baidu.com/s?wd=" }
  ]},
  { key: "movie", label: "电影",  platforms: [
    { name: "豆瓣", icon: "🎬", url: "https://www.douban.com/search?q=" },
    { name: "B站",  icon: "📺", url: "https://search.bilibili.com/all?keyword=" },
    { name: "百度", icon: "🔍", url: "https://www.baidu.com/s?wd=" }
  ]},
  { key: "anime", label: "番剧",  platforms: [
    { name: "B站",  icon: "📺", url: "https://search.bilibili.com/all?keyword=" },
    { name: "百度", icon: "🔍", url: "https://www.baidu.com/s?wd=" }
  ]},
  { key: "music", label: "音乐",  platforms: [
    { name: "网易云", icon: "🎵", url: "https://music.163.com/#/search/m/?s=" },
    { name: "QQ音乐", icon: "🎶", url: "https://y.qq.com/n/ryqq/search?w=" },
    { name: "B站",    icon: "📺", url: "https://search.bilibili.com/all?keyword=" },
    { name: "豆瓣",   icon: "🟢", url: "https://www.douban.com/search?q=" }
  ]}
];

const ICONS_VERSION = 4;
const DEFAULT_ICONS = [
  { id: "chat",      name: "聊天",     icon: "💬", action: "chat" },
  { id: "cards",     name: "字卡管理", icon: "🎴", action: "cards" },
  { id: "paper",     name: "论文",     icon: "📄", action: "paper" },
  { id: "tarot",     name: "塔罗",     icon: "🔮", action: "tarot" },
  { id: "moments",   name: "朋友圈",   icon: "🌿", action: "moments" },
  { id: "choice",    name: "抉择",     icon: "⚖️", action: "choice" },
  { id: "survey",    name: "问卷",     icon: "📋", action: "survey" },
  { id: "letters",   name: "信件",     icon: "✉️", action: "letters" },
  { id: "shopping",  name: "购物",     icon: "🛒", action: "shopping" },
  { id: "water",     name: "喝水",     icon: "💧", action: "water" },
  { id: "eat",       name: "吃什么",   icon: "🍽️", action: "eat" },
  { id: "checkin",   name: "查岗",     icon: "🔔", action: "checkin" },
  { id: "pomodoro",  name: "番茄钟",   icon: "🍅", action: "pomodoro" },
  { id: "search",    name: "搜索",     icon: "🔍", action: "search" },
  { id: "settings",  name: "设置",     icon: "⚙️", action: "settings" }
];

function renderDesktop() {
  const savedVer = store.get("iconsVersion", 1);
  if (!state.desktopIcons || !state.desktopIcons.length || savedVer !== ICONS_VERSION) {
    state.desktopIcons = JSON.parse(JSON.stringify(DEFAULT_ICONS));
    saveDesktopIcons();
    store.set("iconsVersion", ICONS_VERSION);
  }
  const pagesEl = document.getElementById("desktopPages");
  const dotsEl = document.getElementById("desktopDots");
  pagesEl.innerHTML = ""; dotsEl.innerHTML = "";
  const icons = state.desktopIcons;
  const perPage = 15;
  const pageCount = Math.max(1, Math.ceil(icons.length / perPage));
  for (let p = 0; p < pageCount; p++) {
    const page = document.createElement("div");
    page.className = "desktop-page";
    icons.slice(p * perPage, (p + 1) * perPage).forEach(ic => {
      const item = document.createElement("div");
      item.className = "desktop-item";
      item.innerHTML = `
        <div class="desktop-icon">${ic.icon && ic.icon.startsWith("data:") ? `<img src="${ic.icon}">` : esc(ic.icon || "📱")}</div>
        <div class="desktop-name">${esc(ic.name)}</div>`;
      item.addEventListener("click", () => {
        const map = {
          chat: openChat, cards: openCards, paper: openPaper, tarot: openTarot,
          moments: openMoments, choice: openChoice, survey: openSurvey,
          letters: openLetters, shopping: openShopping, water: openWater,
          eat: openEat, checkin: openCheckin, pomodoro: openPomodoro,
          music: openMusic, books: openBooks, search: openSearch, settings: openSettings
        };
        const fn = map[ic.action];
        if (fn) fn();
      });
      page.appendChild(item);
    });
    pagesEl.appendChild(page);
    const dot = document.createElement("div");
    dot.className = "dot" + (p === 0 ? " active" : "");
    dotsEl.appendChild(dot);
  }
  pagesEl.addEventListener("scroll", () => {
    const idx = Math.round(pagesEl.scrollLeft / pagesEl.clientWidth);
    dotsEl.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === idx));
  }, { passive: true });
}

function tickDesktopTime() {
  const d = nowBeijing();
  const t = document.getElementById("desktopTime");
  const dt = document.getElementById("desktopDate");
  if (t) t.textContent = fmtTime(d);
  if (dt) dt.textContent = `${d.getMonth()+1}/${d.getDate()}`;
}

/* ========== 聊天 ========== */
let currentQuote = null;

function openChat() {
  showScreen("chatApp");
  document.getElementById("chatTitle").textContent = state.settings.taName;
  renderMessages();
  applyAppearance();
}
function applyChatBackground() {
  const body = document.getElementById("chatBody");
  if (!body) return;
  if (state.settings.bgImage) {
    body.style.backgroundImage = `url(${state.settings.bgImage})`;
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center";
    body.style.backgroundColor = "transparent";
  } else {
    body.style.backgroundImage = "";
    body.style.backgroundColor = state.settings.bgColor;
  }
}
function renderMessages() {
  const body = document.getElementById("chatBody");
  body.innerHTML = "";
  if (state.messages.length === 0) {
    const sys = document.createElement("div");
    sys.className = "system";
    sys.innerHTML = `<span>发消息即可随机抽字卡</span>`;
    body.appendChild(sys);
  }
  state.messages.forEach(m => renderMessage(body, m));
  body.scrollTop = body.scrollHeight;
}
function renderMessage(body, m) {
  const wrapper = document.createElement("div");
  wrapper.id = "msg-" + m.id;
  if (m.type === "system") {
    wrapper.className = "system";
    wrapper.innerHTML = `<span>${esc(m.text)}</span>`;
    body.appendChild(wrapper); return;
  }
  if (m.type === "poke") {
    wrapper.className = "poke-tip";
    wrapper.innerHTML = `<span>${esc(m.text)}</span>`;
    body.appendChild(wrapper); return;
  }
  const row = document.createElement("div");
  row.className = "msg-row " + (m.from === "me" ? "me" : "bot");
  const avatar = document.createElement("div");
  avatar.className = "avatar " + (m.from === "me" ? "user" : "");
  const av = m.from === "me" ? state.settings.myAvatar : state.settings.taAvatar;
  if (av) avatar.innerHTML = `<img src="${av}">`;
  else avatar.textContent = m.from === "me" ? "我" : "TA";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  if (m.recalled) {
    bubble.classList.add("recalled");
    bubble.textContent = "撤回了一条消息（点击查看）";
    bubble.addEventListener("click", () => alert("撤回的内容是：\n\n" + (m.text || "[非文字]")));
    row.appendChild(avatar); row.appendChild(bubble);
    wrapper.appendChild(row); body.appendChild(wrapper); return;
  }
  let inner = "";
  if (m.quote) inner += `<div class="quote" data-quote="${m.quote.id}">${esc(m.quote.text)}</div>`;
  if (m.suggest) {
    const st = SUGGEST_TYPES.find(t => t.key === m.suggest.type) || SUGGEST_TYPES[0];
    inner += `<div style="font-size:16px;font-weight:600;margin-bottom:8px;">${esc(m.suggest.kw)} · ${esc(st.label)}推荐</div>`;
    inner += st.platforms.map((p, i) =>
      `<button class="suggest-btn" data-sg="${i}">${p.icon} ${p.name}</button>`
    ).join("");
  } else if (m.image) inner += `<img class="msg-img" src="${m.image}">`;
  else if (m.baiduImg) inner += `<div style="padding:8px;background:#f0f0f0;border-radius:6px;cursor:pointer;" class="baidu-img">🔗 点击查看百度图片：${esc(m.baiduImg)}</div>`;
  else if (m.isVoice) {
    bubble.classList.add("voice");
    inner += `<span class="wave">🔊</span><span class="dur">${m.voiceDur}"</span>`;
  } else if (m.words && m.words.length) {
    m.words.forEach((w, i) => {
      if (m.hiddenWords && m.hiddenWords.includes(i)) return;
      inner += `<span class="word-chip" data-wi="${i}">${esc(w)}</span>`;
    });
  } else inner += `<div>${esc(m.text)}</div>`;
  bubble.innerHTML = inner;
  if (m.time) {
    const t = document.createElement("div");
    t.className = "msg-time"; t.textContent = m.time;
    bubble.appendChild(t);
  }
  if (m.mood || m.intent) {
    const tag = document.createElement("div");
    tag.className = "msg-tag";
    let html = "";
    if (m.mood) html += `心情：${esc(m.mood)}`;
    if (m.intent) html += `${m.mood ? "<br>" : ""}意图：${esc(m.intent)}`;
    tag.innerHTML = html;
    bubble.appendChild(tag);
  }
  if (m.searchLink) {
    bubble.addEventListener("click", (e) => {
      if (e.target.classList.contains("search-link") || e.target.closest(".search-link")) {
        const p = m.searchLink.platform;
        window.open(p.url + encodeURIComponent(m.searchLink.kw), "_blank");
      }
    });
  }
  if (m.baiduImg) {
    bubble.addEventListener("click", (e) => {
      if (e.target.classList.contains("baidu-img") || e.target.closest(".baidu-img")) {
        window.open(`https://image.baidu.com/search?word=${encodeURIComponent(m.baiduImg)}`, "_blank");
      }
    });
  }
  if (m.isVoice) {
    bubble.addEventListener("click", (e) => {
      if (e.target.classList.contains("word-chip")) return;
      alert("语音内容：\n\n" + m.text);
    });
  }
  bubble.querySelectorAll(".quote").forEach(q => {
    q.addEventListener("click", (e) => {
      e.stopPropagation();
      const target = document.getElementById("msg-" + q.dataset.quote);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        const rowEl = target.querySelector(".msg-row") || target;
        rowEl.style.transition = "background 0.3s";
        rowEl.style.background = "rgba(255,235,59,0.4)";
        setTimeout(() => { rowEl.style.background = ""; }, 1200);
      }
    });
  });
  bubble.querySelectorAll(".suggest-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!m.suggest) return;
      const idx = Number(btn.dataset.sg);
      const st = SUGGEST_TYPES.find(t => t.key === m.suggest.type) || SUGGEST_TYPES[0];
      const p = st.platforms[idx];
      if (p) window.open(p.url + encodeURIComponent(m.suggest.kw), "_blank");
    });
  });
  bubble.querySelectorAll(".word-chip").forEach(chip => {
    chip.addEventListener("click", (e) => {
      if (m.from !== "me") return;
      if (confirm("撤回这个词？")) {
        const wi = Number(chip.dataset.wi);
        if (!m.hiddenWords) m.hiddenWords = [];
        if (!m.hiddenWords.includes(wi)) m.hiddenWords.push(wi);
        saveMessages(); renderMessages(); toast("已撤回该词");
      }
    });
  });
  bubble.addEventListener("contextmenu", e => {
    if (e.target.classList.contains("word-chip") || e.target.closest(".quote")) return;
    e.preventDefault(); openMsgMenu(m);
  });
  let pressTimer;
  bubble.addEventListener("touchstart", () => { pressTimer = setTimeout(() => openMsgMenu(m), 600); }, { passive: true });
  bubble.addEventListener("touchend", () => clearTimeout(pressTimer));
  bubble.addEventListener("touchmove", () => clearTimeout(pressTimer));
  row.appendChild(avatar); row.appendChild(bubble);
  wrapper.appendChild(row); body.appendChild(wrapper);
}
function openMsgMenu(m) {
  openModal("消息操作", () => {
    const wrap = document.createElement("div");
    const items = [];
    if (!m.recalled) {
      if (m.from === "me") {
        items.push({ label: "撤回整条", fn: () => { m.recalled = true; saveMessages(); renderMessages(); toast("已撤回"); } });
        if (m.mood) items.push({ label: "撤回心情", fn: () => { m.mood = null; saveMessages(); renderMessages(); toast("已撤回心情"); } });
        if (m.intent) items.push({ label: "撤回意图", fn: () => { m.intent = null; saveMessages(); renderMessages(); toast("已撤回意图"); } });
      } else {
        items.push({ label: "收藏", fn: () => {
          state.favoritesMine.push({ id: uid(), text: m.text, from: m.from, ts: Date.now(), time: fmtFull(nowBeijing()) });
          saveFavMine(); toast("已收藏");
        }});
      }
      items.push({ label: "引用", fn: () => { currentQuote = m; updateQuoteBar(); renderMessages(); toast("已引用"); } });
    }
    items.forEach(it => {
      const div = document.createElement("div");
      div.className = "menu-item"; div.textContent = it.label;
      div.addEventListener("click", () => { it.fn(); modal.classList.remove("open"); });
      wrap.appendChild(div);
    });
    return wrap;
  });
}
function updateQuoteBar() {
  let bar = document.getElementById("quoteBar");
  if (!currentQuote) { if (bar) bar.remove(); return; }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "quoteBar";
    bar.style.cssText = "padding:6px 12px;background:#f0f0f0;font-size:13px;color:#666;border-top:0.5px solid #ddd;display:flex;justify-content:space-between;align-items:center;";
    const inputbar = document.querySelector(".chat-inputbar");
    if (inputbar) inputbar.parentNode.insertBefore(bar, inputbar);
  }
  bar.innerHTML = `<span>引用：${esc(currentQuote.text).slice(0,30)}</span><button style="background:none;border:none;color:#888;cursor:pointer;">✕</button>`;
  bar.querySelector("button").addEventListener("click", () => { currentQuote = null; updateQuoteBar(); });
}
function getAllCards() {
  const list = [];
  state.cards.categories.forEach(cat => {
    if (cat.enabled === false) return;
    cat.cards.forEach(c => list.push(c.text));
  });
  return list;
}
function drawCard() { const l = getAllCards(); return l.length ? pick(l) : null; }
function drawMood() {
  const l = (state.cards.categories.find(c => c.name === "心情") || {}).cards || [];
  return l.length ? pick(l).text : null;
}
function drawIntent() {
  const l = (state.cards.categories.find(c => c.name === "意图") || {}).cards || [];
  return l.length ? pick(l).text : null;
}
function sendMessage(text, opts = {}) {
  if (!text && !opts.image && !opts.isVoice) return;
  const d = nowBeijing();
  const words = text ? text.split(/\s+/).filter(Boolean) : null;
  const msg = {
    id: uid(), from: "me",
    text: text || (opts.image ? "[图片]" : ""),
    words: words && words.length > 1 ? words : null,
    time: fmtTime(d), ts: d.getTime(),
    isCard: false, image: opts.image || null,
    isVoice: opts.isVoice || false,
    voiceDur: opts.voiceDur || 0,
    quote: currentQuote ? { id: currentQuote.id, text: currentQuote.text, from: currentQuote.from } : null
  };
  state.messages.push(msg);
  saveMessages();
  currentQuote = null; updateQuoteBar();
  renderMessages();
  setTimeout(taReply, rand(state.settings.replyDelayMin * 1000, state.settings.replyDelayMax * 1000));
}
function taReply() {
  const body = document.getElementById("chatBody");
  if (Math.random() * 100 < state.settings.readNoReplyProb) return;
  const typing = document.createElement("div");
  typing.className = "typing"; typing.textContent = "对方正在输入…";
  body.appendChild(typing);
  body.scrollTop = body.scrollHeight;
  setTimeout(() => {
    typing.remove();
    if (Math.random() * 100 < (state.settings.suggestProb || 0)) {
      if (taSuggest()) return;
    }
    const card = drawCard();
    if (!card) { addBotMessage("（字卡库是空的，去字卡管理加几张吧）"); return; }
    const r = Math.random() * 100;
    const voiceP = state.settings.voiceProb || 0;
    const imgP = state.settings.imgProb || 0;
    const moodP = state.settings.moodProb || 0;
    const intentP = state.settings.intentProb || 0;
    const opts = {
      isCard: true,
      mood: Math.random() * 100 < moodP ? drawMood() : null,
      intent: Math.random() * 100 < intentP ? drawIntent() : null
    };
    const searchP = state.settings.searchLinkProb || 0;
    if (r < searchP) {
      const kwFixed = card.split(/\s+/)[0].slice(0, 10);
      const platform = SEARCH_PLATFORMS[Math.floor(Math.random() * SEARCH_PLATFORMS.length)];
      addBotMessage("", { ...opts, searchLink: { kw: kwFixed, platform } });
    } else if (r < searchP + imgP) {
      const kwFixed = card.split(/\s+/)[0].slice(0, 10);
      addBotMessage("", { ...opts, baiduImg: kwFixed });
    } else if (r < searchP + imgP + voiceP) {
      const dur = rand(1, 15);
      addBotMessage(card, { ...opts, isVoice: true, voiceDur: dur });
    } else {
      const words = card.split(/\s+/).filter(Boolean);
      addBotMessage(card, { ...opts, words: words.length > 1 ? words : null });
    }
  }, rand(800, 1800));
}
function addBotMessage(text, opts = {}) {
  const d = nowBeijing();
  const msg = {
    id: uid(), from: "ta", text,
    time: fmtTime(d), ts: d.getTime(),
    isCard: !!opts.isCard,
    mood: opts.mood || null, intent: opts.intent || null,
    isVoice: opts.isVoice || false, voiceDur: opts.voiceDur || 0,
        baiduImg: opts.baiduImg || null,
    searchLink: opts.searchLink || null,
    suggest: opts.suggest || null,
    words: opts.words || null
  };
  state.messages.push(msg);
  saveMessages(); renderMessages();
  showNotification(msg);
}
function showNotification(msg) {
  const chatScreen = document.getElementById("chatApp");
  if (chatScreen && chatScreen.classList.contains("active")) return;
  const n = document.createElement("div");
  n.style.cssText = "position:fixed;top:calc(8px + env(safe-area-inset-top));left:50%;transform:translateX(-50%) translateY(-120%);background:rgba(255,255,255,0.97);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.15);padding:10px 14px;display:flex;align-items:center;gap:10px;max-width:90%;min-width:240px;z-index:9999;transition:transform 0.3s ease;cursor:pointer;";
  const av = state.settings.taAvatar
    ? `<img src="${state.settings.taAvatar}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0;">`
    : `<div style="width:36px;height:36px;border-radius:6px;background:#07c160;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">TA</div>`;
  n.innerHTML = `${av}<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;color:#333;margin-bottom:2px;">${esc(state.settings.taName)}</div><div style="font-size:13px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(msg.text || "[消息]").slice(0, 40)}</div></div>`;
  document.body.appendChild(n);
  requestAnimationFrame(() => { n.style.transform = "translateX(-50%) translateY(0)"; });
  n.addEventListener("click", () => { openChat(); n.remove(); });
  setTimeout(() => {
    n.style.transform = "translateX(-50%) translateY(-120%)";
    setTimeout(() => n.remove(), 400);
  }, 3000);
}
function initInputBar() {
  const input = document.getElementById("chatInput");
  const send = document.getElementById("sendBtn");
  input.addEventListener("input", () => { send.disabled = !input.value.trim(); });
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const v = input.value.trim();
      if (v) { input.value = ""; send.disabled = true; sendMessage(v); }
    }
  });
  send.addEventListener("click", () => {
    const v = input.value.trim();
    if (!v) return;
    input.value = ""; send.disabled = true; sendMessage(v);
  });
  document.getElementById("imgBtn").addEventListener("click", () => document.getElementById("imgFile").click());
  document.getElementById("imgFile").addEventListener("change", async () => {
    const f = document.getElementById("imgFile").files[0];
    if (!f) return;
    const data = await compressImage(f, 1000, 0.8);
    sendMessage("", { image: data });
    document.getElementById("imgFile").value = "";
  });
  document.getElementById("emojiBtn").addEventListener("click", () => {
    openModal("表情包", () => {
      const wrap = document.createElement("div");
      wrap.innerHTML = `<div class="row"><input class="input" id="emojiInput" placeholder="emoji 或文字"><button class="btn" id="emojiAddBtn">添加</button></div><div class="row"><input type="file" id="emojiFile" accept="image/*" hidden><button class="btn secondary" id="emojiImgBtn" style="width:100%">上传图片</button></div><div id="emojiList"></div>`;
      const list = wrap.querySelector("#emojiList");
      function render() {
        list.innerHTML = "";
        if (!state.emojis.length) { list.innerHTML = `<div class="empty">还没有表情</div>`; return; }
        state.emojis.forEach((e, i) => {
          const item = document.createElement("div");
          item.className = "list-item";
          const isImg = e.startsWith("data:");
          item.innerHTML = `<div class="name" style="font-size:${isImg ? "0" : "22px"};">${isImg ? `<img src="${e}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">` : esc(e)}</div><div class="actions"><button data-send>发送</button><button class="danger" data-del>删除</button></div>`;
          item.querySelector("[data-send]").addEventListener("click", () => {
            if (isImg) sendMessage("", { image: e }); else sendMessage(e);
            modal.classList.remove("open");
          });
          item.querySelector("[data-del]").addEventListener("click", () => { state.emojis.splice(i, 1); saveEmojis(); render(); });
          list.appendChild(item);
        });
      }
      render();
      wrap.querySelector("#emojiAddBtn").addEventListener("click", () => {
        const v = wrap.querySelector("#emojiInput").value.trim();
        if (!v) return;
        state.emojis.push(v); saveEmojis(); wrap.querySelector("#emojiInput").value = ""; render();
      });
      wrap.querySelector("#emojiImgBtn").addEventListener("click", () => wrap.querySelector("#emojiFile").click());
      wrap.querySelector("#emojiFile").addEventListener("change", async () => {
        const f = wrap.querySelector("#emojiFile").files[0];
        if (!f) return;
        const data = await compressImage(f, 300, 0.8);
        state.emojis.push(data); saveEmojis(); render();
      });
      return wrap;
    });
  });
  document.getElementById("voiceBtn").addEventListener("click", () => {
    openModal("发送语音", () => {
      const wrap = document.createElement("div");
      wrap.innerHTML = `<div class="row"><input class="input" id="voiceText" placeholder="语音内容"></div><div class="row"><input class="input" id="voiceDurInput" type="number" value="5"></div><button class="btn" id="voiceSendBtn" style="width:100%">发送</button>`;
      wrap.querySelector("#voiceSendBtn").addEventListener("click", () => {
        const t = wrap.querySelector("#voiceText").value.trim();
        const d = Number(wrap.querySelector("#voiceDurInput").value) || 5;
        if (!t) return;
        sendMessage(t, { isVoice: true, voiceDur: d });
        modal.classList.remove("open");
      });
      return wrap;
    });
  });
}
document.getElementById("chatMenuBtn").addEventListener("click", () => {
  document.getElementById("chatMenuModal").classList.add("open");
});
document.getElementById("chatMenuClose").addEventListener("click", () => {
  document.getElementById("chatMenuModal").classList.remove("open");
});
document.querySelectorAll("#chatMenuModal .menu-item").forEach(item => {
  item.addEventListener("click", () => {
    const action = item.dataset.action;
    document.getElementById("chatMenuModal").classList.remove("open");
    if (action === "search") doSearch();
    if (action === "fav") showFavorites();
    if (action === "poke") doPoke();
    if (action === "call") doCall();
  });
});
function doSearch() {
  openModal("搜索聊天记录", () => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="row"><input class="input" id="searchKw" placeholder="关键词（可空）"></div><div class="row"><input class="input" type="date" id="searchDate"></div><button class="btn" id="searchBtn" style="width:100%">搜索</button><div id="searchResults" style="margin-top:12px;"></div>`;
    const results = wrap.querySelector("#searchResults");
    wrap.querySelector("#searchBtn").addEventListener("click", () => {
      const kw = wrap.querySelector("#searchKw").value.trim();
      const dateStr = wrap.querySelector("#searchDate").value;
      let hits = state.messages.filter(m => m.text && !m.recalled);
      if (kw) hits = hits.filter(m => m.text.includes(kw));
      if (dateStr) hits = hits.filter(m => fmtDate(new Date(m.ts)) === dateStr);
      results.innerHTML = "";
      if (!hits.length) { results.innerHTML = `<div class="empty">没找到</div>`; return; }
      hits.forEach(m => {
        const item = document.createElement("div");
        item.className = "list-item"; item.style.cursor = "pointer";
        item.innerHTML = `<div class="name">${m.from === "me" ? "我" : esc(state.settings.taName)}：${esc(m.text)}<br><span style="font-size:12px;color:#999;">${m.time || ""}</span></div>`;
        item.addEventListener("click", () => {
          modal.classList.remove("open");
          setTimeout(() => {
            const target = document.getElementById("msg-" + m.id);
            if (target) {
              target.scrollIntoView({ behavior: "smooth", block: "center" });
              const rowEl = target.querySelector(".msg-row") || target;
              rowEl.style.transition = "background 0.3s";
              rowEl.style.background = "rgba(255,235,59,0.4)";
              setTimeout(() => { rowEl.style.background = ""; }, 1200);
            }
          }, 200);
        });
        results.appendChild(item);
      });
    });
    return wrap;
  });
}
function showFavorites() {
  openModal("收藏", () => {
    const wrap = document.createElement("div");
    let currentTab = "mine";
    wrap.innerHTML = `<div class="fav-tabs"><div class="fav-tab active" data-tab="mine">我的收藏</div><div class="fav-tab" data-tab="ta">TA的收藏</div></div><div id="favList"></div>`;
    const list = wrap.querySelector("#favList");
    function render() {
      const arr = currentTab === "mine" ? state.favoritesMine : state.favoritesTa;
      list.innerHTML = "";
      if (!arr.length) { list.innerHTML = `<div class="empty">还没有收藏</div>`; return; }
      arr.forEach((f, i) => {
        const item = document.createElement("div");
        item.className = "fav-item";
        item.innerHTML = `<div class="fav-text">${esc(f.text)}</div><div class="fav-time">${f.from === "me" ? "我" : "TA"} · ${f.time}</div><div class="actions" style="margin-top:6px;"><button class="danger" data-del>删除</button></div>`;
        item.querySelector("[data-del]").addEventListener("click", () => {
          if (currentTab === "mine") { state.favoritesMine.splice(i, 1); saveFavMine(); }
          else { state.favoritesTa.splice(i, 1); saveFavTa(); }
          render();
        });
        list.appendChild(item);
      });
    }
    render();
    wrap.querySelectorAll(".fav-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        currentTab = tab.dataset.tab;
        wrap.querySelectorAll(".fav-tab").forEach(t => t.classList.toggle("active", t === tab));
        render();
      });
    });
    return wrap;
  });
}
function doPoke() {
  openModal("拍一拍", () => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="row"><input class="input" id="pokeQuickAdd" placeholder="新增文案，回车添加"></div>
      <div id="pokePickList"></div>
    `;
    const list = wrap.querySelector("#pokePickList");
    function renderList() {
      list.innerHTML = "";
      if (!state.pokeTexts.length) {
        list.innerHTML = `<div class="empty">还没有文案，上面加一条</div>`;
        return;
      }
      state.pokeTexts.forEach((t, i) => {
        const item = document.createElement("div");
        item.className = "list-item";
        item.innerHTML = `<div class="name" style="cursor:pointer;">${esc(t)}</div><div class="actions"><button class="danger" data-del>删除</button></div>`;
        item.querySelector(".name").addEventListener("click", () => {
          modal.classList.remove("open");
          performPoke(t);
        });
        item.querySelector("[data-del]").addEventListener("click", () => {
          state.pokeTexts.splice(i, 1);
          savePokeTexts();
          renderList();
        });
        list.appendChild(item);
      });
    }
    renderList();
    const inp = wrap.querySelector("#pokeQuickAdd");
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const v = inp.value.trim();
        if (!v) return;
        state.pokeTexts.push(v);
        savePokeTexts();
        inp.value = "";
        renderList();
      }
    });
    return wrap;
  });
}

function performPoke(pokeText) {
  state.messages.push({ id: uid(), type: "poke", text: `我${pokeText}`, ts: Date.now() });
  saveMessages(); renderMessages();
  if (Math.random() * 100 < state.settings.pokeBackProb) {
    setTimeout(() => {
      const backText = pick(state.pokeTexts) || "拍了拍";
      state.messages.push({ id: uid(), type: "poke", text: `${state.settings.taName}${backText}`, ts: Date.now() });
      saveMessages(); renderMessages();
      if (Math.random() * 100 < state.settings.pokeCardProb) {
        setTimeout(() => {
          const card = drawCard();
          if (card) addBotMessage(card, { isCard: true, mood: drawMood(), intent: drawIntent() });
        }, 800);
      }
    }, 1500);
  }
}
let callTimerId = null, callStartTs = 0;
function doCall() {
  if (Math.random() * 100 < state.settings.callRejectProb) {
    state.messages.push({ id: uid(), type: "system", text: `对方已拒绝通话`, ts: Date.now() });
    saveMessages(); renderMessages(); toast("对方已拒绝");
    return;
  }
  document.getElementById("callName").textContent = state.settings.taName;
  const av = document.getElementById("callAvatar");
  if (state.settings.taAvatar) av.innerHTML = `<img src="${state.settings.taAvatar}">`;
  else av.textContent = "TA";
  document.getElementById("callTimer").textContent = "00:00:00";
  showScreen("callScreen");
  callStartTs = Date.now();
  callTimerId = setInterval(updateCallTimer, 1000);
}
function updateCallTimer() {
  const el = document.getElementById("callTimer");
  if (!el) return;
  const s = Math.floor((Date.now() - callStartTs) / 1000);
  el.textContent = `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}
document.getElementById("hangupBtn").addEventListener("click", () => {
  clearInterval(callTimerId);
  const s = Math.floor((Date.now() - callStartTs) / 1000);
  state.messages.push({ id: uid(), type: "system", text: `通话结束 · 时长 ${Math.floor(s/60)}分${s%60}秒`, ts: Date.now() });
  saveMessages(); showScreen("chatApp"); renderMessages();
});

/* ========== 字卡管理 ========== */
let batchMode = false;
let selectedCards = new Set();
function openCards() {
  showScreen("cardsApp");
  batchMode = false; selectedCards.clear();
  document.getElementById("batchBar").style.display = "none";
  renderCardsPage();
}
document.getElementById("batchToggleBtn").addEventListener("click", () => {
  batchMode = !batchMode; selectedCards.clear();
  document.getElementById("batchBar").style.display = batchMode ? "flex" : "none";
  updateBatchCount(); renderCardsPage();
});
function updateBatchCount() { document.getElementById("batchCount").textContent = selectedCards.size; }
function renderCardsPage() {
  const body = document.getElementById("cardsBody");
  body.innerHTML = "";
  if (state.cards.categories.length === 0) {
    body.innerHTML = `<div class="empty">还没有分类，点右上角“+ 分类”新建</div>`;
    return;
  }
  state.cards.categories.forEach(cat => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `<div class="name">${esc(cat.name)}<span style="color:#999;font-size:13px;">（${cat.cards.length} 张）</span></div><div class="actions"><button data-toggle>${cat.enabled === false ? "启用" : "停用"}</button><button data-open>打开</button><button class="danger" data-del>删除</button></div>`;
    div.querySelector("[data-toggle]").addEventListener("click", () => { cat.enabled = cat.enabled === false ? true : false; saveCards(); renderCardsPage(); });
    div.querySelector("[data-open]").addEventListener("click", () => openCategory(cat.id));
    div.querySelector("[data-del]").addEventListener("click", () => {
      if (confirm(`删除分类「${cat.name}」？`)) {
        state.cards.categories = state.cards.categories.filter(c => c.id !== cat.id);
        saveCards(); renderCardsPage();
      }
    });
    body.appendChild(div);
    if (batchMode) {
      cat.cards.forEach(c => {
        const item = document.createElement("div");
        item.className = "list-item"; item.style.paddingLeft = "30px";
        const checked = selectedCards.has(c.id) ? "checked" : "";
        item.innerHTML = `<div class="name" style="display:flex;align-items:center;"><input type="checkbox" class="card-check" ${checked} data-id="${c.id}">${esc(c.text)}</div>`;
        item.querySelector("input").addEventListener("change", e => {
          if (e.target.checked) selectedCards.add(c.id); else selectedCards.delete(c.id);
          updateBatchCount();
        });
        body.appendChild(item);
      });
    }
  });
}
document.getElementById("selectAllBtn").addEventListener("click", () => {
  const all = [];
  state.cards.categories.forEach(cat => cat.cards.forEach(c => all.push(c.id)));
  if (selectedCards.size === all.length) selectedCards.clear();
  else all.forEach(id => selectedCards.add(id));
  updateBatchCount(); renderCardsPage();
});
document.getElementById("batchCancelBtn").addEventListener("click", () => {
  batchMode = false; selectedCards.clear();
  document.getElementById("batchBar").style.display = "none";
  renderCardsPage();
});
document.getElementById("batchDelBtn").addEventListener("click", () => {
  if (!selectedCards.size) return alert("还没选");
  if (!confirm(`删除选中的 ${selectedCards.size} 张？`)) return;
  state.cards.categories.forEach(cat => { cat.cards = cat.cards.filter(c => !selectedCards.has(c.id)); });
  selectedCards.clear(); saveCards(); updateBatchCount(); renderCardsPage();
});
document.getElementById("batchMoveBtn").addEventListener("click", () => {
  if (!selectedCards.size) return alert("还没选");
  const names = state.cards.categories.map(c => c.name).join(" / ");
  const target = prompt(`移动到哪个分类？\n可选：${names}`);
  if (!target) return;
  const cat = state.cards.categories.find(c => c.name === target);
  if (!cat) return alert("没找到这个分类");
  const moved = [];
  state.cards.categories.forEach(c => {
    c.cards = c.cards.filter(card => {
      if (selectedCards.has(card.id)) { moved.push(card); return false; }
      return true;
    });
  });
  moved.forEach(card => cat.cards.push(card));
  selectedCards.clear(); saveCards(); updateBatchCount(); renderCardsPage();
});
document.getElementById("batchExportBtn").addEventListener("click", () => {
  if (!selectedCards.size) return alert("还没选");
  const out = [];
  state.cards.categories.forEach(cat => cat.cards.forEach(c => { if (selectedCards.has(c.id)) out.push(c.text); }));
  const blob = new Blob([out.join("\n")], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "字卡导出.txt"; a.click();
});
function openCategory(catId) {
  const cat = state.cards.categories.find(c => c.id === catId);
  if (!cat) return;
  openModal(`分类：${cat.name}`, () => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="row"><input class="input" id="newCardInput" placeholder="输入字卡内容，回车添加"><button class="btn" id="addCardBtn">添加</button></div><div class="row"><button class="btn secondary" id="batchBtn" style="width:100%">批量添加（一行一张）</button></div><div id="cardList"></div>`;
    const list = wrap.querySelector("#cardList");
    function renderList() {
      list.innerHTML = "";
      if (!cat.cards.length) { list.innerHTML = `<div class="empty">还没有字卡</div>`; return; }
      cat.cards.forEach((c, i) => {
        const item = document.createElement("div");
        item.className = "list-item";
        item.innerHTML = `<div class="name">${esc(c.text)}</div><div class="actions"><button data-edit>编辑</button><button class="danger" data-del>删除</button></div>`;
        item.querySelector("[data-edit]").addEventListener("click", () => {
          const v = prompt("编辑字卡内容：", c.text);
          if (v === null) return;
          c.text = v.trim(); saveCards(); renderList(); toast("已保存");
        });
        item.querySelector("[data-del]").addEventListener("click", () => { cat.cards.splice(i, 1); saveCards(); renderList(); });
        list.appendChild(item);
      });
    }
    renderList();
    const inp = wrap.querySelector("#newCardInput");
    function addOne() {
      const v = inp.value.trim(); if (!v) return;
      cat.cards.push({ id: uid(), text: v });
      saveCards(); inp.value = ""; renderList(); inp.focus();
    }
    wrap.querySelector("#addCardBtn").addEventListener("click", addOne);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") addOne(); });
    wrap.querySelector("#batchBtn").addEventListener("click", () => {
      const text = prompt("批量添加：每行一张");
      if (!text) return;
      text.split("\n").map(s => s.trim()).filter(Boolean).forEach(t => {
        cat.cards.push({ id: uid(), text: t });
      });
      saveCards(); renderList();
    });
    return wrap;
  });
}
document.getElementById("newCatBtn").addEventListener("click", () => {
  const name = prompt("分类名称");
  if (!name) return;
  state.cards.categories.push({ id: uid(), name: name.trim(), enabled: true, cards: [] });
  saveCards(); renderCardsPage();
});

/* ========== 论文摘要 ========== */
const PAPER_WORDS = {
  philosophy: ["存在","本体","现象","先验","辩证","扬弃","异化","主体","客体","自在","自为","绝对精神","虚无","荒谬","权力意志","永恒轮回","此在","在世存在","操心","向死而生","逻各斯","理念","实体","属性","因果","必然","偶然","自由","实践","理性","感性","知性","直观","反思","批判","启蒙","救赎","超越","内在","先验统觉","物自体","现象学","存在主义","结构主义","解构","差异","重复","事件","真理","意义"],
  psychology: ["潜意识","投射","防御机制","依恋","移情","阻抗","自我","本我","超我","认知失调","条件反射","安全基地","内在客体","分离焦虑","俄狄浦斯","集体无意识","原型","阴影","自性","共情","压抑","升华","合理化","退行","认同","内化","客体关系","依恋类型","安全型","回避型","焦虑型","混乱型","创伤","解离","正念","接纳","承诺","价值","行为激活","认知重构","暴露","系统脱敏","催眠","暗示","群体心理","从众","服从","旁观者效应","刻板印象","归因"],
  sociology: ["结构","异化","规训","场域","惯习","资本","阶层","权力","话语","再生产","合法性","失范","原子化","内卷","区隔","象征暴力","文化资本","社会资本","经济资本","社会事实","角色","越轨","标签","偏差","控制","整合","分化","流动","网络","组织","制度","规范","价值","信仰","仪式","家庭","教育","阶级","性别","种族","城乡","全球化","现代性","后现代","风险社会","消费社会","景观社会","公共领域","市民社会","治理"],
  literature: ["能指","所指","互文","解构","叙事","视角","隐喻","转喻","象征","原型","陌生化","复调","狂欢","延异","踪迹","文本","作者之死","期待视野","隐含读者","张力","反讽","悖论","含混","细读","新批评","结构主义叙事","功能","序列","行动元","符号","编码","解码","意识形态","霸权","协商","抵抗","大众文化","文化研究","后殖民","女性主义","酷儿","生态批评","数字人文","超文本","互媒","改编","戏仿","拼贴","元叙事","崇高"],
  physics: ["熵","场","量子","相对","波函数","坍缩","纠缠","时空","引力","能量","守恒","对称","破缺","观测","不确定","叠加","退相干","奇点","维度","真空","粒子","波动","干涉","衍射","偏振","自旋","隧穿","测不准","互补","对应","临界","相变","耗散","混沌","分形","复杂","涌现","信息","比特","熵增","热力学","统计","系综","路径积分","规范","重整化","对称破缺","暗物质","暗能量","统一场"],
  mysticism: ["能量","频率","共振","业力","脉轮","直觉","显化","共时性","场域","结界","灵性","扬升","暗夜","原型","符号","仪式","召唤","守护","轮回","虚空","冥想","觉察","临在","内在小孩","高我","灵魂","转世","因果","宿命","自由意志","占卜","塔罗","星盘","星座","五行","阴阳","八卦","风水","气场","灵摆","水晶","精油","颂钵","音叉","灵性逃避","灵性危机","整合","接地","净化","祝福"],
  medicine: ["血压","心率","炎症","代谢","免疫","神经","内分泌","激素","血糖","血脂","睡眠","疲劳","压力","呼吸","消化","循环","肌肉","关节","恢复","调节","细胞","组织","器官","系统","感染","过敏","疼痛","发热","咳嗽","头痛","失眠","焦虑","抑郁","肥胖","营养不良","维生素","矿物质","蛋白质","脂肪","碳水","膳食纤维","肠道菌群","益生菌","抗氧化","自由基","慢性病","急性","预后","康复","预防"]
};
const PAPER_TEMPLATES = [
  (a,b,c,d) => `本文以${a}为切入点，通过${b}的视角，探讨了${c}对${d}的影响。`,
  (a,b,c,d) => `基于${a}理论，本研究分析了${b}在${c}中的表现，认为${d}是关键变量。`,
  (a,b,c,d) => `研究发现，${a}通过${b}机制，导致了${c}，这为理解${d}提供了新视角。`,
  (a,b,c,d) => `从${a}到${b}，${c}的演变揭示了${d}的深层结构。`
];
function generatePaper() {
  const all = [];
  Object.values(PAPER_WORDS).forEach(arr => arr.forEach(w => all.push(w)));
  const shuffled = all.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 4);
  const tpl = PAPER_TEMPLATES[Math.floor(Math.random() * PAPER_TEMPLATES.length)];
  return tpl(...picked);
}
function openPaper() {
  showScreen("paperApp");
  const body = document.getElementById("paperBody");
  body.innerHTML = `<div class="paper-box"><div class="paper-tag">论文摘要生成器</div><div class="paper-result" id="paperResult">点下方按钮生成一句摘要</div><button class="paper-btn" id="paperGenBtn">生成</button></div>`;
  document.getElementById("paperGenBtn").addEventListener("click", () => {
    document.getElementById("paperResult").textContent = generatePaper();
  });
}

/* ========== 塔罗 ========== */
const TAROT_CARDS = [
  "愚者","魔术师","女祭司","女皇","皇帝","教皇","恋人","战车","力量","隐士","命运之轮","正义","倒吊人","死神","节制","恶魔","塔","星星","月亮","太阳","审判","世界",
  "权杖Ace","权杖2","权杖3","权杖4","权杖5","权杖6","权杖7","权杖8","权杖9","权杖10","权杖侍从","权杖骑士","权杖王后","权杖国王",
  "圣杯Ace","圣杯2","圣杯3","圣杯4","圣杯5","圣杯6","圣杯7","圣杯8","圣杯9","圣杯10","圣杯侍从","圣杯骑士","圣杯王后","圣杯国王",
  "宝剑Ace","宝剑2","宝剑3","宝剑4","宝剑5","宝剑6","宝剑7","宝剑8","宝剑9","宝剑10","宝剑侍从","宝剑骑士","宝剑王后","宝剑国王",
  "星币Ace","星币2","星币3","星币4","星币5","星币6","星币7","星币8","星币9","星币10","星币侍从","星币骑士","星币王后","星币国王"
];
function openTarot() {
  showScreen("tarotApp");
  const body = document.getElementById("tarotBody");
  body.innerHTML = `<div class="tarot-box"><button class="paper-btn" id="tarotDrawBtn">抽 3 张塔罗</button><div class="tarot-cards" id="tarotCards"></div></div>`;
  document.getElementById("tarotDrawBtn").addEventListener("click", drawTarot);
}
function drawTarot() {
  const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3).map(name => ({ name, reversed: Math.random() < 0.5 }));
  const wrap = document.getElementById("tarotCards");
  wrap.innerHTML = "";
  picked.forEach(c => {
    const el = document.createElement("div");
    el.className = "tarot-card";
    el.innerHTML = `<div style="font-size:24px;">🂠</div><div class="card-pos">点击翻开</div>`;
    el.addEventListener("click", () => {
      if (el.classList.contains("flipped")) return;
      el.classList.add("flipped");
      if (c.reversed) el.classList.add("reversed");
      el.innerHTML = `<div class="card-name">${esc(c.name)}</div><div class="card-pos">${c.reversed ? "逆位" : "正位"}</div>`;
    });
    wrap.appendChild(el);
  });
  document.getElementById("tarotDrawBtn").textContent = "重新抽 3 张";
}

/* ========== 朋友圈 ========== */
function openMoments() {
  showScreen("momentsApp");
  renderMoments();
  if (Math.random() * 100 < state.settings.taMomentsProb) {
    setTimeout(taPostMoment, 1500);
  }
}
function renderMoments() {
  const body = document.getElementById("momentsBody");
  body.innerHTML = "";
  if (!state.moments.length) {
    body.innerHTML = `<div class="empty">还没有动态，点右上角“+ 发动态”</div>`;
    return;
  }
  [...state.moments].reverse().forEach((m) => {
    const post = document.createElement("div");
    post.className = "moment-post";
    const av = m.from === "me"
      ? (state.settings.myAvatar ? `<img src="${state.settings.myAvatar}">` : "我")
      : (state.settings.taAvatar ? `<img src="${state.settings.taAvatar}">` : "TA");
    const comments = m.comments || [];
    let commentsHtml = "";
    if (comments.length) {
      commentsHtml = `<div class="moment-comments">` + comments.map(c =>
        `<div class="moment-comment"><span class="mc-name">${esc(c.from === "me" ? state.settings.myName : state.settings.taName)}：</span>${esc(c.text)}</div>`
      ).join("") + `</div>`;
    }
    post.innerHTML = `
      <div class="moment-head">
        <div class="avatar">${av}</div>
        <div>
          <div class="moment-name">${esc(m.from === "me" ? state.settings.myName : state.settings.taName)}</div>
          <div class="moment-time">${esc(m.time)}</div>
        </div>
      </div>
      <div class="moment-content">${esc(m.text)}</div>
      ${m.image ? `<img class="moment-img" src="${m.image}">` : ""}
      ${commentsHtml}
      <div class="moment-actions">
        <span data-like>${m.liked ? "❤️ 已赞" : "🤍 赞"}${m.likes ? ` (${m.likes})` : ""}</span>
        <span data-comment>💬 评论</span>
        ${m.from === "ta" ? `<span data-collect>⭐ 收藏</span>` : ""}
        <span data-del style="margin-left:auto;color:#fa5151;">删除</span>
      </div>
    `;
    post.querySelector("[data-like]").addEventListener("click", () => {
      m.liked = !m.liked;
      m.likes = (m.likes || 0) + (m.liked ? 1 : -1);
      if (m.likes < 0) m.likes = 0;
      saveMoments(); renderMoments();
    });
    post.querySelector("[data-comment]").addEventListener("click", () => {
      const v = prompt("评论：");
      if (!v) return;
      if (!m.comments) m.comments = [];
      m.comments.push({ from: "me", text: v.trim(), time: fmtFull(nowBeijing()) });
      saveMoments(); renderMoments();
    });
    const collectBtn = post.querySelector("[data-collect]");
    if (collectBtn) collectBtn.addEventListener("click", () => {
      state.favoritesMine.push({ id: uid(), text: m.text, from: "ta", ts: Date.now(), time: fmtFull(nowBeijing()) });
      saveFavMine(); toast("已收藏");
    });
    post.querySelector("[data-del]").addEventListener("click", () => {
      if (!confirm("删除这条动态？")) return;
      state.moments = state.moments.filter(x => x.id !== m.id);
      saveMoments(); renderMoments();
    });
    body.appendChild(post);
  });
}
function taPostMoment() {
  const card = drawCard();
  if (!card) return;
  const newMoment = {
    id: uid(),
    from: "ta",
    text: card,
    time: fmtFull(nowBeijing()),
    likes: 0, liked: false,
    comments: []
  };
  state.moments.push(newMoment);
  saveMoments();
  const mScreen = document.getElementById("momentsApp");
  if (mScreen && mScreen.classList.contains("active")) renderMoments();
  toast(`${state.settings.taName} 发了一条动态`);
}
function taCommentMoment(moment) {
  if (Math.random() * 100 < state.settings.taCommentProb) {
    const card = drawCard();
    if (!card) return;
    if (!moment.comments) moment.comments = [];
    moment.comments.push({ from: "ta", text: card, time: fmtFull(nowBeijing()) });
    saveMoments();
    const mScreen = document.getElementById("momentsApp");
    if (mScreen && mScreen.classList.contains("active")) renderMoments();
    toast(`${state.settings.taName} 评论了你的动态`);
  }
}
document.getElementById("momentsNewBtn").addEventListener("click", () => {
  openModal("发动态", () => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="row"><textarea class="input" id="momentText" style="height:80px;padding:8px;font-family:inherit;resize:vertical;" placeholder="这一刻的想法…"></textarea></div>
      <div class="row"><input type="file" id="momentImg" accept="image/*" hidden><button class="btn secondary" id="momentImgBtn" style="width:100%">添加图片</button></div>
      <div id="momentImgPreview"></div>
      <button class="btn" id="momentPostBtn" style="width:100%;margin-top:10px;">发表</button>
    `;
    let imgData = null;
    wrap.querySelector("#momentImgBtn").addEventListener("click", () => wrap.querySelector("#momentImg").click());
    wrap.querySelector("#momentImg").addEventListener("change", async () => {
      const f = wrap.querySelector("#momentImg").files[0];
      if (!f) return;
      imgData = await compressImage(f, 800, 0.8);
      wrap.querySelector("#momentImgPreview").innerHTML = `<img src="${imgData}" style="max-width:100%;border-radius:8px;margin-top:8px;">`;
    });
    wrap.querySelector("#momentPostBtn").addEventListener("click", () => {
      const text = wrap.querySelector("#momentText").value.trim();
      if (!text && !imgData) return alert("写点什么或者加张图吧");
      const newMoment = {
        id: uid(), from: "me", text: text || "[图片]",
        image: imgData,
        time: fmtFull(nowBeijing()),
        likes: 0, liked: false,
        comments: []
      };
      state.moments.push(newMoment);
      saveMoments(); modal.classList.remove("open"); renderMoments();
      setTimeout(() => taCommentMoment(newMoment), rand(2000, 5000));
    });
    return wrap;
  });
});

/* ========== 抉择 ========== */
function openChoice() {
  showScreen("choiceApp");
  renderChoice();
}
function renderChoice() {
  const body = document.getElementById("choiceBody");
  body.innerHTML = `
    <div class="paper-box">
      <div class="row"><input class="input" id="choiceInput" placeholder="输入选项，回车添加"></div>
      <div class="row"><button class="btn secondary" id="choiceAddBtn" style="width:100%">添加选项</button></div>
      <div id="choiceList" style="margin-bottom:12px;"></div>
      <div class="row">
        <button class="btn" id="choiceSelfBtn" style="flex:1">我自己选</button>
        <button class="btn" id="choiceTaBtn" style="flex:1;background:#576b95;">让 TA 选</button>
      </div>
      <div id="choicePickArea" style="display:none;margin-top:12px;"></div>
      <div id="choiceResult" class="paper-result" style="text-align:center;font-size:22px;font-weight:600;color:#07c160;display:none;"></div>
      <button class="btn secondary" id="choiceSendBtn" style="width:100%;margin-top:12px;display:none;">发到聊天</button>
    </div>
  `;
  let choices = [];
  let lastResult = null;
  const list = body.querySelector("#choiceList");
  function renderList() {
    list.innerHTML = "";
    choices.forEach((c, i) => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `<div class="name">${esc(c)}</div><div class="actions"><button class="danger" data-del>删除</button></div>`;
      item.querySelector("[data-del]").addEventListener("click", () => { choices.splice(i, 1); renderList(); });
      list.appendChild(item);
    });
  }
  renderList();
  const inp = body.querySelector("#choiceInput");
  function addOne() {
    const v = inp.value.trim(); if (!v) return;
    choices.push(v); inp.value = ""; renderList();
  }
  body.querySelector("#choiceAddBtn").addEventListener("click", addOne);
  inp.addEventListener("keydown", e => { if (e.key === "Enter") addOne(); });

  body.querySelector("#choiceSelfBtn").addEventListener("click", () => {
    if (choices.length < 2) return alert("至少两个选项");
    const area = body.querySelector("#choicePickArea");
    area.style.display = "block";
    area.innerHTML = `<div style="font-size:14px;color:#666;margin-bottom:8px;">点一个选项：</div>`;
    choices.forEach(c => {
      const btn = document.createElement("div");
      btn.className = "survey-opt";
      btn.textContent = c;
      btn.addEventListener("click", () => {
        lastResult = { picked: c, who: "me" };
        area.style.display = "none";
        const res = body.querySelector("#choiceResult");
        res.style.display = "block";
        res.textContent = `你选了：${c}`;
        body.querySelector("#choiceSendBtn").style.display = "block";
      });
      area.appendChild(btn);
    });
  });

  body.querySelector("#choiceTaBtn").addEventListener("click", () => {
    if (choices.length < 2) return alert("至少两个选项");
    const picked = choices[Math.floor(Math.random() * choices.length)];
    lastResult = { picked, who: "ta" };
    body.querySelector("#choicePickArea").style.display = "none";
    const res = body.querySelector("#choiceResult");
    res.style.display = "block";
    res.textContent = `${state.settings.taName} 选了：${picked}`;
    body.querySelector("#choiceSendBtn").style.display = "block";
  });

  body.querySelector("#choiceSendBtn").addEventListener("click", () => {
    if (!lastResult) return;
    if (lastResult.who === "me") sendMessage(`【抉择】我选了：${lastResult.picked}`);
    else sendMessage(`【抉择】${state.settings.taName} 选了：${lastResult.picked}`);
    toast("已发到聊天");
  });
}

/* ========== 喝水 ========== */
function openWater() {
  showScreen("waterApp");
  renderWater();
}
function renderWater() {
  const body = document.getElementById("waterBody");
  const today = fmtDate(nowBeijing());
  if (state.water.date !== today) {
    state.water.date = today;
    state.water.count = 0;
    saveWater();
  }
  const w = state.water;
  body.innerHTML = `
    <div class="water-circle" id="waterCircle">
      <div class="water-count">${w.count}</div>
      <div class="water-label">/ ${w.goal} 杯</div>
    </div>
    <div class="row" style="justify-content:center;">
      <button class="btn" id="waterAddBtn">+1 杯</button>
      <button class="btn secondary" id="waterMinusBtn">-1 杯</button>
    </div>
    <div class="row" style="justify-content:center;">
      <button class="btn secondary" id="waterGoalBtn">设置目标（当前 ${w.goal} 杯）</button>
    </div>
  `;
  body.querySelector("#waterAddBtn").addEventListener("click", () => {
    w.count++; saveWater(); renderWater();
  });
  body.querySelector("#waterMinusBtn").addEventListener("click", () => {
    if (w.count > 0) w.count--;
    saveWater(); renderWater();
  });
  body.querySelector("#waterGoalBtn").addEventListener("click", () => {
    const v = prompt("每天目标杯数：", w.goal);
    if (!v) return;
    const n = Number(v);
    if (n > 0) { w.goal = n; saveWater(); renderWater(); }
  });
}

/* ========== 搜索 ========== */
const SEARCH_PLATFORMS = [
  { name: "小红书", icon: "📕", url: "https://www.xiaohongshu.com/search_result?keyword=" },
  { name: "B站",   icon: "📺", url: "https://search.bilibili.com/all?keyword=" },
  { name: "微博",   icon: "🔴", url: "https://s.weibo.com/weibo?q=" },
  { name: "知乎",   icon: "🔵", url: "https://www.zhihu.com/search?type=content&q=" },
  { name: "豆瓣",   icon: "🟢", url: "https://www.douban.com/search?q=" },
  { name: "淘宝",   icon: "🛒", url: "https://s.taobao.com/search?q=" },
  { name: "百度",   icon: "🔍", url: "https://www.baidu.com/s?wd=" },
  { name: "百度图片", icon: "🖼️", url: "https://image.baidu.com/search?word=" },
  { name: "抖音",   icon: "🎵", url: "https://www.douyin.com/search/" }
];
function openSearch() {
  showScreen("searchApp");
  const body = document.getElementById("searchBody");
  body.innerHTML = `
    <div class="search-box">
      <div class="search-input-wrap">
        <input id="searchKw" placeholder="输入关键词，选平台跳转" autocomplete="off">
      </div>
      <div class="search-platforms">
        ${SEARCH_PLATFORMS.map((p, i) =>
          `<button class="search-platform-btn" data-i="${i}">
            <span class="pf-icon">${p.icon}</span>${p.name}
          </button>`
        ).join("")}
      </div>
    </div>
  `;
  body.querySelectorAll(".search-platform-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const kw = body.querySelector("#searchKw").value.trim();
      if (!kw) { toast("先输入关键词"); return; }
      const p = SEARCH_PLATFORMS[Number(btn.dataset.i)];
      window.open(p.url + encodeURIComponent(kw), "_blank");
    });
  });
}

/* ========== 其他功能占位 ========== */
function openSurvey()   { showScreen("surveyApp");  document.getElementById("surveyBody").innerHTML  = `<div class="empty">功能开发中…</div>`; }
function openLetters()  { showScreen("lettersApp"); document.getElementById("lettersBody").innerHTML = `<div class="empty">功能开发中…</div>`; }
function openEat()      { showScreen("eatApp");     document.getElementById("eatBody").innerHTML     = `<div class="empty">功能开发中…</div>`; }
function openCheckin()  { showScreen("checkinApp"); document.getElementById("checkinBody").innerHTML = `<div class="empty">功能开发中…</div>`; }
/* ========== 购物（心愿清单） ========== */
function openShopping() {
  showScreen("shoppingApp");
  renderShopping();
}

function renderShopping() {
  const body = document.getElementById("shoppingBody");
  body.innerHTML = `
    <div class="row">
      <input class="input" id="wishName" placeholder="想买什么…">
    </div>
    <div class="row">
      <input class="input" id="wishPrice" placeholder="价格（可选）">
      <input class="input" id="wishNote" placeholder="备注（可选）">
    </div>
    <div class="row">
      <button class="btn" id="wishAddBtn" style="width:100%">加入心愿清单</button>
    </div>
    <div class="row">
      <button class="btn secondary" id="wishTaAllBtn" style="width:100%">让 TA 帮我挑一个去搜</button>
    </div>
    <div id="wishList"></div>
  `;
  const list = body.querySelector("#wishList");

  function renderList() {
    list.innerHTML = "";
    if (!state.wishlist.length) {
      list.innerHTML = `<div class="empty">心愿清单还是空的</div>`;
      return;
    }
    state.wishlist.forEach((w, i) => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="name">
          <span style="${w.done ? "text-decoration:line-through;color:#999;" : ""}">${esc(w.name)}</span>
          ${w.price ? `<span style="font-size:12px;color:#999;"> ¥${esc(w.price)}</span>` : ""}
          ${w.note ? `<div style="font-size:12px;color:#999;margin-top:2px;">${esc(w.note)}</div>` : ""}
        </div>
        <div class="actions">
          <button data-search>让TA搜</button>
          <button data-toggle>${w.done ? "取消" : "已买"}</button>
          <button class="danger" data-del>删除</button>
        </div>
      `;
      item.querySelector("[data-search]").addEventListener("click", () => taSearchWish(w));
      item.querySelector("[data-toggle]").addEventListener("click", () => { w.done = !w.done; saveWishlist(); renderList(); });
      item.querySelector("[data-del]").addEventListener("click", () => { state.wishlist.splice(i, 1); saveWishlist(); renderList(); });
      list.appendChild(item);
    });
  }
  renderList();

  body.querySelector("#wishAddBtn").addEventListener("click", () => {
    const name = body.querySelector("#wishName").value.trim();
    if (!name) return;
    const price = body.querySelector("#wishPrice").value.trim();
    const note = body.querySelector("#wishNote").value.trim();
    state.wishlist.push({ id: uid(), name, price, note, done: false, ts: Date.now() });
    saveWishlist();
    body.querySelector("#wishName").value = "";
    body.querySelector("#wishPrice").value = "";
    body.querySelector("#wishNote").value = "";
    renderList();
  });

  body.querySelector("#wishTaAllBtn").addEventListener("click", () => {
    const pool = state.wishlist.filter(w => !w.done);
    if (!pool.length) { toast("清单里还没有想买的东西"); return; }
    const w = pick(pool);
    taSearchWish(w);
  });
}

function taSearchWish(w) {
  toast(`${state.settings.taName} 正在搜「${w.name}」…`);
  const msg = {
    id: uid(), from: "ta",
    text: `我帮你搜了「${w.name}」，看看喜不喜欢～`,
    time: fmtTime(nowBeijing()), ts: Date.now()
  };
  state.messages.push(msg);
  saveMessages();
  if (document.getElementById("chatApp")?.classList.contains("active")) renderMessages();
  showNotification(msg);
  setTimeout(() => {
    window.open("https://s.taobao.com/search?q=" + encodeURIComponent(w.name), "_blank");
  }, 900);
}

/* ========== 番茄钟 ========== */
let pomoTimer = null;
let pomoMode = "focus";
let pomoRemain = 25 * 60;
let pomoRunning = false;

function openPomodoro() {
  showScreen("pomodoroApp");
  const today = fmtDate(nowBeijing());
  if (state.pomodoro.date !== today) {
    state.pomodoro.date = today;
    state.pomodoro.todayCount = 0;
    savePomodoro();
  }
  pomoMode = "focus";
  pomoRunning = false;
  clearInterval(pomoTimer);
  pomoRemain = pomoDuration("focus");
  renderPomodoro();
}

function pomoDuration(mode) {
  const p = state.pomodoro;
  return (mode === "focus" ? p.focusMin : mode === "short" ? p.shortMin : p.longMin) * 60;
}
function pomoModeName(mode) {
  return mode === "focus" ? "专注" : mode === "short" ? "小憩" : "长休";
}

function renderPomodoro() {
  const body = document.getElementById("pomodoroBody");
  const p = state.pomodoro;
  const total = pomoDuration(pomoMode);
  const mm = String(Math.floor(pomoRemain / 60)).padStart(2, "0");
  const ss = String(pomoRemain % 60).padStart(2, "0");
  const R = 90, C = 2 * Math.PI * R;
  const dash = C * ((total - pomoRemain) / total);

  body.innerHTML = `
    <div class="pomo-tabs">
      <div class="pomo-tab ${pomoMode==="focus"?"active":""}" data-mode="focus">专注</div>
      <div class="pomo-tab ${pomoMode==="short"?"active":""}" data-mode="short">小憩</div>
      <div class="pomo-tab ${pomoMode==="long"?"active":""}" data-mode="long">长休</div>
    </div>
    <div class="pomo-ring-wrap">
      <svg class="pomo-ring" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="${R}" stroke="#eee" stroke-width="10" fill="none"/>
        <circle cx="100" cy="100" r="${R}" stroke="#07c160" stroke-width="10" fill="none"
          stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C - dash}"
          transform="rotate(-90 100 100)"/>
      </svg>
      <div class="pomo-time">
        <div class="pomo-time-num">${mm}:${ss}</div>
        <div class="pomo-time-label">${pomoModeName(pomoMode)}</div>
      </div>
    </div>
    <div class="row" style="justify-content:center;gap:12px;">
      <button class="btn" id="pomoStartBtn">${pomoRunning ? "暂停" : "开始"}</button>
      <button class="btn secondary" id="pomoResetBtn">重置</button>
    </div>
    <div class="row" style="justify-content:center;">
      <button class="btn secondary" id="pomoSettingBtn">时长设置</button>
    </div>
    <div class="pomo-stats">
      <div class="pomo-stat"><div class="pomo-stat-num">${p.todayCount}</div><div class="pomo-stat-label">今日专注</div></div>
      <div class="pomo-stat"><div class="pomo-stat-num">${p.totalCount}</div><div class="pomo-stat-label">累计专注</div></div>
    </div>
  `;

  body.querySelectorAll(".pomo-tab").forEach(t => {
    t.addEventListener("click", () => {
      if (pomoRunning) { toast("先暂停再切换"); return; }
      pomoMode = t.dataset.mode;
      pomoRemain = pomoDuration(pomoMode);
      renderPomodoro();
    });
  });
  body.querySelector("#pomoStartBtn").addEventListener("click", togglePomo);
  body.querySelector("#pomoResetBtn").addEventListener("click", () => {
    clearInterval(pomoTimer);
    pomoRunning = false;
    pomoRemain = pomoDuration(pomoMode);
    renderPomodoro();
  });
  body.querySelector("#pomoSettingBtn").addEventListener("click", openPomoSetting);
}

function togglePomo() {
  if (pomoRunning) {
    clearInterval(pomoTimer);
    pomoRunning = false;
    renderPomodoro();
    return;
  }
  pomoRunning = true;
  renderPomodoro();
  pomoTimer = setInterval(() => {
    pomoRemain--;
    if (pomoRemain <= 0) {
      clearInterval(pomoTimer);
      pomoRunning = false;
      pomoFinish();
      return;
    }
    const numEl = document.querySelector(".pomo-time-num");
    if (numEl) {
      const mm = String(Math.floor(pomoRemain / 60)).padStart(2, "0");
      const ss = String(pomoRemain % 60).padStart(2, "0");
      numEl.textContent = `${mm}:${ss}`;
    }
    const total = pomoDuration(pomoMode);
    const R = 90, C = 2 * Math.PI * R;
    const ring = document.querySelectorAll(".pomo-ring circle")[1];
    if (ring) ring.setAttribute("stroke-dashoffset", C - C * ((total - pomoRemain) / total));
  }, 1000);
}

function pomoFinish() {
  if (pomoMode === "focus") {
    state.pomodoro.todayCount++;
    state.pomodoro.totalCount++;
    savePomodoro();
  }
  toast(`${pomoModeName(pomoMode)}结束！`);
  playBeep();
  renderPomodoro();
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
  } catch(e) {}
}

function openPomoSetting() {
  openModal("番茄钟时长", () => {
    const wrap = document.createElement("div");
    const p = state.pomodoro;
    wrap.innerHTML = `
      <div class="row"><div style="flex:1;">专注（分钟）</div><input class="input" id="pf" type="number" value="${p.focusMin}" style="width:80px;"></div>
      <div class="row"><div style="flex:1;">小憩（分钟）</div><input class="input" id="ps" type="number" value="${p.shortMin}" style="width:80px;"></div>
      <div class="row"><div style="flex:1;">长休（分钟）</div><input class="input" id="pl" type="number" value="${p.longMin}" style="width:80px;"></div>
      <button class="btn" id="pomoSaveBtn" style="width:100%;margin-top:10px;">保存</button>
    `;
    wrap.querySelector("#pomoSaveBtn").addEventListener("click", () => {
      state.pomodoro.focusMin = Math.max(1, Number(wrap.querySelector("#pf").value) || 25);
      state.pomodoro.shortMin = Math.max(1, Number(wrap.querySelector("#ps").value) || 5);
      state.pomodoro.longMin  = Math.max(1, Number(wrap.querySelector("#pl").value) || 15);
      savePomodoro();
      modal.classList.remove("open");
      if (!pomoRunning) { pomoRemain = pomoDuration(pomoMode); renderPomodoro(); }
    });
    return wrap;
  });
}

/* ========== 音乐 ========== */
const MUSIC_PLATFORMS = [
  { name: "网易云音乐", icon: "🎵", url: "https://music.163.com/#/search/m/?s=" },
  { name: "QQ音乐",    icon: "🎶", url: "https://y.qq.com/n/ryqq/search?w=" }
];

function collectWords() {
  const words = [];
  state.messages.forEach(m => {
    if (m.from === "me" && m.text && !m.recalled && !m.isCard && !m.isVoice) {
      m.text.split(/\s+/).filter(Boolean).forEach(w => words.push(w));
    }
  });
  getAllCards().forEach(c => {
    String(c).split(/\s+/).filter(Boolean).forEach(w => words.push(w));
  });
  return words.filter(w => w.length >= 1 && w.length <= 30);
}

function openMusic() {
  showScreen("musicApp");
  renderMusic();
}

function renderMusic() {
  const body = document.getElementById("musicBody");
  body.innerHTML = `
    <div class="row" style="margin-bottom:12px;">
      <input class="input" id="musicKw" placeholder="想听什么？留空随机抽">
      <button class="btn" id="musicRollBtn">抽一个</button>
    </div>
    <div id="musicResult"></div>
    <div style="margin-top:16px;font-size:13px;color:#999;line-height:1.6;">
      抽词来源：你发过的消息 + 字卡库<br>点击平台直接打开 App 搜索
    </div>
  `;
  const result = body.querySelector("#musicResult");
  body.querySelector("#musicRollBtn").addEventListener("click", () => {
    let kw = body.querySelector("#musicKw").value.trim();
    if (!kw) {
      const pool = collectWords();
      if (!pool.length) { toast("还没什么词可以抽"); return; }
      kw = pick(pool);
    }
    renderMusicResult(result, kw);
  });
}

function renderMusicResult(container, kw) {
  container.innerHTML = `
    <div class="paper-box">
      <div class="paper-tag">随机音乐</div>
      <div class="paper-result" style="font-size:22px;font-weight:600;">${esc(kw)}</div>
      <div class="search-platforms" style="margin-top:12px;">
        ${MUSIC_PLATFORMS.map((p,i)=>`<button class="search-platform-btn" data-mp="${i}"><span class="pf-icon">${p.icon}</span>${p.name}</button>`).join("")}
      </div>
    </div>
  `;
  container.querySelectorAll("[data-mp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = MUSIC_PLATFORMS[Number(btn.dataset.mp)];
      window.open(p.url + encodeURIComponent(kw), "_blank");
    });
  });
}

/* ========== 推书 ========== */
const BOOK_PLATFORMS = [
  { name: "豆瓣读书", icon: "📖", url: "https://search.douban.com/book/subject_search?search_text=" },
  { name: "当当",     icon: "🛍️", url: "https://search.dangdang.com/?key=" },
  { name: "京东图书", icon: "📚", url: "https://search.jd.com/Search?keyword=" },
  { name: "百度",     icon: "🔍", url: "https://www.baidu.com/s?wd=" }
];

function openBooks() {
  showScreen("booksApp");
  renderBooks();
}

function renderBooks() {
  const body = document.getElementById("booksBody");
  body.innerHTML = `
    <div class="row" style="margin-bottom:12px;">
      <input class="input" id="bookKw" placeholder="想找什么书？留空随机抽">
      <button class="btn" id="bookRollBtn">抽一个</button>
    </div>
    <div id="bookResult"></div>
    <div style="margin-top:16px;font-size:13px;color:#999;line-height:1.6;">
      抽词来源：你发过的消息 + 字卡库<br>点击平台直接打开 App 搜索
    </div>
  `;
  const result = body.querySelector("#bookResult");
  body.querySelector("#bookRollBtn").addEventListener("click", () => {
    let kw = body.querySelector("#bookKw").value.trim();
    if (!kw) {
      const pool = collectWords();
      if (!pool.length) { toast("还没什么词可以抽"); return; }
      kw = pick(pool);
    }
    renderBookResult(result, kw);
  });
}

function renderBookResult(container, kw) {
  container.innerHTML = `
    <div class="paper-box">
      <div class="paper-tag">随机推书</div>
      <div class="paper-result" style="font-size:22px;font-weight:600;">${esc(kw)}</div>
      <div class="search-platforms" style="margin-top:12px;">
        ${BOOK_PLATFORMS.map((p,i)=>`<button class="search-platform-btn" data-bp="${i}"><span class="pf-icon">${p.icon}</span>${p.name}</button>`).join("")}
      </div>
    </div>
  `;
  container.querySelectorAll("[data-bp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = BOOK_PLATFORMS[Number(btn.dataset.bp)];
      window.open(p.url + encodeURIComponent(kw), "_blank");
    });
  });
}

/* ========== 弹窗 ========== */
const modal = document.getElementById("modal");
function openModal(title, contentFn) {
  document.getElementById("modalTitle").textContent = title;
  const body = document.getElementById("modalBody");
  body.innerHTML = "";
  const content = contentFn();
  if (typeof content === "string") body.innerHTML = content;
  else if (content instanceof Node) body.appendChild(content);
  modal.classList.add("open");
}
document.getElementById("modalClose").addEventListener("click", () => modal.classList.remove("open"));
modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });

/* ========== 设置 ========== */
function openSettings() {
  showScreen("settingsApp");
  renderSettingsPage();
}
function renderSettingsPage() {
  const body = document.getElementById("settingsBody");
  const s = state.settings;
  body.innerHTML = `
    <div class="list-item"><div class="name">我的昵称</div><div class="actions"><button data-edit="myName">${esc(s.myName)}</button></div></div>
    <div class="list-item"><div class="name">我的头像</div><div class="actions">${s.myAvatar ? `<img src="${s.myAvatar}" style="width:32px;height:32px;border-radius:4px;object-fit:cover;margin-right:6px;">` : ""}<button data-avatar="myAvatar">${s.myAvatar ? "更换" : "上传"}</button>${s.myAvatar ? `<button class="danger" data-avclear="myAvatar">清除</button>` : ""}</div></div>
    <div class="list-item"><div class="name">对方昵称</div><div class="actions"><button data-edit="taName">${esc(s.taName)}</button></div></div>
    <div class="list-item"><div class="name">对方头像</div><div class="actions">${s.taAvatar ? `<img src="${s.taAvatar}" style="width:32px;height:32px;border-radius:4px;object-fit:cover;margin-right:6px;">` : ""}<button data-avatar="taAvatar">${s.taAvatar ? "更换" : "上传"}</button>${s.taAvatar ? `<button class="danger" data-avclear="taAvatar">清除</button>` : ""}</div></div>
    <div class="list-item"><div class="name">聊天背景色</div><div class="actions"><input type="color" value="${s.bgColor}" data-color="bgColor"></div></div>
    <div class="list-item"><div class="name">聊天背景图</div><div class="actions"><button data-bgimg>上传</button>${s.bgImage ? `<button class="danger" data-bgclear>清除</button>` : ""}</div></div>
    <div class="list-item"><div class="name">我的气泡颜色</div><div class="actions"><input type="color" value="${s.myBubbleColor}" data-color="myBubbleColor"></div></div>
    <div class="list-item"><div class="name">对方气泡颜色</div><div class="actions"><input type="color" value="${s.taBubbleColor}" data-color="taBubbleColor"></div></div>
    <div class="list-item"><div class="name">字体大小（${s.fontSize}px）</div><div class="actions"><input type="range" min="12" max="22" value="${s.fontSize}" data-range="fontSize"></div></div>
    <div class="list-item"><div class="name">已读不回（${s.readNoReplyProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.readNoReplyProb}" data-range="readNoReplyProb"></div></div>
    <div class="list-item"><div class="name">语音概率（${s.voiceProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.voiceProb}" data-range="voiceProb"></div></div>
    <div class="list-item"><div class="name">图片概率（${s.imgProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.imgProb}" data-range="imgProb"></div></div>
    <div class="list-item"><div class="name">拍一拍回拍（${s.pokeBackProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.pokeBackProb}" data-range="pokeBackProb"></div></div>
    <div class="list-item"><div class="name">拍一拍触发字卡（${s.pokeCardProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.pokeCardProb}" data-range="pokeCardProb"></div></div>
    <div class="list-item"><div class="name">通话拒绝（${s.callRejectProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.callRejectProb}" data-range="callRejectProb"></div></div>
    <div class="list-item"><div class="name">心情触发（${s.moodProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.moodProb}" data-range="moodProb"></div></div>
    <div class="list-item"><div class="name">意图触发（${s.intentProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.intentProb}" data-range="intentProb"></div></div>
    <div class="list-item"><div class="name">对方发朋友圈（${s.taMomentsProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.taMomentsProb}" data-range="taMomentsProb"></div></div>
    <div class="list-item"><div class="name">对方评论（${s.taCommentProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.taCommentProb}" data-range="taCommentProb"></div></div>
    <div class="list-item"><div class="name">随机搜索链接（${s.searchLinkProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.searchLinkProb}" data-range="searchLinkProb"></div></div>
    <div class="list-item"><div class="name">随机推荐（${s.suggestProb}%）</div><div class="actions"><input type="range" min="0" max="100" value="${s.suggestProb}" data-range="suggestProb"></div></div>
    <div class="list-item"><div class="name">拍一拍文案库</div><div class="actions"><button data-pokemgr>管理（${state.pokeTexts.length}）</button></div></div>`;
  body.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.edit;
      const v = prompt("修改为：", s[k]);
      if (v === null) return;
      s[k] = v.trim() || s[k];
      saveSettings(); renderSettingsPage();
      if (k === "taName") document.getElementById("chatTitle").textContent = s.taName;
    });
  });
  body.querySelectorAll("[data-avatar]").forEach(btn => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.avatar;
      const f = document.createElement("input");
      f.type = "file"; f.accept = "image/*";
      f.onchange = async () => {
        if (!f.files[0]) return;
        const data = await compressImage(f.files[0], 300, 0.85);
        s[k] = data; saveSettings(); renderSettingsPage();
        toast("已更新头像");
      };
      f.click();
    });
  });
  body.querySelectorAll("[data-avclear]").forEach(btn => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.avclear;
      s[k] = ""; saveSettings(); renderSettingsPage();
      toast("已清除头像");
    });
  });
  body.querySelectorAll("[data-color]").forEach(inp => {
    inp.addEventListener("input", () => { s[inp.dataset.color] = inp.value; saveSettings(); applyAppearance(); });
  });
  body.querySelectorAll("[data-range]").forEach(inp => {
    inp.addEventListener("input", () => {
      s[inp.dataset.range] = Number(inp.value);
      saveSettings(); renderSettingsPage(); applyAppearance();
    });
  });
  const bgBtn = body.querySelector("[data-bgimg]");
  if (bgBtn) bgBtn.addEventListener("click", () => {
    const f = document.createElement("input");
    f.type = "file"; f.accept = "image/*";
    f.onchange = async () => {
      if (!f.files[0]) return;
      const data = await compressImage(f.files[0], 1200, 0.8);
      s.bgImage = data; saveSettings(); renderSettingsPage(); applyChatBackground();
    };
    f.click();
  });
  const bgClear = body.querySelector("[data-bgclear]");
  if (bgClear) bgClear.addEventListener("click", () => {
    s.bgImage = ""; saveSettings(); renderSettingsPage(); applyChatBackground();
  });
  const pokeMgr = body.querySelector("[data-pokemgr]");
  if (pokeMgr) pokeMgr.addEventListener("click", () => {
    openModal("拍一拍文案库", () => {
      const wrap = document.createElement("div");
      wrap.innerHTML = `<div class="row"><input class="input" id="pokeInput" placeholder="输入拍一拍文案"><button class="btn" id="pokeAddBtn">添加</button></div><div id="pokeList"></div>`;
      const list = wrap.querySelector("#pokeList");
      function render() {
        list.innerHTML = "";
        if (!state.pokeTexts.length) { list.innerHTML = `<div class="empty">还没有文案</div>`; return; }
        state.pokeTexts.forEach((t, i) => {
          const item = document.createElement("div");
          item.className = "list-item";
          item.innerHTML = `<div class="name">${esc(t)}</div><div class="actions"><button class="danger" data-del>删除</button></div>`;
          item.querySelector("[data-del]").addEventListener("click", () => { state.pokeTexts.splice(i, 1); savePokeTexts(); render(); });
          list.appendChild(item);
        });
      }
      render();
      wrap.querySelector("#pokeAddBtn").addEventListener("click", () => {
        const v = wrap.querySelector("#pokeInput").value.trim();
        if (!v) return;
        state.pokeTexts.push(v); savePokeTexts(); wrap.querySelector("#pokeInput").value = ""; render();
      });
      return wrap;
    });
  });
}
function applyAppearance() {
  document.documentElement.style.fontSize = state.settings.fontSize + "px";
  document.querySelectorAll(".msg-row.me .bubble").forEach(b => b.style.background = state.settings.myBubbleColor);
  document.querySelectorAll(".msg-row.bot .bubble").forEach(b => b.style.background = state.settings.taBubbleColor);
  document.documentElement.style.setProperty("--me-bubble", state.settings.myBubbleColor);
  document.documentElement.style.setProperty("--ta-bubble", state.settings.taBubbleColor);
  applyChatBackground();
}

/* ========== 初始化 ========== */
function init() {
  renderDesktop();
  tickDesktopTime();
  setInterval(tickDesktopTime, 1000 * 30);
  initInputBar();
  applyAppearance();
  document.querySelectorAll(".dock-item").forEach(el => {
    el.addEventListener("click", () => {
      if (el.dataset.app === "settings") openSettings();
    });
  });
  if (state.cards.categories.length === 0) {
    state.cards.categories.push({
      id: uid(), name: "日常", enabled: true,
      cards: [
        { id: uid(), text: "在的" }, { id: uid(), text: "怎么啦" },
        { id: uid(), text: "我在想你" }, { id: uid(), text: "今天过得怎么样" },
        { id: uid(), text: "要好好吃饭哦" }, { id: uid(), text: "早点休息" }
      ]
    });
    state.cards.categories.push({ id: uid(), name: "心情", enabled: true, cards: [] });
    state.cards.categories.push({ id: uid(), name: "意图", enabled: true, cards: [] });
    saveCards();
  }
}

init();