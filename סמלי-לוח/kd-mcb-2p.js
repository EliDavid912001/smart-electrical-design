(function () {
  "use strict";
  const { lead, mcbPoles } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "kd_mcb_2p", cat: "protection", code: "KD",
    name: 'מא"ז 2F', modules: 2, phases: 2, hasRating: true,
    draw(g) { lead(g, -20, -12); mcbPoles(g, 2); lead(g, 8, 20); },
  });
})();
