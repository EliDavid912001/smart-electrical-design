(function () {
  "use strict";
  const { lead, R, L, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "pb_relay_3p", cat: "control", code: "PB",
    name: "ממסר 3F", modules: 2, phases: 3, hasRating: false,
    draw(g) { lead(g, -20, -10); R(g, -12, -10, 24, 20); L(g, -6, -4, 6, 4); L(g, -6, 4, 6, -4); TT(g, "3~", 0, -16, 7); lead(g, 10, 20); },
  });
})();
