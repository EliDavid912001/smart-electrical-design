(function () {
  "use strict";
  const { lead, CIR } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "trafo_1p", cat: "loads", code: "MA",
    name: "שנאי 1F", modules: 0, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -13); CIR(g, 0, -5, 8); CIR(g, 0, 6, 8); lead(g, 14, 20); },
  });
})();
