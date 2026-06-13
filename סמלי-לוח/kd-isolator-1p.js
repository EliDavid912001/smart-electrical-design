(function () {
  "use strict";
  const { lead, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "kd_isolator_1p", cat: "protection", code: "KD",
    name: "מנתק 1F", modules: 1, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -10); CIR(g, 0, -10, 2); L(g, 0, -10, 8, 8); CIR(g, 0, 10, 2); lead(g, 10, 20); },
  });
})();
