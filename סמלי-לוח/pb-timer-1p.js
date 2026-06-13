(function () {
  "use strict";
  const { lead, R, L, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "pb_timer_1p", cat: "control", code: "PB",
    name: "ממסר זמן 1F", modules: 1, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -10); R(g, -10, -10, 20, 20); TT(g, "t", 0, 0, 12); lead(g, 10, 20); },
  });
})();
