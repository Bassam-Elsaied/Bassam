/**
 * Side-effect halt for the 3D studio, registered by ExperienceLayer.
 *
 * The experience store must not import three/gsap — SiteHeader and SkipLink
 * read it on every page. The actual camera/input teardown is bound only
 * while the world is mounted.
 */

let halt: (() => void) | null = null;

export function setWorldHalt(next: (() => void) | null) {
  halt = next;
}

export function haltWorld() {
  halt?.();
}
