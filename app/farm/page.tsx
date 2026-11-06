import type { Metadata } from "next";
import Board from "@/components/Board";
import HeatGrid from "@/components/HeatGrid";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import { Heading, Panel, Stat, Stencil } from "@/components/ui";
import { COINS, FLEET } from "@/lib/data";
import { hash, usd, usdShort, watts } from "@/lib/format";
import { MAX_SHARE, heatOf } from "@/lib/mining";

export const metadata: Metadata = {
  title: "The farm",
  description:
    "Every coin on MinerPad, the silicon its fees are renting, what that silicon is mining, and whether the rig is paying for itself.",
};

export default function Farm() {
  return (
    <>
      <section className="room border-b border-seam pt-24">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <Reveal>
            <Heading kicker="Farm">The floor.</Heading>
            <p className="mt-4 max-w-2xl font-mono text-[13px] leading-relaxed text-label">
              {FLEET.coins} coins, each renting compute out of its own trading fees. The only column that
              settles an argument is loop gain: mined value divided by rent paid. Above 1.00 the rig is
              adding liquidity the pool would not otherwise have. Below it, the rig is a hole.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <Panel className="mt-10 grid grid-cols-2 gap-px bg-rail md:grid-cols-4" screws>
              <div className="bg-deck p-5">
                <Stat label="fleet loop gain" value={`${FLEET.gain.toFixed(2)}x`} heat={heatOf(FLEET.gain)} size="lg" />
              </div>
              <div className="bg-deck p-5">
                <Stat label="into pools / day" value={usdShort(FLEET.minedPerDay)} heat={0.76} sub={`rent ${usd(FLEET.rentPerDay, 0)}`} size="lg" />
              </div>
              <div className="bg-deck p-5">
                <Stat label="hashrate" value={hash(FLEET.hashrate)} sub={watts(FLEET.watts)} size="lg" />
              </div>
              <div className="bg-deck p-5">
                {/* Deliberately not on the ramp: a count is not a loop gain,
                    and heat on this site always means one specific thing. */}
                <Stat label="clearing" value={`${FLEET.clearing}/${FLEET.coins}`} sub={`${FLEET.throttled} throttled`} size="lg" />
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>

      <Ticker />

      <section className="bg-void">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <Reveal>
            <div className="mb-8">
              <Stencil>Aisle</Stencil>
            </div>
            <HeatGrid />
          </Reveal>
        </div>
      </section>

      <section className="room border-t border-seam">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          {FLEET.saturated > 1 && (
            <p className="mb-6 max-w-3xl border-l-2 border-t70/50 pl-4 font-mono text-[11px] leading-relaxed text-dim">
              Several rows report the same hashrate and the same daily proceeds. That is the share cap, not a
              bug: once a rig is capped it holds exactly {(MAX_SHARE * 100).toFixed(0)}% of its chain, so every
              capped rig on the same chain mines the same slice and the only thing that differs is what it paid
              to get there.{" "}
              <a href="/loop" className="text-label underline decoration-seam underline-offset-2 hover:text-bone">
                The model does not have them competing with each other, which is a real limitation.
              </a>
            </p>
          )}
          <Board coins={COINS} />
        </div>
      </section>
    </>
  );
}
