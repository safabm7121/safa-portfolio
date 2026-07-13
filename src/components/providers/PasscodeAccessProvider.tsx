"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AccessMap = Record<string, boolean>;

type PasscodeCtx = {
  access: AccessMap;
  hasAccess: (key: string) => boolean;
  /** Re-fetch the server access snapshot (after unlock / logout). */
  refresh: () => Promise<void>;
  /** Build the unlock-screen href for a gate, returning to `returnTo` after. */
  buildUnlockHref: (scope: string, returnTo: string) => string;
};

const Ctx = createContext<PasscodeCtx | null>(null);

// Access is persisted in localStorage so the gate works on the static GitHub
// Pages build (no server / API route). The unlock screen validates the code
// client-side and writes the access map via grantPasscodeAccess().
const CHANGED_EVENT = "passcode-access-changed";
const PASSCODE_STORE = "hq:passcode-access";

async function fetchAccess(): Promise<AccessMap | null> {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(PASSCODE_STORE);
    return raw ? (JSON.parse(raw) as AccessMap) : {};
  } catch {
    return null;
  }
}

/** Grant access to a gate (e.g. "/2026") client-side and notify the provider. */
export function grantPasscodeAccess(gate: string) {
  try {
    const cur = JSON.parse(window.localStorage.getItem(PASSCODE_STORE) || "{}");
    cur[gate] = true;
    window.localStorage.setItem(PASSCODE_STORE, JSON.stringify(cur));
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  } catch {}
}

/**
 * buildUnlockHref("/2026", "/") =>
 *   "/unlock/2026?return=%2F"
 * Root scope ("/" or "") collapses to "_".
 */
export function buildUnlockHref(scope: string, returnTo: string): string {
  const slug = scope.replace(/^\//, "") || "_";
  return `/unlock/${encodeURIComponent(slug)}?return=${encodeURIComponent(returnTo)}`;
}

export function PasscodeAccessProvider({
  initialAccess = {},
  children,
}: {
  initialAccess?: AccessMap;
  children: React.ReactNode;
}) {
  const [access, setAccess] = useState<AccessMap>(initialAccess);

  const refresh = useCallback(async () => {
    const next = await fetchAccess();
    if (next) {
      setAccess((prev) => ({ ...prev, ...next }));
      // Notify other tabs/components that the snapshot changed.
      try {
        window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
      } catch {}
    }
  }, []);

  // Hydrate from the server on mount, and re-sync when another tab unlocks.
  useEffect(() => {
    void refresh();
    const onChanged = () => {
      void fetchAccess().then((next) => {
        if (next) setAccess((prev) => ({ ...prev, ...next }));
      });
    };
    window.addEventListener(CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(CHANGED_EVENT, onChanged);
  }, [refresh]);

  const hasAccess = useCallback((key: string) => !!access[key], [access]);

  const value = useMemo<PasscodeCtx>(
    () => ({ access, hasAccess, refresh, buildUnlockHref }),
    [access, hasAccess, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePasscodeAccess() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("usePasscodeAccess must be used within PasscodeAccessProvider");
  return ctx;
}
