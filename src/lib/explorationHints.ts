/**
 * First-visit exploration hint progress.
 *
 * Written only when the visitor actually uses a control — never on a timer,
 * never per frame. Returning visitors skip the full onboarding; the board
 * prompt remains independent.
 */

export const EXPLORATION_HINTS_KEY = "portfolio-exploration-hints-seen";

export type HintProgress = {
  move: boolean;
  look: boolean;
};

const EMPTY: HintProgress = { move: false, look: false };

export function readHintProgress(): HintProgress {
  if (typeof window === "undefined") return EMPTY;

  try {
    const raw = window.localStorage.getItem(EXPLORATION_HINTS_KEY);
    if (!raw) return { ...EMPTY };
    if (raw === "1" || raw === "true") return { move: true, look: true };

    const parsed = JSON.parse(raw) as Partial<HintProgress>;
    return {
      move: Boolean(parsed.move),
      look: Boolean(parsed.look),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeHintProgress(partial: Partial<HintProgress>) {
  if (typeof window === "undefined") return;

  try {
    const next = { ...readHintProgress(), ...partial };
    window.localStorage.setItem(EXPLORATION_HINTS_KEY, JSON.stringify(next));
  } catch {
    /* Private mode / quota — session still hides the demonstrated hint. */
  }
}
