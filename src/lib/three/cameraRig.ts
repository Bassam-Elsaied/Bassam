import { MathUtils, Vector3 } from "three";

/**
 * Mutable camera rig shared between the scene and whatever drives it.
 *
 * This is deliberately a plain module object rather than React state: the
 * camera is updated every frame, and routing those updates through React
 * would re-render the tree sixty times a second. Writers mutate the
 * vectors in place; `CameraController` reads them inside `useFrame`.
 *
 * Orbit is stored as yaw / pitch / distance. `offset` is always the
 * Cartesian form of that orbit so movement, occlusion and GSAP keep
 * reading the same vector they always have.
 */
export type CameraRig = {
  /** Point the camera looks at, in world space. */
  target: Vector3;
  /** Camera position relative to `target`. Derived from the orbit. */
  offset: Vector3;
  /** Horizontal orbit around the target, radians. Unbounded (full 360°). */
  yaw: number;
  /** Elevation above the look-at plane, radians. Clamped. */
  pitch: number;
  /** Spherical distance from target to camera. */
  distance: number;
  /** Seconds for the camera to close most of the gap. Higher = lazier. */
  smoothTime: number;
  /** Vertical field of view in degrees. */
  fov: number;
};

/**
 * Resting composition for the ready-made gallery (~13 × 25 m): from the
 * entrance end looking into the hall so the geometry and first boards read
 * together without leaving the enclosure.
 */
const DEFAULTS = {
  target: new Vector3(0.2, 1.55, 1.2),
  offset: new Vector3(3.6, 2.35, 7.4),
  smoothTime: 0.5,
  fov: 38,
} as const;

/**
 * Follow framing once the visitor moves. Kept short so the trailing camera
 * stays inside the smaller gallery while still reading the character.
 */
export const FOLLOW_OFFSET = new Vector3(2.55, 2.05, 2.6);

export const FOLLOW_DISTANCE = FOLLOW_OFFSET.length();

/** Third-person pitch: above the shoulders, never overhead or under the floor. */
export const PITCH_MIN = (8 * Math.PI) / 180;
export const PITCH_MAX = (40 * Math.PI) / 180;

function orbitFromOffset(offset: Vector3) {
  const planar = Math.hypot(offset.x, offset.z);
  return {
    yaw: Math.atan2(offset.x, offset.z),
    pitch: Math.atan2(offset.y, planar),
    distance: Math.hypot(offset.x, offset.y, offset.z),
  };
}

const restOrbit = orbitFromOffset(DEFAULTS.offset);

export const cameraRig: CameraRig = {
  target: DEFAULTS.target.clone(),
  offset: DEFAULTS.offset.clone(),
  yaw: restOrbit.yaw,
  pitch: restOrbit.pitch,
  distance: restOrbit.distance,
  smoothTime: DEFAULTS.smoothTime,
  fov: DEFAULTS.fov,
};

/** Writes `offset` from the current yaw / pitch / distance. */
export function applyOrbitToOffset() {
  const pitch = MathUtils.clamp(cameraRig.pitch, PITCH_MIN, PITCH_MAX);
  cameraRig.pitch = pitch;
  const planar = cameraRig.distance * Math.cos(pitch);
  cameraRig.offset.set(
    Math.sin(cameraRig.yaw) * planar,
    cameraRig.distance * Math.sin(pitch),
    Math.cos(cameraRig.yaw) * planar,
  );
}

/** Reads yaw / pitch / distance back from the current `offset`. */
export function captureOrbitFromOffset() {
  const orbit = orbitFromOffset(cameraRig.offset);
  cameraRig.yaw = orbit.yaw;
  cameraRig.pitch = MathUtils.clamp(orbit.pitch, PITCH_MIN, PITCH_MAX);
  cameraRig.distance = orbit.distance;
}

export function orbitBy(deltaYaw: number, deltaPitch: number) {
  cameraRig.yaw += deltaYaw;
  if (cameraRig.yaw > Math.PI) cameraRig.yaw -= Math.PI * 2;
  else if (cameraRig.yaw < -Math.PI) cameraRig.yaw += Math.PI * 2;
  cameraRig.pitch = MathUtils.clamp(
    cameraRig.pitch + deltaPitch,
    PITCH_MIN,
    PITCH_MAX,
  );
  applyOrbitToOffset();
}

/** Restores the resting composition. Called when the world is re-entered. */
export function resetCameraRig() {
  cameraRig.target.copy(DEFAULTS.target);
  cameraRig.offset.copy(DEFAULTS.offset);
  cameraRig.yaw = restOrbit.yaw;
  cameraRig.pitch = restOrbit.pitch;
  cameraRig.distance = restOrbit.distance;
  cameraRig.smoothTime = DEFAULTS.smoothTime;
  cameraRig.fov = DEFAULTS.fov;
}
