(function () {
  "use strict";
  const { lead, R, L, XX } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "pc_spd_3p", cat: "protection", code: "PC",
    name: "מגן ברק 3F", modules: 3, phases: 3, hasRating: false,
    draw(g) {
      for (const dx of [-7, 0, 7]) { L(g, dx, -20, dx, -10); XX(g, dx, 0, 4); }
      R(g, -12, -10, 24, 20); lead(g, 10, 20);
    },
  });
})();
