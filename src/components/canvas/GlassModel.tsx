"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMergedGltf } from "./useMergedGltf";
import { makeDispersionUniforms } from "./dispersionUniforms";
import { dispersionVert, dispersionFrag } from "./shaders";

export type TintConfig = {
  a: [number, number, number, number];
  b: [number, number, number, number];
  mix?: number;
  dark?: number;
};

export function GlassModel({
  url,
  scale = 1,
  layer = 10,
  tint,
  fbo,
  rotation = [0, 0, 0],
  recomputeNormals = false,
  brightness = 1,
}: {
  url: string;
  scale?: number;
  layer?: number;
  tint?: TintConfig;
  fbo: THREE.WebGLRenderTarget;
  rotation?: [number, number, number];
  recomputeNormals?: boolean;
  brightness?: number;
}) {
  const { geometry, localYRange } = useMergedGltf(url, recomputeNormals);
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => makeDispersionUniforms(), []);

  useEffect(() => {
    meshRef.current?.layers.set(layer);
  }, [layer]);

  // IMPORTANT: drive uniforms through the material ref. R3F snapshots the `uniforms`
  // prop at material creation, so mutating the useMemo'd object does NOT reach the GPU
  // (this was why the glass rendered black — uTexture stayed null).
  useEffect(() => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    u.uTintLocalYRange.value.copy(localYRange);
    u.uBrightness.value = brightness;
    if (tint) {
      u.uTintEnabled.value = 1;
      u.uTintColorA.value.set(...tint.a);
      u.uTintColorB.value.set(...tint.b);
      u.uTintMix.value = tint.mix ?? 0.8;
      u.uDark.value = tint.dark ?? 0;
    } else {
      u.uTintEnabled.value = 0;
    }
  }, [localYRange, brightness, tint]);

  useFrame(({ gl }) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    u.uTexture.value = fbo.texture;
    const s = gl.getDrawingBufferSize(new THREE.Vector2());
    u.uScreenResolutionPx.value.set(s.x, s.y);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} scale={scale} rotation={rotation}>
      <shaderMaterial
        ref={matRef}
        vertexShader={dispersionVert}
        fragmentShader={dispersionFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
