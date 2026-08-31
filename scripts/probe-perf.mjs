/**
 * Instruments the WebGL context to count real draw calls per frame and
 * sample frame timing, at a desktop and a phone viewport.
 *
 *   node scripts/probe-perf.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { enterStudio } from "./studio.mjs";

const BASE = process.argv[2] ?? "http://localhost:3002";

/**
 * Headless Chromium rasterises through SwiftShader, so its frame times say
 * nothing about real hardware. Pass `--gpu` to run headed against the
 * actual GPU when you need representative numbers.
 */
const USE_GPU = process.argv.includes("--gpu");

const PROBE = `
  window.__probe = { frames: 0, draws: 0, times: [] };

  for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
    for (const name of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
      const original = proto[name];
      if (!original) continue;
      proto[name] = function (...args) {
        window.__probe.draws += 1;
        return original.apply(this, args);
      };
    }
  }

  let last = performance.now();
  function tick(now) {
    window.__probe.frames += 1;
    window.__probe.times.push(now - last);
    last = now;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
`;

const CASES = [
  { name: "desktop 1920x1080", viewport: { width: 1920, height: 1080 }, scale: 1, mobile: false },
  { name: "phone 390x844", viewport: { width: 390, height: 844 }, scale: 3, mobile: true },
];

const browser = await chromium.launch(
  USE_GPU
    ? {
        headless: false,
        args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"],
      }
    : {},
);

for (const testCase of CASES) {
  const context = await browser.newContext({
    viewport: testCase.viewport,
    deviceScaleFactor: testCase.scale,
    hasTouch: testCase.mobile,
    isMobile: testCase.mobile,
  });
  const page = await context.newPage();
  await page.addInitScript(PROBE);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(page);

  /* Discard warm-up, then sample a steady window. */
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.__probe.frames = 0;
    window.__probe.draws = 0;
    window.__probe.times = [];
  });
  await page.waitForTimeout(4000);

  const result = await page.evaluate(() => {
    const { frames, draws, times } = window.__probe;
    const sorted = [...times].sort((a, b) => a - b);
    const canvas = document.querySelector("canvas");
    return {
      frames,
      drawsPerFrame: +(draws / Math.max(1, frames)).toFixed(1),
      medianFrameMs: +sorted[Math.floor(sorted.length / 2)].toFixed(2),
      p95FrameMs: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
      backingPx: canvas ? canvas.width * canvas.height : 0,
      rendererDpr: canvas ? +(canvas.width / canvas.clientWidth).toFixed(2) : 0,
      rawDpr: window.devicePixelRatio,
    };
  });

  console.log(`\n--- ${testCase.name} ---`);
  console.log(JSON.stringify(result, null, 2));
  console.log(`  fps ≈ ${(1000 / result.medianFrameMs).toFixed(0)}`);

  await context.close();
}

/* Confirm the loop actually stops when the tab is hidden. */
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.addInitScript(PROBE);
await page.goto(BASE, { waitUntil: "networkidle" });
await enterStudio(page);
await page.waitForTimeout(1200);
await page.evaluate(() => {
  window.__probe.draws = 0;
  Object.defineProperty(document, "hidden", { value: true, configurable: true });
  Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
});
await page.waitForTimeout(800);
const settled = await page.evaluate(() => window.__probe.draws);
await page.waitForTimeout(3000);
const later = await page.evaluate(() => window.__probe.draws);
console.log("\n--- hidden tab ---");
console.log(`  draws in first 800ms after hiding: ${settled}`);
console.log(`  draws in the following 3000ms:     ${later - settled}`);

const gpu = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return "no context";
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
});
console.log(`\n--- renderer ---\n  ${gpu}`);
await context.close();

await browser.close();
