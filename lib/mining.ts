/**
 * The economics engine.
 *
 * MinerPad's whole claim is that a coin's trading fees can rent compute, the
 * compute can mine, and the mined proceeds can go back into the pool worth
 * more than the fees would have been worth if you had just dropped them in
 * the pool directly. That claim is either true or it isn't, and it depends
 * entirely on arithmetic anyone can check:
 *
 *   revenue/day = (my hashrate / network hashrate)
 *               x (86400 / block seconds) x block reward x coin price
 *   cost/day    = rented units x rental rate x 24
 *   loop gain   = revenue / cost
 *
 * Loop gain > 1 means the rig sends more into the pool than the fee that
 * paid for it. Loop gain < 1 means the rig is a hole in the floor and the
 * fee should have gone straight to the pool.
 *
 * Run those numbers against the big networks and the answer is brutal: at
 * spot rental rates, Bitcoin, Ethereum Classic, Ravencoin and Monero are all
 * underwater by between five and twenty times. There is no clever way around
 * that — you are bidding against miners who own their hardware and pay
 * industrial power rates, and you are renting from someone who has already
 * priced that in.
 *
 * The loop only closes on launch-phase networks, where the network hashrate
 * is small enough that a handful of rented cards is a real share of it. That
 * is the honest finding, it is what the pad routes to, and it comes with the
 * obvious catch, modelled here as difficulty drift: doing this raises the
 * difficulty you are being paid out of, so the margin decays.
 *
 * Every constant below is an input you can argue with. The formulas are not.
 */

import { clamp, clamp01 } from "./rng";

export type HardwareKind = "cpu" | "gpu" | "asic";

export type Hardware = {
  id: string;
  name: string;
  short: string;
  kind: HardwareKind;
  /** What you are actually renting: cores, VRAM, or a sealed box. */
  spec: string;
  /** Wall draw of one unit, watts. */
  watts: number;
  /** Spot rental, USD per unit-hour, idle-capacity market. */
  rate: number;
  /** Steady-state die temperature at full load, celsius. */
  tempC: number;
  /** Hashrate per unit, by algo id. Absent = this silicon cannot mine it. */
  rates: Record<string, number>;
};

export type Algo = {
  id: string;
  /** Proof-of-work function. */
  name: string;
  /** Ticker of the chain being mined. */
  coin: string;
  chain: string;
  /** Total hashrate securing the chain, H/s. */
  network: number;
  /** Coins minted per block, miner's share. */
  reward: number;
  /** Target block interval, seconds. */
  blockSeconds: number;
  /** Spot price of the mined coin, USD. */
  price: number;
  /** Which silicon is competitive here. */
  silicon: HardwareKind[];
  /** Annualised difficulty growth. Small chains get found out fast. */
  drift: number;
  /** Launch-phase networks are where the loop can actually close. */
  phase: "mature" | "launch";
  note: string;
};

/* ------------------------------------------------------------------ */
/* Inputs                                                             */
/* ------------------------------------------------------------------ */

export const HARDWARE: Hardware[] = [
  {
    id: "epyc",
    name: "AMD EPYC 9754",
    short: "EPYC 9754",
    kind: "cpu",
    spec: "128C / 256T · 256 MB L3",
    watts: 360,
    rate: 0.62,
    tempC: 71,
    rates: { randomx: 80_000, zephyr: 80_000, ghostrider: 14_200 },
  },
  {
    id: "xeon",
    name: "Intel Xeon 6980P (32 vCPU slice)",
    short: "XEON 32V",
    kind: "cpu",
    spec: "32 vCPU · 64 GB",
    watts: 120,
    rate: 0.18,
    tempC: 64,
    rates: { randomx: 12_400, zephyr: 12_400, ghostrider: 2_150 },
  },
  {
    id: "rtx4090",
    name: "NVIDIA GeForce RTX 4090",
    short: "RTX 4090",
    kind: "gpu",
    spec: "24 GB GDDR6X · 16384 CUDA",
    watts: 450,
    rate: 0.34,
    tempC: 68,
    rates: { kawpow: 62e6, etchash: 125e6, autolykos: 265e6, pyrinhash: 1.15e9 },
  },
  {
    id: "rtx5090",
    name: "NVIDIA GeForce RTX 5090",
    short: "RTX 5090",
    kind: "gpu",
    spec: "32 GB GDDR7 · 21760 CUDA",
    watts: 575,
    rate: 0.72,
    tempC: 74,
    rates: { kawpow: 95e6, etchash: 180e6, autolykos: 400e6, pyrinhash: 1.82e9 },
  },
  {
    id: "rx7900",
    name: "AMD Radeon RX 7900 XTX",
    short: "RX 7900",
    kind: "gpu",
    spec: "24 GB GDDR6 · 6144 SP",
    watts: 355,
    rate: 0.26,
    tempC: 72,
    rates: { kawpow: 42e6, etchash: 95e6, autolykos: 175e6, pyrinhash: 0.81e9 },
  },
  {
    id: "a100",
    name: "NVIDIA A100 80GB",
    short: "A100 80G",
    kind: "gpu",
    spec: "80 GB HBM2e · 6912 CUDA",
    watts: 400,
    rate: 1.29,
    tempC: 66,
    rates: { kawpow: 60e6, etchash: 175e6, autolykos: 250e6, pyrinhash: 1.04e9 },
  },
  {
    id: "s21",
    name: "Bitmain Antminer S21",
    short: "S21",
    kind: "asic",
    spec: "200 TH/s · sealed",
    watts: 3500,
    rate: 2.1,
    tempC: 81,
    rates: { sha256: 200e12 },
  },
];

