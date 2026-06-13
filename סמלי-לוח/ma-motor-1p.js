(function () {
  "use strict";
  const { lead, CIR, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "ma_motor_1p", cat: "loads", code: "MA",
    name: "מנוע 1F", modules: 0, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -12); CIR(g, 0, 1, 12); TT(g, "M", 0, 1, 13); },
  });
})();
