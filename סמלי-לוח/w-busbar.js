(function () {
  "use strict";
  const { lead, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "w_busbar", cat: "distribution", code: "W",
    name: "פס צבירה", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, -20, 0); L(g, -14, -6, 14, -6); L(g, -14, 0, 14, 0); L(g, -14, 6, 14, 6); lead(g, 20, 0); },
  });
})();
