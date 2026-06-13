(function () {
  "use strict";
  const { lead, CIR, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "trafo_3p", cat: "loads", code: "MA",
    name: "שנאי 3F", modules: 0, phases: 3, hasRating: false,
    draw(g) { lead(g, -20, -13); CIR(g, 0, -5, 8); CIR(g, 0, 6, 8); TT(g, "3~", 0, -16, 7); lead(g, 14, 20); },
  });
})();
