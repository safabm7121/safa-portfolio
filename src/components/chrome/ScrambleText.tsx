"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Chrome text-scramble: each glyph cycles through random characters then settles
 * to the target, staggered per-letter. Runs once on mount (intro decode) and
 * again on hover. Mirrors the production chrome scramble (03-chrome.md §1/§2:
 * startDelayMs, letterDelayMs ~40, scrambleColors).
 */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/\\|[]<>*+-=";

// deterministic-ish PRNG so SSR/CSR initial markup stays stable (avoids hydration noise)
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
}

export function ScrambleText({
  text,
  className,
  startDelayMs = 0,
  letterDelayMs = 40,
  cycles = 8,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  startDelayMs?: number;
  letterDelayMs?: number;
  cycles?: number;
  as?: "span" | "div";
}) {
  const [display, setDisplay] = useState(text);
  const raf = useRef(0);
  const mounted = useRef(false);

  const run = (delay: number) => {
    cancelAnimationFrame(raf.current);
    const rand = rng(text.length * 131 + delay + 7);
    let start = -1;
    const frame = (now: number) => {
      if (start < 0) start = now;
      const t = now - start - delay;
      let done = true;
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " ") { out += " "; continue; }
        const settleAt = i * letterDelayMs + cycles * 16;
        if (t >= settleAt) {
          out += ch;
        } else if (t >= i * letterDelayMs) {
          out += GLYPHS[Math.floor(rand() * GLYPHS.length)];
          done = false;
        } else {
          out += ch === ch.toUpperCase() ? GLYPHS[Math.floor(rand() * GLYPHS.length)] : ch;
          done = false;
        }
      }
      setDisplay(out);
      if (!done) raf.current = requestAnimationFrame(frame);
      else setDisplay(text);
    };
    raf.current = requestAnimationFrame(frame);
  };

  useEffect(() => {
    mounted.current = true;
    run(startDelayMs);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <Tag
      className={className}
      onPointerEnter={() => run(80)}
      style={{ display: "inline-block" }}
    >
      {display}
    </Tag>
  );
}
