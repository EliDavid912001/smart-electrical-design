(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "tc_shunt_1p", cat: "control", code: "TC",
    name: "סליל ניתוק 1F", modules: 1, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -8); R(g, -8, -8, 16, 16); for (let i = -5; i <= 5; i += 5) L(g, -8, i, 8, i); lead(g, 10, 20); },
  });
})();
