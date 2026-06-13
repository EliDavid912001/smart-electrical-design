(function () {
  "use strict";
  const { lead, R, L, XX } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "pc_spd_1p", cat: "protection", code: "PC",
    name: "מגן ברק 1F", modules: 1, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -10); R(g, -8, -10, 16, 20); XX(g, 0, 0, 5); lead(g, 10, 20); },
  });
})();
