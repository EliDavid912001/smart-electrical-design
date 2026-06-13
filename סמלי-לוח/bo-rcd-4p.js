(function () {
  "use strict";
  const { lead, XX, R, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "bo_rcd_4p", cat: "protection", code: "BO",
    name: "פחת 4F", modules: 4, phases: 4, hasRating: true,
    draw(g) {
      for (const dx of [-10, -3, 3, 10]) { L(g, dx, -20, dx, -12); XX(g, dx, -12, 3); }
      R(g, -13, -9, 26, 18); CIR(g, 0, 0, 5); lead(g, 9, 20);
    },
  });
})();
