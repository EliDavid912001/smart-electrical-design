(function () {
  "use strict";
  const { lead, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "sh_selector_3pos", cat: "switches", code: "SH",
    name: "בורר 3 מצבים", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, 8, 20); CIR(g, 0, 8, 2); L(g, 0, 8, 9, -3); L(g, 0, 8, 0, -9); L(g, 0, 8, -9, -3); lead(g, -20, -9); },
  });
})();
