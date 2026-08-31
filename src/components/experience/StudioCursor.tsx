"use client";

import { useEffect, useState } from "react";

import { selectStudioSurface, useExperienceStore } from "@/store/experience";

/**
 * Subtle custom cursor while exploring.
 *
 * Hidden on coarse pointers and under reduced motion. Native cursor is
 * never permanently suppressed — only swapped for a small editorial mark.
 */
export function StudioCursor() {
  const overWorld = useExperienceStore((s) => selectStudioSurface(s.mode));
  const [pointerOk, setPointerOk] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [board, setBoard] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => setPointerOk(fine.matches && !reduced.matches);
    sync();

    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  const enabled = overWorld && pointerOk;

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("studio-cursor");
      delete document.body.dataset.cursor;
      return;
    }

    document.documentElement.classList.add("studio-cursor");

    const onMove = (event: PointerEvent) => {
      setPos({ x: event.clientX, y: event.clientY });
      setBoard(document.body.dataset.cursor === "board");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("studio-cursor");
      delete document.body.dataset.cursor;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[90] mix-blend-difference"
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
    >
      <div
        className={`-translate-x-1/2 -translate-y-1/2 rounded-full border transition-[width,height,border-color] duration-300 ${
          board
            ? "border-accent h-10 w-10"
            : "border-background h-2.5 w-2.5 bg-background"
        }`}
      />
    </div>
  );
}
