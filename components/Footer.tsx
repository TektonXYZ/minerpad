import Mark from "./Mark";
import { Stencil, Rule } from "./ui";
import { SITE, FLEET } from "@/lib/data";
import { hash } from "@/lib/format";

export default function Footer() {
  return (
    <footer className="border-t border-seam bg-deck">
      <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Mark size={24} />
              <span className="font-display text-[15px] font-semibold tracking-tight text-bone">MinerPad</span>
            </div>
            <p className="mt-4 font-mono text-[12px] leading-relaxed text-dim">{SITE.blurb}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <Stencil className="block">Pad</Stencil>
              <ul className="mt-3 space-y-2 font-mono text-[12px] text-label">
                <li><a className="hover:text-bone" href="/farm">The farm</a></li>
                <li><a className="hover:text-bone" href="/deploy">Deploy a coin</a></li>
                <li><a className="hover:text-bone" href="/loop">The loop</a></li>
              </ul>
            </div>
            <div>
              <Stencil className="block">Fleet</Stencil>
              <ul className="mt-3 space-y-2 font-mono text-[12px] text-label">
                <li>{FLEET.coins} coins</li>
                <li>{hash(FLEET.hashrate)}</li>
                <li>{FLEET.clearing} clearing / {FLEET.throttled} throttled</li>
              </ul>
            </div>
            <div>
              <Stencil className="block">Plate</Stencil>
              <ul className="mt-3 space-y-2 font-mono text-[12px] text-dim">
                <li>rev 0.1 · preview</li>
                <li>front end only</li>
                <li>no chain connected</li>
              </ul>
            </div>
          </div>
        </div>

        <Rule className="my-9" />

        {/* The disclosure sits in the chrome, not in a modal, because the
            numbers on this build are a model rather than a measurement. */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl font-mono text-[11px] leading-relaxed text-dim">
            Preview build. Every coin, rig and settlement on this site is a worked example computed by{" "}
            <span className="text-label">lib/mining.ts</span> from published hardware rates and network
            parameters. Nothing here is connected to a chain, no fees are collected, and nothing is for sale.
          </p>
          <Stencil className="shrink-0">© {new Date().getFullYear()} MinerPad</Stencil>
        </div>
      </div>
    </footer>
  );
}
