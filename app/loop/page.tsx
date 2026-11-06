import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { GainBars } from "@/components/charts";
import { Formula, Heading, Key, Panel, Rule, Stat, Stencil } from "@/components/ui";
import { ALGOS, HARDWARE, MAX_SHARE, networkEmissionUsd, survey } from "@/lib/mining";
import { FLEET } from "@/lib/data";
import { hash, usd, usdShort, watts } from "@/lib/format";
import { heatCss } from "@/lib/ramp";

export const metadata: Metadata = {
  title: "The loop",
  description:
    "How a coin's trading fees rent compute, what that compute earns, and the arithmetic that decides whether any of it was worth doing.",
};

const STEPS = [
  {
    n: "01",
    t: "A trade pays a fee",
    b: "Every buy and sell on the coin pays a fee in basis points. Nothing unusual so far — this is how every launchpad works.",
  },
  {
    n: "02",
    t: "The fee is split three ways",
    b: "A share rents compute, a share goes straight into the pool with no rig involved, a share goes to whoever launched the coin. The middle share is the control group: it is what the rig has to beat.",
  },
  {
    n: "03",
    t: "The compute share rents silicon by the hour",
    b: "Spot idle capacity, billed hourly, no commitment. That is the only reason this is possible at all — a coin cannot sign a power contract, but it can rent a card for an hour.",
  },
  {
    n: "04",
    t: "The silicon mines, and the payout is sold",
    b: "The rig points at a proof-of-work network, joins a pool, and earns a share proportional to its hashrate. The mined coin is not the launched coin, so it gets sold.",
  },
  {
    n: "05",
    t: "The proceeds go into the pool",
    b: "Into liquidity, not into a treasury. Deeper pool, tighter spread, more trade, a bigger fee next time. That is the loop, and it runs only while step four out-earns step three.",
  },
];

const SURVEY = survey(1000);
const firstPerAlgo = SURVEY.filter((r, i) => SURVEY.findIndex((x) => x.algo.id === r.algo.id) === i);
const clearing = firstPerAlgo.filter((r) => r.gain >= 1);

/* Hoisted so the heading can count them rather than hard-coding a number
   that goes stale the moment one is added. */
const FAILURES: { t: string; b: string }[] = [
{
                t: "Difficulty finds you",
                b: `The two networks where this works are the two that are easiest to flood. Pyrin's difficulty is growing at ${(ALGOS.find((a) => a.id === "pyrinhash")!.drift * 100).toFixed(0)}% a year, largely because of people doing exactly this. Today's ${SURVEY[0].gain.toFixed(2)}x is gone in ${SURVEY[0].decayMonths} months at that rate.`,
              },
              {
                t: "You are long an asset you did not pick",
                b: "Between mining a coin and selling it, you hold it. A rig that clears on paper can settle less than it earned because the thing it mined fell while it was being mined.",
              },
              {
                t: "Rent is a market too",
                b: "Spot compute is cheap because it is idle. The moment it is not idle — a model release, a render deadline, a bull market — the rate moves against you and the margin goes first.",
              },
              {
                t: "The fee has to exist",
                b: "No volume, no fee, no rent, no rig. This does not manufacture liquidity out of nothing; it converts trading activity into liquidity at a rate that is sometimes above one and often below it.",
              },
              {
                t: "A fee is still a fee",
                b: "Holders pay for all of this on every trade. The rig has to beat routing that same fee straight into the pool, not beat zero. That is a much higher bar and most configurations miss it.",
              },
              {
                t: "Success breaks it",
                b: `The networks where the loop closes are small, which is the whole reason it closes. A coin that trades well outgrows them: ${FLEET.saturated} rigs on this board already sit at the ${(MAX_SHARE * 100).toFixed(0)}% share cap with ${usdShort(FLEET.spillPerDay)} a day of compute budget nothing can absorb. Past the cap you are your own difficulty and your own sell pressure.`,
              },
              {
                t: "The throttle is load-bearing",
                b: `${FLEET.throttled} of ${FLEET.coins} rigs on this board are switched down because their arithmetic failed. A version of this product without a throttle would quietly shred fees forever.`,
              },
];

