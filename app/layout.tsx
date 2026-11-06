import type { Metadata } from "next";
import localFont from "next/font/local";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SkipLink from "@/components/SkipLink";
import { SITE } from "@/lib/data";
import "./globals.css";

/* Self-hosted. Outbound font fetches are blocked in this environment, and a
   webfont that fails to load would take the whole rack-label voice with it. */
const display = localFont({
  src: "./fonts/SpaceGrotesk.woff2",
  weight: "300 700",
  variable: "--font-display",
  display: "swap",
});

const mono = localFont({
  src: "./fonts/JetBrainsMonoVariable.woff2",
  weight: "100 800",
  variable: "--font-mono",
  display: "swap",
});

/* The dot-matrix face, used only where a real machine would have an LED
   panel. Pixel fonts look wrong anywhere else. */
const led = localFont({
  src: "./fonts/Silkscreen-Bold.woff2",
  weight: "700",
  variable: "--font-led",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "MinerPad — a coin that mines for itself",
    template: "%s — MinerPad",
  },
  description:
    "Launch a coin. Its trading fees rent CPU and GPU time by the hour, that silicon mines, and what it mines goes back into the pool. Trade, rent, hash, settle, repeat.",
  openGraph: {
    title: "MinerPad — a coin that mines for itself",
    description: "Trading fees rent the compute. The compute mines. The proceeds go back in the pool.",
    type: "website",
    url: SITE.url,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MinerPad" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MinerPad — a coin that mines for itself",
    description: "Trading fees rent the compute. The compute mines. The proceeds go back in the pool.",
    images: ["/og.png"],
  },
};

export const viewport = { themeColor: "#05060A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${led.variable}`}>
      <head>
        {/* Marks the document as scripted before first paint, so reveal
            styles can hide content without flashing it — and so nothing is
            hidden at all when scripting is off. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-svh bg-void font-mono text-bone antialiased">
        <SkipLink />
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
