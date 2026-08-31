/**
 * Asserts that the studio is dismissed only by an explicit decision.
 *
 * Every input class that a visitor might produce incidentally — pointer
 * movement, clicks, wheel, keys, taps, swipes — must leave the Canvas
 * mounted. Only the exploration control, and the accessibility guard for
 * focus entering the document, may take it down.
 *
 *   node scripts/verify-persistence.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { enterStudio } from "./studio.mjs";

const BASE = process.argv[2] ?? "http://localhost:3002";

const checks = [];

function record(name, passed, detail = "") {
  checks.push({ check: name, passed, detail });
  console.log(`${passed ? "ok  " : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const canvasCount = (page) => page.locator("canvas").count();

async function main() {
  const browser = await chromium.launch();

  /* ------------------------------------------------------ desktop input */
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desktop.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(page);
  record("canvas mounts after enter", (await canvasCount(page)) === 1);

  /* Pointer movement across the whole viewport. */
  for (const [x, y] of [
    [200, 200],
    [700, 450],
    [1200, 700],
    [400, 820],
  ]) {
    await page.mouse.move(x, y, { steps: 8 });
  }
  await page.waitForTimeout(300);
  record("survives pointer movement", (await canvasCount(page)) === 1);

  /* Plain clicks on empty floor — deliberately away from board hit targets
     so this suite tests incidental input, not board navigation. */
  /* Plain clicks on open floor ahead in the hall — away from Contact behind
     the camera and away from board faces. */
  for (const [x, y] of [
    [400, 500],
    [900, 500],
    [300, 550],
  ]) {
    await page.mouse.click(x, y);
  }
  await page.waitForTimeout(300);
  record("survives clicks", (await canvasCount(page)) === 1);

  /* Wheel, in both directions and with a trackpad-sized nudge. */
  await page.mouse.wheel(0, 12);
  await page.mouse.wheel(0, 900);
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(400);
  const scrollY = await page.evaluate(() => window.scrollY);
  record("survives wheel", (await canvasCount(page)) === 1);
  record("document stays locked under the world", scrollY === 0, `scrollY=${scrollY}`);

  /* Ensure no button retains focus before scroll-key probes (Space would
     activate a focused Skip control). */
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    document.body.focus();
  });

  /* Keys that used to be treated as an exit. */
  for (const key of ["ArrowDown", "PageDown", "End", " ", "ArrowUp", "Home"]) {
    await page.keyboard.press(key);
  }
  await page.waitForTimeout(300);
  record("survives scroll keys", (await canvasCount(page)) === 1);

  /* From M3 these belong to the character controller, so they must reach it
     and leave the world standing. */
  for (const key of ["w", "a", "s", "d", "Shift"]) {
    await page.keyboard.down(key);
    await page.waitForTimeout(120);
    await page.keyboard.up(key);
  }
  await page.waitForTimeout(400);
  record("survives movement keys", (await canvasCount(page)) === 1);
  record(
    "movement keys do not scroll",
    (await page.evaluate(() => window.scrollY)) === 0,
  );

  /* Tab right round the page. Nothing inside the covered document may be
     reachable, and none of it may dismiss the world. */
  await page.evaluate(() => document.body.focus());
  const tabOrder = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press("Tab");
    tabOrder.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return "none";
        const label = (el.textContent ?? "").trim().slice(0, 22);
        const covered = el.closest("main#content, body > footer");
        return `${el.tagName.toLowerCase()}:${label}${covered ? " [COVERED]" : ""}`;
      }),
    );
  }
  record(
    "exploration control reachable by keyboard",
    tabOrder.some((entry) => /skip exploration/i.test(entry)),
    tabOrder.join(" → "),
  );
  record(
    "covered content is not tabbable",
    !tabOrder.some((entry) => entry.includes("[COVERED]")),
  );
  record("survives tabbing", (await canvasCount(page)) === 1);
  record(
    "covered content is inert",
    await page.evaluate(() =>
      [...document.querySelectorAll("main#content, body > footer")].every((el) =>
        el.hasAttribute("inert"),
      ),
    ),
  );

  /* Explicit dismissal. */
  await page.getByRole("button", { name: /skip exploration/i }).click();
  await page.waitForTimeout(500);
  record("explicit control dismisses", (await canvasCount(page)) === 0);
  record(
    "document scroll restored",
    await page.evaluate(() => getComputedStyle(document.body).overflow !== "hidden"),
  );
  record(
    "document content intact and interactive again",
    await page.evaluate(() => {
      const main = document.querySelector("main#content[data-home-document]");
      const footer = document.querySelector("body > footer");
      return (
        !!main &&
        !main.hasAttribute("inert") &&
        !footer?.hasAttribute("inert") &&
        !!document.querySelector("h1") &&
        main.scrollHeight > 1000
      );
    }),
  );

  /* And re-entry. */
  await page.getByRole("button", { name: /enter the studio/i }).click();
  await page.waitForTimeout(700);
  record("re-entry remounts the canvas", (await canvasCount(page)) === 1);

  record("no console errors", consoleErrors.length === 0, consoleErrors.join(" ; "));
  await desktop.close();

  /* --------------------------------------------------------- skip link */
  const a11yContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const a11yPage = await a11yContext.newPage();
  await a11yPage.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(a11yPage);
  /* It is screen-reader-only until focused, so drive it by keyboard — which
     is the only way anyone reaches it anyway. */
  await a11yPage.getByRole("link", { name: /skip to content/i }).focus();
  await a11yPage.keyboard.press("Enter");
  await a11yPage.waitForTimeout(600);
  record(
    "skip link ends exploration and reveals the document",
    (await canvasCount(a11yPage)) === 0 &&
      (await a11yPage.evaluate(
        () => !document.querySelector("main#content")?.hasAttribute("inert"),
      )),
  );
  await a11yContext.close();

  /* --------------------------------------------------------- touch input */
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(mobilePage);
  record("canvas mounts on mobile", (await canvasCount(mobilePage)) === 1);

  await mobilePage.touchscreen.tap(195, 420);
  await mobilePage.touchscreen.tap(120, 600);
  await mobilePage.waitForTimeout(300);
  record("survives mobile tap", (await canvasCount(mobilePage)) === 1);

  /* A drag, which is what a tap becomes the moment a thumb slides. */
  const cdp = await mobile.newCDPSession(mobilePage);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: 600 }],
  });
  for (const y of [560, 500, 430, 360]) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 195, y }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await mobilePage.waitForTimeout(400);
  record("survives swipe", (await canvasCount(mobilePage)) === 1);

  await mobilePage.getByRole("button", { name: /skip exploration/i }).click();
  await mobilePage.waitForTimeout(500);
  record("mobile control dismisses", (await canvasCount(mobilePage)) === 0);
  await mobile.close();

  /* --------------------------------------------------------- no-WebGL */
  const noGl = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const noGlPage = await noGl.newPage();
  await noGlPage.addInitScript(`
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (typeof type === "string" && type.toLowerCase().includes("webgl")) return null;
      return original.call(this, type, ...rest);
    };
  `);
  await noGlPage.goto(BASE, { waitUntil: "networkidle" });
  await noGlPage.waitForTimeout(1200);
  await noGlPage.mouse.wheel(0, 500);
  await noGlPage.waitForTimeout(300);
  const fallback = await noGlPage.evaluate(() => ({
    canvases: document.querySelectorAll("canvas").length,
    scrolled: window.scrollY > 100,
    locked: getComputedStyle(document.body).overflow === "hidden",
    hasMain: !!document.querySelector("main#content"),
  }));
  record(
    "webgl fallback is the plain document",
    fallback.canvases === 0 && fallback.scrolled && !fallback.locked && fallback.hasMain,
    JSON.stringify(fallback),
  );
  await noGl.close();

  await browser.close();

  console.table(checks);
  const failed = checks.filter((c) => !c.passed);
  console.log(failed.length === 0 ? "\nPASS" : `\nFAIL (${failed.length})`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
