"use client";

import { useEffect } from "react";
import { usePointerStore } from "@/stores/pointer";

/** Installs a single global pointer listener, throttled to one update per frame. */
export function PointerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const set = usePointerStore.getState().set;
    let raf = 0;
    let px = 0;
    let py = 0;
    let dirty = false;

    const flush = () => {
      raf = 0;
      if (dirty) {
        set(px, py);
        dirty = false;
      }
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      dirty = true;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <>{children}</>;
}
