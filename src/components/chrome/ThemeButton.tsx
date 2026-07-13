"use client";

import { useThemeMode } from "@/components/providers/ThemeModeProvider";
import { cx, HOVER_BOX } from "@/lib/cx";

const LABEL = { A: "system", L: "light", D: "dark" } as const;

export function ThemeButton() {
  const { letter, cycle } = useThemeMode();
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={`Theme: ${LABEL[letter]}`}
      onClick={cycle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cycle();
        }
      }}
      className={cx(HOVER_BOX, "p-2 uppercase cursor-pointer pointer-events-auto")}
    >
      <span>THEME[{letter}]</span>
    </span>
  );
}
