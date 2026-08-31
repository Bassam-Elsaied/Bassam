import type { Route } from "next";
import { boards } from "./boards";

export type NavItem = {
  id: string;
  index: string;
  label: string;
  description: string;
  href: Route;
};

/**
 * Navigation is derived from the board configuration rather than declared
 * separately — the DOM menu and the 3D world are guaranteed to stay in sync.
 */
export const navItems: NavItem[] = boards.map((board) => ({
  id: board.id,
  index: board.index,
  label: board.title,
  description: board.subtitle,
  href: board.route,
}));
