/** Display formatting. Locale-free on purpose: the build and the browser
 *  must print identical strings, and Intl defaults are not portable. */

const GROUP = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function fixed(n: number, dp: number): string {
  if (!Number.isFinite(n)) return "—";
  const s = Math.abs(n).toFixed(dp);
  const [int, frac] = s.split(".");
  return (n < 0 ? "-" : "") + GROUP(int) + (frac ? "." + frac : "");
}

/** Decimal places that give three significant digits, counted by repeated
 *  multiplication rather than log10, whose last bits are not portable. */
function subDollarPlaces(a: number): number {
  let places = 2;
  let x = a;
  while (x < 0.1 && places < 8) {
    x *= 10;
    places++;
  }
  return places;
}

export function usd(n: number, dp?: number): string {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  const places = dp ?? (a >= 1000 ? 0 : a >= 1 ? 2 : a > 0 ? subDollarPlaces(a) : 2);
  let out = fixed(a, places);
  /* $0.340/hr reads like a typo; $0.34/hr reads like a price. */
  if (dp === undefined && out.includes(".") && a < 1) out = out.replace(/0+$/, "").replace(/\.$/, "");
  return (n < 0 ? "-$" : "$") + out;
}

/** $1.2M / $840K — for anything that shares a row with other numbers. */
export function usdShort(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(1)}K`;
  return `${sign}$${a.toFixed(a >= 1 ? 2 : 4)}`;
}

const HASH_UNITS = ["H/s", "kH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s", "ZH/s"];

/** Hashrate with the right SI step — the one number this whole site is about. */
export function hash(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 H/s";
  let i = 0;
  let v = n;
  while (v >= 1000 && i < HASH_UNITS.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${HASH_UNITS[i]}`;
}

/** Split form, for the seven-segment readouts that need the parts apart. */
export function hashParts(n: number): { value: string; unit: string } {
  const s = hash(n);
  const cut = s.indexOf(" ");
  return { value: s.slice(0, cut), unit: s.slice(cut + 1) };
}

export function watts(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GW`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MW`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} kW`;
  return `${Math.round(n)} W`;
}

export const pct = (n: number, dp = 1) => `${n >= 0 ? "" : "-"}${Math.abs(n).toFixed(dp)}%`;

export function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(a >= 10 ? 0 : 2);
}

/** "4h 12m" — uptime, payback periods, time since last block. */
export function duration(hours: number): string {
  if (hours >= 24) {
    const d = Math.floor(hours / 24);
    const h = Math.round(hours - d * 24);
    return h ? `${d}d ${h}h` : `${d}d`;
  }
  if (hours >= 1) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.max(1, Math.round(hours * 60))}m`;
}

/** Zero-padded clock off a deterministic minute offset, never Date.now(). */
export function clock(minutesAgo: number): string {
  const total = ((24 * 60 - (minutesAgo % (24 * 60))) + 14 * 60 + 9) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
