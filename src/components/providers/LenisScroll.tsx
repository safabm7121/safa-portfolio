"use client";

import { useEffect, useRef, useState } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import type Lenis from "lenis";

type ScrollBehavior01 = "smooth" | "auto" | "immediate";

const scrollEnvState: {
  lenis: Lenis | null;
  wrapper: HTMLElement | null;
} = { lenis: null, wrapper: null };

function setLenisInstance(lenis: Lenis | null) { scrollEnvState.lenis = lenis; }
function setContainerEl(el: HTMLElement | null) { scrollEnvState.wrapper = el; }

export const scrollEnv = {
  setLenisInstance, setContainerEl,
  getContainerEl(): HTMLElement | null { return scrollEnvState.wrapper; },
  getScrollTopPx(): number { return scrollEnvState.lenis?.scroll ?? scrollEnvState.wrapper?.scrollTop ?? 0; },
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
  scrollTo(target: string | number | HTMLElement, behavior: ScrollBehavior01 = "smooth") {
    const lenis = scrollEnvState.lenis;
    if (lenis) { lenis.scrollTo(target, { lerp: 0.1, immediate: behavior === "immediate" || behavior === "auto" }); return; }
    if (typeof target === "string" && target.startsWith("#")) document.getElementById(target.slice(1))?.scrollIntoView({ behavior: behavior === "smooth" ? "smooth" : "auto" });
  },
  lenisScrollTo(target: string | number | HTMLElement, opts?: Parameters<Lenis["scrollTo"]>[1]) {
    const lenis = scrollEnvState.lenis;
    if (lenis) { lenis.scrollTo(target, { lerp: 0.1, ...opts }); return; }
    scrollEnv.scrollTo(target as string);
  },
  scrollToTop(behavior: ScrollBehavior01 = "smooth") { scrollEnv.scrollTo(0, behavior); },
  scrollToBottom(behavior: ScrollBehavior01 = "smooth") {
    const lenis = scrollEnvState.lenis;
    if (lenis) { lenis.scrollTo(lenis.limit, { lerp: 0.1, immediate: behavior !== "smooth" }); return; }
    const el = scrollEnvState.wrapper;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: behavior === "smooth" ? "smooth" : "auto" });
  },
};

export function LenisScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis ?? null;
    const wrapper = lenisRef.current?.wrapper ?? null;
    scrollEnv.setLenisInstance(lenis);
    scrollEnv.setContainerEl(wrapper);
    return () => { scrollEnv.setLenisInstance(null); scrollEnv.setContainerEl(null); };
  }, []);

  return (
    <ReactLenis
      ref={lenisRef}
      options={{ 
        lerp: isMobile ? 0 : 0.1,
        smoothWheel: !isMobile,
        syncTouch: false,
        anchors: true,
      }}
      className="w-full h-full overflow-y-auto overscroll-contain no-scrollbar"
    >
      {children}
    </ReactLenis>
  );
}