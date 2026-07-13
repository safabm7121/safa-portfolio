varying vec3 worldNormal;
varying vec3 eyeVector;
varying float modelLocalY;
varying vec2 vScreenUV;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;

  gl_Position = projectionMatrix * mvPosition;

  // screen-space UV from clip space (robust alternative to gl_FragCoord/uScreenResolutionPx)
  vScreenUV = (gl_Position.xy / gl_Position.w) * 0.5 + 0.5;

  // vec3 transformedNormal = modelMatrix * normal;
  worldNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
  eyeVector = normalize(worldPos.xyz - cameraPosition);
  modelLocalY = position.y;
}