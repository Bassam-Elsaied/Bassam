/**
 * Homepage lifecycle regression: `/` must never render blank.
 *
 * After any leave/return path the visitor always sees either the studio
 * canvas or the HTML homepage — never inert HTML with no canvas, and
 * never a full-screen intro gate.
 *
 *   node scripts/verify-home-reentry.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { enterStudio } from "./studio.mjs";

const BASE = process.argv[2] ?? "http://localhost:3002";
const checks = [];

function record(name, passed, detail = "") {
  checks.push({ name, passed, detail });
  console.log(
    `${passed ? "ok  " : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`,
  );
}

async function homepageSurface(page) {
  const canvas = await page.locator("canvas").count();
  const enterControl = await page
    .getByRole("button", { name: /^enter the studio$/i })
    .count();
  const skipControl = await page
    .getByRole("button", { name: /^skip exploration$/i })
    .count();
  const mainInert = await page.locator("main#content[inert]").count();
  const h1 = await page
    .locator("main#content h1, [data-home-document] h1")
    .first()
    .isVisible()
    .catch(() => false);

  const studioVisible = canvas >= 1;
  const htmlVisible = canvas === 0 && mainInert === 0 && h1;
  const blank = !studioVisible && !htmlVisible;

  return {
    canvas,
    enterControl,
    skipControl,
    mainInert,
    h1,
    studioVisible,
    htmlVisible,
    blank,
  };
}

const browser = await chromium.launch({
  headless: false,
  args: ["--use-gl=angle", "--use-angle=default", "--enable-gpu"],
});

/* ----------------------------------------------------------- direct / */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const surface = await homepageSurface(page);
  record(
    "direct / shows studio immediately",
    !surface.blank && surface.studioVisible && surface.enterControl === 0,
    JSON.stringify(surface),
  );
  await ctx.close();
}

/* ------------------------------------------- client: work → logo home */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(page);
  await page.waitForTimeout(700);
  await page.getByRole("link", { name: /work/i }).first().click();
  await page.waitForURL("**/work", { timeout: 20000 });
  await page.waitForTimeout(400);
  await page.getByRole("link", { name: /home/i }).first().click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 8000 });
  await page.waitForTimeout(1200);
  const surface = await homepageSurface(page);
  record(
    "work → home restores studio (not blank, not stuck html-only without affordance)",
    !surface.blank && surface.studioVisible,
    JSON.stringify(surface),
  );
  await ctx.close();
}

/* ---------------------------------------- about / services / contact */
for (const section of ["about", "services", "contact"]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(page);
  await page.waitForTimeout(600);
  await page
    .getByRole("link", { name: new RegExp(section, "i") })
    .first()
    .click();
  await page.waitForURL(`**/${section}`, { timeout: 20000 });
  await page.waitForTimeout(300);
  await page.getByRole("link", { name: /home/i }).first().click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 8000 });
  await page.waitForTimeout(1100);
  const surface = await homepageSurface(page);
  record(
    `${section} → home restores visible homepage`,
    !surface.blank && surface.studioVisible,
    JSON.stringify(surface),
  );
  await ctx.close();
}

/* -------------------------------------------------- browser Back / Forward */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(page);
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: /work/i }).first().click();
  await page.waitForURL("**/work", { timeout: 20000 });
  await page.goBack();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 8000 });
  await page.waitForTimeout(1200);
  const back = await homepageSurface(page);
  record(
    "browser Back restores studio",
    !back.blank && back.canvas === 1,
    JSON.stringify(back),
  );

  await page.goForward();
  await page.waitForURL("**/work", { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.goBack();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 8000 });
  await page.waitForTimeout(1200);
  const again = await homepageSurface(page);
  record(
    "Forward then Back restores studio again",
    !again.blank && again.studioVisible,
    JSON.stringify(again),
  );
  await ctx.close();
}

/* ------------------------------------------- Skip then return to studio */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /skip exploration/i }).click();
  await page.waitForTimeout(400);
  const skipped = await homepageSurface(page);
  record(
    "Skip reveals HTML homepage",
    skipped.htmlVisible && skipped.canvas === 0,
    JSON.stringify(skipped),
  );

  await page.getByRole("link", { name: /work/i }).first().click();
  await page.waitForURL("**/work", { timeout: 8000 });
  await page.getByRole("link", { name: /home/i }).first().click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 8000 });
  await page.waitForTimeout(1000);
  const returned = await homepageSurface(page);
  record(
    "after Skip → work → home, homepage visible and studio re-enterable",
    !returned.blank &&
      (returned.htmlVisible || returned.studioVisible) &&
      returned.enterControl >= 1,
    JSON.stringify(returned),
  );
  await ctx.close();
}

/* ---------------------------------------------------------- mobile 430 */
{
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const direct = await homepageSurface(page);
  record(
    "mobile direct / not blank",
    !direct.blank,
    JSON.stringify(direct),
  );

  await page.getByRole("button", { name: /skip exploration/i }).click();
  await page.waitForTimeout(400);
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const mobileReturn = await homepageSurface(page);
  record(
    "mobile return to / not blank",
    !mobileReturn.blank,
    JSON.stringify(mobileReturn),
  );
  await ctx.close();
}

/* ------------------------------------------------------ WebGL disabled */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function getContext() {
      return null;
    };
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const surface = await homepageSurface(page);
  record(
    "WebGL unavailable falls back to HTML homepage",
    surface.htmlVisible && surface.canvas === 0 && !surface.blank,
    JSON.stringify(surface),
  );
  await ctx.close();
}

await browser.close();

console.table(checks);
const failed = checks.filter((c) => !c.passed);
console.log(failed.length === 0 ? "\nPASS" : `\nFAIL (${failed.length})`);
process.exit(failed.length === 0 ? 0 : 1);
