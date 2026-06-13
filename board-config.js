/* =================================================================
 *  גדלי לוח — שורות × מודולים (18mm לכל מודול)
 * ================================================================= */
(function (global) {
  "use strict";

  const MODULE_WIDTH_MM = 18;
  const PX_PER_MM = 2.5;
  const MODULE_PITCH_PX = Math.round(MODULE_WIDTH_MM * PX_PER_MM);

  const BOARD_SIZES = [
    { id: "1x8",   rows: 1, modules: 8,   label: "1 שורה · 8 מודולים" },
    { id: "1x12",  rows: 1, modules: 12,  label: "1 שורה · 12 מודולים" },
    { id: "1x18",  rows: 1, modules: 18,  label: "1 שורה · 18 מודולים" },
    { id: "2x24",  rows: 2, modules: 24,  label: "2 שורות · 24 מודולים" },
    { id: "2x36",  rows: 2, modules: 36,  label: "2 שורות · 36 מודולים" },
    { id: "3x54",  rows: 3, modules: 54,  label: "3 שורות · 54 מודולים" },
    { id: "4x72",  rows: 4, modules: 72,  label: "4 שורות · 72 מודולים" },
    { id: "5x90",  rows: 5, modules: 90,  label: "5 שורות · 90 מודולים" },
    { id: "6x108", rows: 6, modules: 108, label: "6 שורות · 108 מודולים" },
    { id: "7x126", rows: 7, modules: 126, label: "7 שורות · 126 מודולים" },
    { id: "8x144", rows: 8, modules: 144, label: "8 שורות · 144 מודולים" },
  ];

  function getBoardSize(id) {
    return BOARD_SIZES.find((b) => b.id === id) || BOARD_SIZES[3];
  }

  global.BoardConfig = {
    SIZES: BOARD_SIZES,
    getBoardSize,
    MODULE_WIDTH_MM,
    MODULE_PITCH_PX,
  };
})(typeof window !== "undefined" ? window : globalThis);
