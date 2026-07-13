/** Tiny className joiner. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** The dotted-border hover box used on every interactive chrome element. */
export const HOVER_BOX =
  "relative before:content-[''] before:absolute before:inset-0 before:border-2 " +
  "before:border-dotted before:border-transparent before:pointer-events-none " +
  "before:transition-colors before:duration-200 lg:hover:before:border-l1";

/** zero-pad a number to 4 digits, like the cursor coords readout. */
export function pad4(n: number): string {
  return Math.max(0, Math.round(n)).toString().padStart(4, "0");
}
