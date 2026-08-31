"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import {
  cameraLook,
  resetCameraLook,
} from "@/lib/three/cameraLook";
import { captureOrbitFromOffset, orbitBy } from "@/lib/three/cameraRig";
import { movementGate } from "@/lib/three/movementGate";

const LOOK = {
  mouse: 0.0044,
  touch: 0.0052,
  mouseThreshold: 5,
  touchThreshold: 10,
} as const;

function isLookButton(event: PointerEvent) {
  if (event.pointerType !== "mouse") return true;
  return event.button === 0 || event.button === 2;
}

function stillHeld(event: PointerEvent) {
  if (event.pointerType !== "mouse") return true;
  /* 1 = left, 2 = right. */
  return (event.buttons & 1) === 1 || (event.buttons & 2) === 2;
}

/**
 * Drag-to-orbit on the WebGL canvas.
 *
 * Clicks below the movement threshold fall through to boards and
 * click-to-move. HTML overlays (joystick, skip, nav, prompts) sit above
 * the canvas and never reach this listener.
 */
export function useCameraLook(enabled: boolean) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!enabled) {
      resetCameraLook();
      return;
    }

    const el = gl.domElement;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (movementGate.locked) return;
      if (cameraLook.pointerId !== null) return;
      if (!isLookButton(event)) return;

      cameraLook.suppressClick = false;
      cameraLook.pointerId = event.pointerId;
      cameraLook.dragging = false;
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;
      captureOrbitFromOffset();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (cameraLook.pointerId !== event.pointerId) return;
      if (movementGate.locked) {
        resetCameraLook();
        return;
      }
      if (!stillHeld(event)) return;

      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      if (!cameraLook.dragging) {
        const travelled = Math.hypot(
          event.clientX - startX,
          event.clientY - startY,
        );
        const threshold =
          event.pointerType === "mouse"
            ? LOOK.mouseThreshold
            : LOOK.touchThreshold;
        if (travelled < threshold) return;

        cameraLook.dragging = true;
        cameraLook.userHasLooked = true;
        try {
          el.setPointerCapture(event.pointerId);
        } catch {
          /* Capture is best-effort — look still works without it. */
        }
      }

      event.preventDefault();
      const sensitivity =
        event.pointerType === "mouse" ? LOOK.mouse : LOOK.touch;
      /* Drag right → look right. Drag up → look up (camera lowers). */
      orbitBy(-dx * sensitivity, dy * sensitivity);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (cameraLook.pointerId !== event.pointerId) return;
      if (cameraLook.dragging) cameraLook.suppressClick = true;
      cameraLook.dragging = false;
      cameraLook.pointerId = null;
      try {
        if (el.hasPointerCapture(event.pointerId)) {
          el.releasePointerCapture(event.pointerId);
        }
      } catch {
        /* already released */
      }
    };

    const onContextMenu = (event: Event) => {
      event.preventDefault();
    };

    const onLost = () => {
      if (movementGate.locked) resetCameraLook();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp, true);
    el.addEventListener("pointercancel", onPointerUp, true);
    el.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("visibilitychange", onLost);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp, true);
      el.removeEventListener("pointercancel", onPointerUp, true);
      el.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("visibilitychange", onLost);
      resetCameraLook();
    };
  }, [enabled, gl]);
}
