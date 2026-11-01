import { path, areaPath, extent } from "@/lib/series";
import type { Point } from "@/lib/series";
import { heatCss } from "@/lib/ramp";

/** A small line, no axes. Used inside rows where the shape is the message. */
export function Sparkline({
  points,
  w = 120,
  h = 30,
  heat = 0.72,
  className = "",
}: {
  points: Point[];
  w?: number;
  h?: number;
  heat?: number;
  className?: string;
}) {
  const c = heatCss(Math.max(heat, 0.34));
  const id = `sp${Math.round(heat * 1000)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={className} aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.28" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath(points, w, h, 2)} fill={`url(#${id})`} />
      <path d={path(points, w, h, 2)} fill="none" stroke={c} strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The pool chart: two stacked areas, because the entire question is how much
 * of the liquidity got there by being mined rather than routed. Direct
 * routing is cold grey; mined proceeds are hot. If the hot band is thin, the
 * rig is not earning its place.
 */
export function PoolChart({
  direct,
  mined,
  w = 720,
  h = 240,
  label,
}: {
  direct: Point[];
  mined: Point[];
  w?: number;
  h?: number;
  label: string;
}) {
  const stacked: Point[] = direct.map((d, i) => ({ t: d.t, v: d.v + (mined[i]?.v ?? 0) }));
  const { hi } = extent(stacked);
  const grid = [0.25, 0.5, 0.75];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={label} preserveAspectRatio="none">
      <defs>
        <linearGradient id="poolHot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F9960A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#B92060" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="poolCold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#39404F" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#262B36" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {grid.map((g) => (
        <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="#191D26" strokeWidth="1" />
      ))}
      <path d={areaPath(stacked, w, h, 0, 0, hi)} fill="url(#poolHot)" />
      <path d={path(stacked, w, h, 0, 0, hi)} fill="none" stroke="#F9960A" strokeWidth="1.5" />
      <path d={areaPath(direct, w, h, 0, 0, hi)} fill="url(#poolCold)" />
      <path d={path(direct, w, h, 0, 0, hi)} fill="none" stroke="#5D6574" strokeWidth="1.25" />
    </svg>
  );
}

/** Horizontal bars for comparing rigs. Bar colour is the rig's loop gain. */
export function GainBars({
  rows,
  max,
}: {
  rows: { label: string; value: number; heat: number; note?: string }[];
  max: number;
}) {
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(84px,auto)_1fr_auto] items-center gap-3">
          <span className="font-mono text-[11px] text-label">{r.label}</span>
          <span className="relative block h-[10px] border border-seam bg-void">
            <span
              className="absolute inset-y-0 left-0"
              style={{
                width: `${Math.min(100, (r.value / max) * 100)}%`,
                background: heatCss(r.heat),
                boxShadow: r.heat > 0.55 ? `0 0 10px ${heatCss(r.heat, 0.55)}` : "none",
              }}
            />
            {/* break-even, so a bar that fails to reach it reads as failure */}
            <span className="absolute inset-y-0 w-px bg-bone/40" style={{ left: `${(1 / max) * 100}%` }} />
          </span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: heatCss(Math.max(r.heat, 0.34)) }}>
            {r.note ?? `${r.value.toFixed(2)}x`}
          </span>
        </li>
      ))}
    </ul>
  );
}
