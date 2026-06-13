(function () {
  "use strict";
  const { lead, CIR, L, ARC } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "qa1_contactor_1p", cat: "loads", code: "QA_1",
    name: "מגען 1F", modules: 1, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -10); CIR(g, 0, -10, 2); L(g, 0, -10, 8, 7); ARC(g, 4, 9, 4, Math.PI, 2 * Math.PI); CIR(g, 0, 10, 2); lead(g, 10, 20); },
  });
})();
