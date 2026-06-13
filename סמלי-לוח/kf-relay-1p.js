(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "kf_relay_1p", cat: "control", code: "KF",
    name: "ממסר עזר 1F", modules: 1, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -8); R(g, -8, -8, 16, 16); L(g, -8, 0, -2, -4); L(g, -2, -4, 8, 4); lead(g, 10, 20); },
  });
})();
