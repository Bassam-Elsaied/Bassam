/**
 * Shared Playwright helpers for the studio lifecycle.
 */

/**
 * Ensures the WebGL studio is mounted and ready.
 *
 * Homepage entry no longer requires an intro click. If the canvas is
 * already present this just waits for it. If the visitor previously
 * skipped, the HTML "Enter the studio" control is used.
 */
export async function enterStudio(page, { timeout = 10000 } = {}) {
  const canvas = page.locator("canvas").first();
  const enter = page.getByRole("button", { name: /^enter the studio$/i });

  const alreadyMounted = await canvas
    .waitFor({ state: "attached", timeout: 2500 })
    .then(() => true)
    .catch(() => false);

  if (!alreadyMounted) {
    await enter.click({ timeout });
    await canvas.waitFor({ state: "attached", timeout });
  }

  await page.waitForTimeout(600);
}
