(function () {
  "use strict";
  const { R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "pg_enclosure", cat: "distribution", code: "PG",
    name: "ארון / תיבת לוח", modules: 0, phases: 0, hasRating: false,
    draw(g) { R(g, -16, -14, 32, 28); L(g, -16, -6, 16, -6); L(g, -16, 6, 16, 6); },
  });
})();
