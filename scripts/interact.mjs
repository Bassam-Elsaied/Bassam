/**
 * Interaction checks: mobile menu behaviour, keyboard dismissal, focus
 * restoration, and contact-form validation.
 *
 *   node scripts/interact.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { enterStudio } from "./studio.mjs";

const BASE = process.argv[2] ?? "http://localhost:3002";
const problems = [];
const browser = await chromium.launch();

/* ---------------------------------------------------------------- menu */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`[exception] menu :: ${e.message}`));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  /* Intro first — skip it so the menu lock test measures the document. */
  const skipIntro = page.getByRole("button", { name: /skip exploration/i });
  if (await skipIntro.count()) {
    await skipIntro.click();
    await page.waitForTimeout(500);
  }

  /* The label toggles between "Menu" and "Close", so key off the stable
     aria-controls relationship rather than the accessible name. */
  const trigger = page.locator('button[aria-controls="mobile-menu-panel"]');
  if ((await trigger.getAttribute("aria-expanded")) !== "false") {
    problems.push("[menu] trigger does not start with aria-expanded=false");
  }

  await trigger.click();
  await page.waitForTimeout(600);

  const dialog = page.getByRole("dialog", { name: /site menu/i });
  if (!(await dialog.isVisible())) problems.push("[menu] dialog did not open");
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    problems.push("[menu] aria-expanded did not flip to true");
  }

  const links = await dialog.getByRole("link").count();
  if (links < 5) problems.push(`[menu] only ${links} links in panel`);

  /* Body must not scroll behind the overlay. */
  const overflow = await page.evaluate(() => document.body.style.overflow);
  if (overflow !== "hidden") problems.push(`[menu] body overflow is "${overflow}"`);

  /* The panel plays a 0.7s exit wipe, so wait for it to actually leave
     rather than sampling at a fixed moment. */
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 4000 }).catch(() => {
    problems.push("[menu] Escape did not close the dialog");
  });

  const focusReturned = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-controls"),
  );
  if (focusReturned !== "mobile-menu-panel") {
    problems.push(`[menu] focus not restored to trigger (got "${focusReturned}")`);
  }

  const scrollRestored = await page.evaluate(() => document.body.style.overflow);
  if (scrollRestored === "hidden") problems.push("[menu] body scroll left locked");

  /* Navigating from the menu must work. */
  await trigger.click();
  await page.waitForTimeout(500);
  await dialog.getByRole("link", { name: /work/i }).first().click();
  await page.waitForURL("**/work", { timeout: 5000 }).catch(() => {
    problems.push("[menu] navigation from panel failed");
  });
  await page
    .getByRole("dialog")
    .waitFor({ state: "hidden", timeout: 4000 })
    .catch(() => {
      problems.push("[menu] panel survived navigation");
    });

  await ctx.close();
}

/* ------------------------------------------------ overlapping locks */
/* The menu and the studio both lock the page. Opening the menu on top of
   an active world and then navigating stacks and unwinds both at once; the
   destination must arrive scrollable regardless of teardown order. */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`[exception] locks :: ${e.message}`));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await enterStudio(page);

  await page.locator('button[aria-controls="mobile-menu-panel"]').click();
  await page.waitForTimeout(700);
  const bothHeld = await page.evaluate(
    () => document.body.style.overflow === "hidden",
  );
  if (!bothHeld) problems.push("[locks] page not locked with menu over world");

  await page
    .getByRole("dialog")
    .getByRole("link", { name: /work/i })
    .first()
    .click();
  /* Board navigation plays a camera approach before routing. */
  await page.waitForURL("**/work", { timeout: 12000 });
  await page.waitForTimeout(700);

  const released = await page.evaluate(() => {
    window.scrollTo(0, 600);
    return {
      computed: getComputedStyle(document.body).overflow,
      inline: document.body.style.overflow,
    };
  });
  await page.waitForTimeout(200);
  const scrolled = await page.evaluate(() => window.scrollY);
  if (released.computed === "hidden" || released.inline === "hidden") {
    problems.push(
      `[locks] destination left scroll-locked (${JSON.stringify(released)})`,
    );
  }
  if (scrolled < 100) {
    problems.push(`[locks] destination did not scroll (scrollY=${scrolled})`);
  }

  await ctx.close();
}

/* ---------------------------------------------------------------- form */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`[exception] form :: ${e.message}`));
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });

  const submit = page.getByRole("button", { name: /send message/i });

  /* Empty submit must surface errors, not navigate. */
  await submit.click();
  await page.waitForTimeout(600);
  const alerts = await page.getByRole("alert").count();
  if (alerts < 3) {
    problems.push(`[form] empty submit produced ${alerts} errors, expected 3+`);
  }

  const nameInvalid = await page
    .locator("#name")
    .getAttribute("aria-invalid");
  if (nameInvalid !== "true") {
    problems.push("[form] aria-invalid not set on the invalid name field");
  }
  const describedBy = await page
    .locator("#name")
    .getAttribute("aria-describedby");
  if (describedBy !== "name-error") {
    problems.push("[form] aria-describedby not wired to the error message");
  }

  /* Bad email must be caught. */
  await page.locator("#name").fill("Test Person");
  await page.locator("#email").fill("not-an-email");
  await page.locator("#message").fill("This is a long enough message body.");
  await submit.click();
  await page.waitForTimeout(500);
  const emailErr = await page.locator("#email-error").count();
  if (emailErr !== 1) problems.push("[form] invalid email was not rejected");

  /* Counter must track input. */
  const hintBefore = await page.locator("form").getByText(/\/500/).innerText();
  if (!hintBefore.startsWith("35/")) {
    problems.push(`[form] character counter reads "${hintBefore}"`);
  }

  /* Valid submit reaches the confirmation state. Intercept EmailJS so
     verification does not send a real message. */
  await page.route("https://api.emailjs.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "OK",
    });
  });
  await page.locator("#email").fill("test@example.com");
  await submit.click();
  await page.waitForTimeout(900);
  const confirmed = await page
    .getByText(/your message is on its way/i)
    .isVisible()
    .catch(() => false);
  if (!confirmed) problems.push("[form] valid submit did not reach confirmation");

  await ctx.close();
}

/* ------------------------------------------------------- desktop focus */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  /* Tab through the header and confirm every nav item is reachable and
     shows a visible focus ring. */
  const seen = [];
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      /* Tabbing past the last focusable element hands focus to the browser
         chrome and reports `body`. That is not a page element and has no
         ring to check. */
      if (!el || el === document.body || el === document.documentElement) {
        return null;
      }
      const style = getComputedStyle(el);
      return {
        text: el.textContent?.trim().slice(0, 24),
        outline: style.outlineStyle,
        width: style.outlineWidth,
      };
    });
    if (info) seen.push(info);
  }
  const noRing = seen.filter(
    (s) => s.outline === "none" || s.width === "0px",
  ).length;
  if (noRing > 0) {
    problems.push(`[a11y] ${noRing} of ${seen.length} focused elements had no focus ring`);
  }
  await ctx.close();
}

await browser.close();

if (problems.length === 0) {
  console.log("PASS — menu, form and focus behaviour all correct.");
} else {
  console.log(`FOUND ${problems.length} ISSUE(S):\n`);
  for (const p of problems) console.log("  " + p);
  process.exitCode = 1;
}
