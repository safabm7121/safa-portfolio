import { Pass } from "postprocessing";
import {
  Color,
  LinearFilter,
  LinearSRGBColorSpace,
  RGBAFormat,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
  type ColorRepresentation,
  type WebGLRenderer,
} from "three";
import {
  fullscreenVert,
  lensflareStreakFrag,
  lensflareCompositeFrag,
} from "@/components/canvas/shaders";

/**
 * LensFlarePass — faithful port of the production `cT` postprocessing pass.
 *
 * Pipeline (per frame, gated by `flareStride` cadence):
 *   1. bright-pass + anamorphic star-streak material (`lensflare-streak.frag`)
 *      is rendered from the composer input into a downsampled `flareTarget`
 *      (UnsignedByte, scale = `flareDownsample` 0.5).
 *   2. composite material (`lensflare-composite.frag`) outputs `base + flare`
 *      to the screen (or the output buffer).
 *
 * The "glow" of the site is produced by THIS pass (its own bright-pass + star
 * streaks), not by a pmndrs BloomEffect. See _analysis/04-webgl.md §2.5 / §3.
 */

export type StarRays = 4 | 6 | 8;

/** Runtime params (from the dev/Leva control defaults, _analysis §2.5). */
export interface LensFlareParams {
  /** 4 | 6 | 8 — number of anamorphic rays (cross / star-of-david / 8-point). */
  starRays: number;
  /** Overall flare intensity multiplier. */
  intensity: number;
  /** Bright-pass luminance threshold (LDR/sRGB, ~0.8–0.99). */
  threshold: number;
  /**
   * Streak length in source pixels. Production scales this per frame by
   * `× max(1, width) / 1920 × (mobile ? 2 : 1)` before passing it in.
   */
  streakScale: number;
  /** Hotspot core sharpness (pow exponent on the bright mask). */
  hotspotPower: number;
  /** Soft gate that suppresses faint flares (0–1). */
  gate: number;
  /** Tail tint — theme aware: light `#ffa300`, dark `#1600ff`. */
  tailColor: ColorRepresentation;
}

export interface LensFlarePassOptions extends LensFlareParams {
  /** Downsample factor of the flare target (clamped 0.2–1). Default 0.5. */
  flareDownsample?: number;
  /** Render the flare every N frames (>= 1). Default 2. */
  flareStride?: number;
}

/** Code defaults matching the production Leva control (_analysis §2.5). */
export const LENS_FLARE_DEFAULTS: LensFlareParams = {
  starRays: 6,
  intensity: 0.7,
  threshold: 0.99,
  streakScale: 8,
  hotspotPower: 32,
  gate: 0.88,
  tailColor: "#ffa300",
};

/** Theme tail colors. */
export const LENS_FLARE_TAIL_COLOR = {
  light: "#ffa300",
  dark: "#1600ff",
} as const;

type StreakUniforms = {
  tDiffuse: { value: import("three").Texture | null };
  uResolution: { value: Vector2 };
  uEnabled: { value: number };
  uStarRays: { value: number };
  uIntensity: { value: number };
  uThreshold: { value: number };
  uStreakScale: { value: number };
  uHotspotPower: { value: number };
  uGate: { value: number };
  uTailColor: { value: Color };
};

type CompositeUniforms = {
  tBase: { value: import("three").Texture | null };
  tFlare: { value: import("three").Texture | null };
};

