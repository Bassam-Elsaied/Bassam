"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  AnimationMixer,
  LoopRepeat,
  Mesh,
  type AnimationAction,
  type AnimationClip,
  type Group,
  type Material,
  type Object3D,
  type SkinnedMesh,
} from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

import type { QualityProfile } from "@/hooks/useDeviceQuality";
import {
  CROWD_MODELS,
  modelsForQuality,
  visitorsForQuality,
  walkAlong,
  type CrowdClip,
  type CrowdModelId,
  type CrowdVisitor,
  type CrowdWalk,
} from "@/data/crowd";
import { FIGURE } from "@/lib/three/layout";
import { setCrowdColliders } from "@/lib/three/crowdColliders";
import { playerPose } from "@/lib/three/playerPose";
import { type GalleryMaterials } from "@/lib/three/materials";
import { useExperienceStore } from "@/store/experience";

/** Authored Suit standing height — the other pack GLBs share this skeleton. */
const MODEL_HEIGHT = 1.856;
const MODEL_SCALE = FIGURE.height / MODEL_HEIGHT;

type CrowdPalette = {
  hair: keyof GalleryMaterials;
};

const PALETTES: readonly CrowdPalette[] = [
  { hair: "figureHair" },
  { hair: "figureHairBrown" },
  { hair: "figureHair" },
  { hair: "figureHairBlond" },
  { hair: "figureHairBrown" },
  { hair: "figureHair" },
];

const WEAPON_NAME = /pistol|sword|gun|weapon|rifle|knife|axe|bow|shield/i;

const GLANCE_NEAR = 2.5;
const GLANCE_STILL = 0.35;
const GLANCE_DWELL = 0.85;
const GLANCE_HOLD = 1.7;
const GLANCE_COOL = 6.5;

type GlanceState = {
  restYaw: number;
  x: number;
  z: number;
  yaw: number;
  dwell: number;
  look: number;
  cool: number;
};

type MixerEntry = {
  mixer: AnimationMixer;
  walk?: CrowdWalk;
  group: Group;
  elapsed: number;
  walkAction?: AnimationAction;
  idleAction?: AnimationAction;
  moving: boolean;
  glance?: GlanceState;
};

/**
 * Starts loading only after the studio is already exploring so the crowd
 * never competes with the gallery / player GLBs on first paint.
 */
export function CrowdMount({
  materials,
  quality,
}: {
  materials: GalleryMaterials;
  quality: QualityProfile;
}) {
  const exploring = useExperienceStore((state) => state.mode === "exploring");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!exploring) {
      setAllowed(false);
      return;
    }

    const start = () => setAllowed(true);
    if (typeof window.requestIdleCallback === "function") {
      const idle = window.requestIdleCallback(start, { timeout: 1600 });
      return () => window.cancelIdleCallback(idle);
    }
    const timeout = window.setTimeout(start, 400);
    return () => window.clearTimeout(timeout);
  }, [exploring]);

  if (!allowed) return null;

  return (
    <Suspense fallback={null}>
      <Crowd materials={materials} quality={quality} />
    </Suspense>
  );
}

function Crowd({
  materials,
  quality,
}: {
  materials: GalleryMaterials;
  quality: QualityProfile;
}) {
  const visitors = useMemo(
    () => visitorsForQuality(quality.quality),
    [quality.quality],
  );
  const models = useMemo(
    () => modelsForQuality(quality.quality),
    [quality.quality],
  );
  const mixers = useRef<MixerEntry[]>([]);

  useEffect(() => {
    setCrowdColliders(
      visitors
        .filter((visitor) => !visitor.walk)
        .map((visitor) => ({
          x: visitor.x,
          z: visitor.z,
          yaw: visitor.yaw,
        })),
    );
    return () => setCrowdColliders([]);
  }, [visitors]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    for (const entry of mixers.current) {
      if (entry.walk && !quality.reducedMotion) {
        entry.elapsed += delta;
        const pose = walkAlong(entry.walk, entry.elapsed);
        entry.group.position.x = pose.x;
        entry.group.position.z = pose.z;
        entry.group.rotation.y = pose.yaw;
        if (pose.moving !== entry.moving) {
          entry.moving = pose.moving;
          const next = pose.moving ? entry.walkAction : entry.idleAction;
          const prev = pose.moving ? entry.idleAction : entry.walkAction;
          if (next) {
            next.reset().setEffectiveWeight(1);
            if (prev && prev !== next) {
              prev.fadeOut(0.2);
              next.fadeIn(0.2).play();
            } else {
              next.fadeIn(0.12).play();
            }
          }
        }
      }
      entry.mixer.update(delta);
    }
    stepGlance(mixers.current, delta, quality.reducedMotion);
  });

  return (
    <group name="crowd">
      {models.map((id) => (
        <CrowdPack
          key={id}
          id={id}
          visitors={visitors.filter((visitor) => visitor.model === id)}
          materials={materials}
          quality={quality}
          mixers={mixers}
        />
      ))}
    </group>
  );
}

