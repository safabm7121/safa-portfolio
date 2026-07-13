uniform sampler2D uVelocity;
uniform sampler2D uProjectedVelocity;
uniform vec2 uTexelSize;
uniform float uDissipation;
varying vec2 vUv;

void main() {
  vec2 velocity = texture2D(uProjectedVelocity, vUv).xy;
  vec2 coord = clamp(vUv - velocity * uTexelSize * 0.016, 0.0, 1.0);
  vec2 advected = texture2D(uProjectedVelocity, coord).xy;
  advected /= 1.0 + uDissipation * 0.016;
  gl_FragColor = vec4(advected, 0.0, 1.0);
}