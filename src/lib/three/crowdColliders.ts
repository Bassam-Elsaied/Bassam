import {
  createObstacle,
  type Obstacle,
} from "@/lib/three/environmentCollision";

/**
 * Live crowd blockers. Written when the crowd mounts for the current
 * quality tier, cleared on unmount. Camera obstruction ignores this list
 * on purpose — visitors should not yank the follow rig.
 */
const colliders: Obstacle[] = [];

export function crowdColliders(): readonly Obstacle[] {
  return colliders;
}

export function setCrowdColliders(
  people: readonly {
    x: number;
    z: number;
    width?: number;
    depth?: number;
    yaw?: number;
  }[],
): void {
  colliders.length = 0;
  for (const person of people) {
    colliders.push(
      createObstacle(
        person.x,
        person.z,
        person.width ?? 0.46,
        person.depth ?? 0.4,
        1.8,
        person.yaw ?? 0,
      ),
    );
  }
}
