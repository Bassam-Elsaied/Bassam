"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Color,
  DoubleSide,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from "three";

import type { QualityProfile } from "@/hooks/useDeviceQuality";

const GALLERY_URL = "/models/environment/gallery.glb";

type EnvironmentProps = {
  quality: QualityProfile;
};

/**
 * Ready-made gallery shell. Loads the CC-BY Sketchfab environment and
 * preserves its baked/emissive lighting and PBR maps. No procedural walls.
 */
export function Environment({ quality }: EnvironmentProps) {
  const { scene } = useGLTF(GALLERY_URL);
  const root = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const low = quality.quality === "low";
    root.traverse((object: Object3D) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = false;
      mesh.receiveShadow = !low;
      mesh.raycast = () => null;

      const materials = (
        Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      ) as MeshStandardMaterial[];

      for (const material of materials) {
        if (!material) continue;

        /* Sketchfab bake lives on emissive — keep it dominant. */
        if (material.emissiveMap) {
          material.emissive = new Color(0xffffff);
          material.emissiveIntensity = low ? 0.85 : 1.05;
        }

        if (material.map) material.map.anisotropy = low ? 1 : 4;
        if (material.normalMap) material.normalMap.anisotropy = low ? 1 : 4;

        material.side = DoubleSide;
        material.needsUpdate = true;
      }
    });
  }, [root, quality.quality]);

  return <primitive object={root} />;
}

useGLTF.preload(GALLERY_URL);
