import { heatCss } from "@/lib/ramp";

/**
 * The mark: a three-blade fan whose blades are also the arrows of a cycle.
 * Cooling and the loop are the same shape, which is the entire pitch in one
 * glyph. The blades warm as they go round, so the mark is itself on the ramp.
 */
export default function Mark({ size = 28, className = "" }: { size?: number; className?: string }) {
  const blades = [
    { a: 0, t: 0.92 },
    { a: 120, t: 0.72 },
    { a: 240, t: 0.5 },
  ];
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      <rect x="1" y="1" width="46" height="46" rx="5" fill="#0A0C11" stroke="#262B36" />
      {blades.map(({ a, t }) => (
        <g key={a} style={{ transformOrigin: "24px 24px", transform: `rotate(${a}deg)` }}>
          {/* blade */}
          <path
            d="M24 21.5 C 30.5 20, 35.5 16.5, 37 10.5 C 30 11.5, 25.5 15, 24 21.5 Z"
            fill={heatCss(t)}
          />
          {/* the blade's leading edge sharpened into an arrowhead */}
          <path d="M37 10.5 L 31.6 9.4 L 35.2 15.4 Z" fill={heatCss(Math.min(1, t + 0.12))} />
        </g>
      ))}
      <circle cx="24" cy="24" r="4.6" fill="#10131A" stroke="#39404F" strokeWidth="1" />
      <circle cx="24" cy="24" r="1.3" fill={heatCss(1)} />
    </svg>
  );
}
