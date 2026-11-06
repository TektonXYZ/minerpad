import ScrollStory from "@/components/ScrollStory";
import Ticker from "@/components/Ticker";
import HeatGrid from "@/components/HeatGrid";
import RigCard from "@/components/RigCard";
import Reveal from "@/components/Reveal";
import Seg from "@/components/Seg";
import { GainBars } from "@/components/charts";
import { Heading, Key, Panel, Rule, Stat, Stencil, Tag } from "@/components/ui";
import { COINS, FLEET, SITE } from "@/lib/data";
import { survey } from "@/lib/mining";
import { heatOf } from "@/lib/mining";
import { hash, hashParts, usd, usdShort, watts } from "@/lib/format";
import { heatCss } from "@/lib/ramp";

/* How much of the pad's headline hashrate comes from the one rig pointed at
   Bitcoin — which is the best argument on the site against ever quoting
   hashrate as an achievement. */
const sha = COINS.filter((c) => c.algo.id === "sha256").reduce((a, c) => a + c.econ.rig.hashrate * c.duty, 0);
const shaShare = (sha / FLEET.hashrate) * 100;

const hot = [...COINS].sort((a, b) => b.econ.rig.edge - a.econ.rig.edge).slice(0, 6);

/* The same $1,000/day of compute budget, priced into every pairing that is
   physically possible. Six of the eight networks are not close. */
const SURVEY = survey(1000);
const best = SURVEY[0];

