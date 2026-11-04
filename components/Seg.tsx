import { heatCss } from "@/lib/ramp";

/**
 * A seven-segment readout.
 *
 * Drawn rather than typed, because the thing that makes a real LED panel
 * look real is the segments that are NOT lit — you can see the whole figure
 * eight behind every digit. A font cannot do that.
 */

const H = (x: number, y: number, len: number, t: number) =>
  `${x},${y} ${x + t / 2},${y - t / 2} ${x + len - t / 2},${y - t / 2} ${x + len},${y} ${x + len - t / 2},${y + t / 2} ${x + t / 2},${y + t / 2}`;

const V = (x: number, y: number, len: number, t: number) =>
  `${x},${y} ${x + t / 2},${y + t / 2} ${x + t / 2},${y + len - t / 2} ${x},${y + len} ${x - t / 2},${y + len - t / 2} ${x - t / 2},${y + t / 2}`;

const T = 2.3;
const SEGMENTS: Record<string, string> = {
  a: H(2.6, 2, 8.8, T),
  b: V(11.4, 2.6, 8.4, T),
  c: V(11.4, 12.6, 8.4, T),
  d: H(2.6, 23, 8.8, T),
  e: V(2.6, 12.6, 8.4, T),
  f: V(2.6, 2.6, 8.4, T),
  g: H(2.6, 12.5, 8.8, T),
};

const GLYPHS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abged",
  "3": "abgcd",
  "4": "fgbc",
  "5": "afgcd",
  "6": "afgedc",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
  "-": "g",
  " ": "",
};

const ORDER = ["a", "b", "c", "d", "e", "f", "g"];

function Digit({ ch, color, height }: { ch: string; color: string; height: number }) {
  const on = GLYPHS[ch] ?? "";
  return (
    <svg
      viewBox="0 0 14 25"
      height={height}
      width={(height * 14) / 25}
      aria-hidden
      className="shrink-0 overflow-visible"
    >
      {ORDER.map((s) => {
        const lit = on.includes(s);
        return (
          <polygon
            key={s}
            points={SEGMENTS[s]}
            fill={lit ? color : "#161A22"}
            style={lit ? { filter: `drop-shadow(0 0 3px ${color})` } : undefined}
          />
        );
      })}
    </svg>
  );
}

/**
 * Renders a numeric string. Decimal points and any non-digit run as small
 * glyphs between the segment cells, the way a real panel handles them.
 */
export default function Seg({
  value,
  heat = 0.82,
  height = 34,
  label,
  unit,
}: {
  value: string;
  /** 0..1 on the ironbow. The readout's colour is the measurement. */
  heat?: number;
  height?: number;
  /** Accessible text, since the digits are drawn shapes. */
  label?: string;
  unit?: string;
}) {
  const color = heatCss(Math.max(heat, 0.4));
  return (
    <span className="inline-flex items-end gap-[2px]" role="img" aria-label={label ?? `${value}${unit ? " " + unit : ""}`}>
      {value.split("").map((ch, i) =>
        ch === "." || ch === "," ? (
          <span
            key={i}
            aria-hidden
            className="mb-[2px] shrink-0 rounded-[1px]"
            style={{
              width: height * 0.1,
              height: height * 0.1,
              background: color,
              boxShadow: `0 0 4px ${color}`,
            }}
          />
        ) : (
          <Digit key={i} ch={ch} color={color} height={height} />
        ),
      )}
      {unit && (
        <span
          className="led ml-2 mb-[1px] shrink-0"
          style={{ fontSize: Math.max(9, height * 0.26), color, opacity: 0.85 }}
          aria-hidden
        >
          {unit}
        </span>
      )}
    </span>
  );
}
