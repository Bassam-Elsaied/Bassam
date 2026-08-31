/**
 * M5 acceptance: mobile joystick, soft re-entry, skip persistence,
 * transition spam guard, reduced motion, SEO surfaces, single canvas.
 *
 *   node scripts/verify-hardening.mjs [baseUrl]
 */
import { chromium, devices } from "playwright";
import { enterStudio } from "./studio.mjs";

const BASE = process.argv[2] ?? "http://localhost:3002";
const checks = [];

function record(name, passed, detail = "") {
  checks.push({ name, passed, detail });
  console.log(
    `${passed ? "ok  " : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`,
  );
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=default", "--enable-gpu"],
});

/* ------------------------------------------------------ mobile joystick */
{
  const iPhone = devices["iPhone 13"];
  const ctx = await browser.newContext({
    ...iPhone,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  record(
    "mobile studio mounts immediately",
    (await page.locator("canvas").count()) === 1 &&
      (await page.getByRole("button", { name: /^enter the studio$/i }).count()) ===
        0,
  );

  record(
    "mobile skip is available over the studio",
    (await page.getByRole("button", { name: /skip exploration/i }).count()) ===
      1,
  );

  await enterStudio(page);
  await page.waitForTimeout(800);

  record(
    "joystick mounts on coarse pointer",
    (await page.getByRole("application", { name: /movement joystick/i }).count()) ===
      1,
  );
  record(
    "sprint control present",
    (await page.getByRole("button", { name: /sprint/i }).count()) === 1,
  );

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });
  record("no horizontal overflow on mobile", !overflow);

  const scrollLocked = await page.evaluate(
    () => getComputedStyle(document.body).overflow === "hidden",
  );
  record("body scroll locked while exploring", scrollLocked);

  await page.getByRole("button", { name: /skip exploration/i }).click();
  await page.waitForTimeout(400);
  record(
    "skip restores document on mobile",
    (await page.locator("canvas").count()) === 0 &&
      (await page.evaluate(
        () => !document.querySelector("main#content")?.hasAttribute("inert"),
      )),
  );

  await ctx.close();
}

