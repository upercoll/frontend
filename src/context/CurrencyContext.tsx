import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  CURRENCIES,
  CURRENCY_STORAGE_KEY,
  convertFromUSD,
  formatPrice,
  getCurrency,
  loadRates,
  ratesNeedRefresh,
  type Currency,
  type RatesState,
} from "@/lib/currency";

/* One source of truth for the display currency, shared by the header, the
   footer and every price on the page — so picking EUR in the footer updates
   the nav and the cart in the same tick. Charged amount stays USD always. */

interface CurrencyContextValue {
  code: string;
  currency: Currency;
  rates: RatesState;
  setCode: (code: string) => void;
  /** Format a stored USD amount in the selected currency. */
  fmt: (usd: number, opts?: { compact?: boolean }) => string;
  /** Convert only (for "≈" notes next to a USD charge). */
  convert: (usd: number) => number;
  /** True when prices are shown in something other than the charged USD. */
  converted: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function initialCode(): string {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && CURRENCIES.some((c) => c.code === stored)) return stored;
  } catch {
    /* private mode */
  }
  return "USD";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [code, setCodeState] = useState<string>(initialCode);
  const [rates, setRates] = useState<RatesState>({ status: "loading", rates: null, date: null });

  useEffect(() => {
    let alive = true;

    const cached = (() => {
      // Show the cached conversion immediately (if we have one) instead of
      // flashing $ then switching to ₹ a moment later.
      try {
        const raw = localStorage.getItem("rbstars_rates_v1");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.rates && typeof parsed.rates.USD === "number"
          ? { status: "cached" as const, rates: parsed.rates as Record<string, number>, date: (parsed.date as string) ?? null }
          : null;
      } catch {
        return null;
      }
    })();

    if (cached) setRates(cached);

    // Background refresh when the cache is stale; a fresh cache is good
    // enough to skip the round trip entirely.
    let pending = true;
    const shouldLoad = cached === null || ratesNeedRefresh();
    if (shouldLoad) {
      loadRates().then((next) => {
        if (!alive) return;
        pending = false;
        setRates(next);
      });
    } else {
      pending = false;
    }

    return () => {
      alive = false;
      void pending;
    };
  }, []);

  const setCode = useCallback((next: string) => {
    if (!CURRENCIES.some((c) => c.code === next)) return;
    setCodeState(next);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, next);
    } catch {
      /* private mode — choice just won't persist */
    }
  }, []);

  // Currency without a live rate degrades to USD rather than showing a number
  // we cannot stand behind.
  useEffect(() => {
    if (code !== "USD" && rates.status !== "loading" && rates.status !== "unavailable" && !rates.rates?.[code]) {
      setCode("USD");
    }
  }, [code, rates, setCode]);

  const value = useMemo<CurrencyContextValue>(() => {
    const usable = rates.status === "unavailable" ? null : rates.rates;
    return {
      code,
      currency: getCurrency(code),
      rates,
      setCode,
      fmt: (usd, opts) => formatPrice(usd, code, usable, opts),
      convert: (usd) => convertFromUSD(usd, code, usable),
      converted: code !== "USD",
    };
  }, [code, rates, setCode]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}

/** Convenience hook for the common case: `const fmt = usePrice(); fmt(9.99)`. */
export function usePrice() {
  return useCurrency().fmt;
}
