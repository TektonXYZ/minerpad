/** Deterministic time series. No Date.now, no trig — see lib/rng.ts. */

import { rng, seedOf, gauss, clamp } from "./rng";

/** Smooth once-a-day bump built from a parabola, so volume breathes with the
 *  trading day without anyone having to call cos(). */
const diurnal = (t: number) => {
  const u = 2 * (t % 1) - 1;
  return 1 - u * u;
};

export type Point = { t: number; v: number };

/**
 * A mean-reverting walk under a diurnal envelope. Used for hashrate, which
 * tracks fee income, which tracks volume, which has a shape.
 */
export function walk(seed: string, points: number, base: number, vol: number, swing = 0.35): Point[] {
  const r = rng(seedOf(seed));
  const out: Point[] = [];
  let x = 0;
  for (let i = 0; i < points; i++) {
    x = x * 0.86 + gauss(r) * vol;
    const env = 1 + (diurnal(i / points + 0.18) - 0.5) * swing;
    out.push({ t: i, v: Math.max(0, base * env * (1 + x)) });
  }
  return out;
}

/** A line that only goes up — cumulative mined proceeds settled into a pool.
 *  Steps are uneven because blocks arrive when they arrive. */
export function cumulative(seed: string, points: number, total: number): Point[] {
  const r = rng(seedOf(seed + ":cum"));
  const weights: number[] = [];
  let sum = 0;
  for (let i = 0; i < points; i++) {
    const w = 0.35 + r() * 1.3 + diurnal(i / points + 0.18) * 0.7;
    weights.push(w);
    sum += w;
  }
  const out: Point[] = [];
  let acc = 0;
  for (let i = 0; i < points; i++) {
    acc += (weights[i] / sum) * total;
    out.push({ t: i, v: acc });
  }
  return out;
}

/** Shares/temperatures — a value that jitters inside a band. */
export function band(seed: string, points: number, mid: number, spread: number): Point[] {
  const r = rng(seedOf(seed + ":band"));
  const out: Point[] = [];
  let x = 0;
  for (let i = 0; i < points; i++) {
    x = clamp(x * 0.78 + gauss(r) * 0.34, -1.8, 1.8);
    out.push({ t: i, v: mid + x * spread });
  }
  return out;
}

export const extent = (ps: Point[]) => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of ps) {
    if (p.v < lo) lo = p.v;
    if (p.v > hi) hi = p.v;
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  return { lo, hi };
};

/** Points -> an SVG path string, y flipped, padded inside the box. */
export function path(ps: Point[], w: number, h: number, pad = 2, lo?: number, hi?: number): string {
  if (!ps.length) return "";
  const e = extent(ps);
  const min = lo ?? e.lo;
  const max = hi ?? e.hi;
  const span = max - min || 1;
  const dx = ps.length > 1 ? (w - pad * 2) / (ps.length - 1) : 0;
  return ps
    .map((p, i) => {
      const x = pad + i * dx;
      const y = h - pad - ((p.v - min) / span) * (h - pad * 2);
      return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join("");
}

export const areaPath = (ps: Point[], w: number, h: number, pad = 2, lo?: number, hi?: number) =>
  ps.length ? `${path(ps, w, h, pad, lo, hi)}L${(w - pad).toFixed(2)},${h}L${pad.toFixed(2)},${h}Z` : "";