export const ALGOS: Algo[] = [
  {
    id: "sha256",
    name: "SHA-256",
    coin: "BTC",
    chain: "Bitcoin",
    network: 8.2e20,
    reward: 3.125,
    blockSeconds: 600,
    price: 92_000,
    silicon: ["asic"],
    drift: 0.34,
    phase: "mature",
    note: "You are bidding against warehouses that own their machines and buy power by the megawatt.",
  },
  {
    id: "etchash",
    name: "Etchash",
    coin: "ETC",
    chain: "Ethereum Classic",
    network: 2.6e14,
    reward: 2.048,
    blockSeconds: 13,
    price: 21.4,
    silicon: ["gpu"],
    drift: 0.12,
    phase: "mature",
    note: "Absorbed most of the GPU fleet that left Ethereum. Deep, liquid, and fully priced.",
  },
  {
    id: "kawpow",
    name: "KawPow",
    coin: "RVN",
    chain: "Ravencoin",
    network: 8.4e12,
    reward: 2_500,
    blockSeconds: 60,
    price: 0.0162,
    silicon: ["gpu"],
    drift: 0.09,
    phase: "mature",
    note: "ASIC-resistant by design, which means every GPU on earth is already welcome.",
  },
  {
    id: "autolykos",
    name: "Autolykos v2",
    coin: "ERG",
    chain: "Ergo",
    network: 1.7e13,
    reward: 3,
    blockSeconds: 120,
    price: 0.68,
    silicon: ["gpu"],
    drift: 0.07,
    phase: "mature",
    note: "Memory-hard and well defended. A rented card is a rounding error here.",
  },
  {
    id: "randomx",
    name: "RandomX",
    coin: "XMR",
    chain: "Monero",
    network: 5.6e9,
    reward: 0.6,
    blockSeconds: 120,
    price: 168,
    silicon: ["cpu"],
    drift: 0.18,
    phase: "mature",
    note: "The most CPU-saturated chain there is. Renting into it is charity.",
  },
  {
    id: "ghostrider",
    name: "GhostRider",
    coin: "RTM",
    chain: "Raptoreum",
    network: 3.4e8,
    reward: 2_500,
    blockSeconds: 60,
    price: 0.00085,
    silicon: ["cpu"],
    drift: 0.05,
    phase: "mature",
    note: "Small network, but the coin price has to carry the whole thing and it cannot.",
  },
  {
    id: "zephyr",
    name: "RandomX",
    coin: "ZEPH",
    chain: "Zephyr Protocol",
    network: 4.0e8,
    reward: 5.61,
    blockSeconds: 120,
    price: 24.4,
    silicon: ["cpu"],
    drift: 1.9,
    phase: "launch",
    note: "A RandomX chain small enough that one rented EPYC is a quarter-percent of it. This is where the loop closes — and it is exactly why difficulty here roughly triples a year.",
  },
  {
    id: "pyrinhash",
    name: "Pyrinhash",
    coin: "PYI",
    chain: "Pyrin",
    network: 1.8e13,
    reward: 25,
    blockSeconds: 1,
    price: 0.092,
    silicon: ["gpu"],
    drift: 2.6,
    phase: "launch",
    note: "One-second blocks on a network a single rack could meaningfully move. The margin is real and it is being competed away in real time.",
  },
];

