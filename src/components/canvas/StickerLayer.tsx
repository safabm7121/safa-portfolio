"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { stickerLayerVert, stickerLayerFrag } from "./shaders";

// Default uniforms for the sticker-layer material (verbatim defaults, 04-webgl.md §2.3).
function makeStickerUniforms() {
  return {
    map: { value: null as THREE.Texture | null },
    mapHover: { value: null as THREE.Texture | null },
    uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
    uCurlStrength: { value: 0.0 },
    uPolarityPositive: { value: 0.0 },
    uLayerOpacity: { value: 1.0 },
    uRevealProgress: { value: 1.0 },
    uRevealSoftness: { value: 0.0 },
    uRevealDirection: { value: 1.0 },
    uHoverRevealProgress: { value: 0.0 },
    uDotPixelSize: { value: 18.0 },
    uViewportPx: { value: new THREE.Vector2(1, 1) },
  };
}

// Match the source texture setup (cB): sRGB, clamp-to-edge, linear, no mips.
function configureTexture(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export type StickerLayerProps = {
  /** base sticker texture url (map) */
  imageUrl: string;
  /** hover sticker texture url (mapHover); falls back to imageUrl */
  hoverImageUrl?: string;
  /** DOM element this sticker overlays; uRect is read from its bounding rect */
  targetRef: RefObject<HTMLElement | null>;
  /** theme: dark → uPolarityPositive 1, light → 0 */
  dark: boolean;
  /** layer opacity multiplier (default 1) */
  layerOpacity?: number;
  /** dot cell size in px for the hover halftone reveal (default 18) */
  dotPixelSize?: number;
};

/**
 * DOM-synced image sticker layer. A fullscreen quad whose uRect tracks a DOM
 * element's bounding rect, with a halftone-dot hover reveal of mapHover over map.
 */
export function StickerLayer({
  imageUrl,
  hoverImageUrl,
  targetRef,
  dark,
  layerOpacity = 1,
  dotPixelSize = 18,
}: StickerLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, gl } = useThree();

  // Load both textures (base + hover). useLoader caches + suspends.
  const hoverUrl = hoverImageUrl ?? imageUrl;
  const [baseTex, hoverTex] = useLoader(THREE.TextureLoader, [
    imageUrl,
    hoverUrl,
  ]);

  const uniforms = useMemo(() => makeStickerUniforms(), []);

  // Bind + configure textures.
  useEffect(() => {
    configureTexture(baseTex);
    configureTexture(hoverTex);
    if ("initTexture" in gl) {
      gl.initTexture(baseTex);
      gl.initTexture(hoverTex);
    }
    uniforms.map.value = baseTex;
    uniforms.mapHover.value = hoverTex;
  }, [uniforms, baseTex, hoverTex, gl]);

  useEffect(() => {
    uniforms.uDotPixelSize.value = dotPixelSize;
  }, [uniforms, dotPixelSize]);

  // Hover state tracked on the target element (source listens on the element).
  const hovered = useRef(false);
  // Animated hover ramp (0..1) and polarity ramp (0..1).
  const hoverRamp = useRef(0);
  const polarityRamp = useRef(dark ? 1 : 0);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const enter = () => {
      hovered.current = true;
    };
    const leave = () => {
      hovered.current = false;
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("focusin", enter);
    el.addEventListener("focusout", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("focusin", enter);
      el.removeEventListener("focusout", leave);
    };
  }, [targetRef]);

  useFrame((_state, dt) => {
    const el = targetRef.current;
    const W = Math.max(1, size.width);
    const H = Math.max(1, size.height);
    const mesh = meshRef.current;

    if (!el || !uniforms.map.value) {
      if (mesh) mesh.visible = false;
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      if (mesh) mesh.visible = false;
      return;
    }

    // Cull when well outside the viewport (source margins: 0.25h / 2h / 3h).
    const margin = 0.25 * H;
    const visible = rect.bottom > -margin && rect.top < H + margin;
    const fullyOff = rect.bottom < -(2 * H) || rect.top > 3 * H;
    if (!visible || fullyOff) {
      if (mesh) mesh.visible = false;
      return;
    }
    if (mesh) mesh.visible = true;

    // Hover ramp: rate min(dt,0.1)/0.42 toward 0/1, then cosine ease.
    const step = Math.min(dt, 0.1) / 0.42;
    const target = hovered.current ? 1 : 0;
    let m = hoverRamp.current;
    if (target > 0) {
      m = Math.min(1, m + step);
      if (m > 0.999) m = 1;
    } else {
      m = Math.max(0, m - step);
      if (m < 0.001) m = 0;
    }
    hoverRamp.current = m;
    uniforms.uHoverRevealProgress.value =
      0.5 - 0.5 * Math.cos(Math.PI * THREE.MathUtils.clamp(m, 0, 1));

    // Polarity ramp toward dark?1:0 via easeInOutCubic over ~0.8s.
    const polTarget = dark ? 1 : 0;
    let p = polarityRamp.current;
    const polStep = dt / 0.8;
    p = polTarget > p ? Math.min(polTarget, p + polStep) : Math.max(polTarget, p - polStep);
    polarityRamp.current = p;
    uniforms.uPolarityPositive.value = easeInOutCubic(p);

    // Screen-UV rect from DOM bounds (Y flipped: 1 - (top + h)/H).
    uniforms.uRect.value.set(
      rect.left / W,
      1 - (rect.top + rect.height) / H,
      rect.width / W,
      rect.height / H,
    );
    uniforms.uViewportPx.value.set(W, H);
    uniforms.uLayerOpacity.value = layerOpacity;
  });

  return (
    <mesh ref={meshRef} renderOrder={20} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={stickerLayerVert}
        fragmentShader={stickerLayerFrag}
        uniforms={uniforms}
        transparent
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
