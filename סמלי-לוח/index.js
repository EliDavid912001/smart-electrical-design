/* =================================================================
 *  סמלי לוח — אינדקס: בונה SYMBOLS + LIB_GROUPS מהרישום
 * ================================================================= */
(function (global) {
  "use strict";

  const CATS = [
    ["protection", "רכיבי הגנה"],
    ["distribution", "רכיבי הגנה"],
    ["measure", "מדידה ובקרה"],
    ["control", "מדידה ובקרה"],
    ["loads", "חיבורים ואביזרים"],
    ["sockets", "חיבורים ואביזרים"],
    ["switches", "חיבורים ואביזרים"],
    ["light", "חיבורים ואביזרים"],
    ["misc", "חיבורים ואביזרים"],
  ];

  const LIB_GROUPS = [
    { title: "רכיבי הגנה", cats: ["protection", "distribution"] },
    { title: "מדידה ובקרה", cats: ["measure", "control"] },
    { title: "חיבורים ואביזרים", cats: ["loads", "sockets", "switches", "light", "misc"] },
  ];

  const VIP_LABELS = {
    kd_mcb_1p: 'מאמ"ת חד-פאזי',
    kd_mcb_2p: 'מאמ"ת דו-פאזי',
    kd_mcb_3p: 'מאמ"ת תלת-פאזי',
    kd_mcb_4p: 'מאמ"ת 4F',
    bo_rcd_2p: "ממסר פחת",
    bo_rcd_4p: "ממסר פחת",
    rcbo_1p: 'מאמ"ת+פחת חד-פאזי',
    rcbo_3p: 'מאמ"ת+פחת תלת-פאזי',
    pc_spd_1p: "מגן ברק",
    pc_spd_3p: "מגן ברק תלת-פאזי",
    ta_multimeter: "מונה אנרגיה",
    ta_ammeter: "מונה זרם",
    ta_voltmeter: "מונה מתח",
    pb_timer_1p: "שעון שבת",
    pb_relay_1p: "ממסר זמן",
    x_terminal: "נקודת חיבור",
    w_busbar: "פס צבירה",
    pe_ground: "פס הארקה",
    n_neutral: "פס אפס",
    qa_mccb_1p: 'מא"ז ראשי חד-פאזי',
    qa_mccb_3p: 'מא"ז ראשי תלת-פאזי',
    fk_fuse_switch_1p: "מנתק נתיך",
    fc_fuse_1p: "נתיך",
    kd_isolator_1p: "מנתק",
    kf_earth_relay: "ממסר הארקה",
  };

  function displayName(entry) {
    return VIP_LABELS[entry.id] || entry.name;
  }

  function buildSymbols() {
    const registry = global.PANEL_SYMBOL_REGISTRY || [];
    const symbols = {};
    for (const entry of registry) {
      symbols[entry.id] = {
        id: entry.id,
        cat: entry.cat,
        name: displayName(entry),
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
    FOLDER_NAME: "מקור סמלים - לוח חשמל",
    CATS,
    LIB_GROUPS,
    VIP_LABELS,
    build: buildSymbols,
  };
})(typeof window !== "undefined" ? window : globalThis);
