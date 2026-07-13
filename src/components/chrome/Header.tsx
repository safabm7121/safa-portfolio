"use client";

import { TransitionLink } from "./TransitionLink";
import { cx, HOVER_BOX } from "@/lib/cx";
import { scrollEnv } from "@/components/providers/LenisScroll";
import { ThemeButton } from "./ThemeButton";
import { SoundButton } from "./SoundButton";
import { Clock } from "./Clock";
import { Coords } from "./Coords";
import { RotatingGlobe } from "./RotatingGlobe";
import { ScrambleText } from "./ScrambleText";

const WDTH_HEAVY = { fontVariationSettings: '"wght" 700, "wdth" 120' } as const;

// Section anchors (03-chrome.md §6: SELECTED_WORK_SECTION_ID / CONTACT_SECTION_ID).
const SELECTED_WORK_SECTION_ID = "selected-work";
const CONTACT_SECTION_ID = "contact";

function scrollToSection(id: string) {
  scrollEnv.lenisScrollTo(`#${id}`, { lerp: 0.1 });
}

export function Header() {
  return (
    <header className="z-50 fixed inset-0 flex flex-col justify-between font-mono-2 pointer-events-none transition-colors duration-300 ease-out motion-reduce:transition-none text-l1">
      {/* top row */}
      <div className="flex justify-between items-center px-4 lg:px-14 py-4 lg:py-7 text-base">
        <TransitionLink
          href="/"
          style={WDTH_HEAVY}
          className={cx(
            HOVER_BOX,
            "p-2 font-sans font-bold uppercase pointer-events-auto transition-colors duration-300 ease-out motion-reduce:transition-none",
          )}
        >
          <span>SAFA</span>
          <span>.BEN.MILED</span>
        </TransitionLink>

        <div className="hidden lg:flex flex-wrap justify-between items-center gap-x-3 gap-y-2 pointer-events-auto basis-1/2 xl:basis-1/3">
          <button
            type="button"
            onClick={() => scrollToSection(SELECTED_WORK_SECTION_ID)}
            className={cx(HOVER_BOX, "p-2 uppercase cursor-pointer")}
          >
            <ScrambleText text="Work" startDelayMs={300} />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(CONTACT_SECTION_ID)}
            className={cx(HOVER_BOX, "p-2 uppercase cursor-pointer")}
          >
            <ScrambleText text="Contact" startDelayMs={360} />
          </button>
          <ThemeButton />
          <SoundButton />
        </div>
      </div>

      {/* bottom row */}
      <div className="flex justify-between items-end px-4 lg:px-14 py-4 lg:py-7">
        <Clock />
        <Coords />
        <RotatingGlobe className="hidden lg:block p-2 shrink-0 pointer-events-auto" />
      </div>
    </header>
  );
}
