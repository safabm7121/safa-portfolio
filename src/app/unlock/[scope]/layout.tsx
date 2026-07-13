// Pre-render the known passcode gate(s) so the dynamic /unlock/[scope] route can
// be statically exported for GitHub Pages.
export function generateStaticParams() {
  return [{ scope: "2026" }, { scope: "_" }];
}

export default function UnlockLayout({ children }: { children: React.ReactNode }) {
  return children;
}
