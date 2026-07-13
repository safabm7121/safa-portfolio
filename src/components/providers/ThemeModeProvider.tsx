"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeCtx = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  /** single letter shown in header: A=auto/system, L=light, D=dark */
  letter: "A" | "L" | "D";
  setMode: (m: ThemeMode) => void;
  cycle: () => void;
};

const STORAGE_KEY = "theme";
// Production cycle order (CHROME chunk, verified literal): light → dark → system.
const CYCLE: ThemeMode[] = ["light", "dark", "system"];
const LETTER: Record<ThemeMode, "A" | "L" | "D"> = {
  system: "A",
  light: "L",
  dark: "D",
};

const Ctx = createContext<ThemeCtx | null>(null);

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function apply(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);

  // hydrate from storage + watch system preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored && CYCLE.includes(stored)) setModeState(stored);
    } catch {}
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: ResolvedTheme = useMemo(
    () => (mode === "system" ? (systemDark ? "dark" : "light") : mode),
    [mode, systemDark],
  );

  useEffect(() => {
    apply(resolved);
  }, [resolved]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {}
  }, []);

  const cycle = useCallback(() => {
    setModeState((prev) => {
      const next = CYCLE[(CYCLE.indexOf(prev) + 1) % CYCLE.length];
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ mode, resolved, letter: LETTER[mode], setMode, cycle }),
    [mode, resolved, setMode, cycle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
}
