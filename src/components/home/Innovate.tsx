"use client";

import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLenis } from "lenis/react";
import {
  HyperSpaceStaggerText,
  useHasEnteredViewport,
} from "@/components/anim/HyperSpaceStaggerText";

const WDTH_120 = { fontVariationSettings: '"wdth" 120' } as const;

// UPDATED: Your brand messaging
const SEG0_PRIMARY_LINES = ["Create", "with", "intention"];
const SEG0_SECONDARY_LINES = ["Design", "with a", "vision"];
const END_LINES = ["VOIDSTONE", "STUDIO"];

type Stage = "seg0-primary" | "seg0-secondary" | "seg1" | "end";

const STAGE_RANGES: { range: [number, number]; stage: Stage }[] = [
  { range: [0, 1], stage: "seg0-primary" },
  { range: [2, 3], stage: "seg0-secondary" },
  { range: [4, 5], stage: "seg1" },
  { range: [6, 7], stage: "end" },
];

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function stageForSegment(segment: number): Stage | null {
  for (const { range, stage } of STAGE_RANGES) {
    const [a, b] = range;
    if (segment >= a && segment <= b) return stage;
  }
  return null;
}

function useLenisScrollTop(): number {
  const [top, setTop] = useState(0);
  useLenis((lenis) => {
    setTop(lenis.scroll);
  }, []);
  return top;
}

function useViewportHeight(): number {
  const [h, setH] = useState(0);
  useEffect(() => {
    const read = () => setH(window.innerHeight);
    read();
    window.addEventListener("resize", read, { passive: true });
    window.addEventListener("orientationchange", read, { passive: true });
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);
  return h;
}

export function Innovate() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const vh = useViewportHeight();
  const scrollTop = useLenisScrollTop();

  const [sectionTop, setSectionTop] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const el = sectionRef.current;
      if (el) setSectionTop(el.offsetTop);
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, [vh]);

  const unit = Math.max(1, vh);
  const into = scrollTop - sectionTop;
  const segmentIndex = clamp(Math.floor(Math.max(0, into) / unit), 0, 7);
  const stage = stageForSegment(segmentIndex);

  const segment0Reveal = into >= -0.2 * unit;
  const isSeg0 = stage === "seg0-primary" || stage === "seg0-secondary";
  const segment0StaggerGen = isSeg0 ? stage : "none";

  const stageScrollProgress01 = useMemo(() => {
    if (!stage) return 0;
    const def = STAGE_RANGES.find((s) => s.stage === stage);
    if (!def) return 0;
    const [a, b] = def.range;
    const start = a * unit;
    const span = Math.max(1, (b + 1) * unit - start);
    return clamp((into - start) / span, 0, 1);
  }, [stage, into, unit]);

  return (
    <div
      ref={sectionRef}
      className="relative transition-colors duration-300 ease-out motion-reduce:transition-none text-white"
      style={{ height: `${8 * unit}px` }}
    >
      <div
        className="top-0 sticky grid grid-cols-12 grid-rows-6 px-4 lg:px-14 py-18 lg:py-24 w-full"
        style={{ minHeight: `${unit}px` }}
      >
        <StageView
          stage={stage}
          reveal={segment0Reveal}
          staggerGen={segment0StaggerGen}
          ringProgress01={stageScrollProgress01}
        />
      </div>
    </div>
  );
}

function StageView({
  stage,
  reveal,
  staggerGen,
  ringProgress01,
}: {
  stage: Stage | null;
  reveal: boolean;
  staggerGen: string;
  ringProgress01: number;
}) {
  switch (stage) {
    case "seg0-primary":
    case "seg0-secondary":
      return (
        <Segment0
          stage={stage}
          reveal={reveal}
          staggerGen={staggerGen}
        />
      );
    case "seg1":
      return <Segment1 ringProgress01={ringProgress01} />;
    case "end":
      return <SegmentEnd />;
    default:
      return null;
  }
}

function Segment0({
  stage,
  reveal,
  staggerGen,
}: {
  stage: "seg0-primary" | "seg0-secondary";
  reveal: boolean;
  staggerGen: string;
}) {
  const isPrimary = stage === "seg0-primary";
  const lines = isPrimary ? SEG0_PRIMARY_LINES : SEG0_SECONDARY_LINES;
  const tag = isPrimary ? "primary" : "secondary";
  return (
    <div
      className="flex flex-col justify-center items-center col-span-12 row-span-6 font-bold text-[7.2svw] lg:text-[6.8svw] uppercase leading-none"
      style={WDTH_120}
    >
      {lines.map((line, i) => (
        <HyperSpaceStaggerText
          key={
            i === 0
              ? `${staggerGen}-${tag}-stable-${i}`
              : `${staggerGen}-${tag}-${i}`
          }
          text={line}
          play={reveal}
          groupDelayMs={100 * i}
        />
      ))}
    </div>
  );
}

