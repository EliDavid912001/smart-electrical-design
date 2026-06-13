(function () {
  "use strict";
  const { lead, R, L, CIR } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "bt_thermostat", cat: "control", code: "BT",
    name: "טרמוסטט", modules: 1, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -8); R(g, -8, -8, 16, 16); CIR(g, 0, 0, 5); L(g, 0, 0, 5, -4); lead(g, 10, 20); },
  });
})();
