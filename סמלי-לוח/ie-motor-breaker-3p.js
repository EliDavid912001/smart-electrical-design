(function () {
  "use strict";
  const { lead, mcbPoles, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "ie_motor_breaker_3p", cat: "protection", code: "IE",
    name: 'מפסק מנוע 3F', modules: 3, phases: 3, hasRating: true,
    draw(g) { lead(g, -20, -12); mcbPoles(g, 3); lead(g, 8, 20); TT(g, "IE", 0, 14, 7); },
  });
})();
