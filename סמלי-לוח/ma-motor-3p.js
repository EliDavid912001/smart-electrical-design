(function () {
  "use strict";
  const { lead, CIR, TT, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "ma_motor_3p", cat: "loads", code: "MA",
    name: "מנוע 3F", modules: 0, phases: 3, hasRating: false,
    draw(g) { lead(g, -20, -12); CIR(g, 0, 1, 12); TT(g, "M", 0, 1, 13); TT(g, "3~", 0, -14, 8); },
  });
})();
