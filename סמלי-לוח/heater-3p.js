(function () {
  "use strict";
  const { lead, R, L, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "heater_3p", cat: "loads", code: "MA",
    name: "גוף חימום 3F", modules: 0, phases: 3, hasRating: false,
    draw(g) { lead(g, -20, -10); R(g, -12, -10, 24, 20); L(g, -12, -3, 12, -3); L(g, -12, 3, 12, 3); TT(g, "3~", 0, -16, 7); },
  });
})();
