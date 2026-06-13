(function () {
  "use strict";
  const { lead, XX, R, L, mcbPoles } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "qa_mccb_3p", cat: "protection", code: "QA",
    name: 'מפסק ראשי 3F', modules: 3, phases: 3, hasRating: true,
    draw(g) { g.lineWidth *= 1.4; lead(g, -22, -12); XX(g, 0, -12, 5); mcbPoles(g, 3); lead(g, 9, 22); },
  });
})();
