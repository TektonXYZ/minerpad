import type { ReactNode, CSSProperties } from "react";
import { heatCss, heatText, RAMP_CSS, BREAK_EVEN } from "@/lib/ramp";

/** Four pan-head screws in the corners. Nothing on this site floats. */
export function Screws({ inset = 7 }: { inset?: number }) {
  const spots: CSSProperties[] = [
    { top: inset, left: inset },
    { top: inset, right: inset },
    { bottom: inset, left: inset },
    { bottom: inset, right: inset },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <span key={i} aria-hidden className="screwhead absolute h-[5px] w-[5px] rounded-full" style={s} />
      ))}
    </>
  );
}

export function Panel({
  children,
  className = "",
  screws = false,
  flush = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  screws?: boolean;
  flush?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`relative ${flush ? "panel-flush" : "panel"} ${className}`} {...rest}>
      {screws && <Screws />}
      {children}
    </div>
  );
}

/** Stencilled label. The only typographic voice the chrome is allowed. */
export function Stencil({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`stencil ${className}`}>{children}</span>;
}

/** Asset tag: the little riveted plate bolted to real equipment. */
export function Tag({ children, tone = "cold" }: { children: ReactNode; tone?: "cold" | "hot" | "warn" }) {
  const tones = {
    cold: "border-seam text-dim",
    hot: "border-t70/60 text-t82",
    warn: "border-t55/60 text-t55",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-1.5 py-[3px] font-mono text-[10px] uppercase tracking-tag ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** A labelled measurement. Value is mono and tabular; the label never is. */
export function Stat({
  label,
  value,
  sub,
  heat,
  align = "left",
  size = "md",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** 0..1 on the ironbow. Supplying it is a claim that the value is a
   *  measurement; omitting it leaves the value bone-coloured. */
  heat?: number;
  align?: "left" | "right";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "text-[15px]", md: "text-xl", lg: "text-3xl md:text-4xl" };
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <Stencil>{label}</Stencil>
      <div
        className={`mt-1.5 font-mono ${sizes[size]} leading-none tabular-nums`}
        style={heat === undefined ? { color: "#E6E9EF" } : { color: heatText(heat) }}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 font-mono text-[11px] leading-tight text-dim">{sub}</div>}
    </div>
  );
}

/** Horizontal thermal meter. The fill's colour IS the reading. */
export function HeatBar({
  t,
  height = 4,
  className = "",
  marker = false,
}: {
  t: number;
  height?: number;
  className?: string;
  /** Draw the break-even notch. */
  marker?: boolean;
}) {
  const w = Math.max(0, Math.min(1, t)) * 100;
  return (
    <div
      className={`relative w-full overflow-hidden border border-seam bg-void ${className}`}
      style={{ height }}
    >
      <div
        className="h-full"
        style={{ width: `${w}%`, background: `linear-gradient(90deg, ${RAMP_CSS})`, backgroundSize: `${100 / Math.max(w, 1) * 100}% 100%` }}
      />
      {marker && (
        <span
          aria-hidden
          className="absolute top-0 h-full w-px bg-bone/45"
          style={{ left: `${BREAK_EVEN * 100}%` }}
        />
      )}
    </div>
  );
}

/** Vertical strip down a card's leading edge: the card's temperature, read
 *  at a glance before any text is. */
export function HeatEdge({ t }: { t: number }) {
  return (
    <span
      aria-hidden
      className="absolute inset-y-0 left-0 w-[3px]"
      style={{
        background: `linear-gradient(180deg, ${heatCss(t, 0.15)}, ${heatCss(t)} 45%, ${heatCss(t, 0.3)})`,
        boxShadow: t > 0.5 ? `0 0 14px ${heatCss(t, 0.5)}` : "none",
      }}
    />
  );
}

/** A formula, set as one. Deliberately not a Tag: the chrome's label voice is
 *  uppercased, and an uppercased equation is unreadable. */
export function Formula({ children, hot = false }: { children: ReactNode; hot?: boolean }) {
  return (
    <code
      className={`block border px-4 py-3 font-mono text-[12px] leading-relaxed ${
        hot ? "border-t70/50 bg-t70/[0.07] text-t92" : "border-seam bg-void text-label"
      }`}
    >
      {children}
    </code>
  );
}

export function Rule({ className = "" }: { className?: string }) {
  return <div className={`seamline ${className}`} aria-hidden />;
}

/** Section heading, stencil kicker over a display line. */
export function Heading({
  kicker,
  children,
  className = "",
}: {
  kicker?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {kicker && <Stencil className="block">{kicker}</Stencil>}
      <h2 className="mt-3 font-display text-3xl font-medium leading-[1.05] tracking-tight text-bone md:text-5xl">
        {children}
      </h2>
    </div>
  );
}

/** Status pip: green for running, amber for throttled, dark for stopped. */
export function Pip({ state }: { state: "run" | "throttle" | "stop" }) {
  const map = {
    run: { c: "#F9960A", label: "running" },
    throttle: { c: "#B92060", label: "throttled" },
    stop: { c: "#39404F", label: "stopped" },
  } as const;
  const { c, label } = map[state];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-[6px] w-[6px] rounded-full ${state !== "stop" ? "animate-breathe" : ""}`}
        style={{ background: c, boxShadow: state !== "stop" ? `0 0 8px ${c}` : "none" }}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Buttons: a machined key. Primary glows because it commits an action. */
export function Key({
  children,
  href,
  onClick,
  tone = "ghost",
  className = "",
  type,
  disabled,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: "hot" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 border px-5 py-3 font-mono text-[11px] uppercase tracking-tag transition-colors duration-200";
  const tones = {
    hot: "border-t70 bg-t70/12 text-t92 hover:bg-t70/22 hover:text-t100",
    ghost: "border-seam text-label hover:border-screw hover:text-bone",
  };
  const cls = `${base} ${tones[tone]} ${disabled ? "pointer-events-none opacity-40" : ""} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} onClick={onClick} className={cls} disabled={disabled}>
      {children}
    </button>
  );
}
