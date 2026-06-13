/* =================================================================
 *  סמלי לוח — אינדקס: בונה SYMBOLS + CATS מהרישום
 * ================================================================= */
(function (global) {
  "use strict";

  const CATS = [
    ["protection", "הגנות / מפסקים"],
    ["distribution", "פסי צבירה / הארקה"],
    ["loads", "צרכנים / מנועים"],
    ["sockets", "שקעים"],
    ["switches", "מתגים / לחצנים / בוררים"],
    ["light", "גופי תאורה"],
    ["control", "ממסרים / בקרה"],
    ["measure", "מדידה / CT"],
    ["misc", "שונות"],
  ];

  function buildSymbols() {
    const registry = global.PANEL_SYMBOL_REGISTRY || [];
    const symbols = {};
    for (const entry of registry) {
      symbols[entry.id] = {
        id: entry.id,
        cat: entry.cat,
        name: entry.name,
        code: entry.code || "",
        modules: entry.modules != null ? entry.modules : 0,
        phases: entry.phases != null ? entry.phases : 0,
        hasRating: !!entry.hasRating,
        draw: entry.draw,
      };
    }
    return symbols;
  }

  global.PanelSymbols = {
    FOLDER_NAME: "סמלי לוח",
    CATS,
    build: buildSymbols,
  };
})(typeof window !== "undefined" ? window : globalThis);
