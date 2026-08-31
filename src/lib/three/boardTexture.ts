"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  type Texture,
} from "three";

import type { BoardFace } from "@/lib/three/boardFaces";
import { palette } from "@/lib/three/palette";

const BASE_W = 1024;
const BASE_H = 682;

function canvasWidthFor(detail: "full" | "lite") {
  return detail === "lite" ? 512 : 768;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function paintBase(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = palette.panel;
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  /* Quiet paper grain via soft vignette — no noisy texture assets. */
  const vignette = ctx.createRadialGradient(
    BASE_W * 0.5,
    BASE_H * 0.42,
    BASE_H * 0.08,
    BASE_W * 0.5,
    BASE_H * 0.5,
    BASE_H * 0.8,
  );
  vignette.addColorStop(0, "rgba(36,31,26,0)");
  vignette.addColorStop(1, "rgba(36,31,26,0.16)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, BASE_W, BASE_H);
}

function paintEyebrow(ctx: CanvasRenderingContext2D, eyebrow: string) {
  ctx.fillStyle = palette.accent;
  ctx.fillRect(48, 44, 28, 5);

  ctx.fillStyle = "rgba(76,68,59,0.55)";
  ctx.font = "500 20px 'Geist Mono', ui-monospace, monospace";
  ctx.fillText(eyebrow.toUpperCase(), 88, 50);
}

function paintTitleBlock(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  y = 130,
) {
  ctx.fillStyle = palette.artwork;
  ctx.font = "600 96px Archivo, Arial, Helvetica, sans-serif";
  ctx.fillText(title.toUpperCase(), 48, y);

  ctx.fillStyle = "rgba(76,68,59,0.72)";
  ctx.font = "500 32px Archivo, Arial, Helvetica, sans-serif";
  ctx.fillText(subtitle.toUpperCase(), 48, y + 52);
}

function paintMeta(ctx: CanvasRenderingContext2D, meta: string) {
  ctx.fillStyle = palette.accent;
  ctx.font = "500 20px 'Geist Mono', ui-monospace, monospace";
  ctx.fillText(meta.toUpperCase(), 48, BASE_H - 44);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  /* Soft darken so typography over images stays optional. */
  ctx.fillStyle = "rgba(20,17,15,0.12)";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function makeCanvas(pixelWidth: number) {
  const scale = pixelWidth / BASE_W;
  const canvas = document.createElement("canvas");
  canvas.width = pixelWidth;
  canvas.height = Math.round(BASE_H * scale);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(scale, scale);
  }
  return { canvas, ctx };
}

function paintChrome(ctx: CanvasRenderingContext2D, face: BoardFace) {
  paintBase(ctx);
  paintEyebrow(ctx, face.eyebrow);
  paintTitleBlock(ctx, face.title, face.subtitle);
  paintMeta(ctx, face.meta);
}

async function paintFace(
  face: BoardFace,
  pixelWidth: number,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makeCanvas(pixelWidth);
  if (!ctx) return canvas;

  paintBase(ctx);
  paintEyebrow(ctx, face.eyebrow);

  if (face.kind === "project-editorial") {
    paintTitleBlock(ctx, face.title, face.subtitle, 128);

    /* Large typographic project names — the artwork when screenshots are absent. */
    face.headlines.slice(0, 3).forEach((item, i) => {
      const y = 250 + i * 92;
      ctx.fillStyle = palette.artwork;
      ctx.font = "600 42px Archivo, system-ui, sans-serif";
      ctx.fillText(item.name.toUpperCase(), 48, y);

      ctx.fillStyle = "rgba(76,68,59,0.62)";
      ctx.font = "500 22px Archivo, system-ui, sans-serif";
      ctx.fillText(item.category.toUpperCase(), 48, y + 32);

      ctx.fillStyle = "rgba(138,131,120,0.9)";
      ctx.font = "500 18px 'Geist Mono', ui-monospace, monospace";
      ctx.fillText(item.tech.toUpperCase(), 48, y + 58);
    });

    const images = (
      await Promise.all(face.images.map((src) => loadImage(src)))
    ).filter((img): img is HTMLImageElement => !!img);

    if (images.length > 0) {
      const stripY = BASE_H - 168;
      const gap = 12;
      const cellW = (BASE_W - 96 - gap * (Math.min(3, images.length) - 1)) / Math.min(3, images.length);
      images.slice(0, 3).forEach((img, i) => {
        drawCover(ctx, img, 48 + i * (cellW + gap), stripY, cellW, 100);
      });
    }
  } else if (face.kind === "portrait") {
    paintTitleBlock(ctx, face.title, face.subtitle, 128);

    const img = await loadImage(face.image);
    if (img) {
      const frameW = BASE_W * 0.4;
      const frameH = BASE_H * 0.56;
      const fx = BASE_W - frameW - 52;
      const fy = 200;
      ctx.fillStyle = palette.frame;
      ctx.fillRect(fx - 12, fy - 12, frameW + 24, frameH + 24);
      drawCover(ctx, img, fx, fy, frameW, frameH);
    }

    face.lines.forEach((line, i) => {
      ctx.fillStyle = palette.artwork;
      ctx.font = "500 28px Archivo, system-ui, sans-serif";
      ctx.fillText(line, 48, 280 + i * 52);
    });
  } else if (face.kind === "typography") {
    paintTitleBlock(ctx, face.title, face.subtitle, 120);

    face.lines.forEach((line, i) => {
      const y = 250 + i * 78;
      ctx.fillStyle = palette.accent;
      ctx.font = "500 18px 'Geist Mono', ui-monospace, monospace";
      ctx.fillText(String(i + 1).padStart(2, "0"), 48, y);

      ctx.fillStyle = palette.artwork;
      ctx.font = "600 40px Archivo, system-ui, sans-serif";
      ctx.fillText(line.toUpperCase(), 100, y);
    });
  } else {
    /* statement / contact */
    paintTitleBlock(ctx, face.title, face.subtitle, 120);

    ctx.fillStyle = palette.artwork;
    ctx.font = "600 48px Archivo, system-ui, sans-serif";
    const words = face.statement.split(" ");
    let line = "";
    let ly = 280;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > BASE_W - 96) {
        ctx.fillText(line, 48, ly);
        line = word;
        ly += 58;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 48, ly);

    face.lines.forEach((entry, i) => {
      ctx.fillStyle = i === 0 ? palette.accent : "rgba(76,68,59,0.75)";
      ctx.font =
        i === 0
          ? "500 26px 'Geist Mono', ui-monospace, monospace"
          : "500 24px Archivo, system-ui, sans-serif";
      ctx.fillText(entry, 48, BASE_H - 140 + i * 40);
    });
  }

  paintMeta(ctx, face.meta);
  return canvas;
}

function toTexture(canvas: HTMLCanvasElement): Texture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Builds a board-face texture on the client. Returns null until paint
 * completes so the panel can fall back to solid paper.
 *
 * `lite` paints at half resolution — enough for a wall-sized board on
 * phones, and it keeps the intro from decoding four 1024 canvases.
 */
export function useBoardFaceTexture(
  face: BoardFace,
  detail: "full" | "lite" = "full",
): Texture | null {
  const key = useMemo(() => JSON.stringify(face), [face]);
  const pixelWidth = canvasWidthFor(detail);
  const [texture, setTexture] = useState<Texture | null>(() => {
    if (typeof document === "undefined") return null;
    /* Synchronous chrome so boards never sit as blank paper while images load. */
    try {
      const { canvas, ctx } = makeCanvas(pixelWidth);
      if (!ctx) return null;
      paintChrome(ctx, face);
      return toTexture(canvas);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let cancelled = false;
    let built: Texture | null = null;

    paintFace(face, pixelWidth).then((canvas) => {
      if (cancelled) return;
      built = toTexture(canvas);
      setTexture((previous) => {
        previous?.dispose();
        return built;
      });
    });

    return () => {
      cancelled = true;
      built?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pixelWidth]);

  return texture;
}
