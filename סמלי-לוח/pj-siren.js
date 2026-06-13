(function () {
  "use strict";
  const { lead, ARC, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "pj_siren", cat: "loads", code: "PJ",
    name: "צופר", modules: 0, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -6); ARC(g, 0, 4, 10, Math.PI, 2 * Math.PI); L(g, -10, 4, 10, 4); },
  });
})();