/* ---------------------------------------------- soft re-entry via Back */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?debug=world`, { waitUntil: "networkidle" });
  await enterStudio(page);
  await page.waitForTimeout(1000);

  await page.keyboard.down("d");
  await page.waitForTimeout(1200);
  await page.keyboard.up("d");
  await page.keyboard.down("w");
  await page.waitForTimeout(3500);
  await page.keyboard.up("w");
  await page.keyboard.down("a");
  await page.waitForTimeout(1000);
  await page.keyboard.up("a");
  await page.waitForTimeout(800);

  const prompt = page.getByRole("button", { name: /enter/i });
  const hasPrompt = (await prompt.count()) > 0;
  record("proximity prompt before board enter", hasPrompt);

  if (hasPrompt) {
    await prompt.first().click();
  } else {
    await page.keyboard.press("Enter");
  }

  await page.waitForURL(/\/work/, { timeout: 12000 });
  record("board navigation reaches /work", page.url().includes("/work"));
  record(
    "canvas gone on board route",
    (await page.locator("canvas").count()) === 0,
  );

  await page.goBack();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 8000 });
  await page.waitForTimeout(1200);

  const canvases = await page.locator("canvas").count();
  const introVisible =
    (await page.getByRole("heading", { name: /bassam/i }).count()) > 0 &&
    (await page.locator("canvas").count()) === 0 &&
    (await page.getByRole("button", { name: /^enter the studio$/i }).count()) >
      0;

  /* Soft re-entry: canvas returns without a full intro screen. */
  record(
    "Back restores world without full intro",
    canvases === 1 && !introVisible,
    `canvases=${canvases} introVisible=${introVisible}`,
  );

  await ctx.close();
}

/* ----------------------------------------- skip then Back stays document */
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /skip exploration/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole("link", { name: /work/i }).first().click();
  await page.waitForURL("**/work", { timeout: 8000 });
  await page.getByRole("link", { name: /home/i }).first().click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 8000 });
  await page.waitForTimeout(800);

  const enterControl =
    (await page.getByRole("button", { name: /enter the studio/i }).count()) >=
    1;
  const canvasCount = await page.locator("canvas").count();
  record(
    "skipped session returns to document affordance",
    enterControl && canvasCount === 0,
    `enter=${enterControl} canvases=${canvasCount}`,
  );

  await ctx.close();
}

/* ------------------------------------------------ transition spam guard */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  const pushes = [];
  await page.route("**/*", (route) => route.continue());
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) pushes.push(frame.url());
  });

  await page.goto(`${BASE}/?debug=world`, { waitUntil: "networkidle" });
  await enterStudio(page);
  await page.waitForTimeout(1000);

  await page.keyboard.down("d");
  await page.waitForTimeout(1200);
  await page.keyboard.up("d");
  await page.keyboard.down("w");
  await page.waitForTimeout(3500);
  await page.keyboard.up("w");
  await page.keyboard.down("a");
  await page.waitForTimeout(1000);
  await page.keyboard.up("a");
  await page.waitForTimeout(600);

  await Promise.all([
    page.keyboard.press("Enter"),
    page.keyboard.press("Enter"),
    page.keyboard.press("Enter"),
  ]);

  await page.waitForTimeout(3500);
  const workHits = pushes.filter((u) => u.includes("/work")).length;
  record(
    "Enter spam yields a single navigation",
    workHits <= 1,
    `workHits=${workHits}`,
  );
  record(
    "single canvas throughout spam path",
    (await page.locator("canvas").count()) <= 1,
  );

  await ctx.close();
}

/* ------------------------------------------------------- reduced motion */
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  record(
    "reduced motion still shows studio immediately",
    (await page.locator("canvas").count()) === 1 &&
      (await page.getByRole("button", { name: /^enter the studio$/i }).count()) ===
        0,
  );

  await enterStudio(page);
  await page.waitForTimeout(700);
  record(
    "reduced motion mounts world",
    (await page.locator("canvas").count()) === 1,
  );
  record(
    "custom cursor disabled under reduced motion",
    await page.evaluate(
      () => !document.documentElement.classList.contains("studio-cursor"),
    ),
  );

  await ctx.close();
}

/* --------------------------------------------------------------- SEO */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  for (const path of ["/", "/work", "/about", "/services", "/contact"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    const meta = await page.evaluate(() => {
      const canonical = document.querySelector('link[rel="canonical"]')?.href;
      const desc = document.querySelector('meta[name="description"]')?.content;
      const og = document.querySelector('meta[property="og:title"]')?.content;
      const tw = document.querySelector('meta[name="twitter:card"]')?.content;
      return {
        title: document.title,
        canonical,
        desc,
        og,
        tw,
        jsonLd: document.querySelectorAll('script[type="application/ld+json"]')
          .length,
      };
    });
    record(
      `seo ${path || "/"}`,
      Boolean(meta.title && meta.desc && meta.canonical && meta.og && meta.tw) &&
        meta.jsonLd >= 2,
      `${meta.title} | ld=${meta.jsonLd}`,
    );
  }

  const robots = await page.goto(`${BASE}/robots.txt`);
  record("robots.txt reachable", robots?.ok() ?? false);
  const sitemap = await page.goto(`${BASE}/sitemap.xml`);
  record("sitemap.xml reachable", sitemap?.ok() ?? false);

  await ctx.close();
}

/* ----------------------------------------------------------- contact form */
{
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /send/i }).click();
  await page.waitForTimeout(300);
  const invalid = await page.locator("[aria-invalid=true]").count();
  record("contact empty submit marks invalid fields", invalid > 0);

  await page.getByLabel(/email/i).fill("not-an-email");
  await page.getByRole("button", { name: /send/i }).click();
  await page.waitForTimeout(300);
  record(
    "contact rejects invalid email",
    (await page.locator("[aria-invalid=true]").count()) > 0,
  );

  await ctx.close();
}

await browser.close();

const failed = checks.filter((c) => !c.passed);
console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) {
  console.error("Failed:");
  for (const f of failed) console.error(` - ${f.name}: ${f.detail}`);
  process.exit(1);
}
