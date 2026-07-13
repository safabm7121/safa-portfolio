"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMergedGltf } from "./useMergedGltf";
import { warpStripesVert, warpStripesFrag } from "./shaders";

// Brand accent palette (verbatim from §2.2 / source constants cg, cv, cA).
const ACCENT = "#009dff"; // uAccentColor + uStripeColorA
const STRIPE_B = "#64c3ff"; // uStripeColorB

// Default uniforms for the warp-stripes material (verbatim defaults, 04-webgl.md §2.2).
function makeWarpUniforms() {
  return {
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    iTime: { value: 0 },
    uScrollDuration: { value: 2.0 },
    uOpacity: { value: 1.0 },
    uAccentColor: { value: new THREE.Color(ACCENT) },
    uStripeColorA: { value: new THREE.Color(ACCENT) },
    uStripeColorB: { value: new THREE.Color(STRIPE_B) },
    uStripeReveal: { value: 0.0 },
    uLight: { value: new THREE.Vector3(4, 9, 0.5) },
    uShininess: { value: 40.0 },
    uDiffuseness: { value: 0.1 },
    uSpecularStrength: { value: 1.2 },
    uFresnelPower: { value: 6.0 },
    uFresnelStrength: { value: 1.0 },
    uFresnelSideDir: { value: new THREE.Vector3(-1, 0.3, 1) },
  };
}

export type WarpStripesProps = {
  /** scroll-driven blue→black transition, 0..1 */
  stripeReveal?: number;
  /** model uniform scale (source default 0.1) */
  scale?: number;
  /** model rotation (radians) */
  rotation?: [number, number, number];
  /** time scroll-clamp window (uScrollDuration, default 2) */
  scrollDuration?: number;
  /** layer to render on (background scene defaults to 0) */
  layer?: number;
};

/**
 * Hyperspace "warp-speed" radial star streaks drawn on the merged cursor.glb
 * geometry. iTime advances every frame; uStripeReveal is scroll-driven (prop).
 */
export function WarpStripes({
  stripeReveal = 0,
  scale = 0.1,
  rotation = [0, 0, 0],
  scrollDuration = 2.0,
  layer,
}: WarpStripesProps) {
  const { geometry } = useMergedGltf("/model/cursor.glb");
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => makeWarpUniforms(), []);

  useEffect(() => {
    uniforms.uScrollDuration.value = scrollDuration;
  }, [uniforms, scrollDuration]);

  useEffect(() => {
    if (layer != null) meshRef.current?.layers.set(layer);
  }, [layer]);

  useFrame(({ gl }, dt) => {
    // advance time (clamped inside the shader to uScrollDuration)
    uniforms.iTime.value += dt;
    // iResolution = drawing-buffer px (width, height, 1)
    const s = gl.getDrawingBufferSize(new THREE.Vector2());
    uniforms.iResolution.value.set(Math.max(1, s.x), Math.max(1, s.y), 1);
    // scroll-driven reveal from prop
    uniforms.uStripeReveal.value = THREE.MathUtils.clamp(stripeReveal, 0, 1);
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      scale={scale}
      rotation={rotation}
      renderOrder={12}
      frustumCulled={false}
    >
      <shaderMaterial
        vertexShader={warpStripesVert}
        fragmentShader={warpStripesFrag}
        uniforms={uniforms}
        transparent
        depthTest
        depthWrite={false}
        toneMapped={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
