"use client";

import { ThemeModeProvider } from "./ThemeModeProvider";
import { ShellMediaProvider } from "./ShellMediaProvider";
import { PointerProvider } from "./PointerProvider";
import { PasscodeAccessProvider } from "./PasscodeAccessProvider";
import { FullscreenTransitionProvider } from "./FullscreenTransitionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeModeProvider>
      <ShellMediaProvider>
        <PointerProvider>
          <PasscodeAccessProvider initialAccess={{ "/2026": false }}>
            <FullscreenTransitionProvider>{children}</FullscreenTransitionProvider>
          </PasscodeAccessProvider>
        </PointerProvider>
      </ShellMediaProvider>
    </ThemeModeProvider>
  );
}
