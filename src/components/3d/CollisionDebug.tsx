"use client";

import { useMemo } from "react";

import { OBSTACLES } from "@/lib/three/layout";
import { ENVIRONMENT_PROXIES } from "@/lib/three/environmentCollision";

/**
 * Translucent collision proxies for `?debug=world`.
 * Never mounts in production builds without the debug query.
 */
export function CollisionDebug() {
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("debug");
  }, []);

  if (!enabled) return null;

  return (
    <group name="collision-debug">
      {ENVIRONMENT_PROXIES.map((proxy) => (
        <mesh
          key={proxy.id}
          position={[proxy.x, proxy.height / 2, proxy.z]}
          rotation={[0, proxy.rotationY, 0]}
          raycast={() => null}
        >
          <boxGeometry args={[proxy.width, proxy.height, proxy.depth]} />
          <meshBasicMaterial
            color={proxy.id.startsWith("wall") ? "#4a9eff" : "#ff8a3d"}
            transparent
            opacity={0.28}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Board partitions share OBSTACLES but are not in ENVIRONMENT_PROXIES —
          draw the remaining boxes so debug matches the live collider list. */}
      {OBSTACLES.slice(ENVIRONMENT_PROXIES.length).map((box, index) => (
        <mesh
          key={`board-${index}`}
          position={[box.x, box.height / 2, box.z]}
          rotation={[0, box.rotationY, 0]}
          raycast={() => null}
        >
          <boxGeometry
            args={[box.halfWidth * 2, box.height, box.halfDepth * 2]}
          />
          <meshBasicMaterial
            color="#c44dff"
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
