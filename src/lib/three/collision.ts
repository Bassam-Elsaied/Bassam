import type { Vector3 } from "three";

import { GALLERY_WALLS } from "@/lib/three/environmentCollision";
import { BOUNDS, FIGURE, OBSTACLES } from "@/lib/three/layout";
import { room } from "@/lib/three/palette";

/**
 * Lightweight collision: a circle against oriented boxes, plus the walkable
 * rectangle. No physics engine, and nothing here allocates — every function
 * runs inside the frame loop and works on scalars.
 *
 * Correctness is traded for feel on purpose. The visitor is pushed to the
 * nearest surface and the velocity component heading into it is removed, so
 * walking into a partition slides along it instead of stopping dead. That
 * matters more at gallery speeds than a physically exact response.
 */

/** Floor height under a point. The ready-made gallery floor is flat at y=0. */
export function groundHeightAt(x: number, z: number): number {
  void x;
  void z;
  return 0;
}

/**
 * Sphere around the camera used for obstruction. Kept smaller than the
 * character radius so standing against a wall does not put the look origin
 * inside the inflated wall volume.
 */
const CAMERA_COLLISION_RADIUS = 0.22;

/** Extra gap so the near clip never kisses a surface. */
const CAMERA_SURFACE_MARGIN = 0.14;

/** Floor clearance for the lens, independent of orbit pitch. */
const CAMERA_MIN_HEIGHT = 0.8;

const CAMERA_INFLATION = CAMERA_COLLISION_RADIUS + CAMERA_SURFACE_MARGIN;

/**
 * Pushes `position` out of anything it overlaps and cancels the velocity
 * heading into that surface. Mutates both.
 */
export function resolveCollision(position: Vector3, velocity: Vector3): void {
  const r = FIGURE.radius;

  for (const box of OBSTACLES) {
    /* Into the box's own frame, where the test is axis-aligned. */
    const dx = position.x - box.x;
    const dz = position.z - box.z;
    const lx = dx * box.cos - dz * box.sin;
    const lz = dx * box.sin + dz * box.cos;

    /* Trivial reject before any square root. */
    if (
      Math.abs(lx) > box.halfWidth + r ||
      Math.abs(lz) > box.halfDepth + r
    ) {
      continue;
    }

    const closestX = clamp(lx, -box.halfWidth, box.halfWidth);
    const closestZ = clamp(lz, -box.halfDepth, box.halfDepth);

    let normalX = lx - closestX;
    let normalZ = lz - closestZ;
    const distSq = normalX * normalX + normalZ * normalZ;

    if (distSq > r * r) continue;

    let localX: number;
    let localZ: number;

    if (distSq > 1e-8) {
      /* Outside the box but within the radius: push straight out. */
      const dist = Math.sqrt(distSq);
      normalX /= dist;
      normalZ /= dist;
      localX = closestX + normalX * r;
      localZ = closestZ + normalZ * r;
    } else {
      /* Centre is inside the box — only reachable if something teleported
         the visitor. Eject along whichever axis is nearest to daylight. */
      const escapeX = box.halfWidth + r - Math.abs(lx);
      const escapeZ = box.halfDepth + r - Math.abs(lz);
      if (escapeX < escapeZ) {
        normalX = lx >= 0 ? 1 : -1;
        normalZ = 0;
        localX = normalX * (box.halfWidth + r);
        localZ = lz;
      } else {
        normalX = 0;
        normalZ = lz >= 0 ? 1 : -1;
        localX = lx;
        localZ = normalZ * (box.halfDepth + r);
      }
    }

    position.x = box.x + localX * box.cos + localZ * box.sin;
    position.z = box.z - localX * box.sin + localZ * box.cos;

    /* Same rotation applied to the normal, then strip the inward part of
       the velocity so the visitor slides along the face. */
    const worldNormalX = normalX * box.cos + normalZ * box.sin;
    const worldNormalZ = -normalX * box.sin + normalZ * box.cos;
    const inward = velocity.x * worldNormalX + velocity.z * worldNormalZ;
    if (inward < 0) {
      velocity.x -= worldNormalX * inward;
      velocity.z -= worldNormalZ * inward;
    }
  }

  if (position.x < BOUNDS.minX) {
    position.x = BOUNDS.minX;
    if (velocity.x < 0) velocity.x = 0;
  } else if (position.x > BOUNDS.maxX) {
    position.x = BOUNDS.maxX;
    if (velocity.x > 0) velocity.x = 0;
  }

  if (position.z < BOUNDS.minZ) {
    position.z = BOUNDS.minZ;
    if (velocity.z < 0) velocity.z = 0;
  } else if (position.z > BOUNDS.maxZ) {
    position.z = BOUNDS.maxZ;
    if (velocity.z > 0) velocity.z = 0;
  }
}

/**
 * How far along the segment from the visitor to the desired camera the view
 * is first blocked, as a fraction in [0, 1]. Returns 1 when nothing is in
 * the way.
 *
 * Tests the whole segment against the shared obstacle list (walls, benches,
 * partitions) as 3D boxes, inflated by the camera radius so the lens never
 * sits on a surface. Furniture can be cleared over the top; gallery walls
 * reach the ceiling and cannot.
 *
 * The same list the character collides with — never a second floor plan.
 */
