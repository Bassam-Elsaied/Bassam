/**
 * M2 verification: mounts the studio in a real browser and reports on
 * console health, canvas presence, the document underneath, the WebGL
 * fallback path and every required viewport.
 *
 *   node scripts/verify-world.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { enterStudio } from "./studio.mjs";

const BASE = process.argv[2] ?? "http://localhost:3002";
const OUT = ".verify/m2";

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1280x720", width: 1280, height: 720 },
  { name: "1024x1366", width: 1024, height: 1366 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "430x932", width: 430, height: 932 },
  { name: "390x844", width: 390, height: 844 },
  { name: "375x812", width: 375, height: 812 },
];

/** Makes getContext("webgl"/"webgl2") return null, as a blocked GPU does. */
const DISABLE_WEBGL = `
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (typeof type === "string" && type.toLowerCase().includes("webgl")) return null;
    return original.call(this, type, ...rest);
  };
`;

/**
 * Noise we cannot fix from application code:
 *  - three's Clock deprecation is emitted by @react-three/fiber internals
 *  - GL driver perf messages come from Playwright's own screenshot readback
 */
const IGNORED_WARNINGS = [/THREE\.Clock: This module has been deprecated/, /GL Driver Message/];

function attachWatchers(page, sink) {
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") sink.console.push(`[error] ${text}`);
    else if (msg.type() === "warning" && !IGNORED_WARNINGS.some((r) => r.test(text))) {
      sink.warnings.push(`[warning] ${text}`);
    }
  });
  page.on("pageerror", (err) => sink.console.push(`[pageerror] ${err.message}`));
  page.on("requestfailed", (req) =>
    sink.requests.push(`${req.url()} — ${req.failure()?.errorText}`),
  );
  page.on("response", (res) => {
    if (res.status() >= 400) sink.requests.push(`${res.status()} ${res.url()}`);
  });
}

