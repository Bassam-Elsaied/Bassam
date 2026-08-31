"use client";

import { MotionConfig } from "motion/react";

/**
 * Site-wide Motion configuration.
 *
 * `reducedMotion="user"` makes every Motion animation honour
 * `prefers-reduced-motion` by jumping to its resting state. Reveal
 * components can therefore keep a single DOM tree for server and client —
 * branching on the preference is what produced React hydration error #418.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
