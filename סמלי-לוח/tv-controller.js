(function () {
  "use strict";
  const { lead, R, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "tv_controller", cat: "control", code: "TV",
    name: "בקר תדר/מתח", modules: 2, phases: 0, hasRating: false,
    draw(g) { lead(g, -20, -10); R(g, -12, -10, 24, 20); TT(g, "TV", 0, 0, 11); lead(g, 10, 20); },
  });
})();
