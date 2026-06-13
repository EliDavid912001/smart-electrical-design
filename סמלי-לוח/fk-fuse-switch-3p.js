(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "fk_fuse_switch_3p", cat: "protection", code: "FK",
    name: "מנתק נתיך 3F", modules: 3, phases: 3, hasRating: true,
    draw(g) {
      for (const dx of [-7, 0, 7]) { L(g, dx, -20, dx, -10); R(g, dx - 4, -10, 8, 20); L(g, dx, -10, dx, 10); }
      lead(g, 12, 20);
    },
  });
})();