export const byAlgo = (id: string) => ALGOS.find((a) => a.id === id);
export const byHardware = (id: string) => HARDWARE.find((h) => h.id === id);

/* ------------------------------------------------------------------ */
/* The arithmetic                                                     */
/* ------------------------------------------------------------------ */

/** Value of everything the chain mints in a day, USD. */
export const networkEmissionUsd = (a: Algo) => (86400 / a.blockSeconds) * a.reward * a.price;

/**
 * The pad will not push a rig past this share of a network.
 *
 * Beyond roughly a sixth of a chain you stop being a miner on it and start
 * being its difficulty: your own hashrate reprices every block you win, and
 * the coin you are selling into is a market you are now the supply side of.
 * The model refuses to pretend otherwise, so budget above the cap is routed
 * straight into the pool instead of into rent.
 */
export const MAX_SHARE = 0.15;

/** Share of the network a hashrate commands, counting itself. Forgetting the
 *  self-dilution term is fine at a hundredth of a percent and nonsense at a
 *  quarter of the chain, and coins on this pad reach the second case. */
export const shareOf = (hashrate: number, a: Algo) =>
  hashrate <= 0 ? 0 : hashrate / (a.network + hashrate);

/** Expected daily payout for a given hashrate, USD. Pool mining, so this is
 *  the smooth expectation rather than a lottery over whole blocks. */
export function revenuePerDay(hashrate: number, a: Algo): number {
  if (hashrate <= 0) return 0;
  return shareOf(hashrate, a) * networkEmissionUsd(a);
}

/** Expected coins per day at that hashrate. */
export function coinsPerDay(hashrate: number, a: Algo): number {
  if (hashrate <= 0) return 0;
  return shareOf(hashrate, a) * (86400 / a.blockSeconds) * a.reward;
}

/** Hours between blocks if you were mining solo — the "why we pool" number. */
export function soloBlockHours(hashrate: number, a: Algo): number {
  if (hashrate <= 0) return Infinity;
  return (a.blockSeconds / 3600) / shareOf(hashrate, a);
}

export type Rig = {
  hardware: Hardware;
  algo: Algo;
  /** Continuous unit-equivalents rented; fractional because billing is hourly. */
  units: number;
  hashrate: number;
  watts: number;
  /** Rental spend, USD/day. */
  cost: number;
  /** Expected mined value, USD/day. */
  revenue: number;
  /** revenue / cost. Above 1 the rig beats sending the fee straight to the pool. */
  gain: number;
  /** revenue - cost, USD/day. What the loop actually adds. */
  edge: number;
  coins: number;
  soloHours: number;
  /** Budget the network could not absorb, routed straight to the pool. */
  spill: number;
  /** True when the cap bound — the coin is too big for the chain it picked. */
  saturated: boolean;
  /** Fraction of the network this rig is. */
  share: number;
  /** 0..1 position on the thermal ramp. Break-even sits at 0.55. */
  heat: number;
  /** Months until difficulty drift alone erases the edge. Infinity if never. */
  decayMonths: number;
};

/** Where a rig sits on the ironbow: cold violet is underwater, white-hot is
 *  a rig returning more than twice its rent. Break-even lands mid-ramp on
 *  purpose, so an underwater fleet is visibly a different colour. */
export function heatOf(gain: number): number {
  if (gain <= 0) return 0;
  if (gain < 1) return clamp01(gain * 0.55);
  /* Above break-even the useful range is roughly 1.0x to 1.7x — real rigs
     cluster there — so the top of the ramp is spent on that rather than on
     returns nobody is going to see. */
  return clamp01(0.55 + ((gain - 1) / 0.7) * 0.45);
}

