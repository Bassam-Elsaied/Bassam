"use client";

import { AnimatePresence, motion } from "motion/react";

import { getBoard } from "@/data/boards";
import { useExperienceStore } from "@/store/experience";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Gallery label that appears when the visitor stands near a board.
 *
 * Typographic only — no card, no blur. Desktop shows Enter; touch shows
 * Tap. Both labels live in the DOM; CSS picks which is visible so
 * hydration stays clean.
 */
export function InteractionPrompt({
  onEnter,
}: {
  onEnter: () => void;
}) {
  const mode = useExperienceStore((s) => s.mode);
  const activeBoardId = useExperienceStore((s) => s.activeBoardId);
  const board =
    mode === "exploring" && activeBoardId ? getBoard(activeBoardId) : undefined;

  return (
    <AnimatePresence>
      {board ? (
        <motion.div
          key={board.id}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:bottom-24 sm:pb-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <div className="pointer-events-auto text-center text-background">
            <p className="meta-sm text-background/45">
              {board.index} / {board.title}
            </p>
            <p className="meta-sm text-background/70 mt-2">{board.subtitle}</p>
            <button
              type="button"
              onClick={onEnter}
              className="meta text-background/80 hover:text-accent mt-4 py-2 transition-colors duration-300"
            >
              <span data-prompt-desktop="">
                <span className="sr-only">Enter</span>
                <span aria-hidden="true">
                  [ Enter{" "}
                  <span className="text-accent">↵</span>
                  {" ]"}
                </span>
              </span>
              <span data-prompt-touch="" className="hidden">
                <span className="sr-only">Tap to enter</span>
                <span aria-hidden="true">[ Tap ]</span>
              </span>
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
