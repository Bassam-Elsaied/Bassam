import type { Route } from "next";

/**
 * The four boards that make up the 3D studio. Single source of truth for
 * WebGL placement and DOM navigation.
 *
 * Floor plan for the ready-made gallery (~13 × 25 m), looking down −Z:
 *
 *                     ABOUT [0, -10.2]
 *      WORK [-5.15, -3.5]
 *      SERVICES [-5.15, 3.8]
 *                   CHARACTER spawn [0, 3.0]
 *                    CONTACT [0, 11.8]  (+Z entrance wall)
 */

export type BoardId = "work" | "about" | "services" | "contact";

/**
 * Presentation hint for the shared InteractiveBoard / face painter.
 * Describes intent — never carries render logic.
 */
export type BoardVisualType =
  | "project-editorial"
  | "portrait"
  | "typography"
  | "statement";

export type Board = {
  id: BoardId;
  /** Editorial index, also rendered in the DOM nav. */
  index: string;
  title: string;
  subtitle: string;
  route: Route;
  /** World-space [x, y, z]; y is the centre height of the board face. */
  position: [number, number, number];
  /** Y rotation in radians. Every board is turned to face the origin. */
  rotationY: number;
  /** Board face size in world units, [width, height]. */
  size: [number, number];
  /** Distance from the board at which interaction becomes available. */
  interactionRadius: number;
  /** Accent used for the board's frame glow and DOM hover state. */
  accent: string;
  /** How the face should be composed. */
  visualType: BoardVisualType;
  /** Short eyebrow above the title on the painted face. */
  eyebrow: string;
};

export const boards: Board[] = [
  {
    id: "work",
    index: "01",
    title: "Work",
    subtitle: "Selected projects",
    route: "/work",
    position: [-5.15, 1.85, -3.5],
    rotationY: Math.PI / 2,
    size: [3.1, 2.15],
    interactionRadius: 2.6,
    accent: "#FF4A1C",
    visualType: "project-editorial",
    eyebrow: "Exhibition",
  },
  {
    id: "about",
    index: "02",
    title: "About",
    subtitle: "Who I am",
    route: "/about",
    position: [0, 1.85, -10.2],
    rotationY: 0,
    size: [3.1, 2.15],
    interactionRadius: 2.6,
    accent: "#FF4A1C",
    visualType: "portrait",
    eyebrow: "Portrait",
  },
  {
    id: "services",
    index: "03",
    title: "Services",
    subtitle: "What I build",
    route: "/services",
    position: [-5.15, 1.85, 3.8],
    rotationY: Math.PI / 2,
    size: [3.1, 2.15],
    interactionRadius: 2.6,
    accent: "#FF4A1C",
    visualType: "typography",
    eyebrow: "Practice",
  },
  {
    id: "contact",
    index: "04",
    title: "Contact",
    subtitle: "Available to hire",
    route: "/contact",
    position: [0, 1.85, 11.8],
    rotationY: Math.PI,
    size: [3.1, 2.15],
    interactionRadius: 2.6,
    accent: "#FF4A1C",
    visualType: "statement",
    eyebrow: "Letter",
  },
];

export function getBoard(id: BoardId): Board {
  const board = boards.find((entry) => entry.id === id);
  if (!board) {
    throw new Error(`Unknown board id: ${id}`);
  }
  return board;
}
