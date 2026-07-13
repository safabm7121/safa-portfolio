"use client";

/**
 * Centered intro progress bar. `progress` 0..1, `done` fades it out.
 * Real progress wiring (font + 3D asset load) lands with the intro module;
 * for now Shell drives it on mount.
 */
export function LoadingBar({ progress, done }: { progress: number; done: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="left-1/2 top-1/2 z-50 fixed flex h-4 w-[200px] -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-none"
      style={{
        opacity: done ? 0 : 1,
        transition: "opacity 250ms cubic-bezier(0.25, 1, 0.5, 1)",
      }}
    >
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-l3">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-l1"
          style={{
            width: `${Math.round(progress * 100)}%`,
            transition: "width 520ms cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "width",
          }}
        />
      </div>
    </div>
  );
}