function CrowdPack({
  id,
  visitors,
  materials,
  quality,
  mixers,
}: {
  id: CrowdModelId;
  visitors: CrowdVisitor[];
  materials: GalleryMaterials;
  quality: QualityProfile;
  mixers: MutableRefObject<MixerEntry[]>;
}) {
  const gltf = useGLTF(CROWD_MODELS[id]);
  const clips = useMemo(() => {
    const copied = gltf.animations.map((clip) => clip.clone());
    neutralizeRootMotion(copied);
    return copied;
  }, [gltf.animations]);

  useLayoutEffect(() => {
    stripWeapons(gltf.scene);
  }, [gltf.scene]);

  return (
    <>
      {visitors.map((visitor) => (
        <CrowdPerson
          key={visitor.id}
          source={gltf.scene}
          clips={clips}
          visitor={visitor}
          materials={materials}
          quality={quality}
          mixers={mixers}
        />
      ))}
    </>
  );
}

function CrowdPerson({
  source,
  clips,
  visitor,
  materials,
  quality,
  mixers,
}: {
  source: Object3D;
  clips: AnimationClip[];
  visitor: CrowdVisitor;
  materials: GalleryMaterials;
  quality: QualityProfile;
  mixers: MutableRefObject<MixerEntry[]>;
}) {
  const group = useRef<Group>(null);
  const scene = useMemo(() => {
    const cloned = cloneSkinned(source);
    stripWeapons(cloned);
    return cloned;
  }, [source]);

  useEffect(() => {
    styleCrowd(scene, materials, quality, visitor.palette);
  }, [scene, materials, quality, visitor.palette]);

  useEffect(() => {
    const root = group.current;
    if (!root) return;

    const mixer = new AnimationMixer(scene);
    const seed = hashId(visitor.id);
    const elapsed = visitor.walk ? seed * 48 : 0;
    const moving = visitor.walk
      ? walkAlong(visitor.walk, elapsed).moving
      : false;

    if (visitor.walk) {
      const pose = walkAlong(visitor.walk, elapsed);
      root.position.set(pose.x, 0, pose.z);
      root.rotation.y = pose.yaw;
    }

    const idleClip =
      pickClip(clips, visitor.walk ? "Idle" : visitor.clip) ??
      pickClip(clips, "Idle");
    const walkClip = pickClip(clips, "Walk");

    const idleAction = idleClip ? mixer.clipAction(idleClip) : undefined;
    const walkAction = walkClip ? mixer.clipAction(walkClip) : undefined;

    const start = visitor.walk && moving ? walkAction : idleAction;
    if (idleAction) {
      idleAction.enabled = true;
      idleAction.setLoop(LoopRepeat, Infinity);
      idleAction.time = seed * (idleClip?.duration ?? 1);
    }
    if (walkAction) {
      walkAction.enabled = true;
      walkAction.setLoop(LoopRepeat, Infinity);
      walkAction.time = seed * (walkClip?.duration ?? 1);
      walkAction.setEffectiveTimeScale(
        quality.reducedMotion ? 0 : 0.88 + seed * 0.16,
      );
    }
    if (start) {
      start.setEffectiveTimeScale(
        quality.reducedMotion
          ? 0
          : visitor.walk && moving
            ? 0.88 + seed * 0.16
            : 0.82 + seed * 0.28,
      );
      start.play();
    }

    const entry: MixerEntry = {
      mixer,
      walk: visitor.walk,
      group: root,
      elapsed,
      walkAction,
      idleAction,
      moving,
      glance: visitor.glance
        ? {
            restYaw: visitor.yaw,
            x: visitor.x,
            z: visitor.z,
            yaw: visitor.yaw,
            dwell: 0,
            look: 0,
            cool: 0,
          }
        : undefined,
    };
    mixers.current.push(entry);

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      mixers.current = mixers.current.filter((item) => item !== entry);
    };
  }, [scene, clips, visitor, quality.reducedMotion, mixers]);

  return (
    <group
      ref={group}
      position={[visitor.x, 0, visitor.z]}
      rotation-y={visitor.yaw}
      scale={MODEL_SCALE}
    >
      <primitive object={scene} />
    </group>
  );
}

