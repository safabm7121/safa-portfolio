"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const TransitionOverlay = dynamic(
  () => import("@/components/canvas/TransitionOverlay").then((m) => m.TransitionOverlay),
  { ssr: false },
);

type Phase = "idle" | "cover" | "wait" | "reveal";

type TransitionCtx = {
  /** Run the dot-hole cover wipe, then navigate, then reveal on the new page. */
  startNavigation: (href: string) => void;
  /** Back-compat alias. */
  navigate: (href: string) => void;
};

const Ctx = createContext<TransitionCtx | null>(null);

/**
 * Route-transition controller (ORCH chunk). Drives the MaskedDotsEffect wipe:
 * idle → cover (dots close over the screen) → push route → wait → reveal (dots open
 * on the new page). The overlay persists across navigation so the reveal plays on
 * the destination.
 */
export function FullscreenTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const targetHref = useRef<string | null>(null);
  const coverPath = useRef<string | null>(null);

  const startNavigation = useCallback(
    (href: string) => {
      if (phase !== "idle") return;
      targetHref.current = href;
      coverPath.current = pathname;
      setPhase("cover");
    },
    [phase, pathname],
  );

  // when the route actually changes during 'wait', play the reveal
  useEffect(() => {
    if (phase === "wait" && pathname !== coverPath.current) setPhase("reveal");
  }, [pathname, phase]);

  const onComplete = useCallback(
    (open: boolean) => {
      if (open) {
        // cover finished → navigate, then hold covered until the route changes
        if (targetHref.current) router.push(targetHref.current);
        setPhase("wait");
        // fallback: if the route doesn't change (same page / hash), reveal anyway
        window.setTimeout(() => setPhase((p) => (p === "wait" ? "reveal" : p)), 700);
      } else {
        // reveal finished → done
        setPhase("idle");
        targetHref.current = null;
        coverPath.current = null;
      }
    },
    [router],
  );

  const value = useMemo<TransitionCtx>(() => ({ startNavigation, navigate: startNavigation }), [startNavigation]);

  const covered = phase === "cover" || phase === "wait";

  return (
    <Ctx.Provider value={value}>
      {children}
      {phase !== "idle" && <TransitionOverlay open={covered} duration={0.7} onComplete={onComplete} />}
    </Ctx.Provider>
  );
}

export function useFullscreenTransition() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFullscreenTransition must be used within FullscreenTransitionProvider");
  return ctx;
}

/** Production hook name. */
export function useRouteTransitionController() {
  return useFullscreenTransition();
}
