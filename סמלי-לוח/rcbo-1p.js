(function () {
  "use strict";
  const { lead, XX, R, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "rcbo_1p", cat: "protection", code: "BO",
    name: 'מאמ"ת+פחת 1F', modules: 1, phases: 1, hasRating: true,
    draw(g) { lead(g, -20, -12); XX(g, 0, -12, 4); R(g, -10, -10, 20, 20); CIR(g, -4, 2, 4); L(g, 2, -3, 8, -3); lead(g, 10, 20); },
  });
})();
