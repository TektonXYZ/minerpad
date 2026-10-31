/**
 * The roster.
 *
 * Front end only: no chain is read, nothing here settles. Every coin below is
 * an authored scenario, and every number attached to one is computed from it
 * by lib/mining.ts rather than typed in — so if you disagree with the engine,
 * the whole board moves with you.
 *
 * The roster is deliberately mixed. Most launches route their compute budget
 * at launch-phase networks where the arithmetic works; several route at
 * mature chains where it very much does not, because people do that. The
 * board is colour-coded by loop gain, so the bad ones are visibly cold.
 */

import { ALGOS, HARDWARE, byAlgo, byHardware, economics, fanRpm, tempOf } from "./mining";
import type { Algo, Economics, Hardware, Split } from "./mining";
import { rng, seedOf, clamp01, intBetween, between } from "./rng";

export const SITE = {
  name: "MinerPad",
  url: "https://example.com",
  tagline: "A coin that mines for itself.",
  blurb:
    "Launch a coin. Its trading fees rent CPU and GPU time. That silicon mines, and what it mines goes back into the pool. Trade, rent, hash, settle, repeat.",
  /* Front-end preview: no wallet is connected and nothing here is on chain. */
  treasury: "0x0000000000000000000000000000000000000000",
  chain: "preview",
} as const;

export type Coin = {
  symbol: string;
  name: string;
  tagline: string;
  /** Hours since launch. Fixed numbers, never a clock read. */
  age: number;
  /** 24h traded volume, USD. */
  volume: number;
  feeBps: number;
  split: Split;
  hardwareId: string;
  algoId: string;
  price: number;
  supply: number;
  holders: number;
};

const split = (compute: number, pool: number, creator: number): Split => ({ compute, pool, creator });

/* Authored scenarios. Volume and fee are the inputs; every other number on
   the site is derived from them. */
const ROSTER: Coin[] = [
  { symbol: "HEAT", name: "Heat Death", tagline: "The first one. Still the hottest.", age: 2_184, volume: 4_820_000, feeBps: 250, split: split(70, 20, 10), hardwareId: "rtx4090", algoId: "pyrinhash", price: 0.0412, supply: 1_000_000_000, holders: 9_412 },
  { symbol: "HASHCAT", name: "Hashcat", tagline: "Nine lives, one nonce.", age: 1_610, volume: 2_140_000, feeBps: 300, split: split(75, 15, 10), hardwareId: "rx7900", algoId: "pyrinhash", price: 0.0187, supply: 1_000_000_000, holders: 5_308 },
  { symbol: "WATT", name: "Wattage", tagline: "Priced in joules.", age: 1_402, volume: 1_780_000, feeBps: 200, split: split(80, 10, 10), hardwareId: "epyc", algoId: "zephyr", price: 0.0931, supply: 250_000_000, holders: 4_117 },
  { symbol: "FANBOI", name: "Fan Boi", tagline: "Loud, and it does not care.", age: 998, volume: 1_310_000, feeBps: 300, split: split(65, 25, 10), hardwareId: "rtx4090", algoId: "pyrinhash", price: 0.0074, supply: 2_000_000_000, holders: 3_882 },
  { symbol: "COOLANT", name: "Coolant", tagline: "Two-phase, single purpose.", age: 874, volume: 962_000, feeBps: 250, split: split(70, 20, 10), hardwareId: "epyc", algoId: "zephyr", price: 0.1442, supply: 100_000_000, holders: 2_744 },
  { symbol: "RIGDOG", name: "Rig Dog", tagline: "Sits under the desk. Earns.", age: 742, volume: 845_000, feeBps: 350, split: split(85, 5, 10), hardwareId: "rtx5090", algoId: "pyrinhash", price: 0.0059, supply: 1_500_000_000, holders: 2_401 },
  { symbol: "IMMERSION", name: "Immersion", tagline: "Submerged and unbothered.", age: 690, volume: 774_000, feeBps: 250, split: split(75, 15, 10), hardwareId: "rtx4090", algoId: "pyrinhash", price: 0.0218, supply: 400_000_000, holders: 2_190 },
  { symbol: "NONCE", name: "Nonce Sense", tagline: "Guessing, professionally.", age: 611, volume: 690_000, feeBps: 200, split: split(60, 30, 10), hardwareId: "rx7900", algoId: "pyrinhash", price: 0.0038, supply: 3_000_000_000, holders: 1_986 },
  { symbol: "AISLE", name: "Cold Aisle", tagline: "18 degrees, forever.", age: 540, volume: 512_000, feeBps: 300, split: split(70, 20, 10), hardwareId: "epyc", algoId: "zephyr", price: 0.0266, supply: 500_000_000, holders: 1_622 },
  { symbol: "BREAKER", name: "Breaker Panel", tagline: "Trips at two hundred amps.", age: 468, volume: 430_000, feeBps: 400, split: split(80, 10, 10), hardwareId: "rtx4090", algoId: "pyrinhash", price: 0.0091, supply: 750_000_000, holders: 1_455 },
  { symbol: "PSU", name: "Power Supply", tagline: "Eighty plus titanium.", age: 402, volume: 318_000, feeBps: 250, split: split(70, 20, 10), hardwareId: "rx7900", algoId: "pyrinhash", price: 0.0047, supply: 1_000_000_000, holders: 1_180 },
  { symbol: "SHIM", name: "Thermal Shim", tagline: "One millimetre of relief.", age: 356, volume: 244_000, feeBps: 300, split: split(65, 25, 10), hardwareId: "epyc", algoId: "zephyr", price: 0.0132, supply: 300_000_000, holders: 960 },
  /* --- the cold half of the board: mature networks, negative loop gain --- */
  { symbol: "THROTTLE", name: "Throttle", tagline: "Points at Ethereum Classic. Bravely.", age: 820, volume: 606_000, feeBps: 300, split: split(70, 20, 10), hardwareId: "rtx4090", algoId: "etchash", price: 0.0021, supply: 2_000_000_000, holders: 2_066 },
  { symbol: "SLURRY", name: "Slurry", tagline: "Ravencoin, against all advice.", age: 596, volume: 288_000, feeBps: 250, split: split(75, 15, 10), hardwareId: "rx7900", algoId: "kawpow", price: 0.0016, supply: 2_500_000_000, holders: 1_104 },
  { symbol: "DIESEL", name: "Diesel Gen", tagline: "Rented an S21. Mines Bitcoin. Yes, really.", age: 512, volume: 396_000, feeBps: 400, split: split(90, 0, 10), hardwareId: "s21", algoId: "sha256", price: 0.0104, supply: 200_000_000, holders: 1_349 },
  { symbol: "KWH", name: "Kilowatt Hour", tagline: "Right chain, wrong silicon.", age: 452, volume: 210_000, feeBps: 200, split: split(70, 20, 10), hardwareId: "xeon", algoId: "zephyr", price: 0.0029, supply: 1_000_000_000, holders: 884 },
  { symbol: "HALT", name: "Halt And Catch Fire", tagline: "Monero. On rented cores.", age: 388, volume: 164_000, feeBps: 350, split: split(80, 10, 10), hardwareId: "epyc", algoId: "randomx", price: 0.0008, supply: 4_000_000_000, holders: 702 },
  { symbol: "DUSTBIN", name: "Dustbin", tagline: "Ergo, and a lesson.", age: 301, volume: 88_000, feeBps: 250, split: split(70, 20, 10), hardwareId: "rtx4090", algoId: "autolykos", price: 0.0004, supply: 5_000_000_000, holders: 431 },
];

