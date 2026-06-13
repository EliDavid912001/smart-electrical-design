(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "fk_fuse_switch_1p", cat: "protection", code: "FK",
    name: "מנתק נתיך 1F", modules: 1, phases: 1, hasRating: true,
    draw(g) { lead(g, -20, -12); R(g, -5, -10, 10, 20); L(g, 0, -10, 0, 10); lead(g, 12, 20); },
  });
})();
