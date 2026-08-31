"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  readHintProgress,
  writeHintProgress,
} from "@/lib/explorationHints";
import { cameraLook } from "@/lib/three/cameraLook";
import {
  movementInput,
  STICK_DEADZONE,
} from "@/lib/three/movementInput";
import { cn } from "@/lib/utils";
import { useExperienceStore } from "@/store/experience";

const EASE = [0.22, 1, 0.36, 1] as const;

type AxisKey = "W" | "A" | "S" | "D";

type Held = Record<AxisKey, boolean>;

const IDLE: Held = { W: false, A: false, S: false, D: false };

const CODE_TO_KEY: Record<string, AxisKey> = {
  KeyW: "W",
  ArrowUp: "W",
  KeyA: "A",
  ArrowLeft: "A",
  KeyS: "S",
  ArrowDown: "S",
  KeyD: "D",
  ArrowRight: "D",
};

const FADE_AFTER_MS = 1100;
const POLL_MS = 220;
const LOOK_TRAVEL = 14;

function bootHints() {
  const seen = readHintProgress();
  return {
    moveVisible: !seen.move,
    lookVisible: !seen.look,
    moveDone: seen.move,
    lookDone: seen.look,
  };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Quiet control captions over the live studio.
 *
 * Discrete events (keydown, a slow poll of existing input signals) drive
 * visibility. Nothing here writes React state from the frame loop.
 */
export function ExplorationHints({
  coarsePointer,
}: {
  coarsePointer: boolean;
}) {
  const nearBoard = useExperienceStore((state) => state.activeBoardId);
  const [boot] = useState(() => bootHints());
  const [reduced] = useState(() => prefersReducedMotion());
  const hintMotion = {
    duration: reduced ? 0 : 0.7,
    ease: EASE,
  } as const;

  const [moveVisible, setMoveVisible] = useState(boot.moveVisible);
  const [lookVisible, setLookVisible] = useState(boot.lookVisible);
  const [lookLit, setLookLit] = useState(false);
  const [held, setHeld] = useState<Held>(IDLE);

  const moveDone = useRef(boot.moveDone);
  const lookDone = useRef(boot.lookDone);
  const moveStillShown = useRef(boot.moveVisible);
  const moveHide = useRef<number>(0);
  const lookHide = useRef<number>(0);

  const hideMove = useCallback(() => {
    moveStillShown.current = false;
    setMoveVisible(false);
    setHeld(IDLE);
  }, []);

  const hideLook = useCallback(() => {
    setLookVisible(false);
    setLookLit(false);
  }, []);

  const schedule = useCallback(
    (kind: "move" | "look") => {
      const hide = kind === "move" ? hideMove : hideLook;
      const slot = kind === "move" ? moveHide : lookHide;
      window.clearTimeout(slot.current);
      if (prefersReducedMotion()) {
        hide();
        return;
      }
      slot.current = window.setTimeout(hide, FADE_AFTER_MS);
    },
    [hideMove, hideLook],
  );

  const demonstrateMove = useCallback(() => {
    if (moveDone.current) return;
    moveDone.current = true;
    writeHintProgress({ move: true });
    schedule("move");
  }, [schedule]);

  const demonstrateLook = useCallback(() => {
    if (lookDone.current) return;
    lookDone.current = true;
    writeHintProgress({ look: true });
    setLookVisible(true);
    setLookLit(true);
    schedule("look");
  }, [schedule]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = CODE_TO_KEY[event.code];
      if (!key) return;
      if (moveStillShown.current) {
        setHeld((current) =>
          current[key] ? current : { ...current, [key]: true },
        );
      }
      demonstrateMove();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = CODE_TO_KEY[event.code];
      if (!key) return;
      if (!moveStillShown.current) return;
      setHeld((current) =>
        current[key] ? { ...current, [key]: false } : current,
      );
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [demonstrateMove]);

  useEffect(() => {
    let origin: { x: number; y: number } | null = null;

    const onPointerMove = (event: PointerEvent) => {
      if (lookDone.current) return;
      if (event.pointerType !== "mouse") return;

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('[aria-label="Movement joystick"]')
      ) {
        return;
      }

      if (!origin) {
        origin = { x: event.clientX, y: event.clientY };
        return;
      }

      if (
        Math.hypot(event.clientX - origin.x, event.clientY - origin.y) <
        LOOK_TRAVEL
      ) {
        return;
      }

      demonstrateLook();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [demonstrateLook]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const stick = Math.hypot(movementInput.stickX, movementInput.stickY);
      const keyed =
        movementInput.forward ||
        movementInput.backward ||
        movementInput.left ||
        movementInput.right;

      if (keyed || stick > STICK_DEADZONE) {
        demonstrateMove();
      }

      if (cameraLook.dragging || cameraLook.userHasLooked) {
        demonstrateLook();
      }
    }, POLL_MS);

    return () => window.clearInterval(id);
  }, [demonstrateMove, demonstrateLook]);

  useEffect(
    () => () => {
      window.clearTimeout(moveHide.current);
      window.clearTimeout(lookHide.current);
    },
    [],
  );

  const showMove = moveVisible && !nearBoard;
  const showLook = lookVisible && !nearBoard;

  return (
    <div
      data-exploration-hints=""
      className="pointer-events-none fixed inset-0 z-40"
      aria-hidden={showMove || showLook ? undefined : true}
    >
      {showMove || showLook ? (
        <p className="sr-only">
          The studio is interactive. Use W A S D or the joystick to move, drag
          to look, and Enter or tap to open a nearby board.
        </p>
      ) : null}

      <AnimatePresence>
        {showMove ? (
          <motion.div
            key="hint-move"
            data-hint="move"
            className={cn(
              "absolute left-[max(1.25rem,env(safe-area-inset-left))]",
              coarsePointer
                ? "bottom-[max(10.75rem,calc(env(safe-area-inset-bottom)+9.75rem))]"
                : "bottom-[max(1.75rem,env(safe-area-inset-bottom))]",
            )}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
            transition={hintMotion}
          >
            {coarsePointer ? (
              <p className="meta-sm text-background/45">Move</p>
            ) : (
              <DesktopMove held={held} />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showLook ? (
          <motion.div
            key="hint-look"
            data-hint="look"
            className={cn(
              "absolute right-[max(1.25rem,env(safe-area-inset-right))] text-right",
              coarsePointer
                ? "bottom-[max(10.75rem,calc(env(safe-area-inset-bottom)+9.75rem))]"
                : "bottom-[max(1.75rem,env(safe-area-inset-bottom))]",
            )}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
            transition={hintMotion}
          >
            <p
              className={cn(
                "meta-sm transition-colors duration-300",
                lookLit ? "text-accent" : "text-background/40",
              )}
            >
              Drag
            </p>
            <p
              className={cn(
                "meta-sm mt-1.5 transition-colors duration-300",
                lookLit ? "text-accent" : "text-background/50",
              )}
            >
              Look
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DesktopMove({ held }: { held: Held }) {
  return (
    <div className="flex flex-col items-start gap-2.5">
      <p className="meta-sm text-background/35">Explore</p>
      <div className="grid w-21 grid-cols-3 gap-1">
        <span />
        <KeyGlyph label="W" active={held.W} />
        <span />
        <KeyGlyph label="A" active={held.A} />
        <KeyGlyph label="S" active={held.S} />
        <KeyGlyph label="D" active={held.D} />
      </div>
      <p className="meta-sm text-background/45">Move</p>
    </div>
  );
}

function KeyGlyph({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      data-key={label}
      data-active={active ? "true" : "false"}
      className={cn(
        "meta-sm inline-flex h-7 w-7 items-center justify-center border transition-colors duration-300",
        active
          ? "border-accent text-accent"
          : "border-background/22 text-background/55",
      )}
    >
      {label}
    </span>
  );
}