export default function Loop() {
  return (
    <>
      <section className="room border-b border-seam pt-24">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <Reveal>
            <Heading kicker="Mechanics">Trade, rent, hash, settle, repeat.</Heading>
            <p className="mt-5 max-w-2xl font-mono text-[13px] leading-relaxed text-label">
              This page is the argument, with the inputs left in. If you think a number below is wrong,
              change it in your head and the conclusion moves with you — that is the point of showing it
              this way rather than quoting a headline APY.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px border border-seam bg-rail md:grid-cols-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <div className="h-full bg-deck p-6">
                  <span
                    className="font-mono text-[11px] tabular-nums"
                    style={{ color: heatCss(0.35 + i * 0.16) }}
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-3 font-display text-[17px] font-medium leading-snug text-bone">{s.t}</h3>
                  <p className="mt-3 font-mono text-[11px] leading-relaxed text-dim">{s.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- the formula ------------------------------------------------ */}
      <section className="border-b border-seam bg-void">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <Reveal>
              <Heading kicker="Formula">Three lines decide everything.</Heading>
              <p className="mt-5 font-mono text-[13px] leading-relaxed text-label">
                Pool mining pays proportionally, so expected revenue is just your share of the network times
                what the network pays out. There is no edge hiding in here and no strategy to be clever
                about. You either have a meaningful fraction of a chain&apos;s hashrate or you do not.
              </p>
              <div className="mt-8 space-y-2">
                <Formula>revenue/day = (hashrate ÷ network) × (86400 ÷ block seconds) × reward × price</Formula>
                <Formula>cost/day = units × rate/hr × 24</Formula>
                <Formula hot>loop gain = revenue ÷ cost</Formula>
              </div>
              <p className="mt-8 font-mono text-[13px] leading-relaxed text-label">
                Loop gain above 1.00 means the rig sent more into the pool than the fee that paid for it
                would have. Below 1.00 the rig destroyed value that belonged to holders, and the honest
                response is to switch it off — which is what the pad&apos;s throttle does.
              </p>
            </Reveal>

            <Reveal delay={90}>
              <Panel className="p-6 md:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <Stencil>$1,000/day of rent, every network</Stencil>
                  <Stencil>loop gain</Stencil>
                </div>
                <Rule className="my-6" />
                <GainBars
                  max={2}
                  rows={firstPerAlgo.map((r) => ({
                    label: `${r.algo.coin} · ${r.hardware.short}`,
                    value: r.gain,
                    heat: r.heat,
                    note: r.gain >= 0.01 ? `${r.gain.toFixed(2)}x` : "<0.01x",
                  }))}
                />
                <Rule className="my-6" />
                <p className="font-mono text-[12px] leading-relaxed text-label">
                  {clearing.length} of {firstPerAlgo.length} networks clear, and both of them are
                  launch-phase chains small enough that a rack is a real share of them. Every mature network
                  on the list returns under a quarter of what it costs to rent into it.
                </p>
                <p className="mt-4 font-mono text-[12px] leading-relaxed text-dim">
                  Revenue counts self-dilution — your own hashrate is part of the network you are taking a
                  share of — and the pad stops renting at {(MAX_SHARE * 100).toFixed(0)}% of a chain. Budget
                  above that is routed to the pool untouched, because past the cap you are bidding against
                  yourself and selling into a market you have become the supply side of.
                </p>
              </Panel>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- assumptions ------------------------------------------------ */}
      <section className="room border-b border-seam">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <Reveal>
            <Heading kicker="Inputs">Every number this site stands on.</Heading>
            <p className="mt-4 max-w-2xl font-mono text-[13px] leading-relaxed text-label">
              Hardware rates are spot idle-capacity pricing. Network parameters are published chain values.
              Both move constantly; these are a snapshot, and the model is only as good as they are.
            </p>
          </Reveal>

          <Reveal delay={70}>
            <div className="mt-10 overflow-x-auto border border-seam">
              <table className="w-full min-w-[780px] border-collapse">
                <caption className="sr-only">Rented hardware: specification, power, spot rate and hashrate by algorithm</caption>
                <thead>
                  <tr className="bg-rack">
                    <th scope="col" className="px-4 py-3 text-left"><Stencil>silicon</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-left"><Stencil>spec</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-right"><Stencil>power</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-right"><Stencil>spot</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-right"><Stencil>best hashrate</Stencil></th>
                  </tr>
                </thead>
                <tbody>
                  {HARDWARE.map((h) => {
                    const top = Object.entries(h.rates).sort((a, b) => b[1] - a[1])[0];
                    const algo = ALGOS.find((a) => a.id === top?.[0]);
                    return (
                      <tr key={h.id} className="border-t border-rail">
                        <th scope="row" className="px-4 py-3 text-left font-mono text-[12px] font-normal text-bone">
                          {h.short}
                        </th>
                        <td className="px-4 py-3 font-mono text-[11px] text-dim">{h.spec}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-label">{watts(h.watts)}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-label">{usd(h.rate)}/hr</td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-label">
                          {hash(top?.[1] ?? 0)} <span className="text-dim">{algo?.name}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={110}>
            <div className="mt-4 overflow-x-auto border border-seam">
              <table className="w-full min-w-[880px] border-collapse">
                <caption className="sr-only">Proof-of-work networks: hashrate, reward, block time, price, daily emission and difficulty growth</caption>
                <thead>
                  <tr className="bg-rack">
                    <th scope="col" className="px-4 py-3 text-left"><Stencil>network</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-left"><Stencil>algo</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-right"><Stencil>hashrate</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-right"><Stencil>reward</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-right"><Stencil>block</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-right"><Stencil>price</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-right"><Stencil>emission/day</Stencil></th>
                    <th scope="col" className="px-4 py-3 text-right"><Stencil>difficulty/yr</Stencil></th>
                  </tr>
                </thead>
                <tbody>
                  {ALGOS.map((a) => (
                    <tr key={a.id} className="border-t border-rail">
                      <th scope="row" className="px-4 py-3 text-left font-normal">
                        <span className="font-mono text-[12px] text-bone">{a.chain}</span>
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-tag" style={{ color: a.phase === "launch" ? "#F9960A" : "#5D6574" }}>
                          {a.phase}
                        </span>
                      </th>
                      <td className="px-4 py-3 font-mono text-[11px] text-dim">{a.name}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-label">{hash(a.network)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-label">{a.reward} {a.coin}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-label">{a.blockSeconds}s</td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-label">{usd(a.price)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-label">{usdShort(networkEmissionUsd(a))}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums" style={{ color: a.drift > 1 ? "#B92060" : "#5D6574" }}>
                        +{(a.drift * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- what goes wrong -------------------------------------------- */}
      <section className="border-b border-seam bg-void">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <Reveal>
            <Heading kicker="Failure modes">{FAILURES.length} ways this stops working.</Heading>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FAILURES.map((f, i) => (
              <Reveal key={f.t} delay={i * 50}>
                <Panel className="h-full p-6">
                  <h3 className="font-display text-[17px] font-medium leading-snug text-bone">{f.t}</h3>
                  <p className="mt-3 font-mono text-[11px] leading-relaxed text-dim">{f.b}</p>
                </Panel>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- what this build is ------------------------------------------ */}
      <section className="room">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <Reveal>
            <Panel className="p-7 md:p-10" screws>
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <Stencil>Status</Stencil>
                  <h2 className="mt-3 font-display text-2xl font-medium leading-snug text-bone md:text-3xl">
                    This is a front end. Nothing here is on a chain.
                  </h2>
                  <p className="mt-4 max-w-2xl font-mono text-[12px] leading-relaxed text-label">
                    There is no contract, no wallet connection, no fee being collected and no rig being
                    rented. The coins on the board are worked examples; the engine that computes them is
                    real code and the hardware and network figures are the published ones. What is missing
                    is everything that would make it actually settle.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Key href="/deploy" tone="hot">Run your own numbers</Key>
                    <Key href="/farm">See the board</Key>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 md:grid-cols-1">
                  <Stat label="fleet loop gain" value={`${FLEET.gain.toFixed(2)}x`} heat={0.72} />
                  <Stat label="modelled, not measured" value={`${FLEET.coins} coins`} />
                </div>
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>
    </>
  );
}
