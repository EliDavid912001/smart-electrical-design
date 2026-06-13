(function () {
  "use strict";
  const { lead, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "n_neutral", cat: "distribution", code: "N",
    name: "פס אפס", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, -20, 0); L(g, -14, -4, 14, -4); L(g, -14, 4, 14, 4); lead(g, 20, 0); },
  });
})();
