/**
 * Deterministic randomness.
 *
 * Everything on this site is rendered twice — once on the server at build
 * time, once in the browser — and the two have to agree to the last digit or
 * React tears the tree down. That rules out Date.now, Math.random, and
 * (less obviously) Math.sin/Math.log, whose last bits are libm-dependent and
 * differ between the Node that builds and the V8 that hydrates. So: integer
 * ops only, and a seeded stream.
 */

/** mulberry32 — 32-bit integer state, identical output on every engine. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of a string, so a ticker can seed its own stream. */
export function seedOf(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export type Rng = ReturnType<typeof rng>;

export const between = (r: Rng, lo: number, hi: number) => lo + r() * (hi - lo);

export const intBetween = (r: Rng, lo: number, hi: number) => Math.floor(lo + r() * (hi - lo + 1));

export const pick = <T,>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length) % xs.length];

/** Bates gaussian: mean 0, roughly unit variance, no transcendentals. */
export function gauss(r: Rng): number {
  return (r() + r() + r() + r() + r() + r() - 3) * 1.4142135623730951;
}

export const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);

export const clamp01 = (x: number) => clamp(x, 0, 1);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