export type CoinView = Coin & {
  hardware: Hardware;
  algo: Algo;
  econ: Economics;
  /** Fraction of the day the rig is allowed to run. The pad throttles a rig
   *  whose loop gain is under one rather than burning fees on it. */
  duty: number;
  tempC: number;
  rpm: number;
  mcap: number;
  /** Liquidity in the pool right now, USD. */
  pool: number;
  /** Everything the rig has settled into the pool since launch, USD. */
  minedTotal: number;
  /** Rent paid over the same period, USD. */
  spentTotal: number;
  /** Change in price over 24h, percent. */
  change: number;
  /** True when the rig sends more into the pool than its rent costs. */
  clears: boolean;
};

/**
 * The throttle is the one piece of policy in the model. A rig whose expected
 * revenue is below its rent is a fee shredder, so the pad runs it at a floor
 * duty cycle — enough to keep the numbers honest and visible on the board,
 * not enough to bleed the pool dry. Rigs that clear run flat out.
 */
export function dutyFor(gain: number): number {
  if (gain >= 1) return 1;
  return clamp01(0.08 + gain * 0.22);
}

export function view(c: Coin): CoinView {
  const hardware = byHardware(c.hardwareId)!;
  const algo = byAlgo(c.algoId)!;
  const econ = economics(c.volume, c.feeBps, c.split, hardware, algo);
  const duty = dutyFor(econ.rig.gain);
  const tempC = tempOf(hardware, duty);
  const r = rng(seedOf(c.symbol));

  /* History: the rig has been running for `age` hours at roughly today's
     rate, discounted because volume was thinner early on. */
  const days = c.age / 24;
  const ramp = 0.52 + 0.3 * r();
  const minedTotal = econ.rig.revenue * duty * days * ramp;
  const spentTotal = econ.rig.cost * duty * days * ramp;

  return {
    ...c,
    hardware,
    algo,
    econ,
    duty,
    tempC,
    rpm: fanRpm(hardware, tempC),
    mcap: c.price * c.supply,
    pool: c.volume * between(r, 0.14, 0.31) + minedTotal,
    minedTotal,
    spentTotal,
    change: between(r, -14, 26) * (econ.rig.gain >= 1 ? 1 : 0.6) - (econ.rig.gain >= 1 ? 0 : 5),
    clears: econ.rig.gain >= 1,
  };
}

