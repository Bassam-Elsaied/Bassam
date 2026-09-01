import type { Quality } from "@/hooks/useDeviceQuality";

/**
 * Exhibition visitors. Positions are authored against the ready-made
 * gallery floor plan (inner faces x=±5.435, z=±12.411) and stay off the
 * centre aisle, spawn, benches and board approach corridors.
 *
 * yaw: 0 faces +Z (south / Contact), π faces −Z (north / About).
 */
export type CrowdModelId =
  | "casual-hoodie"
  | "casual-jacket"
  | "casual-woman"
  | "suit-woman";

export type CrowdClip = "Idle" | "Idle_Neutral" | "Walk";

export type CrowdWalk = {
  /** World XZ waypoints. Ping-ponged slowly between the ends. */
  points: readonly (readonly [number, number])[];
  /** Seconds to walk the polyline one way. */
  seconds: number;
  /** Seconds standing at each canvas before turning back. */
  hold?: number;
};

export type CrowdVisitor = {
  id: string;
  model: CrowdModelId;
  x: number;
  z: number;
  yaw: number;
  clip: CrowdClip;
  /** Clothing / hair remap index into the shared crowd palettes. */
  palette: number;
  /**
   * 0 = every device, 1 = medium+, 2 = high only.
   * Low-quality loads only models used by tier 0.
   */
  tier: 0 | 1 | 2;
  walk?: CrowdWalk;
  /** One person per cluster may glance when the visitor stands nearby. */
  glance?: boolean;
};

export const CROWD_MODELS: Record<CrowdModelId, string> = {
  "casual-hoodie": "/models/crowd/casual-hoodie.glb",
  "casual-jacket": "/models/crowd/casual-jacket.glb",
  "casual-woman": "/models/crowd/casual-woman.glb",
  "suit-woman": "/models/crowd/suit-woman.glb",
};

const WEST = -Math.PI / 2;
const NORTH = Math.PI;
const SOUTH = 0;

/**
 * A thin gallery: two people per board, About as two small clusters,
 * one walker per aisle.
 */
export const CROWD: readonly CrowdVisitor[] = [
  /* Work — west wall, south of the approach at z=-3.5 */
  {
    id: "work-a",
    model: "casual-jacket",
    x: -3.52,
    z: -2.28,
    yaw: WEST + 0.12,
    clip: "Idle",
    palette: 0,
    tier: 0,
    glance: true,
  },
  {
    id: "work-b",
    model: "casual-woman",
    x: -3.68,
    z: -4.72,
    yaw: WEST - 0.14,
    clip: "Idle_Neutral",
    palette: 1,
    tier: 0,
  },

  /* About — two clusters either side of x=0. Innermost |x| >= 1.78 so the
     walk lane to the canvas stays clear of body colliders. */
  {
    id: "about-a",
    model: "casual-hoodie",
    x: -1.82,
    z: -8.32,
    yaw: NORTH + 0.1,
    clip: "Idle",
    palette: 3,
    tier: 0,
    glance: true,
  },
  {
    id: "about-b",
    model: "casual-woman",
    x: -2.28,
    z: -8.58,
    yaw: NORTH - 0.14,
    clip: "Idle_Neutral",
    palette: 4,
    tier: 0,
  },
  {
    id: "about-c",
    model: "casual-hoodie",
    x: 1.82,
    z: -8.28,
    yaw: NORTH - 0.08,
    clip: "Idle",
    palette: 5,
    tier: 0,
    glance: true,
  },
  {
    id: "about-d",
    model: "suit-woman",
    x: 2.28,
    z: -8.55,
    yaw: NORTH + 0.12,
    clip: "Idle_Neutral",
    palette: 0,
    tier: 1,
  },

  /* Services — west wall, offset from z=3.8 */
  {
    id: "services-a",
    model: "casual-woman",
    x: -3.55,
    z: 2.48,
    yaw: WEST - 0.1,
    clip: "Idle",
    palette: 2,
    tier: 0,
    glance: true,
  },
  {
    id: "services-b",
    model: "casual-jacket",
    x: -3.68,
    z: 5.05,
    yaw: WEST + 0.16,
    clip: "Idle_Neutral",
    palette: 1,
    tier: 1,
  },

  /* Contact — south wall, off the x=0 approach */
  {
    id: "contact-a",
    model: "casual-woman",
    x: -1.58,
    z: 9.52,
    yaw: SOUTH + 0.12,
    clip: "Idle",
    palette: 4,
    tier: 0,
    glance: true,
  },
  {
    id: "contact-b",
    model: "casual-hoodie",
    x: 1.52,
    z: 9.62,
    yaw: SOUTH - 0.1,
    clip: "Idle_Neutral",
    palette: 3,
    tier: 1,
  },

  /* East aisle walker — Contact ↔ About, never on x=0. */
  {
    id: "walk-east",
    model: "casual-hoodie",
    x: 3.08,
    z: 8.7,
    yaw: NORTH,
    clip: "Walk",
    palette: 4,
    tier: 0,
    walk: {
      points: [
        [3.08, 8.85],
        [3.08, 3.6],
        [3.08, -1.8],
        [3.08, -7.45],
      ],
      seconds: 28,
      hold: 2.6,
    },
  },

  /* West bay walker — Work → About. */
  {
    id: "walk-west",
    model: "casual-hoodie",
    x: -3.08,
    z: -5.2,
    yaw: NORTH,
    clip: "Walk",
    palette: 2,
    tier: 1,
    walk: {
      points: [
        [-3.08, -5.2],
        [-3.08, -6.55],
        [-2.78, -7.4],
      ],
      seconds: 12,
      hold: 2.4,
    },
  },
];