/** Mirror the production behaviour: strip the colorspace include from the streak frag. */
function stripColorspaceInclude(src: string): string {
  return src.replace(/#include\s+<colorspace_fragment>\s*/g, "");
}

export class LensFlarePass extends Pass {
  private flareScale: number;
  private flareStride: number;
  private flareFrame = 0;
  private width = 1;
  private height = 1;

  readonly flareTarget: WebGLRenderTarget;
  readonly flareMaterial: ShaderMaterial;
  readonly compositeMaterial: ShaderMaterial;

  constructor({
    flareDownsample = 0.5,
    flareStride = 2,
    starRays,
    intensity,
    threshold,
    streakScale,
    hotspotPower,
    gate,
    tailColor,
  }: LensFlarePassOptions) {
    super("LensFlarePass");

    this.flareScale = Math.min(1, Math.max(0.2, flareDownsample));
    this.flareStride = Math.max(1, Math.floor(flareStride));

    // Downsampled, LDR (UnsignedByte) flare target — no depth/stencil/mips.
    this.flareTarget = new WebGLRenderTarget(1, 1, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
    this.flareTarget.texture.colorSpace = LinearSRGBColorSpace;
    this.flareTarget.texture.generateMipmaps = false;
    this.flareTarget.texture.name = "LensFlarePass.Target";

    // Bright-pass + star-streak material. Production strips the colorspace
    // include from the fragment shader so the flare stays in linear space.
    this.flareMaterial = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new Vector2(1, 1) },
        uEnabled: { value: 1 },
        uStarRays: { value: starRays },
        uIntensity: { value: intensity },
        uThreshold: { value: threshold },
        uStreakScale: { value: streakScale },
        uHotspotPower: { value: hotspotPower },
        uGate: { value: gate },
        uTailColor: { value: new Color(tailColor) },
      } satisfies StreakUniforms,
      vertexShader: fullscreenVert,
      fragmentShader: stripColorspaceInclude(lensflareStreakFrag),
      depthTest: false,
      depthWrite: false,
      transparent: false,
      toneMapped: false,
    });

    // Composite material: out = base + flare.
    this.compositeMaterial = new ShaderMaterial({
      uniforms: {
        tBase: { value: null },
        tFlare: { value: null },
      } satisfies CompositeUniforms,
      vertexShader: fullscreenVert,
      fragmentShader: lensflareCompositeFrag,
      depthTest: false,
      depthWrite: false,
      transparent: false,
      toneMapped: false,
    });

    // The fullscreen mesh starts with the composite material bound.
    this.fullscreenMaterial = this.compositeMaterial;
  }

  private get streakUniforms(): StreakUniforms {
    return this.flareMaterial.uniforms as unknown as StreakUniforms;
  }

  private get compositeUniforms(): CompositeUniforms {
    return this.compositeMaterial.uniforms as unknown as CompositeUniforms;
  }

  /** Update the runtime flare params (theme/Leva driven). */
  setParams({
    starRays,
    intensity,
    threshold,
    streakScale,
    hotspotPower,
    gate,
    tailColor,
  }: LensFlareParams): void {
    const u = this.streakUniforms;
    u.uStarRays.value = starRays;
    u.uIntensity.value = intensity;
    u.uThreshold.value = threshold;
    u.uStreakScale.value = streakScale;
    u.uHotspotPower.value = hotspotPower;
    u.uGate.value = gate;
    u.uTailColor.value.set(tailColor);
  }

  setFlareDownsample(value: number): void {
    this.flareScale = Math.min(1, Math.max(0.2, value));
    this.resizeFlareTarget();
  }

  setFlareStride(value: number): void {
    this.flareStride = Math.max(1, Math.floor(value));
  }

  /** Reset the render cadence so the flare renders on the next frame. */
  resetFlareCadence(): void {
    this.flareFrame = 0;
  }

  override setSize(width: number, height: number): void {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.streakUniforms.uResolution.value.set(this.width, this.height);
    this.resizeFlareTarget();
  }

  private resizeFlareTarget(): void {
    const w = Math.max(1, Math.floor(this.width * this.flareScale));
    const h = Math.max(1, Math.floor(this.height * this.flareScale));
    this.flareTarget.setSize(w, h);
    this.resetFlareCadence();
  }

  override render(
    renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget | null,
    outputBuffer: WebGLRenderTarget | null,
  ): void {
    if (!inputBuffer) return;

    // Re-render the flare only on the cadence boundary; otherwise reuse the
    // last flareTarget (the composite still runs every frame).
    if (this.flareFrame % this.flareStride === 0) {
      this.streakUniforms.tDiffuse.value = inputBuffer.texture;
      this.fullscreenMaterial = this.flareMaterial;
      renderer.setRenderTarget(this.flareTarget);
      renderer.clear();
      renderer.render(this.scene, this.camera);
    }
    this.flareFrame += 1;

    // Composite base + flare to screen / output buffer.
    const c = this.compositeUniforms;
    c.tBase.value = inputBuffer.texture;
    c.tFlare.value = this.flareTarget.texture;
    this.fullscreenMaterial = this.compositeMaterial;
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
    renderer.clear();
    renderer.render(this.scene, this.camera);
  }

  override dispose(): void {
    this.flareTarget.dispose();
    this.flareMaterial.dispose();
    this.compositeMaterial.dispose();
    super.dispose();
  }
}

export default LensFlarePass;
