/* =====================================================
   icons.js · 图标系统（Lucide）
   ===================================================== */

// 桌面图标映射：action → Lucide 图标名
window.ICON_MAP = {
  chat:     "message-circle",
  cards:    "layers",
  emojis:   "smile",
  paper:    "file-text",
  tarot:    "sparkles",
  moments:  "image",
  choice:   "git-branch",
  survey:   "clipboard-list",
  letters:  "mail",
  shopping: "shopping-bag",
  water:    "sun",
  eat:      "utensils",
  checkin:  "eye",
  pomodoro: "timer",
  search:   "search",
  settings: "settings"
};

// 页面内图标映射：给 index.html 用
window.UI_ICON_MAP = {
  "ui-back":  "chevron-left",
  "ui-menu":  "more-horizontal",
  "ui-mic":   "mic",
  "ui-image": "image",
  "ui-smile": "smile",
  "ui-poke":  "hand",
  "ui-plus":  "plus-circle",
  "ui-settings": "settings",
  "ui-call":     "phone",
  "ui-fav":      "star",
  "ui-search":   "search"
};

// 图标颜色（默认黑）
function getIconColor() {
  try {
    const s = JSON.parse(localStorage.getItem("settings") || "{}");
    return s.iconColor || "#000000";
  } catch (e) {
    return "#000000";
  }
}

// 刷新所有图标：把 <i data-lucide> 渲染成 SVG
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
  applyIconColor();
}

// 应用图标颜色（写到 CSS 变量）
function applyIconColor() {
  const c = getIconColor();
  document.documentElement.style.setProperty("--icon-color", c);
}

// 把 index.html 里 data-icon="ui-xxx" 的元素替换成 lucide 图标
function renderUiIcons() {
  document.querySelectorAll("[data-icon]").forEach(el => {
    const key = el.getAttribute("data-icon");
    const name = UI_ICON_MAP[key];
    if (name) {
      el.innerHTML = `<i data-lucide="${name}"></i>`;
    }
  });
}

// 初始化：等 DOM 好了，渲染 UI 图标 + 应用颜色
document.addEventListener("DOMContentLoaded", () => {
  renderUiIcons();
  refreshIcons();
});

// 暴露给 app.js 调用
window.__icons = {
  refreshIcons,
  renderUiIcons,
  applyIconColor,
  getIconColor
};