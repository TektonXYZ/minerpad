"use client";

import { heatCss } from "@/lib/ramp";

/**
 * A fan that turns at the speed the readout next to it claims.
 *
 * Seven blades, because that is what an axial case fan has and the count is
 * what makes the strobing look right. Duration comes straight from RPM, so a
 * throttled rig visibly idles.
 */
export default function Fan({
  rpm,
  size = 34,
  heat = 0.6,
  className = "",
}: {
  rpm: number;
  size?: number;
  heat?: number;
  className?: string;
}) {
  /* Real RPM would be a blur. Slowed 40x so the blades read as blades, and
     clamped so a stopped fan does not sit at zero duration. */
  const seconds = Math.max(0.25, 2400 / Math.max(rpm, 120));
  const color = heatCss(Math.max(heat, 0.3));
  const blades = Array.from({ length: 7 }, (_, i) => (i * 360) / 7);

  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      <circle cx="24" cy="24" r="22.5" fill="#0A0C11" stroke="#262B36" />
      <circle cx="24" cy="24" r="19" fill="none" stroke="#161A22" />
      <g
        style={{
          transformOrigin: "24px 24px",
          animation: rpm > 0 ? `spin360 ${seconds}s linear infinite` : undefined,
        }}
      >
        {blades.map((a) => (
          <path
            key={a}
            d="M24 24 C 30 20, 36 16, 38 9 C 31 10, 25 14, 24 24 Z"
            fill={color}
            opacity={0.34}
            style={{ transformOrigin: "24px 24px", transform: `rotate(${a}deg)` }}
          />
        ))}
      </g>
      <circle cx="24" cy="24" r="6" fill="#10131A" stroke="#39404F" />
      <circle cx="24" cy="24" r="1.6" fill={color} />
      <style>{"@keyframes spin360{to{transform:rotate(360deg)}}"}</style>
    </svg>
  );
}
