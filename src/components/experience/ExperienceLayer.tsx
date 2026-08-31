"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, useProgress } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { useRouter } from "next/navigation";

import { World } from "@/components/3d/World";
import {
  EnterStudioControl,
  SkipExplorationControl,
} from "@/components/experience/ExperienceControls";
import { ExplorationHints } from "@/components/experience/ExplorationHints";
import { InteractionPrompt } from "@/components/experience/InteractionPrompt";
import { StudioCursor } from "@/components/experience/StudioCursor";
import { StudioLoader } from "@/components/experience/StudioLoader";
import {
  TransitionOverlay,
  type TransitionOverlayHandle,
} from "@/components/experience/TransitionOverlay";
import { VirtualJoystick } from "@/components/experience/VirtualJoystick";
import { useDeviceQuality } from "@/hooks/useDeviceQuality";
import type { BoardId } from "@/data/boards";
import { lockBodyScroll } from "@/lib/scrollLock";
import { cameraRig, resetCameraRig } from "@/lib/three/cameraRig";
import { clearMovementInput } from "@/lib/three/movementInput";
import { movementGate } from "@/lib/three/movementGate";
import { navigateToBoard } from "@/lib/three/navigateToBoard";
import { setTransitionOverlayPlayer } from "@/lib/three/transitionBridge";
import {
  selectDocumentVisible,
  selectOverWorld,
  useExperienceStore,
} from "@/store/experience";

/**
 * Owns the WebGL layer's entire lifecycle and the route wipe.
 *
 * Mount always boots a valid homepage session — probing → loading →
 * exploring — with no intro gate. Unmount always tears down side effects.
 * The HTML document under this layer is never left inert or scroll-locked
 * unless the studio canvas is actually mounted.
 */
