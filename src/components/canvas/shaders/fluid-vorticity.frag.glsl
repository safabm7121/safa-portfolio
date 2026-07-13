uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexelSize;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec2 uPointerDelta;
uniform float uCurlStrength;
uniform float uSplatRadius;
uniform float uSplatForce;
varying vec2 vUv;

void main() {
  float left = abs(texture2D(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x);
  float right = abs(texture2D(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x);
  float top = abs(texture2D(uCurl, vUv + vec2(0.0, uTexelSize.y)).x);
  float bottom = abs(texture2D(uCurl, vUv - vec2(0.0, uTexelSize.y)).x);
  float center = texture2D(uCurl, vUv).x;

  vec2 force = vec2(top - bottom, right - left);
  float forceLength = length(force);
  if (forceLength > 0.0001) {
    force /= forceLength;
  } else {
    force = vec2(0.0);
  }

  force *= uCurlStrength * center;
  force.y *= -1.0;

  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * 0.016;
  velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));

  vec2 mouseUv = uPointer / max(uResolution, vec2(0.0001));
  vec2 diff = vUv - mouseUv;
  diff.x *= uResolution.x / max(uResolution.y, 0.0001);
  float pointerMask = exp(-dot(diff, diff) / max(uSplatRadius, 0.0001));
  velocity += (uPointerDelta / max(uResolution, vec2(0.0001))) * pointerMask * uSplatForce;

  gl_FragColor = vec4(velocity, 0.0, 1.0);
}