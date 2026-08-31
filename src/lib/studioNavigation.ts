import type { BoardId } from "@/data/boards";
import { playTransitionOverlay } from "@/lib/three/transitionBridge";

type RouterLike = {
  push: (href: string) => void;
};

/**
 * Nav hand-off into the studio. `navigateToBoard` pulls GSAP and three,
 * so it is loaded only when a board flight actually starts.
 */
export async function flyToBoard(boardId: BoardId, router: RouterLike) {
  const { navigateToBoard } = await import("@/lib/three/navigateToBoard");
  return navigateToBoard(boardId, router, {
    playOverlay: playTransitionOverlay,
  });
}