function pickClip(
  clips: AnimationClip[],
  wanted: CrowdClip,
): AnimationClip | undefined {
  return (
    clips.find((clip) => clip.name === wanted) ??
    clips.find((clip) => clip.name === "Idle") ??
    clips[0]
  );
}

/** Hide any prop weapons baked into the Quaternius Suit GLB. */
function stripWeapons(scene: Object3D) {
  const remove: Object3D[] = [];
  scene.traverse((obj) => {
    if (WEAPON_NAME.test(obj.name)) remove.push(obj);
  });
  for (const obj of remove) {
    obj.visible = false;
    obj.traverse((child) => {
      child.visible = false;
    });
    obj.removeFromParent();
  }
}

function neutralizeRootMotion(clips: AnimationClip[]) {
  for (const clip of clips) {
    for (const track of clip.tracks) {
      const isBodyPos =
        track.name === "Body.position" || track.name.endsWith("/Body.position");
      if (!isBodyPos) continue;
      const values = track.values;
      for (let i = 0; i < values.length; i += 3) {
        values[i] = 0;
        values[i + 2] = 0;
      }
    }
  }
}

function styleCrowd(
  scene: Object3D,
  materials: GalleryMaterials,
  quality: QualityProfile,
  paletteIndex: number,
) {
  const palette = PALETTES[paletteIndex % PALETTES.length];
  const receive = quality.quality !== "low";

  scene.traverse((obj) => {
    const mesh = obj as Mesh | SkinnedMesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = false;
    mesh.receiveShadow = receive;
    mesh.frustumCulled = true;
    mesh.raycast = () => null;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const mapped = mats.map((mat) => mapCrowdMaterial(mat, materials, palette));
    mesh.material = Array.isArray(mesh.material) ? mapped : mapped[0];
  });
}

function mapCrowdMaterial(
  mat: Material,
  materials: GalleryMaterials,
  palette: CrowdPalette,
) {
  const key = mat.name.toLowerCase();

  if (key.includes("skin")) return materials.figureSkin;
  if (key.includes("blond")) return materials.figureHairBlond;
  if (key.includes("hair_brown") || key.includes("hair brown")) {
    return materials.figureHairBrown;
  }
  if (key.includes("hair") || key.includes("eyebrow") || key.includes("eye")) {
    return materials[palette.hair];
  }

  /* Keep the pack's ready-made outfit colours (hoodie, jeans, jacket…). */
  const clone = mat.clone();
  if ("roughness" in clone && typeof clone.roughness === "number") {
    clone.roughness = Math.max(clone.roughness, 0.78);
  }
  if ("metalness" in clone && typeof clone.metalness === "number") {
    clone.metalness = Math.min(clone.metalness, 0.06);
  }
  return clone;
}

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function shortestDelta(from: number, to: number) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  return current + shortestDelta(current, target) * (1 - Math.exp(-lambda * dt));
}

function stepGlance(
  entries: MixerEntry[],
  delta: number,
  reducedMotion: boolean,
) {
  let pick: MixerEntry | null = null;
  let best = GLANCE_NEAR;
  if (!reducedMotion && playerPose.speed < GLANCE_STILL) {
    for (const entry of entries) {
      const glance = entry.glance;
      if (!glance) continue;
      const dist = Math.hypot(
        playerPose.x - glance.x,
        playerPose.z - glance.z,
      );
      if (dist < best) {
        best = dist;
        pick = entry;
      }
    }
  }

  for (const entry of entries) {
    const glance = entry.glance;
    if (!glance) continue;

    if (entry === pick && glance.cool <= 0) {
      glance.dwell += delta;
      if (glance.dwell >= GLANCE_DWELL) {
        glance.look += delta;
        const toward = Math.atan2(
          playerPose.x - glance.x,
          playerPose.z - glance.z,
        );
        glance.yaw = dampAngle(glance.yaw, toward, 5.5, delta);
        if (glance.look >= GLANCE_HOLD) {
          glance.cool = GLANCE_COOL;
          glance.dwell = 0;
          glance.look = 0;
        }
      }
    } else {
      glance.dwell = 0;
      glance.look = 0;
      if (glance.cool > 0) glance.cool -= delta;
      glance.yaw = dampAngle(glance.yaw, glance.restYaw, 4.2, delta);
    }

    entry.group.rotation.y = glance.yaw;
  }
}

