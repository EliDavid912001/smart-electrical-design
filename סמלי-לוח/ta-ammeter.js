(function () {
  "use strict";
  const { lead, R, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "ta_ammeter", cat: "measure", code: "TA",
    name: "מונה זרם", modules: 1, phases: 0, hasRating: false,
    draw(g) { lead(g, -20, -10); R(g, -10, -10, 20, 20); TT(g, "A", 0, 0, 14); lead(g, 10, 20); },
  });
})();
