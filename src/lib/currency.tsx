import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Currency = "INR" | "USD" | "EUR" | "GBP" | "AED" | "SGD" | "CAD";

// Baseline high-precision fallback conversion rates relative to INR (1 INR = X Currency)
export const DEFAULT_RATES: Record<Currency, number> = {
  INR: 1,
  USD: 1 / 83.5,
  EUR: 1 / 90.2,
  GBP: 1 / 106.1,
  AED: 1 / 22.7,
  SGD: 1 / 62.4,
  CAD: 1 / 61.2,
};

export const SYMBOL: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  SGD: "S$",
  CAD: "C$",
};

export const LOCALE: Record<Currency, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "ar-AE",
  SGD: "en-SG",
  CAD: "en-CA",
};

let liveRates: Record<Currency, number> = { ...DEFAULT_RATES };

/**
 * Global helper to convert a base INR amount to any target currency
 * using live real-time or high-precision fallback exchange rates.
 */
export function convertCurrency(inrAmount: number, targetCurrency?: string | null): number {
  if (inrAmount == null || isNaN(inrAmount)) return 0;
  const code = (targetCurrency || "INR").toUpperCase() as Currency;
  const rate = liveRates[code] ?? DEFAULT_RATES[code] ?? 1;
  return inrAmount * rate;
}

/**
 * Global helper to convert and format a base INR amount with symbol & currency code.
 */
export function formatCurrencyWithCode(
  inrAmount: number | null | undefined,
  currency?: string | null,
): string {
  if (inrAmount == null || isNaN(inrAmount)) return "—";
  const code = (currency || "INR").toUpperCase() as Currency;
  const symbol = SYMBOL[code] || "₹";
  const locale = LOCALE[code] || "en-IN";
  const converted = convertCurrency(inrAmount, code);
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
  return `${symbol}${formatted} ${code}`;
}

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Record<Currency, number>;
  format: (inr: number) => string;
  convert: (inr: number, target?: Currency) => number;
};

const CurrencyContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "kalaneri.currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("INR");
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES);

  // Fetch real-time exchange rates on app load
  useEffect(() => {
    async function fetchRealtimeRates() {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/INR");
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.rates) {
          const updated: Record<Currency, number> = {
            INR: 1,
            USD: data.rates.USD || DEFAULT_RATES.USD,
            EUR: data.rates.EUR || DEFAULT_RATES.EUR,
            GBP: data.rates.GBP || DEFAULT_RATES.GBP,
            AED: data.rates.AED || DEFAULT_RATES.AED,
            SGD: data.rates.SGD || DEFAULT_RATES.SGD,
            CAD: data.rates.CAD || DEFAULT_RATES.CAD,
          };
          liveRates = updated;
          setRates(updated);
        }
      } catch (e) {
        console.warn("Using fallback exchange rates:", e);
      }
    }

    fetchRealtimeRates();
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as Currency | null;
      if (v && v in DEFAULT_RATES) setCurrencyState(v);
    } catch {}
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  const convert = (inr: number, target?: Currency) => {
    const code = target || currency;
    const rate = rates[code] ?? DEFAULT_RATES[code] ?? 1;
    return inr * rate;
  };

  const format = (inr: number) => {
    const converted = convert(inr);
    const code = currency;
    const symbol = SYMBOL[code];
    const locale = LOCALE[code];
    return symbol + new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, format, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: "INR" as Currency,
      setCurrency: () => {},
      rates: DEFAULT_RATES,
      format: (n: number) =>
        "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n),
      convert: (n: number) => n,
    };
  }
  return ctx;
}

export const CURRENCIES: Currency[] = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD"];

export function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <label
      className={`inline-flex items-center gap-1 text-[11px] tracking-widest uppercase ${className}`}
    >
      <span className="sr-only">Currency</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="bg-transparent border-0 focus:outline-none cursor-pointer font-medium"
        aria-label="Currency"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
