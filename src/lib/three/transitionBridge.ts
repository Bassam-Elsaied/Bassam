/**
 * Bridge between the Canvas tree and the DOM transition overlay.
 *
 * The overlay lives outside R3F; boards need to await its wipe. A tiny
 * mutable handle avoids prop-drilling a Promise factory through World.
 */
type OverlayPlayer = (boardId: string) => Promise<void>;

let player: OverlayPlayer = async () => {};

export function setTransitionOverlayPlayer(next: OverlayPlayer) {
  player = next;
}

export function playTransitionOverlay(boardId: string): Promise<void> {
  return player(boardId);
}
