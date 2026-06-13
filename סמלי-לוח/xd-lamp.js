(function () {
  "use strict";
  const { lead, CIR, XX } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "xd_lamp", cat: "light", code: "XD",
    name: "גוף תאורה", modules: 0, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -11); CIR(g, 0, 0, 11); XX(g, 0, 0, 7); },
  });
})();
