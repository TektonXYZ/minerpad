"use client";

import { useMemo, useState } from "react";
import Seg from "./Seg";
import Fan from "./Fan";
import { HeatBar, Key, Panel, Rule, Screws, Stat, Stencil, Tag } from "./ui";
import { GainBars } from "./charts";
import { ALGOS, HARDWARE, MAX_SHARE, economics, survey } from "@/lib/mining";
import type { Hardware } from "@/lib/mining";
import { duration, hash, hashParts, usd, usdShort, watts, compact } from "@/lib/format";
import { heatCss } from "@/lib/ramp";

/**
 * The configurator.
 *
 * It is a launch form on the left and a verdict on the right, and the verdict
 * is allowed to say no. Most fee-funded rigs lose money; a form that hides
 * that until after the launch would be the dishonest version of this product.
 *
 * Everything on the right recomputes from lib/mining.ts on every keystroke,
 * including the worked arithmetic at the bottom, which shows the substitution
 * rather than the answer.
 */

const FIELD =
  "w-full border border-seam bg-void px-3 py-2.5 font-mono text-[13px] text-bone outline-none transition-colors placeholder:text-screw focus:border-t70";

export default function DeployForm() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [volume, setVolume] = useState(250_000);
  const [feeBps, setFeeBps] = useState(250);
  const [compute, setCompute] = useState(70);
  const [creator, setCreator] = useState(10);
  const [hwId, setHwId] = useState("rtx4090");
  const [algoId, setAlgoId] = useState("pyrinhash");

  const pool = Math.max(0, 100 - compute - creator);
  const hardware = HARDWARE.find((h) => h.id === hwId)!;
  const algo = ALGOS.find((a) => a.id === algoId)!;

  /* Silicon and algorithm have to be compatible; changing the card can
     invalidate the network, so the picker repairs itself. */
  const validAlgos = useMemo(() => ALGOS.filter((a) => a.silicon.includes(hardware.kind) && hardware.rates[a.id]), [hardware]);
  const effectiveAlgo = validAlgos.some((a) => a.id === algo.id) ? algo : validAlgos[0];

  const econ = useMemo(
    () => economics(volume, feeBps, { compute, pool, creator }, hardware, effectiveAlgo),
    [volume, feeBps, compute, pool, creator, hardware, effectiveAlgo],
  );

  const alternatives = useMemo(() => survey(econ.computeUsdPerDay).slice(0, 6), [econ.computeUsdPerDay]);
  const best = alternatives[0];
  const onBest = best && best.algo.id === effectiveAlgo.id && best.hardware.id === hardware.id;

  const rig = econ.rig;
  const heat = rig.heat;
  const hp = hashParts(rig.hashrate);
  const ticker = symbol.trim().toUpperCase() || "YOURCOIN";

  const pickHardware = (h: Hardware) => {
    setHwId(h.id);
    const still = ALGOS.find((a) => a.id === algoId && a.silicon.includes(h.kind) && h.rates[a.id]);
    if (!still) {
      const first = ALGOS.find((a) => a.silicon.includes(h.kind) && h.rates[a.id]);
      if (first) setAlgoId(first.id);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-start">
      {/* ---------------- form ---------------- */}
      <div className="space-y-4">
        <Panel className="p-6 md:p-8" screws>
          <Stencil>01 · the coin</Stencil>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="stencil block">name</span>
              <input
                className={`${FIELD} mt-2`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Heat Death"
                maxLength={28}
              />
            </label>
            <label className="block">
              <span className="stencil block">ticker</span>
              <input
                className={`${FIELD} mt-2 uppercase`}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 8))}
                placeholder="HEAT"
              />
            </label>
          </div>
        </Panel>

        <Panel className="p-6 md:p-8" screws>
          <Stencil>02 · the fee</Stencil>

          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <span className="stencil">expected volume / day</span>
              <span className="font-mono text-[13px] tabular-nums text-bone">{usdShort(volume)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(Math.sqrt(volume / 5_000_000) * 100)}
              onChange={(e) => setVolume(Math.round(((+e.target.value / 100) ** 2) * 5_000_000 / 1000) * 1000)}
              className="mt-2"
              aria-label="Expected daily trading volume"
            />
            <p className="mt-1 font-mono text-[10px] text-dim">
              This is the one number you are guessing at. Everything below follows from it.
            </p>
          </div>

          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <span className="stencil">trading fee</span>
              <span className="font-mono text-[13px] tabular-nums text-bone">
                {(feeBps / 100).toFixed(2)}% · {usd(econ.feeUsdPerDay, 0)}/day
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={600}
              step={10}
              value={feeBps}
              onChange={(e) => setFeeBps(+e.target.value)}
              className="mt-2"
              aria-label="Trading fee in basis points"
            />
          </div>
        </Panel>

        <Panel className="p-6 md:p-8" screws>
          <Stencil>03 · the split</Stencil>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-dim">
            Where each fee dollar goes. Compute buys rig-hours, pool goes straight into liquidity with no
            rig involved, creator is yours. The rig is only worth using if it beats routing to the pool.
          </p>

          <div className="mt-6 flex h-8 w-full overflow-hidden border border-seam">
            <span className="h-full" style={{ width: `${compute}%`, background: heatCss(0.72) }} />
            <span className="h-full bg-screw" style={{ width: `${pool}%` }} />
            <span className="h-full bg-rail" style={{ width: `${creator}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-3 font-mono text-[10px] uppercase tracking-tag">
            <span className="text-t82">compute {compute}%</span>
            <span className="text-center text-label">pool {pool}%</span>
            <span className="text-right text-dim">creator {creator}%</span>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="stencil">to compute — {usd(econ.computeUsdPerDay, 0)}/day</span>
              <input
                type="range"
                min={0}
                max={100 - creator}
                value={compute}
                onChange={(e) => setCompute(+e.target.value)}
                className="mt-2"
                aria-label="Share of fee spent renting compute"
              />
            </label>
            <label className="block">
              <span className="stencil">to creator — {usd(econ.creatorUsdPerDay, 0)}/day</span>
              <input
                type="range"
                min={0}
                max={30}
                value={creator}
                onChange={(e) => {
                  const v = +e.target.value;
                  setCreator(v);
                  if (compute > 100 - v) setCompute(100 - v);
                }}
                className="mt-2"
                aria-label="Share of fee kept by the creator"
              />
            </label>
          </div>
        </Panel>

        <Panel className="p-6 md:p-8" screws>
          <Stencil>04 · the silicon</Stencil>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {HARDWARE.map((h) => {
              const on = h.id === hwId;
              return (
                <button
                  key={h.id}
                  onClick={() => pickHardware(h)}
                  aria-pressed={on}
                  className={`relative border p-4 text-left transition-colors ${
                    on ? "border-t70 bg-t70/[0.07]" : "border-seam hover:border-screw"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-[12px] ${on ? "text-t92" : "text-bone"}`}>{h.short}</span>
                    <span className="stencil">{h.kind}</span>
                  </span>
                  <span className="mt-2 block font-mono text-[10px] text-dim">{h.spec}</span>
                  <span className="mt-1 block font-mono text-[10px] text-dim">
                    {usd(h.rate)}/hr · {watts(h.watts)}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-6 md:p-8" screws>
          <Stencil>05 · the network</Stencil>
          <p className="mt-3 font-mono text-[11px] text-dim">
            Only networks this silicon can competitively mine are shown.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {validAlgos.map((a) => {
              const on = a.id === effectiveAlgo.id;
              const probe = economics(volume, feeBps, { compute, pool, creator }, hardware, a);
              return (
                <button
                  key={a.id}
                  onClick={() => setAlgoId(a.id)}
                  aria-pressed={on}
                  className={`relative border p-4 text-left transition-colors ${
                    on ? "border-t70 bg-t70/[0.07]" : "border-seam hover:border-screw"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-[12px] ${on ? "text-t92" : "text-bone"}`}>
                      {a.coin} · {a.name}
                    </span>
                    <span
                      className="font-mono text-[11px] tabular-nums"
                      style={{ color: heatCss(Math.max(probe.rig.heat, 0.34)) }}
                    >
                      {probe.rig.gain >= 0.01 ? `${probe.rig.gain.toFixed(2)}x` : "<0.01x"}
                    </span>
                  </span>
                  <span className="mt-2 block font-mono text-[10px] text-dim">
                    {a.chain} · {hash(a.network)} network · {a.phase}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* ---------------- verdict ---------------- */}
      <div className="lg:sticky lg:top-20">
        <Panel className="overflow-hidden" screws>
          <div className="sweep relative p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Stencil>projected</Stencil>
                <p className="mt-2 truncate font-display text-2xl font-semibold tracking-tight text-bone">
                  ${ticker}
                </p>
              </div>
              <Fan rpm={rig.gain >= 1 ? 2400 : 900} size={38} heat={heat} />
            </div>

            <div className="mt-7">
              <Stencil>loop gain</Stencil>
              <div className="mt-3">
                <Seg value={rig.gain >= 0.01 ? rig.gain.toFixed(2) : "0.00"} unit="x" heat={heat} height={58} label={`projected loop gain ${rig.gain.toFixed(2)}`} />
              </div>
              <HeatBar t={heat} height={5} className="mt-5" marker />
            </div>

            {/* the verdict is allowed to say no */}
            <div
              className="mt-6 border p-4"
              style={{
                borderColor: rig.gain >= 1 ? "rgba(249,150,10,0.45)" : "rgba(185,32,96,0.5)",
                background: rig.gain >= 1 ? "rgba(249,150,10,0.06)" : "rgba(185,32,96,0.07)",
              }}
              role="status"
            >
              <p className="font-mono text-[12px] leading-relaxed" style={{ color: rig.gain >= 1 ? "#FFD447" : "#E6E9EF" }}>
                {rig.gain >= 1 ? (
                  <>
                    This rig pays for itself. {usd(rig.cost, 0)} a day of rent returns {usd(rig.revenue, 0)} of{" "}
                    {effectiveAlgo.coin} into the pool — {usd(rig.edge, 0)} a day more than routing the same
                    fee straight to liquidity. Difficulty erases that edge in about{" "}
                    {rig.decayMonths === Infinity ? "—" : `${rig.decayMonths} months`}.
                    {rig.saturated && (
                      <>
                        {" "}
                        It is also capped: at {(rig.share * 100).toFixed(0)}% of {effectiveAlgo.chain} the rig
                        would start mining against itself, so{" "}
                        <span className="text-t100">{usd(rig.spill, 0)} a day</span> of your compute budget
                        goes straight to the pool instead. This coin has outgrown the network it picked.
                      </>
                    )}
                  </>
                ) : (
                  <>
                    This configuration loses money. {usd(rig.cost, 0)} a day of rent returns{" "}
                    {usd(rig.revenue)} of {effectiveAlgo.coin} — you would be burning{" "}
                    <span className="text-t55">{usd(Math.abs(rig.edge), 0)} a day</span> of your holders&apos;
                    fees. The pad would throttle this rig rather than run it.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-rail bg-rail">
            <div className="bg-deck p-5">
              <Stat label="hashrate" value={`${hp.value} ${hp.unit}`} heat={heat} size="sm" sub={`${Math.round(rig.units)} units`} />
            </div>
            <div className="bg-deck p-5">
              <Stat label="power" value={watts(rig.watts)} size="sm" sub={`${effectiveAlgo.coin} network`} />
            </div>
            <div className="bg-deck p-5">
              <Stat label="rent / day" value={usd(rig.cost, 0)} size="sm" />
            </div>
            <div className="bg-deck p-5">
              <Stat label="mined / day" value={usd(rig.revenue, 0)} heat={heat} size="sm" sub={`${compact(rig.coins)} ${effectiveAlgo.coin}`} />
            </div>
            <div className="bg-deck p-5">
              <Stat
                label="into pool / day"
                value={usd(econ.poolUsdPerDay, 0)}
                heat={econ.advantage >= 1 ? 0.78 : 0.2}
                size="sm"
                sub={`vs ${usd(econ.naiveUsdPerDay, 0)} routed`}
              />
            </div>
            <div className="bg-deck p-5">
              <Stat
                label="share of network"
                value={`${(rig.share * 100).toFixed(rig.share > 0.01 ? 1 : 3)}%`}
                heat={rig.saturated ? 0.9 : undefined}
                size="sm"
                sub={rig.saturated ? "capped — budget spilling" : `solo block ${duration(rig.soloHours)}`}
              />
            </div>
          </div>
        </Panel>

        {/* the substitution, not the answer */}
        <Panel className="mt-4 p-6" flush>
          <Stencil>the arithmetic, with your numbers</Stencil>
          <Rule className="my-4" />
          <dl className="space-y-2.5 font-mono text-[11px] leading-relaxed">
            <Row k="fee income" v={`${usdShort(volume)} × ${(feeBps / 100).toFixed(2)}% = ${usd(econ.feeUsdPerDay, 0)}/day`} />
            <Row k="to compute" v={`${usd(econ.feeUsdPerDay, 0)} × ${compute}% = ${usd(econ.computeUsdPerDay, 0)}/day`} />
            <Row
              k="units rented"
              v={`${usd(econ.computeUsdPerDay, 0)} ÷ (${usd(hardware.rate)}/hr × 24) = ${rig.units.toFixed(1)}`}
            />
            <Row k="hashrate" v={`${rig.units.toFixed(1)} × ${hash(hardware.rates[effectiveAlgo.id] ?? 0)} = ${hash(rig.hashrate)}`} />
            <Row
              k="network share"
              v={`${hash(rig.hashrate)} ÷ ${hash(effectiveAlgo.network)} = ${(rig.hashrate / effectiveAlgo.network * 100).toFixed(4)}%`}
            />
            <Row
              k="chain emission"
              v={`86400/${effectiveAlgo.blockSeconds}s × ${effectiveAlgo.reward} ${effectiveAlgo.coin} × ${usd(effectiveAlgo.price)} = ${usdShort((86400 / effectiveAlgo.blockSeconds) * effectiveAlgo.reward * effectiveAlgo.price)}/day`}
            />
            <Row k="your cut" v={`${(rig.hashrate / effectiveAlgo.network * 100).toFixed(4)}% of that = ${usd(rig.revenue, 0)}/day`} hot />
            {rig.saturated && (
              <Row
                k="cap"
                v={`${(MAX_SHARE * 100).toFixed(0)}% of ${effectiveAlgo.coin} reached — ${usd(rig.spill, 0)}/day spilled to pool`}
              />
            )}
            <Row k="loop gain" v={`${usd(rig.revenue, 0)} ÷ ${usd(rig.cost, 0)} = ${rig.gain.toFixed(3)}x`} hot />
          </dl>
        </Panel>

        <Panel className="mt-4 p-6" flush>
          <Stencil>every pairing, same budget</Stencil>
          <div className="mt-5">
            <GainBars
              max={2}
              rows={alternatives.map((r) => ({
                label: `${r.algo.coin} · ${r.hardware.short}`,
                value: r.gain,
                heat: r.heat,
                note: r.gain >= 0.01 ? `${r.gain.toFixed(2)}x` : "<0.01x",
              }))}
            />
          </div>
          {!onBest && best && (
            <p className="mt-5 font-mono text-[11px] leading-relaxed text-label">
              Best available: <span className="text-t92">{best.algo.coin} on {best.hardware.short}</span> at{" "}
              {best.gain.toFixed(2)}x.{" "}
              <button
                className="text-t82 underline decoration-t70/40 underline-offset-2 hover:text-t92"
                onClick={() => {
                  setHwId(best.hardware.id);
                  setAlgoId(best.algo.id);
                }}
              >
                Use it
              </button>
            </p>
          )}
        </Panel>

        <div className="mt-4 flex flex-wrap gap-3">
          <Key tone="hot" disabled>
            Deploy — preview build
          </Key>
          <Key href="/loop">Where these numbers come from</Key>
        </div>
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-dim">
          Front end only. Nothing is deployed, no wallet is connected, and no fee is collected.
        </p>
      </div>
    </div>
  );
}

function Row({ k, v, hot }: { k: string; v: string; hot?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rail pb-2.5 last:border-0">
      <dt className="text-dim">{k}</dt>
      <dd className={`tabular-nums ${hot ? "text-t92" : "text-label"}`}>{v}</dd>
    </div>
  );
}
