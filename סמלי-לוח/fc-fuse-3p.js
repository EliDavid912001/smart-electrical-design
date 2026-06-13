(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "fc_fuse_3p", cat: "protection", code: "FC",
    name: "נתיך 3F", modules: 3, phases: 3, hasRating: true,
    draw(g) {
      for (const dx of [-7, 0, 7]) { L(g, dx, -20, dx, -12); R(g, dx - 4, -12, 8, 24); L(g, dx, -12, dx, 12); }
      lead(g, 12, 20);
    },
  });
})();
