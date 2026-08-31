"use client";

import { cn } from "@/lib/utils";

/**
 * The two affordances that move between the world and the document.
 *
 * Deliberately small and typographic — they belong to the same editorial
 * system as the rest of the site, not to a game HUD.
 */

export function SkipExplorationButton({
  onSkip,
  tone,
}: {
  onSkip: () => void;
  tone: "paper" | "world";
}) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className={cn(
        "meta-sm pointer-events-auto shrink-0 whitespace-nowrap py-1 transition-colors duration-300",
        tone === "paper"
          ? "text-foreground/40 hover:text-foreground"
          : "text-background/40 hover:text-background",
      )}
    >
      Skip exploration
      <span aria-hidden="true" className="ml-1.5">
        →
      </span>
    </button>
  );
}

/**
 * Shown once the loader is gone. Lives on its own left rail under the
 * header so it never shares a line with the wordmark or nav.
 */
export function SkipExplorationControl({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="pointer-events-none fixed top-0 left-0 z-[55] px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))]">
      <SkipExplorationButton onSkip={onSkip} tone="world" />
    </div>
  );
}

export function EnterStudioControl({ onEnter }: { onEnter: () => void }) {
  return (
    <button
      type="button"
      onClick={onEnter}
      className="meta bg-foreground text-background hover:bg-accent fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.25rem,env(safe-area-inset-left))] z-40 px-5 py-3.5 transition-colors duration-300 sm:left-8"
    >
      <span
        aria-hidden="true"
        className="bg-accent mr-3 inline-block h-[5px] w-[5px] align-middle"
      />
      Enter the studio
    </button>
  );
}
