import type { CoinView } from "@/lib/data";
import { HeatEdge, Pip, Screws, Stencil } from "./ui";
import Fan from "./Fan";
import Seg from "./Seg";
import { Sparkline } from "./charts";
import { hashParts, usdShort, pct } from "@/lib/format";
import { walk } from "@/lib/series";
import { heatCss } from "@/lib/ramp";

/**
 * One rack unit.
 *
 * Reads top to bottom the way the physical thing does: asset tag, status
 * lamp, the panel readout, then the plate with what is inside it. The only
 * colour on the card is its loop gain.
 */
export default function RigCard({ c }: { c: CoinView }) {
  const heat = c.econ.rig.heat;
  const hp = hashParts(c.econ.rig.hashrate * c.duty);
  const series = walk(`${c.symbol}:hash`, 40, 1, 0.06, 0.3);

  return (
    <a
      href={`/rig/${c.symbol.toLowerCase()}`}
      className="panel group relative block overflow-hidden transition-colors duration-300 hover:border-screw"
    >
      <HeatEdge t={heat} />
      <Screws inset={6} />

      <div className="pl-5 pr-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Pip state={c.clears ? "run" : "throttle"} />
              <span className="font-display text-[17px] font-semibold leading-none tracking-tight text-bone">
                ${c.symbol}
              </span>
            </div>
            <p className="mt-1.5 truncate font-mono text-[11px] text-dim">{c.tagline}</p>
          </div>
          <Fan rpm={c.rpm} size={30} heat={heat} className="shrink-0 opacity-80" />
        </div>

        <div className="mt-4 flex items-end gap-3">
          <Seg
            value={hp.value}
            unit={hp.unit}
            heat={heat}
            height={26}
            label={`${c.symbol} hashrate ${hp.value} ${hp.unit}`}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Sparkline points={series} w={104} h={22} heat={heat} className="opacity-70" />
          <span className="font-mono text-[11px] tabular-nums" style={{ color: c.change >= 0 ? "#F9960A" : "#5D6574" }}>
            {pct(c.change)}
          </span>
        </div>
      </div>

      {/* the plate: what is actually rented, and what it is pointed at */}
      <div className="mt-4 vent h-2 opacity-40" aria-hidden />
      <div className="grid grid-cols-3 gap-px border-t border-rail bg-rail">
        <Cell label="silicon" value={c.hardware.short} />
        <Cell label="mining" value={c.algo.coin} />
        <Cell
          label="loop gain"
          value={`${c.econ.rig.gain.toFixed(2)}x`}
          color={heatCss(Math.max(heat, 0.34))}
        />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-rail bg-deck px-4 py-2.5">
        <Stencil>pool {usdShort(c.pool)}</Stencil>
        <Stencil className="group-hover:text-label">
          {c.econ.rig.saturated
            ? `capped · ${usdShort(c.econ.rig.spill)}/day spilled`
            : c.clears
              ? `+${usdShort(c.econ.rig.edge)}/day`
              : "throttled"}
        </Stencil>
      </div>
    </a>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-deck px-3 py-2.5">
      <Stencil className="block !text-[9px]">{label}</Stencil>
      <div className="mt-1 truncate font-mono text-[12px] tabular-nums" style={{ color: color ?? "#E6E9EF" }}>
        {value}
      </div>
    </div>
  );
}
