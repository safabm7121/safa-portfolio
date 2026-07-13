"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/chrome/Header";
import { GridOverlay } from "@/components/chrome/GridOverlay";
import { LoadingBar } from "@/components/chrome/LoadingBar";
import { BackgroundCanvas } from "@/components/canvas/BackgroundCanvas";
import { ForegroundCanvas } from "@/components/canvas/ForegroundCanvas";
import { TransitionOverlay } from "@/components/canvas/TransitionOverlay";
import { LenisScroll } from "@/components/providers/LenisScroll";

/**
 * Persistent shell: canvases + loading + header + the fixed scroll container.
 * Intro: loading bar ramps, then the content fades in (opacity only).
 * WARNING: never put `transform`/`filter`/`perspective` on the reveal wrapper —
 * it creates a containing block and breaks the position:fixed Lenis scroller.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [entryDone, setEntryDone] = useState(false);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(1, p + 0.05 + Math.random() * 0.04);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        setTimeout(() => setLoaded(true), 200);
      }
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <BackgroundCanvas />
      <ForegroundCanvas />

      {/* NOTE: no `transform` here — it would create a containing block and break the
          position:fixed scroll container (Lenis) inside, killing scrolling. Opacity only. */}
      <div
        aria-hidden={!loaded}
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 800ms cubic-bezier(0.22,1,0.36,1)",
          pointerEvents: loaded ? undefined : "none",
        }}
        className={loaded ? "" : "select-none"}
      >
        <GridOverlay />
        <Header />
        <div className="fixed inset-0 w-full h-full">
          <LenisScroll>
            <div>{children}</div>
          </LenisScroll>
        </div>
      </div>

      {/* intro: dot-hole stays closed (covered, cream/dark) during loading, then opens to
          reveal the hero — reusing the route-transition MaskedDotsEffect (matches the live). */}
      {!entryDone && (
        <TransitionOverlay
          initialCovered
          open={!loaded}
          duration={1.1}
          zClass="z-45"
          onComplete={(o) => {
            if (!o) setEntryDone(true);
          }}
        />
      )}

      <LoadingBar progress={progress} done={loaded} />
    </>
  );
}
