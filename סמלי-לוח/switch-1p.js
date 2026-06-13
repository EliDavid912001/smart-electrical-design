(function () {
  "use strict";
  const { lead, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "switch_1p", cat: "switches", code: "SH",
    name: "מתג 1F", modules: 0, phases: 1, hasRating: false,
    draw(g) { lead(g, 8, 20); CIR(g, 0, 8, 2); L(g, 0, 8, 7, -7); lead(g, -20, -9); },
  });
})();
