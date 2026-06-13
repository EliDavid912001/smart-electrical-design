(function () {
  "use strict";
  const { lead, R, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "fluor_lamp", cat: "light", code: "XD",
    name: "פלורסנט", modules: 0, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -6); R(g, -17, -6, 34, 12); L(g, -17, 0, 17, 0); },
  });
})();
