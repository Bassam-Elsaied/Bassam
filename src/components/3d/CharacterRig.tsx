"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from "react";
import { useGLTF } from "@react-three/drei";
import {
  AnimationMixer,
  LoopRepeat,
  type AnimationAction,
  type AnimationClip,
  type Group,
  type Mesh,
  type Object3D,
  type SkinnedMesh,
} from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

import type { CharacterMotion, CharacterState } from "@/hooks/useCharacterController";
import type { QualityProfile } from "@/hooks/useDeviceQuality";
import { FIGURE } from "@/lib/three/layout";
import type { GalleryMaterials } from "@/lib/three/materials";

/**
 * Contract between movement and appearance. Controllers call `update`
 * imperatively — never via React props — so the tree does not re-render
 * sixty times a second.
 */
export type CharacterRigHandle = {
  update: (motion: CharacterMotion) => void;
};

const MODEL_URL = "/models/character/character.glb";

/** Model standing height from the authored Suit GLB bbox (~1.856). */
const MODEL_HEIGHT = 1.856;
const MODEL_SCALE = FIGURE.height / MODEL_HEIGHT;

/**
 * Clip names from Quaternius Ultimate Modular Men (Suit).
 * Inspected from the GLB — do not invent fallbacks.
 */
const CLIP_BY_STATE: Record<CharacterState, string> = {
  idle: "Idle",
  walk: "Walk",
  run: "Run",
};

type CharacterRigProps = {
  materials: GalleryMaterials;
  quality: QualityProfile;
  ref?: Ref<CharacterRigHandle>;
};

/**
 * Gallery visitor — Quaternius Suit GLB (Ultimate Modular Men).
 *
 * Classic charcoal jacket, bone shirt, ink trousers. Weapons stripped.
 * The controller owns world position and yaw; this rig owns silhouette
 * and skeletal animation via AnimationMixer.
 */
export function CharacterRig({ materials, quality, ref }: CharacterRigProps) {
  const gltf = useGLTF(MODEL_URL);
  const root = useRef<Group>(null);
  const mixer = useRef<AnimationMixer | null>(null);
  const actions = useRef<Partial<Record<CharacterState, AnimationAction>>>({});
  const active = useRef<CharacterState>("idle");

  const scene = useMemo(() => {
    const cloned = cloneSkinned(gltf.scene);
    stripWeapons(cloned);
    styleCharacter(cloned, materials, quality);
    return cloned;
  }, [gltf.scene, materials, quality]);

  const clips = useMemo(() => {
    const copied = gltf.animations.map((clip) => clip.clone());
    neutralizeRootMotion(copied);
    return copied;
  }, [gltf.animations]);

  useEffect(() => {
    const nextMixer = new AnimationMixer(scene);
    mixer.current = nextMixer;

    const byName = Object.fromEntries(clips.map((clip) => [clip.name, clip])) as Record<
      string,
      AnimationClip
    >;

    (Object.keys(CLIP_BY_STATE) as CharacterState[]).forEach((state) => {
      const clip = byName[CLIP_BY_STATE[state]];
      if (!clip) return;
      const action = nextMixer.clipAction(clip);
      action.enabled = true;
      action.setLoop(LoopRepeat, Infinity);
      action.clampWhenFinished = false;
      actions.current[state] = action;
    });

    const idle = actions.current.idle;
    if (idle) {
      idle.reset().fadeIn(0.2).play();
      active.current = "idle";
    }

    return () => {
      nextMixer.stopAllAction();
      nextMixer.uncacheRoot(scene);
      mixer.current = null;
      actions.current = {};
    };
  }, [scene, clips]);

  useImperativeHandle(ref, () => ({
    update(motion: CharacterMotion) {
      const mix = mixer.current;
      if (!mix) return;

      if (motion.state !== active.current) {
        const next = actions.current[motion.state];
        const prev = actions.current[active.current];
        if (next) {
          next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
          if (prev && prev !== next) {
            prev.fadeOut(0.18);
            next.fadeIn(0.18).play();
          } else {
            next.fadeIn(0.12).play();
          }
          active.current = motion.state;
        }
      }

      const current = actions.current[active.current];
      if (current) {
        const pace =
          motion.state === "idle"
            ? 1
            : motion.state === "walk"
              ? 0.95 + motion.intensity * 0.15
              : 0.9 + motion.intensity * 0.2;
        current.setEffectiveTimeScale(pace);
      }

      mix.update(motion.delta);
    },
  }));

  return (
    <group ref={root} scale={MODEL_SCALE}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

/** Zero planar translation on the Body bone so the controller owns world XZ. */
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

const WEAPON_NAME = /pistol|sword|gun|weapon|rifle|knife|axe|bow|shield/i;

/** Hide any prop weapons baked into the Quaternius Suit GLB. */
function stripWeapons(scene: Object3D) {
  const remove: Object3D[] = [];
  scene.traverse((obj) => {
    if (WEAPON_NAME.test(obj.name)) remove.push(obj);
  });
  for (const obj of remove) {
    obj.visible = false;
    obj.removeFromParent();
  }
}

function styleCharacter(
  scene: Object3D,
  materials: GalleryMaterials,
  quality: QualityProfile,
) {
  const cast = quality.shadows;
  const receive = quality.quality !== "low";

  scene.traverse((obj) => {
    const mesh = obj as Mesh | SkinnedMesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mesh.frustumCulled = true;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const mapped = mats.map((mat) => mapMaterial(mat?.name ?? "", materials));
    mesh.material = Array.isArray(mesh.material) ? mapped : mapped[0];
  });
}

/**
 * Classic tailored palette:
 * charcoal jacket, bone shirt, ink trousers/shoes, warm-grey tie.
 */
function mapMaterial(name: string, materials: GalleryMaterials) {
  const key = name.toLowerCase();
  if (key.includes("skin")) return materials.figureSkin;
  if (key.includes("hair") || key.includes("eyebrow")) return materials.figureHair;
  if (key.includes("eye")) return materials.figureHair;
  if (key.includes("tie")) return materials.figureGrey;
  if (key.includes("white") || key.includes("shirt")) return materials.figureBone;
  /* Jacket cloth — charcoal, not bone-white. */
  if (key === "suit" || key.includes("suit")) return materials.figureCloth;
  if (key.includes("black") || key.includes("darkbrown")) return materials.figureCloth;
  if (key.includes("grey") || key.includes("gray")) return materials.figureGrey;
  if (key.includes("red") || key.includes("accent")) return materials.figureAccent;
  return materials.figureGrey;
}
