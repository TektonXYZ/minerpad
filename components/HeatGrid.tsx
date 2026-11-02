"use client";

import { useState } from "react";
import { aisle } from "@/lib/data";
import { heatCss, RAMP_CSS, BREAK_EVEN } from "@/lib/ramp";
import { Stencil } from "./ui";

/**
 * The aisle, one tile per unit of spend.
 *
 * This is the whole board in a single glance: hot tiles are rigs returning
 * more than their rent, cold violet tiles are rigs the pad has throttled
 * because they were not. Hovering isolates a coin's tiles so you can see how
 * much of the wall belongs to it.
 */
export default function HeatGrid() {
  const slots = aisle();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(16px, 1fr))" }}
        onMouseLeave={() => setHover(null)}
      >
        {slots.map((s, i) => {
          const dim = hover && hover !== s.symbol;
          return (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              aria-hidden
              onMouseEnter={() => setHover(s.symbol)}
              onFocus={() => setHover(s.symbol)}
              className="h-[9px] w-full transition-opacity duration-150"
              style={{
                background: heatCss(s.heat),
                opacity: dim ? 0.13 : 1,
                boxShadow: s.heat > 0.6 && !dim ? `0 0 6px ${heatCss(s.heat, 0.5)}` : "none",
              }}
            />
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Stencil>{hover ? `$${hover}` : "hover a unit"}</Stencil>
          {hover && (
            <a href={`/rig/${hover.toLowerCase()}`} className="font-mono text-[11px] text-t82 hover:text-t92">
              open rig →
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Stencil>cold</Stencil>
          <span className="relative block h-[8px] w-40 border border-seam" style={{ background: `linear-gradient(90deg, ${RAMP_CSS})` }}>
            <span className="absolute -top-1 h-[14px] w-px bg-bone/70" style={{ left: `${BREAK_EVEN * 100}%` }} />
          </span>
          <Stencil>hot</Stencil>
        </div>
      </div>
      <p className="mt-2 text-right font-mono text-[10px] text-dim">
        white notch = break-even. anything left of it is costing more rent than it mines.
      </p>
    </div>
  );
}
