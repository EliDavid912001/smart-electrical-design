(function () {
  "use strict";
  const { lead, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "sh_selector_2pos", cat: "switches", code: "SH",
    name: "בורר 2 מצבים", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, 8, 20); CIR(g, 0, 8, 2); L(g, 0, 8, 8, -4); L(g, 0, 8, -8, -4); lead(g, -20, -9); },
  });
})();
