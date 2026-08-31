"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";

import { getBoard, type BoardId } from "@/data/boards";
import { boardFaces } from "@/lib/three/boardFaces";

const EASE = [0.22, 1, 0.36, 1] as const;

export type TransitionOverlayHandle = {
  play: (boardId: BoardId) => Promise<void>;
};

/**
 * Board-originated route wipe.
 *
 * Under reduced motion the wipe is instantaneous — the label still appears
 * so the destination is announced, but there is no expanding clip.
 */
export const TransitionOverlay = forwardRef<TransitionOverlayHandle>(
  function TransitionOverlay(_, ref) {
    const [boardId, setBoardId] = useState<BoardId | null>(null);
    const [phase, setPhase] = useState<"idle" | "in" | "hold">("idle");
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => {
      return () => {
        if (timer.current !== undefined) window.clearTimeout(timer.current);
      };
    }, []);

    const play = useCallback((id: BoardId) => {
      return new Promise<void>((resolve) => {
        if (timer.current !== undefined) window.clearTimeout(timer.current);

        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        setBoardId(id);
        setPhase("in");

        const duration = reduced ? 0 : 700;
        timer.current = window.setTimeout(() => {
          setPhase("hold");
          resolve();
        }, duration);
      });
    }, []);

    useImperativeHandle(ref, () => ({ play }), [play]);

    const board = boardId ? getBoard(boardId) : undefined;
    const face = boardId ? boardFaces[boardId] : undefined;

    return (
      <AnimatePresence>
        {phase !== "idle" && board ? (
          <motion.div
            key={board.id}
            className="bg-foreground pointer-events-none fixed inset-0 z-[80] flex items-end"
            initial={{ clipPath: "inset(42% 38% 42% 38%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div
              aria-hidden="true"
              className="bg-accent absolute top-0 left-0 h-1 w-full origin-left"
              style={{
                transform: phase === "hold" ? "scaleX(1)" : "scaleX(0.35)",
              }}
            />
            <div className="text-background relative z-10 w-full px-5 pb-[max(4rem,calc(env(safe-area-inset-bottom)+3rem))] sm:px-8 sm:pb-20">
              <p className="meta-sm text-accent mb-3">{board.index}</p>
              <p className="display tracking-tight uppercase">{board.title}</p>
              <p className="meta mt-3 text-background/55">
                {face?.subtitle ?? board.subtitle}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  },
);
