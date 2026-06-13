(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "heater_1p", cat: "loads", code: "MA",
    name: "גוף חימום 1F", modules: 0, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -10); R(g, -12, -10, 24, 20); L(g, -12, -3, 12, -3); L(g, -12, 3, 12, 3); },
  });
})();
