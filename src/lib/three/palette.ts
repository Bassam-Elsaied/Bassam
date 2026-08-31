/**
 * Scene palette — the 3D counterpart of the CSS design tokens.
 *
 * SUNLIT CONCRETE GALLERY AT DUSK: warm bone concrete, charcoal recesses,
 * vermilion reserved for interaction and a few authored accents.
 */
export const palette = {
  /** Floor — cooler/darker so sunlit patches land near bone. */
  floor: "#b8b0a3",
  /** Slightly warmer floor band for seams / thresholds. */
  floorWarm: "#c9c0b3",
  /** Darker joint lines between slabs. */
  floorJoint: "#9a9286",
  /** Board faces — mounted paper. */
  panel: "#e8e1d4",
  /** Walls: charcoal with a warm bias. */
  wall: "#3c3630",
  /** Recessed wall panels — a step darker for depth. */
  wallRecess: "#2a2520",
  /** Ceiling sits darker than the walls to keep the eye down. */
  ceiling: "#322c26",
  /** Light structural concrete — sunlit mass. */
  concreteLight: "#d2cbc0",
  /** Structural concrete — partitions, columns, beams, oculus. */
  concrete: "#c4bdb0",
  /** Mid concrete for soffits and returns. */
  concreteMid: "#aea79c",
  /** Cooler / darker structural mass. */
  concreteCool: "#948c80",
  /** Board frames — dark joinery, not a screen bezel. */
  frame: "#2e2924",
  /** Printed area fallback. */
  artwork: "#4c443b",
  /** Interaction accent. */
  accent: "#ff4a1c",

  atmosphere: "#1f1b17",

  /** Charcoal cloth — trousers / dark shoe upper. */
  figureCloth: "#14110F",
  /** Bone outerwear — exact page bone. */
  figureBone: "#EDE8E0",
  /** Warm grey secondary cloth. */
  figureGrey: "#8A8378",
  /** Pale skin. */
  figureSkin: "#C9B8A6",
  /** Near-black hair / eye silhouette. */
  figureHair: "#1A1613",

  /** Dark exhibition metal. */
  metal: "#2a2520",
  /** Restrained warm wood for bench seats. */
  wood: "#6e5f4e",
  /** Neutral architectural glass tint. */
  glass: "#d8d2c8",

  sun: "#ffdcb8",
  aperture: "#f5e6d0",
  skyFill: "#ffe8d2",
  groundFill: "#3f372e",
  dust: "#f4e6d2",
} as const;

/**
 * Room dimensions matching the imported gallery.glb AABB
 * (~12.9 × 8.3 × 24.9 m). Boards and collision stay inside these bounds.
 */
export const room = {
  width: 12.9,
  depth: 24.9,
  height: 8.25,
  get halfWidth() {
    return this.width / 2;
  },
  get halfDepth() {
    return this.depth / 2;
  },
} as const;
