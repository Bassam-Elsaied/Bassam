"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { BufferAttribute, Points } from "three";

import type { QualityProfile } from "@/hooks/useDeviceQuality";
import { useRadialTexture } from "@/lib/three/materials";
import { palette } from "@/lib/three/palette";

const FIELD = { x: 11, z: 22, floor: 0.25, ceiling: 7.4 };

/**
 * Deterministic pseudo-random value in [0, 1) for mote `index` on channel
 * `salt`. A pure hash rather than `Math.random`, so the dust layout is
 * identical on every mount and the memo has no hidden side effects.
 */
function hash(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Dust hanging in the light.
 *
 * Positions live in a Float32Array that is mutated in place each frame and
 * flagged dirty — no React state is involved, so the component renders
 * exactly once regardless of how long the scene is open.
 *
 * The count is small by design. Dust should register as atmosphere at the
 * edge of attention; once you can count the specks it has become noise.
 */
export function Particles({ quality }: { quality: QualityProfile }) {
  const pointsRef = useRef<Points>(null);
  const sprite = useRadialTexture(64);
  const count = quality.particleCount;

  const { positions, motion } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    /* Per-mote rise speed, sway frequency and phase. */
    const motion = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;

      /* Biased into sunlight: right-hand aperture shafts and the central
         oculus column — dust should catch light, not fill the dark. */
      const inOculus = hash(i, 7) > 0.55;
      if (inOculus) {
        positions[i3] = 2.5 + (hash(i, 1) - 0.5) * 6.5;
        positions[i3 + 2] = -4.5 + (hash(i, 3) - 0.5) * 6.5;
      } else {
        positions[i3] = (hash(i, 1) - 0.22) * FIELD.x;
        positions[i3 + 2] = (hash(i, 3) - 0.55) * FIELD.z;
      }
      positions[i3 + 1] =
        FIELD.floor + hash(i, 2) * (FIELD.ceiling - FIELD.floor);

      motion[i3] = 0.035 + hash(i, 4) * 0.075;
      motion[i3 + 1] = 0.15 + hash(i, 5) * 0.35;
      motion[i3 + 2] = hash(i, 6) * Math.PI * 2;
    }

    return { positions, motion };
  }, [count]);

  useFrame((state, delta) => {
    if (quality.reducedMotion) return;

    const geometry = pointsRef.current?.geometry;
    if (!geometry) return;

    const attribute = geometry.getAttribute("position") as BufferAttribute;
    const array = attribute.array as Float32Array;
    const time = state.clock.elapsedTime;

    /* Clamp the step so a backgrounded tab does not teleport every mote
       to the ceiling the moment it becomes visible again. */
    const step = Math.min(delta, 0.05);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;

      array[i3 + 1] += motion[i3] * step;
      array[i3] += Math.sin(time * motion[i3 + 1] + motion[i3 + 2]) * step * 0.09;

      if (array[i3 + 1] > FIELD.ceiling) {
        array[i3 + 1] = FIELD.floor;
      }
    }

    attribute.needsUpdate = true;
  });

  if (count === 0 || !sprite) return null;

  return (
    /* Dust hangs between the camera and the room, so it is excluded from
       picking — a mote should never be what a click lands on. */
    <points ref={pointsRef} frustumCulled={false} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        color={palette.dust}
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
