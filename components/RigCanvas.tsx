"use client";

import { useEffect, useRef } from "react";
import { ramp } from "@/lib/ramp";
import { rng, seedOf } from "@/lib/rng";

/**
 * The story, told by 440 tiles that never stop being the same 440 tiles.
 *
 * One rack unit becomes an aisle becomes the loop becomes the pool becomes
 * the wordmark, because the pitch is that the fee, the rent, the hash and the
 * liquidity are all one quantity moving round a circuit.
 *
 * Two rules keep it from turning into a lava lamp, which is what happens by
 * default when you composite a lot of warm sprites additively:
 *
 *   1. A tile's body is machined metal first and heat second. Cold tiles are
 *      dark grey equipment, not holes in the page.
 *   2. Bloom is capped hard and only applies above two thirds of the ramp, so
 *      the hot tiles read as hot against something, rather than everything
 *      washing to white.
 *
 * Tiles carry their own width and height per layout — a rack unit is a wide
 * 1U bar, a pool column is a small square — so each act keeps its own
 * structure instead of one tile size being wrong four times out of five.
 */

const N = 440;
const KEYS = [0.06, 0.29, 0.52, 0.73, 0.93];

type Slot = { x: number; y: number; w: number; h: number; t: number };

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/* Machined grey the cold end of every tile sits on. */
const METAL = [23, 27, 36];

/* --- layouts ------------------------------------------------------- */

/** A single 1U unit, lit from inside: three rows of blade-shaped slices. */
function layoutUnit(out: Slot[], W: number, H: number) {
  const uw = Math.min(W * (W < 760 ? 0.76 : 0.4), 460);
  const uh = uw * 0.3;
  const x0 = (W - uw) / 2;
  const y0 = H * 0.46 - uh / 2;
  const cols = 22;
  const rows = 4;
  const cw = uw / cols;
  const ch = uh / rows;
  for (let i = 0; i < N; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols) % rows;
    /* The leftmost column is the status lamps. A rack unit with nothing lit
       on it reads as scrap; one amber LED reads as powered and idle, which is
       exactly where this act starts. */
    out[i] = {
      x: x0 + (c + 0.5) * cw,
      y: y0 + (r + 0.5) * ch,
      w: cw * (c === 0 ? 0.38 : 0.78),
      h: ch * (c === 0 ? 0.38 : 0.6),
      t: c === 0 ? (r === 0 ? 0.86 : 0.1) : 0.035,
    };
  }
}

/** The aisle wall: every rented unit in the building at once, 1U bars. */
function layoutAisle(out: Slot[], W: number, H: number, heats: number[]) {
  const cols = W < 760 ? 16 : 22;
  const rows = Math.ceil(N / cols);
  const gw = Math.min(W * 0.8, 1020);
  const gh = Math.min(H * 0.5, 400);
  const x0 = (W - gw) / 2;
  const y0 = H * 0.44 - gh / 2;
  const cw = gw / cols;
  const ch = gh / rows;
  for (let i = 0; i < N; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out[i] = {
      x: x0 + (c + 0.5) * cw,
      y: y0 + (r + 0.5) * ch,
      w: cw * 0.78,
      h: ch * 0.46,
      t: heats[i],
    };
  }
}

/** The circuit: a rounded rectangle of small squares, with a pulse on it. */
function loopBox(W: number, H: number) {
  const pad = Math.min(W * 0.22, 310);
  return { x0: pad, x1: W - pad, y0: H * 0.22, y1: H * 0.66 };
}

function loopPoint(t: number, W: number, H: number) {
  const { x0, x1, y0, y1 } = loopBox(W, H);
  const w = x1 - x0;
  const h = y1 - y0;
  let d = ((t % 1) + 1) % 1;
  d *= 2 * (w + h);
  if (d < w) return { x: x0 + d, y: y0 };
  d -= w;
  if (d < h) return { x: x1, y: y0 + d };
  d -= h;
  if (d < w) return { x: x1 - d, y: y1 };
  d -= w;
  return { x: x0, y: y1 - d };
}

function layoutLoop(out: Slot[], W: number, H: number, phase: number) {
  const s = Math.max(3, Math.min(W, 1100) / 260);
  for (let i = 0; i < N; i++) {
    const u = i / N;
    const p = loopPoint(u, W, H);
    /* A packet of value chasing round the circuit. */
    const d = (u - phase + 1) % 1;
    const pulse = d < 0.12 ? 1 - d / 0.12 : 0;
    out[i] = { x: p.x, y: p.y, w: s, h: s, t: 0.2 + pulse * 0.75 };
  }
}

