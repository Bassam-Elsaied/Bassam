"use client";

import { useMemo } from "react";
import {
  CanvasTexture,
  Color,
  MeshStandardMaterial,
  SRGBColorSpace,
} from "three";

import { palette } from "@/lib/three/palette";

/**
 * Shared materials for boards and character remapping.
 * The gallery shell brings its own textured materials from the GLB.
 */
export type GalleryMaterials = ReturnType<typeof useGalleryMaterials>;

function makeStandard(
  color: string,
  roughness: number,
  metalness = 0,
  extras: ConstructorParameters<typeof MeshStandardMaterial>[0] = {},
) {
  return new MeshStandardMaterial({
    color: new Color(color),
    roughness,
    metalness,
    ...extras,
  });
}

export function useGalleryMaterials() {
  return useMemo(() => {
    const concreteLight = makeStandard(palette.concreteLight, 0.84);
    const concrete = makeStandard(palette.concrete, 0.86);
    const concreteMid = makeStandard(palette.concreteMid, 0.88);
    const concreteCool = makeStandard(palette.concreteCool, 0.9);
    const frame = makeStandard(palette.frame, 0.58, 0.18);

    const accent = makeStandard(palette.accent, 0.55, 0, {
      emissive: new Color(palette.accent),
      emissiveIntensity: 0.16,
    });

    const metal = makeStandard(palette.metal, 0.68, 0.42);

    const figureCloth = makeStandard(palette.figureCloth, 0.96);
    const figureBone = makeStandard(palette.figureBone, 0.9);
    const figureGrey = makeStandard(palette.figureGrey, 0.88);
    const figureSkin = makeStandard(palette.figureSkin, 0.82);
    const figureHair = makeStandard(palette.figureHair, 0.95);
    const figureAccent = makeStandard(palette.accent, 0.72, 0, {
      emissive: new Color(palette.accent),
      emissiveIntensity: 0.04,
    });

    return {
      concreteLight,
      concrete,
      concreteMid,
      concreteCool,
      frame,
      accent,
      metal,
      figureCloth,
      figureBone,
      figureGrey,
      figureSkin,
      figureHair,
      figureAccent,
    };
  }, []);
}

/**
 * Soft radial falloff for dust motes.
 */
export function useRadialTexture(size = 256) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, "rgba(255,232,198,1)");
    gradient.addColorStop(0.35, "rgba(255,220,175,0.55)");
    gradient.addColorStop(0.72, "rgba(255,210,155,0.18)");
    gradient.addColorStop(1, "rgba(255,200,140,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [size]);
}
