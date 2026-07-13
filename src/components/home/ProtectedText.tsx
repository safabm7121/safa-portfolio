"use client";

import { usePathname } from "next/navigation";
import {
  buildUnlockHref,
  usePasscodeAccess,
} from "@/components/providers/PasscodeAccessProvider";
import { useRouteTransitionController } from "@/components/providers/FullscreenTransitionProvider";

/**
 * Inline passcode-protected text. While locked, shows N masked boxes (■).
 * Click → navigate to the unlock screen for gate "/2026", returning to the
 * current page on success. The revealed plaintext is supplied once unlocked
 * (kept out of the static bundle by design; decodes to "TikTok").
 */
export function ProtectedText({
  gate = "/2026",
  length = 6,
  revealed = "TikTok",
}: {
  gate?: string;
  length?: number;
  revealed?: string;
}) {
  const { hasAccess } = usePasscodeAccess();
  const { startNavigation } = useRouteTransitionController();
  const pathname = usePathname();
  const open = hasAccess(gate);

  if (open && revealed) {
    return <span className="text-l1 select-text">{revealed}</span>;
  }

  const onClick = () => {
    startNavigation(buildUnlockHref(gate, pathname || "/"));
  };

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Protected — enter passcode to reveal"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="inline-flex items-baseline gap-[0.12em] mx-[0.06em] align-baseline cursor-pointer select-text"
    >
      {Array.from({ length }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block min-w-[0.62em] text-center text-l1 tabular-nums select-text"
        >
          ■
        </span>
      ))}
    </span>
  );
}