export function viewObstruction(
  fromX: number,
  fromY: number,
  fromZ: number,
  toX: number,
  toY: number,
  toZ: number,
  inflation: number = CAMERA_INFLATION,
): number {
  let nearest = 1;

  const dy = toY - fromY;

  for (const box of OBSTACLES) {
    const p0x = (fromX - box.x) * box.cos - (fromZ - box.z) * box.sin;
    const p0z = (fromX - box.x) * box.sin + (fromZ - box.z) * box.cos;
    const p1x = (toX - box.x) * box.cos - (toZ - box.z) * box.sin;
    const p1z = (toX - box.x) * box.sin + (toZ - box.z) * box.cos;

    const halfX = box.halfWidth + inflation;
    const halfZ = box.halfDepth + inflation;
    const yMin = -inflation;
    const yMax = box.height + inflation;

    let enter = 0;
    let exit = 1;
    let missed = false;

    const slab = (p0: number, d: number, min: number, max: number) => {
      if (missed) return;
      if (Math.abs(d) < 1e-8) {
        if (p0 < min || p0 > max) missed = true;
        return;
      }
      let t1 = (min - p0) / d;
      let t2 = (max - p0) / d;
      if (t1 > t2) {
        const swap = t1;
        t1 = t2;
        t2 = swap;
      }
      if (t1 > enter) enter = t1;
      if (t2 < exit) exit = t2;
    };

    slab(p0x, p1x - p0x, -halfX, halfX);
    slab(p0z, p1z - p0z, -halfZ, halfZ);
    slab(fromY, dy, yMin, yMax);

    if (missed || enter > exit || exit <= 0 || enter >= nearest) continue;

    /* Origin inside the inflated box: treat as blocked at the origin so
       the camera is pulled onto the segment rather than left in solid. */
    const t = enter < 0 ? 0 : enter;
    if (t < nearest) nearest = t;
  }

  return nearest;
}

/**
 * Clip `from → to` to the inner gallery volume (camera centre inset by
 * radius + margin). Returns the exit fraction along the segment. This is a
 * ray/AABB test — not an independent X/Z clamp of the camera point.
 */
function innerVolumeExitT(
  fromX: number,
  fromY: number,
  fromZ: number,
  toX: number,
  toY: number,
  toZ: number,
): number {
  const r = CAMERA_INFLATION;
  const minX = GALLERY_WALLS.west + r;
  const maxX = GALLERY_WALLS.east - r;
  const minZ = GALLERY_WALLS.north + r;
  const maxZ = GALLERY_WALLS.south - r;
  const minY = CAMERA_MIN_HEIGHT;
  const maxY = room.height - r;

  let enter = 0;
  let exit = 1;
  let missed = false;

  const slab = (p0: number, d: number, min: number, max: number) => {
    if (missed) return;
    if (Math.abs(d) < 1e-8) {
      if (p0 < min || p0 > max) missed = true;
      return;
    }
    let t1 = (min - p0) / d;
    let t2 = (max - p0) / d;
    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
    }
    if (t1 > enter) enter = t1;
    if (t2 < exit) exit = t2;
  };

  slab(fromX, toX - fromX, minX, maxX);
  slab(fromY, toY - fromY, minY, maxY);
  slab(fromZ, toZ - fromZ, minZ, maxZ);

  if (missed || enter > exit || exit <= 0) return 1;
  /* From is inside the room, so enter <= 0. Exit is where the camera
     would leave. Cap to the segment. */
  return exit > 1 ? 1 : exit;
}

/**
 * Safe camera distance along `from → to`.
 *
 * Combines obstacle hits with the inner gallery volume. The returned
 * distance is where the camera centre should sit — already clear of
 * surfaces by `CAMERA_COLLISION_RADIUS + CAMERA_SURFACE_MARGIN`.
 */
export function cameraObstructionDistance(
  fromX: number,
  fromY: number,
  fromZ: number,
  toX: number,
  toY: number,
  toZ: number,
): number {
  const full = Math.hypot(toX - fromX, toY - fromY, toZ - fromZ);
  if (full < 1e-6) return 0;

  const blocked = viewObstruction(fromX, fromY, fromZ, toX, toY, toZ);
  const bounds = innerVolumeExitT(fromX, fromY, fromZ, toX, toY, toZ);
  const t = blocked < bounds ? blocked : bounds;
  const distance = full * t;
  return distance < 0.05 ? 0.05 : distance > full ? full : distance;
}

/** True when a point is somewhere the visitor could actually stand. */
export function isWalkable(x: number, z: number): boolean {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) {
    return false;
  }

  for (const box of OBSTACLES) {
    const dx = x - box.x;
    const dz = z - box.z;
    const lx = dx * box.cos - dz * box.sin;
    const lz = dx * box.sin + dz * box.cos;
    if (
      Math.abs(lx) <= box.halfWidth + FIGURE.radius &&
      Math.abs(lz) <= box.halfDepth + FIGURE.radius
    ) {
      return false;
    }
  }

  return true;
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}
