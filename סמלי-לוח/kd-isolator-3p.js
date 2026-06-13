(function () {
  "use strict";
  const { lead, CIR, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "kd_isolator_3p", cat: "protection", code: "KD",
    name: "מנתק 3F", modules: 3, phases: 3, hasRating: false,
    draw(g) {
      for (const dx of [-7, 0, 7]) { L(g, dx, -20, dx, -10); CIR(g, dx, -10, 2); L(g, dx, -10, dx + 5, 6); CIR(g, dx, 10, 2); }
      lead(g, 10, 20);
    },
  });
})();
