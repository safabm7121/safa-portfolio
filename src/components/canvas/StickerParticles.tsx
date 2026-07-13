"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEnv } from "@/components/providers/LenisScroll";
import { withBase } from "@/lib/asset";

/**
 * Sticker particle system (chunk 7758f29a, verbatim behaviour).
 *
 * 12 sticker PNGs are packed into a texture atlas and drawn as an InstancedMesh
 * of textured quads. Ambient stickers fall from the top + sway (wind) + spin,
 * gated to the footer scroll range. A pointer TAP anywhere raycasts onto the
 * z=0 plane and spawns a staggered BURST of one-shot stickers at the cursor.
 */

const STICKER_URLS = Array.from({ length: 12 }, (_, i) => `/sticker_img/s_${String(i + 1).padStart(2, "0")}.png`);

// Production config (chunk 7758f29a) assumes a smaller world scale than our scene
// (our visible world-Y band is ~±10; theirs implies ~±24). positionY / fallDistance /
// spawnHeight are scaled down to keep the ambient fall inside our viewport. Click spawn is
// unaffected (its origin cancels positionY) and the *behaviour* is unchanged.
const CFG = {
  spawnWidth: 26,
  clickSpawnWidth: 22,
  spawnHeight: 9,
  clickSpawnHeight: 20,
  positionY: 12,
  fallDistance: 28,
  zDepth: 2,
  zOffset: -2,
  windStrength: 1.4,
  windFrequency: 0.3,
  scale: 1.4,
  clickScale: 1.4,
  rotationSpeed: 0.8,
  fallSpeed: 1.8,
  enterDurationRatio: 0.05,
};

