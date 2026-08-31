import type { BoardId } from "@/data/boards";
import { getBoard } from "@/data/boards";
import { animateCameraToBoard } from "@/lib/three/cameraTransition";
import { clearMovementInput } from "@/lib/three/movementInput";
import { movementGate } from "@/lib/three/movementGate";
import {
  getNavigationFlight,
  resetNavigationFlight,
  setNavigationFlight,
} from "@/lib/three/navigationFlight";
import { useExperienceStore } from "@/store/experience";

type TransitionHooks = {
  playOverlay: (boardId: BoardId) => Promise<void>;
};

type RouterLike = {
  push: (href: string) => void;
};

/**
 * Central navigation action for the 3D world.
 *
 * Concurrent Enter / click / navbar hits collapse onto a single flight —
 * only the first claim wins via `beginInteraction`.
 */
export async function navigateToBoard(
  boardId: BoardId,
  router: RouterLike,
  hooks: TransitionHooks,
): Promise<boolean> {
  const existing = getNavigationFlight();
  if (existing) return existing;

  const board = getBoard(boardId);
  if (!board?.route) return false;

  const store = useExperienceStore.getState();
  if (!store.beginInteraction(boardId)) return false;

  movementGate.lock();
  clearMovementInput();

  const run = (async () => {
    const camera = animateCameraToBoard(board);
    try {
      await camera.done;
      const current = useExperienceStore.getState();
      if (current.mode !== "interacting") {
        camera.kill();
        return false;
      }
      current.beginTransition();
      await hooks.playOverlay(boardId);
      if (useExperienceStore.getState().mode !== "transitioning") {
        return false;
      }
      router.push(board.route);
      return true;
    } catch {
      camera.kill();
      useExperienceStore.getState().cancelNavigation();
      return false;
    } finally {
      resetNavigationFlight();
    }
  })();

  setNavigationFlight(run);
  return run;
}
