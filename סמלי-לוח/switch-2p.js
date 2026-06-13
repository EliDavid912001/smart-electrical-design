(function () {
  "use strict";
  const { lead, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "switch_2p", cat: "switches", code: "SH",
    name: "מתג 2F", modules: 0, phases: 2, hasRating: false,
    draw(g) { lead(g, 8, 20); CIR(g, -4, 8, 2); CIR(g, 4, 8, 2); L(g, -4, 8, 2, -6); L(g, 4, 8, 9, -4); lead(g, -20, -9); },
  });
})();
