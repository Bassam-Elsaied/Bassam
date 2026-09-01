import { profile } from "@/data/profile";

/**
 * East-wall paint. Flush to the gallery shell (inner face x=5.435).
 * Look-only; the four boards remain the nav destinations.
 */
export const wallNote = {
  position: [5.428, 1.72, 0.15] as const,
  rotationY: -Math.PI / 2,
  /** World width along the wall (Z), then height. */
  size: [6.2, 2.4] as const,
  eyebrow: "Hello",
  lines: ["Make yourself", "at home"] as const,
  body: "I'm Bassam. This is my Portfolio. The boards on the walls are the work — walk up to one when something catches you.",
  sign: profile.name,
  role: profile.role,
} as const;
