/**
 * M4 acceptance: immediate studio entry, proximity, Enter, board click,
 * navbar dual path, skip, and route arrivals.
 *
 *   node scripts/verify-boards.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { enterStudio } from "./studio.mjs";

const BASE = process.argv[2] ?? "http://localhost:3002";
const checks = [];

function record(name, passed, detail = "") {
  checks.push({ name, passed, detail });
  console.log(`${passed ? "ok  " : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const browser = await chromium.launch({
  headless: false,
  args: ["--use-gl=angle", "--use-angle=default", "--enable-gpu"],
});

/* ------------------------------------------------------ studio entry */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  record(
    "studio mounts without an intro gate",
    (await page.locator("canvas").count()) === 1 &&
      (await page.getByRole("button", { name: /^enter the studio$/i }).count()) ===
        0,
  );
  record(
    "skip exploration is available over the studio",
    (await page.getByRole("button", { name: /skip exploration/i }).count()) === 1,
  );

  await enterStudio(page);
  record("enter mounts the world", (await page.locator("canvas").count()) === 1);
  record("no console errors on enter", errs.length === 0, errs.join(" ; "));

  await page.getByRole("button", { name: /skip exploration/i }).click();
  await page.waitForTimeout(500);
  record("skip unmounts canvas", (await page.locator("canvas").count()) === 0);
  record(
    "document interactive after skip",
    await page.evaluate(
      () =>
        !document.querySelector("main#content")?.hasAttribute("inert") &&
        getComputedStyle(document.body).overflow !== "hidden",
    ),
  );

  await page.getByRole("button", { name: /enter the studio/i }).click();
  await page.locator("canvas").first().waitFor({ state: "attached" });
  await page.waitForTimeout(700);
  record("re-enter remounts canvas", (await page.locator("canvas").count()) === 1);
  await ctx.close();
}

/* --------------------------------------------------- proximity + Enter */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?debug=world`, { waitUntil: "networkidle" });
  await enterStudio(page);
  await page.waitForTimeout(1200);

  /* Approach Work (−5.15, −3.5) from the mid-hall spawn. */
  for (const [key, ms] of [
    ["d", 1200],
    ["w", 3500],
    ["a", 1000],
  ]) {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(700);

  const prompt = page.getByRole("button", { name: /^enter$/i });
  record(
    "proximity shows Enter prompt",
    await prompt.isVisible().catch(() => false),
  );

  await prompt.click();
  await page.waitForURL("**/work", { timeout: 12000 });
  record("Enter navigates to /work", page.url().includes("/work"));
  await page.waitForTimeout(600);
  record(
    "work page has content",
    await page.locator("h1").count().then((n) => n > 0),
  );
  await ctx.close();
}

/* ------------------------------------------------------ navbar dual */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(page);
  await page.waitForTimeout(800);

  await page.getByRole("link", { name: /work/i }).first().click();
  await page.waitForURL("**/work", { timeout: 20000 });
  record("navbar Work while exploring → /work", page.url().includes("/work"));

  /* Outside exploration, navbar is instant. */
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /contact/i }).first().click();
  await page.waitForURL("**/contact", { timeout: 5000 });
  record("navbar Contact outside exploration → /contact", page.url().includes("/contact"));
  await ctx.close();
}

/* --------------------------------------------------- board click */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?debug=world`, { waitUntil: "networkidle" });
  await enterStudio(page);
  await page.waitForTimeout(2500);

  /* Work board face in mid-hall spawn framing (upper-centre of view). */
  await page.mouse.click(650, 150);
  await page.waitForURL("**/work", { timeout: 20000 });
  record("board click navigates", page.url().includes("/work"));
  await ctx.close();
}

/* --------------------------------------------------- back / forward */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/work`, { waitUntil: "networkidle" });
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.goBack();
  await page.waitForTimeout(500);
  record("browser back works", page.url().includes("/work"));
  await page.goForward();
  await page.waitForTimeout(500);
  record("browser forward works", page.url().includes("/about"));
  await ctx.close();
}

/* ----------------------------------------------- reduced motion home */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  record("reduced-motion homepage has no hydration error", errs.length === 0, errs.join(" ; "));
  await ctx.close();
}

await browser.close();
console.table(checks);
const failed = checks.filter((c) => !c.passed);
console.log(failed.length === 0 ? "\nPASS" : `\nFAIL (${failed.length})`);
process.exit(failed.length === 0 ? 0 : 1);
