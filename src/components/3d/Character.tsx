"use client";

import { useEffect, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { easing } from "maath";
import type { Group } from "three";

import {
  CharacterRig,
  type CharacterRigHandle,
} from "@/components/3d/CharacterRig";
import { useCharacterController } from "@/hooks/useCharacterController";
import type { QualityProfile } from "@/hooks/useDeviceQuality";
import { boards, type BoardId } from "@/data/boards";
import {
  applyOrbitToOffset,
  cameraRig,
  captureOrbitFromOffset,
  FOLLOW_DISTANCE,
  FOLLOW_OFFSET,
} from "@/lib/three/cameraRig";
import { cameraLook, lookClickSuppressed } from "@/lib/three/cameraLook";
import { FIGURE } from "@/lib/three/layout";
import type { GalleryMaterials } from "@/lib/three/materials";
import { movementGate } from "@/lib/three/movementGate";
import { room } from "@/lib/three/palette";
import {
  createTelemetry,
  publishTelemetry,
  type WorldTelemetry,
} from "@/lib/three/telemetry";
import { useExperienceStore } from "@/store/experience";

/**
 * The visitor: controller, rig, proximity and camera hand-off in one place.
 *
 * Proximity is resolved here every frame against `boards[].interactionRadius`
 * and only written to the store when the active board actually changes —
 * never as a continuous stream of setState calls.
 */
export function Character({
  materials,
  quality,
}: {
  materials: GalleryMaterials;
  quality: QualityProfile;
}) {
  const group = useRef<Group>(null);
  const rig = useRef<CharacterRigHandle>(null);
  const controller = useCharacterController();
  const engaged = useRef(false);
  const lastBoard = useRef<BoardId | null>(null);

  const setActiveBoard = useExperienceStore((s) => s.setActiveBoard);

  const telemetry = useRef<WorldTelemetry | null>(null);
  useEffect(() => {
    telemetry.current = createTelemetry();
    const unpublish = publishTelemetry(telemetry.current);
    return () => {
      unpublish();
      telemetry.current = null;
    };
  }, []);

  useEffect(() => {
    const readout = telemetry.current;
    if (readout) readout.renders += 1;
  });

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);

    controller.step(delta, cameraRig.offset);

    if (group.current) {
      group.current.position.copy(controller.position);
      group.current.rotation.y = controller.yaw;
    }

    /* While a board owns the camera, leave the rig alone — GSAP is writing
       target and offset, and fighting it would tear the approach. */
    if (!movementGate.locked) {
      if (!engaged.current && controller.motion.speed > 0.05) {
        engaged.current = true;
      }
      if (engaged.current) {
        if (cameraLook.userHasLooked) {
          /* Keep the visitor's orbit; only pull in to follow distance. */
          easing.damp(cameraRig, "distance", FOLLOW_DISTANCE, 0.6, delta);
          applyOrbitToOffset();
        } else {
          easing.damp3(cameraRig.offset, FOLLOW_OFFSET, 0.6, delta);
          captureOrbitFromOffset();
        }
      } else if (cameraLook.userHasLooked) {
        applyOrbitToOffset();
      }

      cameraRig.target.set(
        controller.position.x,
        controller.position.y + FIGURE.eyeLine,
        controller.position.z,
      );

      /* Nearest board inside its own radius wins. */
      let nearest: BoardId | null = null;
      let nearestDist = Infinity;
      for (const board of boards) {
        const dx = controller.position.x - board.position[0];
        const dz = controller.position.z - board.position[2];
        const dist = Math.hypot(dx, dz);
        if (dist <= board.interactionRadius && dist < nearestDist) {
          nearest = board.id;
          nearestDist = dist;
        }
      }
      if (nearest !== lastBoard.current) {
        lastBoard.current = nearest;
        setActiveBoard(nearest);
      }
    }

    rig.current?.update(controller.motion);

    const readout = telemetry.current;
    if (readout) {
      const camera = state.camera;
      readout.x = controller.position.x;
      readout.y = controller.position.y;
      readout.z = controller.position.z;
      readout.yaw = controller.yaw;
      readout.speed = controller.motion.speed;
      readout.state = controller.motion.state;
      readout.seeking = controller.seeking;
      readout.cameraX = camera.position.x;
      readout.cameraY = camera.position.y;
      readout.cameraZ = camera.position.z;
      readout.cameraDistance = camera.position.distanceTo(cameraRig.target);
      readout.frames += 1;
    }
  }, -1);

  const onFloorClick = (event: ThreeEvent<MouseEvent>) => {
    if (movementGate.locked) return;
    if (lookClickSuppressed()) return;
    /* Touch exploration uses the joystick — a floor tap would fight it. */
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    if (event.intersections[0]?.object !== event.object) return;
    controller.moveTo(event.point.x, event.point.z);
  };

  return (
    <>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.004, 0]}
        onClick={onFloorClick}
      >
        <planeGeometry args={[room.width, room.depth]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>

      <group ref={group}>
        <CharacterRig ref={rig} materials={materials} quality={quality} />
      </group>
    </>
  );
}
