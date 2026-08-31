/**
 * Visual pass over the visitor: spawn, mid-walk, sprint, and after a long
 * run at a wall. Headed Chromium with real GPU, so the shading matches what
 * a visitor sees rather than SwiftShader's approximation.
 *
 *   node scripts/shoot-character.mjs [baseUrl]
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3002";
const OUT = ".verify/m3";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: [
    "--use-gl=angle",
    "--use-angle=default",
    "--enable-gpu",
    "--enable-unsafe-swiftshader",
  ],
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("  [console error]", m.text());
});
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.locator("canvas").first().waitFor({ state: "attached" });
await page.waitForTimeout(3000);

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("shot", name);
}

await shot("01-spawn");

/* Hold W for a moment and catch it mid-stride. */
await page.keyboard.down("w");
await page.waitForTimeout(1400);
await shot("02-walk");

await page.keyboard.down("Shift");
await page.waitForTimeout(1600);
await shot("03-sprint");

await page.keyboard.up("Shift");
await page.keyboard.up("w");
await page.waitForTimeout(1400);
await shot("04-settled");

/* Strafe across the room to see the figure from another angle. */
await page.keyboard.down("d");
await page.waitForTimeout(1800);
await page.keyboard.up("d");
await page.waitForTimeout(900);
await shot("05-strafed");

await browser.close();
console.log("done");
