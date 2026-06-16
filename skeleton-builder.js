/* =================================================================
 *  מחולל מבנה קווים — ענפים + הזנה נפרדת (חיבור/ניתוק ידני)
 * ================================================================= */
(function (global) {
  "use strict";

  const ROW_TOP = 80;
  const ROW_BOTTOM_PAD = 64;
  const DEFAULT_STUB = 100;
  const SYM_BOTTOM = 26;
  const SYM_TOP = 26;
  const LINK_DROP = 52;
  const BRANCH_EXTRA = 34;
  const chainStep = SYM_TOP + LINK_DROP + SYM_BOTTOM;
  const MIN_STUB = SYM_BOTTOM + SYM_TOP + BRANCH_EXTRA + 8;
  const SIDE_MARGIN = 72;
  const MIN_SPACING = 24;
  const FIXED_BRANCH_SPACING = BoardConfig ? BoardConfig.MODULE_PITCH_PX : 36;
  const ENTRY_EDGE = 10;
  const FEED_GAP = 28;

  function uid(prefix) {
    return (prefix || "sk") + Math.random().toString(36).slice(2, 9);
  }

  function line(x1, y1, x2, y2, extra) {
    return Object.assign({ id: uid("ln"), t: "line", x1, y1, x2, y2, skeleton: true }, extra || {});
  }

  function dot(x, y, kind, r, extra) {
    return Object.assign({ id: uid("dt"), t: "dot", x, y, kind: kind || "junction", r: r || 3.5, skeleton: true }, extra || {});
  }

  function snapX(x) { return Math.round(x / 4) * 4; }
  function snapY(y) { return Math.round(y / 4) * 4; }

  function normalizeOpts(opts) {
    const o = opts || {};
    return {
      widthPct: clamp(Number(o.widthPct) || 140, 80, 200),
      rowGapPct: clamp(Number(o.rowGapPct) || 100, 50, 120),
      stubLen: clamp(Number(o.stubLen) || DEFAULT_STUB, 56, 220),
    };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function slotKey(row, branch) { return row + "-" + branch; }

  function isLinked(links, key) {
    if (!links || links[key] === undefined) return true;
    return !!links[key];
  }

  function calcSpacing(maxModules, area, widthPct) {
    const scale = (Number(widthPct) || 140) / 100;
    return snapX(Math.max(MIN_SPACING, FIXED_BRANCH_SPACING * scale));
  }

  function centeredBranchXs(centerX, spacing, count) {
    const width = Math.max(0, (count - 1) * spacing);
    const xStart = snapX(centerX - width / 2);
    const xs = [];
    for (let j = 0; j < count; j++) xs.push(snapX(xStart + j * spacing));
    return xs;
  }

  function branchX(row, branch, defaultX, branchSlots) {
    if (!branchSlots) return defaultX;
    const hit = branchSlots.find((s) => s.row === row && s.branch === branch);
    return hit ? snapX(hit.x) : defaultX;
  }

  function rowBusY(row, defaultY, rowBusYMap) {
    if (rowBusYMap && rowBusYMap[row] != null) return snapY(rowBusYMap[row]);
    return snapY(defaultY);
  }

  /** קו הזנה בלבד — מקצה הגיליון עד feedEndY (לא מחובר ל-bus) */
  function drawEntry(lines, dots, centerX, area, feedDir, feedEndY) {
    const edgeY = feedDir === "bottom"
      ? snapY(area.y1 - ENTRY_EDGE)
      : snapY(area.y0 + ENTRY_EDGE);
    const endY = snapY(feedEndY);

    if (feedDir === "top") {
      lines.push(line(centerX, edgeY, centerX, endY, { skKind: "entry", skId: "entry" }));
    } else {
      lines.push(line(centerX, endY, centerX, edgeY, { skKind: "entry", skId: "entry" }));
    }
    dots.push(dot(centerX, endY, "junction", 4, { skKind: "entry", skId: "entry-end" }));
  }

  function drawFeedLinkEntry(lines, centerX, feedEndY, busY) {
    lines.push(line(centerX, feedEndY, centerX, busY, {
      skKind: "feed-link",
      skId: "feed-link-entry",
      linkKey: "entryBus",
    }));
  }

  function connectCenterToBus(lines, centerX, busY, busL, busR, row, links) {
    const key = "horiz-" + row;
    if (!isLinked(links, key)) return;
    if (centerX >= busL - 2 && centerX <= busR + 2) return;
    if (centerX < busL - 1) {
      lines.push(line(centerX, busY, busL, busY, { skKind: "trunk", skId: "trunk-h-" + row, row, linkKey: key, trunkHoriz: true }));
    } else if (centerX > busR + 1) {
      lines.push(line(busR, busY, centerX, busY, { skKind: "trunk", skId: "trunk-h-" + row, row, linkKey: key, trunkHoriz: true }));
    }
  }

  function generate(rowLayout, area, opts, config) {
    const lines = [];
    const dots = [];
    const slots = [];
    const cfg = config || {};
    const o = normalizeOpts(opts);
    const feedDir = cfg.feedDir === "bottom" ? "bottom" : "top";
    const branchSlots = cfg.branchSlots || [];
    const rowBusYMap = cfg.rowBusY || {};
    const links = cfg.feedLinks || {};
    const chainCounts = cfg.chainCounts || {};
    const rows = (rowLayout || []).filter((r) => Number(r.modules) > 0);
    if (!rows.length) return { lines, dots, slots, spacing: 0, feedDir };

    const n = rows.length;
    const maxM = Math.max(...rows.map((r) => r.modules));
    const spacing = calcSpacing(maxM, area, o.widthPct);
    const centerX = snapX(cfg.feedX != null ? cfg.feedX : area.centerX);
    const stubLen = Math.max(o.stubLen, MIN_STUB);

    const yBottom = area.y1 - ROW_BOTTOM_PAD;
    const yTop = ROW_TOP;
    const fullSpan = yBottom - yTop;
    const span = fullSpan;
    const yStart = yTop;
    const busYs = [];
    for (let i = 0; i < n; i++) {
      busYs.push(n > 1 ? yStart + (i * span) / (n - 1) : yStart);
    }

    const firstRowIdx = feedDir === "top" ? 0 : n - 1;
    const firstBusY = rowBusY(firstRowIdx, busYs[firstRowIdx], rowBusYMap);
    const defaultFeedEnd = feedDir === "top" ? firstBusY - FEED_GAP : firstBusY + FEED_GAP;
    const feedEndY = cfg.feedEndY != null ? snapY(cfg.feedEndY) : snapY(defaultFeedEnd);

    drawEntry(lines, dots, centerX, area, feedDir, feedEndY);

    if (isLinked(links, "entryBus")) {
      drawFeedLinkEntry(lines, centerX, feedEndY, firstBusY);
    }

    const rowOrder = feedDir === "top"
      ? rows.map((_, i) => i)
      : rows.map((_, i) => n - 1 - i);

    for (let oi = 0; oi < rowOrder.length; oi++) {
      const i = rowOrder[oi];
      const M = rows[i].modules;
      const busY = rowBusY(i, busYs[i], rowBusYMap);
      const defaultXs = centeredBranchXs(centerX, spacing, M);
      const xs = [];
      for (let j = 0; j < M; j++) {
        xs.push(branchX(i, j, defaultXs[j], branchSlots));
      }
      const rowXMin = Math.min(...xs);
      const rowXMax = Math.max(...xs);
      const hasNextInOrder = oi < rowOrder.length - 1;
      const nextRowIdx = hasNextInOrder ? rowOrder[oi + 1] : -1;
      const busL = Math.min(...xs);
      const busR = Math.max(...xs);

      if (M >= 1) {
        lines.push(line(busL, busY, busR, busY, { skKind: "bus", skId: "bus-" + i, row: i }));
      }

      if (oi === 0) connectCenterToBus(lines, centerX, busY, busL, busR, i, links);

      for (let j = 0; j < M; j++) {
        const bx = xs[j];
        const sk = slotKey(i, j);
        const chainN = Math.max(1, Number(chainCounts[sk]) || 1);
        const effectiveStub = stubLen + BRANCH_EXTRA + (chainN - 1) * chainStep;
        const stubEnd = busY + effectiveStub;
        const lastSymY = stubEnd - SYM_BOTTOM;
        const firstSymY = lastSymY - (chainN - 1) * chainStep;
        const wireEnd = firstSymY - SYM_TOP;
        const tailStart = lastSymY + SYM_BOTTOM;

        dots.push(dot(bx, busY, "junction", 3.5, { skKind: "branch", skId: "branch-junc-" + sk, slotKey: sk, row: i }));
        lines.push(line(bx, busY, bx, wireEnd, {
          skKind: "branch", skId: "branch-in-" + sk, slotKey: sk, row: i,
          segment: "in", chainIdx: 0,
        }));
        dots.push(dot(bx, wireEnd, "junction", 3, {
          skKind: "branch", skId: "branch-in-dot-" + sk, slotKey: sk, chainIdx: 0,
        }));

        for (let c = 1; c < chainN; c++) {
          const symYc = firstSymY + c * chainStep;
          const segTop = symYc - SYM_TOP;
          const prevBottom = firstSymY + (c - 1) * chainStep + SYM_BOTTOM;
          lines.push(line(bx, prevBottom, bx, segTop, {
            skKind: "branch",
            skId: "branch-seg-" + sk + "-" + c,
            slotKey: sk,
            row: i,
            segment: "drop",
            chainIdx: c,
          }));
          dots.push(dot(bx, segTop, "junction", 3, {
            skKind: "branch", skId: "branch-seg-dot-" + sk + "-" + c, slotKey: sk, chainIdx: c,
          }));
        }

        lines.push(line(bx, tailStart, bx, stubEnd, { skKind: "branch", skId: "branch-out-" + sk, slotKey: sk, row: i, segment: "out" }));
        dots.push(dot(bx, stubEnd, "terminal", 4, {
          skKind: "branch", skId: "branch-term-" + sk, slotKey: sk, terminal: true,
        }));
        slots.push({
          row: i, branch: j, x: bx,
          y: firstSymY, firstSymY, lastSymY,
          stubEnd, wireEnd, tailStart, chainCount: chainN,
          modules: 1, slotKey: sk, busY, xMin: rowXMin, xMax: rowXMax, spacing,
        });
      }

      if (hasNextInOrder) {
        const trunkKey = "trunk-" + i + "-" + nextRowIdx;
        if (isLinked(links, trunkKey)) {
          const nextY = rowBusY(nextRowIdx, busYs[nextRowIdx], rowBusYMap);
          lines.push(line(centerX, busY, centerX, nextY, {
            skKind: "trunk",
            skId: "trunk-v-" + i + "-" + nextRowIdx,
            linkKey: trunkKey,
            rowFrom: i,
            rowTo: nextRowIdx,
          }));
        }
        const nextM = rows[nextRowIdx].modules;
        const nextDefault = centeredBranchXs(centerX, spacing, nextM);
        const nextXs = [];
        for (let j = 0; j < nextM; j++) {
          nextXs.push(branchX(nextRowIdx, j, nextDefault[j], branchSlots));
        }
        const nextL = Math.min(...nextXs);
        const nextR = Math.max(...nextXs);
        const nextBusY = rowBusY(nextRowIdx, busYs[nextRowIdx], rowBusYMap);
        connectCenterToBus(lines, centerX, nextBusY, nextL, nextR, nextRowIdx, links);
      }
    }

    return { lines, dots, slots, spacing, centerX, feedEndY, opts: o, feedDir };
  }

  function evenSplit(totalModules, rowCount) {
    if (rowCount < 1) return [];
    const base = Math.floor(totalModules / rowCount);
    const rem = totalModules % rowCount;
    const out = [];
    for (let i = 0; i < rowCount; i++) out.push({ modules: base + (i < rem ? 1 : 0) });
    return out;
  }

  function sumModules(rowLayout) {
    return (rowLayout || []).reduce((s, r) => s + (Number(r.modules) || 0), 0);
  }

  function templateStyle(totalModules) {
    if (totalModules <= 5) return [{ modules: totalModules }];
    const rows = [{ modules: 5 }];
    let left = totalModules - 5;
    if (left <= 0) return rows;
    rows.push({ modules: Math.min(12, left) });
    left -= rows[1].modules;
    while (left > 0) {
      rows.push({ modules: Math.min(18, left) });
      left -= rows[rows.length - 1].modules;
    }
    if (rows.length > 1 && rows[rows.length - 1].modules <= 2) {
      rows[rows.length - 2].modules += rows.pop().modules;
    }
    return rows;
  }

  function defaultOpts() {
    return { widthPct: 140, rowGapPct: 100, stubLen: DEFAULT_STUB };
  }

  global.BoardSkeleton = {
    generate,
    evenSplit,
    sumModules,
    templateStyle,
    defaultOpts,
    normalizeOpts,
    slotKey,
    DEFAULT_STUB,
    SYM_BOTTOM,
    SYM_TOP,
    LINK_DROP,
    BRANCH_EXTRA,
    chainStep,
    MIN_STUB,
    MIN_SPACING,
    FIXED_BRANCH_SPACING,
    centeredBranchXs,
    calcSpacing,
    isLinked,
  };
})(typeof window !== "undefined" ? window : globalThis);
