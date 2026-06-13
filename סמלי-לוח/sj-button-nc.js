(function () {
  "use strict";
  const { lead, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "sj_button_nc", cat: "switches", code: "SJ",
    name: "לחצן NC", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, 8, 20); CIR(g, 0, 8, 2); L(g, 0, 8, 7, -2); lead(g, -20, -9); },
  });
})();
