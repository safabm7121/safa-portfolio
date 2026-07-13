"use client";

import { useEffect, useRef } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import type Lenis from "lenis";

/**
 * Smooth-scroll container (Lenis) used as the single scrollable viewport.
 *
 * Production (03-chrome.md §6) wraps the whole app in
 *   <ReactLenis options={{ lerp:0.1, smoothWheel:true, syncTouch:true, anchors:true }}
 *     className="w-full h-full overflow-y-auto overscroll-contain no-scrollbar">
 * and exposes a `scrollEnv` singleton so chrome controls (header Work/Contact
 * buttons, the cursor-coords back-to-top) can drive the same instance.
 */

type ScrollBehavior01 = "smooth" | "auto" | "immediate";

/** Module-level singleton mirroring production's `scrollEnv`. */
const scrollEnvState: {
  lenis: Lenis | null;
  wrapper: HTMLElement | null;
} = {
  lenis: null,
  wrapper: null,
};

function setLenisInstance(lenis: Lenis | null) {
  scrollEnvState.lenis = lenis;
}

function setContainerEl(el: HTMLElement | null) {
  scrollEnvState.wrapper = el;
}

export const scrollEnv = {
  setLenisInstance,
  setContainerEl,

  getContainerEl(): HTMLElement | null {
    return scrollEnvState.wrapper;
  },

  getScrollTopPx(): number {
    return scrollEnvState.lenis?.scroll ?? scrollEnvState.wrapper?.scrollTop ?? 0;
  },

  getViewportHeightPx(): number {
    if (scrollEnvState.wrapper) return scrollEnvState.wrapper.clientHeight;
    if (typeof window !== "undefined") return window.innerHeight;
    return 1;
  },

  getMaxScrollPx(): number {
    const w = scrollEnvState.wrapper;
    if (w) return Math.max(1, w.scrollHeight - w.clientHeight);
    return 1;
  },

  /** Smooth-scroll to an element, a `#hash`, or a pixel offset. */
  scrollTo(
    target: string | number | HTMLElement,
    behavior: ScrollBehavior01 = "smooth",
  ) {
    const lenis = scrollEnvState.lenis;
    if (lenis) {
      lenis.scrollTo(target, {
        lerp: 0.1,
        immediate: behavior === "immediate" || behavior === "auto",
      });
      return;
    }
    // Fallback before Lenis mounts.
    if (typeof target === "string" && target.startsWith("#")) {
      document
        .getElementById(target.slice(1))
        ?.scrollIntoView({ behavior: behavior === "smooth" ? "smooth" : "auto" });
    }
  },

  /** Lenis-native scrollTo, allowing arbitrary options (production: lenisScrollTo). */
  lenisScrollTo(
    target: string | number | HTMLElement,
    opts?: Parameters<Lenis["scrollTo"]>[1],
  ) {
    const lenis = scrollEnvState.lenis;
    if (lenis) {
      lenis.scrollTo(target, { lerp: 0.1, ...opts });
      return;
    }
    scrollEnv.scrollTo(target as string);
  },

  scrollToTop(behavior: ScrollBehavior01 = "smooth") {
    scrollEnv.scrollTo(0, behavior);
  },

  scrollToBottom(behavior: ScrollBehavior01 = "smooth") {
    const lenis = scrollEnvState.lenis;
    if (lenis) {
      lenis.scrollTo(lenis.limit, {
        lerp: 0.1,
        immediate: behavior !== "smooth",
      });
      return;
    }
    const el = scrollEnvState.wrapper;
    if (el)
      el.scrollTo({
        top: el.scrollHeight,
        behavior: behavior === "smooth" ? "smooth" : "auto",
      });
  },
};

export function LenisScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis ?? null;
    const wrapper = lenisRef.current?.wrapper ?? null;
    scrollEnv.setLenisInstance(lenis);
    scrollEnv.setContainerEl(wrapper);
    return () => {
      scrollEnv.setLenisInstance(null);
      scrollEnv.setContainerEl(null);
    };
  }, []);

  return (
    <ReactLenis
      ref={lenisRef}
      options={{ lerp: 0.1, smoothWheel: true, syncTouch: true, anchors: true }}
      className="w-full h-full overflow-y-auto overscroll-contain no-scrollbar"
    >
      {children}
    </ReactLenis>
  );
}
