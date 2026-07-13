"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";

/**
 * Wireframe globe whose "rotation" is faked with SVG SMIL: N meridian ellipses
 * each scaleX 1→-1, phase-offset, over 2600ms. Matches production RotatingGlobe.
 */
const MERIDIANS = 6;
const DUR = 2600;

export function RotatingGlobe({ className }: { className?: string }) {
  const [size, setSize] = useState(56);
  useEffect(() => {
    const update = () => setSize(window.innerWidth < 1024 ? 16 : 56);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <span className={cx("text-l1", className)} aria-hidden="true">
      <svg width={size} height={size / 2} viewBox="0 0 48 24" fill="none">
        {/* outline + equator (static guides) */}
        <ellipse cx="24" cy="12" rx="22" ry="11" stroke="currentColor" strokeWidth="1" />
        <path d="M2 12H46" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
        {/* meridians: sweeping longitude lines */}
        <g transform="translate(24 12)">
          {Array.from({ length: MERIDIANS }).map((_, i) => (
            <ellipse key={i} cx="0" cy="0" rx="22" ry="11" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1">
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1 1;-1 1"
                keyTimes="0;1"
                keySplines="0.42 0 0.58 1"
                calcMode="spline"
                dur={`${DUR}ms`}
                begin={`-${(DUR * i) / MERIDIANS}ms`}
                repeatCount="indefinite"
              />
            </ellipse>
          ))}
        </g>
      </svg>
    </span>
  );
}
