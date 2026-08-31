"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearStick,
  movementInput,
  setStick,
  STICK_DEADZONE,
} from "@/lib/three/movementInput";
import { movementGate } from "@/lib/three/movementGate";
import { cn } from "@/lib/utils";

const RADIUS = 56;
const KNOB = 22;
const MAX_TRAVEL = RADIUS - KNOB * 0.55;

type Point = { x: number; y: number };

/**
 * Left-thumb virtual joystick for exploration.
 *
 * Writes into the same `movementInput` object the keyboard uses. There is
 * no parallel mobile movement path — release returns the stick to zero and
 * the character controller coasts to a stop the same way it does on WASD.
 */
export function VirtualJoystick({ className }: { className?: string }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const origin = useRef<Point>({ x: 0, y: 0 });
  const [knob, setKnob] = useState<Point>({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [sprinting, setSprinting] = useState(false);

  const release = useCallback(() => {
    pointerId.current = null;
    clearStick();
    setKnob({ x: 0, y: 0 });
    setActive(false);
  }, []);

  useEffect(
    () => () => {
      release();
      movementInput.sprint = false;
    },
    [release],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (movementGate.locked) return;
    if (pointerId.current !== null) return;

    const base = baseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    origin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    pointerId.current = event.pointerId;
    base.setPointerCapture(event.pointerId);
    setActive(true);
    sample(event.clientX, event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    sample(event.clientX, event.clientY);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    release();
  };

  function sample(clientX: number, clientY: number) {
    if (movementGate.locked) {
      release();
      return;
    }

    let dx = clientX - origin.current.x;
    let dy = clientY - origin.current.y;
    const length = Math.hypot(dx, dy);

    if (length > MAX_TRAVEL && length > 0) {
      const scale = MAX_TRAVEL / length;
      dx *= scale;
      dy *= scale;
    }

    setKnob({ x: dx, y: dy });

    /* Screen Y grows downward; stick Y is forward-positive. */
    setStick(dx / MAX_TRAVEL, -dy / MAX_TRAVEL);
  }

  return (
    <div
      className={cn(
        "pointer-events-auto select-none",
        className,
      )}
    >
      <div
        ref={baseRef}
        role="application"
        aria-label="Movement joystick"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "relative touch-none rounded-full border transition-colors duration-300",
          active
            ? "border-background/45 bg-background/10"
            : "border-background/25 bg-background/5",
        )}
        style={{ width: RADIUS * 2, height: RADIUS * 2 }}
      >
        <div
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 left-1/2 rounded-full transition-[background-color] duration-300",
            active ? "bg-background/90" : "bg-background/55",
          )}
          style={{
            width: KNOB * 2,
            height: KNOB * 2,
            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          }}
        />
        {/* Dead-zone ring — visual only. */}
        <div
          aria-hidden="true"
          className="border-background/15 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: STICK_DEADZONE * MAX_TRAVEL * 2,
            height: STICK_DEADZONE * MAX_TRAVEL * 2,
          }}
        />
      </div>

      <button
        type="button"
        aria-pressed={sprinting}
        aria-label="Sprint"
        onPointerDown={(event) => {
          event.preventDefault();
          if (movementGate.locked) return;
          movementInput.sprint = true;
          setSprinting(true);
        }}
        onPointerUp={() => {
          movementInput.sprint = false;
          setSprinting(false);
        }}
        onPointerCancel={() => {
          movementInput.sprint = false;
          setSprinting(false);
        }}
        onPointerLeave={() => {
          movementInput.sprint = false;
          setSprinting(false);
        }}
        className="meta-sm text-background/70 border-background/25 active:border-accent active:text-accent mt-3 ml-1 border px-3 py-2 touch-none"
      >
        Sprint
      </button>
    </div>
  );
}
