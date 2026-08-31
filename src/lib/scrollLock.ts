"use client";

/**
 * Reference-counted body scroll lock.
 *
 * Two things now cover the viewport — the mobile menu and the studio — and
 * both need the document behind them to hold still. Saving and restoring
 * `body.style.overflow` per component makes the result depend on unmount
 * order: one can capture the other's "hidden" and restore it afterwards,
 * carrying the lock onto a page that has nothing covering it. React does
 * not promise an order across separate subtrees, and today's happens to be
 * benign, which is not something to build on.
 *
 * Counting instead writes the style once on the first lock and restores it
 * once on the last release, whatever order they arrive in.
 */
let holders = 0;
let restoreTo = "";

/** Locks the body and returns an idempotent release function. */
export function lockBodyScroll(): () => void {
  if (holders === 0) {
    restoreTo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  holders += 1;

  let released = false;

  return () => {
    if (released) return;
    released = true;
    holders -= 1;
    if (holders === 0) {
      document.body.style.overflow = restoreTo;
    }
  };
}