/** Build a rig by spending a compute budget on one kind of silicon. */
export function rigFor(computeUsdPerDay: number, hardware: Hardware, algo: Algo): Rig {
  const perUnit = hardware.rates[algo.id] ?? 0;
  const dayRate = hardware.rate * 24;
  const wanted = dayRate > 0 ? computeUsdPerDay / dayRate : 0;
  /* MAX_SHARE is a share of the network INCLUDING the rig, so the hashrate
     that lands exactly on the cap is network x s/(1-s). */
  const capHash = algo.network * (MAX_SHARE / (1 - MAX_SHARE));
  const capUnits = perUnit > 0 ? capHash / perUnit : wanted;
  const units = Math.min(wanted, capUnits);
  const hashrate = units * perUnit;
  const cost = units * dayRate;
  const spill = Math.max(0, computeUsdPerDay - cost);
  const revenue = revenuePerDay(hashrate, algo);
  const gain = cost > 0 ? revenue / cost : 0;
  const edge = revenue - cost;

  /* Difficulty drift compounds against you; at drift d per year the network
     is (1+d)^t larger after t years, so an edge of g survives until
     g / (1+d)^t = 1. Solved with repeated multiplication rather than logs,
     which are not bit-identical across engines. */
  let decayMonths = Infinity;
  if (gain > 1 && algo.drift > 0) {
    const perMonth = Math.pow(1 + algo.drift, 1 / 12);
    let g = gain;
    let m = 0;
    while (g > 1 && m < 600) {
      g /= perMonth;
      m++;
    }
    decayMonths = m;
  }

  return {
    hardware,
    algo,
    units,
    hashrate,
    watts: units * hardware.watts,
    cost,
    revenue,
    gain,
    edge,
    coins: coinsPerDay(hashrate, algo),
    soloHours: soloBlockHours(hashrate, algo),
    spill,
    saturated: spill > 0.01,
    share: shareOf(hashrate, algo),
    heat: heatOf(gain),
    decayMonths,
  };
}

/** Every silicon/algo pairing that is physically possible, best gain first.
 *  Used by the configurator to answer "is there a better place for this?" */
export function survey(computeUsdPerDay: number): Rig[] {
  const out: Rig[] = [];
  for (const h of HARDWARE) {
    for (const a of ALGOS) {
      if (!a.silicon.includes(h.kind)) continue;
      if (!h.rates[a.id]) continue;
      out.push(rigFor(computeUsdPerDay, h, a));
    }
  }
  return out.sort((x, y) => y.gain - x.gain);
}

/* ------------------------------------------------------------------ */
/* Fee side                                                           */
/* ------------------------------------------------------------------ */

export type Split = {
  /** Basis points of the fee routed to renting compute. */
  compute: number;
  /** Basis points routed straight into the pool, no rig involved. */
  pool: number;
  /** Basis points to whoever launched the coin. */
  creator: number;
};

export type Economics = {
  feeUsdPerDay: number;
  computeUsdPerDay: number;
  directUsdPerDay: number;
  creatorUsdPerDay: number;
  rig: Rig;
  /** What lands in the pool per day: direct routing plus mined proceeds. */
  poolUsdPerDay: number;
  /** What the pool would have got if every fee went straight in. */
  naiveUsdPerDay: number;
  /** poolUsdPerDay / naiveUsdPerDay. The only number that justifies the pad. */
  advantage: number;
};

export function economics(
  volumeUsdPerDay: number,
  feeBps: number,
  split: Split,
  hardware: Hardware,
  algo: Algo,
): Economics {
  const feeUsdPerDay = volumeUsdPerDay * (feeBps / 10_000);
  const total = split.compute + split.pool + split.creator || 1;
  const computeUsdPerDay = feeUsdPerDay * (split.compute / total);
  const directUsdPerDay = feeUsdPerDay * (split.pool / total);
  const creatorUsdPerDay = feeUsdPerDay * (split.creator / total);
  const rig = rigFor(computeUsdPerDay, hardware, algo);
  /* Spill never touched a rig, so it arrives in the pool at face value. */
  const poolUsdPerDay = directUsdPerDay + rig.revenue + rig.spill;
  const naiveUsdPerDay = feeUsdPerDay - creatorUsdPerDay;
  return {
    feeUsdPerDay,
    computeUsdPerDay,
    directUsdPerDay,
    creatorUsdPerDay,
    rig,
    poolUsdPerDay,
    naiveUsdPerDay,
    advantage: naiveUsdPerDay > 0 ? poolUsdPerDay / naiveUsdPerDay : 0,
  };
}

/** Steady-state temperature: silicon's rated load temp, pulled toward
 *  ambient when the rig is throttled. Aisles run cold. */
export function tempOf(hardware: Hardware, duty: number): number {
  const ambient = 22;
  return ambient + (hardware.tempC - ambient) * clamp(duty, 0.05, 1);
}

/** Fan speed tracks temperature, not load, the way real firmware does. */
export function fanRpm(hardware: Hardware, tempC: number): number {
  const base = hardware.kind === "asic" ? 6200 : hardware.kind === "gpu" ? 2400 : 3000;
  const over = clamp01((tempC - 40) / 45);
  return Math.round(base * (0.35 + over * 0.75));
}
