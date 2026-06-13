(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "kf_relay_3p", cat: "control", code: "KF",
    name: "ממסר עזר 3F", modules: 2, phases: 3, hasRating: false,
    draw(g) { lead(g, -20, -8); R(g, -12, -8, 24, 16); L(g, -10, 0, -2, -4); L(g, -2, -4, 10, 4); lead(g, 10, 20); },
  });
})();