export default function Home() {
  const fleetHash = hashParts(FLEET.hashrate);
  const gainHeat = heatOf(FLEET.gain);

  return (
    <>
      <ScrollStory />

      <Ticker />

      {/* ---- the floor ------------------------------------------------ */}
      <section className="room border-b border-seam">
        <div className="mx-auto max-w-[1320px] px-4 py-20 md:px-6 md:py-28">
          <Reveal>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <Heading kicker="Floor · live">
                {FLEET.clearing} rigs are paying
                <br />
                for themselves.
              </Heading>
              <p className="max-w-sm font-mono text-[12px] leading-relaxed text-label">
                {FLEET.throttled} are not, and the pad has throttled them down to a floor duty cycle
                rather than spend another dollar of anyone&apos;s fees finding out again.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <Panel className="mt-10 overflow-hidden" screws>
              <div className="sweep relative grid grid-cols-2 gap-px bg-rail md:grid-cols-4">
                <div className="col-span-2 bg-deck p-6 md:p-8">
                  <Stencil>fleet loop gain</Stencil>
                  <div className="mt-4">
                    <Seg value={FLEET.gain.toFixed(2)} unit="x" heat={gainHeat} height={62} label={`Fleet loop gain ${FLEET.gain.toFixed(2)}x`} />
                  </div>
                  <p className="mt-4 max-w-md font-mono text-[11px] leading-relaxed text-dim">
                    Every dollar of fee spent on rent came back as{" "}
                    <span style={{ color: heatCss(gainHeat) }}>{usd(FLEET.gain)}</span> of mined coin, and
                    that coin went into liquidity. Below 1.00 this page would be an apology.
                  </p>
                </div>
                <div className="bg-deck p-6">
                  <Stat
                    label="settled into pools · 24h"
                    value={usdShort(FLEET.minedPerDay)}
                    heat={0.78}
                    sub={`against ${usdShort(FLEET.rentPerDay)} of rent`}
                  />
                  <Rule className="my-5" />
                  <Stat label="all time" value={usdShort(FLEET.minedAllTime)} heat={0.7} sub="mined, then pooled" />
                </div>
                <div className="bg-deck p-6">
                  <Stat
                    label="rented right now"
                    value={`${Math.round(FLEET.units).toLocaleString("en-US")}`}
                    sub={`${watts(FLEET.watts)} · ${FLEET.coins} coins`}
                  />
                  <Rule className="my-5" />
                  <Stat
                    label="combined hashrate"
                    value={`${fleetHash.value} ${fleetHash.unit}`}
                    sub="see the note below"
                  />
                </div>
              </div>
            </Panel>
          </Reveal>

          {/* The honest footnote, given the same weight as the number it
              undercuts. */}
          <Reveal delay={140}>
            <div className="mt-4 flex flex-col gap-3 border border-t55/35 bg-t55/[0.06] p-5 md:flex-row md:items-center md:gap-6">
              <Tag tone="warn">note</Tag>
              <p className="font-mono text-[12px] leading-relaxed text-label">
                {shaShare.toFixed(1)}% of that hashrate is a single coin renting Antminers to mine Bitcoin,
                and it returns twenty cents on the dollar. Hashrate is the number a mining company quotes
                when it does not want to quote the other one.{" "}
                <a href="/loop" className="text-t82 underline decoration-t70/40 underline-offset-2 hover:text-t92">
                  Loop gain is the other one.
                </a>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- the aisle ------------------------------------------------ */}
      <section className="border-b border-seam bg-void">
        <div className="mx-auto max-w-[1320px] px-4 py-20 md:px-6 md:py-28">
          <Reveal>
            <Heading kicker="Aisle · thermal">Every rig the pad is renting.</Heading>
            <p className="mt-4 max-w-xl font-mono text-[12px] leading-relaxed text-label">
              One tile per unit of daily rent. Colour is loop gain, not load — a tile can be working flat
              out and still be cold, which is exactly the failure this view exists to show.
            </p>
          </Reveal>
          <Reveal delay={90} className="mt-10">
            <HeatGrid />
          </Reveal>
        </div>
      </section>

      {/* ---- board ---------------------------------------------------- */}
      <section className="room border-b border-seam">
        <div className="mx-auto max-w-[1320px] px-4 py-20 md:px-6 md:py-28">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <Heading kicker="Board · by edge">Earning the most per day.</Heading>
              <Key href="/farm">All {FLEET.coins} coins →</Key>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hot.map((c, i) => (
              <Reveal key={c.symbol} delay={i * 55}>
                <RigCard c={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- where it closes ------------------------------------------ */}
      <section className="border-b border-seam bg-void">
        <div className="mx-auto max-w-[1320px] px-4 py-20 md:px-6 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,1.05fr)] lg:gap-16">
            <Reveal>
              <Heading kicker="Arithmetic">The loop does not close on Bitcoin.</Heading>
              <div className="mt-6 space-y-4 font-mono text-[13px] leading-relaxed text-label">
                <p>
                  Take $1,000 a day of fee income, spend all of it renting compute at spot, and point that
                  compute at each proof-of-work network in turn. Eight networks, every pairing of silicon
                  that can physically mine them.
                </p>
                <p>
                  Six of the eight are not close. You are bidding against miners who own their hardware
                  outright and buy power by the megawatt, and you are renting from someone who has already
                  priced that in. A rented 4090 on Ethereum Classic returns under two cents on the dollar.
                </p>
                <p className="text-bone">
                  The loop closes in exactly one place: launch-phase networks, small enough that a rack is a
                  real share of them. That is where the pad routes, and the catch is in the same sentence —
                  doing this raises the difficulty you are being paid out of.
                </p>
                <p>
                  There is a second catch, and it is the one nobody mentions. Those networks are small, so a
                  coin that does well outgrows them. {FLEET.saturated} of the {FLEET.clearing} rigs currently
                  clearing have hit the share cap: together they have{" "}
                  <span className="text-bone">{usdShort(FLEET.spillPerDay)} a day</span> of compute budget
                  that no chain on the list can absorb, and it goes into the pools at face value because
                  there is nothing better to do with it.
                </p>
                <p>
                  {best.algo.chain} at today&apos;s difficulty returns{" "}
                  <span style={{ color: heatCss(best.heat) }}>{best.gain.toFixed(2)}x</span> on a{" "}
                  {best.hardware.short}. At its current growth rate that edge is gone in{" "}
                  <span className="text-bone">{best.decayMonths} months</span>.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Key href="/loop" tone="hot">
                  Read the arithmetic
                </Key>
                <Key href="/deploy">Run it on your own numbers</Key>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <Panel className="p-6 md:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <Stencil>$1,000/day of rent, by network</Stencil>
                  <Stencil>loop gain</Stencil>
                </div>
                <Rule className="my-5" />
                <GainBars
                  max={2}
                  rows={SURVEY.filter((r, i) => i === 0 || SURVEY.findIndex((x) => x.algo.id === r.algo.id) === i).map((r) => ({
                    label: `${r.algo.coin} · ${r.hardware.short}`,
                    value: r.gain,
                    heat: r.heat,
                    note: r.gain >= 0.01 ? `${r.gain.toFixed(2)}x` : "<0.01x",
                  }))}
                />
                <Rule className="my-5" />
                <p className="font-mono text-[11px] leading-relaxed text-dim">
                  Best silicon shown per network. The white notch is 1.00x — break-even. Everything left of
                  it is a fee shredder.
                </p>
              </Panel>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- cta ------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-deck">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(70% 120% at 50% 120%, rgba(232,90,28,0.14), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-[1320px] px-4 py-24 text-center md:px-6 md:py-32">
          <Reveal>
            <Stencil>Deploy</Stencil>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-medium leading-[1.04] tracking-tight text-bone md:text-6xl">
              {SITE.tagline}
            </h2>
            <p className="mx-auto mt-5 max-w-lg font-mono text-[13px] leading-relaxed text-label">
              Pick your fee, pick your split, pick your silicon. The configurator will tell you before you
              launch whether your rig is going to pay for itself — including when the answer is no.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Key href="/deploy" tone="hot">
                Configure a rig
              </Key>
              <Key href="/farm">Look at the floor first</Key>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
