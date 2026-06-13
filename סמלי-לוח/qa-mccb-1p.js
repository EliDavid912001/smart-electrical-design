(function () {
  "use strict";
  const { lead, XX, mcbPoles } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "qa_mccb_1p", cat: "protection", code: "QA",
    name: 'מפסק ראשי 1F', modules: 1, phases: 1, hasRating: true,
    draw(g) { g.lineWidth *= 1.3; lead(g, -22, -12); XX(g, 0, -12, 5); mcbPoles(g, 1); lead(g, 9, 22); },
  });
})();
