import { Effect, BlendFunction } from "postprocessing";
import { Color, Uniform } from "three";

/**
 * MaskedDotsEffect (ORCH chunk e553ef8a, verbatim GLSL). A halftone-dot fullscreen
 * mask that forms a circular "hole": each pixel-grid cell draws a dot whose radius
 * is driven by a radial mask (hole closed = dots full → screen covered). Used for the
 * route-transition wipe. Defaults verbatim: pixelSize 32, feather .5, holeRadius 2.
 */
const FRAGMENT = /* glsl */ `
uniform float pixelSize;
uniform float uFeather;
uniform float uAspect;
uniform float uHoleRadius;
uniform float uProgress;
uniform vec3 uOverlayColor;

void dotsMainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 normalizedPixelSize = pixelSize / resolution;
    float a = clamp(inputColor.a, 0.0, 1.0);
    vec2 cellUV = fract(uv / normalizedPixelSize);
    float radius = 0.8 * a;
    vec2 circleCenter = vec2(0.5, 0.5);
    float distanceFromCenter = distance(cellUV, circleCenter);
    float aa = fwidth(distanceFromCenter) * 1.5;
    float circleMask = smoothstep(radius, radius - aa, distanceFromCenter);
    outputColor = vec4(vec3(circleMask), circleMask);
}

float radialMaskAlpha(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0;
  if (uAspect > 1.0) {
    p.x *= uAspect;
  } else {
    p.y /= max(uAspect, 0.0001);
  }
  float d = length(p);
  float edge = max(uFeather, uHoleRadius * 0.12);
  float alphaHole = smoothstep(uHoleRadius, uHoleRadius + edge, d);
  float fillMix = smoothstep(0.92, 1.0, uProgress);
  return mix(alphaHole, 1.0, fillMix);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 normalizedPixelSize = pixelSize / resolution;
  vec2 cellId = floor(uv / normalizedPixelSize);
  vec2 uvCellCenter = (cellId + vec2(0.5)) * normalizedPixelSize;
  float cellAlpha = clamp(radialMaskAlpha(uvCellCenter), 0.0, 1.0);

  vec4 dotOut;
  dotsMainImage(vec4(0.0, 0.0, 0.0, cellAlpha), uv, dotOut);
  float dotMask = clamp(dotOut.a, 0.0, 1.0);

  float finalAlpha = dotMask;
  vec3 outRgb = uOverlayColor * finalAlpha;
  outputColor = vec4(outRgb, finalAlpha);
}
`;

export type MaskedDotsParams = {
  pixelSize?: number;
  feather?: number;
  aspect?: number;
  holeRadius?: number;
  progress?: number;
  overlayColor?: Color;
};

export class MaskedDotsEffect extends Effect {
  pixelSize: number;
  feather: number;
  aspect: number;
  holeRadius: number;
  progress: number;
  overlayColor: Color;
  private _dirty = true;

  constructor({
    pixelSize = 32,
    feather = 0.5,
    aspect = 1,
    holeRadius = 2,
    progress = 0,
    overlayColor = new Color(1, 1, 1),
  }: MaskedDotsParams = {}) {
    const uniforms = new Map<string, Uniform>([
      ["pixelSize", new Uniform(pixelSize)],
      ["uFeather", new Uniform(feather)],
      ["uAspect", new Uniform(aspect)],
      ["uHoleRadius", new Uniform(holeRadius)],
      ["uProgress", new Uniform(progress)],
      ["uOverlayColor", new Uniform(overlayColor.clone())],
    ]);
    super("MaskedDotsEffect", FRAGMENT, { uniforms, blendFunction: BlendFunction.SRC });
    this.pixelSize = pixelSize;
    this.feather = feather;
    this.aspect = aspect;
    this.holeRadius = holeRadius;
    this.progress = progress;
    this.overlayColor = overlayColor.clone();
  }

  setParams(p: MaskedDotsParams) {
    let dirty = false;
    if (typeof p.pixelSize === "number" && p.pixelSize !== this.pixelSize) { this.pixelSize = p.pixelSize; dirty = true; }
    if (typeof p.feather === "number" && p.feather !== this.feather) { this.feather = p.feather; dirty = true; }
    if (typeof p.aspect === "number" && p.aspect !== this.aspect) { this.aspect = p.aspect; dirty = true; }
    if (typeof p.holeRadius === "number" && p.holeRadius !== this.holeRadius) { this.holeRadius = p.holeRadius; dirty = true; }
    if (typeof p.progress === "number" && p.progress !== this.progress) { this.progress = p.progress; dirty = true; }
    if (p.overlayColor && !this.overlayColor.equals(p.overlayColor)) { this.overlayColor.copy(p.overlayColor); dirty = true; }
    if (dirty) this._dirty = true;
  }

  update() {
    if (!this._dirty) return;
    this._dirty = false;
    const u = this.uniforms;
    u.get("pixelSize")!.value = this.pixelSize;
    u.get("uFeather")!.value = this.feather;
    u.get("uAspect")!.value = this.aspect;
    u.get("uHoleRadius")!.value = this.holeRadius;
    u.get("uProgress")!.value = this.progress;
    (u.get("uOverlayColor")!.value as Color).copy(this.overlayColor);
  }
}
