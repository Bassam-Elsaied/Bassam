"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";

import { useCameraLook } from "@/hooks/useCameraLook";
import { cameraObstructionDistance } from "@/lib/three/collision";
import { cameraLook } from "@/lib/three/cameraLook";
import { cameraRig } from "@/lib/three/cameraRig";
import { movementGate } from "@/lib/three/movementGate";
import { useExperienceStore } from "@/store/experience";

/**
 * Third-person follow camera with free-look orbit.
 *
 * Pipeline (all mutable, no React state):
 *   orbit offset → desired point B → segment A→B obstruction
 *   → safe distance along that ray → damp only when receding
 *   → place the THREE camera on the ray
 *
 * World-space lerp of camera.position is never used: that path tunnels
 * through walls during a 360° orbit.
 */
export function CameraController({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const exploring = useExperienceStore((state) => state.mode === "exploring");
  useCameraLook(exploring);

  const lookAt = useRef(new Vector3().copy(cameraRig.target));
  const offset = useRef(new Vector3());
  const desired = useRef(new Vector3());
  const along = useRef(0);
  const primed = useRef(false);

  useFrame((state, rawDelta) => {
    const camera = state.camera;
    if (!(camera instanceof PerspectiveCamera)) return;

    const delta = Math.min(rawDelta, 0.1);

    /* Board approach owns the rig — do not fight GSAP with orbit collision. */
    if (movementGate.locked) {
      primed.current = false;
      camera.position.set(
        cameraRig.target.x + cameraRig.offset.x,
        cameraRig.target.y + cameraRig.offset.y,
        cameraRig.target.z + cameraRig.offset.z,
      );
      camera.lookAt(cameraRig.target);
      return;
    }

    const aspect = state.size.width / Math.max(1, state.size.height);
    const dolly = MathUtils.clamp(1.55 / aspect, 1, 1.2);
    const lens = MathUtils.clamp(1.62 / aspect, 1, 1.3);

    offset.current.copy(cameraRig.offset);
    offset.current.x *= dolly;
    offset.current.z *= dolly;
    offset.current.y *= 1 + (dolly - 1) * 0.4;

    /* Decorative drift is applied to the desired point, then the
       obstruction test is allowed to pull it back — never after. */
    if (!reducedMotion && !cameraLook.dragging) {
      const time = state.clock.elapsedTime;
      offset.current.x += Math.sin(time * 0.1) * 0.6;
      offset.current.y += Math.sin(time * 0.071) * 0.25;
    }

    const ax = cameraRig.target.x;
    const ay = cameraRig.target.y;
    const az = cameraRig.target.z;
    desired.current.set(ax + offset.current.x, ay + offset.current.y, az + offset.current.z);

    const safe = cameraObstructionDistance(
      ax,
      ay,
      az,
      desired.current.x,
      desired.current.y,
      desired.current.z,
    );

    /* Pull-in is immediate so a blocked pose is never shown. Ease only
       when the ray opens up, so the camera grows back out smoothly. */
    if (!primed.current) {
      along.current = safe;
      primed.current = true;
    } else if (safe < along.current) {
      along.current = safe;
    } else {
      const followTime = cameraLook.dragging ? 0.14 : cameraRig.smoothTime;
      easing.damp(along, "current", safe, followTime, delta);
    }

    const full = Math.hypot(
      offset.current.x,
      offset.current.y,
      offset.current.z,
    );
    if (full > 1e-6) {
      const scale = along.current / full;
      camera.position.set(
        ax + offset.current.x * scale,
        ay + offset.current.y * scale,
        az + offset.current.z * scale,
      );
    } else {
      camera.position.set(ax, ay, az);
    }

    const lookTime = cameraLook.dragging ? 0.14 : cameraRig.smoothTime * 0.75;
    easing.damp3(lookAt.current, cameraRig.target, lookTime, delta);
    camera.lookAt(lookAt.current);

    const targetFov = cameraRig.fov * lens;
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      easing.damp(camera, "fov", targetFov, 0.5, delta);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
