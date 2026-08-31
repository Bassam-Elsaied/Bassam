"use client";

import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/store/experience";

/**
 * The two affordances that move between the world and the document.
 *
 * Deliberately small and typographic — they belong to the same editorial
 * system as the rest of the site, not to a game HUD.
 */

export function SkipExplorationControl({ onSkip }: { onSkip: () => void }) {
  const onPaper = useExperienceStore((s) => s.mode === "loading");

  return (
    <div className="pointer-events-none fixed top-0 left-0 z-[55] px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))]">
      <button
        type="button"
        onClick={onSkip}
        className={cn(
          "meta-sm pointer-events-auto py-1 transition-colors duration-300",
          onPaper
            ? "text-foreground/40 hover:text-foreground"
            : "text-background/40 hover:text-background",
        )}
      >
        Skip exploration
        <span aria-hidden="true" className="ml-1.5">
          →
        </span>
      </button>
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