/** The pool filling: stacked columns under a rising curve. The hot band on
 *  top is the share the rigs mined rather than the share routed directly. */
function layoutPool(out: Slot[], W: number, H: number) {
  const cols = 44;
  const per = Math.ceil(N / cols);
  const gw = Math.min(W * 0.76, 980);
  const gh = Math.min(H * 0.46, 360);
  const x0 = (W - gw) / 2;
  const base = H * 0.66;
  const cw = gw / cols;
  for (let i = 0; i < N; i++) {
    const c = Math.floor(i / per);
    const k = i % per;
    const u = cols > 1 ? c / (cols - 1) : 0;
    const height = gh * (0.08 + 0.92 * (0.3 * u + 0.7 * u * u));
    const cell = height / per;
    const y = base - (k + 0.5) * cell;
    const frac = (k + 0.5) / per;
    out[i] = {
      x: x0 + (c + 0.5) * cw,
      y,
      w: cw * 0.66,
      h: Math.max(2, cell * 0.6),
      /* top third of each column is mined proceeds */
      t: frac > 0.6 ? 0.6 + (frac - 0.6) * 0.95 : 0.1 + frac * 0.22,
    };
  }
}

/** The wordmark, sampled off an offscreen raster so the letterforms are the
 *  real ones rather than something plotted by hand. */
function sampleWordmark(W: number, H: number): { x: number; y: number }[] {
  const c = document.createElement("canvas");
  const w = Math.min(Math.floor(W), 1400);
  const h = 300;
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (!g) return [];
  const size = Math.min(w / 6.4, 156);
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `600 ${size}px "Space Grotesk", system-ui, sans-serif`;
  g.fillText("MINERPAD", w / 2, h / 2);
  const data = g.getImageData(0, 0, w, h).data;

  /* Measure the ink first, then pick a sampling step that yields roughly N
     points. Sampling at a fixed step gives either a ragged wordmark or far
     more points than there are tiles to fill them. */
  let ink = 0;
  for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) if (data[(y * w + x) * 4 + 3] > 140) ink++;
  const area = ink * 9;
  const step = Math.max(4, Math.round(Math.sqrt(area / N)));

  const pts: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 140) pts.push({ x: x + (W - w) / 2, y: y + H * 0.44 - h / 2 });
    }
  }
  return pts;
}

function layoutStamp(out: Slot[], W: number, H: number, pts: { x: number; y: number }[], heats: number[]) {
  if (!pts.length) return layoutAisle(out, W, H, heats);
  /* Points are row-major, so taking an evenly spaced subset keeps coverage
     even when there are more of them than tiles. */
  const stride = pts.length / N;
  let lo = Infinity;
  let hi = -Infinity;
  for (const q of pts) {
    if (q.x < lo) lo = q.x;
    if (q.x > hi) hi = q.x;
  }
  const s = Math.max(4, Math.min(W, 1400) / 175);
  for (let i = 0; i < N; i++) {
    const p = pts[Math.min(pts.length - 1, Math.floor(i * stride))];
    /* The wordmark is on the ramp too: cool on the M, white-hot on the D. */
    out[i] = { x: p.x, y: p.y, w: s, h: s, t: 0.52 + ((p.x - lo) / (hi - lo || 1)) * 0.44 };
  }
}

/* ------------------------------------------------------------------- */

