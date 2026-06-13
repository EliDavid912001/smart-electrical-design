(function () {
  "use strict";
  const { lead, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "aux_contact_nc", cat: "control", code: "",
    name: "מגע עזר NC", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, -16, -6); L(g, -6, -6, 6, -6); lead(g, 16, 6); },
  });
})();
