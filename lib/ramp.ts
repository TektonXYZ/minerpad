/**
 * The ironbow.
 *
 * One ramp, sampled by everything: CSS inline styles, SVG fills, and the
 * canvas. That is what keeps the site's single rule enforceable — if it
 * glows, it is a number, and the colour it glows is that number's value.
 *
 * Break-even loop gain is pinned at t = 0.55, right where violet gives way
 * to red, so a fleet that is underwater is not merely dimmer than one that
 * works. It is a different colour.
 */

const STOPS: [number, number, number, number][] = [
  [0.0, 6, 7, 14],
  [0.12, 18, 10, 42],
  [0.26, 58, 16, 112],
  [0.4, 122, 20, 120],
  [0.55, 185, 32, 96],
  [0.68, 232, 90, 28],
  [0.82, 249, 150, 10],
  [0.92, 255, 212, 71],
  [1.0, 255, 246, 224],
];

export function ramp(t: number): [number, number, number] {
  const x = t <= 0 ? 0 : t >= 1 ? 1 : t;
  let i = 0;
  while (i < STOPS.length - 2 && x > STOPS[i + 1][0]) i++;
  const [p0, r0, g0, b0] = STOPS[i];
  const [p1, r1, g1, b1] = STOPS[i + 1];
  const k = p1 === p0 ? 0 : (x - p0) / (p1 - p0);
  return [
    Math.round(r0 + (r1 - r0) * k),
    Math.round(g0 + (g1 - g0) * k),
    Math.round(b0 + (b1 - b0) * k),
  ];
}

export function heatCss(t: number, alpha = 1): string {
  const [r, g, b] = ramp(t);
  return alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
}

/** A readable foreground at this heat: the low end of the ramp is nearly
 *  black, so anything under a third of the way up gets lifted. */
export function heatText(t: number): string {
  return heatCss(Math.max(t, 0.34));
}

/** The full ramp as a CSS gradient, for legends and meters. */
export const RAMP_CSS = STOPS.map(([p, r, g, b]) => `rgb(${r},${g},${b}) ${(p * 100).toFixed(0)}%`).join(", ");

/** Where break-even sits on the ramp, so legends can mark it. */
export const BREAK_EVEN = 0.55;