export function crowdTier(quality: Quality): 0 | 1 | 2 {
  if (quality === "high") return 2;
  if (quality === "medium") return 1;
  return 0;
}

export function visitorsForQuality(quality: Quality): CrowdVisitor[] {
  const max = crowdTier(quality);
  return CROWD.filter((visitor) => visitor.tier <= max);
}

export function modelsForQuality(quality: Quality): CrowdModelId[] {
  const used = new Set(
    visitorsForQuality(quality).map((visitor) => visitor.model),
  );
  return (Object.keys(CROWD_MODELS) as CrowdModelId[]).filter((id) =>
    used.has(id),
  );
}

export function walkLength(points: CrowdWalk["points"]): number {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i][0] - points[i - 1][0];
    const dz = points[i][1] - points[i - 1][1];
    length += Math.hypot(dx, dz);
  }
  return length;
}

/**
 * `u` in [0, 1] along the polyline. Yaw faces the travel direction
 * (0 = +Z, π = −Z), matching the rest of the studio.
 */
export function sampleWalk(
  points: CrowdWalk["points"],
  u: number,
): { x: number; z: number; yaw: number } {
  if (points.length === 0) return { x: 0, z: 0, yaw: 0 };
  if (points.length === 1) {
    return { x: points[0][0], z: points[0][1], yaw: 0 };
  }

  const t = Math.min(1, Math.max(0, u));
  const total = walkLength(points);
  let remaining = t * total;
  let lastDx = points[1][0] - points[0][0];
  let lastDz = points[1][1] - points[0][1];

  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i][0] - points[i - 1][0];
    const dz = points[i][1] - points[i - 1][1];
    const seg = Math.hypot(dx, dz) || 1e-6;
    lastDx = dx;
    lastDz = dz;
    if (remaining <= seg || i === points.length - 1) {
      const f = remaining / seg;
      return {
        x: points[i - 1][0] + dx * f,
        z: points[i - 1][1] + dz * f,
        yaw: Math.atan2(dx, dz),
      };
    }
    remaining -= seg;
  }

  const last = points[points.length - 1];
  return { x: last[0], z: last[1], yaw: Math.atan2(lastDx, lastDz) };
}

/** Ping-pong along a walk, with optional holds at each end. */
export function walkAlong(
  walk: CrowdWalk,
  elapsed: number,
): { x: number; z: number; yaw: number; moving: boolean } {
  const hold = walk.hold ?? 0;
  const oneWay = walk.seconds;
  const cycle = 2 * (oneWay + hold);
  let t = elapsed % cycle;
  if (t < 0) t += cycle;

  if (t < oneWay) {
    return { ...sampleWalk(walk.points, t / oneWay), moving: true };
  }
  if (t < oneWay + hold) {
    return { ...sampleWalk(walk.points, 1), moving: false };
  }
  if (t < 2 * oneWay + hold) {
    const u = 1 - (t - oneWay - hold) / oneWay;
    const sample = sampleWalk(walk.points, u);
    return {
      x: sample.x,
      z: sample.z,
      yaw: sample.yaw + Math.PI,
      moving: true,
    };
  }
  return { ...sampleWalk(walk.points, 0), moving: false };
}
