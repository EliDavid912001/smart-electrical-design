(function () {
  "use strict";
  const { lead, XX, R, L, mcbPoles } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "kd_mcb_1p", cat: "protection", code: "KD",
    name: 'מא"ז 1F', modules: 1, phases: 1, hasRating: true,
    draw(g) { lead(g, -20, -12); mcbPoles(g, 1); lead(g, 8, 20); },
  });
})();
