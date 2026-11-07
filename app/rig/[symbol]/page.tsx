import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Fan from "@/components/Fan";
import Seg from "@/components/Seg";
import Reveal from "@/components/Reveal";
import { PoolChart, Sparkline, GainBars } from "@/components/charts";
import { HeatBar, Heading, Key, Panel, Pip, Rule, Stat, Stencil, Tag } from "@/components/ui";
import { COINS, bySymbol } from "@/lib/data";
import { survey } from "@/lib/mining";
import { compact, duration, hash, hashParts, pct, usd, usdShort, watts, clock } from "@/lib/format";
import { walk, cumulative, band } from "@/lib/series";
import { heatCss } from "@/lib/ramp";
import { SETTLEMENTS } from "@/lib/data";

export function generateStaticParams() {
  return COINS.map((c) => ({ symbol: c.symbol.toLowerCase() }));
}

export function generateMetadata({ params }: { params: { symbol: string } }): Metadata {
  const c = bySymbol(params.symbol);
  if (!c) return { title: "Rig not found" };
  return {
    title: `$${c.symbol} · ${c.hardware.short} → ${c.algo.coin}`,
    description: `${c.name}: ${usd(c.econ.rig.cost * c.duty, 0)} a day of rented ${c.hardware.short} mining ${c.algo.chain}, returning ${c.econ.rig.gain.toFixed(2)}x into the pool.`,
  };
}

