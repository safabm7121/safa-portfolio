
          precision highp float;

          varying vec2 vUv;

          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uPixelSize;
          uniform float uRadiusScale;
          uniform vec2 uResolution;

          void main() {
            float a = clamp(uOpacity, 0.0, 1.0);

            vec2 normalizedPixelSize = vec2(
              uPixelSize / max(uResolution.x, 1.0),
              uPixelSize / max(uResolution.y, 1.0)
            );

            vec2 safePixelSize = max(normalizedPixelSize, vec2(1e-6));
            vec2 cellUV = fract(vUv / safePixelSize);

            // 与 route_transition 点阵一致：透明度直接映射圆半径。
            float radius = uRadiusScale * a;
            float distanceFromCenter = distance(cellUV, vec2(0.5));
            float aa = fwidth(distanceFromCenter) * 1.5;
            float circleMask = smoothstep(radius, radius - aa, distanceFromCenter);

            gl_FragColor = vec4(uColor, circleMask);
            #include <colorspace_fragment>
          }
        