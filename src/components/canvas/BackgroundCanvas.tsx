"use client";

import dynamic from "next/dynamic";

// The main R3F scene (glass "hello" + refraction + background) renders on the -z-1 layer,
// behind the page content. Client-only (no SSR for WebGL).
const MainCanvas = dynamic(() => import("./MainCanvas"), { ssr: false });

export function BackgroundCanvas() {
  return (
    <div
      className="top-0 left-0 -z-1 fixed w-full h-dvh lg:h-screen pointer-events-none"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
        <MainCanvas />
      </div>
    </div>
  );
}
