/**
 * Verification harness for the editorial layer.
 *
 * Walks every route at every required breakpoint and reports console
 * errors, uncaught exceptions, failed requests, horizontal overflow and
 * heading-hierarchy problems. Screenshots land in .verify/.
 *
 *   node scripts/verify.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3002";
const OUT = ".verify";

const ROUTES = ["/", "/work", "/about", "/services", "/contact"];

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

const problems = [];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });

  for (const route of ROUTES) {
    const page = await context.newPage();
    const label = `${route} @ ${viewport.name}`;

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        problems.push(`[console] ${label} :: ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => {
      problems.push(`[exception] ${label} :: ${err.message}`);
    });
    page.on("requestfailed", (req) => {
      problems.push(
        `[request] ${label} :: ${req.url()} — ${req.failure()?.errorText}`,
      );
    });

    const response = await page.goto(`${BASE}${route}`, {
      waitUntil: "networkidle",
    });

    if (!response || response.status() >= 400) {
      problems.push(`[status] ${label} :: ${response?.status()}`);
    }

    /* Let scroll-triggered reveals settle before measuring. */
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight),
    );
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    const audit = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - doc.clientWidth;

      /* Identify anything sticking out past the right edge. */
      const offenders = [];
      if (overflow > 1) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > doc.clientWidth + 1) {
            offenders.push(
              `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`,
            );
            if (offenders.length > 4) break;
          }
        }
      }

      const headings = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) =>
        Number(h.tagName[1]),
      );

      /* Elements still stuck in their pre-animation state. */
      const stuck = [...document.querySelectorAll("[data-reveal]")].filter(
        (el) => Number(getComputedStyle(el).opacity) < 0.05,
      ).length;

      return {
        overflow,
        offenders,
        h1Count: headings.filter((n) => n === 1).length,
        headings,
        stuck,
        title: document.title,
        hasMain: Boolean(document.querySelector("main#content")),
      };
    });

    if (audit.overflow > 1) {
      problems.push(
        `[overflow] ${label} :: ${audit.overflow}px — ${audit.offenders.join(", ")}`,
      );
    }
    if (audit.h1Count !== 1) {
      problems.push(`[headings] ${label} :: ${audit.h1Count} h1 elements`);
    }
    if (!audit.hasMain) {
      problems.push(`[semantics] ${label} :: missing main#content`);
    }
    if (!audit.title) {
      problems.push(`[metadata] ${label} :: empty <title>`);
    }

    /* Heading levels must not skip (h2 -> h4). */
    for (let i = 1; i < audit.headings.length; i += 1) {
      if (audit.headings[i] - audit.headings[i - 1] > 1) {
        problems.push(
          `[headings] ${label} :: skips h${audit.headings[i - 1]} -> h${audit.headings[i]}`,
        );
        break;
      }
    }

    const slug = route === "/" ? "home" : route.replaceAll("/", "");
    const wide = viewport.width >= 1280;
    await page.screenshot({
      path: `${OUT}/${slug}-${viewport.name}.png`,
      fullPage: wide && route === "/",
    });

    await page.close();
  }

  await context.close();
}

/* Keyboard + reduced-motion pass, desktop only. */
const kbContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const kb = await kbContext.newPage();
await kb.goto(`${BASE}/`, { waitUntil: "networkidle" });

const firstFocus = await kb.evaluate(async () => {
  document.body.focus();
  return null;
});
void firstFocus;

await kb.keyboard.press("Tab");
const skip = await kb.evaluate(() => {
  const el = document.activeElement;
  return { tag: el?.tagName, text: el?.textContent?.trim(), href: el?.getAttribute("href") };
});
if (skip.href !== "#content") {
  problems.push(`[a11y] first Tab stop is not the skip link :: ${JSON.stringify(skip)}`);
}

const reachable = await kb.evaluate(() => {
  const focusable = document.querySelectorAll(
    'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])',
  );
  return focusable.length;
});
if (reachable < 10) {
  problems.push(`[a11y] only ${reachable} focusable elements on home`);
}
await kbContext.close();

/* Reduced motion must leave everything visible. */
const rmContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const rm = await rmContext.newPage();
for (const route of ROUTES) {
  await rm.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  const hidden = await rm.evaluate(() => {
    const all = [...document.querySelectorAll("h1,h2,h3,p,a,li")];
    return all.filter((el) => {
      const s = getComputedStyle(el);
      return (
        Number(s.opacity) < 0.05 &&
        el.getBoundingClientRect().height > 0 &&
        s.visibility !== "hidden"
      );
    }).length;
  });
  if (hidden > 0) {
    problems.push(`[reduced-motion] ${route} :: ${hidden} invisible elements`);
  }
}
await rm.screenshot({ path: `${OUT}/home-reduced-motion.png` });
await rmContext.close();

await browser.close();

if (problems.length === 0) {
  console.log(`PASS — ${ROUTES.length} routes x ${VIEWPORTS.length} viewports, no issues.`);
} else {
  console.log(`FOUND ${problems.length} ISSUE(S):\n`);
  for (const p of problems) console.log("  " + p);
  process.exitCode = 1;
}
