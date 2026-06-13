(function () {
  "use strict";
  const { lead, mcbPoles } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "kd_mcb_3p", cat: "protection", code: "KD",
    name: 'מא"ז 3F', modules: 3, phases: 3, hasRating: true,
    draw(g) { lead(g, -20, -12); mcbPoles(g, 3); lead(g, 8, 20); },
  });
})();
