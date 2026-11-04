"use client";

import { useEffect, useRef, useState } from "react";
import RigCanvas from "./RigCanvas";
import { Stencil } from "./ui";

/**
 * The pinned story. Owns scroll progress, hands it to the canvas through a
 * ref (never state — this updates every frame), and fades five captions in
 * and out over it.
 *
 * The captions are real DOM text, so the argument survives with the canvas
 * switched off, and the whole section collapses to a static summary when the
 * viewport is too short to pin anything comfortably.
 */

const ACTS = [
  {
    at: 0.06,
    kicker: "01 · Intake",
    title: "A trade lands.",
    body: "Someone buys, someone sells, and the pad takes its cut. That cut does not go to a treasury and it does not sit in a multisig.",
  },
  {
    at: 0.29,
    kicker: "02 · Rent",
    title: "The fee rents silicon.",
    body: "Cards and cores, by the hour, on the idle-capacity market. No hardware to buy, no warehouse to lease, no power contract to sign. When the fees stop, the rig stops.",
  },
  {
    at: 0.52,
    kicker: "03 · Work",
    title: "The silicon mines.",
    body: "Pointed at whichever proof-of-work network the arithmetic actually favours — which, at rental prices, is almost never the famous one.",
  },
  {
    at: 0.73,
    kicker: "04 · Settle",
    title: "What it mines goes back in the pool.",
    body: "Not to the founder. Not to a buyback wallet. Into the liquidity of the coin whose trading paid the rent in the first place.",
  },
  {
    at: 0.93,
    kicker: "05 · Repeat",
    title: "Then the pool is deeper.",
    body: "Deeper liquidity, tighter spread, more trade, a bigger fee, a bigger rig. That is the whole machine. It only runs while the arithmetic holds.",
  },
];

export default function ScrollStory() {
  const wrap = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [act, setAct] = useState(0);
  const [p, setP] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let raf = 0;
    let last = -1;

    const read = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const v = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
      progress.current = v;
      /* State updates are for the captions only, and only when the numbers
         they show would actually change. The canvas reads the ref. */
      const rounded = Math.round(v * 100) / 100;
      if (rounded !== last) {
        last = rounded;
        setP(rounded);
        let best = 0;
        for (let i = 0; i < ACTS.length; i++) {
          if (Math.abs(v - ACTS[i].at) < Math.abs(v - ACTS[best].at)) best = i;
        }
        setAct(best);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={wrap} className="relative" style={{ height: "620svh" }} aria-label="How the loop works">
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-void">
        <RigCanvas progressRef={progress} />

        {/* vignette, so captions always have something to sit on */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 45%, transparent 26%, rgba(5,6,10,0.75) 86%), linear-gradient(180deg, rgba(5,6,10,0.88), transparent 18%, transparent 52%, rgba(5,6,10,0.93) 78%, rgba(5,6,10,0.99))",
          }}
        />

        {/* act rail */}
        <div className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
          {ACTS.map((a, i) => (
            <span
              key={a.at}
              className="block h-[22px] w-[2px] transition-colors duration-300"
              style={{ background: i === act ? "#F9960A" : "#262B36" }}
            />
          ))}
        </div>

        {/* captions */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center px-5 pb-16 md:pb-20">
          <div className="relative h-[220px] w-full max-w-2xl md:h-[200px]">
            {ACTS.map((a, i) => {
              /* Only ever the nearest caption. Fading two at once left both
                 at a quarter opacity on top of each other. */
              const d = Math.abs(p - a.at);
              const o = i === act ? Math.max(0, 1 - d / 0.13) : 0;
              return (
                <div
                  key={a.at}
                  className="absolute inset-x-0 bottom-0 text-center"
                  style={{
                    opacity: o,
                    transform: `translateY(${(1 - o) * 16}px)`,
                    visibility: o < 0.02 ? "hidden" : "visible",
                  }}
                  aria-hidden={o < 0.5}
                >
                  <Stencil>{a.kicker}</Stencil>
                  <h2 className="mt-3 font-display text-[28px] font-medium leading-[1.08] tracking-tight text-bone md:text-[44px]">
                    {a.title}
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl font-mono text-[12px] leading-relaxed text-label md:text-[13px]">
                    {a.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* the same five steps, as text, for anything that cannot see a canvas */}
        <ol className="sr-only">
          {ACTS.map((a) => (
            <li key={a.at}>
              {a.title} {a.body}
            </li>
          ))}
        </ol>

        <div
          className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 transition-opacity duration-500"
          style={{ opacity: p < 0.03 ? 1 : 0 }}
        >
          <Stencil>scroll</Stencil>
        </div>
      </div>
    </section>
  );
}
