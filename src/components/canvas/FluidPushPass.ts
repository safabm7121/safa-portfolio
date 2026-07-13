// GPU fluid simulation post-processing pass (ported from production class `cO`).
//
// A pmndrs `postprocessing` `Pass` subclass that runs a stable-fluids solver
// (curl -> vorticity confinement + pointer splat -> divergence -> Jacobi pressure
// solve -> gradient subtract -> advection) into a chain of ping-pong RGBA HalfFloat
// render targets, then displaces the composed scene (`tDiffuse`) by the resulting
// velocity field and draws a decaying 16-sample pointer "trail" halftone overlay.
//
// See: _analysis/04-webgl.md §2.6 (defaults), §3 (render order), §4f (per-frame loop).
// This module is fully self-contained — it only depends on `three`, `postprocessing`
// and the verbatim GLSL strings in `./shaders`. It does NOT touch MainCanvas.

import * as THREE from "three";
import { Pass } from "postprocessing";
import {
  fluidAdvectionFrag,
  fluidClearFrag,
  fluidCurlFrag,
  fluidDisplayFrag,
  fluidDivergenceFrag,
  fluidGradientSubtractFrag,
  fluidPressureFrag,
  fluidVorticityFrag,
  fullscreenVert,
} from "./shaders";

/** Brand lime used for the pointer trail dots (`cF` in source). */
export const POINTER_TRAIL_COLOR = "#c0fe04";

/** Number of trail samples tracked (ring buffer). */
const TRAIL_LENGTH = 16;
/** Active trail entries fed to the shader (`uTrailCount` is fixed at 14 in source). */
const TRAIL_COUNT = 14;

export interface FluidPushPassOptions {
  /** Display UV displacement strength. Default 0.3. */
  strength?: number;
  /** Pointer splat radius. Default 1.5. */
  radius?: number;
  /** Pointer splat force scale. Default 1. */
  velocityScale?: number;
  /** Spectral chromatic-aberration boost on the display pass. Default 0.002. */
  chromaticStrength?: number;
  /** Jacobi pressure-solve iterations. Default 4. */
  pressureIterations?: number;
  /** Vorticity-confinement strength. Default 0. */
  curlStrength?: number;
  /** Velocity dissipation per step (advection). Default 3. */
  velocityDissipation?: number;
  /** Simulation resolution (short edge). Default 160. */
  simResolution?: number;
}

/**
 * Builds a ping-pong simulation render target: RGBA / HalfFloat / LinearFilter,
 * no depth or stencil. (`cI` in source.)
 */
function makeRenderTarget(width: number, height: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
  });
}

/**
 * Builds a fullscreen-quad simulation material from a fragment shader + uniforms.
 * Uses the shared fullscreen vertex shader; no depth, no tone mapping. (`ck` in source.)
 */
function makeFluidMaterial(
  fragmentShader: string,
  uniforms: Record<string, THREE.IUniform>,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: fullscreenVert,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    transparent: false,
    toneMapped: false,
  });
}

/**
 * Maintains the decaying pointer-trail ring buffer + its display uniforms.
 * (`cP` in source.)
 */
class PointerOverlay {
  /** Viewport size in CSS pixels (used to map pointer px -> cell ids). */
  private cssResolution = new THREE.Vector2(1, 1);
  private devicePixelRatio = 1;
  /** Most-recent-first ring of trail cell positions (device px). */
  private trail: THREE.Vector2[] = Array.from(
    { length: TRAIL_LENGTH },
    () => new THREE.Vector2(0.5, 0.5),
  );
  private trailStrength: number[] = Array.from({ length: TRAIL_LENGTH }, () => 0);
  private lastPointerCell = new THREE.Vector2(-1, -1);
  private pixelSize = 16;

  /** Uniforms merged into the display material. */
  readonly uniforms = {
    uTrail: { value: this.trail },
    uTrailStrength: { value: this.trailStrength },
    uTrailCount: { value: TRAIL_COUNT },
    uPointerColor: { value: new THREE.Color(POINTER_TRAIL_COLOR) },
    uPointerOpacity: { value: 1 },
    uPointerDotRadius: { value: 0.8 },
    uPointerPixelSize: { value: this.pixelSize },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uDevicePixelRatio: { value: this.devicePixelRatio },
  } satisfies Record<string, THREE.IUniform>;

