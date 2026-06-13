(function () {
  "use strict";
  const { lead, CIR, L, ARC } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "qa1_contactor_3p", cat: "loads", code: "QA_1",
    name: "מגען 3F", modules: 3, phases: 3, hasRating: false,
    draw(g) {
      for (const dx of [-7, 0, 7]) { L(g, dx, -20, dx, -10); CIR(g, dx, -10, 2); L(g, dx, -10, dx + 5, 6); ARC(g, dx + 3, 8, 3, Math.PI, 2 * Math.PI); CIR(g, dx, 10, 2); }
      lead(g, 10, 20);
    },
  });
})();
