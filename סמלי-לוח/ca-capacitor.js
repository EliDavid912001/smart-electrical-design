(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "ca_capacitor", cat: "misc", code: "CA",
    name: "קבל", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, -20, -8); L(g, -4, -8, -4, 8); L(g, 4, -8, 4, 8); lead(g, 8, 20); },
  });
})();
