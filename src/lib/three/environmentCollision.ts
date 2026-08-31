/**
 * Collision proxies for the ready-made gallery (`gallery.glb`).
 *
 * The Sketchfab mesh is a single unnamed shell (~2.4k tris) with no useful
 * node hierarchy, so proxies are authored from measured world-space faces:
 *
 *   Inner wall faces (ray-sampled):  x = ±5.435,  z = ±12.411
 *   Centre benches (vertex AABB):    (0, ±6) and (0, 0) — slim blocks along Z
 *   Overhead frames at |x|≈1.8:      y > 5.5 only — no floor collision
 *
 * Character and camera both consume `ENVIRONMENT_OBSTACLES` via `layout.ts`.
 * Do not duplicate wall / furniture positions elsewhere.
 */

export type CollisionProxy = {
  /** Debug / authoring label. */
  id: string;
  x: number;
  z: number;
  /** Full width along local X before rotation. */
  width: number;
  /** Full depth along local Z before rotation. */
  depth: number;
  height: number;
  rotationY: number;
};

export type Obstacle = {
  x: number;
  z: number;
  halfWidth: number;
  halfDepth: number;
  height: number;
  rotationY: number;
  sin: number;
  cos: number;
};

/** Measured inner faces of the gallery shell (world units). */
export const GALLERY_WALLS = {
  west: -5.435,
  east: 5.435,
  north: -12.411,
  south: 12.411,
} as const;

/** Inner ceiling — matches `room.height` / the GLB AABB. */
export const GALLERY_HEIGHT = 8.25;

/** How far wall boxes extend outward past the inner face. */
const WALL_THICKNESS = 1.05;

/**
 * Three centre-line benches from the GLB vertex AABB, padded slightly so the
 * body stops before the visible mesh.
 */
export const GALLERY_BENCHES: readonly CollisionProxy[] = [
  { id: "bench-south", x: 0, z: 6.0, width: 0.72, depth: 2.35, height: 0.5, rotationY: 0 },
  { id: "bench-centre", x: 0, z: 0.0, width: 0.72, depth: 2.35, height: 0.5, rotationY: 0 },
  { id: "bench-north", x: 0, z: -6.0, width: 0.72, depth: 2.35, height: 0.5, rotationY: 0 },
] as const;

const hallDepth =
  GALLERY_WALLS.south - GALLERY_WALLS.north + WALL_THICKNESS * 2;
const hallWidth =
  GALLERY_WALLS.east - GALLERY_WALLS.west + WALL_THICKNESS * 2;

/**
 * Solid wall slabs. Inner faces sit on the measured planes so a character of
 * radius `r` is pushed to stay at least `r` outside the visible wall.
 */
export const GALLERY_WALL_PROXIES: readonly CollisionProxy[] = [
  {
    id: "wall-west",
    x: GALLERY_WALLS.west - WALL_THICKNESS / 2,
    z: 0,
    width: WALL_THICKNESS,
    depth: hallDepth,
    height: GALLERY_HEIGHT,
    rotationY: 0,
  },
  {
    id: "wall-east",
    x: GALLERY_WALLS.east + WALL_THICKNESS / 2,
    z: 0,
    width: WALL_THICKNESS,
    depth: hallDepth,
    height: GALLERY_HEIGHT,
    rotationY: 0,
  },
  {
    id: "wall-north",
    x: 0,
    z: GALLERY_WALLS.north - WALL_THICKNESS / 2,
    width: hallWidth,
    depth: WALL_THICKNESS,
    height: GALLERY_HEIGHT,
    rotationY: 0,
  },
  {
    id: "wall-south",
    x: 0,
    z: GALLERY_WALLS.south + WALL_THICKNESS / 2,
    width: hallWidth,
    depth: WALL_THICKNESS,
    height: GALLERY_HEIGHT,
    rotationY: 0,
  },
] as const;

export function createObstacle(
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
  rotationY: number,
): Obstacle {
  return {
    x,
    z,
    halfWidth: width / 2,
    halfDepth: depth / 2,
    height,
    rotationY,
    sin: Math.sin(rotationY),
    cos: Math.cos(rotationY),
  };
}

function proxyToObstacle(proxy: CollisionProxy): Obstacle {
  return createObstacle(
    proxy.x,
    proxy.z,
    proxy.width,
    proxy.depth,
    proxy.height,
    proxy.rotationY,
  );
}

/** All environment blockers — walls + furniture. Boards are added in layout. */
export const ENVIRONMENT_PROXIES: readonly CollisionProxy[] = [
  ...GALLERY_WALL_PROXIES,
  ...GALLERY_BENCHES,
];

export const ENVIRONMENT_OBSTACLES: readonly Obstacle[] =
  ENVIRONMENT_PROXIES.map(proxyToObstacle);

/**
 * Walkable rectangle for the character centre. Inset by `radius` from the
 * measured inner wall faces — not from the mesh AABB and not by camera offset.
 */
export function walkBounds(radius: number) {
  return {
    minX: GALLERY_WALLS.west + radius,
    maxX: GALLERY_WALLS.east - radius,
    minZ: GALLERY_WALLS.north + radius,
    maxZ: GALLERY_WALLS.south - radius,
  } as const;
}
