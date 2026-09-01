import { SPAWN } from "@/lib/three/layout";

/**
 * Live visitor pose. Written by Character each frame, read by the crowd
 * glance — never through React state.
 */
export const playerPose: { x: number; z: number; speed: number } = {
  x: SPAWN.x,
  z: SPAWN.z,
  speed: 0,
};
