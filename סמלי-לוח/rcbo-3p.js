(function () {
  "use strict";
  const { lead, XX, R, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "rcbo_3p", cat: "protection", code: "BO",
    name: 'מאמ"ת+פחת 3F', modules: 3, phases: 3, hasRating: true,
    draw(g) {
      for (const dx of [-7, 0, 7]) { L(g, dx, -20, dx, -12); XX(g, dx, -12, 3); }
      R(g, -12, -10, 24, 20); CIR(g, 0, 2, 4); lead(g, 10, 20);
    },
  });
})();
