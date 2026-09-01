"use client";

import { useEffect, useState } from "react";
import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  type Texture,
} from "three";

import { wallNote } from "@/data/wallNote";
import { palette } from "@/lib/three/palette";

const BASE_W = 1536;
const BASE_H = 768;

function canvasWidthFor(detail: "full" | "lite") {
  return detail === "lite" ? 768 : 1280;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function paintGlyph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
) {
  ctx.save();
  ctx.shadowColor = fill;
  ctx.shadowBlur = 32;
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 14;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff8ee";
  ctx.globalAlpha = 0.55;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function paintInscription(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, BASE_W, BASE_H);

  ctx.font = "500 20px 'Geist Mono', ui-monospace, monospace";
  paintGlyph(ctx, wallNote.eyebrow.toUpperCase(), 48, 80, palette.accent);

  ctx.font = "500 88px Archivo, Arial, Helvetica, sans-serif";
  paintGlyph(
    ctx,
    wallNote.lines[0].toUpperCase(),
    48,
    210,
    "rgba(237,232,224,0.92)",
  );
  paintGlyph(ctx, wallNote.lines[1].toUpperCase(), 48, 308, palette.accent);

  ctx.font = "500 32px Archivo, Arial, Helvetica, sans-serif";
  const body = wrapLines(ctx, wallNote.body, BASE_W - 120);
  body.forEach((line, i) => {
    paintGlyph(
      ctx,
      line,
      48,
      410 + i * 44,
      "rgba(255,246,232,0.92)",
    );
  });

  ctx.font = "500 24px Archivo, Arial, Helvetica, sans-serif";
  paintGlyph(
    ctx,
    wallNote.sign.toUpperCase(),
    48,
    BASE_H - 64,
    "rgba(255,246,232,0.95)",
  );
  ctx.font = "500 18px 'Geist Mono', ui-monospace, monospace";
  paintGlyph(
    ctx,
    wallNote.role.toUpperCase(),
    48,
    BASE_H - 32,
    "rgba(255,246,232,0.72)",
  );
}

function toTexture(canvas: HTMLCanvasElement): Texture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  texture.premultiplyAlpha = true;
  texture.needsUpdate = true;
  return texture;
}

export function useWallInscriptionTexture(detail: "full" | "lite" = "full") {
  const pixelWidth = canvasWidthFor(detail);
  const [texture, setTexture] = useState<Texture | null>(() => {
    if (typeof document === "undefined") return null;
    try {
      const scale = pixelWidth / BASE_W;
      const canvas = document.createElement("canvas");
      canvas.width = pixelWidth;
      canvas.height = Math.round(BASE_H * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.scale(scale, scale);
      paintInscription(ctx);
      return toTexture(canvas);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let cancelled = false;
    let built: Texture | null = null;

    const paint = () => {
      const scale = pixelWidth / BASE_W;
      const canvas = document.createElement("canvas");
      canvas.width = pixelWidth;
      canvas.height = Math.round(BASE_H * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(scale, scale);
      paintInscription(ctx);
      if (cancelled) return;
      built = toTexture(canvas);
      setTexture((previous) => {
        previous?.dispose();
        return built;
      });
    };

    paint();
    const fonts = document.fonts?.ready;
    fonts?.then(() => {
      if (!cancelled) paint();
    });

    return () => {
      cancelled = true;
      built?.dispose();
    };
  }, [pixelWidth]);

  return texture;
}
