(function () {
  "use strict";
  const { lead, ARC, L, TT } = PanelDraw;
  window.PANEL_SYMBOL_REGISTRY = window.PANEL_SYMBOL_REGISTRY || [];
  window.PANEL_SYMBOL_REGISTRY.push({
    id: "xs_socket_3p", cat: "sockets", code: "XS",
    name: "שקע 3F", modules: 0, phases: 3, hasRating: false,
    draw(g) { lead(g, -20, -11); ARC(g, 0, -11, 11, 0, Math.PI); L(g, -11, -11, 11, -11); TT(g, "3~", 0, -5, 8); },
  });
})();
