"use client";

import type { QualityProfile } from "@/hooks/useDeviceQuality";
import { palette, room } from "@/lib/three/palette";

/**
 * Minimum dynamic fill over the gallery's baked/emissive lighting.
 * One soft key for character readability — no heavy realtime shadow farm.
 */
export function Lighting({ quality }: { quality: QualityProfile }) {
  return (
    <>
      <hemisphereLight
        args={[palette.skyFill, palette.groundFill, 0.28]}
        position={[0, room.height, 0]}
      />

      <ambientLight color={palette.skyFill} intensity={0.18} />

      <directionalLight
        color={palette.sun}
        intensity={0.55}
        position={[5.5, 7.5, 3.5]}
        castShadow={quality.shadows}
        shadow-mapSize-width={quality.shadowMapSize || 512}
        shadow-mapSize-height={quality.shadowMapSize || 512}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
}
