(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "tc_shunt_3p", cat: "control", code: "TC",
    name: "סליל ניתוק 3F", modules: 2, phases: 3, hasRating: false,
    draw(g) { lead(g, -20, -8); R(g, -12, -8, 24, 16); for (let i = -5; i <= 5; i += 5) L(g, -12, i, 12, i); lead(g, 10, 20); },
  });
})();
