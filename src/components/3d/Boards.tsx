"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Color, type Group, type Mesh, type MeshStandardMaterial } from "three";
import { useRouter } from "next/navigation";

import { boards, type Board } from "@/data/boards";
import type { QualityProfile } from "@/hooks/useDeviceQuality";
import { boardFaces } from "@/lib/three/boardFaces";
import { useBoardFaceTexture } from "@/lib/three/boardTexture";
import { PARTITION } from "@/lib/three/layout";
import type { GalleryMaterials } from "@/lib/three/materials";
import { movementGate } from "@/lib/three/movementGate";
import { lookClickSuppressed } from "@/lib/three/cameraLook";
import { navigateToBoard } from "@/lib/three/navigateToBoard";
import { palette } from "@/lib/three/palette";
import { playTransitionOverlay } from "@/lib/three/transitionBridge";
import { useExperienceStore } from "@/store/experience";

const FRAME_MARGIN = 0.2;

type BoardsProps = {
  materials: GalleryMaterials;
  quality: QualityProfile;
};

export function Boards({ materials, quality }: BoardsProps) {
  return (
    <group>
      {boards.map((board) => (
        <InteractiveBoard
          key={board.id}
          board={board}
          materials={materials}
          quality={quality}
        />
      ))}
    </group>
  );
}

