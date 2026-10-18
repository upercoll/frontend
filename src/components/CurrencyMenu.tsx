import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { CURRENCIES } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";

/* Store currency picker — the same control in the header and the footer, so
   choosing a currency in one place updates both (they read one context).
   Converts display only; the card is always charged in USD, and the menu says
   so rather than letting anyone assume otherwise.

   It is a real menu: picking persists to localStorage, the list reflects live
   rates, and the status line tells you how fresh those rates are. When rates
   can't be fetched the menu says "Prices in USD" instead of pretending. */

const M = {
  surface: "#131c33",
  surfaceAlt: "#1f2b4a",
  border: "#2b3c66",
  text: "#ffffff",
  muted: "#aab4d4",
  faint: "#8ea0cf",
  accent: "#2f7dff",
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CurrencyMenu({
  variant = "chip",
  direction = "up",
  className = "",
}: {
  /** "chip" = the pill used in footers, "nav" = flatter, for the top bar */
  variant?: "chip" | "nav";
  /** Which way the list opens — up from the footer, down from the header. */
  direction?: "up" | "down";
  className?: string;
}) {
  const { code, currency, setCode, rates, converted } = useCurrency();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const status =
    rates.status === "live"
      ? `Rates updated ${rates.date ?? "just now"}`
      : rates.status === "cached"
        ? `Cached rates from ${rates.date ?? "earlier"}`
        : rates.status === "loading"
          ? "Loading rates…"
          : "Rates unavailable — prices in USD";

  return (
    <div ref={wrapRef} className={`relative ${className}`} style={{ zIndex: open ? 60 : undefined }}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Currency: ${code}. Change display currency`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="inline-flex items-center gap-2 text-[13px] font-semibold select-none"
        style={{
          minHeight: 40,
          padding: variant === "chip" ? "0 12px 0 10px" : "0 12px",
          borderRadius: 999,
          background: variant === "chip" ? M.surfaceAlt : "transparent",
          border: `1px solid ${variant === "chip" ? M.border : "transparent"}`,
          color: M.text,
          cursor: "pointer",
        }}
      >
        <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>{currency.flag}</span>
        <span>{code}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-flex">
          <ChevronDown size={14} color={M.faint} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Display currency"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: EASE }}
            className={`absolute ${direction === "up" ? "left-0 bottom-full mb-2" : "right-0 top-full mt-2"} w-64 rounded-2xl overflow-hidden`}
            style={{ background: M.surface, border: `1px solid ${M.border}`, boxShadow: "0 18px 46px rgba(0,0,0,0.5)" }}
          >
            <p
              className="px-4 pt-3 pb-2 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: M.faint }}
            >
              Show prices in
            </p>

            <div className="max-h-72 overflow-y-auto px-1.5 pb-1.5">
              {CURRENCIES.map((c) => {
                const active = c.code === code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setCode(c.code);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 rounded-xl text-left transition-colors"
                    style={{ minHeight: 40, background: "transparent", border: 0, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = M.surfaceAlt)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span aria-hidden style={{ fontSize: 16, lineHeight: 1, width: 20, textAlign: "center" }}>
                      {c.flag}
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: M.text, width: 42 }}>
                      {c.code}
                    </span>
                    <span className="text-[12px] truncate" style={{ color: M.muted }}>
                      {c.name}
                    </span>
                    {active && <Check size={15} color={M.accent} className="ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-3" style={{ borderTop: `1px solid ${M.border}`, background: "#101a30" }}>
              <p className="text-[11px] leading-[1.55]" style={{ color: M.muted }}>
                {converted ? (
                  <>
                    Converted for display only — your card is charged in{" "}
                    <b style={{ color: M.text }}>USD</b>.
                  </>
                ) : (
                  <>Prices are in USD, the currency you're charged in.</>
                )}
              </p>
              <p className="flex items-center gap-1.5 mt-1.5 text-[10.5px]" style={{ color: M.faint }}>
                {rates.status === "live" && <RefreshCw size={11} />}
                {status}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
