# LensFlarePass — integration notes

`LensFlarePass.ts` is a standalone `postprocessing` `Pass` subclass (a faithful
port of the production `cT` class). It does its own bright-pass + anamorphic
star streaks and composites `base + flare`. It is **not** a pmndrs
`BloomEffect` — there is no Bloom anywhere in this scene. See
`_analysis/04-webgl.md` §2.5 / §3.

This file documents how to instantiate it and wire it into the composer. It
does **not** modify `MainCanvas.tsx`; do that wiring there when the composer is
added.

---

## 1. Where it lives in the pipeline

Single `<EffectComposer multisampling={0} renderPriority={998} frameBufferType={UnsignedByteType}>`
with two custom passes only (in order):

```
[implicit RenderPass]     // @react-three/postprocessing auto-adds this for the scene
  → LensFlarePass         // bright-pass + star streaks, composited onto the scene
  → FluidPushPass         // velocity-field UV displacement + pointer trail
```

`multisampling: 0` (MSAA off), `frameBufferType` = `UnsignedByteType` (LDR),
`renderPriority: 998` (runs after scene `useFrame`s).

Note: the LDR (`UnsignedByteType`) composer matches the pass's
`flareTarget` (also `UnsignedByteType`), and the streak frag is tuned for
sRGB/LDR thresholds (~0.99). Keep the composer `frameBufferType` as
`UnsignedByteType`.

---

## 2. Instantiation

```ts
import { useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  LensFlarePass,
  LENS_FLARE_DEFAULTS,
  LENS_FLARE_TAIL_COLOR,
} from "@/components/canvas/LensFlarePass";

const { size, gl } = useThree();
const dark = /* resolvedTheme === "dark" */ false;

const lensFlare = useMemo(
  () =>
    new LensFlarePass({
      flareDownsample: 0.5, // UnsignedByte target at half res
      flareStride: 2, // re-render the flare every 2nd frame
      ...LENS_FLARE_DEFAULTS, // starRays 6, intensity 0.7, threshold 0.99,
      //                          streakScale 8, hotspotPower 32, gate 0.88,
      //                          tailColor "#ffa300"
    }),
  [],
);

useEffect(() => () => lensFlare.dispose(), [lensFlare]);
```

> The pass is a long-lived object: create it once with `useMemo` (empty deps)
> and update it imperatively via `setParams` / `setSize` / `enabled` /
> `renderToScreen`. Do **not** re-create it on theme/size changes.

---

## 3. Composer wiring (`@react-three/postprocessing`)

`LensFlarePass` is a raw `postprocessing.Pass`, so add it with `<primitive>`:

```tsx
import { EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

<EffectComposer
  multisampling={0}
  frameBufferType={THREE.UnsignedByteType}
  renderPriority={998}
  // autoClear defaults true; leave it
>
  <primitive object={lensFlare} />
  <primitive object={fluidPass} />
</EffectComposer>;
```

The `EffectComposer` calls `pass.setSize(w, h)` on mount + every resize and
`pass.render(renderer, inputBuffer, outputBuffer, dt, stencil)` each frame, so
no manual `setSize` is needed when it lives inside the composer.

`needsSwap` is left at the base default (`true`): the composite writes the
full frame to the output buffer, so the buffers should swap for the next pass.

---

## 4. Per-frame updates (theme, size, gating)

Done in the composer-host `useFrame` (priority 0) — see `_analysis/04-webgl.md`
§4(f). Minimal version:

```ts
// theme tail color (only when it actually changes)
const tailColor = dark ? LENS_FLARE_TAIL_COLOR.dark : LENS_FLARE_TAIL_COLOR.light;
lensFlare.setParams({ ...LENS_FLARE_DEFAULTS, tailColor });

// gating: enable only when not in "solid" perf mode and a flare section is in view
const flareActive = !solid && anySectionInViewport(["banner", "footer"]);
if (!prevFlareActive && flareActive) lensFlare.resetFlareCadence();
lensFlare.enabled = flareActive;

// renderToScreen is toggled against FluidPushPass:
//   flare active        → lensFlare.renderToScreen = false; fluid renders to screen
//   flare inactive path → lensFlare.renderToScreen = true;  fluid disabled
// (the composer also auto-manages renderToScreen for the last enabled pass,
//  but the production app sets it explicitly — mirror §4(f) when both passes
//  are present.)
```

### streakScale must be scaled by resolution

`LENS_FLARE_DEFAULTS.streakScale` is the **base** value (8). Production scales
it per frame before passing it to the pass:

```ts
const isMobile = size.width < 1024; // or your mobile heuristic
const scaled =
  LENS_FLARE_DEFAULTS.streakScale *
  (Math.max(1, size.width) / 1920) *
  (isMobile ? 2 : 1);

lensFlare.setParams({ ...LENS_FLARE_DEFAULTS, streakScale: scaled, tailColor });
```

Recompute this whenever `size.width` changes (and fold it into the same
`setParams` call as the theme color).

---

## 5. Standalone use (without `@react-three/postprocessing`)

If you ever drive it manually:

```ts
lensFlare.setSize(width, height); // call on resize (sets uResolution + flareTarget)
// each frame, given the scene already rendered into `inputBuffer`:
lensFlare.render(renderer, inputBuffer, outputBuffer);
// set lensFlare.renderToScreen = true to draw straight to the canvas (outputBuffer ignored)
```

`render(renderer, inputBuffer, outputBuffer)` ignores `deltaTime`/`stencilTest`
(the production pass does too).

---

## 6. API surface

| member | purpose |
|---|---|
| `new LensFlarePass(opts)` | `opts`: `LensFlarePassOptions` (params + `flareDownsample` 0.5, `flareStride` 2) |
| `setParams(p)` | update `starRays/intensity/threshold/streakScale/hotspotPower/gate/tailColor` |
| `setFlareDownsample(n)` | clamp 0.2–1, resizes `flareTarget`, resets cadence |
| `setFlareStride(n)` | re-render flare every `n` frames (>= 1) |
| `resetFlareCadence()` | force the flare to re-render next frame (call when re-enabling) |
| `setSize(w, h)` | sets `uResolution` + resizes `flareTarget` (composer calls this) |
| `enabled` | inherited; gate the pass on/off |
| `renderToScreen` | inherited; toggle with the fluid pass per §4(f) |
| `dispose()` | frees `flareTarget` + both materials |

Exports: `LensFlarePass` (named + default), `LENS_FLARE_DEFAULTS`,
`LENS_FLARE_TAIL_COLOR`, and the `LensFlareParams` / `LensFlarePassOptions` /
`StarRays` types.
