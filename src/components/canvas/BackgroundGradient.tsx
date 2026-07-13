"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEnv } from "@/components/providers/LenisScroll";

/**
 * Scroll-driven background the glass refracts (and the visible page backdrop).
 * Production's background changes per section: bright sky + caustics over the
 * hero and footer ("sky zones"), fading to the flat page colour through the
 * work / innovate middle. We model that with a sky-amount that follows scroll.
 */
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uGlow;
  uniform float uCaustic;   // 0..1 strength of the sunlight caustics
  uniform float uAspect;
  uniform float uTime;
  // bold, wavy diagonal sunlight caustic bands (sunlight-through-water), slowly drifting
  float caustic(vec2 uv){
    vec2 p = uv; p.x *= uAspect;
    float warp = sin(p.y * 7.0 + uTime * 0.25) * 0.06 + sin(p.x * 5.0 - uTime * 0.2) * 0.04;
    float d1 = (p.x + warp) * 1.0 + p.y * 0.82;   // main diagonal
    float d2 = (p.x - warp) * 1.3 - p.y * 0.45;   // crossing diagonal
    float c = 0.0;
    c += smoothstep(0.58, 0.96, sin(d1 * 11.0 + uTime * 0.35) * 0.5 + 0.5);
    c += smoothstep(0.68, 1.0, sin(d1 * 18.0 + 1.7 - uTime * 0.28) * 0.5 + 0.5) * 0.85;
    c += smoothstep(0.72, 1.0, sin(d2 * 8.0 + 0.4 + uTime * 0.22) * 0.5 + 0.5) * 0.75;
    c += smoothstep(0.80, 1.0, sin(d2 * 15.0 + 3.1) * 0.5 + 0.5) * 0.5;
    return c;
  }
  void main(){
    vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
    // broad sun glow from the upper area
    float g = smoothstep(1.25, 0.1, distance(vUv, vec2(0.6, 0.85)));
    col = mix(col, uGlow, g * 0.6 * max(uCaustic, 0.15));
    // bold caustic streaks, brighter toward the sun, present across the whole sky
    float streaks = caustic(vUv) * (0.45 + 0.9 * g) * uCaustic;
    col = mix(col, uGlow, clamp(streaks, 0.0, 0.92));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// theme palettes — saturated sky blue (the glass refracts this; a too-white sky → pale glass)
const SKY = {
  light: { top: "#a9d0ff", bottom: "#5e9cf0", glow: "#e6f1ff" },
  // dark = deep navy hero (was too bright/periwinkle); muted glow so it stays dark
  dark: { top: "#091333", bottom: "#132a67", glow: "#1d3577" },
};
const PAGE = { light: "#fbfaf4", dark: "#0f1111" };

// sky strength along scroll progress (0=hero … 1=footer)
function skyAmount(p: number): number {
  if (p < 0.08) return 1; // hero
  if (p < 0.5) return 1 - (p - 0.08) / 0.12; // hero → work
  if (p < 0.8) return 0; // work + innovate (flat / warp covers)
  if (p < 0.9) return (p - 0.78) / 0.12; // → footer
  return 1; // footer
}

export function BackgroundGradient({ dark, layer = 0 }: { dark: boolean; layer?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uCaustic: { value: 1 },
      uAspect: { value: 1.6 },
      uTime: { value: 0 },
    }),
    [],
  );

  const palette = useMemo(() => {
    const sky = dark ? SKY.dark : SKY.light;
    return {
      top: new THREE.Color(sky.top),
      bottom: new THREE.Color(sky.bottom),
      glow: new THREE.Color(sky.glow),
      page: new THREE.Color(dark ? PAGE.dark : PAGE.light),
    };
  }, [dark]);

  useEffect(() => {
    meshRef.current?.layers.set(layer);
  }, [layer]);

  useFrame(({ size, clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    const max = Math.max(1, (scrollEnv.getContainerEl()?.scrollHeight ?? 0) - (scrollEnv.getViewportHeightPx() || 1));
    const p = THREE.MathUtils.clamp(scrollEnv.getScrollTopPx() / max, 0, 1);
    const sky = skyAmount(p);
    uniforms.uTop.value.copy(palette.page).lerp(palette.top, sky);
    uniforms.uBottom.value.copy(palette.page).lerp(palette.bottom, sky);
    uniforms.uGlow.value.copy(palette.page).lerp(palette.glow, sky);
    uniforms.uCaustic.value = sky;
    uniforms.uAspect.value = Math.max(1, size.width / Math.max(1, size.height));
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[160, 120]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
