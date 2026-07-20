import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Shell } from "@/components/Shell";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "SAFA BEN MILED — Fashion Designer",
  description: "Fashion Designer & Brand owner — Voidstone Studio",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Pre-hydration theme resolver to avoid FOUC. Mirrors production light/dark/system.
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var m=window.matchMedia('(prefers-color-scheme:dark)').matches;var dark=t==='dark'||(t==='system'&&m);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
