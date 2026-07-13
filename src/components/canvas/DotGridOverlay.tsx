"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { dotGridOverlayFrag } from "./shaders";

// Vertex inline per the brief: vUv = uv; gl_Position = vec4(position, 1.0).
// (Production uses position.xy at z=0 on a [2,2] plane — equivalent for this fullscreen quad.)
const DOT_GRID_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// Theme-colored dot curtain (matches overlayColors=["#0F1111","#FBFAF4"]).
const DARK_COLOR = "#0F1111";
const LIGHT_COLOR = "#FBFAF4";

export type DotGridOverlayProps = {
  /** dark theme → #0F1111 dots, light → #FBFAF4 */
  dark: boolean;
  /** transition opacity 0..1 (drives the dot radius); default 1 */
  opacity?: number;
  /** dot cell size in px (main canvas uses 4) */
  pixelSize?: number;
  /** dot radius scale (default 0.9) */
  radiusScale?: number;
};

/**
 * Dot-grid / halftone curtain overlay used for section/route transitions.
 * A fullscreen <planeGeometry args={[2,2]}/> mesh with renderOrder 10.
 */
export function DotGridOverlay({
  dark,
  opacity = 1,
  pixelSize = 4,
  radiusScale = 0.9,
}: DotGridOverlayProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(dark ? DARK_COLOR : LIGHT_COLOR) },
      uOpacity: { value: opacity },
      uPixelSize: { value: pixelSize },
      uRadiusScale: { value: radiusScale },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    // create once; values pushed via effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Theme color (dark "#0F1111" / light "#FBFAF4").
  useEffect(() => {
    uniforms.uColor.value.set(dark ? DARK_COLOR : LIGHT_COLOR);
  }, [uniforms, dark]);

  // Viewport resolution in CSS px (matches the source: size.width/height).
  useEffect(() => {
    uniforms.uResolution.value.set(
      Math.max(1, size.width),
      Math.max(1, size.height),
    );
  }, [uniforms, size.width, size.height]);

  // Scalar transition params.
  useEffect(() => {
    uniforms.uOpacity.value = opacity;
    uniforms.uPixelSize.value = pixelSize;
    uniforms.uRadiusScale.value = radiusScale;
  }, [uniforms, opacity, pixelSize, radiusScale]);

  return (
    <mesh renderOrder={10} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={DOT_GRID_VERT}
        fragmentShader={dotGridOverlayFrag}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
