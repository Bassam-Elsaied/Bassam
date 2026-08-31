/**
 * Visual identity QA screenshots at key viewports.
 *
 *   node scripts/shoot-visual.mjs [baseUrl]
 */
import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";
import { enterStudio } from "./studio.mjs";

const BASE = process.argv[2] ?? "http://localhost:3002";
const OUT = ".verify/visual-identity";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-gl=angle",
    "--use-angle=default",
    "--enable-gpu",
    "--enable-unsafe-swiftshader",
  ],
});

async function capture(label, options) {
  const ctx = await browser.newContext(options);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await enterStudio(page, { timeout: 15000 });
  await page.waitForTimeout(2800);
  await page.screenshot({ path: `${OUT}/${label}-idle.png` });

  await page.keyboard.down("w");
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/${label}-walk.png` });
  await page.keyboard.up("w");
  await page.waitForTimeout(400);

  console.log("shot", label);
  await ctx.close();
}

await capture("desktop-1920", { viewport: { width: 1920, height: 1080 } });
await capture("desktop-1440", { viewport: { width: 1440, height: 900 } });
await capture("mobile-430", {
  ...devices["iPhone 14 Pro Max"],
  viewport: { width: 430, height: 932 },
});

await browser.close();
console.log("written to", OUT);
