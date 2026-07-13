"use client";

import { useEffect, useState } from "react";
import { usePointerStore } from "@/stores/pointer";
import { scrollEnv } from "@/components/providers/LenisScroll";
import { cx, HOVER_BOX, pad4 } from "@/lib/cx";

export function Coords() {
  const [xy, setXY] = useState({ x: 1, y: 1 });

  useEffect(() => {
    // subscribe to pointer store without re-rendering on every frame elsewhere
    const unsub = usePointerStore.subscribe((s) => setXY({ x: s.x, y: s.y }));
    return unsub;
  }, []);

  return (
    <span
      onClick={() => scrollEnv.scrollToTop("smooth")}
      title="Back to top"
      className={cx(
        HOVER_BOX,
        "hidden lg:inline lg:bottom-7 lg:left-1/2 lg:fixed p-2 lg:-translate-x-1/2 cursor-pointer pointer-events-auto",
      )}
    >
      <span>
        {pad4(xy.x)} X {pad4(xy.y)} Y
      </span>
    </span>
  );
}
