# Integrating `FluidPushPass`

How to wire `./FluidPushPass.ts` into the main background `<Canvas>` exactly as the
production site does. This pass is **standalone** — it does not require `MainCanvas`
to be modified to function; it only needs a pmndrs `<EffectComposer>` host and a
per-frame driver. Source of truth: `_analysis/04-webgl.md` §2.6 / §3 / §4f.

> The production scene runs this pass **after** a `LensFlarePass` inside a single
> `<EffectComposer>`. Only one of the two passes renders to screen per frame
> (toggled below). If you have not ported the flare pass yet, you can run
> `FluidPushPass` alone — just keep `fluid.renderToScreen = true` (the pmndrs
> composer also forces the last pass to render to screen automatically).

---

## 1. Dependencies

Already in `package.json`:

- `three`
- `postprocessing` (provides `Pass`, which `FluidPushPass` extends)
- `@react-three/fiber` (`useFrame`, `useThree`)

The `<EffectComposer>` JSX wrapper comes from `@react-three/postprocessing`. The
production bundle uses it (`cM.EffectComposer`). If it is **not** yet a dependency,
you can instead drive a raw `postprocessing` `EffectComposer` imperatively (see
§5). The JSX path below assumes `@react-three/postprocessing` is available.

```ts
import { FluidPushPass } from "@/components/canvas/FluidPushPass";
```

---

## 2. Instantiate the pass

Create it once and keep it in a ref. The constructor takes the §2.6 defaults, so
`new FluidPushPass({})` reproduces the production configuration:

```ts
const fluidRef = useRef<FluidPushPass | null>(null);
if (!fluidRef.current) {
  fluidRef.current = new FluidPushPass({
    // all optional — these are the production defaults:
    strength: 0.3,            // -> uDisplacementStrength = strength / 0.3
    radius: 1.5,             // -> uSplatRadius = max(0.002 * radius, 5e-4)
    velocityScale: 1,        // -> uSplatForce  = max(3000 * velocityScale, 0)
    chromaticStrength: 0.002,// -> uChromaticBoost = chromaticStrength / 0.004
    pressureIterations: 4,
    curlStrength: 0,
    velocityDissipation: 3,  // -> uDissipation
    simResolution: 160,
  });
  fluidRef.current.enabled = true;
}
const fluid = fluidRef.current;

// Match the production init (pointer trail color + dot size). The class already
// defaults to #c0fe04 / 16px, so these are only needed to override.
useEffect(() => {
  fluid.setPointerColor("#c0fe04");
  fluid.setPointerPixelSize(16);
}, [fluid]);

// Dispose on unmount.
useEffect(() => () => fluid.dispose(), [fluid]);
```

### Feed it the viewport metrics

The pointer trail maps device pixels -> grid cells using the **CSS** viewport size
and the device pixel ratio, so the pass needs `setDisplayMetrics(cssWidth, cssHeight, dpr)`
whenever the canvas resizes. The `<EffectComposer>` already calls `setSize(drawingBufferW, drawingBufferH)`
on every pass (which resizes the sim targets); you only need to supply the CSS
metrics yourself:

```ts
const { size, gl } = useThree();
useEffect(() => {
  const dpr = Math.min(gl.getPixelRatio(), 2);
  fluid.setDisplayMetrics(size.width, size.height, dpr);
}, [fluid, gl, size.width, size.height]);
```

---

## 3. Add it to the `<EffectComposer>`

The production composer (`_analysis/04-webgl.md` §3) is:

```tsx
import { EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

<EffectComposer
  ref={composerRef}
  multisampling={0}
  autoClear
  renderPriority={998}
  frameBufferType={THREE.UnsignedByteType}
>
  {/* <primitive object={lensFlarePass} />  // if/when ported */}
  <primitive object={fluid} />
</EffectComposer>
```

- `renderPriority={998}` runs the composer **after** all scene `useFrame`
  callbacks (the dispersion FBO at priority -1, etc.).
- `multisampling={0}` (MSAA off) and `frameBufferType={UnsignedByteType}` (LDR)
  match the source; the display shader does its own tone/colorspace handling.
- A `RenderPass` for the scene is auto-prepended by `@react-three/postprocessing`,
  so the composer's input buffer (`inputBuffer` passed to `render`) already
  contains the rendered scene that the fluid pass displaces via `tDiffuse`.

This `<EffectComposer>` belongs **inside** the same `<Canvas>` that renders the
background scene (i.e. the host lives next to the scene contents, not in a separate
canvas).

---

## 4. Per-frame driver (`_analysis/04-webgl.md` §4f)

Add a single `useFrame` at **priority 0** that translates pointer state into splats
and toggles which pass writes to screen. Pointer comes from the shared
`usePointer()` hook (`{ uv, insideRef }`, `uv` in fractional viewport coords).

