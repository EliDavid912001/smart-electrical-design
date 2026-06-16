/* =================================================================
 *  Radial context menu — VIP glass ring for selected symbols
 * ================================================================= */
(function (global) {
  "use strict";

  let root = null;
  let dim = null;
  let onAction = null;
  let target = null;
  let open = false;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function init(options) {
    root = document.getElementById("radialMenu");
    dim = root ? root.querySelector(".radial-menu__dim") : null;
    if (!root) return;
    onAction = options && options.onAction;

    root.querySelectorAll("[data-radial]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.radial;
        const el = target;
        if (action && el && onAction) onAction(action, el);
      });
    });

    if (dim) {
      dim.addEventListener("click", (e) => {
        e.stopPropagation();
        hide();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) hide();
    });
  }

  function isOpen() { return open; }

  function hitTest(sx, sy) {
    if (!root || !open) return false;
    const r = root.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const d = Math.hypot(sx - cx, sy - cy);
    return d <= r.width / 2 + 8;
  }

  function show(el, sx, sy) {
    if (!root || !el) return;
    target = el;
    const size = innerWidth <= 768 ? 196 : 228;
    const margin = size / 2 + 16;
    const x = clamp(sx, margin, innerWidth - margin);
    const y = clamp(sy, margin + 48, innerHeight - margin - 24);
    root.style.width = size + "px";
    root.style.height = size + "px";
    root.style.left = x + "px";
    root.style.top = y + "px";
    root.classList.remove("hidden");
    open = true;
    requestAnimationFrame(() => root.classList.add("is-open"));
  }

  function hide() {
    if (!root) return;
    open = false;
    root.classList.remove("is-open");
    window.setTimeout(() => {
      if (!open) root.classList.add("hidden");
    }, 220);
    target = null;
  }

  function getTarget() { return target; }

  global.RadialMenu = { init, show, hide, isOpen, hitTest, getTarget };
})(typeof window !== "undefined" ? window : globalThis);
