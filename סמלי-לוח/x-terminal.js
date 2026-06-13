(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "x_terminal", cat: "misc", code: "X",
    name: "מהדק / מחבר", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, -20, -9); R(g, -9, -9, 18, 18); for (let i = -6; i <= 6; i += 6) L(g, i, -9, i, 9); },
  });
})();
