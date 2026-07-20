"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { useThemeMode } from "@/components/providers/ThemeModeProvider";
import { usePointerStore } from "@/stores/pointer";
import { scrollEnv } from "@/components/providers/LenisScroll";
import { BackgroundGradient } from "./BackgroundGradient";
import { GlassModel, type TintConfig } from "./GlassModel";
import { DotGridOverlay } from "./DotGridOverlay";
import { LensFlarePass, LENS_FLARE_DEFAULTS, LENS_FLARE_TAIL_COLOR } from "./LensFlarePass";
import { FluidPushPass } from "./FluidPushPass";
import { warpStripesFrag } from "./shaders";
import { withBase } from "@/lib/asset";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// blue accent glass tint (#009dff → #64c3ff)
const BLUE_TINT: TintConfig = { a: [0, 0.615, 1, 1], b: [0.392, 0.764, 1, 1], mix: 0.8 };
// saturated translucent sky-blue glass for the hero "hello" / footer wordmark
const HELLO_TINT: TintConfig = { a: [0.0, 0.4, 0.96, 0.9], b: [0.22, 0.58, 1, 0.9], mix: 1.05 };

// cursor-triangle orientation: the model's tip points at this local angle in the XY plane
const CURSOR_TIP_LOCAL = 2.07;
const CURSOR_AIM = 2.36;
const _zAxis = new THREE.Vector3(0, 0, 1);
const _qAim = new THREE.Quaternion();
const _qRoll = new THREE.Quaternion();
const _tipAxis = new THREE.Vector3();

const FOOTER_CENTER = 1.0;

// ⭐ Responsive WARP values - works on all screen sizes
const getWarpValues = () => {
  if (typeof window === "undefined") return { in: 0.24, out: 0.62 };
  const width = window.innerWidth;
  // Mobile: stripes appear slightly later and fade out slightly later
  if (width < 768) return { in: 0.15, out: 0.47 };
  // Tablet
  if (width < 1024) return { in: 0.24, out: 0.7 };
  // Desktop
  return { in: 0.24, out: 0.62 };
};

// ⭐ Responsive scale for hello.gltf
const getHelloScale = () => {
  if (typeof window === "undefined") return 30;
  const width = window.innerWidth;
  if (width < 480) return 12;
  if (width < 768) return 18;
  if (width < 1024) return 24;
  return 30;
};

