"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/** Reveal on first intersection, then stop watching. Content is visible
 *  without scripting — see the `.js` guard in globals.css. */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "tr";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("shown");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // @ts-expect-error -- polymorphic ref across a small fixed tag set
    <As ref={ref} data-reveal className={className} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </As>
  );
}