  setColor(color: THREE.ColorRepresentation): void {
    this.uniforms.uPointerColor.value.set(color);
  }

  setPixelSize(size: number): void {
    this.pixelSize = size;
    this.uniforms.uPointerPixelSize.value = size;
  }

  /** CSS viewport size + device pixel ratio. */
  setDisplayMetrics(width: number, height: number, dpr: number): void {
    this.cssResolution.set(Math.max(1, width), Math.max(1, height));
    this.devicePixelRatio = Math.max(1, dpr);
    this.uniforms.uDevicePixelRatio.value = this.devicePixelRatio;
  }

  /** Drawing-buffer resolution in device pixels. */
  setResolution(width: number, height: number): void {
    this.uniforms.uResolution.value.set(Math.max(1, width), Math.max(1, height));
  }

  /**
   * Advances the trail. `pointer` is in device pixels.
   * Decays every active strength toward 0, and (when enabled) pushes the current
   * pointer cell to the head of the ring whenever the pointer crosses a new cell.
   */
  updatePointer(pointer: THREE.Vector2, enabled: boolean, dt: number): void {
    const cellW = Math.max(this.pixelSize / Math.max(this.cssResolution.x, 1), 1e-6);
    const cellH = Math.max(this.pixelSize / Math.max(this.cssResolution.y, 1), 1e-6);

    // Decay strengths. When enabled, skip index 0 (it is re-set to 1 below).
    for (let i = enabled ? 1 : 0; i < TRAIL_COUNT; i += 1) {
      this.trailStrength[i] = THREE.MathUtils.damp(this.trailStrength[i], 0, 2, dt);
    }

    if (enabled) {
      const cellX = Math.floor(pointer.x / cellW);
      const cellY = Math.floor(pointer.y / cellH);
      if (cellX !== this.lastPointerCell.x || cellY !== this.lastPointerCell.y) {
        for (let i = TRAIL_COUNT - 1; i > 0; i -= 1) {
          this.trail[i].copy(this.trail[i - 1]);
          this.trailStrength[i] = this.trailStrength[i - 1];
        }
        this.lastPointerCell.set(cellX, cellY);
      }
      this.trail[0].set(pointer.x, pointer.y);
      this.trailStrength[0] = 1;
      return;
    }

    this.lastPointerCell.set(-1, -1);
  }
}

/**
 * Fluid push pass. Add it to a pmndrs `<EffectComposer>` (see INTEGRATION-fluid.md).
 *
 * Internal render order (`render`, matches §3):
 *   curl(velocityRead -> curl)
 *   vorticity + pointer splat(velocityRead, curl -> vort)
 *   divergence(vort -> divergence)
 *   clear(-> pressureA = 0)
 *   pressureIterations x Jacobi pressure (pressureA <-> pressureB, divergence)
 *   gradientSubtract(vort, pressure -> projectedVelocity)
 *   advection(velocityRead, projectedVelocity -> velocityWrite)
 *   swap velocityRead / velocityWrite
 *   display(tDiffuse = composer input, uVelocity = velocityRead -> screen/output)
 */
export class FluidPushPass extends Pass {
  private readonly simResolution: number;
  private simWidth = 1;
  private simHeight = 1;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private readonly pressureIterations: number;

  private effectEnabled = true;
  private pointerOverlayEnabled = true;
  private readonly resolution = new THREE.Vector2(1, 1);

  private readonly pointerOverlay = new PointerOverlay();
  /** Pointer position in device px (shared by reference with the vorticity uniform). */
  private readonly pointer = new THREE.Vector2(-1, -1);
  /** Pointer delta in device px (shared by reference with the vorticity uniform). */
  private readonly pointerDelta = new THREE.Vector2(0, 0);

