"use client";

import { useEffect, useState } from "react";
import { useShellMedia } from "@/components/providers/ShellMediaProvider";
import { cx, HOVER_BOX } from "@/lib/cx";

const SPIN = ["|", "/", "-", "\\"];

export function SoundButton() {
  const { soundOn, toggleSound } = useShellMedia();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!soundOn) {
      setFrame(0);
      return;
    }
    const id = setInterval(() => setFrame((f) => (f + 1) % SPIN.length), 130);
    return () => clearInterval(id);
  }, [soundOn]);

  const glyph = soundOn ? SPIN[frame] : "·";

  return (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={soundOn}
      aria-label={soundOn ? "Sound playing, click to pause" : "Sound paused, click to play"}
      onClick={toggleSound}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSound();
        }
      }}
      className={cx(
        "inline-flex shrink-0 items-baseline gap-0",
        HOVER_BOX,
        "p-2 uppercase cursor-pointer pointer-events-auto normal-case",
      )}
    >
      <span>SOUND[{glyph}]</span>
    </span>
  );
}