// fullscreen NDC vertex providing constant normals for the warp's fresnel term
const WARP_VERT = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vEyeVector;
  void main(){
    vWorldNormal = vec3(0.0, 0.0, 1.0);
    vEyeVector = vec3(0.0, 0.0, 1.0);
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

// Fixed fullscreen hyperspace warp; uOpacity is driven by the main scroll loop.
function WarpScreen({ matRef }: { matRef: React.RefObject<THREE.ShaderMaterial | null> }) {
  const uniforms = useMemo(
    () => ({
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
      iTime: { value: 2.0 },
      uScrollDuration: { value: 2.0 },
      uOpacity: { value: 0.0 },
      uAccentColor: { value: new THREE.Color("#009dff") },
      uStripeColorA: { value: new THREE.Color("#009dff") },
      uStripeColorB: { value: new THREE.Color("#64c3ff") },
      uStripeReveal: { value: 1.0 },
      uLight: { value: new THREE.Vector3(4, 9, 0.5) },
      uShininess: { value: 40.0 },
      uDiffuseness: { value: 0.1 },
      uSpecularStrength: { value: 1.2 },
      uFresnelPower: { value: 6.0 },
      uFresnelStrength: { value: 1.0 },
      uFresnelSideDir: { value: new THREE.Vector3(-1, 0.3, 1) },
    }),
    [],
  );
  useFrame(({ gl }) => {
    const s = gl.getDrawingBufferSize(new THREE.Vector2());
    uniforms.iResolution.value.set(Math.max(1, s.x), Math.max(1, s.y), 1);
  });
  return (
    <mesh renderOrder={6} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={WARP_VERT}
        fragmentShader={warpStripesFrag}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// Fullscreen quad that paints the refraction FBO (background) to screen.
function BackgroundDisplay({ texture }: { texture: THREE.Texture }) {
  const uniforms = useMemo(() => ({ tBg: { value: texture } }), [texture]);
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`}
        fragmentShader={`varying vec2 vUv; uniform sampler2D tBg; void main(){ gl_FragColor = texture2D(tBg, vUv); }`}
      />
    </mesh>
  );
}

function Scene() {
  const { resolved } = useThemeMode();
  const dark = resolved === "dark";
  const pathname = usePathname();
  const isHome = pathname === "/";
  const heroRef = useRef<THREE.Group>(null);
  const cursorFlyRef = useRef<THREE.Group>(null);
  const cursorRef = useRef<THREE.Group>(null);
  const footerRef = useRef<THREE.Group>(null);
  const warpMat = useRef<THREE.ShaderMaterial>(null);
  const parallaxOffset = useRef(new THREE.Vector2(0, 0));
  const parallaxRot = useRef(new THREE.Vector2(0, 0));
  const camBase = useRef<THREE.Vector3 | null>(null);

  // dedicated background scene → FBO that the glass refracts (and we paint to screen).
  const bgScene = useMemo(() => new THREE.Scene(), []);
  const fbo = useMemo(
    () =>
      new THREE.WebGLRenderTarget(2, 2, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        type: THREE.UnsignedByteType,
      }),
    [],
  );
  useEffect(() => () => fbo.dispose(), [fbo]);

  // lens-flare bloom pass
  const flare = useMemo(() => new LensFlarePass({ ...LENS_FLARE_DEFAULTS }), []);
  useEffect(() => {
    flare.setParams({
      ...LENS_FLARE_DEFAULTS,
      tailColor: dark ? LENS_FLARE_TAIL_COLOR.dark : LENS_FLARE_TAIL_COLOR.light,
    });
  }, [flare, dark]);
  useEffect(() => () => flare.dispose?.(), [flare]);

  // GPU fluid
  const fluid = useMemo(() => new FluidPushPass({ strength: 0.11, velocityScale: 0.5, velocityDissipation: 4 }), []);
  useEffect(() => {
    fluid.enabled = true;
    fluid.setPointerColor?.("#c0fe04");
    fluid.setPointerPixelSize?.(16);
    return () => fluid.dispose?.();
  }, [fluid]);

  // per-frame pointer driver
  const pointerPx = useRef(new THREE.Vector2(-1, -1));
  const prevPointerPx = useRef(new THREE.Vector2(-1, -1));
  const pointerDelta = useRef(new THREE.Vector2(0, 0));
  const pointerUv = useRef(new THREE.Vector2(-1, -1));
  const lastMoveTime = useRef(0);
  const moved = useRef(false);
  useEffect(() => usePointerStore.subscribe(() => (moved.current = true)), []);
  useFrame((state, dt) => {
    const reduced = prefersReducedMotion();
    const isMobile = state.size.width < 1024;
    const dpr = Math.min(state.gl.getPixelRatio(), 2);
    fluid.setDisplayMetrics(state.size.width, state.size.height, dpr);
    const p = usePointerStore.getState();
    const uvx = (p.nx + 1) * 0.5;
    const uvy = (p.ny + 1) * 0.5;
    const ok = moved.current && !isMobile && !reduced;
    if (ok) {
      const px = uvx * state.size.width * dpr;
      const py = uvy * state.size.height * dpr;
      if (prevPointerPx.current.x >= 0) {
        const maxStep = 90 * dpr;
        pointerDelta.current.set(
          THREE.MathUtils.clamp(px - prevPointerPx.current.x, -maxStep, maxStep),
          THREE.MathUtils.clamp(py - prevPointerPx.current.y, -maxStep, maxStep),
        );
      } else pointerDelta.current.set(0, 0);
      pointerPx.current.set(px, py);
      prevPointerPx.current.set(px, py);
    } else {
      pointerDelta.current.multiplyScalar(0.9);
    }
    const speedSq = ok ? pointerDelta.current.lengthSq() : 0;
    const now = state.clock.elapsedTime * 1000;
    if (speedSq > 1) lastMoveTime.current = now;
    const idle = now - lastMoveTime.current > 600;
    const maxScroll = scrollEnv.getMaxScrollPx();
    const frac = maxScroll > 0 ? scrollEnv.getScrollTopPx() / maxScroll : 0;
    const warp = getWarpValues();
    const inWarp = frac > warp.in - 0.03 && frac < warp.out + 0.03;
    const effectOn = !isMobile && !reduced && !idle && !inWarp;
    fluid.enabled = true;
    fluid.setEffectEnabled(effectOn);
    fluid.setPointer(pointerPx.current);
    fluid.setPointerDelta(pointerDelta.current);
    if (ok) pointerUv.current.set(uvx, uvy);
    else pointerUv.current.set(-1, -1);
    fluid.updatePointer(pointerUv.current, ok, dt);
  }, 0);

  useFrame((state) => {
    const { gl, camera } = state;
    const db = gl.getDrawingBufferSize(new THREE.Vector2());
    if (fbo.width !== db.x || fbo.height !== db.y) fbo.setSize(db.x, db.y);
    const prevRT = gl.getRenderTarget();
    gl.setRenderTarget(fbo);
    gl.render(bgScene, camera);
    gl.setRenderTarget(prevRT);

    {
      const scrollTop = scrollEnv.getScrollTopPx();
      const vh = scrollEnv.getViewportHeightPx() || state.size.height || 1;
      const max = Math.max(1, (scrollEnv.getContainerEl()?.scrollHeight ?? 0) - vh);
      const persp = camera as THREE.PerspectiveCamera;
      const worldH = 2 * Math.abs(camera.position.z) * Math.tan((persp.fov * Math.PI) / 360);
      const worldPerPx = worldH / vh;
      const place = (g: THREE.Group | null, centerFrac: number, visibleSpanFrac: number) => {
        if (!g) return;
        const centerPx = centerFrac * max;
        g.position.y = (scrollTop - centerPx) * worldPerPx;
        g.visible = Math.abs(scrollTop - centerPx) < visibleSpanFrac * max + vh;
      };
      place(heroRef.current, 0, 0.05);
      place(footerRef.current, FOOTER_CENTER, 0.1);

      const tNow = state.clock.elapsedTime;
      const heroProg = THREE.MathUtils.clamp(scrollTop / vh, 0, 1);
      if (heroRef.current) {
        heroRef.current.rotation.y = heroProg * 0.45 * 0.72 + Math.sin(tNow * 0.4) * 0.03;
        heroRef.current.rotation.x = heroProg * -0.18 * 0.72 + Math.sin(tNow * 0.33) * 0.02;
      }
      if (cursorRef.current) {
        const aim = CURSOR_AIM + Math.sin(tNow * 0.4) * 0.06;
        _qAim.setFromAxisAngle(_zAxis, aim - CURSOR_TIP_LOCAL);
        _tipAxis.set(Math.cos(aim), Math.sin(aim), 0);
        _qRoll.setFromAxisAngle(_tipAxis, tNow * 1.3);
        cursorRef.current.quaternion.copy(_qRoll).multiply(_qAim);
      }
      
      // ⭐⭐ CURSOR - ENDS EARLIER ON MOBILE ⭐⭐
if (cursorFlyRef.current) {
  const isMobile = state.size.width < 1024;
  // ⭐ Desktop: vh * 3.5, Mobile: vh * 2.5 (faster on mobile)
  const speed = isMobile ? 2.5 : 3.5;
  const flyT = THREE.MathUtils.clamp(scrollTop / (vh * speed), 0, 1.2);
  // ⭐ Desktop: disappears at 1.2, Mobile: disappears at 0.9 (earlier on mobile)
  const maxFlyT = isMobile ? 0.9 : 1.2;
  cursorFlyRef.current.visible = flyT < maxFlyT;
  // Adjust position for mobile
  const xPos = isMobile ? 6 - flyT * 12 : 12 - flyT * 26;
  const yPos = isMobile ? -3 - Math.sin(Math.min(flyT, 1) * Math.PI) * 1.0 : -7 - Math.sin(Math.min(flyT, 1) * Math.PI) * 2.5;
  cursorFlyRef.current.position.set(xPos, yPos, 2);
}
      
      if (footerRef.current) {
        const fprog = THREE.MathUtils.clamp((scrollTop - FOOTER_CENTER * max) / vh + 0.5, 0, 1);
        footerRef.current.rotation.y = (fprog - 0.5) * 0.4 * 0.72 + Math.sin(tNow * 0.35 + 1.0) * 0.025;
      }

      // ⭐ warp opacity with responsive values
      if (warpMat.current) {
        const p = scrollTop / max;
        const warp = getWarpValues();
        const fadeIn = THREE.MathUtils.smoothstep(p, warp.in, warp.in + 0.05);
        const fadeOut = 1 - THREE.MathUtils.smoothstep(p, warp.out - 0.05, warp.out);
        warpMat.current.uniforms.uOpacity.value = Math.min(fadeIn, fadeOut);
        const through = THREE.MathUtils.clamp((p - warp.in) / (warp.out - warp.in), 0, 1);
        warpMat.current.uniforms.iTime.value = through * 2.0;
      }
    }

    // pointer-driven camera parallax
    if (!camBase.current) camBase.current = camera.position.clone();
    const pt = usePointerStore.getState();
    const wide = state.size.width >= 1024;
    const offTargetX = wide ? -pt.nx * 1.4 : 0;
    const offTargetY = wide ? -pt.ny * 1.4 * 0.6 : 0;
    const LAG = 0.18;
    parallaxOffset.current.x += (offTargetX - parallaxOffset.current.x) * LAG;
    parallaxOffset.current.y += (offTargetY - parallaxOffset.current.y) * LAG;
    const rotTargetX = -parallaxOffset.current.x * 0.12;
    const rotTargetY = -parallaxOffset.current.y * 0.12;
    parallaxRot.current.x += (rotTargetX - parallaxRot.current.x) * LAG;
    parallaxRot.current.y += (rotTargetY - parallaxRot.current.y) * LAG;
    camera.position.set(
      camBase.current.x + parallaxOffset.current.x,
      camBase.current.y + parallaxOffset.current.y,
      camBase.current.z,
    );
    camera.lookAt(wide ? parallaxRot.current.x : 0, wide ? parallaxRot.current.y : 0, 0);
  }, -1);

  return (
    <>
      {createPortal(<BackgroundGradient dark={dark} layer={0} />, bgScene)}
      <BackgroundDisplay texture={fbo.texture} />
      {isHome && (
        <>
          <group ref={heroRef}>
            <GlassModel url={withBase("/model/hello.gltf")} scale={getHelloScale()} layer={0} fbo={fbo} brightness={0.88} tint={{ ...HELLO_TINT, dark: dark ? 1 : 0 }} />
          </group>
          <group ref={cursorFlyRef} position={[12, -7, 2]}>
            <group ref={cursorRef}>
<GlassModel url={withBase("/model/cursor.glb")} scale={typeof window !== 'undefined' && window.innerWidth < 768 ? 0.08 : 0.16} layer={0} fbo={fbo} brightness={0.78} tint={{ a: [0.05, 0.45, 1, 0.9], b: [0.3, 0.65, 1, 0.9], mix: 0.9, dark: dark ? 1 : 0 }} />            </group>
          </group>
          <WarpScreen matRef={warpMat} />
          <group ref={footerRef} position={[0, -1, 0]}>
            <GlassModel url={withBase("/model/cnt.gltf")} scale={19} layer={0} fbo={fbo} brightness={1.0} tint={{ ...HELLO_TINT, dark: dark ? 1 : 0 }} />
          </group>
        </>
      )}
      <DotGridOverlay dark={dark} opacity={0} pixelSize={4} radiusScale={0.9} />

      <EffectComposer multisampling={0} frameBufferType={THREE.UnsignedByteType} renderPriority={998}>
        <primitive object={flare} />
        <primitive object={fluid} />
      </EffectComposer>
    </>
  );
}

export default function MainCanvas() {
  const [fov, setFov] = useState(60);
  useEffect(() => {
    const update = () => setFov(window.innerWidth >= 1024 ? 60 : 38);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 22], fov }} gl={{ alpha: true, antialias: true }} style={{ width: "100%", height: "100%" }}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}