// UPDATED: Your personal messaging with ring
function Segment1({ ringProgress01 }: { ringProgress01: number }) {
  return (
    <>
      <ProgressRing progress01={ringProgress01} />
      <div className="col-span-8 lg:col-span-4 col-start-1 lg:col-start-7 row-start-2 p-2 font-medium text-[5.6svw] lg:text-3xl leading-tight">
        <HyperSpaceStaggerText text="Fashion meets" />
        <br />
        <HyperSpaceStaggerText text="art." />
      </div>
      <div className="col-span-8 lg:col-span-4 col-start-5 lg:col-start-9 row-start-3 p-2 font-medium text-[5.6svw] lg:text-3xl leading-tight">
        <HyperSpaceStaggerText text="Avant-garde" />
        <br />
        <HyperSpaceStaggerText text="by design." />
      </div>
      <div className="col-span-8 lg:col-span-4 col-start-1 lg:col-start-2 row-start-4 p-2 font-medium text-[5.6svw] lg:text-3xl leading-tight">
        <HyperSpaceStaggerText text="Concept to" />
        <br />
        <HyperSpaceStaggerText text="creation." />
      </div>
      <div className="col-span-8 lg:col-span-4 col-start-5 lg:col-start-4 row-start-5 p-2 font-medium text-[5.6svw] lg:text-3xl leading-tight">
        <HyperSpaceStaggerText text="Full stack" />
        <br />
        <HyperSpaceStaggerText text="creative." />
      </div>
    </>
  );
}

function SegmentEnd() {
  const { ref, hasEnteredViewport } = useHasEnteredViewport<HTMLDivElement>({
    threshold: 0.35,
    once: false,
  });
  return (
    <div
      ref={ref}
      className="flex flex-col justify-center items-center col-span-12 row-span-6 font-bold text-[7.2svw] lg:text-[6.8svw] uppercase leading-none"
      style={WDTH_120}
    >
      {END_LINES.map((line, i) => (
        <HyperSpaceStaggerText
          key={i}
          text={line}
          play={hasEnteredViewport}
          groupDelayMs={100 * i}
        />
      ))}
    </div>
  );
}

// --- Progress Ring (same as before) ---
const RING_VIEWBOX = 344;
const RING_TIMING = {
  enterSpan: 300,
  exitSpan: 345,
  cycleDist: 300,
  totalDist: 600 + 345,
};

const RADIUS_LUT = (() => {
  const arr = new Float32Array(301);
  for (let t = 0; t <= 300; t++) {
    const d = t - 150;
    const r = 22500 - d * d;
    arr[t] = r > 0 ? Math.sqrt(r) : 0;
  }
  return arr;
})();

function sampleRadius(x: number): number {
  if (x <= 0 || x >= 300) return 0;
  const i = x | 0;
  const frac = x - i;
  if (frac <= 0) return RADIUS_LUT[i];
  return RADIUS_LUT[i] + (RADIUS_LUT[i + 1] - RADIUS_LUT[i]) * frac;
}

const RING_INDICES = [0, 1, 2, 3, 4, 5, 6];
const SEEN = new Float32Array(7);

function dedupe(value: number, count: number): number {
  for (let r = 0; r < count; r++) {
    if (Math.abs(SEEN[r] - value) < 0.5) return count;
  }
  SEEN[count] = value;
  return count + 1;
}

function layoutRing(
  ellipses: (SVGEllipseElement | null)[],
  progress01: number,
) {
  const p = clamp(progress01, 0, 1);
  const total = p * RING_TIMING.totalDist;

  let phase = 0;
  let pos = total;
  if (total > RING_TIMING.enterSpan) {
    if (total <= RING_TIMING.enterSpan + RING_TIMING.cycleDist) {
      phase = 1;
      pos = total - RING_TIMING.enterSpan;
    } else {
      phase = 2;
      pos = total - RING_TIMING.enterSpan - RING_TIMING.cycleDist;
    }
  }

  const enterStep = phase === 0 ? (pos / 50) | 0 : 0;
  let count = 0;

  for (let t = 0; t < 7; t++) {
    const el = ellipses[t];
    if (!el) continue;

    let local = 0;
    let active = false;
    if (phase === 0) {
      if (pos >= 50 * t) {
        const cap = enterStep < 6 ? enterStep : 6;
        local = pos - (cap - t) * 50;
        active = local > 0 && local < 300;
      }
    } else if (phase === 1) {
      local = (((pos + 50 * t) % 300) + 300) % 300;
      active = local > 0 && local < 300;
    } else {
      local = pos + 50 * t;
      active = local > 0 && local < 300;
    }

    if (!active) {
      el.style.visibility = "hidden";
      continue;
    }

    const rx = sampleRadius(local);
    if (rx <= 0) {
      el.style.visibility = "hidden";
      continue;
    }

    const next = dedupe(local, count);
    if (next === count) {
      el.style.visibility = "hidden";
      continue;
    }
    count = next;

    const cx = 172;
    const cy = 22 + local;
    el.style.visibility = "visible";
    el.cx.baseVal.value = cx;
    el.cy.baseVal.value = cy;
    el.rx.baseVal.value = rx;
    el.ry.baseVal.value = 0.1 * rx;
  }
}

const ProgressRing = memo(function ProgressRing({
  progress01,
  size = 344,
  className = "",
}: {
  progress01: number;
  size?: number;
  className?: string;
}) {
  const clipId = useId().replace(/:/g, "");
  const ellipsesRef = useRef<(SVGEllipseElement | null)[]>([]);

  useLayoutEffect(() => {
    layoutRing(ellipsesRef.current, progress01);
  }, [progress01]);

  const polyPoints = `20,22 324,22 324,322 20,322`;

  return (
    <div
      className={`pointer-events-none absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${RING_VIEWBOX} ${RING_VIEWBOX}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <clipPath id={clipId}>
            <polygon points={polyPoints} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {RING_INDICES.map((i) => (
            <ellipse
              key={i}
              ref={(el) => {
                ellipsesRef.current[i] = el;
              }}
              visibility="hidden"
              stroke="#C0FE04"
              strokeOpacity={1}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
    </div>
  );
});

ProgressRing.displayName = "ProgressRing";