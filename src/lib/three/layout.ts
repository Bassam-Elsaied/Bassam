import { boards } from "@/data/boards";
import {
  ENVIRONMENT_OBSTACLES,
  createObstacle,
  walkBounds,
  type Obstacle,
} from "@/lib/three/environmentCollision";

export type { Obstacle };

/**
 * Floor plan for the ready-made gallery shell.
 *
 * Environment walls / benches live in `environmentCollision.ts`.
 * Board partitions are derived from `data/boards.ts`.
 */

/**
 * Spawn in the clear bay between the centre and south benches, facing
 * into the hall (−Z). Kept well clear of Contact on the entrance wall.
 */
export const SPAWN = {
  x: 0,
  z: 3.0,
  yaw: Math.PI,
} as const;

export const FIGURE = {
  height: 1.78,
  radius: 0.38,
  eyeLine: 1.42,
} as const;

/** Freestanding partition each board is hung on. */
export const PARTITION = { width: 3.6, height: 3.4, depth: 0.28 } as const;

/** Walkable centre bounds — inset by character radius from real wall faces. */
export const BOUNDS = walkBounds(FIGURE.radius);

const BOARD_OBSTACLES: readonly Obstacle[] = boards.map((board) =>
  createObstacle(
    board.position[0],
    board.position[2],
    PARTITION.width,
    PARTITION.depth,
    PARTITION.height,
    board.rotationY,
  ),
);

/**
 * Single obstacle list for character collision and camera obstruction.
 * Environment first, then board partitions.
 */
export const OBSTACLES: readonly Obstacle[] = [
  ...ENVIRONMENT_OBSTACLES,
  ...BOARD_OBSTACLES,
];
