"use client";

import { useEffect } from "react";

import {
  clearMovementInput,
  movementInput,
  type MovementInput,
} from "@/lib/three/movementInput";

type Axis = keyof Omit<
  MovementInput,
  "sprint" | "stickX" | "stickY"
>;

/**
 * Keyed on `event.code`, the physical key, rather than `event.key`. On a
 * French or German layout the letters differ but the cluster is in the same
 * place under the hand, which is the thing that matters.
 */
const AXIS_KEYS: Record<string, Axis> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

const SPRINT_KEYS = new Set(["ShiftLeft", "ShiftRight"]);

function belongsElsewhere(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;

  const element = document.activeElement;
  if (!element) return false;

  if (element instanceof HTMLElement && element.isContentEditable) return true;

  const tag = element.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;

  return element.closest('[role="dialog"]') !== null;
}

/**
 * Subscribes the shared `movementInput` object to the keyboard for as long
 * as the character (and therefore the Canvas) is mounted.
 */
export function useMovementInput(): MovementInput {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (belongsElsewhere(event)) return;

      const axis = AXIS_KEYS[event.code];
      if (axis) {
        movementInput[axis] = true;
        event.preventDefault();
        return;
      }

      if (SPRINT_KEYS.has(event.code)) movementInput.sprint = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const axis = AXIS_KEYS[event.code];
      if (axis) movementInput[axis] = false;
      else if (SPRINT_KEYS.has(event.code)) movementInput.sprint = false;
    };

    const onVisibility = () => {
      if (document.hidden) clearMovementInput();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearMovementInput);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearMovementInput);
      document.removeEventListener("visibilitychange", onVisibility);
      clearMovementInput();
    };
  }, []);

  return movementInput;
}