  // Ping-pong / scratch render targets.
  private velocityRead = makeRenderTarget(1, 1);
  private velocityWrite = makeRenderTarget(1, 1);
  private readonly curlTarget = makeRenderTarget(1, 1);
  private readonly vortTarget = makeRenderTarget(1, 1);
  private readonly divergenceTarget = makeRenderTarget(1, 1);
  private pressureA = makeRenderTarget(1, 1);
  private pressureB = makeRenderTarget(1, 1);
  private readonly projectedVelocityTarget = makeRenderTarget(1, 1);

  // Sim materials.
  private readonly curlMaterial: THREE.ShaderMaterial;
  private readonly vorticityMaterial: THREE.ShaderMaterial;
  private readonly divergenceMaterial: THREE.ShaderMaterial;
  private readonly clearMaterial: THREE.ShaderMaterial;
  private readonly pressureMaterial: THREE.ShaderMaterial;
  private readonly gradientMaterial: THREE.ShaderMaterial;
  private readonly advectMaterial: THREE.ShaderMaterial;
  private readonly displayMaterial: THREE.ShaderMaterial;

  constructor({
    strength = 0.3,
    radius = 1.5,
    velocityScale = 1,
    chromaticStrength = 0.002,
    pressureIterations = 4,
    curlStrength = 0,
    velocityDissipation = 3,
    simResolution = 160,
  }: FluidPushPassOptions = {}) {
    super("FluidPushPass");

    this.simResolution = simResolution;
    this.pressureIterations = pressureIterations;

    const texel = new THREE.Vector2(1, 1);
    const res = new THREE.Vector2(1, 1);

    this.curlMaterial = makeFluidMaterial(fluidCurlFrag, {
      uVelocity: { value: null },
      uTexelSize: { value: texel.clone() },
    });

    this.vorticityMaterial = makeFluidMaterial(fluidVorticityFrag, {
      uVelocity: { value: null },
      uCurl: { value: null },
      uTexelSize: { value: texel.clone() },
      uResolution: { value: res.clone() },
      // share refs so setPointer/setPointerDelta update the uniforms directly
      uPointer: { value: this.pointer },
      uPointerDelta: { value: this.pointerDelta },
      uCurlStrength: { value: curlStrength },
      uSplatRadius: { value: Math.max(0.002 * radius, 5e-4) },
      uSplatForce: { value: Math.max(3000 * velocityScale, 0) },
    });

    this.divergenceMaterial = makeFluidMaterial(fluidDivergenceFrag, {
      uVelocity: { value: null },
      uTexelSize: { value: texel.clone() },
    });

    this.clearMaterial = makeFluidMaterial(fluidClearFrag, {});

    this.pressureMaterial = makeFluidMaterial(fluidPressureFrag, {
      uPressure: { value: null },
      uDivergence: { value: null },
      uTexelSize: { value: texel.clone() },
    });

    this.gradientMaterial = makeFluidMaterial(fluidGradientSubtractFrag, {
      uVelocity: { value: null },
      uPressure: { value: null },
      uTexelSize: { value: texel.clone() },
    });

    this.advectMaterial = makeFluidMaterial(fluidAdvectionFrag, {
      uVelocity: { value: null },
      uProjectedVelocity: { value: null },
      uTexelSize: { value: texel.clone() },
      uDissipation: { value: velocityDissipation },
    });

    this.displayMaterial = makeFluidMaterial(fluidDisplayFrag, {
      tDiffuse: { value: null },
      uVelocity: { value: null },
      uSimSize: { value: new THREE.Vector2(simResolution, simResolution) },
      uDisplacementStrength: { value: Math.max(strength / 0.3, 0) },
      uChromaticBoost: { value: Math.max(chromaticStrength / 0.004, 0) },
      uEffectEnabled: { value: 1 },
      ...this.pointerOverlay.uniforms,
    });

    // The pass renders its internal `scene` (a fullscreen triangle) with whatever
    // material is currently assigned. Display is the default fullscreen material.
    this.fullscreenMaterial = this.displayMaterial;
  }

  // --- public controls (called from the per-frame loop, see INTEGRATION-fluid.md) ---

