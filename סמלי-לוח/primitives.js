/* =================================================================
 *  סמלי לוח — פונקציות ציור משותפות
 * ================================================================= */
(function (global) {
  "use strict";

  function L(g, a, b, c, d) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
  function R(g, x, y, w, h) { g.beginPath(); g.rect(x, y, w, h); g.stroke(); }
  function RR(g, x, y, w, h, r) {
    r = Math.min(r || 2.5, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r);
    g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
    g.stroke();
  }
  function CIR(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); }
  function ARC(g, x, y, r, a0, a1) { g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); }
  function XX(g, x, y, r) { L(g, x - r, y - r, x + r, y + r); L(g, x - r, y + r, x + r, y - r); }
  function TT(g, s, x, y, sz) {
    g.save();
    g.font = `${sz}px ui-sans-serif, system-ui, "Noto Sans Hebrew", sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s, x, y);
    g.restore();
  }
  function lead(g, fromY, toY) { L(g, 0, fromY, 0, toY); }
  function leads(g, poles, fromY, toY) {
    const step = poles <= 1 ? 0 : 14 / (poles - 1);
    const x0 = poles <= 1 ? 0 : -7;
    for (let i = 0; i < poles; i++) L(g, x0 + i * step, fromY, x0 + i * step, toY);
  }

  const MCB = {
    connMark: -14,
    slashTop: -12,
    slashBot: -7,
    boxTop: -6,
    boxH: 14,
    tripY: 1,
  };

  function mcbPoleXs(poles) {
    const step = poles <= 1 ? 0 : 14 / (poles - 1);
    const x0 = poles <= 1 ? 0 : -7;
    const xs = [];
    for (let i = 0; i < poles; i++) xs.push(x0 + i * step);
    return { xs, w: poles <= 1 ? 18 : 12 + (poles - 1) * step };
  }

  function mcbPhaseSlashes(g, xs) {
    for (const x of xs) L(g, x - 3.5, MCB.slashTop, x + 3.5, MCB.slashBot);
  }

  function mcbTripUnit(g, w) {
    L(g, -w / 2 + 3, MCB.tripY, w / 2 - 3, MCB.tripY);
    ARC(g, 0, MCB.tripY + 3, 3, Math.PI, 0);
  }

  function mcbBody(g, poles) {
    const { xs, w } = mcbPoleXs(poles);
    for (const x of xs) XX(g, x, MCB.connMark, 3);
    mcbPhaseSlashes(g, xs);
    RR(g, -w / 2, MCB.boxTop, w, MCB.boxH, 2.5);
    mcbTripUnit(g, w);
  }

  function mcbPoles(g, poles) {
    const { xs } = mcbPoleXs(poles);
    for (const x of xs) {
      L(g, x, -20, x, MCB.connMark);
    }
    mcbBody(g, poles);
    lead(g, MCB.boxTop + MCB.boxH, 20);
  }

  /** גוף מא"ז על ענף — בלי קווים חיצוניים (החיבור מהמבנה) */
  function mcbPolesOnBus(g, poles) {
    mcbBody(g, poles);
  }

  /** גוף סמל על ענף — חותך קווי חיבור חיצוניים (±20) */
  function drawBranchBody(g, drawFn) {
    g.save();
    g.beginPath();
    g.rect(-28, -12, 56, 22);
    g.clip();
    drawFn(g);
    g.restore();
  }

  global.PanelDraw = {
    L, R, RR, CIR, ARC, XX, TT, lead, leads,
    mcbPoles, mcbPolesOnBus, drawBranchBody, mcbBody,
  };
})(typeof window !== "undefined" ? window : globalThis);