export function ExperienceLayer() {
  const quality = useDeviceQuality();
  const router = useRouter();
  const overlayRef = useRef<TransitionOverlayHandle>(null);

  const mode = useExperienceStore((state) => state.mode);
  const rendering = useExperienceStore((state) => state.rendering);
  const webglAvailable = useExperienceStore((state) => state.webglAvailable);
  const activeBoardId = useExperienceStore((state) => state.activeBoardId);
  const bootHome = useExperienceStore((state) => state.bootHome);
  const teardownHome = useExperienceStore((state) => state.teardownHome);
  const enterWorld = useExperienceStore((state) => state.enterWorld);
  const markWorldReady = useExperienceStore((state) => state.markWorldReady);
  const exitToDocument = useExperienceStore((state) => state.exitToDocument);
  const failToDocument = useExperienceStore((state) => state.failToDocument);
  const cancelNavigation = useExperienceStore(
    (state) => state.cancelNavigation,
  );
  const setRendering = useExperienceStore((state) => state.setRendering);

  const skipped = useExperienceStore((state) => state.skipped);

  const worldMounted = selectOverWorld(mode);
  const documentVisible = selectDocumentVisible(mode);
  const exploring = mode === "exploring";

  const { active: assetsLoading, loaded, total, progress } = useProgress();
  const [canvasReady, setCanvasReady] = useState(false);
  const markedReady = useRef(false);

  const [dpr, setDpr] = useState({
    tier: quality.dpr[1],
    ceiling: quality.dpr[1],
  });
  const [coarsePointer, setCoarsePointer] = useState(false);

  if (dpr.tier !== quality.dpr[1]) {
    setDpr({ tier: quality.dpr[1], ceiling: quality.dpr[1] });
  }

  /* Boot whenever this layer is the active homepage surface. `mode` /
     `skipped` are deps so a cached App Router restore cannot leave a
     stale html-only session on `/` — bootHome is idempotent for an
     already-mounted world and for an explicit skip. */
  useLayoutEffect(() => {
    if (!quality.ready) return;
    bootHome(quality.webgl);
  }, [quality.ready, quality.webgl, bootHome, mode, skipped]);

  /* Leaving `/` — always tear down. Soft-reentry is recorded inside. */
  useEffect(() => {
    return () => {
      teardownHome();
    };
  }, [teardownHome]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const sync = () => setRendering(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [setRendering]);

  /* Keep the document at the top while the studio is the surface. */
  useLayoutEffect(() => {
    if (!worldMounted) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [worldMounted]);

  /* Scroll lock + inert only while the canvas layer is actually up.
     Invariant: if the studio is not mounted, the HTML homepage is live. */
  useEffect(() => {
    if (!worldMounted || documentVisible) {
      movementGate.unlock();
      clearMovementInput();
      return;
    }

    const release = lockBodyScroll();
    const covered = document.querySelectorAll("main#content, body > footer");
    covered.forEach((element) => element.setAttribute("inert", ""));

    return () => {
      release();
      covered.forEach((element) => element.removeAttribute("inert"));
      movementGate.unlock();
      clearMovementInput();
    };
  }, [worldMounted, documentVisible]);

  const playOverlay = useCallback(async (boardId: string) => {
    await overlayRef.current?.play(boardId as BoardId);
  }, []);

  useEffect(() => {
    setTransitionOverlayPlayer(playOverlay);
    return () => setTransitionOverlayPlayer(async () => {});
  }, [playOverlay]);

  const onEnter = () => {
    resetCameraRig();
    movementGate.unlock();
    clearMovementInput();
    window.scrollTo({ top: 0, behavior: "auto" });
    enterWorld();
  };

  const onSkip = () => {
    cancelNavigation();
    exitToDocument({ skipped: true });
  };

  const activateBoard = useCallback(() => {
    if (!activeBoardId || mode !== "exploring") return;
    void navigateToBoard(activeBoardId, router, { playOverlay });
  }, [activeBoardId, mode, router, playOverlay]);

  useEffect(() => {
    if (!exploring) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const el = document.activeElement;
      if (
        el instanceof HTMLElement &&
        (el.isContentEditable ||
          el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.closest('[role="dialog"]'))
      ) {
        return;
      }

      if (!activeBoardId) return;
      event.preventDefault();
      activateBoard();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exploring, activeBoardId, activateBoard]);

  useEffect(() => {
    if (mode === "loading") {
      markedReady.current = false;
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "loading" || markedReady.current || !canvasReady) return;

    const idle = !assetsLoading && (total === 0 || loaded >= total);
    if (!idle) return;

    const id = window.setTimeout(() => {
      if (markedReady.current) return;
      markedReady.current = true;
      markWorldReady();
    }, 450);

    return () => window.clearTimeout(id);
  }, [
    mode,
    canvasReady,
    assetsLoading,
    loaded,
    total,
    markWorldReady,
  ]);

  useEffect(() => {
    if (mode !== "loading") return;

    const id = window.setTimeout(() => {
      if (markedReady.current) return;
      markedReady.current = true;
      markWorldReady();
    }, 15000);

    return () => window.clearTimeout(id);
  }, [mode, markWorldReady]);

  const showLoader =
    !skipped &&
    (!quality.ready || mode === "probing" || mode === "loading");

  /* Capability still resolving — keep the studio covered so the HTML
     homepage does not flash underneath. */
  if (!quality.ready) {
    if (skipped) return null;
    return <StudioLoader visible progress={progress} />;
  }

  return (
    <>
      <StudioLoader visible={showLoader} progress={progress} />
      <TransitionOverlay ref={overlayRef} />
      <StudioCursor />

      {mode === "html-only" && webglAvailable ? (
        <EnterStudioControl onEnter={onEnter} />
      ) : null}

      {worldMounted ? (
        <>
          <div
            className="fixed inset-0 z-30 touch-none overscroll-none"
            aria-hidden="true"
          >
            <Canvas
              frameloop={rendering ? "always" : "never"}
              dpr={[quality.dpr[0], dpr.ceiling]}
              shadows={quality.shadows ? "percentage" : false}
              gl={{
                alpha: false,
                antialias: quality.quality !== "low",
                powerPreference: "high-performance",
              }}
              camera={{
                fov: cameraRig.fov,
                near: 0.1,
                far: 140,
                position: [
                  cameraRig.target.x + cameraRig.offset.x,
                  cameraRig.target.y + cameraRig.offset.y,
                  cameraRig.target.z + cameraRig.offset.z,
                ],
              }}
              onCreated={({ gl }) => {
                try {
                  gl.toneMapping = ACESFilmicToneMapping;
                  gl.toneMappingExposure = 1.0;
                  gl.domElement.addEventListener(
                    "webglcontextlost",
                    (event) => {
                      event.preventDefault();
                      failToDocument();
                    },
                    { once: true },
                  );
                  setCanvasReady(true);
                } catch {
                  failToDocument();
                }
              }}
            >
              <PerformanceMonitor
                onDecline={() =>
                  setDpr((current) => ({
                    ...current,
                    ceiling: Math.max(1, current.ceiling - 0.25),
                  }))
                }
                flipflops={3}
                onFallback={() =>
                  setDpr((current) => ({ ...current, ceiling: 1 }))
                }
              />

              <Suspense fallback={null}>
                <World quality={quality} />
              </Suspense>
            </Canvas>
          </div>

          {mode === "loading" || exploring ? (
            <SkipExplorationControl onSkip={onSkip} />
          ) : null}

          {exploring ? (
            <>
              <ExplorationHints coarsePointer={coarsePointer} />
              <InteractionPrompt onEnter={activateBoard} />
              {coarsePointer ? (
                <div className="pointer-events-none fixed bottom-0 left-0 z-40 max-w-[min(100%,12rem)] px-[max(0.75rem,env(safe-area-inset-left))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <VirtualJoystick />
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}