```ts
// refs that persist across frames
const pointerPx = useRef(new THREE.Vector2(-1, -1));      // current pointer (device px)
const prevPointerPx = useRef(new THREE.Vector2(-1, -1));   // previous pointer (device px)
const pointerDelta = useRef(new THREE.Vector2(0, 0));      // per-frame delta (device px)
const pointerUv = useRef(new THREE.Vector2(-1, -1));       // current pointer (fractional uv)
const lastMoveTime = useRef(performance.now());
const dprRef = useRef(1);

useFrame((state, dt) => {
  const { size } = state;
  const dpr = dprRef.current; // = min(gl.getPixelRatio(), 2), kept in sync on resize

  // --- (gating from §4f) ---
  // `solid` (perf "solid effect" mode), `reducedMotion`, `isMobile`, and
  // `inView` (anySectionInViewport(["banner","footer"])) come from your perf/theme
  // helpers. If you have not ported those yet, use the documented fallbacks.
  const solid = false;        // lerpSolidFlag(...) ; fallback: false
  const reducedMotion = false; // prefers-reduced-motion ; fallback: false
  const isMobile = false;      // useIsMobileWidth() ; fallback: false
  const flareActive = false;   // !solid && inView && flarePassExists ; fallback: false (flare not ported)

  // --- pointer -> device px + delta (with 0.9 inertial decay when outside) ---
  const pointerOK = insideRef.current && !isMobile && !reducedMotion;
  if (pointerOK) {
    const px = uv.x * size.width * dpr;
    const py = uv.y * size.height * dpr;
    if (prevPointerPx.current.x >= 0 && prevPointerPx.current.y >= 0) {
      pointerDelta.current.set(px - prevPointerPx.current.x, py - prevPointerPx.current.y);
    } else {
      pointerDelta.current.set(0, 0);
    }
    pointerPx.current.set(px, py);
    prevPointerPx.current.set(px, py);
  } else {
    pointerDelta.current.multiplyScalar(0.9);
  }

  // --- idle detection: 600ms without meaningful movement disables the sim ---
  const speedSq = pointerOK ? pointerDelta.current.lengthSq() : 0;
  const now = performance.now();
  if (speedSq > 1) lastMoveTime.current = now;
  const idle = now - lastMoveTime.current > 600;

  // fluidEnabled: run the simulation + displacement
  const fluidEnabled = !isMobile && !reducedMotion && !solid && !idle;
  // overlayEnabled: show the pointer trail (production ties this to the solid flag)
  const overlayEnabled = solid;

  // --- choose which pass renders to screen (§4f) ---
  // when the flare is inactive OR the fluid is doing work, the fluid pass owns the screen.
  if (!flareActive || fluidEnabled || overlayEnabled) {
    // lensFlare.renderToScreen = false; // if flare ported
    fluid.enabled = true;
    fluid.renderToScreen = true;
  } else {
    // lensFlare.renderToScreen = true;  // if flare ported
    fluid.enabled = false;
  }

  // --- push pointer state into the pass ---
  fluid.setEffectEnabled(fluidEnabled);
  fluid.setPointerOverlayEnabled(overlayEnabled);
  fluid.setPointer(pointerPx.current);
  fluid.setPointerDelta(pointerDelta.current);

  // updatePointer builds the 16-sample decaying trail (uv in fractional coords)
  if (pointerOK) pointerUv.current.copy(uv);
  else pointerUv.current.set(-1, -1);
  fluid.updatePointer(pointerUv.current, pointerOK && overlayEnabled, dt);
}, 0);
```

Notes on faithfulness to the captured loop:

- `pointerPx = uv * (width, height) * dpr` (NDC/fractional -> device px).
- `pointerDelta` is `current - previous` device px, but `(0,0)` on the first valid
  frame; when the pointer is outside it **decays** by `*0.9` each frame (inertia).
- `speedSq > 1` resets the idle timer; `> 600ms` idle turns the sim off (`fluidEnabled=false`)
  while still drawing the (decaying) display so the field settles.
- `overlayEnabled` is driven by the perf **solid** flag in the source
  (`g = _.current`), not by `pointerOK`. Keep that wiring if you port the perf tier;
  the fallback `solid = false` simply hides the trail until perf machinery exists.
- `updatePointer(uv, pointerOK && overlayEnabled, dt)` — the second arg gates whether
  a new trail sample is pushed; `dt` drives the per-entry decay (`MathUtils.damp(s, 0, 2, dt)`).

---

## 5. Without `@react-three/postprocessing` (raw composer)

If you only have the `postprocessing` core, drive it imperatively:

```ts
import { EffectComposer, RenderPass } from "postprocessing";

const composer = new EffectComposer(gl, { multisampling: 0, frameBufferType: THREE.UnsignedByteType });
composer.addPass(new RenderPass(scene, camera));
composer.addPass(fluid);            // fluid is auto-forced to renderToScreen as the last pass

// each frame, instead of the default R3F render loop:
useFrame((state, dt) => {
  // ...the §4 driver body above (omit the renderToScreen toggling) ...
  composer.render(dt);
}, 998); // run after scene useFrames; you must also set frameloop and disable R3F's auto-render
```

The class only depends on the `Pass` contract (`render(renderer, inputBuffer, outputBuffer)`,
`setSize`, `dispose`), so both composer styles work identically.

---

## 6. Quick reference — public API

| Method | Purpose |
|---|---|
| `new FluidPushPass(opts?)` | construct with §2.6 defaults (all optional) |
| `setEffectEnabled(b)` | run/stop the sim + velocity displacement (`uEffectEnabled`) |
| `setPointerOverlayEnabled(b)` | show/hide the pointer trail (`uPointerOpacity`) |
| `setPointer(vec2)` | splat origin, **device px** |
| `setPointerDelta(vec2)` | splat delta, **device px** |
| `updatePointer(uvVec2, enabled, dt)` | advance the 16-sample trail (uv = fractional) |
| `setPointerColor(color)` | trail color (default `#c0fe04`) |
| `setPointerPixelSize(px)` | trail dot cell size (default 16) |
| `setDisplayMetrics(cssW, cssH, dpr)` | viewport metrics for trail cell mapping |
| `enabled` / `renderToScreen` | inherited from `Pass`; toggled per-frame |
| `dispose()` | free all targets + materials |

`setSize(drawingBufferW, drawingBufferH)` is called for you by the composer; it
recomputes the sim resolution (160 on the short edge, widened by aspect ratio) and
resizes every render target.
