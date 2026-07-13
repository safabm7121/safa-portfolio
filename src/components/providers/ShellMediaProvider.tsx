"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { withBase } from "@/lib/asset";

type ShellMediaCtx = {
  soundOn: boolean;
  toggleSound: () => void;
};

const Ctx = createContext<ShellMediaCtx | null>(null);
const STORAGE_KEY = "sound";
const BGM_VOLUME = 0.35;

export function ShellMediaProvider({ children }: { children: React.ReactNode }) {
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // create audio element once
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "off") setSoundOn(false);
    } catch {}

    const audio = new Audio(withBase("/bgm.mp3"));
    audio.loop = true;
    audio.volume = BGM_VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // reflect soundOn → play/pause; unlock autoplay on first gesture
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (soundOn) {
      audio.play().catch(() => {
        const unlock = () => {
          audio.play().catch(() => {});
          window.removeEventListener("pointerdown", unlock);
          window.removeEventListener("keydown", unlock);
        };
        window.addEventListener("pointerdown", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
      });
    } else {
      audio.pause();
    }
  }, [soundOn]);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo(() => ({ soundOn, toggleSound }), [soundOn, toggleSound]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShellMedia() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShellMedia must be used within ShellMediaProvider");
  return ctx;
}