function InteractiveBoard({
  board,
  materials,
  quality,
}: {
  board: Board;
  materials: GalleryMaterials;
  quality: QualityProfile;
}) {
  const router = useRouter();
  const active = useExperienceStore((s) => s.activeBoardId === board.id);
  const interacting = useExperienceStore(
    (s) =>
      (s.mode === "interacting" || s.mode === "transitioning") &&
      s.activeBoardId === board.id,
  );
  const face = boardFaces[board.id];
  const texture = useBoardFaceTexture(
    face,
    quality.quality === "low" ? "lite" : "full",
  );

  const root = useRef<Group>(null);
  const rimRef = useRef<Mesh>(null);
  const emphasis = useRef(0);
  const wantedRef = useRef(0);

  useEffect(() => {
    wantedRef.current = interacting ? 1 : active ? 0.55 : 0;
  }, [active, interacting]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      emphasis.current = wantedRef.current;
    } else {
      emphasis.current +=
        (wantedRef.current - emphasis.current) *
        (1 - Math.exp(-delta / 0.18));
    }

    if (root.current) {
      root.current.scale.setScalar(
        reduced ? 1 : 1 + emphasis.current * 0.028,
      );
    }

    const rim = rimRef.current?.material as MeshStandardMaterial | undefined;
    if (rim) {
      rim.opacity = 0.05 + emphasis.current * 0.65;
      rim.emissiveIntensity = 0.08 + emphasis.current * 0.48;
    }
  });

  const [width, height] = board.size;
  const [x, faceHeight, z] = board.position;
  const frameWidth = width + FRAME_MARGIN;
  const frameHeight = height + FRAME_MARGIN;
  const faceZ = PARTITION.depth / 2;
  const detailed = quality.quality !== "low";

  const accent = useMemo(() => new Color(board.accent), [board.accent]);

  const onBoardClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (movementGate.locked) return;
    if (lookClickSuppressed()) return;
    void navigateToBoard(board.id, router, {
      playOverlay: playTransitionOverlay,
    });
  };

  return (
    <group
      ref={root}
      position={[x, 0, z]}
      rotation-y={board.rotationY}
      name={`board-${board.id}`}
      userData={{ boardId: board.id, route: board.route }}
      onClick={onBoardClick}
      onPointerOver={() => {
        if (!movementGate.locked) document.body.dataset.cursor = "board";
      }}
      onPointerOut={() => {
        if (document.body.dataset.cursor === "board") {
          delete document.body.dataset.cursor;
        }
      }}
    >
      {/* Partition mass — collision still uses PARTITION dimensions */}
      <mesh
        position={[0, PARTITION.height / 2, 0]}
        castShadow={quality.shadows}
        receiveShadow
      >
        <boxGeometry
          args={[PARTITION.width, PARTITION.height, PARTITION.depth]}
        />
        <primitive object={materials.concrete} attach="material" />
      </mesh>

      {/* Floor footing — exhibition wall feels planted */}
      {detailed ? (
        <mesh
          position={[0, 0.12, 0.02]}
          castShadow={quality.shadows}
          receiveShadow
          raycast={() => null}
        >
          <boxGeometry args={[PARTITION.width + 0.55, 0.24, 0.7]} />
          <primitive object={materials.concreteMid} attach="material" />
        </mesh>
      ) : null}

      {/* Side returns — exhibition wall thickness */}
      {detailed
        ? [-1, 1].map((side) => (
            <mesh
              key={side}
              position={[
                side * (PARTITION.width / 2 + 0.14),
                PARTITION.height / 2,
                -0.06,
              ]}
              castShadow={quality.shadows}
              receiveShadow
            >
              <boxGeometry args={[0.28, PARTITION.height, 0.62]} />
              <primitive object={materials.concreteCool} attach="material" />
            </mesh>
          ))
        : null}

      {/* Rear spine beam */}
      {detailed ? (
        <mesh
          position={[0, PARTITION.height / 2, -PARTITION.depth / 2 - 0.08]}
          castShadow={quality.shadows}
          raycast={() => null}
        >
          <boxGeometry args={[PARTITION.width * 0.72, 0.22, 0.16]} />
          <primitive object={materials.metal} attach="material" />
        </mesh>
      ) : null}

      {/* Dark mat behind the frame */}
      <mesh position={[0, faceHeight, faceZ + 0.02]} raycast={() => null}>
        <boxGeometry args={[frameWidth + 0.28, frameHeight + 0.28, 0.05]} />
        <primitive object={materials.frame} attach="material" />
      </mesh>

      {/* Outer frame */}
      <mesh
        position={[0, faceHeight, faceZ + 0.055]}
        castShadow={quality.shadows}
      >
        <boxGeometry args={[frameWidth, frameHeight, 0.08]} />
        <primitive object={materials.frame} attach="material" />
      </mesh>

      {/* Inner reveal */}
      {detailed ? (
        <mesh
          position={[0, faceHeight, faceZ + 0.07]}
          raycast={() => null}
        >
          <boxGeometry args={[width + 0.06, height + 0.06, 0.03]} />
          <primitive object={materials.concreteCool} attach="material" />
        </mesh>
      ) : null}

      {/* Interaction rim */}
      <mesh
        ref={rimRef}
        position={[0, faceHeight, faceZ + 0.015]}
        raycast={() => null}
      >
        <boxGeometry args={[frameWidth + 0.14, frameHeight + 0.14, 0.02]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.1}
          roughness={0.55}
          metalness={0}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Artwork face */}
      <mesh position={[0, faceHeight, faceZ + 0.1]}>
        <boxGeometry args={[width, height, 0.045]} />
        <meshStandardMaterial
          map={texture}
          color={texture ? "#ffffff" : palette.panel}
          roughness={0.78}
          metalness={0}
        />
      </mesh>

      {/* Index caption plate — tiny vermilion only */}
      {detailed ? (
        <group
          position={[
            frameWidth / 2 + 0.36,
            faceHeight - frameHeight / 2 + 0.1,
            faceZ + 0.04,
          ]}
        >
          <mesh raycast={() => null}>
            <boxGeometry args={[0.42, 0.16, 0.035]} />
            <primitive object={materials.accent} attach="material" />
          </mesh>
        </group>
      ) : null}

      {/* Shelf under the frame */}
      {detailed ? (
        <mesh
          position={[0, faceHeight - frameHeight / 2 - 0.09, faceZ + 0.14]}
          castShadow={quality.shadows}
          raycast={() => null}
        >
          <boxGeometry args={[frameWidth * 0.94, 0.05, 0.26]} />
          <primitive object={materials.concreteLight} attach="material" />
        </mesh>
      ) : null}

      {/* Ceiling hanger stub — reads as installed, not floating */}
      {detailed ? (
        <mesh
          position={[0, PARTITION.height - 0.15, faceZ + 0.02]}
          raycast={() => null}
        >
          <boxGeometry args={[0.55, 0.08, 0.12]} />
          <primitive object={materials.metal} attach="material" />
        </mesh>
      ) : null}
    </group>
  );
}
