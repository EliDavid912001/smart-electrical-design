(function () {
  "use strict";
  const { lead, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "bc_ct_1p", cat: "measure", code: "BC",
    name: "משנה זרם 1F", modules: 0, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, 0); CIR(g, 0, 0, 10); L(g, 0, -10, 0, 10); },
  });
})();
