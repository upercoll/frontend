/* Display currency for the storefront.
   ─────────────────────────────────────────────────────────────────────────
   Prices are stored and charged in USD — that never changes, and Stripe
   always bills USD. This module only converts what the customer SEES, using
   live exchange rates, so someone in the Philippines sees ₱ instead of $.

   Rates come from public no-key APIs (jsDelivr mirror of the currency-api
   project, then open.er-api.com) and are cached in localStorage for a day.
   If every source fails we fall back to the cache, and if there is no cache
   we report "unavailable" and the UI keeps showing USD — we never invent a
   rate, because a wrong price is worse than no conversion at all.

   Everything is formatted with Intl.NumberFormat, which puts the symbol in
   the right place for each currency (₹1,234 vs 1 234 Ft vs $1,234.00). */

export interface Currency {
  code: string;
  name: string;
  flag: string; // emoji stand-in for a flag image — no asset to 404 on
  decimals: number;
}

/* Currencies Roblox players actually buy in. Anything not on this list simply
   shows USD. Order matters: it is the order in the dropdown. */
export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸", decimals: 2 },
  { code: "EUR", name: "Euro", flag: "🇪🇺", decimals: 2 },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", decimals: 2 },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", decimals: 2 },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", decimals: 2 },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳", decimals: 2 },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭", decimals: 2 },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩", decimals: 0 },
  { code: "BRL", name: "Brazilian Real", flag: "🇧🇷", decimals: 2 },
  { code: "MXN", name: "Mexican Peso", flag: "🇲🇽", decimals: 2 },
  { code: "TRY", name: "Turkish Lira", flag: "🇹🇷", decimals: 2 },
  { code: "PLN", name: "Polish Zloty", flag: "🇵🇱", decimals: 2 },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬", decimals: 0 },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦", decimals: 2 },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪", decimals: 2 },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", decimals: 0 },
  { code: "VND", name: "Vietnamese Dong", flag: "🇻🇳", decimals: 0 },
];

export const CURRENCY_STORAGE_KEY = "rbstars_currency";
const RATES_STORAGE_KEY = "rbstars_rates_v1";
const FRESH_MS = 24 * 60 * 60 * 1000; // re-fetch after a day
const MAX_STALE_MS = 14 * 24 * 60 * 60 * 1000; // cache is still usable for two weeks

export type RatesStatus = "loading" | "live" | "cached" | "unavailable";

export interface RatesState {
  status: RatesStatus;
  /** per 1 USD — `USD` is always present and always 1 */
  rates: Record<string, number> | null;
  /** ISO date the provider published these rates for */
  date: string | null;
}

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

/* Two independent public providers, tried in order. Neither needs a key and
   both send CORS headers, so this runs straight from the browser. */
const SOURCES: Array<{ url: string; pick: (json: any) => Record<string, number> | null }> = [
  {
    url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    pick: (j) => (j && j.usd && typeof j.usd === "object" ? j.usd : null),
  },
  {
    url: "https://open.er-api.com/v6/latest/USD",
    pick: (j) => (j && j.rates && typeof j.rates === "object" ? j.rates : null),
  },
];

function readCache(): { t: number; date: string | null; rates: Record<string, number> } | null {
  try {
    const raw = localStorage.getItem(RATES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.t !== "number" || !parsed.rates || typeof parsed.rates.USD !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(date: string | null, rates: Record<string, number>) {
  try {
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({ t: Date.now(), date, rates }));
  } catch {
    /* private mode / quota — rates just won't survive a reload */
  }
}

/** Fetch rates, falling back to the cache, then to "no conversion at all". */
export async function loadRates(): Promise<RatesState> {
  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, { cache: "no-cache" });
      if (!res.ok) continue;
      const json = await res.json();
      const raw = source.pick(json);
      if (!raw) continue;

      const rates: Record<string, number> = { USD: 1 };
      for (const [code, value] of Object.entries(raw)) {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
          rates[code.toUpperCase()] = value;
        }
      }
      // Every currency we offer must be priced, or the dropdown would
      // silently show USD for a currency that looks selected.
      const missing = CURRENCIES.filter((c) => !(c.code in rates));
      if (missing.length > 0) continue;

      const date = typeof json.date === "string" ? json.date : new Date().toISOString().slice(0, 10);
      writeCache(date, rates);
      return { status: "live", rates, date };
    } catch {
      /* network / CORS / bad payload — try the next source */
    }
  }

  const cached = readCache();
  if (cached && Date.now() - cached.t < MAX_STALE_MS) {
    return { status: "cached", rates: cached.rates, date: cached.date };
  }

  // Nothing trustworthy — the caller keeps showing USD.
  return { status: "unavailable", rates: null, date: null };
}

/** Rates older than a day get re-fetched in the background, not blocking. */
export function ratesNeedRefresh(): boolean {
  const cached = readCache();
  return !cached || Date.now() - cached.t > FRESH_MS;
}

/** USD → selected currency. Returns 0 when no rate is known. */
export function convertFromUSD(usd: number, code: string, rates: Record<string, number> | null): number {
  if (code === "USD") return usd;
  const rate = rates?.[code];
  if (!rate || !Number.isFinite(usd)) return 0;
  return usd * rate;
}

/** Format a USD amount in the selected currency. Falls back to USD rather
    than printing a converted number we cannot actually back up. */
export function formatPrice(
  usd: number,
  code: string,
  rates: Record<string, number> | null,
  opts: { compact?: boolean } = {},
): string {
  const currency = getCurrency(code);
  const value = code === "USD" ? usd : convertFromUSD(usd, code, rates);
  if (!Number.isFinite(value)) return "$—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: opts.compact ? 0 : currency.decimals,
      maximumFractionDigits: opts.compact ? 0 : currency.decimals,
    }).format(value);
  } catch {
    // Unsupported code or an ancient browser — plain USD, still truthful.
    return `$${value.toFixed(2)}`;
  }
}