export const COINS: CoinView[] = ROSTER.map(view);

export const bySymbol = (s: string) => COINS.find((c) => c.symbol.toLowerCase() === s.toLowerCase());

/* ------------------------------------------------------------------ */
/* Fleet-wide roll-ups                                                */
/* ------------------------------------------------------------------ */

export type Fleet = {
  coins: number;
  units: number;
  /** Combined hashrate, weighted by duty cycle. */
  hashrate: number;
  watts: number;
  rentPerDay: number;
  minedPerDay: number;
  /** Aggregate loop gain across the whole pad. */
  gain: number;
  minedAllTime: number;
  poolTotal: number;
  clearing: number;
  throttled: number;
  /** Rigs that hit the network-share cap and had budget left over. */
  saturated: number;
  /** Compute budget no network could absorb, routed straight to pools. */
  spillPerDay: number;
};

export const FLEET: Fleet = COINS.reduce<Fleet>(
  (f, c) => {
    f.coins += 1;
    f.units += c.econ.rig.units * c.duty;
    f.hashrate += c.econ.rig.hashrate * c.duty;
    f.watts += c.econ.rig.watts * c.duty;
    f.rentPerDay += c.econ.rig.cost * c.duty;
    f.minedPerDay += c.econ.rig.revenue * c.duty;
    f.minedAllTime += c.minedTotal;
    f.poolTotal += c.pool;
    if (c.clears) f.clearing += 1;
    else f.throttled += 1;
    if (c.econ.rig.saturated) {
      f.saturated += 1;
      f.spillPerDay += c.econ.rig.spill;
    }
    return f;
  },
  { coins: 0, units: 0, hashrate: 0, watts: 0, rentPerDay: 0, minedPerDay: 0, gain: 0, minedAllTime: 0, poolTotal: 0, clearing: 0, throttled: 0, saturated: 0, spillPerDay: 0 },
);
FLEET.gain = FLEET.rentPerDay > 0 ? FLEET.minedPerDay / FLEET.rentPerDay : 0;

/* ------------------------------------------------------------------ */
/* Settlement feed                                                    */
/* ------------------------------------------------------------------ */

export type Settlement = {
  id: string;
  symbol: string;
  /** Minutes before the page was built. */
  ago: number;
  coinsMined: number;
  ticker: string;
  usd: number;
  /** Block height the payout was credited against. */
  height: number;
};

/** Recent mined-to-pool settlements, weighted toward the busiest rigs. */
export function settlements(n = 24): Settlement[] {
  const live = COINS.filter((c) => c.econ.rig.revenue * c.duty > 0.5);
  const weights = live.map((c) => c.econ.rig.revenue * c.duty);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const r = rng(seedOf("settlements"));
  const out: Settlement[] = [];
  let ago = 0;
  for (let i = 0; i < n; i++) {
    let x = r() * total;
    let k = 0;
    while (k < live.length - 1 && x > weights[k]) {
      x -= weights[k];
      k++;
    }
    const c = live[k];
    ago += intBetween(r, 2, 26);
    /* A settlement batches whatever the rig earned since the last one. */
    const usd = (c.econ.rig.revenue * c.duty / 1440) * ago * between(r, 0.8, 1.35);
    out.push({
      id: `${c.symbol}-${i}`,
      symbol: c.symbol,
      ago,
      coinsMined: usd / c.algo.price,
      ticker: c.algo.coin,
      usd,
      height: 4_180_000 - i * intBetween(r, 30, 900),
    });
  }
  return out;
}

export const SETTLEMENTS = settlements();

/* ------------------------------------------------------------------ */
/* Aisle layout                                                       */
/* ------------------------------------------------------------------ */

export type Slot = { symbol: string; heat: number; duty: number; kind: Hardware["kind"] };

/** The aisle is a picture, not a census: a fleet spending eighty thousand a
 *  day on 4090s is ten thousand cards, which is not a thing you can draw. So
 *  tile count goes as the square root of spend — area, not count, is what
 *  reads as scale — and each tile carries its coin's real heat.
 *
 *  Tiles are sized by the compute BUDGET rather than by what the throttle
 *  actually lets a rig spend. A throttled rig still has a fee stream pointed
 *  at a network that cannot pay for it, and the point of this view is to show
 *  how much of the floor is in that position. Sizing by post-throttle rent
 *  would hide exactly the failure the colour is there to report. */
export const tilesFor = (usdPerDay: number) => Math.max(2, Math.round(Math.sqrt(usdPerDay) / 4));

export function aisle(): Slot[] {
  const out: Slot[] = [];
  for (const c of COINS) {
    const tiles = tilesFor(c.econ.computeUsdPerDay);
    for (let i = 0; i < tiles; i++) {
      out.push({ symbol: c.symbol, heat: c.econ.rig.heat * (0.72 + 0.28 * c.duty), duty: c.duty, kind: c.hardware.kind });
    }
  }
  return out;
}

export const HARDWARE_LIST = HARDWARE;
export const ALGO_LIST = ALGOS;
