import { create } from "zustand";

import type { BoardId } from "@/data/boards";
import { resetCameraRig } from "@/lib/three/cameraRig";
import { killActiveCameraTransition } from "@/lib/three/cameraTransition";
import { resetCameraLookSession } from "@/lib/three/cameraLook";
import { clearMovementInput } from "@/lib/three/movementInput";
import { resetNavigationFlight } from "@/lib/three/navigationFlight";
import { movementGate } from "@/lib/three/movementGate";

/**
 * Discrete experience state only.
 *
 * Nothing here is written on a per-frame basis — positions, camera and
 * particles are mutated through refs inside `useFrame`. This store holds
 * the handful of values that genuinely change the React tree.
 *
 * Modes form a single lifecycle. Competing booleans (isLoading &&
 * isNavigating && …) are deliberately avoided — a phase already says
 * what is and is not allowed.
 *
 * Persistence across routes:
 *   Persistent — webglAvailable, skipped (explicit document preference)
 *   Transient  — mode, activeBoardId, pendingReentry, interaction flight
 *
 * `ExperienceLayer` boots a fresh session whenever `/` mounts, so an old
 * `html-only` mode cannot leave the homepage blank or studio-less.
 *
 * Homepage entry is always `probing → loading → exploring`. There is no
 * intro gate — the studio is the default surface.
 */
export type ExperienceMode =
  /** Before capability detection resolves on the client. */
  | "probing"
  /** Canvas mounting / assets resolving. */
  | "loading"
  /** Character free to move; boards may activate. */
  | "exploring"
  /** Board selected; controls locked; camera approaching. */
  | "interacting"
  /** Route change in flight; Canvas still up until the wipe completes. */
  | "transitioning"
  /** WebGL unavailable, or the visitor chose the plain document. */
  | "html-only";

type ExperienceState = {
  mode: ExperienceMode;
  webglAvailable: boolean;
  /** False while the tab is hidden, used to stop the render loop. */
  rendering: boolean;
  /** Nearest board inside its interaction radius, or null. */
  activeBoardId: BoardId | null;
  /**
   * Set when leaving `/` via a board transition. Returning via Back
   * re-enters the world immediately (loading → exploring).
   */
  pendingReentry: boolean;
  /** Explicit skip — remount keeps the document until Enter is chosen. */
  skipped: boolean;

  /**
   * Called when the homepage experience mounts and WebGL capability is
   * known. Always produces a valid visible state — never leaves `/` blank.
   */
  bootHome: (webglAvailable: boolean) => void;
  /**
   * Called when the homepage experience unmounts (leaving `/`).
   * Cleans side effects and records soft-reentry when appropriate.
   */
  teardownHome: () => void;
  enterWorld: () => void;
  markWorldReady: () => void;
  exitToDocument: (opts?: { skipped?: boolean }) => void;
  /** Hard fallback when the WebGL layer fails after mounting. */
  failToDocument: () => void;
  setRendering: (rendering: boolean) => void;
  setActiveBoard: (id: BoardId | null) => void;
  beginInteraction: (id: BoardId) => boolean;
  beginTransition: () => void;
  cancelNavigation: () => void;
};

function isWorldMounted(mode: ExperienceMode) {
  return (
    mode === "loading" ||
    mode === "exploring" ||
    mode === "interacting" ||
    mode === "transitioning"
  );
}

function canExplore(mode: ExperienceMode) {
  return mode === "exploring";
}

function haltWorldSideEffects() {
  killActiveCameraTransition();
  resetNavigationFlight();
  resetCameraRig();
  resetCameraLookSession();
  movementGate.unlock();
  clearMovementInput();
}

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  mode: "probing",
  webglAvailable: false,
  rendering: true,
  activeBoardId: null,
  pendingReentry: false,
  skipped: false,

  bootHome: (webglAvailable) => {
    const state = get();

    if (!webglAvailable) {
      if (state.mode === "html-only" && !state.webglAvailable) return;
      haltWorldSideEffects();
      set({
        webglAvailable: false,
        mode: "html-only",
        pendingReentry: false,
        activeBoardId: null,
      });
      return;
    }

    /* Explicit skip — keep the HTML document until they choose Enter. */
    if (state.skipped) {
      if (state.mode === "html-only" && state.webglAvailable) return;
      haltWorldSideEffects();
      set({
        webglAvailable: true,
        mode: "html-only",
        pendingReentry: false,
        activeBoardId: null,
      });
      return;
    }

    /* Already in the studio — do not remount on exploring/loading updates. */
    if (isWorldMounted(state.mode)) {
      if (!state.webglAvailable) set({ webglAvailable: true });
      return;
    }

    /* Direct studio entry. Never restore a stale html-only mode from a
       prior homepage session — unless the visitor skipped. */
    haltWorldSideEffects();
    set({
      webglAvailable: true,
      mode: "loading",
      pendingReentry: false,
      activeBoardId: null,
      skipped: false,
    });
  },

  teardownHome: () => {
    const state = get();
    /* Soft-reentry when the visitor left mid-experience (board transition,
       or an in-flight load/explore interrupted by routing / Strict remount). */
    const softReentry =
      !state.skipped &&
      (state.pendingReentry ||
        state.mode === "transitioning" ||
        state.mode === "interacting" ||
        state.mode === "loading" ||
        state.mode === "exploring");

    haltWorldSideEffects();
    set({
      mode: "html-only",
      activeBoardId: null,
      pendingReentry: softReentry,
      skipped: state.skipped,
    });
  },

  enterWorld: () =>
    set((state) =>
      state.webglAvailable
        ? {
            mode: "loading",
            activeBoardId: null,
            skipped: false,
            pendingReentry: false,
          }
        : state,
    ),

  markWorldReady: () =>
    set((state) =>
      state.mode === "loading" ? { mode: "exploring" } : state,
    ),

  exitToDocument: (opts) => {
    haltWorldSideEffects();
    set({
      mode: "html-only",
      activeBoardId: null,
      pendingReentry: false,
      skipped: opts?.skipped ?? get().skipped,
    });
  },

  failToDocument: () => {
    haltWorldSideEffects();
    set({
      mode: "html-only",
      activeBoardId: null,
      pendingReentry: false,
      /* Do not mark skipped — Enter remains available after a GL failure. */
    });
  },

  setRendering: (rendering) => set({ rendering }),

  setActiveBoard: (id) =>
    set((state) => {
      if (!canExplore(state.mode)) return state;
      if (state.activeBoardId === id) return state;
      return { activeBoardId: id };
    }),

  beginInteraction: (id) => {
    const state = get();
    if (!canExplore(state.mode)) return false;
    set({ mode: "interacting", activeBoardId: id });
    return true;
  },

  beginTransition: () =>
    set((state) =>
      state.mode === "interacting" ? { mode: "transitioning" } : state,
    ),

  cancelNavigation: () => {
    haltWorldSideEffects();
    set((state) =>
      state.mode === "interacting" || state.mode === "transitioning"
        ? { mode: "exploring" }
        : state,
    );
  },
}));

export function selectOverWorld(mode: ExperienceMode) {
  return isWorldMounted(mode);
}

/** True when the 3D studio is the visible surface, not the loading page. */
export function selectStudioSurface(mode: ExperienceMode) {
  return isWorldMounted(mode) && mode !== "loading";
}

/** True when the HTML homepage must be the visible surface. */
export function selectDocumentVisible(mode: ExperienceMode) {
  return !isWorldMounted(mode);
}
