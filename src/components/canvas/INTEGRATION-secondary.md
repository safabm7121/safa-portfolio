# Secondary WebGL components — integration notes

Three standalone R3F components reconstructed from production (`7758f29a8aeb1c60.js`),
each driving one `<shaderMaterial>` with GLSL imported from `./shaders`:

| Component | Source comp | Mesh | renderOrder | Material flags |
|---|---|---|---|---|
| `DotGridOverlay.tsx` | `s1` | `<planeGeometry args={[2,2]}/>` | **10** | `transparent, depthTest:false, depthWrite:false, toneMapped:false` |
| `WarpStripes.tsx` | `cx` | merged `cursor.glb` geometry | **12** | `transparent, depthTest:true, depthWrite:false, toneMapped:false, side:FrontSide` |
| `StickerLayer.tsx` | `cw`/`cE` | `<planeGeometry args={[2,2]}/>` | **20** | `transparent, toneMapped:false, depthTest:false, depthWrite:false, polygonOffset(-1,-1)` |

All three are **client** components ("use client", they use hooks/`useFrame`). They render
nothing into the DOM — they mount as children of the existing `<Canvas>` in
`MainCanvas.tsx` (`<Scene>`). They do NOT create their own `<Canvas>`.

## Layer / draw-order model (the main background Canvas)

The main scene uses THREE layers (see `MainCanvas.tsx`):
- **layer 1** — background content (`BackgroundGradient`). Rendered into the dispersion FBO each frame (`camera.layers.set(1)` in the priority `-1` useFrame), and also drawn to screen.
- **layer 10** — glass models (`GlassModel`), excluded from the FBO so the glass refracts only the background.

Where the secondary components sit:
- **DotGridOverlay** — a fullscreen NDC quad (vertex writes `gl_Position = vec4(position,1.0)`, ignoring camera). It is a transition *curtain* drawn on top of everything via `renderOrder:10` + `depthTest:false`. Leave it on the default layer (0, visible to the camera). Drive `opacity` 0→1 for section/route transitions; `dark` picks `#0F1111`/`#FBFAF4`.
- **WarpStripes** — a real 3D mesh (camera-projected, world-space normals). It reuses `cursor.glb`. In production it is an *alternate* render path for the cursor model (hyperspace transition) and is the same kind of object as the glass — it should be camera-visible. If you put it on a dedicated layer, the camera must `enable()` that layer. By default it renders on layer 0 (camera sees it). Drive `stripeReveal` from scroll progress; `iTime` self-advances and is clamped in-shader to `uScrollDuration` (=2).
- **StickerLayer** — a fullscreen NDC quad whose `uRect` positions the sampled image over a DOM element. `renderOrder:20` puts it above the dot-grid. `depthTest:false`, so it composites on top regardless of the 3D scene. One instance per `{imageUrl, hoverImageUrl, targetRef}` in the page's `layers` array.

Recommended on-screen stacking (back→front): background gradient (layer 1) → glass + warp (3D) → **DotGridOverlay (10)** → **StickerLayer (20)**. renderOrder enforces this within the same transparent pass; all three use `depthTest:false` (except WarpStripes which is a depth-tested 3D mesh).

## How `MainCanvas` should mount them (do not edit MainCanvas in this task)

Inside `<Scene>` of `src/components/canvas/MainCanvas.tsx`, after the existing
`<BackgroundGradient/>` + `<GlassModel/>`s:

```tsx
import { DotGridOverlay } from "./DotGridOverlay";
import { WarpStripes } from "./WarpStripes";
import { StickerLayer } from "./StickerLayer";

// ...inside <Scene/>, dark = resolved === "dark":

// (optional) hyperspace transition variant of the cursor model
<WarpStripes stripeReveal={scrollReveal} scale={0.1} />

// DOM-synced sticker layers — one per data-driven layer
{layers.map((l) => (
  <Suspense key={l.key} fallback={null}>
    <StickerLayer
      imageUrl={l.imageUrl}
      hoverImageUrl={l.hoverImageUrl}
      targetRef={l.targetRef}
      dark={dark}
    />
  </Suspense>
))}

// transition curtain — drawn last (renderOrder 10), opacity 0 when idle
<DotGridOverlay dark={dark} opacity={overlayOpacity} pixelSize={4} radiusScale={0.9} />
```

Notes:
- Wrap `WarpStripes` and each `StickerLayer` in `<Suspense fallback={null}>` because
  they call `useLoader` (GLB / textures) and will suspend on first render. (`<Scene>`
  is already inside a `<Suspense>` in `MainCanvas`, so a single boundary also works.)
- `StickerLayer.targetRef` is a normal React ref to a **DOM** element rendered by a
  page/section component (e.g. an image placeholder). The component reads
  `getBoundingClientRect()` every frame and converts to screen-UV
  (`uRect = [left/W, 1-(top+h)/H, w/W, h/H]`, Y flipped), matching the source `cE`.
- The `layers` array (which DOM nodes get stickers, and the hover image per node) is
  **data-driven** in production (`t.layers`) and is supplied by the page, not hardcoded
  here. See risk #3 in `_analysis/04-webgl.md`.

## Uniform sources (verbatim)

- DotGridOverlay → §2.4: `uPixelSize 4` (main canvas), `uRadiusScale 0.9`, `uColor` = `dark?#0F1111:#FBFAF4`, `uResolution` = `(size.width, size.height)`, `uOpacity` = transition driver.
- WarpStripes → §2.2: full default block; `uAccentColor`/`uStripeColorA` = `#009dff`, `uStripeColorB` = `#64c3ff`, `uScrollDuration 2`, `iResolution` = drawing-buffer px, `iTime += dt`, `uStripeReveal` = scroll 0..1.
- StickerLayer → §2.3: full default block; `uDotPixelSize 18`, `uPolarityPositive` animated toward `dark?1:0` (easeInOutCubic), `uHoverRevealProgress` = `0.5-0.5cos(π·m)` ramp, `uViewportPx` = `(size.width, size.height)`.

## Things intentionally left to the caller / MainCanvas

These were per-frame *inputs* in production that this task's components expose as props
rather than computing internally (so MainCanvas / a scroll hook owns them):
- `stripeReveal` and `overlayOpacity` (scroll/section progress).
- `WarpStripes` pointer-proximity scale/spin (`restScale 0.1`, `scaleSmoothing 32`,
  `scaleSpinDegrees 360`) — NOT implemented here; pass `scale`/`rotation` if needed.
- `StickerLayer` `uCurlStrength` (page-curl, ~`0.06 * pointerSpeed`) and
  `uRevealProgress` (scroll wipe) are left at their shader defaults (0 / 1); wire a
  pointer-speed/scroll signal in if the page-curl + reveal-wipe are desired.
