"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { useThemeMode } from "@/components/providers/ThemeModeProvider";
import { MaskedDotsEffect } from "./MaskedDotsEffect";

/** customCubic easing (ORCH chunk h@29090, verbatim cubic-bezier solver). */
const customCubic = (() => {
  const t = -3 * 0.65 - 1.98;
  const n = -0.98 - (-3 * 0.65 - 1.98);
  const r = (e: number) => ((n * e + t) * e + 1.98) * e;
  const i = (e: number) => (3 * n * e + 2 * t) * e + 1.98;
  const solve = (e: number) => {
    let x = e;
    for (let k = 0; k < 8; k++) {
      const d = r(x) - e, dd = i(x);
      if (Math.abs(d) < 1e-7) return x;
      if (Math.abs(dd) < 1e-7) break;
      x -= d / dd;
    }
    let lo = 0, hi = 1; x = e;
    while (lo < hi) {
      const v = r(x);
      if (Math.abs(v - e) < 1e-7) break;
      if (e > v) lo = x; else hi = x;
      x = (hi + lo) / 2;
    }
    return x;
  };
  return (e: number) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const x = solve(e);
    return (-2 * x + 3) * x * x;
  };
})();

const MASK_VERT = `varying vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const MASK_FRAG = `precision highp float;
uniform vec3 uColor; uniform float uFeather; uniform float uAspect; uniform float uHoleRadius; uniform float uProgress;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  if (uAspect > 1.0) { p.x *= uAspect; } else { p.y /= max(uAspect, 0.0001); }
  float d = length(p);
  float edge = max(uFeather, uHoleRadius * 0.12);
  float alphaHole = smoothstep(uHoleRadius, uHoleRadius + edge, d);
  float fillMix = smoothstep(0.92, 1.0, uProgress);
  float alpha = mix(alphaHole, 1.0, fillMix);
  gl_FragColor = vec4(uColor * alpha, alpha);
  #include <colorspace_fragment>
}`;

const OVERLAY_COLORS = ["#191b1b", "#efede7"]; // [dark, light]

/** Animation driver: lerps the hole radius b→0 (cover) or 0→b (reveal) via customCubic. */
function MaskDriver({
  open,
  duration,
  onComplete,
  materialRef,
  initialCovered = false,
}: {
  open: boolean;
  duration: number;
  onComplete: (open: boolean) => void;
  materialRef: React.RefObject<THREE.ShaderMaterial | null>;
  initialCovered?: boolean;
}) {
  const { resolved } = useThemeMode();
  const { size } = useThree();
  const invalidate = useThree((s) => s.invalidate);
  const color = resolved === "dark" ? OVERLAY_COLORS[0] : OVERLAY_COLORS[1];

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color() },
      uFeather: { value: 0.8 },
      uAspect: { value: 1 },
      uHoleRadius: { value: 2 },
      uProgress: { value: 0 },
    }),
    [],
  );

  // diagonal max radius so the hole fully covers the screen at progress 1
  const maxRadius = useMemo(() => {
    const a = size.width / Math.max(1, size.height);
    const t = Math.max(a, 1 / a);
    return Math.sqrt(t * t + 1);
  }, [size.width, size.height]);

  useEffect(() => {
    if (materialRef.current) materialRef.current.uniforms.uAspect.value = size.width / Math.max(1, size.height);
    invalidate();
  }, [size.width, size.height, color, materialRef, invalidate]);

  const cur = useRef(initialCovered ? 1 : 0);
  const from = useRef(initialCovered ? 1 : 0);
  const to = useRef(0);
  const startT = useRef<number | null>(null);
  const done = useRef(false);

  useLayoutEffect(() => {
    from.current = cur.current;
    to.current = open ? 1 : 0;
    startT.current = null;
    done.current = false;
    invalidate();
  }, [open, invalidate]);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    if (startT.current === null) startT.current = now;
    const elapsed = now - startT.current;
    const l = THREE.MathUtils.clamp(elapsed / Math.max(1e-6, duration), 0, 1);
    const eased = customCubic(l);
    cur.current = THREE.MathUtils.lerp(from.current, to.current, eased);
    const radius = THREE.MathUtils.lerp(maxRadius, 0, cur.current);
    const m = materialRef.current;
    if (m) {
      m.uniforms.uHoleRadius.value = radius;
      m.uniforms.uProgress.value = cur.current;
      (m.uniforms.uColor.value as THREE.Color).set(color);
    }
    if (!done.current && l >= 1 - 1e-6) {
      done.current = true;
      onComplete(open);
    } else if (!done.current && l < 1 - 1e-6) {
      state.invalidate();
    }
  });

  return (
    <mesh renderOrder={2000} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        premultipliedAlpha
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        uniforms={uniforms}
        vertexShader={MASK_VERT}
        fragmentShader={MASK_FRAG}
      />
    </mesh>
  );
}

/** Renders the dot-halftone version, reading the animated params from the mask material. */
function DotsComposer({ maskMaterialRef, pixelSize }: { maskMaterialRef: React.RefObject<THREE.ShaderMaterial | null>; pixelSize: number }) {
  const effect = useMemo(() => new MaskedDotsEffect(), []);
  const dpr = useThree((s) => s.viewport.dpr);
  useEffect(() => () => effect.dispose(), [effect]);
  useFrame(() => {
    const m = maskMaterialRef.current;
    if (!m) return;
    effect.setParams({
      pixelSize: pixelSize * dpr,
      feather: m.uniforms.uFeather.value,
      aspect: m.uniforms.uAspect.value,
      holeRadius: m.uniforms.uHoleRadius.value,
      progress: m.uniforms.uProgress.value,
      overlayColor: m.uniforms.uColor.value,
    });
  }, 1);
  return (
    <EffectComposer multisampling={0} autoClear renderPriority={999} frameBufferType={THREE.UnsignedByteType}>
      <primitive object={effect} />
    </EffectComposer>
  );
}

export function TransitionOverlay({
  open,
  duration = 0.7,
  onComplete,
  initialCovered = false,
  zClass = "z-40",
}: {
  open: boolean;
  duration?: number;
  onComplete: (open: boolean) => void;
  initialCovered?: boolean;
  zClass?: string;
}) {
  const maskRef = useRef<THREE.ShaderMaterial>(null);
  return (
    <div className={`${zClass} fixed inset-0 pointer-events-none`} aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        frameloop="demand"
        gl={{ alpha: true, antialias: false, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <MaskDriver open={open} duration={duration} onComplete={onComplete} materialRef={maskRef} initialCovered={initialCovered} />
        <DotsComposer maskMaterialRef={maskRef} pixelSize={32} />
      </Canvas>
    </div>
  );
}
