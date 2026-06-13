(function () {
  "use strict";
  const { lead, R, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "ta_multimeter", cat: "measure", code: "TA",
    name: "מונה רב-שימושי", modules: 2, phases: 0, hasRating: false,
    draw(g) { lead(g, -20, -10); R(g, -12, -10, 24, 20); TT(g, "A/V", 0, 0, 10); lead(g, 10, 20); },
  });
})();
