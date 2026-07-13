import * as THREE from "three";

// Default uniforms for the dispersion glass material (verbatim defaults from 04-webgl.md §2.1).
export function makeDispersionUniforms() {
  return {
    uTexture: { value: null as THREE.Texture | null },
    uIorR: { value: 1.15 },
    uIorY: { value: 1.16 },
    uIorG: { value: 1.18 },
    uIorC: { value: 1.22 },
    uIorB: { value: 1.22 },
    uIorP: { value: 1.22 },
    uRefractPower: { value: 0.24 },
    uChromaticAberration: { value: 0.24 },
    uSaturation: { value: 1.0 },
    uShininess: { value: 36.0 },
    uDiffuseness: { value: 0.1 },
    uFresnelPower: { value: 6.0 },
    uBrightness: { value: 1.0 },
    uContrast: { value: 1.32 },
    uGamma: { value: 1.0 },
    uSpecularStrength: { value: 4.3 },
    uFresnelStrength: { value: 1.6 },
    uFresnelSideDir: { value: new THREE.Vector3(-1, 0.3, 1) },
    uTintColorA: { value: new THREE.Vector4(1, 1, 1, 1) },
    uTintColorB: { value: new THREE.Vector4(1, 1, 1, 1) },
    uTintLocalYRange: { value: new THREE.Vector2(0, 1) },
    uTintEnabled: { value: 0.0 },
    uTintMix: { value: 0.8 },
    uTintThicknessMinAlpha: { value: 0.35 },
    uTintThicknessMaxAlpha: { value: 1.0 },
    uDark: { value: 0.0 },
    // production default is 6 (high-perf tier); clamps to 2 on mobile/low-power.
    uLoop: { value: 6 },
    uSceneRefractionEnabled: { value: 1.0 },
    uRgbRefraction: { value: 0.0 },
    uLight: { value: new THREE.Vector3(4, 9, 0.5) },
    uScreenResolutionPx: { value: new THREE.Vector2(0, 0) },
    // required by the shader's #include <tonemapping_fragment>; a custom ShaderMaterial
    // does not auto-provide it, so without this it defaults to 0 → color×0 = black.
    toneMappingExposure: { value: 1 },
  };
}

export type DispersionUniforms = ReturnType<typeof makeDispersionUniforms>;