  /** Enable/disable the velocity displacement + simulation stepping. */
  setEffectEnabled(enabled: boolean): void {
    this.effectEnabled = enabled;
    this.displayMaterial.uniforms.uEffectEnabled.value = enabled ? 1 : 0;
  }

  /** Enable/disable the pointer trail overlay. */
  setPointerOverlayEnabled(enabled: boolean): void {
    this.pointerOverlayEnabled = enabled;
    this.displayMaterial.uniforms.uPointerOpacity.value = enabled ? 1 : 0;
  }

  /** Override the pointer trail color (defaults to brand lime #c0fe04). */
  setPointerColor(color: THREE.ColorRepresentation): void {
    this.pointerOverlay.setColor(color);
  }

  /** Override the pointer dot pixel size (default 16). */
  setPointerPixelSize(size: number): void {
    this.pointerOverlay.setPixelSize(size);
    if (this.pointerOverlayEnabled) {
      this.displayMaterial.uniforms.uPointerOpacity.value = 1;
    }
  }

  /** Provide CSS viewport size + device pixel ratio for the trail cell mapping. */
  setDisplayMetrics(width: number, height: number, dpr: number): void {
    this.pointerOverlay.setDisplayMetrics(width, height, dpr);
  }

  /** Advance the trail ring. `pointer` is in device px; pass (-1,-1) when outside. */
  updatePointer(pointer: THREE.Vector2, enabled: boolean, dt: number): void {
    this.pointerOverlay.updatePointer(pointer, enabled, dt);
  }

  /** Set the splat origin in device px. */
  setPointer(pointer: THREE.Vector2): void {
    this.pointer.copy(pointer);
  }

  /** Set the splat delta in device px. */
  setPointerDelta(delta: THREE.Vector2): void {
    this.pointerDelta.copy(delta);
  }

  /**
   * Resize simulation targets. Called by the EffectComposer with the
   * drawing-buffer size; recomputes sim dimensions from the aspect ratio.
   */
  override setSize(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);

    const base = this.simResolution;
    const aspect = this.viewportWidth / this.viewportHeight;
    if (aspect > 1) {
      this.simWidth = Math.round(base * aspect);
      this.simHeight = base;
    } else {
      this.simWidth = base;
      this.simHeight = Math.round(base / Math.max(aspect, 1e-4));
    }

    this.resizeRenderTarget(this.velocityRead);
    this.resizeRenderTarget(this.velocityWrite);
    this.resizeRenderTarget(this.curlTarget);
    this.resizeRenderTarget(this.vortTarget);
    this.resizeRenderTarget(this.divergenceTarget);
    this.resizeRenderTarget(this.pressureA);
    this.resizeRenderTarget(this.pressureB);
    this.resizeRenderTarget(this.projectedVelocityTarget);

    const texelX = 1 / this.simWidth;
    const texelY = 1 / this.simHeight;
    const viewportRes = new THREE.Vector2(this.viewportWidth, this.viewportHeight);
    const simSize = new THREE.Vector2(this.simWidth, this.simHeight);

    this.resolution.copy(viewportRes);
    this.pointerOverlay.setResolution(this.viewportWidth, this.viewportHeight);

    for (const material of [
      this.curlMaterial,
      this.vorticityMaterial,
      this.divergenceMaterial,
      this.pressureMaterial,
      this.gradientMaterial,
      this.advectMaterial,
    ]) {
      const uTexelSize = material.uniforms.uTexelSize;
      if (uTexelSize) {
        (uTexelSize.value as THREE.Vector2).set(texelX, texelY);
      }
    }

