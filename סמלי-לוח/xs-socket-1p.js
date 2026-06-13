(function () {
  "use strict";
  const { lead, ARC, L } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "xs_socket_1p", cat: "sockets", code: "XS",
    name: "שקע 1F", modules: 0, phases: 1, hasRating: false,
    draw(g) { lead(g, -20, -11); ARC(g, 0, -11, 11, 0, Math.PI); L(g, -11, -11, 11, -11); L(g, 0, -11, 0, -2); },
  });
})();
