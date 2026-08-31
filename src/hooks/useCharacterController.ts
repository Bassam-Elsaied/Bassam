"use client";

import { useMemo } from "react";
import { Vector3 } from "three";

import { useMovementInput } from "@/hooks/useMovementInput";
import type { MovementInput } from "@/lib/three/movementInput";
import { groundHeightAt, isWalkable, resolveCollision } from "@/lib/three/collision";
import { BOUNDS, SPAWN } from "@/lib/three/layout";
import { movementGate } from "@/lib/three/movementGate";

/**
 * Movement tuning, in world units and seconds.
 *
 * The room is 34 by 40, so walking its length takes about fifteen seconds.
 * Sprint is a little over half again, which is the difference between
 * strolling and crossing the room on purpose — this is a gallery, and a
 * visitor who can outrun the architecture makes it feel like a set.
 */
export const MOVEMENT = {
  walkSpeed: 2.6,
  runSpeed: 4.7,
  /** Seconds to close most of the gap to the target velocity. */
  accelTime: 0.17,
  /** Shorter than acceleration: stopping should feel deliberate, not icy. */
  brakeTime: 0.12,
  /** Turn responsiveness, per second. */
  turnRate: 9,
  /** Below this the visitor counts as still. */
  idleSpeed: 0.12,
  /** Above this a walk reads as a run. Sits above `walkSpeed` so holding a
      direction without Shift never flickers into the run state. */
  runThreshold: 2.9,
  /** Vertical easing when stepping on and off the plinth. */
  stepTime: 0.09,
  /** Click-to-move: distance at which the destination is reached. */
  arriveRadius: 0.3,
  /** Distance over which to ease off, so arrival settles rather than snaps. */
  slowRadius: 1.7,
  /** Seconds of getting nowhere before a destination is abandoned. */
  stallTimeout: 0.5,
} as const;

export type CharacterState = "idle" | "walk" | "run";

/**
 * What the controller hands the rig. Everything the rig needs to animate,
 * and nothing about how any of it was arrived at.
 *
 * This object is mutated in place, never replaced — see `CharacterRig`.
 */
export type CharacterMotion = {
  state: CharacterState;
  /** Planar speed, world units per second. */
  speed: number;
  /** `speed` normalised against a full sprint, for scaling animation. */
  intensity: number;
  /** Seconds since the previous frame, already clamped. */
  delta: number;
};

export type CharacterController = {
  /** Mutated in place every frame. Never reassign. */
  readonly position: Vector3;
  readonly velocity: Vector3;
  readonly motion: CharacterMotion;
  readonly yaw: number;
  /** Whether a click destination is currently being walked to. */
  readonly seeking: boolean;
  /** Sets a click-to-move destination. Ignored if nothing could stand there. */
  moveTo: (x: number, z: number) => void;
  /** Advances one frame. `cameraOffset` supplies the control basis. */
  step: (delta: number, cameraOffset: Vector3) => void;
};

