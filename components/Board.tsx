"use client";

import { useMemo, useState } from "react";
import type { CoinView } from "@/lib/data";
import RigCard from "./RigCard";
import Fan from "./Fan";
import { HeatBar, Pip, Stencil } from "./ui";
import { hash, usd, usdShort, pct } from "@/lib/format";
import { heatCss } from "@/lib/ramp";

type Key = "gain" | "edge" | "hashrate" | "pool" | "rent" | "temp" | "age";

const COLUMNS: { key: Key; label: string; get: (c: CoinView) => number; fmt: (c: CoinView) => string }[] = [
  { key: "hashrate", label: "hashrate", get: (c) => c.econ.rig.hashrate * c.duty, fmt: (c) => hash(c.econ.rig.hashrate * c.duty) },
  { key: "rent", label: "rent / day", get: (c) => c.econ.rig.cost * c.duty, fmt: (c) => usd(c.econ.rig.cost * c.duty, 0) },
  { key: "edge", label: "into pool / day", get: (c) => c.econ.rig.revenue * c.duty, fmt: (c) => usd(c.econ.rig.revenue * c.duty, 0) },
  { key: "gain", label: "loop gain", get: (c) => c.econ.rig.gain, fmt: (c) => `${c.econ.rig.gain.toFixed(2)}x` },
  { key: "pool", label: "pool", get: (c) => c.pool, fmt: (c) => usdShort(c.pool) },
  { key: "temp", label: "temp", get: (c) => c.tempC, fmt: (c) => `${c.tempC.toFixed(0)}°C` },
  { key: "age", label: "age", get: (c) => c.age, fmt: (c) => `${Math.round(c.age / 24)}d` },
];

export default function Board({ coins }: { coins: CoinView[] }) {
  const [sort, setSort] = useState<Key>("edge");
  const [only, setOnly] = useState<"all" | "clearing" | "throttled">("all");
  const [view, setView] = useState<"grid" | "table">("table");

  const rows = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sort)!;
    return coins
      .filter((c) => (only === "all" ? true : only === "clearing" ? c.clears : !c.clears))
      .sort((a, b) => col.get(b) - col.get(a));
  }, [coins, sort, only]);

  return (
    <div>
      {/* controls, styled as the switch bank on a front panel */}
      <div className="flex flex-wrap items-center gap-3 border border-seam bg-deck p-3">
        <Stencil>filter</Stencil>
        <div className="flex">
          {(["all", "clearing", "throttled"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setOnly(k)}
              className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-tag transition-colors ${
                only === k ? "border-t70 bg-t70/12 text-t92" : "border-seam text-dim hover:text-label"
              } ${k !== "all" ? "-ml-px" : ""}`}
              aria-pressed={only === k}
            >
              {k}
            </button>
          ))}
        </div>

        <span className="ml-auto flex items-center gap-3">
          <Stencil>view</Stencil>
          <div className="flex">
            {(["table", "grid"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-tag transition-colors ${
                  view === v ? "border-t70 bg-t70/12 text-t92" : "border-seam text-dim hover:text-label"
                } ${v !== "table" ? "-ml-px" : ""}`}
                aria-pressed={view === v}
              >
                {v}
              </button>
            ))}
          </div>
        </span>
      </div>

      <p className="mt-3 font-mono text-[11px] text-dim" role="status">
        {rows.length} of {coins.length} coins · sorted by {COLUMNS.find((c) => c.key === sort)!.label}
      </p>

      {view === "grid" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <RigCard key={c.symbol} c={c} />
          ))}
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto border border-seam">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="bg-rack">
                <th scope="col" className="sticky left-0 z-10 bg-rack px-4 py-3 text-left">
                  <Stencil>coin</Stencil>
                </th>
                <th scope="col" className="px-3 py-3 text-left">
                  <Stencil>rig</Stencil>
                </th>
                {COLUMNS.map((col) => (
                  <th key={col.key} scope="col" className="px-3 py-3 text-right">
                    <button
                      onClick={() => setSort(col.key)}
                      className={`stencil transition-colors hover:text-label ${sort === col.key ? "!text-t82" : ""}`}
                      aria-sort={sort === col.key ? "descending" : "none"}
                    >
                      {col.label}
                      {sort === col.key ? " ▾" : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const heat = c.econ.rig.heat;
                return (
                  <tr key={c.symbol} className="border-t border-rail transition-colors hover:bg-rack/60">
                    <th scope="row" className="sticky left-0 z-10 bg-deck px-4 py-3 text-left font-normal">
                      <a href={`/rig/${c.symbol.toLowerCase()}`} className="group flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className="h-6 w-[3px] shrink-0"
                          style={{ background: heatCss(heat), boxShadow: heat > 0.55 ? `0 0 8px ${heatCss(heat, 0.6)}` : "none" }}
                        />
                        <span>
                          <span className="block font-display text-[14px] font-semibold tracking-tight text-bone group-hover:text-t92">
                            ${c.symbol}
                          </span>
                          <span className="block font-mono text-[10px] text-dim">{c.name}</span>
                        </span>
                      </a>
                    </th>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2">
                        <Fan rpm={c.rpm} size={18} heat={heat} className="shrink-0 opacity-70" />
                        <span className="font-mono text-[11px] text-label">
                          {c.hardware.short}
                          <span className="text-screw"> → </span>
                          {c.algo.coin}
                        </span>
                      </span>
                    </td>
                    {COLUMNS.map((col) => {
                      const isGain = col.key === "gain";
                      return (
                        <td
                          key={col.key}
                          className="whitespace-nowrap px-3 py-3 text-right font-mono text-[12px] tabular-nums"
                          style={{ color: isGain ? heatCss(Math.max(heat, 0.34)) : "#9AA3B2" }}
                        >
                          {col.fmt(c)}
                          {isGain && <HeatBar t={heat} height={3} className="mt-1.5 w-16 border-0" marker />}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
