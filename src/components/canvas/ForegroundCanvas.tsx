"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { StickerParticles } from "./StickerParticles";

/**
 * Foreground WebGL layer (z-30) — renders the sticker particle system on top of
 * everything, with NO post-processing composer (the EffectComposer in the
 * background canvas drops continuously-updated instanced draws). Same camera as
 * the background canvas so click-raycast world coords line up. The canvas itself
 * is `pointer-events: none` so scroll/clicks pass through; StickerParticles
 * listens on `window` for taps.
 */
export function ForegroundCanvas() {
  const [fov, setFov] = useState(60);
  useEffect(() => {
    const update = () => setFov(window.innerWidth >= 1024 ? 60 : 38);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="z-30 fixed inset-0 pointer-events-none" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 22], fov }}
        gl={{ alpha: true, antialias: true }}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        {/* live footer is sparse — a few stickers drifting, not a dense rain */}
        <StickerParticles showAtProgress={0.82} ambientCount={8} burstCount={12} />
      </Canvas>
    </div>
  );
}
