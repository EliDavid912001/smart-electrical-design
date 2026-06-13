(function () {
  "use strict";
  const { lead, R, CIR } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "kf_earth_relay", cat: "control", code: "KF",
    name: "ממסר פחת", modules: 1, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -8); R(g, -10, -8, 20, 16); CIR(g, 0, 0, 5); lead(g, 10, 20); },
  });
})();
