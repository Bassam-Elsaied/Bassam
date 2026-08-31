"use client";

import { Component, type ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { StudioLoader } from "@/components/experience/StudioLoader";

/**
 * Keeps three.js out of the initial bundle.
 *
 * The layer renders nothing until it has probed the client for WebGL, so
 * there is nothing to server-render either; loading it after hydration
 * means the editorial homepage paints without waiting on the renderer.
 *
 * Chunk load failures (stale `/_next` hashes after a dev rebuild) must not
 * blank the homepage — the HTML document underneath stays the fallback.
 */
const ExperienceLayer = dynamic(
  () =>
    import("@/components/experience/ExperienceLayer").then(
      (mod) => mod.ExperienceLayer,
    ),
  {
    ssr: false,
    loading: () => <StudioLoader visible progress={0} />,
  },
);

type BoundaryState = { failed: boolean };

class ExperienceErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function ExperienceMount() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onChunkError = (event: ErrorEvent) => {
      const message = event.message ?? "";
      if (
        message.includes("ChunkLoadError") ||
        message.includes("Loading chunk") ||
        message.includes("Failed to fetch dynamically imported module")
      ) {
        setFailed(true);
      }
    };

    window.addEventListener("error", onChunkError);
    return () => window.removeEventListener("error", onChunkError);
  }, []);

  if (failed) return null;

  return (
    <ExperienceErrorBoundary onError={() => setFailed(true)}>
      <ExperienceLayer />
    </ExperienceErrorBoundary>
  );
}
