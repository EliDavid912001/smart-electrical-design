(function () {
  "use strict";
  const { lead, CIR, L, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "bc_ct_3p", cat: "measure", code: "BC",
    name: "משנה זרם 3F", modules: 0, phases: 3, hasRating: false,
    draw(g) { lead(g, -20, 0); CIR(g, 0, 0, 10); L(g, 0, -10, 0, 10); TT(g, "3~", 0, -16, 7); },
  });
})();
