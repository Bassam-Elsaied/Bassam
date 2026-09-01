"use client";

import { AdditiveBlending, FrontSide } from "three";

import { wallNote } from "@/data/wallNote";
import type { QualityProfile } from "@/hooks/useDeviceQuality";
import { palette } from "@/lib/three/palette";
import { useWallInscriptionTexture } from "@/lib/three/wallNoteTexture";

/**
 * Paint on the east wall — a decal, not a panel. Polygon-offset so it
 * sits on the gallery mesh without z-fighting. Unlit + additive so the
 * type holds its own light.
 */
export function WallNote({ quality }: { quality: QualityProfile }) {
  const texture = useWallInscriptionTexture(
    quality.quality === "low" ? "lite" : "full",
  );
  const [width, height] = wallNote.size;
  const [x, y, z] = wallNote.position;

  return (
    <mesh
      position={[x, y, z]}
      rotation-y={wallNote.rotationY}
      name="wall-inscription"
      raycast={() => null}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        color={texture ? "#ffffff" : palette.figureBone}
        transparent
        opacity={1}
        depthWrite={false}
        side={FrontSide}
        toneMapped={false}
        blending={AdditiveBlending}
        premultipliedAlpha
        polygonOffset
        polygonOffsetFactor={-4}
        polygonOffsetUnits={-4}
      />
    </mesh>
  );
}