function createCharacterController(
  input: MovementInput,
): CharacterController {
  const position = new Vector3(
    SPAWN.x,
    groundHeightAt(SPAWN.x, SPAWN.z),
    SPAWN.z,
  );
  const velocity = new Vector3();
  const destination = new Vector3();
  const motion: CharacterMotion = {
    state: "idle",
    speed: 0,
    intensity: 0,
    delta: 0,
  };

  let yaw = SPAWN.yaw;
  let seeking = false;
  let stalledFor = 0;

  function moveTo(x: number, z: number) {
    if (movementGate.locked) return;

    const targetX = clamp(x, BOUNDS.minX, BOUNDS.maxX);
    const targetZ = clamp(z, BOUNDS.minZ, BOUNDS.maxZ);
    /* Refusing an impossible destination outright is better than walking
       into a partition and stopping there for no visible reason. */
    if (!isWalkable(targetX, targetZ)) return;

    destination.set(targetX, 0, targetZ);
    seeking = true;
    stalledFor = 0;
  }

  function step(delta: number, cameraOffset: Vector3) {
    motion.delta = delta;

    /* Navigation owns the visitor once a board is claimed — stop seeking,
       ignore keys, and coast to a halt. */
    if (movementGate.locked) {
      seeking = false;
      input.forward = false;
      input.backward = false;
      input.left = false;
      input.right = false;
      input.sprint = false;
      input.stickX = 0;
      input.stickY = 0;
    }

    /* Controls are relative to the camera, and the camera's ground bearing
       is derived from the rig rather than hardcoded — so when M4 swings the
       camera for a board transition, forward stays "away from the camera"
       instead of silently becoming a fixed compass direction. */
    let forwardX = -cameraOffset.x;
    let forwardZ = -cameraOffset.z;
    const bearing = Math.hypot(forwardX, forwardZ);
    if (bearing > 1e-6) {
      forwardX /= bearing;
      forwardZ /= bearing;
    } else {
      forwardX = 0;
      forwardZ = -1;
    }
    const rightX = -forwardZ;
    const rightZ = forwardX;

    let advance = 0;
    let strafe = 0;
    let throttle = 0;

    if (!movementGate.locked) {
      const stickMag = Math.hypot(input.stickX, input.stickY);
      if (stickMag > 0) {
        /* Joystick: continuous throttle from stick magnitude. */
        advance = input.stickY;
        strafe = input.stickX;
        throttle = Math.min(1, stickMag);
      } else {
        advance = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
        strafe = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (advance !== 0 || strafe !== 0) throttle = 1;
      }
    }

    let directionX = 0;
    let directionZ = 0;

    if (throttle > 0) {
      /* Touching a key or stick takes the visitor back off autopilot. */
      seeking = false;

      directionX = forwardX * advance + rightX * strafe;
      directionZ = forwardZ * advance + rightZ * strafe;
      const length = Math.hypot(directionX, directionZ);
      if (length > 1e-6) {
        directionX /= length;
        directionZ /= length;
      }
    } else if (seeking) {
      directionX = destination.x - position.x;
      directionZ = destination.z - position.z;
      const distance = Math.hypot(directionX, directionZ);

      if (distance <= MOVEMENT.arriveRadius) {
        seeking = false;
      } else {
        directionX /= distance;
        directionZ /= distance;
        throttle = Math.min(1, distance / MOVEMENT.slowRadius);

        /* Something between here and there is solid. Reading last frame's
           speed is a frame stale and entirely good enough to notice it. */
        stalledFor = motion.speed < 0.2 ? stalledFor + delta : 0;
        if (stalledFor > MOVEMENT.stallTimeout) {
          seeking = false;
          stalledFor = 0;
        }
      }
    }

    const maxSpeed = input.sprint ? MOVEMENT.runSpeed : MOVEMENT.walkSpeed;
    const targetVelocityX = directionX * maxSpeed * throttle;
    const targetVelocityZ = directionZ * maxSpeed * throttle;

    /* Exponential approach, framed in seconds rather than frames: the same
       proportion of the gap closes per unit of time whatever the frame
       rate. This is where the weight comes from — the visitor leans into a
       start and carries a little way past a stop. */
    const tau = throttle > 0 ? MOVEMENT.accelTime : MOVEMENT.brakeTime;
    const blend = 1 - Math.exp(-delta / tau);
    velocity.x += (targetVelocityX - velocity.x) * blend;
    velocity.z += (targetVelocityZ - velocity.z) * blend;

    position.x += velocity.x * delta;
    position.z += velocity.z * delta;
    resolveCollision(position, velocity);

    const groundY = groundHeightAt(position.x, position.z);
    position.y +=
      (groundY - position.y) * (1 - Math.exp(-delta / MOVEMENT.stepTime));

    const speed = Math.hypot(velocity.x, velocity.z);
    motion.speed = speed;
    motion.intensity = Math.min(1, speed / MOVEMENT.runSpeed);
    motion.state =
      speed < MOVEMENT.idleSpeed
        ? "idle"
        : speed > MOVEMENT.runThreshold
          ? "run"
          : "walk";

    /* Turn toward travel. Under the threshold the heading is left alone, so
       coming to a stop keeps the visitor facing where they were going
       rather than snapping back to a default. */
    if (speed > MOVEMENT.idleSpeed) {
      const desired = Math.atan2(velocity.x, velocity.z);
      /* Shortest way round: without this, crossing ±π unwinds the long way. */
      const difference = Math.atan2(
        Math.sin(desired - yaw),
        Math.cos(desired - yaw),
      );
      yaw += difference * (1 - Math.exp(-MOVEMENT.turnRate * delta));
    }
  }

  return {
    position,
    velocity,
    motion,
    get yaw() {
      return yaw;
    },
    get seeking() {
      return seeking;
    },
    moveTo,
    step,
  };
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Owns the visitor's movement for as long as the world is mounted.
 *
 * The returned controller is a stable mutable object. It deliberately holds
 * no React state: position, velocity and heading change every frame, and
 * routing any of that through a re-render would cost a commit per frame to
 * produce a number that only `useFrame` ever reads.
 */
export function useCharacterController(): CharacterController {
  const input = useMovementInput();
  return useMemo(() => createCharacterController(input), [input]);
}
