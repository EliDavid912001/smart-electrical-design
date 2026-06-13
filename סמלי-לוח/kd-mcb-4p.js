(function () {
  "use strict";
  const { lead, mcbPoles } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "kd_mcb_4p", cat: "protection", code: "KD",
    name: 'מא"ז 4F', modules: 4, phases: 4, hasRating: true,
    draw(g) { lead(g, -20, -12); mcbPoles(g, 4); lead(g, 8, 20); },
  });
})();