export default function RigCanvas({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let wordmark: { x: number; y: number }[] = [];

    /* One pre-rendered radial sprite. Compositing this additively is an order
       of magnitude cheaper than setting shadowBlur per tile. */
    const glow = document.createElement("canvas");
    glow.width = glow.height = 64;
    const gg = glow.getContext("2d")!;
    const grad = gg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,196,110,0.85)");
    grad.addColorStop(0.4, "rgba(255,140,40,0.2)");
    grad.addColorStop(1, "rgba(255,120,20,0)");
    gg.fillStyle = grad;
    gg.fillRect(0, 0, 64, 64);

    /* Per-tile aisle heat. Roughly a third of the wall is throttled, which is
       the roster's real proportion and the reason the wall is not all orange. */
    const r = rng(seedOf("aisle-heat"));
    const heats = Array.from({ length: N }, () => {
      const cold = r() < 0.36;
      return cold ? 0.04 + r() * 0.2 : 0.5 + r() * 0.45;
    });
    /* Per-tile transition delay, so tiles do not all fly in parallel and turn
       the morph into a bundle of streaks. */
    const lag = Array.from({ length: N }, () => r() * 0.42);

    const A: Slot[] = Array.from({ length: N }, () => ({ x: 0, y: 0, w: 1, h: 1, t: 0 }));
    const B: Slot[] = Array.from({ length: N }, () => ({ x: 0, y: 0, w: 1, h: 1, t: 0 }));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      wordmark = sampleWordmark(W, H);
    }

    function build(k: number, into: Slot[], phase: number) {
      if (k <= 0) layoutUnit(into, W, H);
      else if (k === 1) layoutAisle(into, W, H, heats);
      else if (k === 2) layoutLoop(into, W, H, phase);
      else if (k === 3) layoutPool(into, W, H);
      else layoutStamp(into, W, H, wordmark, heats);
    }

    let raf = 0;
    let t0 = 0;

    function frame(now: number) {
      if (!t0) t0 = now;
      const time = (now - t0) / 1000;
      const p = progressRef.current;

      let k = 0;
      while (k < KEYS.length - 2 && p > KEYS[k + 1]) k++;
      const span = KEYS[k + 1] - KEYS[k];
      const mix = smooth((p - KEYS[k]) / (span || 1));

      const phase = reduced ? 0.3 : (time * 0.24) % 1;
      build(k, A, phase);
      build(k + 1, B, phase);

      ctx!.fillStyle = "#05060A";
      ctx!.fillRect(0, 0, W, H);

      /* Act 0 has its own beat: the unit is dark until the fee lands. */
      const spin = k === 0 ? smooth(mix * 1.7) : 1;

      /* Pass one: bodies. Metal, warmed by the measurement. */
      for (let i = 0; i < N; i++) {
        const m = smooth(Math.min(1, Math.max(0, (mix - lag[i]) / (1 - lag[i]))));
        const x = A[i].x + (B[i].x - A[i].x) * m;
        const y = A[i].y + (B[i].y - A[i].y) * m;
        const w = A[i].w + (B[i].w - A[i].w) * m;
        const h = A[i].h + (B[i].h - A[i].h) * m;
        let t = A[i].t + (B[i].t - A[i].t) * m;
        if (k === 0) t = Math.max(t, spin * heats[i]);
        if (k === 3) t *= 1 - m * 0.16;

        const [cr, cg, cb] = ramp(t);
        /* Below a third of the ramp the tile is equipment, not light. */
        const blend = t < 0.34 ? t / 0.34 : 1;
        ctx!.fillStyle = `rgb(${Math.round(METAL[0] + (cr - METAL[0]) * blend)},${Math.round(
          METAL[1] + (cg - METAL[1]) * blend,
        )},${Math.round(METAL[2] + (cb - METAL[2]) * blend)})`;
        ctx!.fillRect(x - w / 2, y - h / 2, w, h);

        A[i].x = x;
        A[i].y = y;
        A[i].w = w;
        A[i].h = h;
        A[i].t = t;
      }

      /* Pass two: bloom, hard-capped, hot tiles only. */
      ctx!.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const t = A[i].t;
        if (t < 0.66) continue;
        const a = (t - 0.66) / 0.34;
        ctx!.globalAlpha = Math.min(0.34, a * 0.34);
        const s = Math.max(A[i].w, A[i].h) * (2.4 + a * 1.6);
        ctx!.drawImage(glow, A[i].x - s / 2, A[i].y - s / 2, s, s);
      }
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";

      /* Circuit labels, drawn only once the loop has actually formed so they
         are never floating over a cloud of tiles in transit. */
      /* Keyframe 2 is the loop, so it is fully assembled at the end of
         segment 1 and at the start of segment 2 — both need the labels. */
      const formed =
        k === 1 ? Math.max(0, (mix - 0.78) / 0.22) : k === 2 ? Math.max(0, 1 - mix / 0.22) : 0;
      if (formed > 0.02) {
        const nodes: [number, string][] = [
          [0.02, "FEE"],
          [0.3, "RENT"],
          [0.54, "HASH"],
          [0.78, "SETTLE"],
          [0.92, "POOL"],
        ];
        ctx!.font = '600 10px ui-monospace, monospace';
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        for (const [t, lbl] of nodes) {
          const pt = loopPoint(t, W, H);
          ctx!.fillStyle = `rgba(5,6,10,${0.94 * formed})`;
          ctx!.fillRect(pt.x - 33, pt.y - 10, 66, 20);
          ctx!.strokeStyle = `rgba(249,150,10,${0.5 * formed})`;
          ctx!.lineWidth = 1;
          ctx!.strokeRect(pt.x - 33, pt.y - 10, 66, 20);
          ctx!.fillStyle = `rgba(255,212,71,${formed})`;
          ctx!.fillText(lbl, pt.x, pt.y + 0.5);
        }
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [progressRef]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}
