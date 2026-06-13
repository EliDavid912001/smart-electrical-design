(function () {
  "use strict";
  const { lead, R, L, CIR } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "pb_relay_1p", cat: "control", code: "PB",
    name: "ממסר 1F", modules: 1, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -10); R(g, -10, -10, 20, 20); L(g, -6, -4, 6, 4); L(g, -6, 4, 6, -4); lead(g, 10, 20); },
  });
})();
