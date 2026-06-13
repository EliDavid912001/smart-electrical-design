(function () {
  "use strict";
  const { lead, XX, R, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "bo_rcd_2p", cat: "protection", code: "BO",
    name: "פחת 2F", modules: 2, phases: 2, hasRating: true,
    draw(g) {
      for (const dx of [-4, 4]) { L(g, dx, -20, dx, -12); XX(g, dx, -12, 3.5); }
      R(g, -10, -9, 20, 18); CIR(g, 0, 0, 5); lead(g, 9, 20);
    },
  });
})();
