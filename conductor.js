/* =================================================================
 *  טבלת Iz — זרם מתמיד מרבי לפי שטח חתך S [ממ"ר]
 *  נחושת / אלומיניום × חד-מופעי / תלת-מופעי
 * ================================================================= */
(function (global) {
  "use strict";

  const CONDUCTOR_TABLE = [
    { s: 1.5, cu1: 16, cu3: 14, al1: null, al3: null },
    { s: 2.5, cu1: 22, cu3: 19, al1: null, al3: null },
    { s: 4,   cu1: 28, cu3: 25, al1: null, al3: null },
    { s: 6,   cu1: 36, cu3: 32, al1: 28, al3: 25 },
    { s: 10,  cu1: 49, cu3: 43, al1: 39, al3: 34 },
    { s: 16,  cu1: 65, cu3: 58, al1: 51, al3: 45 },
    { s: 25,  cu1: 85, cu3: 75, al1: 67, al3: 58 },
    { s: 35,  cu1: 104, cu3: 93, al1: 81, al3: 72 },
    { s: 50,  cu1: 125, cu3: 111, al1: 98, al3: 86 },
    { s: 70,  cu1: 160, cu3: 140, al1: 125, al3: 109 },
    { s: 95,  cu1: 189, cu3: 168, al1: 148, al3: 131 },
    { s: 120, cu1: 218, cu3: 194, al1: 170, al3: 150 },
  ];

  const MCB_RATINGS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 630];

  function izKey(material, phase) {
    if (material === "al") return phase === "3p" ? "al3" : "al1";
    return phase === "3p" ? "cu3" : "cu1";
  }

  /** Minimum S [mm²] where Iz > amps (next standard size when Iz equals rating). */
  function selectCrossSection(amps, material, phase) {
    const key = izKey(material || "cu", phase || "1p");
    const a = Number(amps) || 0;
    for (const row of CONDUCTOR_TABLE) {
      const iz = row[key];
      if (iz != null && iz > a) return row.s;
    }
    for (const row of CONDUCTOR_TABLE) {
      const iz = row[key];
      if (iz != null && iz >= a) return row.s;
    }
    return CONDUCTOR_TABLE[CONDUCTOR_TABLE.length - 1].s;
  }

  function getIz(crossSection, material, phase) {
    const key = izKey(material || "cu", phase || "1p");
    const row = CONDUCTOR_TABLE.find((r) => r.s === crossSection);
    return row ? row[key] : null;
  }

  function formatCrossSection(s) {
    return s % 1 === 0 ? s + "mm²" : s + "mm²";
  }

  global.Conductor = {
    TABLE: CONDUCTOR_TABLE,
    MCB_RATINGS,
    selectCrossSection,
    getIz,
    formatCrossSection,
  };
})(typeof window !== "undefined" ? window : globalThis);
