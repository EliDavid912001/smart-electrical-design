(function () {
  "use strict";
  const { lead, XX, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "fc_fuse_1p", cat: "protection", code: "FC",
    name: "נתיך 1F", modules: 1, phases: 1, hasRating: true,
    draw(g) { lead(g, -20, -12); R(g, -5, -12, 10, 24); L(g, 0, -12, 0, 12); lead(g, 12, 20); },
  });
})();
