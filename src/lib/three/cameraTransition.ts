import gsap from "gsap";
import { MathUtils, Vector3 } from "three";

import type { Board } from "@/data/boards";
import { viewObstruction } from "@/lib/three/collision";
import { cameraRig } from "@/lib/three/cameraRig";
import { PARTITION } from "@/lib/three/layout";
import { room } from "@/lib/three/palette";

const WALL_CLEARANCE = 0.85;
const MIN_DISTANCE = 3.2;
const IDEAL_DISTANCE = 5.8;
const EYE = 2.05;

const scratchFrom = new Vector3();
const scratchTo = new Vector3();
const scratchOffset = new Vector3();

let activeTween: gsap.core.Tween | null = null;

export function killActiveCameraTransition() {
  if (activeTween) {
    activeTween.kill();
    activeTween = null;
    cameraRig.smoothTime = 0.55;
  }
}

/**
 * Picks a cinematic camera resting place in front of a board.
 */
function resolveCinematicPose(board: Board): {
  target: Vector3;
  offset: Vector3;
} {
  const [bx, , bz] = board.position;
  const facingX = Math.sin(board.rotationY);
  const facingZ = Math.cos(board.rotationY);

  const target = new Vector3(bx, EYE, bz);

  let distance = IDEAL_DISTANCE;
  scratchOffset.set(facingX * distance, 1.55, facingZ * distance);

  scratchFrom.copy(target);
  scratchTo.copy(target).add(scratchOffset);

  const blocked = viewObstruction(
    scratchFrom.x,
    scratchFrom.y,
    scratchFrom.z,
    scratchTo.x,
    scratchTo.y,
    scratchTo.z,
  );

  if (blocked < 1) {
    distance = Math.max(MIN_DISTANCE, distance * Math.max(0.55, blocked));
    scratchOffset.set(facingX * distance, 1.4, facingZ * distance);
  }

  const camX = target.x + scratchOffset.x;
  const camZ = target.z + scratchOffset.z;
  const limitX = room.halfWidth - WALL_CLEARANCE;
  const limitZ = room.halfDepth - WALL_CLEARANCE;

  if (Math.abs(camX) > limitX || Math.abs(camZ) > limitZ) {
    const clampedX = MathUtils.clamp(camX, -limitX, limitX);
    const clampedZ = MathUtils.clamp(camZ, -limitZ, limitZ);
    scratchOffset.set(
      clampedX - target.x,
      scratchOffset.y,
      clampedZ - target.z,
    );

    const planar = Math.hypot(scratchOffset.x, scratchOffset.z);
    if (planar < MIN_DISTANCE) {
      const pull = MIN_DISTANCE + PARTITION.depth;
      scratchOffset.set(facingX * pull, 1.6, facingZ * pull);
    }
  }

  return { target, offset: scratchOffset.clone() };
}

export type CameraTransitionHandle = {
  done: Promise<void>;
  kill: () => void;
};

/**
 * GSAP approach of the shared camera rig toward a board.
 *
 * Under `prefers-reduced-motion` the camera snaps to the pose instead of
 * easing — functional navigation without the cinematic.
 */
export function animateCameraToBoard(board: Board): CameraTransitionHandle {
  killActiveCameraTransition();

  const pose = resolveCinematicPose(board);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    cameraRig.target.copy(pose.target);
    cameraRig.offset.copy(pose.offset);
    cameraRig.fov = 32;
    cameraRig.smoothTime = 0.2;
    return {
      done: Promise.resolve(),
      kill: () => {
        cameraRig.smoothTime = 0.55;
      },
    };
  }

  const startTarget = cameraRig.target.clone();
  const startOffset = cameraRig.offset.clone();
  const distance = startTarget.distanceTo(pose.target);
  const duration = MathUtils.clamp(0.85 + distance * 0.04, 0.85, 1.35);

  const proxy = {
    tx: startTarget.x,
    ty: startTarget.y,
    tz: startTarget.z,
    ox: startOffset.x,
    oy: startOffset.y,
    oz: startOffset.z,
    fov: cameraRig.fov,
  };

  let settled = false;

  const done = new Promise<void>((resolve) => {
    activeTween = gsap.to(proxy, {
      tx: pose.target.x,
      ty: pose.target.y,
      tz: pose.target.z,
      ox: pose.offset.x,
      oy: pose.offset.y,
      oz: pose.offset.z,
      fov: 32,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        cameraRig.target.set(proxy.tx, proxy.ty, proxy.tz);
        cameraRig.offset.set(proxy.ox, proxy.oy, proxy.oz);
        cameraRig.fov = proxy.fov;
        cameraRig.smoothTime = 0.18;
      },
      onComplete: () => {
        activeTween = null;
        cameraRig.smoothTime = 0.35;
        settled = true;
        resolve();
      },
      onInterrupt: () => {
        activeTween = null;
        if (!settled) resolve();
      },
    });
  });

  return {
    done,
    kill: () => {
      killActiveCameraTransition();
    },
  };
}
