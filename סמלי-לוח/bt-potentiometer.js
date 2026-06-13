(function () {
  "use strict";
  const { lead, CIR, ARC } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "bt_potentiometer", cat: "switches", code: "BT",
    name: "פוטנציומטר", modules: 0, phases: 0, hasRating: false,
    draw(g) { lead(g, -20, 0); CIR(g, 0, 0, 10); ARC(g, 0, 0, 6, -Math.PI / 4, Math.PI / 4); },
  });
})();
