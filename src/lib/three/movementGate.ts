/**
 * Mutable gate the character controller reads each frame.
 *
 * Written by navigation / skip — never through React state — so
 * locking the visitor mid-stride costs nothing and cannot tear.
 */
export type MovementGate = {
  locked: boolean;
  lock: () => void;
  unlock: () => void;
};

export const movementGate: MovementGate = {
  locked: false,
  lock() {
    this.locked = true;
  },
  unlock() {
    this.locked = false;
  },
};
