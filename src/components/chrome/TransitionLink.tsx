"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouteTransitionController } from "@/components/providers/FullscreenTransitionProvider";
import { scrollEnv } from "@/components/providers/LenisScroll";

/**
 * Custom transition Link (CHROME chunk `o`@399668). Intercepts plain left-clicks
 * (no modifier keys): if the target is the current page → smooth-scroll to top;
 * otherwise run the dot-hole route transition. Modified / middle / external clicks
 * fall through to the native <Link>.
 */
export function TransitionLink({
  href,
  children,
  className,
  style,
  onClick,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
} & Omit<React.ComponentProps<typeof Link>, "href" | "onClick">) {
  const { startNavigation } = useRouteTransitionController();
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
        if (!href) return;
        e.preventDefault();
        if (href === pathname) {
          scrollEnv.lenisScrollTo(0, { lerp: 0.1 });
          return;
        }
        startNavigation(href);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
