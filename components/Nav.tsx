"use client";

import { useEffect, useState } from "react";
import Mark from "./Mark";
import { Stencil } from "./ui";
import { FLEET } from "@/lib/data";
import { heatCss } from "@/lib/ramp";
import { heatOf } from "@/lib/mining";

const LINKS = [
  { href: "/farm", label: "Farm" },
  { href: "/deploy", label: "Deploy" },
  { href: "/loop", label: "The Loop" },
];

/** The top rail. Carries the one number the site is about, always. */
export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const gain = FLEET.gain;
  const c = heatCss(heatOf(gain));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        solid ? "border-b border-seam bg-void/92 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 md:px-6">
        <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="MinerPad home">
          <Mark size={26} />
          <span className="font-display text-[15px] font-semibold tracking-tight text-bone">MinerPad</span>
        </a>

        <span aria-hidden className="vent hidden h-3 flex-1 opacity-40 md:block" />

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 font-mono text-[11px] uppercase tracking-tag text-label transition-colors hover:text-bone"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 border border-seam px-2.5 py-1.5 md:ml-0">
          <span className="h-[6px] w-[6px] shrink-0 animate-breathe rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
          <Stencil className="hidden sm:inline">loop gain</Stencil>
          <span className="font-mono text-[12px] tabular-nums" style={{ color: c }}>
            {gain.toFixed(2)}x
          </span>
        </div>

        <button
          className="-mr-1 p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-[9px] w-5 border-y border-label" aria-hidden />
        </button>
      </div>

      {open && (
        <nav className="border-t border-seam bg-void md:hidden" aria-label="Main">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block border-b border-rail px-5 py-4 font-mono text-[12px] uppercase tracking-tag text-label"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