    (this.vorticityMaterial.uniforms.uResolution.value as THREE.Vector2).copy(viewportRes);
    (this.displayMaterial.uniforms.uSimSize.value as THREE.Vector2).copy(simSize);
  }

  override render(
    renderer: THREE.WebGLRenderer,
    inputBuffer: THREE.WebGLRenderTarget | null,
    outputBuffer: THREE.WebGLRenderTarget | null,
  ): void {
    if (!inputBuffer) {
      return;
    }

    const prevRenderTarget = renderer.getRenderTarget();

    // `pressureRead`/`pressureWrite` are the ping-pong pressure handles; they are
    // intentionally distinct from inputBuffer/outputBuffer.
    let pressureRead = this.pressureA;
    let pressureWrite = this.pressureB;

    if (this.effectEnabled) {
      // curl of current velocity
      this.curlMaterial.uniforms.uVelocity.value = this.velocityRead.texture;
      this.renderMaterial(renderer, this.curlMaterial, this.curlTarget);

      // vorticity confinement + pointer splat -> vortTarget (new velocity)
      this.vorticityMaterial.uniforms.uVelocity.value = this.velocityRead.texture;
      this.vorticityMaterial.uniforms.uCurl.value = this.curlTarget.texture;
      this.renderMaterial(renderer, this.vorticityMaterial, this.vortTarget);

      // divergence of the splatted velocity
      this.divergenceMaterial.uniforms.uVelocity.value = this.vortTarget.texture;
      this.renderMaterial(renderer, this.divergenceMaterial, this.divergenceTarget);

      // clear pressure
      this.renderMaterial(renderer, this.clearMaterial, this.pressureA);

      // Jacobi pressure solve (ping-pong)
      pressureRead = this.pressureA;
      pressureWrite = this.pressureB;
      for (let i = 0; i < this.pressureIterations; i += 1) {
        this.pressureMaterial.uniforms.uPressure.value = pressureRead.texture;
        this.pressureMaterial.uniforms.uDivergence.value = this.divergenceTarget.texture;
        this.renderMaterial(renderer, this.pressureMaterial, pressureWrite);
        const tmp = pressureRead;
        pressureRead = pressureWrite;
        pressureWrite = tmp;
      }

      // subtract pressure gradient -> projected (divergence-free) velocity
      this.gradientMaterial.uniforms.uVelocity.value = this.vortTarget.texture;
      this.gradientMaterial.uniforms.uPressure.value = pressureRead.texture;
      this.renderMaterial(renderer, this.gradientMaterial, this.projectedVelocityTarget);

      // advect velocity + dissipation -> velocityWrite
      this.advectMaterial.uniforms.uVelocity.value = this.velocityRead.texture;
      this.advectMaterial.uniforms.uProjectedVelocity.value =
        this.projectedVelocityTarget.texture;
      this.renderMaterial(renderer, this.advectMaterial, this.velocityWrite);

      this.swapVelocityTargets();
    }

    // display: displace the composed scene by the velocity field + pointer overlay
    this.displayMaterial.uniforms.tDiffuse.value = inputBuffer.texture;
    this.displayMaterial.uniforms.uVelocity.value = this.velocityRead.texture;
    this.fullscreenMaterial = this.displayMaterial;
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
    renderer.clear();
    renderer.render(this.scene, this.camera);

    renderer.setRenderTarget(prevRenderTarget);
  }

  override dispose(): void {
    this.velocityRead.dispose();
    this.velocityWrite.dispose();
    this.curlTarget.dispose();
    this.vortTarget.dispose();
    this.divergenceTarget.dispose();
    this.pressureA.dispose();
    this.pressureB.dispose();
    this.projectedVelocityTarget.dispose();
    this.curlMaterial.dispose();
    this.vorticityMaterial.dispose();
    this.divergenceMaterial.dispose();
    this.clearMaterial.dispose();
    this.pressureMaterial.dispose();
    this.gradientMaterial.dispose();
    this.advectMaterial.dispose();
    this.displayMaterial.dispose();
  }

  /** Renders `material` (assigned to the fullscreen triangle) into `target`. */
  private renderMaterial(
    renderer: THREE.WebGLRenderer,
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget,
  ): void {
    this.fullscreenMaterial = material;
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(this.scene, this.camera);
  }

  private resizeRenderTarget(target: THREE.WebGLRenderTarget): void {
    target.setSize(this.simWidth, this.simHeight);
  }

  private swapVelocityTargets(): void {
    const tmp = this.velocityRead;
    this.velocityRead = this.velocityWrite;
    this.velocityWrite = tmp;
  }
}

export default FluidPushPass;
