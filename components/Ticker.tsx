import { SETTLEMENTS } from "@/lib/data";
import { usd, compact, clock } from "@/lib/format";
import { Stencil } from "./ui";

/**
 * Settlements crawling past. Every entry is a payout that left a mining pool
 * and landed in a coin's liquidity, which is the only event on this site that
 * matters. Duplicated once so the marquee can loop seamlessly.
 */
export default function Ticker() {
  const items = SETTLEMENTS.slice(0, 14);
  return (
    <div className="relative overflow-hidden border-y border-seam bg-deck py-2.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-deck to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-deck to-transparent" />
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap will-change-transform">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex gap-8" aria-hidden={dup === 1}>
            {items.map((s) => (
              <span key={`${dup}-${s.id}`} className="flex items-center gap-2.5 font-mono text-[11px]">
                <span className="text-dim">{clock(s.ago)}</span>
                <span className="text-t82">settled</span>
                <span className="tabular-nums text-bone">
                  {compact(s.coinsMined)} {s.ticker}
                </span>
                <span className="text-dim">→</span>
                <span className="text-label">${s.symbol}</span>
                <span className="tabular-nums text-dim">{usd(s.usd)}</span>
                <span className="text-screw">·</span>
                <span className="tabular-nums text-screw">blk {s.height.toLocaleString("en-US")}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">
        <Stencil>Recent settlements from mining pools into coin liquidity.</Stencil>
      </span>
    </div>
  );
}
