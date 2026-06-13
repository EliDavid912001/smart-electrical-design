(function () {
  "use strict";
  const { lead, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "pe_ground", cat: "distribution", code: "PE",
    name: "פס הארקה", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, -20, 2); L(g, -11, 2, 11, 2); L(g, -7, 7, 7, 7); L(g, -3, 12, 3, 12); },
  });
})();
