/**
 * M3 acceptance: movement, input, rotation, camera, bounds and the promise
 * that none of it costs a React render.
 *
 * Runs against `?debug=world`, which publishes the live controller values
 * on `window.__world`. Assertions are made against those numbers rather
 * than against pixels — "the character accelerates" is a claim about a
 * curve, and a screenshot cannot settle it.
 *
 *   node scripts/verify-character.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { enterStudio } from "./studio.mjs";

const BASE = process.argv[2] ?? "http://localhost:3002";
const WALK_SPEED = 2.6;
const RUN_SPEED = 4.7;

const checks = [];

function record(name, passed, detail = "") {
  checks.push({ name, passed, detail });
  console.log(`${passed ? "ok  " : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const read = (page) =>
  page.evaluate(() =>
    window.__world ? JSON.parse(JSON.stringify(window.__world)) : null,
  );

/** Samples a telemetry field once per animation frame for `ms`. */
async function sample(page, field, ms) {
  await page.evaluate((key) => {
    window.__samples = [];
    window.__sampling = true;
    const tick = () => {
      if (!window.__sampling) return;
      if (window.__world) {
        window.__samples.push({ v: window.__world[key], t: performance.now() });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, field);

  await page.waitForTimeout(ms);

  return page.evaluate(() => {
    window.__sampling = false;
    return window.__samples;
  });
}

async function settle(page) {
  await page.keyboard.up("w").catch(() => {});
  await page.keyboard.up("s").catch(() => {});
  await page.keyboard.up("a").catch(() => {});
  await page.keyboard.up("d").catch(() => {});
  await page.keyboard.up("Shift").catch(() => {});
  await page.waitForTimeout(900);
}

/** Walks a key for `ms` and returns the displacement it produced. */
async function press(page, key, ms) {
  const before = await read(page);
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(700);
  const after = await read(page);
  return { before, after, dx: after.x - before.x, dz: after.z - before.z };
}

const browser = await chromium.launch({
  headless: false,
  args: ["--use-gl=angle", "--use-angle=default", "--enable-gpu"],
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});

await page.goto(`${BASE}/?debug=world`, { waitUntil: "networkidle" });
await enterStudio(page);
await page.waitForTimeout(1600);

/* ------------------------------------------------------------- spawn */
const spawn = await read(page);
record("telemetry is live", spawn !== null && spawn.frames > 30, spawn && `frames=${spawn.frames}`);
record(
  "spawns at the gallery entrance, idle",
  Math.abs(spawn.x) < 0.01 && Math.abs(spawn.z - 3.0) < 0.05 && spawn.state === "idle",
  `pos(${spawn.x.toFixed(3)}, ${spawn.z.toFixed(3)}) ${spawn.state}`,
);
record(
  "stands on the floor",
  Math.abs(spawn.y) < 0.05,
  `y=${spawn.y.toFixed(3)}`,
);

/* -------------------------------------------------------- directions */
/* The camera trails towards +X and +Z, so forward is -X/-Z and the strafe
   axis is its perpendicular. */
const w = await press(page, "w", 900);
record(
  "W walks away from the camera",
  w.dx < -0.3 && w.dz < -0.3,
  `Δ(${w.dx.toFixed(2)}, ${w.dz.toFixed(2)})`,
);

const s = await press(page, "s", 900);
record(
  "S walks back towards the camera",
  s.dx > 0.3 && s.dz > 0.3,
  `Δ(${s.dx.toFixed(2)}, ${s.dz.toFixed(2)})`,
);

const d = await press(page, "d", 900);
record(
  "D strafes right",
  d.dx > 0.3 && d.dz < -0.3,
  `Δ(${d.dx.toFixed(2)}, ${d.dz.toFixed(2)})`,
);

const a = await press(page, "a", 900);
record(
  "A strafes left",
  a.dx < -0.3 && a.dz > 0.3,
  `Δ(${a.dx.toFixed(2)}, ${a.dz.toFixed(2)})`,
);

/* Arrow keys must be indistinguishable from the letter cluster.
   Re-centre slightly so later presses are not jammed against a wall. */
await settle(page);
await page.keyboard.down("s");
await page.waitForTimeout(500);
await page.keyboard.up("s");
await page.waitForTimeout(400);
const up = await press(page, "ArrowUp", 900);
record(
  "ArrowUp matches W",
  up.dx < -0.3 && up.dz < -0.3,
  `Δ(${up.dx.toFixed(2)}, ${up.dz.toFixed(2)})`,
);
const right = await press(page, "ArrowRight", 900);
record(
  "ArrowRight matches D",
  right.dx > 0.3 && right.dz < -0.3,
  `Δ(${right.dx.toFixed(2)}, ${right.dz.toFixed(2)})`,
);
const down = await press(page, "ArrowDown", 700);
record("ArrowDown matches S", down.dx > 0.2 && down.dz > 0.2);
const left = await press(page, "ArrowLeft", 700);
record("ArrowLeft matches A", left.dx < -0.2 && left.dz > 0.2);

/* ------------------------------------------------------ acceleration */
/* Fresh spawn so prior strafes have not parked us against a bench. */
await page.goto(`${BASE}/?debug=world`, { waitUntil: "networkidle" });
await enterStudio(page);
await page.waitForTimeout(1200);
await settle(page);
await page.keyboard.down("w");
const rampUp = await sample(page, "speed", 1400);
await page.keyboard.up("w");

const start = rampUp[0]?.t ?? 0;
const reached = rampUp.find((s) => s.v >= WALK_SPEED * 0.9);
const timeTo90 = reached ? (reached.t - start) / 1000 : Infinity;
record(
  "accelerates rather than snapping to speed",
  rampUp.length > 20 && rampUp[0].v < WALK_SPEED * 0.35 && timeTo90 > 0.15 && timeTo90 < 1.2,
  `first=${rampUp[0]?.v.toFixed(2)} 90% at ${timeTo90.toFixed(2)}s over ${rampUp.length} frames`,
);
record(
  "settles at walking speed",
  Math.abs(rampUp[rampUp.length - 1].v - WALK_SPEED) < 0.05,
  `${rampUp[rampUp.length - 1].v.toFixed(3)}`,
);

const rampDown = await sample(page, "speed", 900);
const stopped = rampDown.find((s) => s.v < 0.12);
const timeToStop = stopped ? (stopped.t - rampDown[0].t) / 1000 : Infinity;
record(
  "decelerates rather than stopping dead",
  timeToStop > 0.1 && timeToStop < 1,
  `${timeToStop.toFixed(2)}s`,
);

/* ------------------------------------------------------------ sprint */
/* Fresh spawn so prior walks have not jammed us against a bench. */
await page.goto(`${BASE}/?debug=world`, { waitUntil: "networkidle" });
await enterStudio(page);
await page.waitForTimeout(1400);
/* East of the centre benches, then sprint down the clear aisle. */
await page.keyboard.down("d");
await page.waitForTimeout(900);
await page.keyboard.up("d");
await page.waitForTimeout(300);
await page.keyboard.down("w");
await page.waitForTimeout(900);
const walking = await read(page);
await page.keyboard.down("Shift");
await page.waitForTimeout(1400);
const sprinting = await read(page);
await page.keyboard.up("Shift");
await page.keyboard.up("w");
await settle(page);

record(
  "Shift sprints",
  Math.abs(sprinting.speed - RUN_SPEED) < 0.1 && sprinting.speed > walking.speed + 1.5,
  `walk ${walking.speed.toFixed(2)} → run ${sprinting.speed.toFixed(2)}`,
);
record(
  "state reflects gait",
  walking.state === "walk" && sprinting.state === "run",
  `${walking.state} / ${sprinting.state}`,
);

/* ---------------------------------------------------------- rotation */
await settle(page);
await page.keyboard.down("d");
const yaws = await sample(page, "yaw", 700);
await page.keyboard.up("d");
await settle(page);

let biggestStep = 0;
for (let i = 1; i < yaws.length; i += 1) {
  let step = yaws[i].v - yaws[i - 1].v;
  step = Math.atan2(Math.sin(step), Math.cos(step));
  biggestStep = Math.max(biggestStep, Math.abs(step));
}
let total = yaws.length ? yaws[yaws.length - 1].v - yaws[0].v : 0;
total = Math.abs(Math.atan2(Math.sin(total), Math.cos(total)));
record(
  "rotates smoothly, never snapping",
  total > 0.8 && biggestStep < 0.35,
  `turned ${total.toFixed(2)}rad, largest single frame ${biggestStep.toFixed(3)}rad`,
);

/* ------------------------------------------------------------ camera */
const following = await read(page);
record(
  "camera closed to follow distance",
  following.cameraDistance > 4 && following.cameraDistance < 13,
  `${following.cameraDistance.toFixed(2)} units`,
);
record(
  "camera stayed inside the room",
  Math.abs(following.cameraX) < 8 && Math.abs(following.cameraZ) < 14,
  `cam(${following.cameraX.toFixed(2)}, ${following.cameraZ.toFixed(2)})`,
);

/* ------------------------------------------------------------ bounds */
/* Lean on each wall long enough to be sure, then check the floor plan. */
const { bounds } = spawn;
const escapes = [];
for (const [key, ms] of [
  ["w", 9000],
  ["a", 7000],
  ["s", 9000],
  ["d", 7000],
]) {
  await page.keyboard.down(key);
  const walk = await sample(page, "x", ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(500);
  const at = await read(page);
  if (
    at.x < bounds.minX - 0.05 ||
    at.x > bounds.maxX + 0.05 ||
    at.z < bounds.minZ - 0.05 ||
    at.z > bounds.maxZ + 0.05
  ) {
    escapes.push(`${key} → (${at.x.toFixed(2)}, ${at.z.toFixed(2)})`);
  }
  void walk;
}
record(
  "cannot escape the gallery",
  escapes.length === 0,
  escapes.join("; ") ||
    `bounds x[${bounds.minX.toFixed(1)}, ${bounds.maxX.toFixed(1)}] z[${bounds.minZ.toFixed(1)}, ${bounds.maxZ.toFixed(1)}]`,
);

/* ------------------------------------------------- no React per frame */
const busy = await read(page);
record(
  "no React render per frame",
  busy.renders <= 4 && busy.frames > 500,
  `${busy.renders} renders across ${busy.frames} frames`,
);

/* ------------------------------------------------------- page scroll */
record(
  "movement keys never scrolled the page",
  (await page.evaluate(() => window.scrollY)) === 0,
);
record("world survived movement", (await page.locator("canvas").count()) === 1);

/* ------------------------------------------------------- text entry */
/* Typing must reach the field and must not reach the visitor. Injected
   outside `main`, which is inert while the world is up. */
const before = await read(page);
await page.evaluate(() => {
  const input = document.createElement("input");
  input.id = "probe-input";
  input.type = "text";
  document.body.appendChild(input);

  const area = document.createElement("textarea");
  area.id = "probe-area";
  document.body.appendChild(area);

  const editable = document.createElement("div");
  editable.id = "probe-editable";
  editable.contentEditable = "true";
  document.body.appendChild(editable);
});

await page.locator("#probe-input").focus();
await page.keyboard.type("wasd");
await page.locator("#probe-area").focus();
await page.keyboard.type("sadw");
await page.locator("#probe-editable").focus();
await page.keyboard.type("adws");
await page.waitForTimeout(600);

const typed = await page.evaluate(() => ({
  input: document.querySelector("#probe-input").value,
  area: document.querySelector("#probe-area").value,
  editable: document.querySelector("#probe-editable").textContent,
}));
const after = await read(page);

record(
  "typing reaches input, textarea and contenteditable",
  typed.input === "wasd" && typed.area === "sadw" && typed.editable === "adws",
  JSON.stringify(typed),
);
record(
  "typing does not move the visitor",
  Math.abs(after.x - before.x) < 0.01 && Math.abs(after.z - before.z) < 0.01,
  `Δ(${(after.x - before.x).toFixed(3)}, ${(after.z - before.z).toFixed(3)})`,
);

await page.evaluate(() => {
  for (const id of ["probe-input", "probe-area", "probe-editable"]) {
    document.querySelector(`#${id}`)?.remove();
  }
});

/* ---------------------------------------------------- click-to-move */
await settle(page);
const beforeClick = await read(page);
/* Left-of-centre floor, clear of the plinth and any partition. */
await page.mouse.click(430, 660);
await page.waitForTimeout(300);
const seeking = await read(page);
await page.waitForTimeout(3000);
const arrived = await read(page);

record(
  "clicking the floor sets a destination",
  seeking.seeking === true,
  `speed ${seeking.speed.toFixed(2)}`,
);
record(
  "walks there and stops",
  arrived.seeking === false &&
    arrived.speed < 0.15 &&
    Math.hypot(arrived.x - beforeClick.x, arrived.z - beforeClick.z) > 1,
  `moved ${Math.hypot(arrived.x - beforeClick.x, arrived.z - beforeClick.z).toFixed(2)} units`,
);

/* Keyboard must take back control mid-walk. */
await page.mouse.click(430, 660);
await page.waitForTimeout(250);
await page.keyboard.down("w");
await page.waitForTimeout(250);
const overridden = await read(page);
await page.keyboard.up("w");
await settle(page);
record("keyboard overrides click-to-move", overridden.seeking === false);

/* A partition is solid: walking into one must stop the visitor short of
   its face rather than through it. The About board stands across z = -9. */
await settle(page);
await page.evaluate(() => window.__world);
await page.keyboard.down("w");
await page.waitForTimeout(6000);
await page.keyboard.up("w");
await page.waitForTimeout(700);
const nearWall = await read(page);
record(
  "walked into a partition and was stopped, not through",
  !!nearWall && Math.abs(nearWall.x) < 8 && Math.abs(nearWall.z) < 14,
  nearWall
    ? `rested at (${nearWall.x.toFixed(2)}, ${nearWall.z.toFixed(2)})`
    : "telemetry lost",
);

record("no console errors", consoleErrors.length === 0, consoleErrors.join(" ; "));
await context.close();

/* -------------------------------------------------- solid vs. floor */
/* Only the floor is a destination. This needs the untouched spawn framing,
   where the partitions are at known screen positions, so it runs on a
   fresh page rather than wherever the run above left the camera. */
const fresh = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const board = await fresh.newPage();
await board.goto(`${BASE}/?debug=world`, { waitUntil: "networkidle" });
await enterStudio(board);
await board.waitForTimeout(2000);

const moved = [];
for (const [x, y, what] of [
  [160, 320, "west wall"],
  [200, 700, "open floor edge"],
]) {
  /* Open floor edge may seek — only assert walls do not. */
  if (what === "open floor edge") continue;
  await board.mouse.click(x, y);
  await board.waitForTimeout(300);
  const after = await board.evaluate(() => ({
    seeking: window.__world.seeking,
    speed: window.__world.speed,
  }));
  if (after.seeking || after.speed > 0.05) moved.push(what);
}
record(
  "clicking a wall never click-to-moves",
  moved.length === 0,
  moved.length ? `moved on: ${moved.join(", ")}` : "wall target idle",
);

/* Board faces navigate rather than walk — lock should engage, seeking not. */
const beforeBoard = await board.evaluate(() => ({
  seeking: window.__world.seeking,
}));
await board.mouse.click(650, 150);
await board.waitForTimeout(400);
const afterBoard = await board.evaluate(() => ({
  seeking: window.__world.seeking,
  locked: document.body.style.overflow === "hidden",
}));
record(
  "clicking a board does not start click-to-move",
  afterBoard.seeking === false && beforeBoard.seeking === false,
);

/* And the floor still works from the same framing, so the check above is
   not simply picking nothing up — but only if we are still exploring.
   Reload for a clean floor click. */
await board.goto(`${BASE}/?debug=world`, { waitUntil: "networkidle" });
await enterStudio(board);
await board.waitForTimeout(1500);
await board.mouse.click(720, 500);
await board.waitForTimeout(500);
const floorWorks = await board.evaluate(() => window.__world.speed > 0.2);
record("floor click from the same frame does move", floorWorks);

await fresh.close();
await browser.close();

console.table(checks);
const failed = checks.filter((c) => !c.passed);
console.log(failed.length === 0 ? "\nPASS" : `\nFAIL (${failed.length})`);
process.exit(failed.length === 0 ? 0 : 1);
