"use client";

import { BOUNDS } from "@/lib/three/layout";

/**
 * Opt-in read-out of what the world is actually doing.
 *
 * Movement, collision and camera behaviour are numeric and continuous, so
 * screenshots can only ever suggest whether they are right. This publishes
 * the live values on `window.__world` so a test can assert that the visitor
 * accelerated, stopped short of a wall, or never lost sight of the camera.
 *
 * It is off unless the page is loaded with `?debug=world`, and the object
 * is mutated in place rather than replaced, so the frame loop stays
 * allocation-free either way.
 */
export type WorldTelemetry = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  state: string;
  seeking: boolean;
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  /** Distance from camera to visitor — the value occlusion pull-in moves. */
  cameraDistance: number;
  /** Frames drawn since mount, so a test can tell a live loop from a stall. */
  frames: number;
  /**
   * React commits of the character subtree since mount.
   *
   * This is the measurement behind "no per-frame React state updates": if
   * anything in the movement path reached for `setState` or wrote to the
   * store each frame, this would climb alongside `frames` instead of
   * sitting at its mount value.
   */
  renders: number;
  /** The walkable rectangle, so a test need not restate the floor plan. */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
};

const KEY = "__world";

export function createTelemetry(): WorldTelemetry | null {
  if (typeof window === "undefined") return null;
  if (!new URLSearchParams(window.location.search).has("debug")) return null;

  return {
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    speed: 0,
    state: "idle",
    seeking: false,
    cameraX: 0,
    cameraY: 0,
    cameraZ: 0,
    cameraDistance: 0,
    frames: 0,
    renders: 0,
    bounds: {
      minX: BOUNDS.minX,
      maxX: BOUNDS.maxX,
      minZ: BOUNDS.minZ,
      maxZ: BOUNDS.maxZ,
    },
  };
}

export function publishTelemetry(telemetry: WorldTelemetry | null): () => void {
  if (!telemetry) return () => {};

  const target = window as unknown as Record<string, unknown>;
  target[KEY] = telemetry;

  return () => {
    delete target[KEY];
  };
}