const VERT = `
attribute vec4 uvRect;
varying vec2 vAtlasUv;
void main() {
  vAtlasUv = uvRect.xy + uv * uvRect.zw;
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;
const FRAG = `
uniform sampler2D map;
varying vec2 vAtlasUv;
void main() {
  vec4 color = texture2D(map, vAtlasUv);
  if (color.a < 0.01) discard;
  gl_FragColor = color;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

type Particle = {
  position: THREE.Vector3;
  startY: number;
  fallSpeed: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  textureIndex: number;
  windPhase: number;
  windAmplitude: number;
  emitAt: number;
  hasStarted: boolean;
  dead: boolean;
  isOneShot: boolean;
  originX: number;
  originY: number;
  originZ: number;
};

const pow2 = (n: number) => Math.pow(2, Math.ceil(Math.log2(Math.max(1, n))));

function makeParticles(count: number, texCount: number, oneShot: boolean): Particle[] {
  const arr: Particle[] = Array.from({ length: count }, () => ({
    position: new THREE.Vector3(),
    startY: 0, fallSpeed: 0, rotation: 0, rotationSpeed: 0, scale: 1,
    textureIndex: Math.floor(Math.random() * texCount),
    windPhase: 0, windAmplitude: 0, emitAt: 0, hasStarted: true, dead: false,
    isOneShot: oneShot, originX: 0, originY: 0, originZ: 0,
  }));
  // distinct textures when count <= texCount (shuffled)
  if (count > 0 && count <= texCount) {
    const idx = Array.from({ length: texCount }, (_, i) => i);
    for (let t = idx.length - 1; t > 0; t--) { const r = Math.floor(Math.random() * (t + 1)); [idx[t], idx[r]] = [idx[r], idx[t]]; }
    for (let i = 0; i < count; i++) arr[i].textureIndex = idx[i];
  }
  return arr;
}

function spawn(p: Particle, mode: "scroll" | "click") {
  const m = mode === "click" ? CFG.clickSpawnHeight : CFG.spawnHeight;
  const g = Math.min(0.5 * Math.max(m, 0), 8);
  const v = mode === "click" ? CFG.positionY + (2 * Math.random() - 1) * g : CFG.positionY + Math.random() * Math.max(m, 0);
  p.position.set(
    p.originX + (Math.random() - 0.5) * (mode === "click" ? CFG.clickSpawnWidth : CFG.spawnWidth),
    p.originY + v,
    p.originZ + (Math.random() - 0.5) * CFG.zDepth + CFG.zOffset,
  );
  p.startY = p.position.y;
  p.fallSpeed = CFG.fallSpeed * (0.6 + 0.8 * Math.random());
  p.rotation = Math.random() * Math.PI * 2;
  p.rotationSpeed = (Math.random() - 0.5) * CFG.rotationSpeed * 2;
  p.scale = mode === "click" ? CFG.clickScale : CFG.scale;
  p.windPhase = Math.random() * Math.PI * 2;
  p.windAmplitude = 0.3 + Math.random() * CFG.windStrength;
  p.dead = false;
  p.hasStarted = true;
  p.emitAt = 0;
}

function pickFreeTexture(texCount: number, used: Set<number>): number {
  if (texCount <= 0) return 0;
  if (used.size >= texCount) return Math.floor(Math.random() * texCount);
  const free: number[] = [];
  for (let r = 0; r < texCount; r++) if (!used.has(r)) free.push(r);
  return free[Math.floor(Math.random() * free.length)];
}

export function StickerParticles({ showAtProgress = 0.8, ambientCount = 30, burstCount = 14 }: { showAtProgress?: number; ambientCount?: number; burstCount?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const ndc = useRef(new THREE.Vector2());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const particles = useRef<Particle[]>([]);
  const inited = useRef(false);
  const elapsed = useRef(0);
  const dummy = useRef(new THREE.Object3D());

  // load the 12 sticker textures, then pack into an atlas
  const atlas = useRef<{ texture: THREE.CanvasTexture; uvRects: Float32Array; aspects: number[] } | null>(null);
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(2, 2);
    g.setAttribute("uvRect", new THREE.InstancedBufferAttribute(new Float32Array(8192), 4));
    return g;
  }, []);
  const material = useMemo(
    () => new THREE.ShaderMaterial({ uniforms: { map: { value: null } }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.FrontSide, toneMapped: false }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    Promise.all(STICKER_URLS.map((u) => loader.loadAsync(withBase(u)))).then((texes) => {
      if (cancelled) return;
      const imgs = texes.map((t) => t.image as HTMLImageElement);
      const cols = Math.ceil(Math.sqrt(imgs.length));
      const rows = Math.ceil(imgs.length / cols);
      const cw = Math.max(...imgs.map((i) => i.width));
      const ch = Math.max(...imgs.map((i) => i.height));
      const cellW = cw + 4, cellH = ch + 4;
      const W = pow2(cols * cellW), H = pow2(rows * cellH);
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      const uvRects = new Float32Array(4 * imgs.length);
      const aspects: number[] = [];
      imgs.forEach((img, i) => {
        const r = Math.floor(i / cols);
        const x = (i % cols) * cellW + 2;
        const y = r * cellH + 2;
        ctx.drawImage(img, x, y, img.width, img.height);
        const c = 4 * i;
        uvRects[c] = (x + 0.5) / W;
        uvRects[c + 1] = 1 - (y + img.height - 0.5) / H;
        uvRects[c + 2] = (img.width - 1) / W;
        uvRects[c + 3] = (img.height - 1) / H;
        aspects[i] = img.width / img.height;
      });
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = false; tex.needsUpdate = true;
      atlas.current = { texture: tex, uvRects, aspects };
      material.uniforms.map.value = tex;
      // init ambient particles, pre-distributed across the fall path so a few are
      // already mid-screen the moment the footer scrolls into view (not all stacked above)
      const ps = makeParticles(ambientCount, aspects.length, false);
      for (const p of ps) { spawn(p, "scroll"); p.position.y -= Math.random() * CFG.fallDistance; }
      particles.current = ps;
      inited.current = true;
    });
    return () => { cancelled = true; atlas.current?.texture.dispose(); };
  }, [material, ambientCount]);

  // pointer TAP -> spawn a staggered burst of one-shot stickers at the cursor.
  // Listen on window (the canvas is pointer-events:none so scroll keeps working);
  // the canvas rect is still used to project the click into NDC.
  useEffect(() => {
    const el = gl.domElement;
    let down: { id: number; type: string; x: number; y: number; at: number; cancelled: boolean; ui: boolean } | null = null;
    // a click on an interactive control (nav, links, toggles, cards, inputs) should NOT
    // spawn stickers — only "empty"/content-surface taps do (matches production, where the
    // handler sits on the canvas behind the DOM and never receives UI clicks).
    const isUi = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest('a, button, input, textarea, select, label, [role="button"], [contenteditable="true"]');
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      if ((e.pointerType === "mouse" || e.pointerType === "pen") && e.button !== 0) return;
      down = { id: e.pointerId, type: e.pointerType, x: e.clientX, y: e.clientY, at: e.timeStamp || performance.now(), cancelled: false, ui: isUi(e.target) };
    };
    const onMove = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id || down.cancelled) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      const thr = down.type === "touch" ? 10 : 4;
      if (dx * dx + dy * dy > thr * thr) down.cancelled = true;
    };
    const onUp = (e: PointerEvent) => {
      const d = down; down = null;
      if (!d || e.pointerId !== d.id || d.cancelled) return;
      if (d.ui || isUi(e.target)) return; // clicked a UI control → no sticker burst
      if ((e.timeStamp || performance.now()) - d.at > 600) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;
      if (!atlas.current) return;
      const rect = el.getBoundingClientRect();
      ndc.current.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1));
      raycaster.current.setFromCamera(ndc.current, camera);
      const hit = new THREE.Vector3();
      if (!raycaster.current.ray.intersectPlane(plane.current, hit)) return;
      const burst = makeParticles(burstCount, atlas.current.aspects.length, true);
      let delay = 0.05 * Math.random();
      for (const p of burst) { p.hasStarted = false; p.dead = false; p.emitAt = delay + elapsed.current; delay += 0.04 + 0.04 * Math.random(); p.originX = hit.x; p.originY = hit.y - CFG.positionY; p.originZ = 0; }
      particles.current = particles.current.concat(burst);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [gl, camera, burstCount]);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    const a = atlas.current;
    if (!mesh || !a || !inited.current) { if (mesh) { mesh.count = 0; mesh.visible = false; } return; }
    const step = Math.min(dt, 0.1);
    elapsed.current += step;
    const u = elapsed.current;
    const max = scrollEnv.getMaxScrollPx ? scrollEnv.getMaxScrollPx() : 1;
    const prog = max > 0 ? scrollEnv.getScrollTopPx() / max : 0;
    const ambientOn = prog >= showAtProgress;

    const ps = particles.current;
    const used = new Set<number>();
    for (const p of ps) if (!p.isOneShot && !p.dead && p.hasStarted) used.add(p.textureIndex);

    const visible: Particle[] = [];
    let anyDead = false;
    for (const p of ps) {
      if (!(p.isOneShot || ambientOn)) continue;
      if (!p.hasStarted) { if (u >= p.emitAt) { spawn(p, "click"); p.hasStarted = true; } else continue; }
      if (p.dead) { if (p.isOneShot) anyDead = true; continue; }
      p.position.y -= p.fallSpeed * step;
      p.position.x += Math.sin(u * CFG.windFrequency + p.windPhase) * p.windAmplitude * step;
      p.rotation += p.rotationSpeed * step;
      const r = THREE.MathUtils.clamp((p.startY - p.position.y) / CFG.fallDistance, 0, 1);
      let fade = 1;
      if (CFG.enterDurationRatio > 0 && r < CFG.enterDurationRatio) fade = r / CFG.enterDurationRatio;
      else if (r > 0.9) fade = (1 - r) / 0.1;
      fade = THREE.MathUtils.clamp(fade, 0, 1);
      if (p.position.y < p.startY - CFG.fallDistance) {
        if (p.isOneShot) { p.dead = true; anyDead = true; continue; }
        // ambient: loop straight back to the top (continuous rain, no emit delay)
        used.delete(p.textureIndex);
        spawn(p, "scroll");
        p.textureIndex = pickFreeTexture(a.aspects.length, used);
        continue;
      }
      p.scale = fade;
      visible.push(p);
    }
    if (anyDead) particles.current = ps.filter((p) => !p.isOneShot || !p.dead);
    visible.sort((x, y) => x.position.z - y.position.z);

    const uvAttr = geom.getAttribute("uvRect") as THREE.InstancedBufferAttribute;
    const n = Math.min(visible.length, 2048);
    const obj = dummy.current;
    for (let i = 0; i < n; i++) {
      const p = visible[i];
      const aspect = a.aspects[p.textureIndex] ?? 1;
      const s = (p.isOneShot ? CFG.clickScale : CFG.scale) * p.scale;
      obj.position.copy(p.position);
      obj.rotation.set(0, 0, p.rotation);
      obj.scale.set(s * aspect, s, 1);
      obj.updateMatrix();
      mesh.setMatrixAt(i, obj.matrix);
      const c = 4 * p.textureIndex;
      uvAttr.setXYZW(i, a.uvRects[c], a.uvRects[c + 1], a.uvRects[c + 2], a.uvRects[c + 3]);
    }
    mesh.count = n;
    mesh.visible = n > 0;
    mesh.instanceMatrix.needsUpdate = true;
    uvAttr.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geom, material, 2048]} frustumCulled={false} renderOrder={5} />;
}
