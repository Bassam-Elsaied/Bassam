"use client";

import { Boards } from "@/components/3d/Boards";
import { CameraController } from "@/components/3d/CameraController";
import { Character } from "@/components/3d/Character";
import { CollisionDebug } from "@/components/3d/CollisionDebug";
import { Environment } from "@/components/3d/Environment";
import { Lighting } from "@/components/3d/Lighting";
import { Particles } from "@/components/3d/Particles";
import type { QualityProfile } from "@/hooks/useDeviceQuality";
import { useGalleryMaterials } from "@/lib/three/materials";
import { palette } from "@/lib/three/palette";

/**
 * Scene root. Composition only — every subsystem owns its own behaviour:
 *
 *   World
 *   ├── CameraController
 *   ├── Lighting
 *   ├── Environment
 *   ├── Boards
 *   ├── Character
 *   └── Particles
 *
 * Materials are built once here and handed down so all boards and
 * every wall share the same instances.
 */
export function World({ quality }: { quality: QualityProfile }) {
  const materials = useGalleryMaterials();

  return (
    <>
      <color attach="background" args={[palette.atmosphere]} />
      <fog attach="fog" args={[palette.atmosphere, 14, 38]} />

      <CameraController reducedMotion={quality.reducedMotion} />
      <Lighting quality={quality} />
      <Environment quality={quality} />
      <Boards materials={materials} quality={quality} />
      <Character materials={materials} quality={quality} />
      <Particles quality={quality} />
      <CollisionDebug />
    </>
  );
}
