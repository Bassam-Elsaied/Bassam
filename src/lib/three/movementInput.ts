/**
 * Shared mutable movement input.
 *
 * Keyboard and the touch joystick both write here. The character
 * controller only ever reads — one pipeline for every device.
 *
 * Nothing in this module touches React state.
 */
export type MovementInput = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  /**
   * Continuous stick in camera space: x = strafe (−1…1), y = forward (−1…1).
   * When magnitude is above the dead zone the controller prefers these
   * over the boolean keys, so a partial tilt walks slowly.
   */
  stickX: number;
  stickY: number;
};

/** Below this the stick is ignored so a resting thumb does not drift. */
export const STICK_DEADZONE = 0.14;

export const movementInput: MovementInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  stickX: 0,
  stickY: 0,
};

export function clearMovementInput() {
  movementInput.forward = false;
  movementInput.backward = false;
  movementInput.left = false;
  movementInput.right = false;
  movementInput.sprint = false;
  movementInput.stickX = 0;
  movementInput.stickY = 0;
}

/** Writes a normalised stick sample. Magnitude is clamped to 1. */
export function setStick(x: number, y: number) {
  const length = Math.hypot(x, y);
  if (length < STICK_DEADZONE) {
    movementInput.stickX = 0;
    movementInput.stickY = 0;
    return;
  }
  const capped = Math.min(1, length);
  const scale = capped / length;
  movementInput.stickX = x * scale;
  movementInput.stickY = y * scale;
}

export function clearStick() {
  movementInput.stickX = 0;
  movementInput.stickY = 0;
}