export default function Rig({ params }: { params: { symbol: string } }) {
  const c = bySymbol(params.symbol);
  if (!c) notFound();

  const heat = c.econ.rig.heat;
  const hp = hashParts(c.econ.rig.hashrate * c.duty);
  const hours = 48;
  const hashSeries = walk(`${c.symbol}:hash48`, hours, c.econ.rig.hashrate * c.duty, 0.05, 0.3);
  const tempSeries = band(`${c.symbol}:temp`, hours, c.tempC, 2.1);
  const days = 60;
  const minedSeries = cumulative(`${c.symbol}:mined`, days, c.minedTotal);
  const directSeries = cumulative(`${c.symbol}:direct`, days, c.econ.directUsdPerDay * (c.age / 24) * 0.7);
  const feed = SETTLEMENTS.filter((s) => s.symbol === c.symbol).slice(0, 8);

  /* What the same compute budget would have earned elsewhere. The point of
     showing it on a coin's own page is that it is frequently unflattering. */
  const alt = survey(c.econ.computeUsdPerDay).slice(0, 6);

  return (
    <>
      {/* ---- head plate ------------------------------------------------ */}
      <section className="room border-b border-seam pt-24">
        <div className="mx-auto max-w-[1320px] px-4 py-12 md:px-6 md:py-16">
          <a href="/farm" className="font-mono text-[11px] text-dim hover:text-label">
            ← farm
          </a>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <Pip state={c.clears ? "run" : "throttle"} />
                <h1 className="font-display text-4xl font-semibold tracking-tight text-bone md:text-6xl">
                  ${c.symbol}
                </h1>
                <Tag tone={c.clears ? "hot" : "warn"}>{c.clears ? "clearing" : "throttled"}</Tag>
              </div>
              <p className="mt-3 font-mono text-[13px] text-label">
                {c.name} — {c.tagline}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Tag>{c.hardware.short}</Tag>
                <span className="text-screw">→</span>
                <Tag>{c.algo.name}</Tag>
                <Tag>{c.algo.chain}</Tag>
                <Tag>{(c.feeBps / 100).toFixed(2)}% fee</Tag>
                <Tag>{Math.round(c.age / 24)}d old</Tag>
              </div>
            </div>

            <Panel className="shrink-0 p-6" screws>
              <div className="flex items-center justify-between gap-8">
                <Stencil>hashrate</Stencil>
                <Fan rpm={c.rpm} size={34} heat={heat} />
              </div>
              <div className="mt-4">
                <Seg value={hp.value} unit={hp.unit} heat={heat} height={44} label={`hashrate ${hp.value} ${hp.unit}`} />
              </div>
              <Rule className="my-5" />
              <div className="grid grid-cols-3 gap-5">
                <Stat label="temp" value={`${c.tempC.toFixed(0)}°`} heat={heat} size="sm" />
                <Stat label="fan" value={`${c.rpm}`} sub="rpm" size="sm" />
                <Stat label="duty" value={`${(c.duty * 100).toFixed(0)}%`} size="sm" />
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* ---- the verdict ------------------------------------------------ */}
      <section className="border-b border-seam bg-void">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <Reveal>
            <Panel className="overflow-hidden" screws>
              <div className="sweep relative grid gap-px bg-rail md:grid-cols-[1.3fr_1fr_1fr_1fr]">
                <div className="bg-deck p-7">
                  <Stencil>loop gain</Stencil>
                  <div className="mt-4">
                    <Seg value={c.econ.rig.gain.toFixed(2)} unit="x" heat={heat} height={56} label={`loop gain ${c.econ.rig.gain.toFixed(2)}`} />
                  </div>
                  <HeatBar t={heat} height={5} className="mt-5" marker />
                  <p className="mt-4 font-mono text-[11px] leading-relaxed text-dim">
                    {c.clears
                      ? `Every dollar of fee spent on rent comes back as ${usd(c.econ.rig.gain)} of ${c.algo.coin}. The pad runs this rig flat out.`
                      : `This rig loses money. Every dollar of fee spent on rent returns ${usd(c.econ.rig.gain)} of ${c.algo.coin}, so the pad throttles it to ${(c.duty * 100).toFixed(0)}% rather than keep shredding holders' fees on it.`}
                  </p>
                </div>
                <div className="bg-deck p-7">
                  <Stat label="rent / day" value={usd(c.econ.rig.cost * c.duty, 0)} sub={`${Math.round(c.econ.rig.units * c.duty).toLocaleString("en-US")} units · ${watts(c.econ.rig.watts * c.duty)}`} />
                  <Rule className="my-5" />
                  <Stat label="mined / day" value={usd(c.econ.rig.revenue * c.duty, 0)} heat={heat} sub={`${compact(c.econ.rig.coins * c.duty)} ${c.algo.coin}`} />
                </div>
                <div className="bg-deck p-7">
                  <Stat
                    label="net into pool / day"
                    value={usd(c.econ.rig.edge * c.duty, 0)}
                    heat={c.clears ? 0.8 : 0.2}
                    sub={c.clears ? "above what the fee alone would add" : "below it"}
                  />
                  <Rule className="my-5" />
                  <Stat label="pool depth" value={usdShort(c.pool)} sub={`${pct((c.minedTotal / c.pool) * 100)} of it mined`} />
                </div>
                <div className="bg-deck p-7">
                  <Stat
                    label="edge half-life"
                    value={c.econ.rig.decayMonths === Infinity ? "—" : `${c.econ.rig.decayMonths} mo`}
                    sub={`${(c.algo.drift * 100).toFixed(0)}% difficulty growth / yr`}
                  />
                  <Rule className="my-5" />
                  <Stat
                    label="share of network"
                    value={`${(c.econ.rig.share * 100).toFixed(c.econ.rig.share > 0.01 ? 1 : 3)}%`}
                    sub={c.econ.rig.saturated ? "at the cap" : `solo block ${duration(c.econ.rig.soloHours)}`}
                  />
                </div>
              </div>
            </Panel>
          </Reveal>

          {c.econ.rig.saturated && (
            <Reveal delay={60}>
              <div className="mt-4 flex flex-col gap-3 border border-t82/35 bg-t82/[0.06] p-5 md:flex-row md:items-center md:gap-6">
                <Tag tone="hot">capped</Tag>
                <p className="font-mono text-[12px] leading-relaxed text-label">
                  ${c.symbol} is too big for {c.algo.chain}. Its compute budget is{" "}
                  {usd(c.econ.computeUsdPerDay, 0)} a day, but the rig hits{" "}
                  {(c.econ.rig.share * 100).toFixed(0)}% of the network at {usd(c.econ.rig.cost, 0)} — past
                  that it would be mining against itself. The remaining{" "}
                  <span className="text-t92">{usd(c.econ.rig.spill, 0)} a day</span> is routed straight into
                  the pool instead, which is worth exactly its face value and not a cent more.
                </p>
              </div>
            </Reveal>
          )}

          <Reveal delay={80}>
            <div className="mt-4 border border-seam bg-deck p-5">
              <p className="font-mono text-[12px] leading-relaxed text-label">
                <span className="text-dim">{c.algo.chain}: </span>
                {c.algo.note}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- charts ------------------------------------------------------ */}
      <section className="room border-b border-seam">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Reveal>
              <Panel className="h-full p-6 md:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <Heading kicker="Pool · 60 days" className="!mt-0">
                    <span className="!text-2xl md:!text-3xl">Where the liquidity came from</span>
                  </Heading>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-tag text-dim">
                      <span className="h-[2px] w-4 bg-screw" /> routed
                    </span>
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-tag text-t82">
                      <span className="h-[2px] w-4 bg-t82" /> mined
                    </span>
                  </div>
                </div>
                <div className="mt-8">
                  <PoolChart
                    direct={directSeries}
                    mined={minedSeries}
                    label={`Pool growth for ${c.symbol}: routed fees versus mined proceeds over 60 days`}
                  />
                </div>
                <Rule className="my-6" />
                <div className="grid grid-cols-3 gap-6">
                  <Stat label="mined all time" value={usdShort(c.minedTotal)} heat={heat} size="sm" />
                  <Stat label="rent all time" value={usdShort(c.spentTotal)} size="sm" />
                  <Stat
                    label="net"
                    value={usdShort(c.minedTotal - c.spentTotal)}
                    heat={c.minedTotal > c.spentTotal ? 0.78 : 0.18}
                    size="sm"
                  />
                </div>
              </Panel>
            </Reveal>

            <Reveal delay={90}>
              <Panel className="h-full p-6 md:p-8">
                <Stencil>48 hours</Stencil>
                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[11px] text-dim">hashrate</span>
                    <span className="font-mono text-[11px] tabular-nums" style={{ color: heatCss(heat) }}>
                      {hash(c.econ.rig.hashrate * c.duty)}
                    </span>
                  </div>
                  <Sparkline points={hashSeries} w={320} h={64} heat={heat} className="mt-2 w-full" />
                </div>
                <Rule className="my-6" />
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[11px] text-dim">die temperature</span>
                    <span className="font-mono text-[11px] tabular-nums" style={{ color: heatCss(heat) }}>
                      {c.tempC.toFixed(1)}°C
                    </span>
                  </div>
                  <Sparkline points={tempSeries} w={320} h={64} heat={heat} className="mt-2 w-full" />
                </div>
                <Rule className="my-6" />
                <Stencil className="block">hardware</Stencil>
                <p className="mt-3 font-mono text-[12px] leading-relaxed text-label">
                  {c.hardware.name}
                  <br />
                  <span className="text-dim">{c.hardware.spec}</span>
                  <br />
                  <span className="text-dim">
                    {usd(c.hardware.rate)}/hr · {watts(c.hardware.watts)} each
                  </span>
                </p>
              </Panel>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- alternatives + feed ----------------------------------------- */}
      <section className="border-b border-seam bg-void">
        <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-6 md:py-20">
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <Panel className="h-full p-6 md:p-8">
                <Stencil>the same {usd(c.econ.computeUsdPerDay, 0)}/day, elsewhere</Stencil>
                <div className="mt-6">
                  <GainBars
                    max={2}
                    rows={alt.map((r) => ({
                      label: `${r.algo.coin} · ${r.hardware.short}`,
                      value: r.gain,
                      heat: r.heat,
                      note: r.gain >= 0.01 ? `${r.gain.toFixed(2)}x` : "<0.01x",
                    }))}
                  />
                </div>
                <Rule className="my-6" />
                <p className="font-mono text-[11px] leading-relaxed text-dim">
                  {alt[0].algo.id === c.algo.id && alt[0].hardware.id === c.hardware.id
                    ? "This rig is already on the best pairing available to it."
                    : `${alt[0].algo.coin} on ${alt[0].hardware.short} would return ${alt[0].gain.toFixed(2)}x instead of ${c.econ.rig.gain.toFixed(2)}x. Switching costs nothing but a restart.`}
                </p>
              </Panel>
            </Reveal>

            <Reveal delay={90}>
              <Panel className="h-full p-6 md:p-8">
                <Stencil>settlements</Stencil>
                {feed.length ? (
                  <ul className="mt-5 divide-y divide-rail">
                    {feed.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                        <span className="font-mono text-[11px] text-dim">{clock(s.ago)}</span>
                        <span className="flex-1 font-mono text-[12px] tabular-nums text-bone">
                          {compact(s.coinsMined)} {s.ticker}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-dim">blk {s.height.toLocaleString("en-US")}</span>
                        <span className="font-mono text-[12px] tabular-nums" style={{ color: heatCss(heat) }}>
                          {usd(s.usd)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 font-mono text-[12px] leading-relaxed text-dim">
                    Nothing recent. At {(c.duty * 100).toFixed(0)}% duty this rig produces{" "}
                    {usd(c.econ.rig.revenue * c.duty)} a day, so payouts batch into infrequent settlements
                    rather than a stream.
                  </p>
                )}
                <Rule className="my-6" />
                <div className="flex flex-wrap gap-3">
                  <Key href="/deploy" tone="hot">
                    Configure your own
                  </Key>
                  <Key href="/loop">How this is calculated</Key>
                </div>
              </Panel>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