async function readRendererStats(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const gl =
      canvas.getContext("webgl2", { preserveDrawingBuffer: false }) ??
      canvas.getContext("webgl");
    return {
      backingWidth: canvas.width,
      backingHeight: canvas.height,
      cssWidth: canvas.clientWidth,
      cssHeight: canvas.clientHeight,
      contextLost: gl ? gl.isContextLost() : null,
    };
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const results = [];
  let failures = 0;

  /* ------------------------------------------------ per-viewport pass */
  for (const viewport of VIEWPORTS) {
    const sink = { console: [], warnings: [], requests: [] };
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.width < 500 ? 3 : 1,
      hasTouch: viewport.width < 500,
      isMobile: viewport.width < 500,
    });
    const page = await context.newPage();
    attachWatchers(page, sink);

    await page.goto(BASE, { waitUntil: "networkidle" });
    await enterStudio(page);

    const canvas = page.locator("canvas").first();
    const canvasMounted = (await canvas.count()) > 0;

    /* Give the render loop a couple of seconds of real frames so damping,
       drift and dust are all visible in the capture. */
    await page.waitForTimeout(2200);

    const stats = canvasMounted ? await readRendererStats(page) : null;
    const dpr = stats
      ? +(stats.backingWidth / Math.max(1, stats.cssWidth)).toFixed(2)
      : null;

    await page.screenshot({ path: `${OUT}/world-${viewport.name}.png` });

    /* The document must survive underneath the world. */
    const documentIntact = await page.evaluate(() => {
      const main = document.querySelector("main#content[data-home-document]");
      return {
        hasMain: !!main,
        headings: document.querySelectorAll("h1").length,
        canvasHidden:
          document.querySelector("canvas")?.closest("[aria-hidden='true']") !==
          null,
      };
    });

    /* Hand off to the document and confirm the canvas is really gone. */
    const skip = page.getByRole("button", { name: /skip exploration/i });
    let unmounted = null;
    if (await skip.count()) {
      await skip.click();
      await page.waitForTimeout(500);
      unmounted = (await page.locator("canvas").count()) === 0;
      await page.screenshot({ path: `${OUT}/document-${viewport.name}.png` });
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );

    const ok =
      canvasMounted &&
      documentIntact.hasMain &&
      documentIntact.canvasHidden &&
      unmounted === true &&
      overflow <= 1 &&
      sink.console.length === 0 &&
      sink.requests.length === 0;

    if (!ok) failures += 1;

    results.push({
      viewport: viewport.name,
      canvas: canvasMounted,
      dpr,
      contextLost: stats?.contextLost,
      mainPresent: documentIntact.hasMain,
      h1Count: documentIntact.headings,
      canvasAriaHidden: documentIntact.canvasHidden,
      unmountedOnSkip: unmounted,
      overflowPx: overflow,
      console: sink.console,
      warnings: sink.warnings,
      failedRequests: sink.requests,
      ok,
    });

    await context.close();
  }

  /* ------------------------------------------------- WebGL fallback */
  const fallbackSink = { console: [], warnings: [], requests: [] };
  const fallbackContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const fallbackPage = await fallbackContext.newPage();
  await fallbackPage.addInitScript(DISABLE_WEBGL);
  attachWatchers(fallbackPage, fallbackSink);
  await fallbackPage.goto(BASE, { waitUntil: "networkidle" });
  await fallbackPage.waitForTimeout(1500);

  const fallback = await fallbackPage.evaluate(() => ({
    canvases: document.querySelectorAll("canvas").length,
    hasMain: !!document.querySelector("main#content"),
    heroVisible: !!document.querySelector("h1"),
    bodyOverflow: getComputedStyle(document.body).overflow,
    enterButton: !!Array.from(document.querySelectorAll("button")).find((b) =>
      /enter the studio/i.test(b.textContent ?? ""),
    ),
    scrollable: document.documentElement.scrollHeight > window.innerHeight,
  }));
  await fallbackPage.screenshot({
    path: `${OUT}/fallback-no-webgl.png`,
    fullPage: false,
  });

  const fallbackOk =
    fallback.canvases === 0 &&
    fallback.hasMain &&
    fallback.heroVisible &&
    fallback.bodyOverflow !== "hidden" &&
    fallback.enterButton === false &&
    fallback.scrollable &&
    fallbackSink.console.length === 0;

  if (!fallbackOk) failures += 1;
  await fallbackContext.close();

  /* ------------------------------------------------ explicit dismissal */
  /* Keyboard use must leave the world alone; only the control ends it.
     `verify-persistence.mjs` covers the full input matrix — this is the
     round-trip smoke test. */
  const keyContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const keyPage = await keyContext.newPage();
  await keyPage.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(keyPage);

  for (let i = 0; i < 4; i += 1) await keyPage.keyboard.press("Tab");
  await keyPage.waitForTimeout(400);

  const roundTrip = {
    survivesTabbing: (await keyPage.locator("canvas").count()) === 1,
    dismissedByControl: false,
    bodyScrollRestored: false,
    reEnter: false,
  };

  await keyPage.getByRole("button", { name: /skip exploration/i }).click();
  await keyPage.waitForTimeout(500);
  roundTrip.dismissedByControl =
    (await keyPage.locator("canvas").count()) === 0;
  roundTrip.bodyScrollRestored = await keyPage.evaluate(
    () => getComputedStyle(document.body).overflow !== "hidden",
  );

  const enter = keyPage.getByRole("button", { name: /enter the studio/i });
  if (await enter.count()) {
    await enter.click();
    await keyPage.waitForTimeout(600);
    roundTrip.reEnter = (await keyPage.locator("canvas").count()) > 0;
    await keyPage.screenshot({ path: `${OUT}/re-entered.png` });
  }

  const keyOk = Object.values(roundTrip).every(Boolean);
  if (!keyOk) failures += 1;
  await keyContext.close();

  await browser.close();

  console.log("\n=== VIEWPORTS ===");
  console.table(
    results.map((r) => ({
      viewport: r.viewport,
      canvas: r.canvas,
      dpr: r.dpr,
      ariaHidden: r.canvasAriaHidden,
      main: r.mainPresent,
      h1: r.h1Count,
      skipUnmounts: r.unmountedOnSkip,
      overflow: r.overflowPx,
      ok: r.ok,
    })),
  );

  for (const r of results) {
    if (r.console.length || r.warnings.length || r.failedRequests.length) {
      console.log(`\n--- ${r.viewport} issues ---`);
      r.console.forEach((c) => console.log("  console:", c));
      r.warnings.forEach((c) => console.log("  warn:", c));
      r.failedRequests.forEach((c) => console.log("  request:", c));
    }
  }

  console.log("\n=== WEBGL FALLBACK ===");
  console.log(JSON.stringify(fallback, null, 2), "\nok:", fallbackOk);
  fallbackSink.console.forEach((c) => console.log("  console:", c));

  console.log("\n=== EXPLICIT DISMISSAL / RE-ENTRY ===");
  console.log(JSON.stringify(roundTrip, null, 2), "\nok:", keyOk);

  console.log(`\n${failures === 0 ? "PASS" : `FAIL (${failures})`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
