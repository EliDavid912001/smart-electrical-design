/* =================================================================
 *  Draftsman — single-line diagram builder for electrical panels
 *  Vanilla JS + canvas. Offline-first (localStorage).
 * ================================================================= */

(function () {
  "use strict";

  const PAPER = { W: 1680, H: 1150, band: 36, titleH: 74 };

  function sheetContentRect() {
    const band = PAPER.band;
    return {
      x0: band,
      y0: band + PAPER.titleH,
      x1: PAPER.W - band,
      y1: PAPER.H - band,
    };
  }
  const GRID = 20;
  const STORAGE_KEY = "draftsman.sld.v8";
  const TERMS_KEY = "draftsman.sld.terms.v1";
  const EXPORT_DISCLAIMER_HE = "לצרכי תכנון בלבד. חובה לאשר מול חשמלאי מוסמך.";
  const EXPORT_DISCLAIMER_EN = "For planning purposes only. Must be approved by a licensed electrician.";
  const SKELETON_VERSION = 20;
  const MAX_CHAIN = 4;
  const MIN_SCALE = 0.2, MAX_SCALE = 8, HISTORY_LIMIT = 120;
  const DRAG_THRESHOLD = 6;
  const BRANCH_DRAG_THRESHOLD = 3;

  const SYMBOLS = PanelSymbols.build();
  const CATS = PanelSymbols.CATS;
  const LIB_GROUPS = PanelSymbols.LIB_GROUPS || CATS.map(([cat, title]) => ({ title, cats: [cat] }));

  const state = {
    meta: {
      title: "לוח חדש",
      author: "",
      date: today(),
      file: "לוח ראשי",
      folio: "1/1",
      boardSizeId: "2x24",
      conductorMaterial: "cu",
      conductorPhase: "1p",
      rowLayout: [],
      branchSlots: [],
      skeletonBuilt: false,
      skeletonVersion: 0,
      skeletonOpts: { widthPct: 140, rowGapPct: 100, stubLen: 110 },
      feedDir: "top",
      feedAlign: "center",
      feedX: null,
      feedEndY: null,
      feedLinks: {},
      skLineOverrides: {},
      wireCrossSections: {},
      rowBusY: {},
    },
    elements: [],
    selectedId: null,
  };
  const view = { scale: 1, tx: 0, ty: 0 };
  let tool = "select";
  let placeSym = null;
  const undoStack = [], redoStack = [];
  let overflowWarned = false;

  const canvas = document.getElementById("sheet");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const ui = {
    tools: $("tools"), rotateBtn: $("rotateBtn"), delBtn: $("delBtn"), fitViewBtn: $("fitViewBtn"),
    undo: $("undoBtn"), redo: $("redoBtn"), exportBtn: $("exportBtn"), exportPdfBtn: $("exportPdfBtn"), printBtn: $("printBtn"),
    libOpenBtn: $("libOpenBtn"), libraryBackdrop: $("libraryBackdrop"),
    libToggle: $("libToggle"), library: $("library"), libBody: $("libBody"),
    libClose: $("libClose"), libHint: $("libHint"),
    boardChip: $("boardChip"), boardChipLabel: $("boardChipLabel"),
    sheetInfoBtn: $("sheetInfoBtn"), sheetTitleLabel: $("sheetTitleLabel"),
    spacingBtn: $("spacingBtn"), spacingPanel: $("spacingPanel"), spacingClose: $("spacingClose"),
    spacingBackdrop: $("spacingBackdrop"),
    spacingNoSkeleton: $("spacingNoSkeleton"), spacingBuildBtn: $("spacingBuildBtn"),
    emptyHint: $("emptyHint"), toast: $("toast"), textInput: $("textInput"),
    sheetModal: $("sheetModal"), s_title: $("s_title"), s_author: $("s_author"),
    s_date: $("s_date"), s_file: $("s_file"), s_folio: $("s_folio"),
    s_board: $("s_board"), s_material: $("s_material"), s_phase: $("s_phase"),
    s_moduleStatus: $("s_moduleStatus"),
    s_rowList: $("s_rowList"), s_rowSum: $("s_rowSum"),
    s_addRow: $("s_addRow"), s_evenSplit: $("s_evenSplit"), s_templateStyle: $("s_templateStyle"),     s_buildSkeleton: $("s_buildSkeleton"),
    s_widthPct: $("s_widthPct"), s_widthPctVal: $("s_widthPctVal"),
    s_stubLen: $("s_stubLen"), s_stubLenVal: $("s_stubLenVal"),
    s_spacingPreview: $("s_spacingPreview"),
    s_save: $("s_save"), s_cancel: $("s_cancel"), s_newProject: $("s_newProject"),
    welcomeScreen: $("welcomeScreen"), welcomeBoardGrid: $("welcomeBoardGrid"),
    welcomeStart: $("welcomeStart"), welcomeContinue: $("welcomeContinue"),
    welcomeBoardHint: $("welcomeBoardHint"),
    splashScreen: $("splash-screen"), startAppBtn: $("start-app-btn"),
    symEditPanel: $("symEditPanel"), symEditBackdrop: $("symEditBackdrop"), symEditTitle: $("symEditTitle"), symEditName: $("symEditName"),
    symEditClose: $("symEditClose"), symEditDelete: $("symEditDelete"), symEditApply: $("symEditApply"),
    symEditRating: $("symEditRating"),
    sym_curve: $("sym_curve"), sym_rating: $("sym_rating"),
    sym_material: $("sym_material"), sym_phase: $("sym_phase"),
    sym_cross: $("sym_cross"), sym_desc: $("sym_desc"),
    feedPopup: $("feedPopup"), feedLinkToggle: $("feedLinkToggle"), feedLinkLabel: $("feedLinkLabel"),
    branchPopup: $("branchPopup"),
    branchPopupHint: $("branchPopupHint"),
    branchAddBtn: $("branchAddBtn"),
    branchEditBtn: $("branchEditBtn"),
    branchPopupPicker: $("branchPopupPicker"),
    branchPopupPickerGrid: $("branchPopupPickerGrid"),
    branchChainBtn: $("branchChainBtn"),
    branchClearSymBtn: $("branchClearSymBtn"),
    branchDeleteBtn: $("branchDeleteBtn"),
    terminalPopup: $("terminalPopup"),
    terminalPopupHint: $("terminalPopupHint"),
    terminalAddBtn: $("terminalAddBtn"),
    terminalCloseBtn: $("terminalCloseBtn"),
    branchWireCross: $("branchWireCross"),
    wirePopup: $("wirePopup"), wirePopupHint: $("wirePopupHint"),
    wire_cross: $("wire_cross"), wireApplyBtn: $("wireApplyBtn"), wireClearBtn: $("wireClearBtn"),
    termsOverlay: $("termsOverlay"), termsScroll: $("termsScroll"),
    termsCheckbox: $("termsCheckbox"), termsAcceptBtn: $("termsAcceptBtn"),
    termsScrollHint: $("termsScrollHint"),
  };
  let spacingLiveRaf = 0;
  let spacingPanelOpen = false;
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let symEditEl = null;
  let skDrag = null;
  let feedPopupVisible = false;
  let selectedFeedLinkKey = null;
  let selectedBranchKey = null;
  let selectedSkLineId = null;
  let branchPointer = null;
  let terminalPointer = null;
  let symPointer = null;
  let moduleTapPointer = null;
  let skLineTapPointer = null;
  let inputIsTouch = false;
  let lastModuleTap = { time: 0, sx: 0, sy: 0, slotKey: null };
  let lastSkLineTap = { time: 0, sx: 0, sy: 0, skId: null };
  const MODULE_TAP_MS = 800;
  const SYM_RADIAL_DELAY_MS = 550;
  const MODULE_CLICK_SLOP = 14;
  let symRadialTimer = null;
  let suppressRadialUntil = 0;

  function cancelSymRadialTimer() {
    if (symRadialTimer) {
      clearTimeout(symRadialTimer);
      symRadialTimer = null;
    }
  }

  function scheduleSymRadial(el, sx, sy) {
    cancelSymRadialTimer();
    if (!el) return;
    const symId = el.id;
    symRadialTimer = setTimeout(() => {
      symRadialTimer = null;
      if (Date.now() < suppressRadialUntil) return;
      const live = state.elements.find((e) => e.id === symId);
      if (live) presentSymActions(live, sx, sy);
    }, SYM_RADIAL_DELAY_MS);
  }

  function isCoarsePointer() {
    return window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;
  }

  function useModuleTapUX() {
    return inputIsTouch || isCoarsePointer();
  }

  function moduleHitPad() {
    return (useModuleTapUX() || innerWidth <= 768) ? 32 : 24;
  }

  function beginModuleTap(sx, sy, w, skId, slotKey, opts) {
    moduleTapPointer = {
      sx, sy, wx: w.x, wy: w.y,
      skId: skId || null,
      slotKey,
      moved: false,
      dragEnabled: !(opts && opts.noDrag),
    };
    state.selectedId = null;
    selectedBranchKey = null;
    render();
    syncUI();
  }

  function beginBusRowTap(sx, sy, w, row) {
    moduleTapPointer = {
      sx, sy, wx: w.x, wy: w.y,
      skId: "bus-" + row,
      slotKey: null,
      row,
      moved: false,
      dragEnabled: true,
    };
    state.selectedId = null;
    selectedBranchKey = null;
    selectedSkLineId = "bus-" + row;
    render();
    syncUI();
  }

  function rowFromSlotKey(slotKey) {
    if (!slotKey) return null;
    const r = Number(String(slotKey).split("-")[0]);
    return Number.isFinite(r) ? r : null;
  }

  function isRowBusSkId(skId) {
    return !!(skId && skId.startsWith("bus-"));
  }

  function selectModuleAtPointer(ptr) {
    if (!ptr) return;
    const w = s2w(ptr.sx, ptr.sy);
    const hitSym = symAt(w.x, w.y);
    if (hitSym && hitSym.slotKey) {
      state.selectedId = hitSym.id;
      selectedBranchKey = hitSym.slotKey;
      render();
      syncUI();
      return;
    }
    const slotKey = ptr.slotKey || resolveModuleSlotAt(w.x, w.y);
    if (!slotKey) return;
    selectedBranchKey = slotKey;
    const syms = symsOnSlot(slotKey);
    state.selectedId = syms.length ? syms[0].id : null;
    hideBranchPopup();
    render();
    syncUI();
  }

  function openModulePopup(sx, sy, w, opts) {
    if (!state.meta.skeletonBuilt) {
      toast("קודם בנה מבנה קווים — «בנה מבנה קווים» בפרטי גיליון");
      return false;
    }
    const slotKey = (opts && opts.slotKey) || resolveModuleSlotAt(w.x, w.y);
    if (!slotKey) {
      toast("לא זוהה מודול — לחץ על הקו הכחול או על הסמל");
      return false;
    }
    const chainMode = !!(opts && opts.chainMode) || !!skeletonTerminalAt(w.x, w.y);
    showBranchPopup(sx, sy, slotKey, { chainMode });
    return true;
  }

  /** לחיצה על מודול — חלון מודול (ריק) או עריכת רכיב (עם סמל) */
  function handleModuleClick(sx, sy, w, slotKey) {
    cancelSymRadialTimer();
    suppressRadialUntil = Date.now() + MODULE_TAP_MS;
    symPointer = null;
    moduleTapPointer = null;
    if (!state.meta.skeletonBuilt) {
      toast("קודם בנה מבנה קווים — «בנה מבנה קווים» בפרטי גיליון");
      return false;
    }
    const key = slotKey || resolveModuleSlotAtClick(w.x, w.y);
    if (!key) {
      toast("לא זוהה מודול — לחץ על הקו הכחול");
      return false;
    }
    const syms = symsOnSlot(key);
    const chainMode = !!skeletonTerminalAt(w.x, w.y);
    const hitSym = symAt(w.x, w.y);
    selectedBranchKey = key;
    branchPopupEditSymId = (hitSym && hitSym.slotKey === key)
      ? hitSym.id
      : (syms.length ? syms[0].id : null);
    showBranchPopup(sx, sy, key, { chainMode });
    return true;
  }

  function handleModuleDoubleClick(sx, sy, w, slotKey) {
    return handleModuleClick(sx, sy, w, slotKey);
  }

  function resolveModuleSlotAtClick(wx, wy) {
    const hitSym = symAt(wx, wy);
    if (hitSym && hitSym.slotKey) return hitSym.slotKey;
    return resolveModuleSlotAt(wx, wy);
  }

  function canDeleteModule(slotKey) {
    const slot = findSlotByKey(slotKey);
    if (!slot) return false;
    const row = state.meta.rowLayout[slot.row];
    return !!(row && row.modules > 1);
  }

  function finishModuleTap(sx, sy) {
    const w = s2w(sx, sy);
    if (useModuleTapUX()) {
      const hitSym = symAt(w.x, w.y);
      if (hitSym && hitSym.slotKey) {
        presentSymActions(hitSym, sx, sy);
        return true;
      }
    }
    return openModulePopup(sx, sy, w);
  }

  function skLineHitDist(skKind) {
    const base = (useModuleTapUX() || innerWidth <= 768) ? 30 : 22;
    return skKind === "entry" ? base + 6 : base;
  }

  function beginSkLineTap(sx, sy, w, skLine) {
    skLineTapPointer = {
      sx, sy, wx: w.x, wy: w.y,
      skId: skLine.skId,
      meta: skLineMenuMeta(skLine, sx, sy),
      moved: false,
    };
    state.selectedId = null;
    selectedBranchKey = null;
    render();
    syncUI();
  }

  function finishSkLineTap(sx, sy) {
    if (!skLineTapPointer) return false;
    const meta = skLineTapPointer.meta;
    openSkLineClickMenu(meta);
    lastSkLineTap.time = 0;
    return true;
  }
  let skPointer = null;
  let branchDragHintShown = false;
  let branchPlaceChainIdx = 0;
  let branchPlaceSlot = null;
  let pendingPlaceSlot = null;
  let selectedWireSkId = null;
  let lastPointer = { sx: 0, sy: 0 };

  function today() {
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function uid() { return "e" + Math.random().toString(36).slice(2, 9); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function snap(v) { return Math.round(v / GRID) * GRID; }

  function toast(m) {
    ui.toast.textContent = m;
    ui.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => ui.toast.classList.remove("show"), 2600);
  }

  let welcomeBoardId = "2x24";

  function hasStoredProject() {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch (e) { return false; }
  }

  function rowLayoutMatchesBoard(boardId, layout) {
    const board = BoardConfig.getBoardSize(boardId);
    const rows = layout || [];
    if (!rows.length) return false;
    return BoardSkeleton.sumModules(rows) === board.modules;
  }

  function applyRowLayoutForBoard(boardId, rowCount) {
    const board = BoardConfig.getBoardSize(boardId);
    const count = rowCount != null ? rowCount : board.rows;
    state.meta.rowLayout = BoardSkeleton.evenSplit(board.modules, Math.max(1, count));
    if (ui.s_board) ui.s_board.value = boardId;
    renderRowLayoutEditor();
  }

  function branchSpacingForRow(moduleCount) {
    const area = drawingArea();
    const opts = state.meta.skeletonOpts || BoardSkeleton.defaultOpts();
    return BoardSkeleton.calcSpacing(moduleCount, area, opts.widthPct || 140);
  }

  function recalcBranchSlotsFromSpacing() {
    if (!state.meta.skeletonBuilt || !state.meta.rowLayout || !state.meta.rowLayout.length) return;
    const area = drawingArea();
    const centerX = state.meta.feedX != null ? state.meta.feedX : area.centerX;
    if (!state.meta.branchSlots) state.meta.branchSlots = [];
    state.meta.rowLayout.forEach((row, ri) => {
      const M = row.modules;
      if (!M) return;
      const spacing = branchSpacingForRow(M);
      const xs = BoardSkeleton.centeredBranchXs(centerX, spacing, M, area);
      for (let j = 0; j < M; j++) {
        const sk = BoardSkeleton.slotKey(ri, j);
        let hit = state.meta.branchSlots.find((s) => s.row === ri && s.branch === j);
        if (!hit) {
          hit = { row: ri, branch: j, slotKey: sk, x: xs[j] };
          state.meta.branchSlots.push(hit);
        } else {
          hit.x = xs[j];
          hit.userBranchX = false;
        }
      }
    });
  }

  function ensureSkeletonOpts() {
    state.meta.skeletonOpts = BoardSkeleton.normalizeOpts(state.meta.skeletonOpts || BoardSkeleton.defaultOpts());
    return state.meta.skeletonOpts;
  }

  function applySpacingOptsLive() {
    if (!state.meta.skeletonBuilt || !hasSkeletonLines()) {
      syncSkeletonOptsLabels();
      return;
    }
    const prev = Object.assign({}, state.meta.skeletonOpts || BoardSkeleton.defaultOpts());
    const next = readSkeletonOptsFromUI();
    syncSkeletonOptsLabels();
    state.meta.skeletonOpts = next;
    if (Number(prev.widthPct) !== Number(next.widthPct)) recalcBranchSlotsFromSpacing();
    if (spacingLiveRaf) cancelAnimationFrame(spacingLiveRaf);
    spacingLiveRaf = requestAnimationFrame(() => {
      spacingLiveRaf = 0;
      rebuildSkeleton(false, true);
      render();
    });
  }

  function commitSpacingOptsSave() {
    if (!state.meta.skeletonBuilt || !hasSkeletonLines()) return;
    state.meta.skeletonOpts = readSkeletonOptsFromUI();
    save();
  }

  function syncSpacingPanelState() {
    const built = !!state.meta.skeletonBuilt && hasSkeletonLines();
    if (state.meta.skeletonBuilt && !hasSkeletonLines()) {
      state.meta.skeletonBuilt = false;
      state.meta.branchSlots = [];
    }
    [ui.s_widthPct, ui.s_stubLen].forEach((el) => {
      if (el) el.disabled = false;
    });
    if (ui.spacingNoSkeleton) ui.spacingNoSkeleton.classList.toggle("hidden", built);
    if (ui.spacingBuildBtn) {
      ui.spacingBuildBtn.classList.toggle("hidden", false);
      ui.spacingBuildBtn.textContent = built ? "בנה מחדש מבנה קווים" : "בנה מבנה קווים";
    }
  }

  function openSpacingPanel() {
    applySkeletonOptsToUI(state.meta.skeletonOpts);
    syncSpacingPanelState();
    syncSkeletonOptsLabels();
    spacingPanelOpen = true;
    if (ui.library) ui.library.classList.add("hidden");
    if (window.RadialMenu) RadialMenu.hide();
    ui.spacingPanel.classList.add("is-open");
    ui.spacingPanel.setAttribute("aria-hidden", "false");
    ui.spacingBackdrop?.classList.add("is-open");
    ui.spacingBackdrop?.setAttribute("aria-hidden", "false");
    ui.spacingBtn?.classList.add("is-active");
    document.body.classList.add("spacing-panel-open");
    syncUI();
  }

  function closeSpacingPanel() {
    spacingPanelOpen = false;
    ui.spacingPanel.classList.remove("is-open");
    ui.spacingPanel.setAttribute("aria-hidden", "true");
    ui.spacingBackdrop?.classList.remove("is-open");
    ui.spacingBackdrop?.setAttribute("aria-hidden", "true");
    ui.spacingBtn?.classList.remove("is-active");
    document.body.classList.remove("spacing-panel-open");
    commitSpacingOptsSave();
    syncUI();
  }

  function toggleSpacingPanel() {
    if (spacingPanelOpen) closeSpacingPanel();
    else openSpacingPanel();
  }

  function drawingArea() {
    const r = sheetContentRect();
    return {
      x0: r.x0 + 40,
      x1: r.x1 - 40,
      y0: r.y0,
      y1: r.y1,
      centerX: PAPER.W / 2,
    };
  }

  function hasSkeletonLines() {
    return state.elements.some((e) => e.skeleton && (e.t === "line" || e.t === "dot"));
  }

  function readRowLayoutFromUI() {
    const fromState = state.meta.rowLayout && state.meta.rowLayout.length
      ? clone(state.meta.rowLayout)
      : null;
    if (!ui.s_rowList) return fromState || [];
    const inputs = ui.s_rowList.querySelectorAll("input[data-row-modules]");
    if (!inputs.length) return fromState || [];
    const rows = [];
    inputs.forEach((inp) => {
      const n = parseInt(inp.value, 10);
      if (n > 0) rows.push({ modules: n });
    });
    return rows.length ? rows : (fromState || []);
  }

  function resolveRowLayoutForBuild() {
    const boardId = ui.s_board?.value || state.meta.boardSizeId || "2x24";
    const board = BoardConfig.getBoardSize(boardId);
    let layout = readRowLayoutFromUI();
    if (!layout.length && state.meta.rowLayout && state.meta.rowLayout.length) {
      layout = clone(state.meta.rowLayout);
    }
    const sum = BoardSkeleton.sumModules(layout);
    if (!layout.length || sum !== board.modules) {
      const rowCount = layout.length || (state.meta.rowLayout || []).length || board.rows;
      layout = BoardSkeleton.evenSplit(board.modules, Math.max(1, rowCount));
      state.meta.rowLayout = clone(layout);
      if (ui.s_board) ui.s_board.value = board.id;
      renderRowLayoutEditor();
      if (sum !== board.modules && sum > 0) {
        toast(`תוקנה חלוקת שורות — ${layout.length} שורות · ${board.modules} ענפים`);
      }
    }
    return { board, layout };
  }

  function readSkeletonOptsFromUI() {
    return BoardSkeleton.normalizeOpts({
      widthPct: ui.s_widthPct ? Number(ui.s_widthPct.value) : 140,
      stubLen: ui.s_stubLen ? Number(ui.s_stubLen.value) : 100,
    });
  }

  function syncSkeletonOptsLabels() {
    if (!ui.s_widthPct) return;
    ui.s_widthPctVal.textContent = ui.s_widthPct.value + "%";
    ui.s_stubLenVal.textContent = ui.s_stubLen.value + "px";
    const board = BoardConfig.getBoardSize(state.meta.boardSizeId || ui.s_board?.value || "2x24");
    const layout = (state.meta.rowLayout && state.meta.rowLayout.length)
      ? state.meta.rowLayout
      : readRowLayoutFromUI();
    const maxM = layout.length ? Math.max(...layout.map((r) => r.modules)) : board.modules;
    const preview = BoardSkeleton.generate(
      layout.length ? layout : [{ modules: maxM }],
      drawingArea(),
      readSkeletonOptsFromUI()
    );
    if (ui.s_spacingPreview) {
      const spacing = branchSpacingForRow(maxM);
      const stub = readSkeletonOptsFromUI().stubLen;
      ui.s_spacingPreview.textContent =
        "מרווח מודולים: ~" + spacing + "px · אורך מודול: " + stub + "px";
    }
  }

  function applySkeletonOptsToUI(opts) {
    const o = BoardSkeleton.normalizeOpts(opts || state.meta.skeletonOpts);
    if (!ui.s_widthPct) return;
    ui.s_widthPct.value = String(o.widthPct);
    ui.s_stubLen.value = String(o.stubLen);
    syncSkeletonOptsLabels();
  }

  function updateRowLayoutSum() {
    const board = BoardConfig.getBoardSize(ui.s_board.value);
    const layout = readRowLayoutFromUI();
    const sum = BoardSkeleton.sumModules(layout);
    const ok = sum === board.modules;
    ui.s_rowSum.textContent = `סה"כ ענפים: ${sum} / ${board.modules}`;
    ui.s_rowSum.classList.toggle("over", !ok);
    if (ui.s_buildSkeleton) {
      ui.s_buildSkeleton.disabled = false;
      ui.s_buildSkeleton.title = ok
        ? "בנה ענפים וקווים על הגיליון"
        : `סה"כ ${sum} — יתוקן אוטומטית ל-${board.modules} בלחיצה`;
    }
    syncSkeletonOptsLabels();
  }

  function renderRowLayoutEditor() {
    if (!ui.s_rowList) return;
    let layout = state.meta.rowLayout;
    if (!layout) layout = [];
    ui.s_rowList.innerHTML = "";
    if (!layout.length) {
      const hint = document.createElement("p");
      hint.className = "row-layout-empty";
      hint.textContent = "בחר גודל לוח — חלוקה תיווצר אוטומטית";
      ui.s_rowList.appendChild(hint);
      updateRowLayoutSum();
      return;
    }
    layout.forEach((row, idx) => {
      const div = document.createElement("div");
      div.className = "row-layout-item";
      const lbl = document.createElement("label");
      lbl.textContent = "שורה " + (idx + 1);
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "1";
      inp.max = "144";
      inp.value = String(row.modules);
      inp.dataset.rowModules = "1";
      inp.addEventListener("input", updateRowLayoutSum);
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "row-remove";
      rm.textContent = "✕";
      rm.title = "הסר שורה";
      rm.addEventListener("click", () => {
        const cur = readRowLayoutFromUI();
        if (cur.length <= 1) {
          toast("חייבה להישאר לפחות שורה אחת");
          return;
        }
        const board = BoardConfig.getBoardSize(ui.s_board.value);
        state.meta.rowLayout = BoardSkeleton.evenSplit(board.modules, cur.length - 1);
        renderRowLayoutEditor();
        toast("שורה הוסרה — חלוקה מחדש");
      });
      div.appendChild(lbl);
      div.appendChild(inp);
      div.appendChild(rm);
      ui.s_rowList.appendChild(div);
    });
    updateRowLayoutSum();
  }

  function applyTemplateStyle() {
    const board = BoardConfig.getBoardSize(ui.s_board.value);
    state.meta.rowLayout = BoardSkeleton.templateStyle(board.modules);
    renderRowLayoutEditor();
    toast("פריסה בסגנון מקרא: שורה עליונה קטנה → שורות צמודות");
  }

  function applyEvenSplit() {
    const board = BoardConfig.getBoardSize(ui.s_board.value);
    const cur = readRowLayoutFromUI();
    const rowCount = cur.length > 0 ? cur.length : board.rows;
    applyRowLayoutForBoard(board.id, rowCount);
    toast("חלוקה שווה: " + rowCount + " שורות · " + board.modules + " ענפים");
  }

  function hideBranchPopup() {
    if (!ui.branchPopup) return;
    ui.branchPopup.classList.add("hidden");
    delete ui.branchPopup.dataset.slotKey;
    if (ui.branchPopupPicker) ui.branchPopupPicker.classList.add("hidden");
    branchPickMode = "new";
    branchPopupEditSymId = null;
  }

  function ensureBranchPopupVisible(slotKey) {
    if (!ui.branchPopup || ui.branchPopup.classList.contains("hidden")) {
      showBranchPopup(lastPointer.sx, lastPointer.sy, slotKey, {
        chainMode: modulePopupChainMode,
      });
    }
  }

  function openInlineSymbolPicker(slotKey, chainIdx, hint) {
    ensureBranchPopupVisible(slotKey);
    selectedBranchKey = slotKey;
    setPendingPlace(slotKey, chainIdx);
    hideLibrary();
    hideTerminalPopup();
    closeSymEdit();
    toggleBranchPopupPicker(true);
    if (hint) toast(hint);
  }

  function hideTerminalPopup() {
    if (!ui.terminalPopup) return;
    ui.terminalPopup.classList.add("hidden");
  }

  function showTerminalPopup(sx, sy, slotKey) {
    if (!ui.terminalPopup) return;
    hideBranchPopup();
    hideFeedPopup();
    selectedBranchKey = slotKey;
    const syms = symsOnSlot(slotKey);
    if (ui.terminalPopupHint) {
      ui.terminalPopupHint.textContent = syms.length
        ? "לחץ «הוסף סמל נוסף» ובחר סמל מ״סמלי לוח״"
        : "לחץ «הוסף סמל» ובחר סמל ראשון";
    }
    if (ui.terminalAddBtn) {
      ui.terminalAddBtn.textContent = syms.length ? "➕ הוסף סמל נוסף" : "➕ הוסף סמל";
      ui.terminalAddBtn.disabled = syms.length >= MAX_CHAIN;
    }
    ui.terminalPopup.classList.remove("hidden");
    ui.terminalPopup.dataset.slotKey = slotKey;
    placeFloatingPopup(ui.terminalPopup, sx, sy, 220, 140);
    syncUI();
  }

  function symsOnSlot(slotKey) {
    return state.elements
      .filter((e) => e.t === "sym" && e.slotKey === slotKey)
      .sort((a, b) => (a.chainIdx || 0) - (b.chainIdx || 0));
  }

  function symOnSlot(slotKey) {
    return symsOnSlot(slotKey)[0] || null;
  }

  function getChainCountsFromElements() {
    const counts = {};
    for (const el of state.elements) {
      if (el.t !== "sym" || !el.slotKey) continue;
      counts[el.slotKey] = Math.max(counts[el.slotKey] || 0, (el.chainIdx || 0) + 1);
    }
    return counts;
  }

  function symPosForSlot(slotKey, chainIdx) {
    const slot = findSlotByKey(slotKey);
    const idx = chainIdx || 0;
    const step = BoardSkeleton.chainStep;
    if (slot) {
      const firstY = slot.firstSymY != null ? slot.firstSymY : slot.y;
      if (firstY == null || slot.x == null) return null;
      return { x: snap(clampX(slot.x)), y: snap(clampY(firstY + idx * step)) };
    }
    const inLn = findSkLine("branch-in-" + slotKey);
    if (!inLn) return null;
    const firstY = inLn.y2 + BoardSkeleton.SYM_TOP;
    return { x: snap(clampX(inLn.x1)), y: snap(clampY(firstY + idx * step)) };
  }

  function syncChainSymPositions() {
    if (!state.meta.skeletonBuilt) return;
    for (const slot of state.meta.branchSlots || []) {
      const syms = symsOnSlot(slot.slotKey);
      syms.forEach((sym, i) => {
        sym.chainIdx = i;
        const pos = symPosForSlot(slot.slotKey, i);
        if (pos) {
          sym.x = pos.x;
          sym.y = pos.y;
        }
      });
    }
    for (const el of state.elements) {
      if (el.t !== "sym" || !el.slotKey) continue;
      if (findSlotByKey(el.slotKey)) continue;
      const pos = symPosForSlot(el.slotKey, el.chainIdx);
      if (pos) {
        el.x = pos.x;
        el.y = pos.y;
      }
    }
  }

  function syncLibraryBackdrop() {
    if (ui.libraryBackdrop) {
      ui.libraryBackdrop.classList.add("hidden");
      ui.libraryBackdrop.classList.remove("is-open");
    }
    const open = ui.library && !ui.library.classList.contains("hidden");
    if (ui.libOpenBtn) ui.libOpenBtn.classList.toggle("is-active", !!open);
  }

  function clearPendingPlace() {
    pendingPlaceSlot = null;
    branchPlaceSlot = null;
    branchPlaceChainIdx = 0;
  }

  function setPendingPlace(slotKey, chainIdx) {
    const idx = chainIdx != null ? chainIdx : 0;
    pendingPlaceSlot = { slotKey, chainIdx: idx };
    branchPlaceSlot = slotKey;
    branchPlaceChainIdx = idx;
  }

  function resolvePlaceTarget() {
    if (pendingPlaceSlot && pendingPlaceSlot.slotKey) return pendingPlaceSlot;
    if (branchPlaceSlot) return { slotKey: branchPlaceSlot, chainIdx: branchPlaceChainIdx || 0 };
    if (selectedBranchKey) return { slotKey: selectedBranchKey, chainIdx: 0 };
    return null;
  }

  function hideLibrary() {
    if (!ui.library) return;
    ui.library.classList.add("hidden");
    ui.library.classList.remove("library--picker");
    clearPendingPlace();
    syncLibraryBackdrop();
    syncUI();
  }

  function showLibraryForSlot(slotKey, chainIdx, hint, opts) {
    setPendingPlace(slotKey, chainIdx);
    selectedBranchKey = slotKey;
    if (!(opts && opts.keepModulePopup)) hideBranchPopup();
    hideTerminalPopup();
    if (!(opts && opts.keepSymEdit)) closeSymEdit();
    if (ui.library) {
      ui.library.classList.remove("hidden");
      ui.library.classList.toggle("library--picker", !!(opts && opts.pickerMode));
    }
    if (ui.libHint) {
      ui.libHint.textContent = hint || "לחץ על סמל — יתווסף למודול";
    }
    syncLibraryBackdrop();
    syncUI();
    render();
    requestAnimationFrame(() => {
      if (ui.libBody) ui.libBody.scrollTop = 0;
    });
  }

  function toggleLibrary() {
    if (!ui.library) return;
    const opening = ui.library.classList.contains("hidden");
    if (opening && !state.meta.skeletonBuilt) {
      toast("קודם בנה מבנה קווים — «בנה מבנה קווים» בפרטי גיליון");
      return;
    }
    ui.library.classList.toggle("hidden");
    if (!opening) {
      ui.library.classList.remove("library--picker");
      clearPendingPlace();
      disarm();
    } else {
      ui.libHint.textContent = "לחץ על מודול · אחר כך לחץ על סמל";
      requestAnimationFrame(() => {
        if (ui.libBody) ui.libBody.scrollTop = 0;
      });
    }
    syncLibraryBackdrop();
    syncUI();
  }

  let modulePopupChainMode = false;
  let branchPickMode = "new";
  let branchPopupEditSymId = null;
  let branchPopupAnchor = { sx: 0, sy: 0 };

  function repositionBranchPopup() {
    if (!ui.branchPopup || ui.branchPopup.classList.contains("hidden")) return;
    const pickerOpen = ui.branchPopupPicker && !ui.branchPopupPicker.classList.contains("hidden");
    const popW = pickerOpen ? Math.min(400, innerWidth - 16) : 220;
    const popH = pickerOpen ? Math.min(560, innerHeight - 16) : 220;
    placeFloatingPopup(ui.branchPopup, branchPopupAnchor.sx, branchPopupAnchor.sy, popW, popH);
    ui.branchPopup.style.maxHeight = popH + "px";
    ui.branchPopup.style.overflowY = pickerOpen ? "auto" : "";
  }

  function createLibItem(id, onPick) {
    const sym = SYMBOLS[id];
    if (!sym) return null;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "lib-item";
    item.dataset.sym = id;
    item.title = sym.code ? sym.code : sym.name;
    const c = document.createElement("canvas");
    c.width = 56;
    c.height = 56;
    drawPreview(c, id);
    const lbl = document.createElement("span");
    lbl.textContent = sym.name;
    item.appendChild(c);
    item.appendChild(lbl);
    const pick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onPick) onPick(id, item);
      else pickSymbolFromLibrary(id, item);
    };
    item.addEventListener("click", pick);
    item.addEventListener("touchend", pick, { passive: false });
    return item;
  }

  function buildBranchPopupPicker() {
    if (!ui.branchPopupPickerGrid) return;
    if (ui.branchPopupPickerGrid.dataset.built === "3") return;
    ui.branchPopupPickerGrid.innerHTML = "";
    ui.branchPopupPickerGrid.dataset.built = "3";
    ui.branchPopupPickerGrid.className = "branch-popup-picker-body";
    const seen = new Set();
    for (const group of LIB_GROUPS) {
      const sec = document.createElement("div");
      sec.className = "lib-section";
      const h = document.createElement("div");
      h.className = "lib-section-title";
      h.textContent = group.title;
      sec.appendChild(h);
      const grid = document.createElement("div");
      grid.className = "lib-grid";
      for (const id of Object.keys(SYMBOLS)) {
        const sym = SYMBOLS[id];
        if (!group.cats.includes(sym.cat) || seen.has(id)) continue;
        seen.add(id);
        const item = createLibItem(id);
        if (item) grid.appendChild(item);
      }
      if (grid.children.length) {
        sec.appendChild(grid);
        ui.branchPopupPickerGrid.appendChild(sec);
      }
    }
  }

  function toggleBranchPopupPicker(show) {
    if (!ui.branchPopupPicker) return false;
    buildBranchPopupPicker();
    const open = show != null ? show : ui.branchPopupPicker.classList.contains("hidden");
    ui.branchPopupPicker.classList.toggle("hidden", !open);
    const key = branchPopupSlotKey();
    const sym = key ? symsOnSlot(key)[0] : null;
    if (ui.branchAddBtn) {
      ui.branchAddBtn.textContent = open
        ? "סגור רשימת סמלים"
        : (sym ? "בחר / החלף סמל" : "בחר סמל מהרשימה");
    }
    repositionBranchPopup();
    return open;
  }

  function showBranchPopup(sx, sy, slotKey, opts) {
    if (!ui.branchPopup) return;
    cancelSymRadialTimer();
    if (window.RadialMenu) RadialMenu.hide();
    closeSymEdit();
    selectedBranchKey = slotKey;
    modulePopupChainMode = !!(opts && opts.chainMode);
    const syms = symsOnSlot(slotKey);
    const sym = syms[0];
    const deletable = canDeleteModule(slotKey);
    const tapHint = useModuleTapUX() ? "הקשה על מודול" : "לחיצה על מודול";
    if (ui.branchPopupHint) {
      if (modulePopupChainMode && syms.length) {
        ui.branchPopupHint.innerHTML =
          "<strong>" + tapHint + "</strong> — «הוסף לשרשרת» או מחק סמלים";
      } else if (!syms.length) {
        ui.branchPopupHint.innerHTML =
          "מודול ריק · לחץ «בחר סמל מהרשימה» — הרשימה תיפתח כאן" +
          (deletable ? " · או «מחק מודול»" : " · (מודול אחרון בשורה — לא ניתן למחוק)");
      } else if (syms.length > 1) {
        ui.branchPopupHint.innerHTML =
          syms.length + " סמלים בשרשרת · «ערוך» · «הוסף לשרשרת» · «החלף»";
      } else {
        ui.branchPopupHint.innerHTML =
          "«ערוך רכיב» · «הוסף סמל לשרשרת» · «החלף סמל»" +
          (deletable ? " · «מחק מודול»" : "");
      }
    }
    if (ui.branchAddBtn) {
      ui.branchAddBtn.textContent = sym ? "החלף סמל" : "בחר סמל מהרשימה";
    }
    if (ui.branchEditBtn) {
      ui.branchEditBtn.classList.toggle("hidden", !syms.length);
    }
    if (ui.branchChainBtn) {
      const showChain = syms.length > 0 && syms.length < MAX_CHAIN;
      ui.branchChainBtn.classList.toggle("hidden", !showChain);
      ui.branchChainBtn.disabled = syms.length >= MAX_CHAIN;
    }
    if (ui.branchClearSymBtn) {
      ui.branchClearSymBtn.classList.toggle("hidden", !syms.length);
      ui.branchClearSymBtn.textContent = syms.length > 1
        ? "מחק את כל הסמלים (השאר מודול)"
        : "מחק סמל (השאר מודול)";
    }
    if (ui.branchDeleteBtn) {
      ui.branchDeleteBtn.disabled = !deletable;
      ui.branchDeleteBtn.textContent = deletable
        ? "מחק מודול מהלוח"
        : "לא ניתן — מודול אחרון בשורה";
    }
    populateCrossSelect(ui.branchWireCross, getWireCross(wireSkForBranch(slotKey)));
    ui.branchPopup.dataset.slotKey = slotKey;
    if (ui.branchPopupPicker) ui.branchPopupPicker.classList.add("hidden");
    ui.branchPopup.classList.remove("hidden");
    branchPopupAnchor = { sx, sy };
    repositionBranchPopup();
    if (!syms.length && !modulePopupChainMode) {
      setPendingPlace(slotKey, 0);
      toggleBranchPopupPicker(true);
    }
    syncUI();
  }

  function openBranchForChain(slotKey) {
    const syms = symsOnSlot(slotKey);
    if (!syms.length) {
      branchPickMode = "new";
      openInlineSymbolPicker(slotKey, 0, "בחר סמל ראשון");
      return;
    }
    if (syms.length >= MAX_CHAIN) {
      toast("עד " + MAX_CHAIN + " סמלים בשרשרת");
      return;
    }
    branchPickMode = "chain";
    openInlineSymbolPicker(slotKey, syms.length, "בחר סמל — יתווסף מתחת בשרשרת");
  }

  let branchPickerTapAt = 0;

  function openSymbolPickerFromBranchPopup() {
    const now = Date.now();
    if (now - branchPickerTapAt < 400) return;
    branchPickerTapAt = now;
    const key = branchPopupSlotKey();
    if (!key) {
      toast("לחץ שוב על המודול הכחול");
      return;
    }
    selectedBranchKey = key;
    const syms = symsOnSlot(key);
    if (ui.branchPopupPicker && !ui.branchPopupPicker.classList.contains("hidden")) {
      toggleBranchPopupPicker(false);
      return;
    }
    if (modulePopupChainMode || branchPickMode === "chain") {
      if (syms.length >= MAX_CHAIN) {
        toast("עד " + MAX_CHAIN + " סמלים בשרשרת");
        return;
      }
      branchPickMode = "chain";
      openInlineSymbolPicker(key, syms.length, "בחר סמל — יתווסף לשרשרת");
      return;
    }
    branchPickMode = syms.length ? "replace" : "new";
    const hint = syms.length ? "בחר סמל — יחליף את הקיים" : "גלול ובחר סמל מהרשימה";
    openInlineSymbolPicker(key, 0, hint);
  }

  function openBranchForSymbols(slotKey, chainIdx) {
    const slot = findSlotByKey(slotKey);
    if (!slot) {
      toast("מודול לא נמצא — בנה מבנה קווים מחדש");
      return;
    }
    const idx = chainIdx != null ? chainIdx : 0;
    const syms = symsOnSlot(slotKey);
    branchPickMode = idx > 0 ? "chain" : (syms.length ? "replace" : "new");
    openInlineSymbolPicker(
      slotKey,
      idx,
      idx > 0 ? "בחר סמל — יתווסף לשרשרת" : "בחר סמל — יתווסף למודול"
    );
  }

  function placeSymbolOnSlot(symId, slotKey, chainIdx, opts) {
    const slot = findSlotByKey(slotKey);
    if (!slot) {
      toast("מודול לא נמצא — נסה «בנה מבנה קווים» מחדש");
      return;
    }
    if (!SYMBOLS[symId]) {
      toast("סמל לא נמצא");
      return;
    }
    const syms = symsOnSlot(slotKey);
    const idx = chainIdx != null ? chainIdx : 0;

    if (idx === 0 && syms.length > 0 && opts && opts.fromLibrary) {
      const el = syms[0];
      const def = SYMBOLS[symId];
      commit(() => {
        el.sym = symId;
        if (def && def.hasRating) {
          if (!el.rating) el.rating = 16;
          if (!el.curve) el.curve = "C";
          el.crossSection = autoCrossSection(el);
          el.phase = phaseForSymbol(def, el.phase);
          if (el.crossSection != null) {
            setWireCross(wireSkForChainSym(slotKey, el.chainIdx || 0), el.crossSection, false);
          }
        } else {
          el.rating = null;
          el.curve = "";
          el.crossSection = null;
        }
      });
      state.selectedId = el.id;
      checkModuleOverflow(true);
      hideLibrary();
      openSymEdit(el, false);
      toast("סמל הוחלף: " + (def ? def.name : symId));
      return;
    }

    if (idx === 0 && syms.length > 0 && !(opts && opts.fromLibrary)) {
      openSymEdit(syms[0]);
      return;
    }
    if (idx > 0 && idx !== syms.length) {
      toast("לא ניתן להוסיף כאן");
      return;
    }

    const el = newSymElement(symId, slot.x, slot.y);
    const pos = symPosForSlot(slotKey, idx);
    if (pos) {
      el.x = pos.x;
      el.y = pos.y;
    } else {
      el.x = snap(clampX(slot.x));
      el.y = snap(clampY(slot.y));
    }
    el.slotKey = slotKey;
    el.chainIdx = idx;
    try {
      commit(() => {
        state.elements.push(el);
        if (el.crossSection != null) {
          setWireCross(wireSkForChainSym(slotKey, idx), el.crossSection, false);
        }
        if (state.meta.skeletonBuilt) {
          const result = BoardSkeleton.generate(
            state.meta.rowLayout,
            drawingArea(),
            state.meta.skeletonOpts || BoardSkeleton.defaultOpts(),
            getSkeletonGenerateConfig()
          );
          applySkeletonResult(result);
        }
      });
    } catch (err) {
      console.error(err);
      toast("שגיאה בהוספת סמל — נסה שוב");
      return;
    }
    state.selectedId = el.id;
    checkModuleOverflow(true);
    hideLibrary();
    hideBranchPopup();
    hideTerminalPopup();
    branchPickMode = "new";
    openSymEdit(el, false);
    render();
    syncUI();
    toast("נוסף: " + SYMBOLS[symId].name);
  }

  let lastLibPickAt = 0;

  function pickSymbolFromLibrary(symId, item) {
    const now = Date.now();
    if (now - lastLibPickAt < 280) return;
    lastLibPickAt = now;

    if (!SYMBOLS[symId]) {
      toast("סמל לא נמצא");
      return;
    }
    const target = resolvePlaceTarget();
    if (target) {
      placeSymbolOnSlot(symId, target.slotKey, target.chainIdx, { fromLibrary: true });
      highlightLibItem(symId);
      return;
    }
    if (symEditEl) {
      replaceSelectedSymbol(symId);
      if (item) highlightLibItem(symId);
      return;
    }
    if (!state.meta.skeletonBuilt) {
      toast("קודם בנה מבנה קווים — «בנה מבנה קווים» בפרטי גיליון");
      return;
    }
    armSymbol(symId, item);
    toast("עכשיו הקש על מודול ריק על השרטוט");
  }

  function removeBranch(slotKey, opts) {
    const slot = findSlotByKey(slotKey);
    if (!slot) {
      toast("מודול לא נמצא");
      return;
    }
    const row = state.meta.rowLayout[slot.row];
    if (!row || row.modules <= 1) {
      toast("חייב להישאר לפחות מודול אחד בשורה");
      return;
    }
    const sym = symOnSlot(slotKey);
    const skipConfirm = opts && opts.skipConfirm;
    if (sym && !skipConfirm && !confirm('למחוק את המודול ואת הסמל "' + (sym.desc || SYMBOLS[sym.sym]?.name || "סמל") + '"?')) return;
    commit(() => {
      const delRow = slot.row;
      const delBranch = slot.branch;
      row.modules -= 1;
      state.elements = state.elements.filter((e) => !(e.t === "sym" && e.slotKey === slotKey));
      if (state.meta.skLineOverrides) {
        delete state.meta.skLineOverrides["branch-in-" + slotKey];
        delete state.meta.skLineOverrides["branch-out-" + slotKey];
        for (const k of Object.keys(state.meta.skLineOverrides)) {
          if (k.startsWith("branch-seg-" + slotKey + "-") || k.startsWith("branch-link-" + slotKey + "-")) {
            delete state.meta.skLineOverrides[k];
          }
        }
      }
      if (state.meta.wireCrossSections) {
        delete state.meta.wireCrossSections[wireSkForBranch(slotKey)];
        for (const k of Object.keys(state.meta.wireCrossSections)) {
          if (k.startsWith("branch-seg-" + slotKey + "-")) delete state.meta.wireCrossSections[k];
        }
      }
      for (const sym of state.elements) {
        if (sym.t !== "sym" || !sym.slotKey) continue;
        const parts = sym.slotKey.split("-");
        const r = Number(parts[0]), b = Number(parts[1]);
        if (r === delRow && b > delBranch) sym.slotKey = BoardSkeleton.slotKey(r, b - 1);
      }
      const kept = (state.meta.branchSlots || [])
        .filter((s) => !(s.row === delRow && s.branch === delBranch))
        .map((s) => {
          if (s.row === delRow && s.branch > delBranch) {
            return Object.assign({}, s, { branch: s.branch - 1, slotKey: BoardSkeleton.slotKey(s.row, s.branch - 1) });
          }
          return s;
        });
      const cfg = getSkeletonGenerateConfig();
      cfg.branchSlots = kept;
      const result = BoardSkeleton.generate(
        state.meta.rowLayout,
        drawingArea(),
        state.meta.skeletonOpts,
        cfg
      );
      applySkeletonResult(result);
    });
    selectedBranchKey = null;
    hideBranchPopup();
    toast(sym ? "ענף והסמל נמחקו" : "ענף נמחק");
  }

  function clearBranchSymbols(slotKey, opts) {
    const syms = symsOnSlot(slotKey);
    if (!syms.length) {
      toast("אין סמלים למחיקה");
      return;
    }
    const skipConfirm = opts && opts.skipConfirm;
    if (!skipConfirm) {
      const label = syms.map((s) => s.desc || SYMBOLS[s.sym]?.name || "סמל").join(", ");
      if (!confirm("למחוק את הסמלים מהמודול?\n" + label)) return;
    }
    commit(() => {
      state.elements = state.elements.filter((e) => !(e.t === "sym" && e.slotKey === slotKey));
      if (state.meta.skeletonBuilt) {
        const result = BoardSkeleton.generate(
          state.meta.rowLayout,
          drawingArea(),
          state.meta.skeletonOpts || BoardSkeleton.defaultOpts(),
          getSkeletonGenerateConfig()
        );
        applySkeletonResult(result);
      }
    });
    hideBranchPopup();
    state.selectedId = null;
    checkModuleOverflow(true);
    toast("סמלים נמחקו — המודול נשאר");
  }

  function resolveModuleSlotAt(wx, wy) {
    const hitSym = elementAt(wx, wy);
    if (hitSym && hitSym.t === "sym" && hitSym.slotKey) return hitSym.slotKey;
    if (!state.meta.skeletonBuilt) return null;
    const termSlot = skeletonTerminalAt(wx, wy);
    if (termSlot) return termSlot;
    const skLine = skeletonAnyLineAt(wx, wy);
    if (skLine && skLine.skKind === "branch" && skLine.slotKey) return skLine.slotKey;
    const slot = slotAtPoint(wx, wy);
    if (slot) return slot.slotKey;
    const skBranch = skeletonBranchAt(wx, wy);
    if (skBranch) return skBranch;
    return nearestModuleSlotAt(wx, wy);
  }

  function nearestModuleSlotAt(wx, wy) {
    const slots = state.meta.branchSlots || [];
    if (!slots.length) return null;
    const xPad = moduleHitPad() + 16;
    let best = null;
    let bestScore = Infinity;
    for (const s of slots) {
      const dx = Math.abs(wx - s.x);
      if (dx > xPad) continue;
      const busY = s.busY != null
        ? s.busY
        : (state.meta.rowBusY || {})[s.row];
      if (busY != null && wy < busY - 24) continue;
      const score = dx + (busY != null ? Math.abs(wy - busY) * 0.12 : Math.abs(wy - s.y) * 0.05);
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }
    return best ? best.slotKey : null;
  }

  function openModuleOnDblClick(sx, sy, w) {
    const hitSym = symAt(w.x, w.y);
    const slotKey = (hitSym && hitSym.slotKey) || resolveModuleSlotAt(w.x, w.y);
    return handleModuleDoubleClick(sx, sy, w, slotKey);
  }

  function applySkeletonResult(result) {
    state.meta.branchSlots = result.slots;
    state.meta.skeletonVersion = SKELETON_VERSION;
    state.elements = state.elements.filter((e) => !e.skeleton);
    state.elements = result.lines.concat(result.dots).concat(state.elements);
    ensureFeedLinksDefaults();
    pruneStructuralSkOverrides();
    applySkLineOverrides();
    syncBusLinesFromSlots();
    syncAllBranchSkeletonGeometry();
    syncChainSymPositions();
    syncWireCrossFromSymbols();
    snapFreeLinesToSkeleton();
    syncFeedMetaFromLines();
  }

  function isStructuralSkId(skId, el) {
    if (!skId) return false;
    if (skId.startsWith("branch-") || skId.startsWith("bus-")) return true;
    if (skId.startsWith("entry") || skId.startsWith("feed-link") || skId.startsWith("trunk-")) return true;
    if (el && (el.skKind === "branch" || el.skKind === "bus")) return true;
    return false;
  }

  function pruneStructuralSkOverrides() {
    const ov = state.meta.skLineOverrides;
    if (!ov) return false;
    let changed = false;
    for (const k of Object.keys(ov)) {
      if (k.startsWith("branch-") || k.startsWith("bus-") ||
          k.startsWith("entry") || k.startsWith("feed-link") || k.startsWith("trunk-")) {
        delete ov[k];
        changed = true;
      }
    }
    return changed;
  }

  function syncBusLinesFromSlots() {
    const rows = state.meta.rowLayout || [];
    for (let ri = 0; ri < rows.length; ri++) {
      const slots = (state.meta.branchSlots || []).filter((s) => s.row === ri);
      if (!slots.length) continue;
      const xs = slots.map((s) => s.x);
      const busL = Math.min(...xs);
      const busR = Math.max(...xs);
      const busY = slots[0].busY != null
        ? slots[0].busY
        : (state.meta.rowBusY || {})[ri];
      const bus = findSkLine("bus-" + ri);
      if (bus && busY != null) {
        bus.x1 = snap(busL);
        bus.x2 = snap(busR);
        bus.y1 = snap(busY);
        bus.y2 = snap(busY);
      }
    }
  }

  function skeletonNeedsRealign() {
    if (!state.meta.skeletonBuilt) return false;
    const ext = feedBusExtents();
    const entry = findSkLine("entry");
    if (!ext || !entry) return false;
    const fi = feedFirstRowIndex();
    const bus = findSkLine("bus-" + fi);
    if (!bus) return true;
    if (Math.abs(bus.x1 - ext.busL) > 6 || Math.abs(bus.x2 - ext.busR) > 6) return true;
    const cx = resolveFeedX();
    if (Math.abs(entry.x1 - cx) > 6) return true;
    const linked = BoardSkeleton.isLinked(state.meta.feedLinks || {}, "entryBus");
    if (linked) {
      const inside = cx >= ext.busL - 8 && cx <= ext.busR + 8;
      const trunk = findSkLine("trunk-h-" + fi);
      if (!inside && !trunk) return true;
    }
    return false;
  }

  function realignFeedAndSkeleton() {
    if (!skeletonNeedsRealign()) return false;
    const align = state.meta.feedAlign || "center";
    if (state.meta.feedAlign !== null) {
      state.meta.feedX = feedXForAlign(align);
    } else {
      const ext = feedBusExtents();
      if (ext) state.meta.feedX = snap((ext.busL + ext.busR) / 2);
    }
    state.meta.feedEndY = null;
    rebuildSkeleton(false);
    fitViewToDrawing();
    return true;
  }

  function applySkLineOverrides() {
    const ov = state.meta.skLineOverrides || {};
    for (const el of state.elements) {
      if (el.t !== "line" || !el.skId || !ov[el.skId]) continue;
      if (isStructuralSkId(el.skId, el)) continue;
      const o = ov[el.skId];
      el.x1 = o.x1;
      el.y1 = o.y1;
      el.x2 = o.x2;
      el.y2 = o.y2;
    }
  }

  function setSkDotPos(skId, x, y) {
    for (const el of state.elements) {
      if (el.t === "dot" && el.skId === skId) {
        el.x = snap(x);
        el.y = snap(y);
      }
    }
  }

  function syncAllBranchSkeletonGeometry() {
    syncSkeletonDotsFromLines();
    for (const slot of state.meta.branchSlots || []) {
      const x = slot.x;
      const busY = slot.busY != null
        ? slot.busY
        : (state.meta.rowBusY && state.meta.rowBusY[slot.row] != null
          ? state.meta.rowBusY[slot.row]
          : null);
      for (const el of state.elements) {
        if (!el.skeleton || el.slotKey !== slot.slotKey) continue;
        if (el.t === "line" && el.skKind === "branch") {
          el.x1 = snap(x);
          el.x2 = snap(x);
          if (el.segment === "in" && busY != null) el.y1 = snap(busY);
        }
        if (el.t === "dot" && el.skKind === "branch") {
          el.x = snap(x);
        }
      }
      for (const el of state.elements) {
        if (el.t !== "line" || !el.skeleton || el.skKind !== "branch" || el.slotKey !== slot.slotKey) continue;
        const lx = el.x1;
        if (el.segment === "in") {
          setSkDotPos("branch-junc-" + slot.slotKey, lx, el.y1);
          setSkDotPos("branch-in-dot-" + slot.slotKey, lx, el.y2);
        } else if (el.segment === "out") {
          setSkDotPos("branch-term-" + slot.slotKey, lx, el.y2);
        } else if (el.segment === "drop" && el.chainIdx != null) {
          setSkDotPos("branch-seg-dot-" + slot.slotKey + "-" + el.chainIdx, lx, el.y2);
        }
      }
    }
  }

  function attachSnapThreshold() {
    return isCoarsePointer() ? 52 : 40;
  }

  function skeletonAttachPoints() {
    const pts = [];
    for (const slot of state.meta.branchSlots || []) {
      const x = slot.x;
      const busY = slot.busY != null ? slot.busY : (state.meta.rowBusY || {})[slot.row];
      if (busY != null) pts.push({ x, y: busY });
      if (slot.wireEnd != null) pts.push({ x, y: slot.wireEnd });
      if (slot.stubEnd != null) pts.push({ x, y: slot.stubEnd });
      if (slot.firstSymY != null) pts.push({ x, y: slot.firstSymY });
      if (slot.lastSymY != null) pts.push({ x, y: slot.lastSymY });
    }
    for (const el of state.elements) {
      if (el.t === "dot" && el.skeleton && (el.skKind === "branch" || el.skKind === "entry")) {
        pts.push({ x: el.x, y: el.y });
      }
      if (el.t === "line" && el.skeleton && el.skKind === "bus") {
        const y = el.y1;
        const xL = Math.min(el.x1, el.x2);
        const xR = Math.max(el.x1, el.x2);
        pts.push({ x: xL, y }, { x: xR, y }, { x: snap((xL + xR) / 2), y });
        for (let x = xL; x <= xR; x += GRID * 2) pts.push({ x: snap(x), y });
      }
    }
    return pts;
  }

  function nearestAttachPoint(wx, wy, threshold) {
    const th = threshold != null ? threshold : attachSnapThreshold();
    const pts = skeletonAttachPoints();
    let best = null, bestD = th;
    for (const p of pts) {
      const d = Math.hypot(wx - p.x, wy - p.y);
      if (d <= bestD) { bestD = d; best = p; }
    }
    return best;
  }

  function snapPointToAttach(wx, wy, threshold) {
    const hit = nearestAttachPoint(wx, wy, threshold);
    if (!hit) return { x: snap(clampX(wx)), y: snap(clampY(wy)) };
    return { x: snap(hit.x), y: snap(hit.y) };
  }

  function snapFreeEndpoint(line, xKey, yKey, points, threshold) {
    const px = line[xKey], py = line[yKey];
    let best = null, bestD = threshold;
    for (const p of points) {
      const d = Math.hypot(px - p.x, py - p.y);
      if (d <= bestD) { bestD = d; best = p; }
    }
    if (best) {
      line[xKey] = snap(best.x);
      line[yKey] = snap(best.y);
      return true;
    }
    return false;
  }

  function snapFreeLinesToSkeleton(threshold) {
    if (!state.meta.skeletonBuilt) return;
    const th = threshold != null ? threshold : attachSnapThreshold();
    const pts = skeletonAttachPoints();
    if (!pts.length) return;
    let moved = false;
    for (const el of state.elements) {
      if (el.t !== "line" || el.skeleton) continue;
      if (snapFreeEndpoint(el, "x1", "y1", pts, th)) moved = true;
      if (snapFreeEndpoint(el, "x2", "y2", pts, th)) moved = true;
    }
    return moved;
  }

  function slotsExceedPaper() {
    if (!state.meta.skeletonBuilt) return false;
    const area = drawingArea();
    const pad = 36;
    for (const s of state.meta.branchSlots || []) {
      if (s.x < area.x0 + pad || s.x > area.x1 - pad) return true;
    }
    return false;
  }

  function repairSkeletonGeometry() {
    if (!state.meta.skeletonBuilt) return;
    if (!hasSkeletonLines() || !state.meta.branchSlots || !state.meta.branchSlots.length) {
      if (state.meta.rowLayout && state.meta.rowLayout.length) {
        rebuildSkeleton(false);
      }
      return;
    }
    ensureSkeletonOpts();
    const pruned = pruneStructuralSkOverrides();
    if (pruned) {
      rebuildSkeleton(false);
      return;
    }
    if (realignFeedAndSkeleton()) return;
    if (slotsExceedPaper()) {
      rebuildSkeleton(false);
      fitViewToDrawing();
      return;
    }
    syncBusLinesFromSlots();
    syncAllBranchSkeletonGeometry();
    syncChainSymPositions();
    snapFreeLinesToSkeleton();
    render();
  }

  function syncSkeletonDotsFromLines() {
    const entry = findSkLine("entry");
    if (entry) {
      for (const el of state.elements) {
        if (el.t === "dot" && el.skId === "entry-end") {
          el.x = entry.x1;
          el.y = state.meta.feedDir === "bottom" ? entry.y1 : entry.y2;
        }
      }
    }
  }

  function syncFeedMetaFromLines() {
    const entry = findSkLine("entry");
    if (!entry) return;
    state.meta.feedX = snap(entry.x1);
    state.meta.feedEndY = snap(state.meta.feedDir === "bottom" ? entry.y1 : entry.y2);
  }

  function isFreeSkLine(skId) {
    if (!skId) return false;
    if (skId.startsWith("branch-") || skId.startsWith("bus-")) return false;
    return true;
  }

  function needsSkeletonRebuild(skId, dragOpts) {
    if (!skId) return false;
    if (isBranchSlotSkId(skId)) return false;
    if (skId.startsWith("branch-") || skId.startsWith("bus-")) return true;
    if (skId.startsWith("entry") || skId.startsWith("feed-link") || skId.startsWith("trunk-")) return true;
    return false;
  }

  function translateSkLine(skId, dx, dy) {
    if (!state.meta.skLineOverrides) state.meta.skLineOverrides = {};
    let o = state.meta.skLineOverrides[skId];
    if (!o) {
      const ln = findSkLine(skId);
      if (!ln) return;
      o = { x1: ln.x1, y1: ln.y1, x2: ln.x2, y2: ln.y2 };
      state.meta.skLineOverrides[skId] = o;
    }
    o.x1 = snap(clampX(o.x1 + dx));
    o.y1 = snap(clampY(o.y1 + dy));
    o.x2 = snap(clampX(o.x2 + dx));
    o.y2 = snap(clampY(o.y2 + dy));
  }

  function ensureFeedLinksDefaults() {
    if (!state.meta.feedLinks) state.meta.feedLinks = {};
    const links = state.meta.feedLinks;
    if (links.entryBus === undefined) links.entryBus = true;
    const fi = feedFirstRowIndex();
    const horizKey = "horiz-" + fi;
    if (links[horizKey] === undefined) links[horizKey] = true;
  }

  function resolveFeedX() {
    const ext = feedBusExtents();
    const align = state.meta.feedAlign || "center";
    if (state.meta.feedX != null && ext) {
      const cx = state.meta.feedX;
      const inside = cx >= ext.busL - 12 && cx <= ext.busR + 12;
      if (inside || state.meta.feedAlign == null) return cx;
    }
    if (state.meta.feedX != null && !ext) return state.meta.feedX;
    return feedXForAlign(align);
  }

  function getSkeletonGenerateConfig() {
    ensureFeedLinksDefaults();
    return {
      feedDir: state.meta.feedDir || "top",
      branchSlots: clone(state.meta.branchSlots || []),
      feedX: resolveFeedX(),
      feedEndY: state.meta.feedEndY != null ? state.meta.feedEndY : null,
      feedLinks: state.meta.feedLinks || {},
      rowBusY: state.meta.rowBusY || {},
      chainCounts: getChainCountsFromElements(),
    };
  }

  function moveRowBusY(row, dy) {
    if (dy == null || !dy || row == null) return;
    if (!state.meta.rowBusY) state.meta.rowBusY = {};
    const slots = (state.meta.branchSlots || []).filter((s) => s.row === row);
    const busLn = findSkLine("bus-" + row);
    const cur = state.meta.rowBusY[row] != null
      ? state.meta.rowBusY[row]
      : (slots[0] && slots[0].busY != null ? slots[0].busY : (busLn ? busLn.y1 : null));
    if (cur == null) return;
    state.meta.rowBusY[row] = snap(clampY(cur + dy));
    if (row === feedFirstRowIndex()) state.meta.feedEndY = null;
  }

  function rowBusHorizontalLimits(row) {
    const rowSlots = (state.meta.branchSlots || []).filter((s) => s.row === row);
    if (!rowSlots.length) return { minDx: 0, maxDx: 0 };
    const ext = rowBusExtentsForSlot(rowSlots[0]);
    if (!ext) return { minDx: 0, maxDx: 0 };
    const xs = rowSlots.map((s) => s.x);
    return {
      minDx: ext.minX - Math.min(...xs),
      maxDx: ext.maxX - Math.max(...xs),
    };
  }

  function moveRowBusX(row, dx) {
    if (!dx || row == null) return;
    const rowSlots = (state.meta.branchSlots || []).filter((s) => s.row === row);
    if (!rowSlots.length) return;
    const { minDx, maxDx } = rowBusHorizontalLimits(row);
    const clampedDx = clamp(dx, minDx, maxDx);
    const step = snap(clampedDx);
    if (!step) return;
    for (const slot of rowSlots) {
      slot.x = snap(clampX(slot.x + step));
      slot.userBranchX = true;
    }
    const rowMin = Math.min(...rowSlots.map((s) => s.x));
    const rowMax = Math.max(...rowSlots.map((s) => s.x));
    rowSlots.forEach((s) => {
      s.xMin = rowMin;
      s.xMax = rowMax;
    });
    for (const slot of rowSlots) {
      for (const sym of symsOnSlot(slot.slotKey)) {
        const pos = symPosForSlot(slot.slotKey, sym.chainIdx || 0);
        sym.x = pos ? pos.x : snap(slot.x);
      }
    }
    syncAllBranchSkeletonGeometry();
    syncBusLinesFromSlots();
  }

  function applyRowBusDrag(row, dx, dy) {
    if (row == null) return false;
    let moved = false;
    if (dx) { moveRowBusX(row, dx); moved = true; }
    if (dy) { moveRowBusY(row, dy); moved = true; }
    return moved;
  }

  function isBranchSlotSkId(skId) {
    return skId.startsWith("branch-in-") || skId.startsWith("branch-out-") ||
      skId.startsWith("branch-seg-") || skId.startsWith("branch-link-") ||
      (skId.startsWith("branch-") && skId !== "branch-");
  }

  function feedFirstRowIndex() {
    const n = (state.meta.rowLayout || []).length;
    if (!n) return 0;
    return state.meta.feedDir === "bottom" ? n - 1 : 0;
  }

  function findSkLine(skId) {
    return state.elements.find((e) => e.t === "line" && e.skId === skId);
  }

  function swapMetaBranchKeys(keyA, keyB, prefix) {
    const bag = state.meta[prefix];
    if (!bag) return;
    const matchSlot = (k, sk) =>
      k === "branch-in-" + sk ||
      k === "branch-out-" + sk ||
      k.startsWith("branch-seg-" + sk + "-");
    const keysA = Object.keys(bag).filter((k) => matchSlot(k, keyA));
    const keysB = Object.keys(bag).filter((k) => matchSlot(k, keyB));
    const snapA = {}, snapB = {};
    keysA.forEach((k) => { snapA[k] = bag[k]; delete bag[k]; });
    keysB.forEach((k) => { snapB[k] = bag[k]; delete bag[k]; });
    for (const [k, v] of Object.entries(snapA)) bag[k.replace(keyA, keyB)] = v;
    for (const [k, v] of Object.entries(snapB)) bag[k.replace(keyB, keyA)] = v;
  }

  function rowBranchXs(row, moduleCount) {
    const area = drawingArea();
    const centerX = state.meta.feedX != null ? state.meta.feedX : area.centerX;
    const spacing = branchSpacingForRow(moduleCount);
    return BoardSkeleton.centeredBranchXs(centerX, spacing, moduleCount, area);
  }

  function finalizeBranchDrag(skId) {
    if (!state.meta.skeletonBuilt) return;
    ensureFeedLinksDefaults();
    state.meta.feedEndY = null;
    rebuildSkeleton(false);
    snapFreeLinesToSkeleton();
    save();
  }

  function applySkeletonLineDrag(skId, dx, dy) {
    if (!dx && !dy) return;
    if (!state.meta.rowBusY) state.meta.rowBusY = {};

    if (isFreeSkLine(skId)) {
      translateSkLine(skId, dx, dy);
      return;
    }

    if (skId.startsWith("branch-out-") || skId.startsWith("branch-in-") ||
        skId.startsWith("branch-seg-") || skId.startsWith("branch-junc-") ||
        isBranchSlotSkId(skId)) {
      return;
    }

    if (skId.startsWith("bus-")) {
      const row = Number(skId.slice(4));
      applyRowBusDrag(row, dx, dy);
      return;
    }

    if (skId.startsWith("entry") || skId === "feed-link-entry") {
      if (dx) {
        const area = drawingArea();
        const cx = state.meta.feedX != null ? state.meta.feedX : area.centerX;
        state.meta.feedX = snap(clampX(cx + dx));
        state.meta.feedAlign = null;
      }
      if (dy) state.meta.feedEndY = null;
    }
  }

  function skeletonLineAt(wx, wy) {
    let best = null, bestD = Infinity;
    for (let i = state.elements.length - 1; i >= 0; i--) {
      const el = state.elements[i];
      if (el.t !== "line" || !el.skeleton || !el.skId) continue;
      if (el.skKind === "branch") continue;
      const hit = skLineHitDist(el.skKind);
      const d = distSeg(wx, wy, el.x1, el.y1, el.x2, el.y2);
      if (d <= hit && d < bestD) { bestD = d; best = el; }
    }
    return best;
  }

  function skeletonAnyLineAt(wx, wy) {
    let best = null, bestD = Infinity;
    for (let i = state.elements.length - 1; i >= 0; i--) {
      const el = state.elements[i];
      if (el.t !== "line" || !el.skeleton || !el.skId) continue;
      const hit = skLineHitDist(el.skKind);
      const d = distSeg(wx, wy, el.x1, el.y1, el.x2, el.y2);
      if (d <= hit && d < bestD) { bestD = d; best = el; }
    }
    return best;
  }

  function isSkLineDraggable(el) {
    return !!(el && el.skeleton && el.skId);
  }

  function skLineMenuMeta(el, sx, sy) {
    return {
      skKind: el.skKind,
      slotKey: el.slotKey,
      linkKey: el.linkKey,
      skId: el.skId,
      sx, sy,
    };
  }

  function openSkLineClickMenu(ptr) {
    if (!ptr) return;
    if (ptr.skKind === "bus") {
      showWirePopup(ptr.sx, ptr.sy, ptr.skId);
    } else if (ptr.skKind === "entry" || ptr.skKind === "feed-link" || ptr.skKind === "trunk") {
      showFeedPopup(ptr.sx, ptr.sy, ptr.linkKey || (ptr.skKind === "entry" ? "entryBus" : null));
    }
  }

  function beginSkDrag(skId, wx, wy, sx, sy) {
    skDrag = {
      skId,
      lx: wx,
      ly: wy,
      ssx: sx,
      ssy: sy,
      accX: 0,
      accY: 0,
      pushed: false,
    };
    selectedSkLineId = skId;
    branchPointer = null;
    skPointer = null;
    canvas.style.cursor = "grabbing";
    if (!branchDragHintShown && isRowBusSkId(skId)) {
      branchDragHintShown = true;
      toast("גרור ענף (זהב): שמאלה/ימינה · למעלה/מטה = כל השורה · מודולים — «מרווחים»");
    }
  }

  function applySkDragMove(w) {
    if (!skDrag) return;
    let dx = 0;
    let dy = 0;
    skDrag.accX += w.x - skDrag.lx;
    skDrag.accY += w.y - skDrag.ly;
    skDrag.lx = w.x;
    skDrag.ly = w.y;
    const minStep = GRID * 0.35;
    if (Math.abs(skDrag.accX) >= minStep) { dx = snap(skDrag.accX); skDrag.accX -= dx; }
    if (Math.abs(skDrag.accY) >= minStep) { dy = snap(skDrag.accY); skDrag.accY -= dy; }
    if (!dx && !dy) return;
    if (!skDrag.pushed) { pushHistory(); skDrag.pushed = true; }
    applySkeletonLineDrag(skDrag.skId, dx, dy);
    if (isRowBusSkId(skDrag.skId)) {
      if (dy) rebuildSkeleton(false);
      else {
        syncChainSymPositions();
        render();
      }
    } else if (needsSkeletonRebuild(skDrag.skId, { dy: !!dy })) {
      rebuildSkeleton(false);
    } else {
      applySkLineOverrides();
      syncAllBranchSkeletonGeometry();
      syncFeedMetaFromLines();
      snapFreeLinesToSkeleton();
      render();
    }
  }

  function endSkDrag() {
    if (!skDrag) return;
    if (skDrag.accX || skDrag.accY) {
      const dx = snap(skDrag.accX);
      const dy = snap(skDrag.accY);
      if (dx || dy) {
        if (!skDrag.pushed) pushHistory();
        applySkeletonLineDrag(skDrag.skId, dx, dy);
        if (isRowBusSkId(skDrag.skId)) {
          if (dy) rebuildSkeleton(false);
          else {
            syncChainSymPositions();
          }
        } else if (needsSkeletonRebuild(skDrag.skId, { dy: !!dy })) {
          rebuildSkeleton(false);
        } else {
          applySkLineOverrides();
          syncAllBranchSkeletonGeometry();
          syncFeedMetaFromLines();
          snapFreeLinesToSkeleton();
        }
        skDrag.pushed = true;
      }
    }
    if (skDrag.pushed) save();
    const finishedSkId = skDrag.skId;
    const wasBusRow = isRowBusSkId(finishedSkId);
    skDrag = null;
    branchPointer = null;
    skPointer = null;
    canvas.style.cursor = "";
    if (wasBusRow) {
      finalizeBranchDrag(finishedSkId);
    } else if (finishedSkId && needsSkeletonRebuild(finishedSkId)) {
      ensureFeedLinksDefaults();
      rebuildSkeleton(false);
      snapFreeLinesToSkeleton();
      render();
    } else {
      render();
    }
    syncUI();
  }

  function rebuildSkeleton(recordHistory, skipSave) {
    if (!state.meta.skeletonBuilt || !state.meta.rowLayout || !state.meta.rowLayout.length) return;
    const layout = state.meta.rowLayout;
    const opts = state.meta.skeletonOpts || BoardSkeleton.defaultOpts();
    const feedDir = state.meta.feedDir || "top";
    const result = BoardSkeleton.generate(layout, drawingArea(), opts, getSkeletonGenerateConfig());
    const mutate = () => applySkeletonResult(result);
    if (recordHistory) commit(mutate);
    else {
      mutate();
      if (!skipSave) save();
      render();
      syncUI();
    }
  }

  function feedBusExtents() {
    const fi = feedFirstRowIndex();
    const slots = (state.meta.branchSlots || []).filter((s) => s.row === fi);
    if (!slots.length) return null;
    const xs = slots.map((s) => s.x);
    const busY = slots[0].busY != null
      ? slots[0].busY
      : (state.meta.rowBusY || {})[fi];
    return { busL: Math.min(...xs), busR: Math.max(...xs), busY };
  }

  function feedXForAlign(align) {
    const ext = feedBusExtents();
    if (!ext) return snap(drawingArea().centerX);
    if (align === "left") return snap(ext.busL);
    if (align === "right") return snap(ext.busR);
    return snap((ext.busL + ext.busR) / 2);
  }

  function setFeedAlign(align) {
    if (!state.meta.skeletonBuilt) return;
    const side = align === "left" || align === "right" ? align : "center";
    commit(() => {
      state.meta.feedAlign = side;
      state.meta.feedX = feedXForAlign(side);
      const result = BoardSkeleton.generate(
        state.meta.rowLayout,
        drawingArea(),
        state.meta.skeletonOpts,
        getSkeletonGenerateConfig()
      );
      applySkeletonResult(result);
    });
    hideFeedPopup();
    const labels = { left: "הזנה משמאל", center: "הזנה במרכז", right: "הזנה מימין" };
    toast(labels[side] || "מיקום הזנה עודכן");
  }

  function setFeedDir(dir) {
    if (!state.meta.skeletonBuilt) return;
    commit(() => {
      state.meta.feedDir = dir === "bottom" ? "bottom" : "top";
      const result = BoardSkeleton.generate(
        state.meta.rowLayout,
        drawingArea(),
        state.meta.skeletonOpts,
        getSkeletonGenerateConfig()
      );
      applySkeletonResult(result);
    });
    hideFeedPopup();
    toast(dir === "bottom" ? "הזנה מלמטה" : "הזנה מלמעלה");
  }

  function findSlotByKey(key) {
    return (state.meta.branchSlots || []).find((s) => s.slotKey === key);
  }

  function skeletonEntryAt(wx, wy) {
    const hit = skLineHitDist("entry");
    let best = null;
    let bestD = Infinity;
    for (const el of state.elements) {
      if (el.t === "line" && el.skeleton && el.skKind === "entry") {
        const d = distSeg(wx, wy, el.x1, el.y1, el.x2, el.y2);
        if (d <= hit && d < bestD) { bestD = d; best = el; }
      }
      if (el.t === "dot" && el.skeleton && el.skKind === "entry") {
        const d = Math.hypot(wx - el.x, wy - el.y);
        const r = (el.r || 4) + (isCoarsePointer() ? 16 : 10);
        if (d <= r && d < bestD) { bestD = d; best = el; }
      }
    }
    return best;
  }

  function skeletonTerminalAt(wx, wy) {
    let best = null, bestD = moduleHitPad() + 4;
    for (const el of state.elements) {
      if (el.t !== "dot" || !el.skeleton || !el.terminal || !el.slotKey) continue;
      const d = Math.hypot(wx - el.x, wy - el.y);
      const hitR = (el.r || 4) + (isCoarsePointer() ? 14 : 6);
      if (d <= hitR && d < bestD) { bestD = d; best = el.slotKey; }
    }
    return best;
  }

  function skeletonBusRowAt(wx, wy) {
    const yPad = isCoarsePointer() ? 30 : 22;
    const xPad = isCoarsePointer() ? 20 : 12;
    const rows = state.meta.rowLayout || [];
    let bestRow = null;
    let bestScore = Infinity;
    for (let ri = 0; ri < rows.length; ri++) {
      const slots = (state.meta.branchSlots || []).filter((s) => s.row === ri);
      if (!slots.length) continue;
      const bus = findSkLine("bus-" + ri);
      const busY = bus ? bus.y1 : slots[0].busY;
      if (busY == null) continue;
      if (Math.abs(wy - busY) > yPad) continue;
      const busL = bus ? Math.min(bus.x1, bus.x2) - xPad : Math.min(...slots.map((s) => s.x)) - xPad;
      const busR = bus ? Math.max(bus.x1, bus.x2) + xPad : Math.max(...slots.map((s) => s.x)) + xPad;
      if (wx < busL || wx > busR) continue;
      const score = Math.abs(wy - busY);
      if (score < bestScore) {
        bestScore = score;
        bestRow = ri;
      }
    }
    return bestRow;
  }

  function skeletonBusBranchAt(wx, wy) {
    const row = skeletonBusRowAt(wx, wy);
    if (row == null) return null;
    const slots = (state.meta.branchSlots || []).filter((s) => s.row === row);
    if (!slots.length) return null;
    let best = slots[0].slotKey;
    let bestDx = Math.abs(wx - slots[0].x);
    for (const s of slots) {
      const dx = Math.abs(wx - s.x);
      if (dx < bestDx) { bestDx = dx; best = s.slotKey; }
    }
    return best;
  }

  function skeletonBranchAt(wx, wy) {
    const pad = moduleHitPad();
    const linePad = isCoarsePointer() ? 28 : 22;
    if (skeletonBusRowAt(wx, wy) != null) return null;
    const busHit = skeletonBusBranchAt(wx, wy);
    if (busHit) return busHit;
    for (const el of state.elements) {
      if (el.t === "dot" && el.skeleton && el.skKind === "branch" && el.slotKey && !el.terminal) {
        const slot = findSlotByKey(el.slotKey);
        const isJunc = el.skId && String(el.skId).startsWith("branch-junc-");
        const hitR = isJunc ? (isCoarsePointer() ? 26 : 20) : pad;
        const hitY = isJunc ? (isCoarsePointer() ? 24 : 16) : hitR;
        const half = slot ? branchHalfWidth(slot.row) + (isJunc ? 12 : 0) : pad + 8;
        if (Math.abs(wx - el.x) > half) continue;
        if (Math.abs(wx - el.x) <= hitR && Math.abs(wy - el.y) <= hitY) return el.slotKey;
        if (!isJunc && Math.hypot(wx - el.x, wy - el.y) <= pad) return el.slotKey;
      }
    }
    for (const el of state.elements) {
      if (el.t === "line" && el.skeleton && el.skKind === "branch" && el.slotKey) {
        if (Math.abs(el.x1 - el.x2) >= 2) continue;
        const slot = findSlotByKey(el.slotKey);
        const half = slot ? branchHalfWidth(slot.row) : linePad + 8;
        if (Math.abs(wx - el.x1) > half) continue;
        if (Math.abs(el.y2 - el.y1) > 8 && distSeg(wx, wy, el.x1, el.y1, el.x2, el.y2) <= linePad) {
          return el.slotKey;
        }
      }
    }
    return null;
  }

  function skeletonFeedLineAt(wx, wy) {
    let best = null, bestD = 16;
    for (let i = state.elements.length - 1; i >= 0; i--) {
      const el = state.elements[i];
      if (el.t !== "line" || !el.skeleton) continue;
      if (el.skKind === "branch" || el.skKind === "bus") continue;
      const d = distSeg(wx, wy, el.x1, el.y1, el.x2, el.y2);
      if (d <= bestD) { bestD = d; best = el; }
    }
    return best;
  }

  function feedLinkLabel(key) {
    if (key === "entryBus") return "חיבור הזנה → שורה ראשונה";
    if (key && key.startsWith("trunk-")) return "חיבור אנכי בין שורות";
    if (key && key.startsWith("horiz-")) return "חיבור אופקי לשורה";
    return "חיבור קו";
  }

  function isFeedLinked(key) {
    return BoardSkeleton.isLinked(state.meta.feedLinks || {}, key || "entryBus");
  }

  function updateFeedLinkToggleUi(key) {
    if (!ui.feedLinkToggle || !ui.feedLinkLabel) return;
    const linked = isFeedLinked(key);
    ui.feedLinkToggle.textContent = linked ? "⛓ נתק חיבור" : "🔗 חבר קו";
    ui.feedLinkLabel.textContent = feedLinkLabel(key);
  }

  function showFeedPopup(sx, sy, linkKey) {
    if (!ui.feedPopup || !state.meta.skeletonBuilt) return;
    hideBranchPopup();
    selectedBranchKey = null;
    selectedFeedLinkKey = linkKey || "entryBus";
    ui.feedPopup.classList.remove("hidden");
    const popW = 220;
    const popH = innerWidth <= 768 ? 300 : 220;
    placeFloatingPopup(ui.feedPopup, sx, sy, popW, popH);
    ui.feedPopup.querySelector('[data-feed="top"]').classList.toggle("is-active", state.meta.feedDir !== "bottom");
    ui.feedPopup.querySelector('[data-feed="bottom"]').classList.toggle("is-active", state.meta.feedDir === "bottom");
    const align = state.meta.feedAlign || "center";
    ui.feedPopup.querySelectorAll("[data-feed-side]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.feedSide === align);
    });
    updateFeedLinkToggleUi(selectedFeedLinkKey);
    feedPopupVisible = true;
  }

  function hideFeedPopup() {
    if (!ui.feedPopup) return;
    ui.feedPopup.classList.add("hidden");
    feedPopupVisible = false;
    selectedFeedLinkKey = null;
  }

  function toggleSelectedFeedLink() {
    const key = selectedFeedLinkKey || "entryBus";
    const next = !isFeedLinked(key);
    commit(() => {
      if (!state.meta.feedLinks) state.meta.feedLinks = {};
      state.meta.feedLinks[key] = next;
      const result = BoardSkeleton.generate(
        state.meta.rowLayout,
        drawingArea(),
        state.meta.skeletonOpts,
        getSkeletonGenerateConfig()
      );
      applySkeletonResult(result);
    });
    updateFeedLinkToggleUi(key);
    toast(next ? "קו מחובר" : "קו מנותק — ניתן להזיז בנפרד");
  }

  function buildSkeletonLines() {
    const { board, layout } = resolveRowLayoutForBuild();
    if (!layout.length) {
      toast("בחר גודל לוח וחלוקת שורות");
      openSheetModal();
      return;
    }
    const opts = readSkeletonOptsFromUI();
    const feedDir = state.meta.feedDir || "top";
    let result;
    try {
      result = BoardSkeleton.generate(layout, drawingArea(), opts, {
        feedDir, rowBusY: {}, feedX: null, feedEndY: null, feedLinks: {},
      });
    } catch (err) {
      console.error(err);
      toast("שגיאה בבניית מבנה קווים — נסה שוב");
      return;
    }
    if (!result.lines.length) {
      toast("לא נוצרו קווים — בדוק חלוקת שורות ב«פרטי גיליון»");
      openSheetModal();
      return;
    }
    commit(() => {
      state.meta.rowLayout = clone(layout);
      state.meta.boardSizeId = board.id;
      state.meta.skeletonOpts = clone(opts);
      state.meta.feedDir = feedDir;
      state.meta.feedX = null;
      state.meta.feedEndY = null;
      state.meta.feedLinks = {};
      state.meta.skLineOverrides = {};
      state.meta.wireCrossSections = {};
      state.meta.rowBusY = {};
      state.meta.skeletonBuilt = true;
      applySkeletonResult(result);
    });
    syncBoardSizeFromLayout();
    if (ui.sheetModal) ui.sheetModal.classList.add("hidden");
    toast(`מבנה קווים: ${layout.length} שורות · ${BoardSkeleton.sumModules(layout)} ענפים`);
    syncSpacingPanelState();
    fitViewToDrawing();
    if (spacingPanelOpen) syncSkeletonOptsLabels();
  }

  function branchHalfWidth(rowIdx) {
    const layout = state.meta.rowLayout || [];
    const row = rowIdx != null ? layout[rowIdx] : null;
    const M = row && row.modules
      ? row.modules
      : Math.max(1, ...layout.map((r) => Number(r.modules) || 0));
    const opts = state.meta.skeletonOpts || BoardSkeleton.defaultOpts();
    return BoardSkeleton.calcSpacing(M, drawingArea(), opts.widthPct || 140) / 2 - 8;
  }

  function slotAtPoint(wx, wy) {
    const slots = state.meta.branchSlots || [];
    if (!slots.length) return null;
    const yPad = moduleHitPad() + 28;
    let best = null, bestDx = Infinity, bestDy = Infinity;
    for (const s of slots) {
      const half = branchHalfWidth(s.row) + 6;
      const dx = Math.abs(wx - s.x);
      if (dx > half) continue;
      const yTop = (s.busY != null ? s.busY : (s.firstSymY != null ? s.firstSymY - 90 : s.y - 90)) - yPad;
      const yBot = (s.stubEnd != null ? s.stubEnd : s.y + 140) + yPad;
      if (wy < yTop || wy > yBot) continue;
      const dy = Math.abs(wy - (s.firstSymY != null ? s.firstSymY : s.y));
      if (dx < bestDx || (dx === bestDx && dy < bestDy)) {
        bestDx = dx;
        bestDy = dy;
        best = s;
      }
    }
    return best;
  }

  function nearestSlot(wx, wy) {
    return slotAtPoint(wx, wy);
  }

  function slotOccupied(slotKey, exceptId) {
    return symsOnSlot(slotKey).some((s) => s.id !== exceptId);
  }

  function findNearestFreeSlot(wx, wy, exceptId) {
    const hit = slotAtPoint(wx, wy);
    if (hit && !slotOccupied(hit.slotKey, exceptId)) return hit;
    const slots = state.meta.branchSlots || [];
    if (!slots.length) return null;
    let best = null, bestDx = Infinity;
    for (const s of slots) {
      if (slotOccupied(s.slotKey, exceptId)) continue;
      const dx = Math.abs(wx - s.x);
      if (dx < bestDx) { bestDx = dx; best = s; }
    }
    return best;
  }

  function snapSymToBus(el, useHistory) {
    if (!state.meta.skeletonBuilt) return false;
    const apply = () => {
      if (el.slotKey) {
        const pos = symPosForSlot(el.slotKey, el.chainIdx);
        if (pos) {
          el.x = pos.x;
          el.y = pos.y;
          return;
        }
      }
      const slot = findNearestFreeSlot(el.x, el.y, el.id);
      if (!slot) {
        if (el.slotKey && !slotOccupied(el.slotKey, el.id)) return;
        toast("אין ענף פנוי על המאס");
        return;
      }
      el.x = snap(clampX(slot.x));
      el.y = snap(clampY(slot.y));
      el.slotKey = slot.slotKey;
    };
    if (useHistory) commit(apply);
    else { apply(); save(); render(); }
    return true;
  }

  function rowBusExtentsForSlot(slot) {
    if (!slot) return null;
    const area = drawingArea();
    const margin = 72;
    return { minX: snap(area.x0 + margin), maxX: snap(area.x1 - margin) };
  }

  function branchColumnBounds(slot) {
    const MIN_BRANCH_GAP = GRID * 2;
    const rowSlots = (state.meta.branchSlots || [])
      .filter((s) => s.row === slot.row)
      .sort((a, b) => a.x - b.x);
    const idx = rowSlots.findIndex((s) => s.slotKey === slot.slotKey);
    const leftN = idx > 0 ? rowSlots[idx - 1] : null;
    const rightN = idx >= 0 && idx < rowSlots.length - 1 ? rowSlots[idx + 1] : null;
    const bus = rowBusExtentsForSlot(slot);
    const busMin = bus ? snap(bus.minX) : snap(slot.x - branchHalfWidth(slot.row));
    const busMax = bus ? snap(bus.maxX) : snap(slot.x + branchHalfWidth(slot.row));
    let leftBound = leftN ? snap(leftN.x + MIN_BRANCH_GAP) : busMin;
    let rightBound = rightN ? snap(rightN.x - MIN_BRANCH_GAP) : busMax;
    leftBound = Math.max(busMin, leftBound);
    rightBound = Math.min(busMax, rightBound);
    if (leftBound > rightBound) {
      leftBound = rightBound = snap(slot.x);
    }
    return {
      lineX: slot.x,
      leftBound: snap(leftBound),
      rightBound: snap(rightBound),
      spaceLeft: slot.x - leftBound,
      spaceRight: rightBound - slot.x,
      isLeftmost: idx === 0,
      isRightmost: idx === rowSlots.length - 1,
    };
  }

  function branchAnnotationLanes(slotKey) {
    const slot = findSlotByKey(slotKey);
    if (!slot) {
      return {
        lineX: 0,
        desc: { x: -34, align: "right" },
        rating: { x: 34, align: "center" },
      };
    }
    const col = branchColumnBounds(slot);
    const { lineX, spaceLeft, spaceRight, isLeftmost, isRightmost } = col;

    let descOnRight;
    const drawArea = drawingArea();
    const paperPad = 48;
    if (isRightmost && !isLeftmost) descOnRight = false;
    else if (isLeftmost && !isRightmost) descOnRight = false;
    else descOnRight = spaceRight >= spaceLeft;

    const lanePad = 8;
    let descOff = Math.min(42, Math.max(26, (descOnRight ? spaceRight : spaceLeft) - lanePad - 10));
    let ratingOff = Math.min(34, Math.max(20, (descOnRight ? spaceLeft : spaceRight) - lanePad - 6));

    if (descOnRight && lineX + descOff > drawArea.x1 - paperPad) {
      descOnRight = false;
      descOff = Math.min(42, Math.max(26, spaceLeft - lanePad - 10));
      ratingOff = Math.min(34, Math.max(20, spaceRight - lanePad - 6));
    }
    if (!descOnRight && lineX - descOff < drawArea.x0 + paperPad) {
      descOnRight = true;
      descOff = Math.min(42, Math.max(26, spaceRight - lanePad - 10));
      ratingOff = Math.min(34, Math.max(20, spaceLeft - lanePad - 6));
    }

    if (descOnRight) {
      return {
        lineX,
        desc: { x: snap(lineX + descOff), align: "left" },
        rating: { x: snap(lineX - ratingOff), align: "center" },
      };
    }
    return {
      lineX,
      desc: { x: snap(lineX - descOff), align: "right" },
      rating: { x: snap(lineX + ratingOff), align: "center" },
    };
  }

  function branchDescLane(slotKey) {
    const lanes = branchAnnotationLanes(slotKey);
    return { x: lanes.desc.x, align: lanes.desc.align };
  }

  function mmLabelYsForSlot(slotKey) {
    const ys = [];
    const slot = findSlotByKey(slotKey);
    if (!slot) return ys;
    for (const ln of state.elements) {
      if (ln.t !== "line" || !ln.skeleton || ln.skKind !== "branch") continue;
      if (ln.slotKey !== slotKey) continue;
      if (ln.segment !== "in" && ln.segment !== "drop") continue;
      if (Math.abs(ln.x1 - ln.x2) >= 2) continue;
      if (Math.abs(ln.y2 - ln.y1) < 10) continue;
      ys.push((ln.y1 + ln.y2) / 2);
    }
    return ys;
  }

  const branchDescLayoutCache = new Map();

  function clearBranchDescLayoutCache() {
    branchDescLayoutCache.clear();
  }

  function estimateDescBadgeH(size) {
    return size * 1.15 + 8;
  }

  function branchDescMaxWidth(slot) {
    if (!slot) return 80;
    const col = branchColumnBounds(slot);
    return Math.max(32, col.rightBound - col.leftBound - 12);
  }

  function wrapTextToWidth(text, maxWidth, fontSize, fontWeight) {
    if (!text) return [];
    const g = ctx;
    g.save();
    g.font = `${fontWeight || 500} ${fontSize}px ui-sans-serif, system-ui, "Noto Sans Hebrew", Arial, sans-serif`;
    const words = String(text).split(/\s+/).filter(Boolean);
    if (!words.length) { g.restore(); return []; }
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (g.measureText(test).width <= maxWidth || !cur) cur = test;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    g.restore();
    return lines.length ? lines : [String(text)];
  }

  function branchDescBaseY(slot, sym, symCount) {
    if (symCount === 1 && slot?.stubEnd != null) return slot.stubEnd + 16;
    return sym.y + 34;
  }

  function resolveBranchDescLayout(el) {
    const cached = branchDescLayoutCache.get(el.slotKey);
    if (cached && cached.has(el.id)) return cached.get(el.id);

    const slot = findSlotByKey(el.slotKey);
    const lineX = slot ? slot.x : el.x;
    const syms = symsOnSlot(el.slotKey).filter((s) => s.desc || s.label);
    const layouts = new Map();
    const size = 10;
    const lineGap = size * 1.22;
    const maxW = branchDescMaxWidth(slot);
    const placed = [];

    for (const sym of syms) {
      const desc = sym.desc || sym.label || "";
      const lines = wrapTextToWidth(desc, maxW, size, 500);
      const blockH = lines.length * lineGap;
      let y = branchDescBaseY(slot, sym, syms.length);

      for (let guard = 0; guard < 20; guard++) {
        let moved = false;
        const top = y - blockH / 2;
        const bot = y + blockH / 2;
        for (const p of placed) {
          if (bot + 4 > p.top && top - 4 < p.bot) {
            y = p.bot + blockH / 2 + 6;
            moved = true;
          }
        }
        if (!moved) break;
      }

      placed.push({ top: y - blockH / 2, bot: y + blockH / 2 });
      layouts.set(sym.id, {
        x: snap(lineX),
        y: snap(y),
        size,
        align: "center",
        lines,
        lineGap,
      });
    }

    branchDescLayoutCache.set(el.slotKey, layouts);
    return layouts.get(el.id) || {
      x: snap(lineX),
      y: snap(el.y + 34),
      size,
      align: "center",
      lines: wrapTextToWidth(el.desc || el.label || "", maxW, size, 500),
      lineGap,
    };
  }

  function computeSymLabelLayout(el) {
    const def = SYMBOLS[el.sym];
    const hasRating = def && def.hasRating;
    if (el.slotKey) {
      return resolveBranchDescLayout(el);
    }
    const rowKey = el.slotKey ? el.slotKey.split("-")[0] : null;
    const neighbors = state.elements.filter((e) => {
      if (e.t !== "sym" || e.id === el.id) return false;
      if (rowKey && e.slotKey) return e.slotKey.split("-")[0] === rowKey;
      return Math.abs(e.y - el.y) < 40;
    });
    let size = 11;
    let x = el.x;
    let y = el.y + (hasRating ? 44 : 28);
    let align = "center";
    const close = neighbors.filter((n) => Math.abs(n.x - el.x) < 72);
    if (close.length) {
      size = 10;
      y = el.y + (hasRating ? 40 : 26);
    }
    const tight = close.filter((n) => Math.abs(n.x - el.x) < 48);
    if (tight.length) {
      size = 9;
      const leftN = close.filter((n) => n.x < el.x - 8);
      const rightN = close.filter((n) => n.x > el.x + 8);
      const leftGap = leftN.length ? el.x - Math.max(...leftN.map((n) => n.x)) : 999;
      const rightGap = rightN.length ? Math.min(...rightN.map((n) => n.x)) - el.x : 999;
      if (leftGap > rightGap + 12) {
        x = el.x - 38;
        align = "end";
      } else if (rightGap > leftGap + 12) {
        x = el.x + 38;
        align = "start";
      } else {
        y = el.y + (hasRating ? 54 : 36);
      }
    }
    return { x: snap(x), y: snap(y), size, align };
  }

  function rowLayoutLabel() {
    const layout = state.meta.rowLayout || [];
    if (!layout.length) return "";
    return layout.map((r) => r.modules).join("+") + " ענפים";
  }

  function currentBoard() {
    return BoardConfig.getBoardSize(state.meta.boardSizeId);
  }

  function layoutBranchTotal() {
    const rows = state.meta.rowLayout || [];
    if (rows.length) return BoardSkeleton.sumModules(rows);
    const slots = state.meta.branchSlots || [];
    if (slots.length) return slots.length;
    return currentBoard().modules;
  }

  function countOccupiedBranches() {
    const slots = state.meta.branchSlots || [];
    if (!slots.length) return 0;
    let n = 0;
    for (const slot of slots) {
      if (symsOnSlot(slot.slotKey).length) n++;
    }
    return n;
  }

  function inferBoardSizeFromLayout(layout) {
    if (!layout || !layout.length) return null;
    const sum = BoardSkeleton.sumModules(layout);
    const rowCount = layout.length;
    const exact = BoardConfig.SIZES.find((b) => b.modules === sum && b.rows === rowCount);
    if (exact) return exact;
    return BoardConfig.SIZES.find((b) => b.modules === sum) || null;
  }

  function syncBoardSizeFromLayout() {
    if (!state.meta.skeletonBuilt) return;
    const layout = state.meta.rowLayout;
    if (!layout || !layout.length) return;
    const inferred = inferBoardSizeFromLayout(layout);
    if (inferred && inferred.id !== state.meta.boardSizeId) {
      state.meta.boardSizeId = inferred.id;
      if (ui.s_board) ui.s_board.value = inferred.id;
    }
  }

  function moduleCapacity() {
    return state.meta.skeletonBuilt ? layoutBranchTotal() : currentBoard().modules;
  }

  function phaseForSymbol(symDef, elPhase) {
    if (elPhase) return elPhase;
    if (symDef && symDef.phases >= 3) return "3p";
    if (symDef && symDef.phases === 2) return state.meta.conductorPhase || "1p";
    return state.meta.conductorPhase || "1p";
  }

  function autoCrossSection(el) {
    const def = SYMBOLS[el.sym];
    if (!def || !def.hasRating || !el.rating) return null;
    const material = el.material || state.meta.conductorMaterial || "cu";
    const phase = phaseForSymbol(def, el.phase);
    return Conductor.selectCrossSection(el.rating, material, phase);
  }

  function formatCrossLabel(s) {
    if (s == null) return "";
    return s + "mm²";
  }

  function wireSkForBranch(slotKey) { return "branch-in-" + slotKey; }

  function wireSkForChainSym(slotKey, chainIdx) {
    const idx = chainIdx || 0;
    if (idx === 0) return "branch-in-" + slotKey;
    return "branch-seg-" + slotKey + "-" + idx;
  }

  function symCrossSectionLabel(sym, cs) {
    if (cs == null) return "";
    const def = sym ? SYMBOLS[sym.sym] : null;
    const phase = sym?.phase || state.meta.conductorPhase || "1p";
    if (phase === "3p" || (def && def.phases >= 3)) return "3X" + cs + "mm";
    return cs + "mm";
  }

  function branchCrossLabel(slotKey, cs) {
    if (cs == null) return "";
    const sym = symsOnSlot(slotKey)[0];
    return symCrossSectionLabel(sym, cs);
  }

  function branchCrossLabelForLine(el, cs) {
    if (cs == null || !el.slotKey) return branchCrossLabel(el.slotKey, cs);
    const idx = el.chainIdx != null ? el.chainIdx : 0;
    const syms = symsOnSlot(el.slotKey);
    const sym = syms[idx] || syms[0];
    return symCrossSectionLabel(sym, cs);
  }

  function syncWireCrossFromSymbols() {
    if (!state.meta.wireCrossSections) state.meta.wireCrossSections = {};
    const activeKeys = new Set();
    for (const sym of state.elements) {
      if (sym.t !== "sym" || !sym.slotKey || sym.crossSection == null) continue;
      const def = SYMBOLS[sym.sym];
      if (!def || !def.hasRating) continue;
      const sk = wireSkForChainSym(sym.slotKey, sym.chainIdx || 0);
      state.meta.wireCrossSections[sk] = sym.crossSection;
      activeKeys.add(sk);
    }
    for (const k of Object.keys(state.meta.wireCrossSections)) {
      if ((k.startsWith("branch-in-") || k.startsWith("branch-seg-")) && !activeKeys.has(k)) {
        delete state.meta.wireCrossSections[k];
      }
    }
  }

  function wireCrossForLine(el) {
    if (!el) return null;
    if (el.skId) {
      const direct = getWireCross(el.skId);
      if (direct != null) return direct;
    }
    if (el.slotKey && el.chainIdx != null) {
      const chainCs = getWireCross(wireSkForChainSym(el.slotKey, el.chainIdx));
      if (chainCs != null) return chainCs;
    }
    if (el.slotKey) return getWireCross(wireSkForBranch(el.slotKey));
    return null;
  }

  function populateCrossSelect(selectEl, current) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    const none = document.createElement("option");
    none.value = "";
    none.textContent = "— ללא —";
    selectEl.appendChild(none);
    for (const row of Conductor.TABLE) {
      const opt = document.createElement("option");
      opt.value = String(row.s);
      opt.textContent = row.s + " mm²";
      if (current === row.s) opt.selected = true;
      selectEl.appendChild(opt);
    }
  }

  function branchSlotKeyFromSkId(skId) {
    if (skId.startsWith("branch-in-")) return skId.slice(10);
    if (skId.startsWith("branch-out-")) return skId.slice(11);
    if (skId.startsWith("branch-junc-")) return skId.slice(12);
    if (skId.startsWith("branch-term-")) return skId.slice(12);
    if (skId.startsWith("branch-in-dot-")) return skId.slice(14);
    if (skId.startsWith("branch-seg-") || skId.startsWith("branch-link-")) {
      const rest = skId.startsWith("branch-seg-") ? skId.slice(11) : skId.slice(12);
      const lastDash = rest.lastIndexOf("-");
      return lastDash > 0 ? rest.slice(0, lastDash) : rest;
    }
    return null;
  }

  function getWireCross(skId) {
    const v = (state.meta.wireCrossSections || {})[skId];
    return v != null ? v : null;
  }

  function setWireCross(skId, value, recordHistory) {
    if (!skId) return;
    const apply = () => {
      if (!state.meta.wireCrossSections) state.meta.wireCrossSections = {};
      if (value == null || value === "" || Number.isNaN(value)) {
        delete state.meta.wireCrossSections[skId];
      } else {
        state.meta.wireCrossSections[skId] = Number(value);
      }
    };
    if (recordHistory) commit(apply);
    else { apply(); save(); render(); }
  }

  function hideWirePopup() {
    if (!ui.wirePopup) return;
    ui.wirePopup.classList.add("hidden");
    selectedWireSkId = null;
  }

  function showWirePopup(sx, sy, skId) {
    if (!ui.wirePopup) return;
    hideBranchPopup();
    selectedBranchKey = null;
    selectedWireSkId = skId;
    if (ui.wirePopupHint) {
      ui.wirePopupHint.textContent = skId.startsWith("bus-")
        ? "קו ראשי (אופקי)"
        : "קו משני (ענף)";
    }
    populateCrossSelect(ui.wire_cross, getWireCross(skId));
    ui.wirePopup.classList.remove("hidden");
    placeFloatingPopup(ui.wirePopup, sx, sy, 220, 160);
  }

  function applyWireCross() {
    if (!selectedWireSkId) return;
    const val = ui.wire_cross.value;
    setWireCross(selectedWireSkId, val ? Number(val) : null, true);
    hideWirePopup();
    toast(val ? "שטח חתך נשמר" : "שטח חתך הוסר");
  }

  function countUsedModules() {
    let total = 0;
    for (const el of state.elements) {
      if (el.t !== "sym") continue;
      const def = SYMBOLS[el.sym];
      if (def && def.modules > 0) total += def.modules;
    }
    return total;
  }

  function moduleStatusText() {
    const cap = moduleCapacity();
    if (state.meta.skeletonBuilt) {
      const occupied = countOccupiedBranches();
      const over = occupied > cap;
      return `${occupied} / ${cap} ענפים${over ? " — חריגה!" : ""}`;
    }
    const used = countUsedModules();
    const over = used > cap;
    return `${used} / ${cap} מודולים${over ? " — חריגה!" : ""}`;
  }

  function checkModuleOverflow(force) {
    const cap = moduleCapacity();
    const dinUsed = countUsedModules();
    const over = state.meta.skeletonBuilt
      ? (countOccupiedBranches() > cap || dinUsed > cap)
      : dinUsed > cap;
    if (over) {
      if (force || !overflowWarned) {
        const board = currentBoard();
        if (state.meta.skeletonBuilt) {
          toast(`חריגה בלוח: ${countOccupiedBranches()} ענפים תפוסים מתוך ${cap}`);
        } else {
          toast(`חריגה בלוח: ${dinUsed} מודולים מתוך ${cap} (${board.label})`);
        }
        overflowWarned = true;
      }
    } else {
      overflowWarned = false;
    }
  }

  function refreshCrossSectionFields() {
    if (!symEditEl) return;
    const tmp = {
      sym: symEditEl.sym,
      rating: Number(ui.sym_rating.value) || 0,
      material: ui.sym_material.value,
      phase: ui.sym_phase.value,
    };
    const s = autoCrossSection(tmp);
    ui.sym_cross.value = s != null ? formatCrossLabel(s) : "—";
  }

  function snapshot() { return { meta: clone(state.meta), elements: clone(state.elements) }; }
  function pushHistory() { undoStack.push(snapshot()); if (undoStack.length > HISTORY_LIMIT) undoStack.shift(); redoStack.length = 0; }
  function commit(mut) { pushHistory(); mut(); afterChange(); }
  function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); applyState(undoStack.pop()); }
  function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); applyState(redoStack.pop()); }
  function applyState(s) {
    state.meta = s.meta;
    state.elements = s.elements;
    if (!state.elements.some((e) => e.id === state.selectedId)) state.selectedId = null;
    if (state.meta.skeletonBuilt) syncChainSymPositions();
    afterChange();
  }
  function afterChange() {
    if (state.meta.skeletonBuilt) syncChainSymPositions();
    save();
    render();
    syncUI();
    checkModuleOverflow(false);
  }
  function defaultMeta() {
    return {
      title: "לוח חדש",
      author: "",
      date: today(),
      file: "לוח ראשי",
      folio: "1/1",
      boardSizeId: "2x24",
      conductorMaterial: "cu",
      conductorPhase: "1p",
      rowLayout: [],
      branchSlots: [],
      skeletonBuilt: false,
      skeletonVersion: 0,
      skeletonOpts: { widthPct: 140, rowGapPct: 100, stubLen: 110 },
      feedDir: "top",
      feedAlign: "center",
      feedX: null,
      feedEndY: null,
      feedLinks: {},
      skLineOverrides: {},
      wireCrossSections: {},
      rowBusY: {},
    };
  }

  function invalidateStaleSkeleton() {
    if (!state.meta.skeletonBuilt) return;
    if (state.meta.skeletonVersion === SKELETON_VERSION) return;
    const layout = state.meta.rowLayout;
    state.elements = state.elements.filter((e) => !e.skeleton);
    migrateWireCrossKeys();
    if (layout && layout.length) {
      const result = BoardSkeleton.generate(
        layout,
        drawingArea(),
        state.meta.skeletonOpts || BoardSkeleton.defaultOpts(),
        getSkeletonGenerateConfig()
      );
      state.meta.branchSlots = result.slots;
      state.meta.skeletonBuilt = true;
      state.meta.skeletonVersion = SKELETON_VERSION;
      state.elements = result.lines.concat(result.dots).concat(state.elements);
      applySkLineOverrides();
      syncSkeletonDotsFromLines();
      syncChainSymPositions();
      syncWireCrossFromSymbols();
      save();
      toast("מבנה קווים עודכן — סמלים מחוברים בין קצות הקווים");
      return;
    }
    state.meta.skeletonBuilt = false;
    state.meta.branchSlots = [];
    state.meta.feedX = null;
    state.meta.feedEndY = null;
    state.meta.feedLinks = {};
    state.meta.skLineOverrides = {};
    state.meta.wireCrossSections = {};
    state.meta.rowBusY = {};
    state.meta.skeletonVersion = 0;
    save();
    toast("מבנה קווים ישן הוסר — לחץ ״בנה מבנה קווים״ מחדש");
  }

  function migrateWireCrossKeys() {
    const wc = state.meta.wireCrossSections || {};
    const next = {};
    for (const k of Object.keys(wc)) {
      if (k.startsWith("branch-link-")) {
        const rest = k.slice(12);
        const lastDash = rest.lastIndexOf("-");
        if (lastDash > 0) {
          next["branch-seg-" + rest.slice(0, lastDash) + "-" + rest.slice(lastDash + 1)] = wc[k];
          continue;
        }
      }
      if (k.startsWith("branch-") && !k.startsWith("branch-in-") && !k.startsWith("branch-out-") && !k.startsWith("branch-seg-")) {
        next["branch-in-" + k.slice(7)] = wc[k];
      } else {
        next[k] = wc[k];
      }
    }
    state.meta.wireCrossSections = next;
  }

  function newProject() {
    if (!confirm("למחוק את כל השרטוט ולהתחיל פרויקט חדש?")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state.meta = defaultMeta();
    state.elements = [];
    state.selectedId = null;
    undoStack.length = 0;
    redoStack.length = 0;
    overflowWarned = false;
    ui.sheetModal.classList.add("hidden");
    welcomeBoardId = state.meta.boardSizeId || "2x24";
    applyRowLayoutForBoard(welcomeBoardId);
    afterChange();
    showWelcome(true);
  }

  function buildWelcomeBoardGrid() {
    if (!ui.welcomeBoardGrid) return;
    ui.welcomeBoardGrid.innerHTML = "";
    for (const b of BoardConfig.SIZES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "welcome-board-card" + (b.id === welcomeBoardId ? " is-selected" : "");
      btn.dataset.boardId = b.id;
      btn.innerHTML = "<strong>" + b.label + "</strong><span>" + b.rows + "×" + Math.ceil(b.modules / b.rows) + " מקס · " + b.modules + " מודולים</span>";
      btn.addEventListener("click", () => {
        welcomeBoardId = b.id;
        ui.welcomeBoardGrid.querySelectorAll(".welcome-board-card").forEach((c) => {
          c.classList.toggle("is-selected", c.dataset.boardId === welcomeBoardId);
        });
        if (ui.welcomeBoardHint) {
          const layout = BoardSkeleton.evenSplit(b.modules, b.rows);
          ui.welcomeBoardHint.textContent =
            "חלוקה אוטומטית: " + layout.map((r) => r.modules).join(" + ") + " ענפים";
        }
      });
      ui.welcomeBoardGrid.appendChild(btn);
    }
    const sel = BoardConfig.getBoardSize(welcomeBoardId);
    if (ui.welcomeBoardHint && sel) {
      const layout = BoardSkeleton.evenSplit(sel.modules, sel.rows);
      ui.welcomeBoardHint.textContent =
        "חלוקה אוטומטית: " + layout.map((r) => r.modules).join(" + ") + " ענפים";
    }
  }

  function showWelcome(showContinue) {
    if (!ui.welcomeScreen) return;
    buildWelcomeBoardGrid();
    if (ui.welcomeContinue) {
      ui.welcomeContinue.classList.toggle("hidden", !showContinue);
    }
    ui.welcomeScreen.classList.add("is-visible");
    ui.welcomeScreen.setAttribute("aria-hidden", "false");
  }

  function hideWelcome() {
    if (!ui.welcomeScreen) return;
    ui.welcomeScreen.classList.remove("is-visible");
    ui.welcomeScreen.setAttribute("aria-hidden", "true");
  }

  function startWelcomeProject() {
    const board = BoardConfig.getBoardSize(welcomeBoardId);
    state.meta.boardSizeId = board.id;
    state.meta.title = state.meta.title || "לוח חדש";
    if (!state.meta.date) {
      const d = new Date();
      state.meta.date = String(d.getDate()).padStart(2, "0") + "/" +
        String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
    }
    applyRowLayoutForBoard(board.id, board.rows);
    hideWelcome();
    if (!state.meta.skeletonBuilt) {
      if (ui.s_board) ui.s_board.value = board.id;
      buildSkeletonLines();
    } else {
      save();
      syncUI();
      render();
    }
    toast("מוכן — לחיצה כפולה על מודול להוספת סמל או מחיקה");
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta: state.meta, elements: state.elements })); } catch (e) {}
  }
  function load() {
    try {
      const r = localStorage.getItem(STORAGE_KEY);
      if (!r) return;
      const d = JSON.parse(r);
      if (d && d.meta) {
        state.meta = Object.assign(state.meta, d.meta);
        if (!Array.isArray(state.meta.rowLayout)) state.meta.rowLayout = [];
        if (!state.meta.branchSlots) state.meta.branchSlots = [];
        if (!state.meta.skeletonOpts) state.meta.skeletonOpts = BoardSkeleton.defaultOpts();
        if (!state.meta.feedDir) state.meta.feedDir = "top";
        if (!state.meta.rowBusY) state.meta.rowBusY = {};
        if (!state.meta.feedLinks) state.meta.feedLinks = {};
        if (!state.meta.skLineOverrides) state.meta.skLineOverrides = {};
        if (!state.meta.wireCrossSections) state.meta.wireCrossSections = {};
        if (state.meta.feedEndY == null) state.meta.feedEndY = null;
        if (state.meta.skeletonBuilt == null) {
          state.meta.skeletonBuilt = state.elements && state.elements.some((e) => e.skeleton);
        }
      }
      if (d && Array.isArray(d.elements)) {
        state.elements = d.elements.map(migrateElement);
      }
      if (!state.meta.skeletonBuilt) {
        state.elements = state.elements.filter((e) => !e.skeleton);
        state.meta.branchSlots = [];
      }
      invalidateStaleSkeleton();
      syncBoardSizeFromLayout();
    } catch (e) {}
  }

  function migrateElement(el) {
    if (el.t === "text") {
      if (el.rot == null) el.rot = 0;
      return el;
    }
    if (el.t !== "sym") return el;
    const def = SYMBOLS[el.sym];
    if (!def) return el;
    if (el.rating == null && def.hasRating) el.rating = 16;
    if (!el.curve && def.hasRating) el.curve = "C";
    if (!el.material) el.material = state.meta.conductorMaterial || "cu";
    if (!el.phase) el.phase = phaseForSymbol(def);
    if (el.crossSection == null && def.hasRating) el.crossSection = autoCrossSection(el);
    if (el.desc == null) el.desc = el.label || "";
    return el;
  }

  function newSymElement(symId, wx, wy) {
    const def = SYMBOLS[symId];
    const el = {
      id: uid(), t: "sym", sym: symId,
      x: snap(clampX(wx)), y: snap(clampY(wy)), rot: 0,
      rating: def && def.hasRating ? 16 : null,
      curve: def && def.hasRating ? "C" : "",
      material: state.meta.conductorMaterial || "cu",
      phase: phaseForSymbol(def),
      crossSection: null,
      desc: "",
      label: "",
    };
    if (def && def.hasRating) el.crossSection = autoCrossSection(el);
    return el;
  }

  function stageSize() {
    const stage = document.getElementById("canvas-stage");
    if (!stage) return { w: innerWidth, h: innerHeight };
    const r = stage.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
  }

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    const { w, h } = stageSize();
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    render();
  }
  function paperFit() {
    const { w: cw, h: ch } = stageSize();
    const mobile = cw <= 520;
    const topM = mobile ? 0.08 : 0.05;
    const bottomM = mobile ? 0.1 : 0.05;
    const sideM = mobile ? 0.06 : 0.05;
    const aw = cw * (1 - 2 * sideM);
    const ah = ch * (1 - topM - bottomM);
    const s = Math.min(aw / PAPER.W, ah / PAPER.H);
    return { s, ox: (cw - PAPER.W * s) / 2, oy: ch * topM + (ah - PAPER.H * s) / 2 };
  }
  function T() {
    const f = paperFit();
    const s = f.s * view.scale;
    return { s, ox: f.ox * view.scale + view.tx, oy: f.oy * view.scale + view.ty };
  }
  function w2s(wx, wy, t) { t = t || T(); return { x: wx * t.s + t.ox, y: wy * t.s + t.oy }; }
  function s2w(sx, sy) { const t = T(); return { x: (sx - t.ox) / t.s, y: (sy - t.oy) / t.s }; }
  function canvasPointToClient(sx, sy) {
    const r = canvas.getBoundingClientRect();
    return { x: r.left + sx, y: r.top + sy };
  }

  function canvasEventXY(e) {
    const r = canvas.getBoundingClientRect();
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  }

  function placeFloatingPopup(el, sx, sy, popW, popH) {
    if (!el) return;
    const cl = canvasPointToClient(sx, sy);
    const w = popW != null ? popW : 220;
    const h = popH != null ? popH : 180;
    el.style.left = clamp(cl.x, 8, innerWidth - w - 8) + "px";
    el.style.top = clamp(cl.y, 8, innerHeight - h - 8) + "px";
  }

  function branchPopupSlotKey() {
    if (ui.branchPopup && ui.branchPopup.dataset.slotKey) return ui.branchPopup.dataset.slotKey;
    return selectedBranchKey;
  }
  function zoomAt(f, k) {
    const n = clamp(view.scale * k, MIN_SCALE, MAX_SCALE), r = n / view.scale;
    view.tx = f.x - (f.x - view.tx) * r;
    view.ty = f.y - (f.y - view.ty) * r;
    view.scale = n;
  }

  function render() {
    const { w, h } = stageSize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.direction = "ltr";
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0e1014";
    ctx.fillRect(0, 0, w, h);
    const t = T();
    drawSheet(ctx, t, { grid: true, liveGlow: true });
    drawSelection(ctx, t);
    if (draftLine) drawLineEl(ctx, t, draftLine);
  }

  function drawSheet(g, t, opts) {
    const a = w2s(0, 0, t), b = w2s(PAPER.W, PAPER.H, t);
    const pw = b.x - a.x, ph = b.y - a.y;
    g.fillStyle = "#ffffff";
    g.fillRect(a.x, a.y, pw, ph);
    g.strokeStyle = "rgba(0,0,0,0.06)";
    g.lineWidth = 1;
    g.strokeRect(a.x + 0.5, a.y + 0.5, pw - 1, ph - 1);
    if (opts && opts.grid) drawGrid(g, t);
    drawElements(g, t, opts);
    drawBranchSlots(g, t);
    drawFrame(g, t);
    drawTitleBlock(g, t);
    drawBoardBadge(g, t);
    if (opts && opts.exportWatermark) drawExportWatermark(g, t);
  }

  function drawExportWatermark(g, t) {
    const cx = PAPER.W / 2;
    const cy = PAPER.H / 2;
    const r = PAPER.W * 0.38;
    g.save();
    const p0 = w2s(cx - r, cy, t);
    const p1 = w2s(cx + r, cy, t);
    g.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
    g.rotate(-Math.PI / 6);
    g.fillStyle = "rgba(180, 83, 9, 0.07)";
    g.font = `${Math.max(14, 22 * t.s)}px ui-sans-serif, system-ui, "Noto Sans Hebrew", Arial, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(EXPORT_DISCLAIMER_HE, 0, 0);
    g.restore();

    const y = PAPER.H - PAPER.band + 2;
    const x0 = PAPER.band + 4;
    const w = PAPER.W - (PAPER.band + 4) * 2;
    const h = 30;
    const band0 = w2s(x0, y, t);
    const band1 = w2s(x0 + w, y + h, t);
    g.fillStyle = "rgba(255, 248, 240, 0.98)";
    g.fillRect(band0.x, band0.y, band1.x - band0.x, band1.y - band0.y);
    g.strokeStyle = "#b45309";
    g.lineWidth = Math.max(1, 1.4 * t.s);
    g.strokeRect(band0.x + 0.5, band0.y + 0.5, band1.x - band0.x - 1, band1.y - band0.y - 1);
    wtext(g, t, EXPORT_DISCLAIMER_HE, PAPER.W / 2, y + 10, 10, "center", "middle", "#7c2d12");
    wtext(g, t, EXPORT_DISCLAIMER_EN, PAPER.W / 2, y + 22, 9, "center", "middle", "#92400e");
  }

  function drawGrid(g, t) {
    g.strokeStyle = "#e8edf2";
    g.lineWidth = 1;
    const r = sheetContentRect();
    for (let x = r.x0; x <= r.x1; x += GRID) {
      const p = w2s(x, r.y0, t), q = w2s(x, r.y1, t);
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
    }
    for (let y = r.y0; y <= r.y1; y += GRID) {
      const p = w2s(r.x0, y, t), q = w2s(r.x1, y, t);
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
    }
  }

  function wline(g, t, x1, y1, x2, y2, lw) {
    const p = w2s(x1, y1, t), q = w2s(x2, y2, t);
    g.lineWidth = lw == null ? Math.max(1, 1.2 * t.s) : lw;
    g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
  }
  function wrect(g, t, x, y, w, h) {
    const p = w2s(x, y, t), q = w2s(x + w, y + h, t);
    g.beginPath(); g.rect(p.x, p.y, q.x - p.x, q.y - p.y); g.stroke();
  }
  function wtext(g, t, s, x, y, size, al, bl, col) {
    const p = w2s(x, y, t);
    g.fillStyle = col || "#111";
    g.font = `${size * t.s}px ui-sans-serif, system-ui, "Noto Sans Hebrew", Arial, sans-serif`;
    g.textAlign = al || "center";
    g.textBaseline = bl || "middle";
    g.fillText(s, p.x, p.y);
  }

  function wtextVertical(g, t, s, x, y, size, offsetX, col) {
    const p = w2s(x, y, t);
    g.save();
    g.fillStyle = col || "#333";
    g.font = `${size * t.s}px ui-sans-serif, system-ui, "Noto Sans Hebrew", Arial, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.translate(p.x + (offsetX || -12) * t.s, p.y);
    g.rotate(-Math.PI / 2);
    g.fillText(s, 0, 0);
    g.restore();
  }

  function drawFrame(g, t) {
    g.strokeStyle = "#222";
    const band = PAPER.band, x0 = band, y0 = band, x1 = PAPER.W - band, y1 = PAPER.H - band;
    wrect(g, t, 2, 2, PAPER.W - 4, PAPER.H - 4);
    wrect(g, t, x0, y0, x1 - x0, y1 - y0);
  }

  function drawTitleBlock(g, t) {
    g.strokeStyle = "#222";
    const band = PAPER.band, x0 = band, x1 = PAPER.W - band;
    const yTop = band, w = x1 - x0, leftW = w * 0.28, rightW = w * 0.24, cRight = x1 - rightW;
    wrect(g, t, x0, yTop, w, PAPER.titleH);
    wline(g, t, x0 + leftW, yTop, x0 + leftW, yTop + PAPER.titleH);
    wline(g, t, cRight, yTop, cRight, yTop + PAPER.titleH);
    wline(g, t, x0, yTop + PAPER.titleH / 2, x0 + leftW, yTop + PAPER.titleH / 2);
    wline(g, t, cRight, yTop + PAPER.titleH / 2, x1, yTop + PAPER.titleH / 2);
    const m = state.meta, pad = 10;
    wtext(g, t, "Author: " + (m.author || ""), x0 + pad, yTop + PAPER.titleH * 0.27, 15, "start", "middle", "#111");
    wtext(g, t, "Date: " + (m.date || ""), x0 + pad, yTop + PAPER.titleH * 0.77, 15, "start", "middle", "#111");
    wtext(g, t, m.title || "", (x0 + leftW + cRight) / 2, yTop + PAPER.titleH / 2, 20, "center", "middle", "#111");
    wtext(g, t, "File: " + (m.file || ""), cRight + pad, yTop + PAPER.titleH * 0.27, 15, "start", "middle", "#111");
    wtext(g, t, "Folio: " + (m.folio || ""), cRight + pad, yTop + PAPER.titleH * 0.77, 15, "start", "middle", "#111");
  }

  function drawBoardBadge(g, t) {
    const cap = moduleCapacity();
    const occupied = state.meta.skeletonBuilt ? countOccupiedBranches() : countUsedModules();
    const dinUsed = countUsedModules();
    const over = state.meta.skeletonBuilt
      ? (occupied > cap || dinUsed > cap)
      : dinUsed > cap;
    const x = PAPER.W - PAPER.band - 8, y = PAPER.band + PAPER.titleH + 14;
    wtext(g, t, currentBoard().label, x, y, 13, "end", "middle", "#333");
    const rows = state.meta.rowLayout || [];
    if (state.meta.skeletonBuilt && rows.length) {
      wtext(g, t, rows.length + " שורות · " + rowLayoutLabel(), x, y + 16, 11, "end", "middle", "#666");
    }
    if (state.meta.skeletonBuilt) {
      wtext(g, t, moduleStatusText(), x, y + (rows.length ? 32 : 18), 12, "end", "middle", over ? "#c0392b" : "#555");
    }
  }

  function wtextWithHalo(g, t, s, x, y, size, al, bl, col) {
    const p = w2s(x, y, t);
    const fs = size * t.s;
    g.font = `${fs}px ui-sans-serif, system-ui, "Noto Sans Hebrew", Arial, sans-serif`;
    g.textAlign = al || "center";
    g.textBaseline = bl || "middle";
    g.lineWidth = Math.max(4, 5 * t.s);
    g.strokeStyle = "#fff";
    g.strokeText(s, p.x, p.y);
    g.fillStyle = col || "#111";
    g.fillText(s, p.x, p.y);
  }

  function wtextMultilineHalo(g, t, lines, x, y, size, align, col, lineGap) {
    if (!lines || !lines.length) return;
    const gap = lineGap || size * 1.22;
    const totalH = (lines.length - 1) * gap;
    const startY = y - totalH / 2;
    for (let i = 0; i < lines.length; i++) {
      wtextWithHalo(g, t, lines[i], x, startY + i * gap, size, align, "middle", col);
    }
  }

  function wtextWithBadge(g, t, s, x, y, size, al, bl, col) {
    const p = w2s(x, y, t);
    const fs = size * t.s;
    const textAlign = al === "left" ? "left" : al === "right" ? "right" : al || "center";
    g.font = `600 ${fs}px ui-sans-serif, system-ui, "Noto Sans Hebrew", Arial, sans-serif`;
    g.textAlign = textAlign;
    g.textBaseline = bl || "middle";
    const m = g.measureText(s);
    const tw = m.width;
    const th = fs * 1.15;
    let bx = p.x, by = p.y;
    if (textAlign === "right" || textAlign === "end") bx -= tw;
    else if (textAlign === "center") bx -= tw / 2;
    if (bl === "middle") by -= th / 2;
    else if (bl === "bottom") by -= th;
    const padX = 5 * t.s, padY = 3 * t.s, r = 4 * t.s;
    g.fillStyle = "rgba(255,255,255,0.96)";
    g.strokeStyle = "rgba(0,0,0,0.1)";
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(bx - padX, by - padY, tw + padX * 2, th + padY * 2, r);
    g.fill();
    g.stroke();
    g.fillStyle = col || "#111";
    g.fillText(s, p.x, p.y);
  }

  function wtextOnBranchLine(g, t, s, lineX, y, size, col) {
    const p = w2s(lineX, y, t);
    const fs = (size || 10) * t.s;
    g.font = `700 ${fs}px ui-sans-serif, system-ui, "Noto Sans Hebrew", Arial, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const m = g.measureText(s);
    const tw = m.width;
    const th = fs * 1.2;
    const padX = 6 * t.s;
    const padY = 4 * t.s;
    g.fillStyle = "rgba(255,255,255,0.98)";
    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(p.x - tw / 2 - padX, p.y - th / 2 - padY, tw + padX * 2, th + padY * 2, 4 * t.s);
    g.fill();
    g.stroke();
    g.fillStyle = col || "#111";
    g.fillText(s, p.x, p.y);
  }

  function wtextVerticalWithHalo(g, t, s, x, y, size, offsetX, col) {
    const p = w2s(x, y, t);
    g.save();
    g.translate(p.x + (offsetX || -12) * t.s, p.y);
    g.rotate(-Math.PI / 2);
    const fs = size * t.s;
    g.font = `${fs}px ui-sans-serif, system-ui, "Noto Sans Hebrew", Arial, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = Math.max(4, 5 * t.s);
    g.strokeStyle = "#fff";
    g.strokeText(s, 0, 0);
    g.fillStyle = col || "#333";
    g.fillText(s, 0, 0);
    g.restore();
  }

  function drawElements(g, t, opts) {
    clearBranchDescLayoutCache();
    g.strokeStyle = "#111"; g.fillStyle = "#111";
    for (const el of state.elements) {
      if (el.t === "line" && el.skeleton) drawLineStroke(g, t, el, opts);
    }
    for (const el of state.elements) {
      if (el.t === "line" && !el.skeleton) drawLineStroke(g, t, el, opts);
    }
    for (const el of state.elements) {
      if (el.t === "dot") drawDotEl(g, t, el);
    }
    for (const el of state.elements) {
      if (el.t === "sym") drawSymBody(g, t, el);
    }
    for (const el of state.elements) {
      if (el.t === "sym") drawSymDescOverlay(g, t, el);
    }
    for (const el of state.elements) {
      if (el.t === "sym") drawSymOverlays(g, t, el);
    }
    for (const el of state.elements) {
      if (el.t === "line" && el.skeleton) drawLineLabels(g, t, el);
    }
    for (const el of state.elements) {
      if (el.t === "line" && !el.skeleton) drawLineLabels(g, t, el);
    }
    for (const el of state.elements) {
      if (el.t === "text") drawTextEl(g, t, el);
    }
  }

  function drawLineStroke(g, t, el, opts) {
    const live = opts && opts.liveGlow && el.skeleton;
    const isFeed = el.skKind === "entry" || el.skKind === "bus" || el.skKind === "feed";
    let lw = el.skeleton ? 1.7 : 1.5;
    if (el.skKind === "entry") lw = 2;
    if (el.skKind === "branch") lw = 1.9;
    const lineW = Math.max(1, lw * t.s);
    if (live) {
      const color = isFeed ? "#ffb020" : "#22d3ee";
      g.save();
      g.strokeStyle = color;
      g.shadowColor = isFeed ? "rgba(255, 176, 32, 0.7)" : "rgba(34, 211, 238, 0.55)";
      g.shadowBlur = Math.max(4, 7 * t.s);
      wline(g, t, el.x1, el.y1, el.x2, el.y2, lineW);
      g.shadowBlur = 0;
      g.strokeStyle = color;
      wline(g, t, el.x1, el.y1, el.x2, el.y2, lineW);
      g.restore();
      return;
    }
    g.strokeStyle = "#111";
    wline(g, t, el.x1, el.y1, el.x2, el.y2, lineW);
  }

  function drawLineLabels(g, t, el) {
    const cs = wireCrossForLine(el);
    if (cs == null) return;
    if (el.skeleton && el.skKind === "branch" && (el.segment === "in" || el.segment === "drop")) {
      const lineX = el.x1;
      const segH = Math.abs(el.y2 - el.y1);
      if (Math.abs(el.x1 - el.x2) < 2 && segH >= 10) {
        const label = branchCrossLabelForLine(el, cs);
        const my = (el.y1 + el.y2) / 2;
        wtextVerticalWithHalo(g, t, label, lineX, my, 10, 12, "#333");
      }
    } else if (el.skeleton && el.skKind !== "branch") {
      const mx = (el.x1 + el.x2) / 2;
      const my = (el.y1 + el.y2) / 2;
      if (Math.abs(el.x1 - el.x2) < 2) {
        wtextVerticalWithHalo(g, t, cs + "mm", mx, my, 10, -16, "#333");
      } else {
        wtextWithHalo(g, t, formatCrossLabel(cs), mx, my - 14, 10, "center", "middle", "#333");
      }
    }
  }
  function drawBranchSlots(g, t) {
    if (!placeSym) return;
    const slots = state.meta.branchSlots;
    if (!slots || !slots.length) return;
    for (const s of slots) {
      const c = w2s(s.x, s.y, t);
      g.fillStyle = "rgba(255,176,32,0.45)";
      g.beginPath();
      g.arc(c.x, c.y, Math.max(2, 3 * t.s), 0, Math.PI * 2);
      g.fill();
    }
  }
  function drawDotEl(g, t, el) {
    const c = w2s(el.x, el.y, t);
    let r = (el.r || 3.5) * t.s;
    if (el.terminal) r = Math.max(r, 5 * t.s);
    g.fillStyle = "#111";
    g.beginPath();
    g.arc(c.x, c.y, Math.max(2, r), 0, Math.PI * 2);
    g.fill();
  }

  function drawLineEl(g, t, el) {
    drawLineStroke(g, t, el);
    drawLineLabels(g, t, el);
  }
  function drawTextEl(g, t, el) {
    const c = w2s(el.x, el.y, t);
    const rot = el.rot || 0;
    if (!rot) {
      wtextWithHalo(g, t, el.val, el.x, el.y, el.size || 16, "start", "middle", "#111");
      return;
    }
    g.save();
    g.translate(c.x, c.y);
    g.rotate(rot * Math.PI / 180);
    const fs = (el.size || 16) * t.s;
    g.font = `${fs}px ui-sans-serif, system-ui, "Noto Sans Hebrew", Arial, sans-serif`;
    g.textAlign = "start";
    g.textBaseline = "middle";
    g.lineWidth = Math.max(3, 4 * t.s);
    g.strokeStyle = "#fff";
    g.strokeText(el.val, 0, 0);
    g.fillStyle = "#111";
    g.fillText(el.val, 0, 0);
    g.restore();
  }

  function textHitBounds(el) {
    const size = el.size || 16;
    const len = Math.max(8, (el.val || "").length * size * 0.55);
    const h = size + 8;
    if (!el.rot) return { hw: len, hh: h };
    const rad = (el.rot || 0) * Math.PI / 180;
    const hw = Math.abs(Math.cos(rad) * len) + Math.abs(Math.sin(rad) * h * 0.5);
    const hh = Math.abs(Math.sin(rad) * len) + Math.abs(Math.cos(rad) * h * 0.5);
    return { hw, hh };
  }

  function symRatingLabel(el, def) {
    if (!def || !def.hasRating || !el.rating) return "";
    return (el.curve || "C") + el.rating;
  }

  function symPoleCount(def) {
    if (!def) return 1;
    if (def.modules > 0) return def.modules;
    if (def.phases > 0) return def.phases;
    return 1;
  }

  function symUsesMcbOnBus(def) {
    if (!def || !def.hasRating || !def.id) return false;
    return /^kd_mcb_|^ie_motor_breaker_/.test(def.id);
  }

  function drawSymGraphic(g, el, def) {
    if (!el.slotKey) {
      def.draw(g);
      return;
    }
    if (symUsesMcbOnBus(def) && PanelDraw.mcbPolesOnBus) {
      PanelDraw.mcbPolesOnBus(g, symPoleCount(def));
      if (def.id.startsWith("ie_motor_breaker_")) PanelDraw.TT(g, "IE", 0, 14, 7);
      return;
    }
    if (PanelDraw.drawBranchBody) {
      PanelDraw.drawBranchBody(g, () => def.draw(g));
      return;
    }
    def.draw(g);
  }

  function drawSymBody(g, t, el) {
    const def = SYMBOLS[el.sym];
    if (!def) return;
    const c = w2s(el.x, el.y, t);
    g.save();
    g.translate(c.x, c.y);
    g.rotate((el.rot || 0) * Math.PI / 180);
    g.scale(t.s, t.s);
    g.strokeStyle = "#111"; g.fillStyle = "#111";
    g.lineWidth = 1.8; g.lineCap = "round"; g.lineJoin = "round";
    drawSymGraphic(g, el, def);
    g.restore();
  }

  function drawChainBadge(g, t, el, chainN, chainIdx) {
    if (!el.slotKey || chainN <= 1) return;
    const c = w2s(el.x + 18, el.y - 16, t);
    const r = Math.max(8, 9 * t.s);
    g.fillStyle = "#ffb020";
    g.strokeStyle = "#fff";
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(c.x, c.y, r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = "#111";
    g.font = `700 ${Math.max(9, 10 * t.s)}px ui-sans-serif, system-ui, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(String(chainIdx + 1), c.x, c.y + 0.5);
  }

  function drawSymOverlays(g, t, el) {
    const def = SYMBOLS[el.sym];
    if (!def) return;
    const chainSyms = el.slotKey ? symsOnSlot(el.slotKey) : null;
    const chainN = chainSyms ? chainSyms.length : 0;
    const rating = symRatingLabel(el, def);
    if (rating) {
      if (el.slotKey) {
        wtextWithHalo(g, t, rating, el.x, el.y - 22, 11, "center", "middle", "#111");
      } else {
        wtextWithHalo(g, t, rating, el.x, el.y - 28, 12, "center", "middle", "#111");
      }
    }
    drawChainBadge(g, t, el, chainN, el.chainIdx || 0);
    const wireCs = el.slotKey
      ? getWireCross(wireSkForChainSym(el.slotKey, el.chainIdx || 0))
      : null;
    if (el.crossSection != null && def.hasRating && wireCs == null && !el.slotKey) {
      wtextWithHalo(g, t, formatCrossLabel(el.crossSection), el.x, el.y + 28, 11, "center", "middle", "#333");
    }
  }

  function drawDescLeaderLine(g, t, symX, symY, layout) {
    const sign = layout.x >= symX ? 1 : -1;
    const a = w2s(symX + sign * 16, symY, t);
    const b = w2s(layout.x, layout.y, t);
    g.strokeStyle = "rgba(0,0,0,0.22)";
    g.lineWidth = Math.max(1, 1 * t.s);
    g.setLineDash([4 * t.s, 3 * t.s]);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.stroke();
    g.setLineDash([]);
  }

  function drawSymDescOverlay(g, t, el) {
    const desc = el.desc || el.label;
    if (!desc) return;
    const layout = el.slotKey ? computeSymLabelLayout(el) : (el.labelLayout || computeSymLabelLayout(el));
    if (el.slotKey) {
      const lines = layout.lines || wrapTextToWidth(desc, branchDescMaxWidth(findSlotByKey(el.slotKey)), layout.size || 10, 500);
      wtextMultilineHalo(g, t, lines, layout.x, layout.y, layout.size, layout.align, "#111", layout.lineGap);
      return;
    }
    wtextWithBadge(g, t, desc, layout.x, layout.y, layout.size, layout.align, "middle", "#111");
  }

  function drawSymEl(g, t, el) {
    drawSymBody(g, t, el);
    drawSymOverlays(g, t, el);
  }

  function drawSelection(g, t) {
    const el = state.elements.find((e) => e.id === state.selectedId);
    if (el) {
      g.strokeStyle = "#3b82f6"; g.lineWidth = 2; g.setLineDash([6, 4]);
      if (el.t === "sym") {
        const c = w2s(el.x, el.y, t), s = 22 * t.s;
        g.strokeRect(c.x - s, c.y - s, 2 * s, 2 * s);
      } else if (el.t === "line") {
        const a = w2s(el.x1, el.y1, t), b = w2s(el.x2, el.y2, t);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      } else if (el.t === "text") {
        const c = w2s(el.x, el.y, t);
        const b = textHitBounds(el);
        g.strokeRect(c.x - 4, c.y - b.hh * t.s, (b.hw + 8) * t.s, 2 * b.hh * t.s);
      }
      g.setLineDash([]);
    }
    if (selectedBranchKey && state.meta.skeletonBuilt) {
      g.strokeStyle = "#ffb020"; g.lineWidth = 2; g.setLineDash([4, 3]);
      for (const ln of state.elements) {
        if (ln.t !== "line" || !ln.skeleton || ln.skKind !== "branch") continue;
        if (ln.slotKey !== selectedBranchKey) continue;
        const a = w2s(ln.x1, ln.y1, t), b = w2s(ln.x2, ln.y2, t);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
      g.setLineDash([]);
    }
    if (selectedSkLineId && state.meta.skeletonBuilt) {
      const ln = findSkLine(selectedSkLineId);
      if (ln) {
        g.strokeStyle = "#ffb020"; g.lineWidth = 2; g.setLineDash([6, 4]);
        const a = w2s(ln.x1, ln.y1, t), b = w2s(ln.x2, ln.y2, t);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        g.setLineDash([]);
      }
    }
  }

  function snapLineEnd(x1, y1, x2, y2) {
    const sx = snap(clampX(x2)), sy = snap(clampY(y2));
    let dx = sx - x1, dy = sy - y1;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx < GRID / 2 && ady < GRID / 2) return { x2: x1, y2: y1 };

    const candidates = [
      { x2: x1 + (dx >= 0 ? adx : -adx), y2: y1 },
      { x2: x1, y2: y1 + (dy >= 0 ? ady : -ady) },
    ];
    const d = Math.min(adx, ady);
    if (d >= GRID) {
      candidates.push({ x2: snap(x1 + (dx >= 0 ? d : -d)), y2: snap(y1 + (dy >= 0 ? d : -d)) });
      candidates.push({ x2: snap(x1 + (dx >= 0 ? d : -d)), y2: snap(y1 + (dy >= 0 ? -d : d)) });
      candidates.push({ x2: snap(x1 + (dx >= 0 ? -d : d)), y2: snap(y1 + (dy >= 0 ? d : -d)) });
    }

    let best = candidates[0], bestDist = Infinity;
    for (const c of candidates) {
      const dist = Math.hypot(sx - c.x2, sy - c.y2);
      if (dist < bestDist) { bestDist = dist; best = c; }
    }
    return { x2: clampX(best.x2), y2: clampY(best.y2) };
  }

  function symAt(wx, wy) {
    let best = null, bestScore = Infinity;
    const hitR = isCoarsePointer() ? 40 : 30;
    for (const el of state.elements) {
      if (el.t !== "sym") continue;
      const d = Math.hypot(wx - el.x, wy - el.y);
      if (d >= hitR) continue;
      const slot = el.slotKey ? findSlotByKey(el.slotKey) : null;
      const branchDx = slot ? Math.abs(wx - slot.x) : 0;
      const half = slot ? branchHalfWidth(slot.row) : hitR;
      if (slot && branchDx > half) continue;
      const score = branchDx * 3 + d;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    return best;
  }

  function elementAt(wx, wy) {
    const sym = symAt(wx, wy);
    if (sym) return sym;
    for (let i = state.elements.length - 1; i >= 0; i--) {
      const el = state.elements[i];
      if (el.t === "sym") continue;
      if (el.t === "line") {
        if (el.skeleton) continue;
        if (distSeg(wx, wy, el.x1, el.y1, el.x2, el.y2) <= 8) return el;
      } else if (el.t === "dot") {
        if (el.skeleton) continue;
        const r = (el.r || 3.5) + 6;
        if (Math.hypot(wx - el.x, wy - el.y) <= r) return el;
      } else if (el.t === "text") {
        const b = textHitBounds(el);
        if (Math.abs(wx - el.x) <= b.hw && Math.abs(wy - el.y) <= b.hh) return el;
      }
    }
    return null;
  }
  function distSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
    let u = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
    u = clamp(u, 0, 1);
    return Math.hypot(px - (x1 + u * dx), py - (y1 + u * dy));
  }

  let draftLine = null, moving = null, dragHistoryPushed = false;

  function pointerDown(sx, sy, clientPt) {
    cancelSymRadialTimer();
    if (window.RadialMenu && RadialMenu.isOpen()) {
      const cl = clientPt || canvasPointToClient(sx, sy);
      if (!RadialMenu.hitTest(cl.x, cl.y)) RadialMenu.hide();
    }
    if (spacePanHeld || altPanHeld) {
      panStart(sx, sy);
      return;
    }
    const w = s2w(sx, sy);
    if (tool === "place" && placeSym) {
      const slot = nearestSlot(w.x, w.y);
      if (slot && state.meta.skeletonBuilt) {
        if (symsOnSlot(slot.slotKey).length) {
          toast("הענף תפוס — לחץ על הענף ⟩ ⬇ הוסף סמל מתחת");
          return;
        }
        placeSymbolOnSlot(placeSym, slot.slotKey, 0);
        disarm();
        return;
      }
      const freeSlot = findNearestFreeSlot(w.x, w.y);
      const px = freeSlot ? freeSlot.x : w.x;
      const py = freeSlot ? freeSlot.y : w.y;
      const el = newSymElement(placeSym, px, py);
      if (freeSlot) {
        el.x = snap(clampX(freeSlot.x));
        el.y = snap(clampY(freeSlot.y));
        el.slotKey = freeSlot.slotKey;
        el.chainIdx = 0;
      }
      commit(() => state.elements.push(el));
      if (state.meta.skeletonBuilt) snapSymToBus(el, false);
      state.selectedId = el.id;
      syncUI();
      checkModuleOverflow(true);
      openSymEdit(el);
      return;
    }
    if (tool === "text") { openText(sx, sy, w); return; }
    if (tool === "line") {
      const pt = snapPointToAttach(w.x, w.y);
      draftLine = { x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y };
      return;
    }
    if (tool === "select") {
      const entryAtDown = state.meta.skeletonBuilt ? skeletonEntryAt(w.x, w.y) : null;
      const skAtDown = state.meta.skeletonBuilt ? skeletonAnyLineAt(w.x, w.y) : null;
      const feedTapDown = entryAtDown || (skAtDown && (
        skAtDown.skKind === "entry" || skAtDown.skKind === "feed-link" || skAtDown.skKind === "trunk"
      ));
      if (!feedTapDown) hideFeedPopup();
      hideTerminalPopup();

      const hitSym = symAt(w.x, w.y);
      if (hitSym && hitSym.slotKey) {
        symPointer = { el: hitSym, sx, sy, moved: false };
        state.selectedId = hitSym.id;
        selectedBranchKey = hitSym.slotKey;
        render();
        syncUI();
        return;
      }

      if (state.meta.skeletonBuilt) {
        const entryHit = skeletonEntryAt(w.x, w.y);
        if (entryHit) {
          beginSkLineTap(sx, sy, w, entryHit);
          return;
        }
        const busRow = skeletonBusRowAt(w.x, w.y);
        if (busRow != null) {
          beginBusRowTap(sx, sy, w, busRow);
          return;
        }
        const termSlot = skeletonTerminalAt(w.x, w.y);
        if (termSlot) {
          beginModuleTap(sx, sy, w, null, termSlot, { noDrag: true });
          return;
        }
        const skLine = skeletonAnyLineAt(w.x, w.y);
        if (skLine && skLine.skKind === "branch" && skLine.slotKey) {
          beginModuleTap(sx, sy, w, null, skLine.slotKey, { noDrag: true });
          return;
        }
        const skBranch = skeletonBranchAt(w.x, w.y);
        if (skBranch) {
          beginModuleTap(sx, sy, w, null, skBranch, { noDrag: true });
          return;
        }
        const colSlot = slotAtPoint(w.x, w.y);
        if (colSlot) {
          beginModuleTap(sx, sy, w, null, colSlot.slotKey, { noDrag: true });
          return;
        }
        const nearSlot = nearestModuleSlotAt(w.x, w.y);
        if (nearSlot) {
          beginModuleTap(sx, sy, w, null, nearSlot, { noDrag: true });
          return;
        }
        if (skLine) {
          beginSkLineTap(sx, sy, w, skLine);
          return;
        }
      }

      selectedSkLineId = null;
      hideBranchPopup();
      selectedBranchKey = null;
      const hit = elementAt(w.x, w.y);
      state.selectedId = hit ? hit.id : null;
      render(); syncUI();
      if (hit) {
        if (hit.skeleton) { toast("זה קו מבנה — השתמש ב״בנה מבנה קווים״ מחדש"); panStart(sx, sy); return; }
        if (hit.t === "sym") {
          symPointer = { el: hit, sx, sy, moved: false };
          return;
        }
        dragHistoryPushed = false;
        moving = hit.t === "line"
          ? { el: hit, lx: w.x, ly: w.y }
          : { el: hit, dx: w.x - hit.x, dy: w.y - hit.y };
      } else {
        panStart(sx, sy);
      }
      return;
    }
    if (tool === "pan") panStart(sx, sy);
  }

  function pointerMove(sx, sy) {
    lastPointer.sx = sx;
    lastPointer.sy = sy;
    if (moduleTapPointer && !moduleTapPointer.moved && moduleTapPointer.dragEnabled) {
      if (Math.hypot(sx - moduleTapPointer.sx, sy - moduleTapPointer.sy) > BRANCH_DRAG_THRESHOLD) {
        moduleTapPointer.moved = true;
        beginSkDrag(
          moduleTapPointer.skId,
          moduleTapPointer.wx,
          moduleTapPointer.wy,
          sx,
          sy
        );
        moduleTapPointer = null;
      } else {
        return;
      }
    }
    if (moduleTapPointer && !moduleTapPointer.moved && !moduleTapPointer.dragEnabled) {
      if (Math.hypot(sx - moduleTapPointer.sx, sy - moduleTapPointer.sy) > MODULE_CLICK_SLOP) {
        moduleTapPointer.moved = true;
      } else {
        return;
      }
    }
    if (skLineTapPointer && !skLineTapPointer.moved) {
      if (Math.hypot(sx - skLineTapPointer.sx, sy - skLineTapPointer.sy) > DRAG_THRESHOLD) {
        const t = skLineTapPointer;
        skLineTapPointer = null;
        beginSkDrag(t.skId, t.wx, t.wy, sx, sy);
      } else {
        return;
      }
    }
    const w = s2w(sx, sy);
    if (draftLine) {
      const end = snapLineEnd(draftLine.x1, draftLine.y1, w.x, w.y);
      const attach = nearestAttachPoint(end.x2, end.y2);
      if (attach) {
        end.x2 = snap(attach.x);
        end.y2 = snap(attach.y);
      }
      draftLine.x2 = end.x2;
      draftLine.y2 = end.y2;
      render();
      return;
    }
    if (symPointer && !moving) {
      if (Math.hypot(sx - symPointer.sx, sy - symPointer.sy) > MODULE_CLICK_SLOP) {
        if (symPointer.el.slotKey) {
          const ox = symPointer.sx;
          const oy = symPointer.sy;
          symPointer = null;
          panStart(ox, oy);
          panMove(sx, sy);
          return;
        }
        symPointer.moved = true;
        dragHistoryPushed = false;
        const el = symPointer.el;
        moving = { el, dx: w.x - el.x, dy: w.y - el.y };
      }
    }
    if (terminalPointer && !skDrag) {
      if (Math.hypot(sx - terminalPointer.sx, sy - terminalPointer.sy) > DRAG_THRESHOLD) {
        terminalPointer.moved = true;
        const row = rowFromSlotKey(terminalPointer.slotKey);
        if (row != null) beginSkDrag("bus-" + row, w.x, w.y, terminalPointer.sx, terminalPointer.sy);
        terminalPointer = null;
      }
    }
    if (skDrag) {
      applySkDragMove(w);
      return;
    }
    if (moving) {
      if (!dragHistoryPushed) { pushHistory(); dragHistoryPushed = true; }
      const el = moving.el;
      if (el.skeleton) return;
      if (el.t === "line") {
        const dx = snap(w.x - moving.lx), dy = snap(w.y - moving.ly);
        if (dx || dy) {
          el.x1 += dx; el.y1 += dy; el.x2 += dx; el.y2 += dy;
          moving.lx += dx; moving.ly += dy;
          render();
        }
      } else {
        if (el.t === "sym") {
          if (el.slotKey) return;
          el.slotKey = null;
        }
        el.x = snap(clampX(w.x - moving.dx));
        el.y = snap(clampY(w.y - moving.dy));
        render();
      }
      return;
    }
    if (panning) panMove(sx, sy);
  }

  function pointerUp() {
    if (moduleTapPointer && !moduleTapPointer.moved) {
      const ptr = moduleTapPointer;
      const w = s2w(ptr.sx, ptr.sy);
      const slotKey = ptr.slotKey || resolveModuleSlotAtClick(w.x, w.y);
      const now = Date.now();
      if (!ptr.dragEnabled && slotKey) {
        handleModuleClick(ptr.sx, ptr.sy, w, slotKey);
        lastModuleTap = { time: now, sx: ptr.sx, sy: ptr.sy, slotKey };
      } else if (ptr.dragEnabled && slotKey) {
        selectModuleAtPointer(ptr);
      }
      moduleTapPointer = null;
      skLineTapPointer = null;
      panning = false;
      return;
    }
    if (moduleTapPointer && moduleTapPointer.moved && !moduleTapPointer.dragEnabled) {
      const ptr = moduleTapPointer;
      const w = s2w(ptr.sx, ptr.sy);
      const slotKey = ptr.slotKey || resolveModuleSlotAtClick(w.x, w.y);
      if (slotKey && Math.hypot(lastPointer.sx - ptr.sx, lastPointer.sy - ptr.sy) < moduleHitPad()) {
        const now = Date.now();
        handleModuleClick(ptr.sx, ptr.sy, w, slotKey);
        lastModuleTap = { time: now, sx: ptr.sx, sy: ptr.sy, slotKey };
      }
      moduleTapPointer = null;
      skLineTapPointer = null;
      panning = false;
      return;
    }
    moduleTapPointer = null;
    if (skLineTapPointer && !skLineTapPointer.moved) {
      finishSkLineTap(skLineTapPointer.sx, skLineTapPointer.sy);
      skLineTapPointer = null;
      panning = false;
      return;
    }
    skLineTapPointer = null;
    if (skDrag) {
      endSkDrag();
      return;
    }
    if (terminalPointer && !terminalPointer.moved) {
      terminalPointer = null;
      render();
      syncUI();
      return;
    }
    terminalPointer = null;
    skPointer = null;
    branchPointer = null;
    if (symPointer && !symPointer.moved) {
      const sym = symPointer.el;
      const sx = symPointer.sx;
      const sy = symPointer.sy;
      const w = s2w(sx, sy);
      const slotKey = sym && sym.slotKey ? sym.slotKey : resolveModuleSlotAtClick(w.x, w.y);
      const now = Date.now();
      const isDouble =
        slotKey &&
        lastModuleTap.slotKey === slotKey &&
        now - lastModuleTap.time <= MODULE_TAP_MS &&
        Math.hypot(sx - lastModuleTap.sx, sy - lastModuleTap.sy) < 52;
      if (sym && sym.slotKey) {
        handleModuleClick(sx, sy, w, sym.slotKey);
        lastModuleTap = { time: now, sx, sy, slotKey: sym.slotKey };
      } else if (useModuleTapUX() && sym) {
        presentSymActions(sym, sx, sy);
      } else if (sym) {
        scheduleSymRadial(sym, sx, sy);
      }
      symPointer = null;
      return;
    }
    symPointer = null;
    if (draftLine) {
      const d = draftLine;
      draftLine = null;
      if (Math.hypot(d.x2 - d.x1, d.y2 - d.y1) >= GRID) {
        const el = { id: uid(), t: "line", ...d };
        let snapped = false;
        commit(() => {
          state.elements.push(el);
          snapped = !!snapFreeLinesToSkeleton(attachSnapThreshold());
        });
        state.selectedId = el.id;
        syncUI();
        if (snapped) toast("קו חובר לענף");
      } else render();
      return;
    }
    if (moving) {
      if (moving.el && moving.el.t === "sym" && moving.el.slotKey) {
        const pos = symPosForSlot(moving.el.slotKey, moving.el.chainIdx || 0);
        if (pos) {
          moving.el.x = pos.x;
          moving.el.y = pos.y;
        }
      } else if (moving.el && moving.el.t === "line" && !moving.el.skeleton) {
        snapFreeLinesToSkeleton(attachSnapThreshold());
      }
      if (dragHistoryPushed) save();
      moving = null;
      render();
      return;
    }
    symPointer = null;
    panning = false;
  }

  function clampX(x) { return clamp(x, PAPER.band + GRID, PAPER.W - PAPER.band - GRID); }
  function clampY(y) {
    const r = sheetContentRect();
    return clamp(y, r.y0 + GRID, r.y1 - GRID);
  }

  let panning = false, panLast = null, spacePanHeld = false, altPanHeld = false;

  function updateCanvasCursor() {
    if (panning) { canvas.style.cursor = "grabbing"; return; }
    if (spacePanHeld || altPanHeld || tool === "pan") { canvas.style.cursor = "grab"; return; }
    canvas.style.cursor = tool === "text" ? "text" : tool === "line" ? "crosshair" : "default";
  }

  function panStart(sx, sy) { panning = true; panLast = { x: sx, y: sy }; updateCanvasCursor(); }
  function panMove(sx, sy) {
    if (!panLast) return;
    view.tx += sx - panLast.x;
    view.ty += sy - panLast.y;
    panLast = { x: sx, y: sy };
    render();
  }

  const gesture = { active: false, sd: 0, smid: { x: 0, y: 0 }, ss: 1, stx: 0, sty: 0 };
  let down = null;
  function txy(tn) { const r = canvas.getBoundingClientRect(); return { x: tn.clientX - r.left, y: tn.clientY - r.top }; }

  canvas.addEventListener("touchstart", (e) => {
    if (modalOpen()) return;
    inputIsTouch = true;
    e.preventDefault();
    if (e.touches.length === 2) {
      const p1 = txy(e.touches[0]), p2 = txy(e.touches[1]);
      gesture.active = true;
      gesture.sd = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      gesture.smid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      gesture.ss = view.scale; gesture.stx = view.tx; gesture.sty = view.ty;
      down = null; draftLine = null; moving = null; skDrag = null; panning = false;
    } else if (e.touches.length === 1 && !gesture.active) {
      const p = txy(e.touches[0]);
      down = { x: p.x, y: p.y, moved: false };
      pointerDown(p.x, p.y, { x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (gesture.active && e.touches.length >= 2) {
      const p1 = txy(e.touches[0]), p2 = txy(e.touches[1]);
      const d = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const s = clamp(gesture.ss * (d / gesture.sd), MIN_SCALE, MAX_SCALE);
      const wx = (gesture.smid.x - gesture.stx) / gesture.ss;
      const wy = (gesture.smid.y - gesture.sty) / gesture.ss;
      view.scale = s; view.tx = mid.x - wx * s; view.ty = mid.y - wy * s;
      render();
    } else if (e.touches.length === 1 && down) {
      const p = txy(e.touches[0]);
      if (Math.hypot(p.x - down.x, p.y - down.y) > 4) down.moved = true;
      pointerMove(p.x, p.y);
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (gesture.active && e.touches.length < 2) gesture.active = false;
    if (e.touches.length === 0) { pointerUp(); down = null; }
  }, { passive: false });

  let mDown = false;
  canvas.addEventListener("mousedown", (e) => {
    if (modalOpen()) return;
    inputIsTouch = false;
    const pt = canvasEventXY(e);
    if (e.button === 1 || e.button === 2) {
      panStart(pt.sx, pt.sy);
      mDown = "pan";
      canvas.style.cursor = "grabbing";
      return;
    }
    mDown = true;
    lastPointer.sx = pt.sx;
    lastPointer.sy = pt.sy;
    pointerDown(pt.sx, pt.sy, { x: e.clientX, y: e.clientY });
  });
  window.addEventListener("mousemove", (e) => {
    if (!mDown) return;
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    if (mDown === "pan") panMove(sx, sy);
    else pointerMove(sx, sy);
  });
  window.addEventListener("mouseup", () => {
    if (mDown === "pan") { panning = false; updateCanvasCursor(); }
    else if (mDown) pointerUp();
    mDown = false;
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("dblclick", (e) => {
    if (modalOpen()) return;
    cancelSymRadialTimer();
    suppressRadialUntil = Date.now() + MODULE_TAP_MS;
    lastSkLineTap.time = 0;
    moduleTapPointer = null;
    symPointer = null;
    hideBranchPopup();
    const pt = canvasEventXY(e);
    const w = s2w(pt.sx, pt.sy);
    const slotKey = resolveModuleSlotAtClick(w.x, w.y);
    if (slotKey && handleModuleClick(pt.sx, pt.sy, w, slotKey)) {
      e.preventDefault();
      e.stopPropagation();
      lastModuleTap.time = 0;
      return;
    }
    if (state.meta.skeletonBuilt) {
      const skLine = skeletonAnyLineAt(w.x, w.y);
      if (skLine && skLine.skKind !== "branch") {
        e.preventDefault();
        openSkLineClickMenu(skLineMenuMeta(skLine, pt.sx, pt.sy));
        return;
      }
    }
    const el = elementAt(w.x, w.y);
    if (el && el.t === "sym" && !el.slotKey) {
      state.selectedId = el.id;
      render();
      openSymEdit(el);
    } else if (el && el.t === "text") {
      state.selectedId = el.id;
      render();
      openLabelEditor(pt.sx, pt.sy, el);
    }
  });
  canvas.addEventListener("wheel", (e) => {
    if (modalOpen()) return;
    e.preventDefault();
    zoomAt({ x: e.offsetX, y: e.offsetY }, Math.exp(-e.deltaY * 0.0015));
    render();
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (modalOpen()) return;
    if (e.code === "Space" && document.activeElement !== ui.textInput &&
        !ui.textInput.classList.contains("visible")) {
      if (!spacePanHeld) {
        spacePanHeld = true;
        updateCanvasCursor();
      }
      e.preventDefault();
      return;
    }
    if (e.key === "Alt") {
      altPanHeld = true;
      updateCanvasCursor();
    }
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
    else if ((e.key === "Delete" || e.key === "Backspace") && (state.selectedId || selectedBranchKey || symEditEl)) {
      e.preventDefault();
      deleteSelected();
    }
    else if (e.key === "r" || e.key === "R") rotateSelected();
    else if (e.key === "Escape") {
      if (window.RadialMenu && RadialMenu.isOpen()) { RadialMenu.hide(); render(); syncUI(); return; }
      if (spacingPanelOpen) { closeSpacingPanel(); render(); syncUI(); return; }
      if (symEditEl) { closeSymEdit(); render(); syncUI(); return; }
      hideLibrary();
      clearPendingPlace();
      hideWirePopup();
      hideTerminalPopup();
      disarm(); state.selectedId = null;
      selectedBranchKey = null;
      selectedSkLineId = null;
      skDrag = null;
      skPointer = null;
      branchPointer = null;
      canvas.style.cursor = "";
      hideBranchPopup(); hideFeedPopup();
      render(); syncUI();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      spacePanHeld = false;
      panning = false;
      panLast = null;
      updateCanvasCursor();
    }
    if (e.key === "Alt") {
      altPanHeld = false;
      panning = false;
      panLast = null;
      updateCanvasCursor();
    }
  });

  let textCtx = null;
  function openText(sx, sy, w) { textCtx = { mode: "new", w }; showTextInput(sx, sy, ""); }
  function openLabelEditor(sx, sy, el) {
    textCtx = { mode: "label", el };
    showTextInput(sx, sy, el.t === "text" ? el.val : el.label || "");
  }
  function showTextInput(sx, sy, val) {
    const i = ui.textInput;
    i.value = val;
    i.style.display = "block";
    i.style.left = clamp(sx, 8, innerWidth - 170) + "px";
    i.style.top = clamp(sy - 16, 8, innerHeight - 48) + "px";
    setTimeout(() => i.focus(), 0);
  }
  function commitText() {
    const i = ui.textInput, val = i.value.trim();
    i.style.display = "none";
    if (textCtx) {
      if (textCtx.mode === "new" && val) {
        const el = { id: uid(), t: "text", x: snap(textCtx.w.x), y: snap(textCtx.w.y), val, size: 16, rot: 0 };
        commit(() => state.elements.push(el));
        state.selectedId = el.id;
      } else if (textCtx.mode === "label") {
        commit(() => { if (textCtx.el.t === "text") textCtx.el.val = val; else textCtx.el.label = val; });
      }
    }
    textCtx = null;
    syncUI();
  }
  ui.textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); commitText(); }
    else if (e.key === "Escape") { ui.textInput.style.display = "none"; textCtx = null; }
  });
  ui.textInput.addEventListener("blur", commitText);

  function refreshSymEditFields() {
    if (!symEditEl) return;
    const def = SYMBOLS[symEditEl.sym];
    const hasRating = def && def.hasRating;
    if (ui.symEditRating) ui.symEditRating.classList.toggle("hidden", !hasRating);
    document.querySelector(".sym-rating-row")?.classList.toggle("hidden", !hasRating);
    if (hasRating) {
      ui.sym_rating.innerHTML = "";
      const ratings = Conductor.MCB_RATINGS.slice();
      const cur = symEditEl.rating || 16;
      if (!ratings.includes(cur)) {
        ratings.push(cur);
        ratings.sort((a, b) => a - b);
      }
      for (const a of ratings) {
        const opt = document.createElement("option");
        opt.value = String(a);
        opt.textContent = a + " A";
        if (cur === a) opt.selected = true;
        ui.sym_rating.appendChild(opt);
      }
      ui.sym_curve.value = symEditEl.curve || "C";
      ui.sym_material.value = symEditEl.material || state.meta.conductorMaterial || "cu";
      ui.sym_phase.value = symEditEl.phase || phaseForSymbol(def);
    }
    ui.sym_desc.value = symEditEl.desc || symEditEl.label || "";
    refreshCrossSectionFields();
  }

  function highlightLibItem(symId) {
    document.querySelectorAll(".lib-item").forEach((x) => {
      x.classList.toggle("is-active", x.dataset.sym === symId);
    });
  }

  function radialCenterHtml(el) {
    const def = SYMBOLS[el.sym];
    const title = el.desc || el.label || def?.name || "רכיב";
    const parts = [];
    if (def && def.hasRating) {
      const rating = symRatingLabel(el, def);
      if (rating) parts.push(rating);
    }
    const wireCs = el.slotKey
      ? getWireCross(wireSkForChainSym(el.slotKey, el.chainIdx || 0))
      : el.crossSection;
    if (wireCs != null) parts.push(formatCrossLabel(wireCs));
    const sub = parts.join(" · ");
    return "<strong>" + title + "</strong>" + (sub ? "<span>" + sub + "</span>" : "");
  }

  function presentSymActions(el, sx, sy) {
    if (!el || el.t !== "sym") return;
    state.selectedId = el.id;
    hideBranchPopup();
    hideFeedPopup();
    hideTerminalPopup();
    closeSymEdit();
    let clientX;
    let clientY;
    if (sx != null && sy != null) {
      const cl = canvasPointToClient(sx, sy);
      clientX = cl.x;
      clientY = cl.y;
    } else {
      const s = w2s(el.x, el.y, T());
      const cl = canvasPointToClient(s.x, s.y);
      clientX = cl.x;
      clientY = cl.y;
    }
    const hole = document.getElementById("radialMenuHole");
    if (hole) hole.innerHTML = radialCenterHtml(el);
    if (window.RadialMenu) RadialMenu.show(el, clientX, clientY);
    render();
    syncUI();
  }

  function copySymProps(from, to) {
    to.sym = from.sym;
    to.rating = from.rating;
    to.curve = from.curve;
    to.material = from.material;
    to.phase = from.phase;
    to.crossSection = from.crossSection;
    to.desc = from.desc || "";
    to.label = from.label || from.desc || "";
    to.rot = from.rot || 0;
    to.labelLayout = from.labelLayout ? Object.assign({}, from.labelLayout) : null;
  }

  function duplicateSym(el) {
    if (!el || el.t !== "sym") return;
    if (el.slotKey) {
      const syms = symsOnSlot(el.slotKey);
      if (syms.length >= MAX_CHAIN) {
        toast("עד " + MAX_CHAIN + " סמלים בשרשרת");
        return;
      }
      const slot = findSlotByKey(el.slotKey);
      if (!slot) return;
      const idx = syms.length;
      const newEl = newSymElement(el.sym, slot.x, slot.y);
      copySymProps(el, newEl);
      newEl.slotKey = el.slotKey;
      newEl.chainIdx = idx;
      const pos = symPosForSlot(el.slotKey, idx);
      if (pos) {
        newEl.x = pos.x;
        newEl.y = pos.y;
      }
      commit(() => {
        state.elements.push(newEl);
        if (newEl.crossSection != null) {
          setWireCross(wireSkForChainSym(el.slotKey, idx), newEl.crossSection, false);
        }
        if (state.meta.skeletonBuilt) {
          const result = BoardSkeleton.generate(
            state.meta.rowLayout,
            drawingArea(),
            state.meta.skeletonOpts || BoardSkeleton.defaultOpts(),
            getSkeletonGenerateConfig()
          );
          applySkeletonResult(result);
        }
      });
      state.selectedId = newEl.id;
      checkModuleOverflow(true);
      toast("סמל שוכפל בשרשרת");
      presentSymActions(newEl, null, null);
      return;
    }
    commit(() => {
      const dup = {
        id: uid(),
        t: "sym",
        x: snap(clampX(el.x + 48)),
        y: snap(clampY(el.y)),
        slotKey: null,
        chainIdx: null,
        rot: el.rot || 0,
      };
      copySymProps(el, dup);
      dup.labelLayout = dup.desc ? computeSymLabelLayout(dup) : null;
      state.elements.push(dup);
    });
    const dupEl = state.elements[state.elements.length - 1];
    state.selectedId = dupEl.id;
    toast("רכיב שוכפל");
    presentSymActions(dupEl, null, null);
  }

  function handleRadialAction(action, el) {
    if (!el) return;
    if (window.RadialMenu) RadialMenu.hide();
    if (action === "props") {
      openSymEdit(el, false);
      return;
    }
    if (action === "link" || action === "change") {
      if (el.slotKey) {
        openSymEdit(el, false);
        showLibraryForSlot(el.slotKey, el.chainIdx || 0, "בחר סמל לשיוך / החלפה");
      } else {
        openSymEdit(el, true);
      }
      return;
    }
    if (action === "duplicate") {
      duplicateSym(el);
      return;
    }
    if (action === "delete") {
      symEditEl = el;
      deleteSymEdit();
    }
  }

  function openSymEdit(el, showLibrary) {
    if (window.RadialMenu) RadialMenu.hide();
    hideBranchPopup();
    hideTerminalPopup();
    if (ui.branchPopupPicker) ui.branchPopupPicker.classList.add("hidden");
    symEditEl = el;
    state.selectedId = el.id;
    const def = SYMBOLS[el.sym];
    if (ui.symEditName) {
      const chainN = el.slotKey ? symsOnSlot(el.slotKey).length : 0;
      const chainHint = chainN > 1 ? " · סמל " + ((el.chainIdx || 0) + 1) + "/" + chainN : "";
      ui.symEditName.textContent = (def ? def.name + (def.code ? " · " + def.code : "") : el.sym) + chainHint;
    }
    if (ui.symEditDelete) {
      ui.symEditDelete.textContent = el.slotKey && symsOnSlot(el.slotKey).length > 1
        ? "🗑 מחק סמל זה בלבד"
        : "🗑 מחק";
    }
    refreshSymEditFields();
    ui.symEditPanel.classList.remove("hidden");
    ui.symEditPanel.setAttribute("aria-hidden", "false");
    if (ui.symEditBackdrop) {
      ui.symEditBackdrop.classList.remove("hidden");
      ui.symEditBackdrop.setAttribute("aria-hidden", "false");
    }
    document.body.classList.add("sym-edit-open");
    if (showLibrary === false) {
      hideLibrary();
    } else if (ui.library) {
      ui.library.classList.remove("hidden");
    }
    highlightLibItem(el.sym);
    ui.libHint.textContent = el.slotKey && symsOnSlot(el.slotKey).length > 1
      ? "לחץ על סמל — עריכה / מחיקה בודדת · «מחק סמל זה בלבד»"
      : "לחיצה על מודול — בחר סמל · Esc לסגירה";
    syncUI();
    render();
    requestAnimationFrame(() => ui.sym_desc?.focus());
  }

  function closeSymEdit() {
    if (ui.symEditPanel) {
      ui.symEditPanel.classList.add("hidden");
      ui.symEditPanel.setAttribute("aria-hidden", "true");
    }
    if (ui.symEditBackdrop) {
      ui.symEditBackdrop.classList.add("hidden");
      ui.symEditBackdrop.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("sym-edit-open");
    if (window.RadialMenu) RadialMenu.hide();
    symEditEl = null;
    highlightLibItem(null);
    if (!placeSym) ui.libHint.textContent = "לחץ על סמל — יתווסף למודול";
    syncUI();
  }

  function applySymEdit() {
    if (!symEditEl) return;
    const def = SYMBOLS[symEditEl.sym];
    commit(() => {
      if (def && def.hasRating) {
        symEditEl.rating = Number(ui.sym_rating.value) || 16;
        symEditEl.curve = ui.sym_curve.value;
        symEditEl.material = ui.sym_material.value;
        symEditEl.phase = ui.sym_phase.value;
        symEditEl.crossSection = autoCrossSection(symEditEl);
        if (symEditEl.slotKey && symEditEl.crossSection != null) {
          setWireCross(
            wireSkForChainSym(symEditEl.slotKey, symEditEl.chainIdx || 0),
            symEditEl.crossSection,
            false
          );
        }
      }
      symEditEl.desc = ui.sym_desc.value.trim();
      symEditEl.label = symEditEl.desc;
      symEditEl.labelLayout = symEditEl.desc ? computeSymLabelLayout(symEditEl) : null;
    });
    closeSymEdit();
    hideLibrary();
    disarm();
    toast("שינויים נשמרו");
  }

  function replaceSelectedSymbol(newSymId) {
    if (!symEditEl || !SYMBOLS[newSymId]) return;
    const def = SYMBOLS[newSymId];
    commit(() => {
      symEditEl.sym = newSymId;
      if (def.hasRating) {
        if (!symEditEl.rating) symEditEl.rating = 16;
        if (!symEditEl.curve) symEditEl.curve = "C";
        symEditEl.crossSection = autoCrossSection(symEditEl);
        symEditEl.phase = phaseForSymbol(def, symEditEl.phase);
        if (symEditEl.slotKey && symEditEl.crossSection != null) {
          setWireCross(wireSkForChainSym(symEditEl.slotKey, symEditEl.chainIdx || 0), symEditEl.crossSection, false);
        }
      } else {
        symEditEl.rating = null;
        symEditEl.curve = "";
        symEditEl.crossSection = null;
      }
    });
    highlightLibItem(newSymId);
    refreshSymEditFields();
    checkModuleOverflow(true);
    toast("סמל הוחלף: " + def.name);
  }

  function deleteSymEdit() {
    if (!symEditEl) return;
    const id = symEditEl.id;
    const slotKey = symEditEl.slotKey;
    const chainCount = slotKey ? symsOnSlot(slotKey).length : 0;
    commit(() => {
      state.elements = state.elements.filter((e) => e.id !== id);
      if (slotKey && state.meta.skeletonBuilt) {
        const remaining = symsOnSlot(slotKey);
        remaining.forEach((s, i) => { s.chainIdx = i; });
        const result = BoardSkeleton.generate(
          state.meta.rowLayout,
          drawingArea(),
          state.meta.skeletonOpts || BoardSkeleton.defaultOpts(),
          getSkeletonGenerateConfig()
        );
        applySkeletonResult(result);
        syncWireCrossFromSymbols();
      }
    });
    state.selectedId = null;
    closeSymEdit();
    checkModuleOverflow(true);
    toast(chainCount > 1 ? "סמל הוסר מהשרשרת — האחרים נשארו" : "רכיב נמחק");
  }

  function selected() { return state.elements.find((e) => e.id === state.selectedId); }
  function canRotate(el) {
    if (!el) return false;
    if (el.t === "text") return true;
    return el.t === "sym" && !el.slotKey;
  }

  function rotateSelected() {
    const el = selected();
    if (!canRotate(el)) { toast(el && el.t === "sym" ? "סמל על ענף לא ניתן לסיבוב" : "בחר טקסט או סמל חופשי לסיבוב"); return; }
    commit(() => { el.rot = ((el.rot || 0) + 90) % 360; });
  }
  function deleteSelected() {
    if (symEditEl) { deleteSymEdit(); return; }
    const el = selected();
    if (el && el.t === "sym" && el.slotKey) {
      symEditEl = el;
      deleteSymEdit();
      return;
    }
    const placeTarget = resolvePlaceTarget();
    const branchKey = selectedBranchKey || (placeTarget && placeTarget.slotKey);
    if (branchKey && state.meta.skeletonBuilt) {
      const syms = symsOnSlot(branchKey);
      if (syms.length) {
        clearBranchSymbols(branchKey, { skipConfirm: true });
      } else {
        toast("אין סמל למחיקה במודול זה");
      }
      return;
    }
    if (!el) { toast("לחץ על מודול עם סמל · או בחר סמל ואז מחק"); return; }
    if (el.skeleton) { toast("לא ניתן למחוק קו מבנה — בנה מחדש"); return; }
    commit(() => { state.elements = state.elements.filter((e) => e.id !== el.id); });
    state.selectedId = null;
    syncUI();
    checkModuleOverflow(true);
    toast("נמחק");
  }

  function buildLibrary() {
    ui.libBody.innerHTML = "";
    const seen = new Set();
    for (const group of LIB_GROUPS) {
      const sec = document.createElement("div");
      sec.className = "lib-section";
      const h = document.createElement("div");
      h.className = "lib-section-title";
      h.textContent = group.title;
      sec.appendChild(h);
      const grid = document.createElement("div");
      grid.className = "lib-grid";
      for (const id of Object.keys(SYMBOLS)) {
        const sym = SYMBOLS[id];
        if (!group.cats.includes(sym.cat) || seen.has(id)) continue;
        seen.add(id);
        const item = createLibItem(id);
        if (item) grid.appendChild(item);
      }
      if (grid.children.length) {
        sec.appendChild(grid);
        ui.libBody.appendChild(sec);
      }
    }
  }
  function drawPreview(c, id) {
    const g = c.getContext("2d");
    const w = c.width;
    const h = c.height;
    g.clearRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "rgba(12, 16, 24, 0.95)");
    grad.addColorStop(1, "rgba(8, 11, 16, 0.98)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255, 176, 32, 0.25)";
    g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, w - 1, h - 1);
    g.save();
    g.translate(w / 2, h / 2);
    g.scale(1.08, 1.08);
    g.strokeStyle = "#ffb020";
    g.fillStyle = "#ffb020";
    g.lineWidth = 2;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.shadowColor = "rgba(255, 176, 32, 0.45)";
    g.shadowBlur = 6;
    const def = SYMBOLS[id];
    if (!def) { g.restore(); return; }
    if (PanelDraw.drawBranchBody) {
      PanelDraw.drawBranchBody(g, () => def.draw(g));
    } else {
      def.draw(g);
    }
    g.restore();
  }
  function armSymbol(id, item) {
    placeSym = id;
    tool = "place";
    document.querySelectorAll(".lib-item").forEach((x) => x.classList.remove("is-active"));
    if (item) item.classList.add("is-active");
    setActiveTool(null);
    if (ui.library) {
      ui.library.classList.add("hidden");
      ui.library.classList.remove("library--picker");
      syncLibraryBackdrop();
    }
    ui.libHint.textContent = `מניח: ${SYMBOLS[id].name} — הקש על מודול ריק`;
    canvas.style.cursor = "copy";
    toast(`הקש על מודול ריק · ${SYMBOLS[id].name}`);
  }
  function disarm() {
    placeSym = null;
    if (tool === "place") tool = "select";
    document.querySelectorAll(".lib-item").forEach((x) => x.classList.remove("is-active"));
    ui.libHint.textContent = "בחר סמל ואז הקש על הגיליון להנחה";
    setActiveTool("select");
    canvas.style.cursor = "default";
  }

  function renderToImage(scale) {
    const off = document.createElement("canvas");
    off.width = Math.round(PAPER.W * scale);
    off.height = Math.round(PAPER.H * scale);
    const g = off.getContext("2d");
    g.direction = "ltr"; g.lineCap = "round"; g.lineJoin = "round";
    g.fillStyle = "#fff";
    g.fillRect(0, 0, off.width, off.height);
    drawSheet(g, { s: scale, ox: 0, oy: 0 }, { grid: false, exportWatermark: true });
    return off;
  }
  function exportPDF() {
    if (!state.elements.length) { toast("הגיליון ריק"); return; }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      toast("טוען PDF…");
      printSheet();
      return;
    }
    try {
      const img = renderToImage(2);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: PAPER.W > PAPER.H ? "landscape" : "portrait",
        unit: "pt",
        format: [PAPER.W * 0.75, PAPER.H * 0.75],
      });
      pdf.addImage(img.toDataURL("image/png"), "PNG", 0, 0, PAPER.W * 0.75, PAPER.H * 0.75);
      pdf.save((state.meta.title || "sld").replace(/\s+/g, "_") + ".pdf");
      toast("PDF הורד");
    } catch (e) {
      toast("שגיאה בייצוא PDF — נסה הדפסה");
      printSheet();
    }
  }

  function exportPNG() {
    if (!state.elements.length) { toast("הגיליון ריק"); return; }
    renderToImage(2).toBlob((blob) => {
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url;
      a.download = (state.meta.title || "sld").replace(/\s+/g, "_") + ".png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, "image/png");
  }
  function printSheet() {
    if (!state.elements.length) { toast("הגיליון ריק"); return; }
    const url = renderToImage(2).toDataURL("image/png");
    const w = window.open("", "_blank");
    if (!w) { toast("חלון ההדפסה נחסם"); return; }
    w.document.write(`<html><head><title>${state.meta.title || "SLD"}</title><style>@page{size:landscape;margin:6mm}body{margin:0;font-family:system-ui,sans-serif}img{width:100%;display:block}.disc{padding:8px 12px;text-align:center;font-size:11px;color:#7c2d12;background:#fff8f0;border-top:2px solid #b45309}</style></head><body><img src="${url}" onload="window.print()"><p class="disc">${EXPORT_DISCLAIMER_HE}<br>${EXPORT_DISCLAIMER_EN}</p></body></html>`);
    w.document.close();
  }

  function setActiveTool(name) {
    ui.tools.querySelectorAll(".tool[data-tool]").forEach((b) => b.classList.toggle("is-active", b.dataset.tool === name));
    updateCanvasCursor();
  }
  function renderModuleDashboard() {
    const built = !!state.meta.skeletonBuilt;
    document.body.classList.toggle("has-board", built);
    const vipBar = document.getElementById("vipTopBar");
    if (vipBar && built) {
      const cap = layoutBranchTotal();
      const over = countOccupiedBranches() > cap || countUsedModules() > cap;
      vipBar.classList.toggle("is-over", over);
    } else if (vipBar) {
      vipBar.classList.remove("is-over");
    }
  }

  function syncUI() {
    ui.emptyHint.classList.toggle("hidden", state.elements.length > 0 || !ui.library.classList.contains("hidden") || state.meta.skeletonBuilt);
    if (ui.sheetTitleLabel) {
      ui.sheetTitleLabel.textContent = "מקור סמלים - לוח חשמל";
    }
    const board = currentBoard();
    ui.boardChipLabel.textContent = String(board.modules) + "מ";
    ui.boardChip.classList.toggle("over-limit", (() => {
      const cap = moduleCapacity();
      if (state.meta.skeletonBuilt) {
        return countOccupiedBranches() > cap || countUsedModules() > cap;
      }
      return countUsedModules() > cap;
    })());
    ui.undo.style.opacity = undoStack.length ? 1 : 0.4;
    ui.redo.style.opacity = redoStack.length ? 1 : 0.4;
    const sel = selected();
    const s = !!state.selectedId || !!selectedBranchKey || !!symEditEl;
    ui.rotateBtn.style.opacity = canRotate(sel) ? 1 : 0.5;
    ui.delBtn.style.opacity = s ? 1 : 0.5;
    renderModuleDashboard();
    if (ui.sheetModal && !ui.sheetModal.classList.contains("hidden")) updateSheetModuleStatus();
  }
  function modalOpen() {
    return !ui.sheetModal.classList.contains("hidden") ||
      document.body.classList.contains("terms-pending") ||
      document.body.classList.contains("sym-edit-open");
  }

  function populateBoardSelect() {
    ui.s_board.innerHTML = "";
    for (const b of BoardConfig.SIZES) {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.label;
      if (b.id === state.meta.boardSizeId) opt.selected = true;
      ui.s_board.appendChild(opt);
    }
  }

  function updateSheetModuleStatus() {
    const board = BoardConfig.getBoardSize(ui.s_board.value);
    const layout = readRowLayoutFromUI();
    const branchSum = layout.length ? BoardSkeleton.sumModules(layout) : board.modules;
    const occupied = state.meta.skeletonBuilt ? countOccupiedBranches() : countUsedModules();
    const cap = state.meta.skeletonBuilt ? layoutBranchTotal() : branchSum;
    const over = occupied > cap;
    ui.s_moduleStatus.textContent = state.meta.skeletonBuilt
      ? `תפוס: ${occupied} / ${cap} ענפים`
      : `סה"כ ענפים: ${branchSum} / ${board.modules}`;
    ui.s_moduleStatus.classList.toggle("over", over);
  }

  function recalcAllCrossSections() {
    for (const el of state.elements) {
      if (el.t === "sym" && SYMBOLS[el.sym] && SYMBOLS[el.sym].hasRating) {
        el.crossSection = autoCrossSection(el);
      }
    }
  }

  function isTermsAccepted() {
    try {
      const raw = localStorage.getItem(TERMS_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      return d && d.version === 1 && d.accepted === true;
    } catch (e) { return false; }
  }

  function showTermsModal() {
    if (!ui.termsOverlay) return;
    document.body.classList.add("terms-pending");
    ui.termsOverlay.classList.add("is-visible");
    ui.termsOverlay.setAttribute("aria-hidden", "false");
    if (ui.termsCheckbox) {
      ui.termsCheckbox.checked = false;
      ui.termsCheckbox.disabled = true;
    }
    if (ui.termsAcceptBtn) ui.termsAcceptBtn.disabled = true;
    requestAnimationFrame(() => {
      updateTermsScrollState();
      ui.termsScroll?.focus();
    });
  }

  function hideTermsModal() {
    if (!ui.termsOverlay) return;
    document.body.classList.remove("terms-pending");
    ui.termsOverlay.classList.remove("is-visible");
    ui.termsOverlay.setAttribute("aria-hidden", "true");
  }

  function termsScrollAtBottom() {
    const el = ui.termsScroll;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 14;
  }

  function updateTermsScrollState() {
    const el = ui.termsScroll;
    if (!el || !ui.termsCheckbox) return;
    const canAgree = termsScrollAtBottom() || el.scrollHeight <= el.clientHeight + 6;
    ui.termsCheckbox.disabled = !canAgree;
    if (ui.termsScrollHint) {
      ui.termsScrollHint.classList.toggle("hidden", canAgree);
    }
    if (!canAgree && ui.termsCheckbox.checked) {
      ui.termsCheckbox.checked = false;
      if (ui.termsAcceptBtn) ui.termsAcceptBtn.disabled = true;
    }
  }

  function acceptTerms() {
    if (!ui.termsCheckbox?.checked) return;
    try {
      localStorage.setItem(TERMS_KEY, JSON.stringify({
        version: 1,
        accepted: true,
        at: new Date().toISOString(),
      }));
    } catch (e) {}
    hideTermsModal();
    bootApp();
  }

  function wireTermsGate() {
    ui.termsScroll?.addEventListener("scroll", updateTermsScrollState, { passive: true });
    ui.termsCheckbox?.addEventListener("change", () => {
      if (ui.termsAcceptBtn) ui.termsAcceptBtn.disabled = !ui.termsCheckbox.checked;
    });
    ui.termsAcceptBtn?.addEventListener("click", acceptTerms);
    addEventListener("resize", () => {
      if (document.body.classList.contains("terms-pending")) updateTermsScrollState();
    });
  }

  function wireSpacingPanel() {
    const panel = ui.spacingPanel;
    if (!panel) return;

    const onBuild = (e) => {
      e.preventDefault();
      e.stopPropagation();
      buildSkeletonLines();
    };
    const onClose = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeSpacingPanel();
    };

    ui.spacingBuildBtn?.addEventListener("click", onBuild);
    ui.spacingClose?.addEventListener("click", onClose);
    ui.spacingBackdrop?.addEventListener("click", closeSpacingPanel);

    panel.addEventListener("input", (e) => {
      if (e.target.matches("#s_widthPct, #s_stubLen")) applySpacingOptsLive();
    });
    panel.addEventListener("change", (e) => {
      if (e.target.matches("#s_widthPct, #s_stubLen")) commitSpacingOptsSave();
    });

    panel.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
  }

  function wireFloatingPopups() {
    const stop = (e) => e.stopPropagation();
    const panels = [
      ui.branchPopup,
      ui.terminalPopup,
      ui.wirePopup,
      ui.feedPopup,
      ui.symEditPanel,
      document.getElementById("radialMenu"),
    ];
    for (const el of panels) {
      if (!el) continue;
      el.addEventListener("pointerdown", stop);
      el.addEventListener("mousedown", stop);
      el.addEventListener("touchstart", stop, { passive: true });
    }
  }

  function wireLibraryPanel() {
    if (!ui.library) return;
    ui.library.addEventListener("pointerdown", (e) => e.stopPropagation());
    ui.library.addEventListener("mousedown", (e) => e.stopPropagation());
    ui.libBody?.addEventListener("pointerdown", (e) => e.stopPropagation());
    ui.libBody?.addEventListener("click", (e) => {
      const item = e.target.closest(".lib-item");
      if (!item || !item.dataset.sym) return;
      e.preventDefault();
      e.stopPropagation();
      pickSymbolFromLibrary(item.dataset.sym, item);
    });
    ui.libBody?.addEventListener("touchend", (e) => {
      const item = e.target.closest(".lib-item");
      if (!item || !item.dataset.sym) return;
      e.preventDefault();
      e.stopPropagation();
      pickSymbolFromLibrary(item.dataset.sym, item);
    }, { passive: false });
    ui.libBody?.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
    ui.libBody?.addEventListener("touchmove", (e) => e.stopPropagation(), { passive: true });
    ui.libClose?.addEventListener("click", () => {
      hideLibrary();
      closeSymEdit();
    });
  }

  function wireUI() {
    if (ui.startAppBtn && ui.splashScreen) {
      ui.startAppBtn.addEventListener("click", () => {
        ui.splashScreen.classList.add("hidden");
        ui.splashScreen.setAttribute("aria-hidden", "true");
      });
    }

    ui.tools.querySelectorAll(".tool[data-tool]").forEach((btn) => {
      btn.addEventListener("click", () => {
        disarm();
        tool = btn.dataset.tool;
        setActiveTool(tool);
        updateCanvasCursor();
      });
    });
    ui.rotateBtn.addEventListener("click", rotateSelected);
    ui.fitViewBtn?.addEventListener("click", () => {
      fitViewToDrawing();
      toast("תצוגה ממורכזת");
    });
    ui.delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSelected();
    });
    ui.undo.addEventListener("click", undo);
    ui.redo.addEventListener("click", redo);
    ui.exportBtn.addEventListener("click", exportPNG);
    ui.exportPdfBtn?.addEventListener("click", exportPDF);
    ui.printBtn.addEventListener("click", printSheet);

    ui.libOpenBtn?.addEventListener("click", toggleLibrary);
    wireLibraryPanel();
    wireFloatingPopups();
    ui.libToggle?.addEventListener("click", toggleLibrary);
    ui.emptyHint.addEventListener("click", openSheetModal);
    ui.boardChip.addEventListener("click", openSheetModal);

    ui.sheetInfoBtn.addEventListener("click", openSheetModal);
    ui.spacingBtn?.addEventListener("click", toggleSpacingPanel);
    wireSpacingPanel();
    ui.s_save.addEventListener("click", saveSheetInfo);
    ui.s_newProject.addEventListener("click", newProject);
    ui.s_cancel.addEventListener("click", () => ui.sheetModal.classList.add("hidden"));
    ui.sheetModal.addEventListener("mousedown", (e) => { if (e.target === ui.sheetModal) ui.sheetModal.classList.add("hidden"); });

    if (ui.welcomeStart) ui.welcomeStart.addEventListener("click", startWelcomeProject);
    if (ui.welcomeContinue) {
      ui.welcomeContinue.addEventListener("click", () => {
        hideWelcome();
        syncUI();
        render();
        if (!state.meta.skeletonBuilt) openSheetModal();
      });
    }

    ui.s_board.addEventListener("change", () => {
      applyRowLayoutForBoard(ui.s_board.value, null);
      updateSheetModuleStatus();
      toast("גודל לוח עודכן — חלוקת שורות אוטומטית");
    });
    ui.s_addRow.addEventListener("click", () => {
      const board = BoardConfig.getBoardSize(ui.s_board.value);
      const cur = readRowLayoutFromUI();
      const nextCount = (cur.length || board.rows) + 1;
      if (nextCount > board.modules) {
        toast("לא ניתן להוסיף יותר שורות ממספר המודולים");
        return;
      }
      applyRowLayoutForBoard(board.id, nextCount);
      toast("נוספה שורה — " + nextCount + " שורות, חלוקה מחדש");
    });
    ui.s_evenSplit.addEventListener("click", applyEvenSplit);
    ui.s_templateStyle.addEventListener("click", applyTemplateStyle);
    ui.s_buildSkeleton?.addEventListener("click", buildSkeletonLines);
    ui.s_material.addEventListener("change", () => {
      if (ui.sheetModal.classList.contains("hidden")) return;
    });

    ui.symEditApply.addEventListener("click", applySymEdit);
    ui.symEditClose.addEventListener("click", closeSymEdit);
    ui.symEditBackdrop?.addEventListener("click", closeSymEdit);
    ui.symEditDelete.addEventListener("click", deleteSymEdit);
    ui.sym_rating.addEventListener("change", refreshCrossSectionFields);
    ui.sym_material.addEventListener("change", refreshCrossSectionFields);
    ui.sym_phase.addEventListener("change", refreshCrossSectionFields);

    if (ui.feedLinkToggle) {
      ui.feedLinkToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSelectedFeedLink();
      });
    }

    if (ui.feedPopup) {
      ui.feedPopup.querySelectorAll("[data-feed]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          setFeedDir(btn.dataset.feed);
        });
      });
      ui.feedPopup.querySelectorAll("[data-feed-side]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          setFeedAlign(btn.dataset.feedSide);
        });
      });
    }
    if (ui.branchDeleteBtn) {
      ui.branchDeleteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = branchPopupSlotKey();
        if (!key) {
          toast("מודול לא נבחר — לחץ שוב על הקו הכחול");
          return;
        }
        if (!canDeleteModule(key)) {
          toast("לא ניתן למחוק — חייב להישאר לפחות מודול אחד בשורה");
          return;
        }
        removeBranch(key, { skipConfirm: true });
      });
    }
    if (ui.branchAddBtn) {
      ui.branchAddBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSymbolPickerFromBranchPopup();
      });
    }
    if (ui.branchEditBtn) {
      ui.branchEditBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = branchPopupSlotKey();
        if (!key) return;
        const syms = symsOnSlot(key);
        if (!syms.length) return;
        const el = branchPopupEditSymId
          ? state.elements.find((x) => x.id === branchPopupEditSymId)
          : syms[0];
        if (el) openSymEdit(el, false);
      });
    }
    if (ui.branchChainBtn) {
      ui.branchChainBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = branchPopupSlotKey();
        if (key) openBranchForChain(key);
      });
    }
    if (ui.branchClearSymBtn) {
      ui.branchClearSymBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = branchPopupSlotKey();
        if (!key) {
          toast("מודול לא נבחר — לחץ שוב על הקו הכחול");
          return;
        }
        clearBranchSymbols(key, { skipConfirm: true });
      });
    }
    if (ui.terminalAddBtn) {
      ui.terminalAddBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!selectedBranchKey) return;
        hideTerminalPopup();
        const syms = symsOnSlot(selectedBranchKey);
        if (syms.length) openBranchForChain(selectedBranchKey);
        else openBranchForSymbols(selectedBranchKey);
      });
    }
    if (ui.terminalCloseBtn) {
      ui.terminalCloseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        hideTerminalPopup();
      });
    }
    if (ui.branchWireCross) {
      ui.branchWireCross.addEventListener("change", () => {
        const key = branchPopupSlotKey();
        if (key) {
          setWireCross(wireSkForBranch(key), ui.branchWireCross.value, true);
        }
      });
    }
    if (ui.wireApplyBtn) {
      ui.wireApplyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        applyWireCross();
      });
    }
    if (ui.wireClearBtn) {
      ui.wireClearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (selectedWireSkId) {
          setWireCross(selectedWireSkId, null, true);
          hideWirePopup();
          toast("שטח חתך הוסר");
        }
      });
    }
  }

  function openSheetModal() {
    populateBoardSelect();
    const m = state.meta;
    ui.s_title.value = m.title || "";
    ui.s_author.value = m.author || "";
    ui.s_date.value = m.date || "";
    ui.s_file.value = m.file || "";
    ui.s_folio.value = m.folio || "";
    ui.s_board.value = m.boardSizeId || "2x24";
    ui.s_material.value = m.conductorMaterial || "cu";
    ui.s_phase.value = m.conductorPhase || "1p";
    if (!rowLayoutMatchesBoard(ui.s_board.value, m.rowLayout)) {
      applyRowLayoutForBoard(ui.s_board.value, (m.rowLayout || []).length || null);
    } else {
      renderRowLayoutEditor();
    }
    applySkeletonOptsToUI(m.skeletonOpts);
    updateSheetModuleStatus();
    ui.sheetModal.classList.remove("hidden");
    setTimeout(() => ui.s_title.focus(), 0);
  }

  function saveSheetInfo() {
    commit(() => {
      state.meta.title = ui.s_title.value.trim();
      state.meta.author = ui.s_author.value.trim();
      state.meta.date = ui.s_date.value.trim();
      state.meta.file = ui.s_file.value.trim();
      state.meta.folio = ui.s_folio.value.trim();
      state.meta.boardSizeId = ui.s_board.value;
      state.meta.conductorMaterial = ui.s_material.value;
      state.meta.conductorPhase = ui.s_phase.value;
      state.meta.rowLayout = readRowLayoutFromUI();
      state.meta.skeletonOpts = readSkeletonOptsFromUI();
      recalcAllCrossSections();
    });
    ui.sheetModal.classList.add("hidden");
    syncUI();
    checkModuleOverflow(true);
  }

  function resetView() {
    view.tx = 0;
    view.ty = 0;
    view.scale = 1;
    render();
  }

  function fitViewToDrawing() {
    const { w: cw, h: ch } = stageSize();
    const area = drawingArea();
    let minX = area.x0;
    let maxX = area.x1;
    let minY = area.y0;
    let maxY = area.y1;
    const slots = state.meta.branchSlots || [];
    if (slots.length) {
      minX = Math.min(...slots.map((s) => s.x));
      maxX = Math.max(...slots.map((s) => s.x));
      minY = Math.min(...slots.map((s) => s.busY != null ? s.busY : s.y));
      maxY = Math.max(...slots.map((s) => {
        let y = s.stubEnd != null ? s.stubEnd : s.y + 120;
        const sym = symsOnSlot(s.slotKey).find((e) => e.desc || e.label);
        if (sym) y += 52;
        return y;
      }));
    }
    const entry = state.meta.skeletonBuilt ? findSkLine("entry") : null;
    if (entry) {
      minX = Math.min(minX, entry.x1);
      maxX = Math.max(maxX, entry.x1);
      minY = Math.min(minY, entry.y1, entry.y2);
      maxY = Math.max(maxY, entry.y1, entry.y2);
    }
    minX -= 90;
    maxX += 50;
    minY -= 50;
    maxY += 56;

    const f = paperFit();
    const worldW = Math.max(120, maxX - minX);
    const worldH = Math.max(120, maxY - minY);
    const sFit = Math.min((cw * 0.9) / (worldW * f.s), (ch * 0.88) / (worldH * f.s));
    view.scale = clamp(Math.min(sFit, 1.2), MIN_SCALE, MAX_SCALE);

    const sc = f.s * view.scale;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    view.tx = cw / 2 - cx * sc - f.ox * view.scale;
    view.ty = ch / 2 - cy * sc - f.oy * view.scale;
    render();
  }

  function resetViewForMobile() {
    if (state.meta.skeletonBuilt) {
      fitViewToDrawing();
      return;
    }
    resetView();
  }

  function init() {
    buildLibrary();
    buildBranchPopupPicker();
    wireUI();
    wireTermsGate();
    if (!isTermsAccepted()) {
      showTermsModal();
      return;
    }
    bootApp();
  }

  function bootApp() {
    if (window.RadialMenu) {
      RadialMenu.init({ onAction: handleRadialAction });
    }
    populateBoardSelect();
    addEventListener("resize", resize);
    addEventListener("orientationchange", resize);
    const stageEl = document.getElementById("canvas-stage");
    const vipBarEl = document.getElementById("vipTopBar");
    if (typeof ResizeObserver !== "undefined") {
      const layoutRo = new ResizeObserver(() => resize());
      if (stageEl) layoutRo.observe(stageEl);
      if (vipBarEl) layoutRo.observe(vipBarEl);
    }
    load();
    welcomeBoardId = state.meta.boardSizeId || "2x24";
    if (!state.meta.rowLayout || !state.meta.rowLayout.length ||
        !rowLayoutMatchesBoard(state.meta.boardSizeId, state.meta.rowLayout)) {
      applyRowLayoutForBoard(state.meta.boardSizeId || "2x24", null);
    }
    if (!state.meta.branchSlots) state.meta.branchSlots = [];
    if (!state.meta.skeletonOpts) state.meta.skeletonOpts = BoardSkeleton.defaultOpts();
    if (!state.meta.feedDir) state.meta.feedDir = "top";
    if (!state.meta.feedAlign) state.meta.feedAlign = "center";
    if (state.meta.skeletonBuilt == null) state.meta.skeletonBuilt = false;
    if (state.meta.skeletonBuilt && !state.elements.some((e) => e.skeleton)) {
      state.meta.skeletonBuilt = false;
      state.meta.branchSlots = [];
    }
    if (!state.meta.skeletonBuilt) {
      state.elements = state.elements.filter((e) => !e.skeleton);
      state.meta.branchSlots = [];
    }
    invalidateStaleSkeleton();
    state.elements = state.elements.map(migrateElement);
    repairSkeletonGeometry();
    resetViewForMobile();
    resize();
    syncSpacingPanelState();
    syncUI();
    checkModuleOverflow(false);
    if (hasStoredProject()) {
      if (!state.meta.skeletonBuilt) showWelcome(true);
    } else {
      showWelcome(false);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
