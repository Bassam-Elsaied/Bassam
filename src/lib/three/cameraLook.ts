/**
 * Mutable free-look input.
 *
 * Pointer handlers write here; the frame loop only reads. Nothing in this
 * module touches React state — a drag must not commit the tree.
 */
export type CameraLook = {
  /** True while a look-drag is past the click threshold. */
  dragging: boolean;
  /** The pointer currently captured for look, or null. */
  pointerId: number | null;
  /**
   * Set when a drag completed so board / floor clicks in the same
   * gesture are ignored. Cleared on the next pointer down.
   */
  suppressClick: boolean;
  /** Once the visitor has orbited, follow no longer overwrites yaw. */
  userHasLooked: boolean;
};

export const cameraLook: CameraLook = {
  dragging: false,
  pointerId: null,
  suppressClick: false,
  userHasLooked: false,
};

/** Releases an in-flight drag without forgetting that the visitor looked. */
export function resetCameraLook() {
  cameraLook.dragging = false;
  cameraLook.pointerId = null;
  cameraLook.suppressClick = false;
}

/** Full session reset — used when the world is torn down or re-entered. */
export function resetCameraLookSession() {
  resetCameraLook();
  cameraLook.userHasLooked = false;
}

export function lookClickSuppressed() {
  return cameraLook.suppressClick;
}
