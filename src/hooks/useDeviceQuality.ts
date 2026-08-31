"use client";

import { useEffect, useState } from "react";

import { detectWebGL } from "@/lib/three/webgl";

export type Quality = "high" | "medium" | "low";

export type QualityProfile = {
  quality: Quality;
  /** Renderer DPR clamp, `[min, max]`. Never the raw devicePixelRatio. */
  dpr: [number, number];
  shadows: boolean;
  /** Shadow map edge length; 0 when shadows are off. */
  shadowMapSize: number;
  particleCount: number;
  webgl: boolean;
  reducedMotion: boolean;
  /** False during SSR and the first paint, before the client has probed. */
  ready: boolean;
};

/** Server and first-render value: assume nothing, render nothing. */
const PROBING: QualityProfile = {
  quality: "low",
  dpr: [1, 1],
  shadows: false,
  shadowMapSize: 0,
  particleCount: 0,
  webgl: false,
  reducedMotion: false,
  ready: false,
};

const PRESETS: Record<Quality, Omit<QualityProfile, "webgl" | "reducedMotion" | "ready" | "quality">> =
  {
    high: { dpr: [1, 1.75], shadows: true, shadowMapSize: 1024, particleCount: 80 },
    medium: { dpr: [1, 1.5], shadows: true, shadowMapSize: 1024, particleCount: 55 },
    low: { dpr: [1, 1], shadows: false, shadowMapSize: 0, particleCount: 24 },
  };

/**
 * Scores the device from several independent signals rather than sniffing
 * the user agent, which says nothing useful about GPU budget.
 *
 * A coarse pointer and a narrow viewport both push the score down because
 * they correlate with thermally-limited hardware, but neither decides the
 * tier alone — a high-core tablet still lands on medium.
 */
function scoreDevice(webglVersion: 0 | 1 | 2): Quality {
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const width = window.innerWidth;
  const rawDpr = window.devicePixelRatio || 1;

  let score = 0;

  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;

  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;

  if (webglVersion === 2) score += 1;

  if (coarsePointer) score -= 2;
  if (width < 768) score -= 1;
  /* Very dense screens cost fill rate before anything is even drawn. */
  if (rawDpr > 2.5) score -= 1;

  if (score >= 4) return "high";
  if (score >= 1) return "medium";
  return "low";
}

function build(quality: Quality, webgl: boolean, reducedMotion: boolean): QualityProfile {
  const preset = PRESETS[quality];
  const cap = Math.max(1, Math.min(preset.dpr[1], window.devicePixelRatio || 1));

  return {
    quality,
    dpr: [preset.dpr[0], cap],
    shadows: preset.shadows,
    shadowMapSize: preset.shadowMapSize,
    particleCount: reducedMotion
      ? Math.round(preset.particleCount * 0.5)
      : preset.particleCount,
    webgl,
    reducedMotion,
    ready: true,
  };
}

/**
 * Resolves rendering budget on the client. Returns `ready: false` until
 * then so nothing WebGL-related is rendered during SSR or hydration.
 */
export function useDeviceQuality(): QualityProfile {
  const [profile, setProfile] = useState<QualityProfile>(PROBING);

  useEffect(() => {
    const support = detectWebGL();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => {
      setProfile(
        build(
          support.supported ? scoreDevice(support.version) : "low",
          support.supported,
          motionQuery.matches,
        ),
      );
    };

    evaluate();

    /* Re-evaluate when the motion preference flips, and on resize in case
       the viewport crosses the narrow threshold (rotation, window drag).
       Both are discrete events — never a per-frame update. */
    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(evaluate, 400);
    };

    motionQuery.addEventListener("change", evaluate);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.clearTimeout(resizeTimer);
      motionQuery.removeEventListener("change", evaluate);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return profile;
}
