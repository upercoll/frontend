import { useState, useEffect, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Lock, Check,
  ChevronRight, ChevronDown, Zap, Package, AlertCircle,
  User, Mail, MapPin, Tag, X, Loader2, MessageSquare, Star,
} from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unionpay" | "maestro" | null;

function VisaIcon({ w = 38 }: { w?: number }) {
  const h = Math.round(w * 0.625);
  return (
    <svg width={w} height={h} viewBox="0 0 50 32" fill="none">
      <rect width="50" height="32" rx="5" fill="#1a1f71"/>
      <text x="5" y="23" fontFamily="Arial" fontWeight="900" fontSize="16" fill="white" letterSpacing="-0.5">VISA</text>
    </svg>
  );
}
function MastercardIcon({ w = 38 }: { w?: number }) {
  const h = Math.round(w * 0.625);
  return (
    <svg width={w} height={h} viewBox="0 0 50 32" fill="none">
      <rect width="50" height="32" rx="5" fill="#252525"/>
      <circle cx="19" cy="16" r="10" fill="#eb001b"/>
      <circle cx="31" cy="16" r="10" fill="#f79e1b"/>
      <path d="M25 8.27a10 10 0 0 1 0 15.46A10 10 0 0 1 25 8.27z" fill="#ff5f00"/>
    </svg>
  );
}
function AmexIcon({ w = 38 }: { w?: number }) {
  const h = Math.round(w * 0.625);
  return (
    <svg width={w} height={h} viewBox="0 0 50 32" fill="none">
      <rect width="50" height="32" rx="5" fill="#007bc1"/>
      <text x="4" y="15" fontFamily="Arial" fontWeight="900" fontSize="9" fill="white" letterSpacing="0.4">AMERICAN</text>
      <text x="4" y="27" fontFamily="Arial" fontWeight="900" fontSize="9" fill="white" letterSpacing="0.4">EXPRESS</text>
    </svg>
  );
}
function DiscoverIcon({ w = 38 }: { w?: number }) {
  const h = Math.round(w * 0.625);
  return (
    <svg width={w} height={h} viewBox="0 0 50 32" fill="none">
      <rect width="50" height="32" rx="5" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
      <text x="4" y="22" fontFamily="Arial" fontWeight="900" fontSize="9.5" fill="#f97316">DISCOVER</text>
      <circle cx="38" cy="16" r="8" fill="#f97316"/>
    </svg>
  );
}
function UnionPayIcon({ w = 38 }: { w?: number }) {
  const h = Math.round(w * 0.625);
  return (
    <svg width={w} height={h} viewBox="0 0 50 32" fill="none">
      <rect width="50" height="32" rx="5" fill="#e41e26"/>
      <rect x="17" width="33" height="32" rx="5" fill="#005ea6"/>
      <text x="5" y="22" fontFamily="Arial" fontWeight="900" fontSize="9" fill="white">UP</text>
    </svg>
  );
}
function MaestroIcon({ w = 38 }: { w?: number }) {
  const h = Math.round(w * 0.625);
  return (
    <svg width={w} height={h} viewBox="0 0 50 32" fill="none">
      <rect width="50" height="32" rx="5" fill="#0a0a0a"/>
      <circle cx="19" cy="16" r="10" fill="#e41e26" opacity="0.9"/>
      <circle cx="31" cy="16" r="10" fill="#009be0" opacity="0.9"/>
    </svg>
  );
}

const BRAND_ICONS = [
  { key: "visa",       el: (w: number) => <VisaIcon w={w} /> },
  { key: "mastercard", el: (w: number) => <MastercardIcon w={w} /> },
  { key: "amex",       el: (w: number) => <AmexIcon w={w} /> },
  { key: "discover",   el: (w: number) => <DiscoverIcon w={w} /> },
  { key: "unionpay",   el: (w: number) => <UnionPayIcon w={w} /> },
  { key: "maestro",    el: (w: number) => <MaestroIcon w={w} /> },
];
const SHOW_BRANDS = 3;
const EXTRA_COUNT = BRAND_ICONS.length - SHOW_BRANDS;

function BrandIconRow({ activeBrand }: { activeBrand: CardBrand }) {
  return (
    <div className="flex items-center gap-1">
      {BRAND_ICONS.slice(0, SHOW_BRANDS).map(b => (
        <motion.div key={b.key}
          animate={{ opacity: activeBrand ? (activeBrand === b.key ? 1 : 0.3) : 0.7, scale: activeBrand === b.key ? 1.06 : 1 }}
          transition={{ duration: 0.18 }}
          className="rounded overflow-hidden"
        >
          {b.el(30)}
        </motion.div>
      ))}
      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap bg-white"
        style={{ border: "1.5px solid #131313", color: "#131313" }}>
        +{EXTRA_COUNT}
      </span>
    </div>
  );
}

function Input({
  label, placeholder, value, onChange, icon, right, type = "text",
  maxLen, mode, error, hint,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon?: React.ReactNode;
  right?: React.ReactNode; type?: string;
  maxLen?: number; mode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1">
      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#6B655C" }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white transition-all duration-200"
        style={{
          border: `2px solid ${error ? "#E2231A" : "#131313"}`,
          boxShadow: focused ? "3px 3px 0 #131313" : "none",
        }}
      >
        {icon && <span style={{ color: focused ? "#E2231A" : "#131313", flexShrink: 0 }}>{icon}</span>}
        <input
          type={type} inputMode={mode} placeholder={placeholder} value={value} maxLength={maxLen}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium min-w-0"
          style={{ color: "#131313" }}
        />
        {right}
      </div>
      {error && <p className="flex items-center gap-1 mt-0.5 font-mono text-[11px]" style={{ color: "#E2231A" }}><AlertCircle size={10} />{error}</p>}
      {hint && !error && <p className="mt-0.5 text-[10px]" style={{ color: "#8a8375" }}>{hint}</p>}
    </div>
  );
}

function SelectInput({
  label, value, onChange, options, icon, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; icon?: React.ReactNode; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1">
      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#6B655C" }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 rounded-xl bg-white transition-all duration-200"
        style={{
          border: `2px solid ${error ? "#E2231A" : "#131313"}`,
          boxShadow: focused ? "3px 3px 0 #131313" : "none",
        }}
      >
        {icon && <span style={{ color: "#131313", flexShrink: 0 }}>{icon}</span>}
        <select
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium py-3 appearance-none cursor-pointer"
          style={{ color: value ? "#131313" : "#8a8375" }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#F7F4EC", color: "#131313" }}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} style={{ color: "#6B655C", flexShrink: 0 }} />
      </div>
      {error && <p className="flex items-center gap-1 mt-0.5 font-mono text-[11px]" style={{ color: "#E2231A" }}><AlertCircle size={10} />{error}</p>}
    </div>
  );
}

function Accordion({
  open, onToggle, title, subtitle, iconBg, iconEl, headerRight, children, delay = 0, badge,
}: {
  open: boolean; onToggle: () => void; title: React.ReactNode; subtitle?: React.ReactNode;
  iconBg?: string; iconEl?: React.ReactNode; headerRight?: React.ReactNode;
  children: React.ReactNode; delay?: number; badge?: React.ReactNode;
}) {
  void iconBg;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay }}
      className="rounded-2xl overflow-hidden bg-white"
      style={{
        border: `2px solid #131313`,
        boxShadow: open ? "5px 5px 0 #131313" : "none",
        transition: "box-shadow .2s ease",
      }}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        {iconEl && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-2"
            style={{ borderColor: "#131313", background: "#F7F4EC" }}>
            {iconEl}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold">{title}</span>
            {badge}
          </div>
          {subtitle && <div className="mt-0.5">{subtitle}</div>}
        </div>
        {headerRight && <div className="flex-shrink-0 ml-1">{headerRight}</div>}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }} className="flex-shrink-0 ml-1">
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 pt-1" style={{ borderTop: "2px solid #131313" }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 transition-all"
      style={{ border: `2.5px solid #131313`, background: selected ? "#E2231A" : "transparent" }}
    >
      {selected && <Check size={11} color="#fff" strokeWidth={4} />}
    </div>
  );
}

function CardPreview({ cardNum, expiry, cardName, brand }: { cardNum: string; expiry: string; cardName: string; brand: CardBrand }) {
  if (!cardNum && !expiry && !cardName) return null;

  const themes: Record<string, { bg: string }> = {
    visa:       { bg: "#1A1F71" },
    mastercard: { bg: "#1C1C1E" },
    amex:       { bg: "#007BC1" },
    discover:   { bg: "#EA580C" },
    unionpay:   { bg: "#005EA6" },
    maestro:    { bg: "#14181F" },
  };
  const bg = brand ? themes[brand].bg : "#131313";

  const masked = cardNum
    ? cardNum.split(" ").map((g, i) => i < 2 ? g.replace(/\d/g, "•") : g).join("  ")
    : "••••  ••••  ••••  ••••";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative mt-4 rounded-2xl overflow-hidden select-none"
      style={{ background: bg, aspectRatio: "1.586", width: "100%", boxShadow: "5px 6px 0 rgba(19,19,19,.25)" }}
    >
      <div className="absolute inset-0 pattern-dots-light pointer-events-none" />

      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          {/* Gold chip */}
          <div className="relative -rotate-3" style={{ width: 40, height: 30 }}>
            <div className="absolute inset-0 rounded-md border-2" style={{ background: "#FFC800", borderColor: "#131313" }} />
            <div className="absolute inset-0 rounded-md overflow-hidden">
              <div className="absolute w-full" style={{ top: "33%", height: "1.5px", background: "rgba(19,19,19,.35)" }} />
              <div className="absolute w-full" style={{ top: "66%", height: "1.5px", background: "rgba(19,19,19,.35)" }} />
              <div className="absolute h-full" style={{ left: "33%", width: "1.5px", background: "rgba(19,19,19,.35)" }} />
              <div className="absolute h-full" style={{ left: "66%", width: "1.5px", background: "rgba(19,19,19,.35)" }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none" opacity="0.7">
              <path d="M9 11c0-1.1.9-2 2-2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M9 11c0-2.2 1.8-4 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M9 11c0-3.3 2.7-6 6-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <div>
              {brand === "visa"       && <VisaIcon w={44} />}
              {brand === "mastercard" && <MastercardIcon w={44} />}
              {brand === "amex"       && <AmexIcon w={44} />}
              {brand === "discover"   && <DiscoverIcon w={44} />}
              {brand === "unionpay"   && <UnionPayIcon w={44} />}
              {brand === "maestro"    && <MaestroIcon w={44} />}
              {!brand && (
                <div className="rounded-md flex items-center justify-center" style={{ width: 44, height: 28, background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.3)" }}>
                  <span className="font-mono text-[8px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.6)" }}>CARD</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Number */}
        <p className="font-mono tracking-[0.2em] text-[15px] font-semibold" style={{ color: "#fff" }}>
          {masked}
        </p>

        {/* Holder + expiry */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.15em] mb-0.5" style={{ color: "rgba(255,255,255,.55)" }}>Card Holder</p>
            <p className="text-[13px] font-bold uppercase tracking-wide truncate max-w-[145px]" style={{ color: "#fff" }}>{cardName || "YOUR NAME"}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[8px] uppercase tracking-[0.15em] mb-0.5" style={{ color: "rgba(255,255,255,.55)" }}>Expires</p>
            <p className="text-[13px] font-bold" style={{ color: "#fff" }}>{expiry || "MM / YY"}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type PromoState = { code: string; type: "percent" | "fixed"; value: number } | null;

function PromoInput({ applied, onApply, onRemove }: { applied: PromoState; onApply: (p: PromoState) => void; onRemove: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleApply() {
    if (!code.trim()) return;
    setLoading(true); setErr("");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/promo/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || "Invalid or expired promo code");
      onApply({
        code: data.data.code,
        type: data.data.discountType,
        value: data.data.discountValue,
      });
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Invalid or expired promo code");
    } finally {
      setLoading(false);
    }
  }

  if (applied) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-between px-3.5 py-3 rounded-xl"
        style={{ background: "#E9F8EF", border: "2px solid #00B06F" }}>
        <div className="flex items-center gap-2">
          <Check size={14} color="#00875A" strokeWidth={3} />
          <span className="text-sm font-bold">{applied.code}</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded font-bold rotate-[-3deg] text-white"
            style={{ background: "#00B06F", border: "1.5px solid #131313" }}>
            {applied.type === "percent" ? `-${applied.value}%` : `-$${applied.value}`}
          </span>
        </div>
        <button onClick={onRemove}><X size={14} /></button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white" style={{ border: "2px solid #131313" }}>
          <Tag size={13} />
          <input
            placeholder="Enter promo code"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && handleApply()}
            className="flex-1 bg-transparent outline-none font-mono text-sm font-bold uppercase tracking-wider placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[#8a8375]"
          />
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          onClick={handleApply} disabled={loading || !code.trim()}
          className="px-4 rounded-xl font-mono text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-1.5 disabled:opacity-50"
          style={{ background: "#E2231A", border: "2px solid #131313", minWidth: 72, justifyContent: "center", boxShadow: "3px 3px 0 #131313" }}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
        </motion.button>
      </div>
      {err && <p className="flex items-center gap-1 font-mono text-[11px]" style={{ color: "#E2231A" }}><AlertCircle size={10} />{err}</p>}
    </div>
  );
}

function BurstParticles({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * 360;
        const dist = 50 + (i % 3) * 18;
        return (
          <motion.div key={i}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 1, x: Math.cos((angle * Math.PI) / 180) * dist, y: Math.sin((angle * Math.PI) / 180) * dist }}
            transition={{ duration: 0.55, ease: "easeOut", delay: i * 0.012 }}
            className="absolute top-1/2 left-1/2 rounded-[2px] pointer-events-none"
            style={{ width: i % 3 === 0 ? 10 : 6, height: i % 3 === 0 ? 10 : 6, marginLeft: i % 3 === 0 ? -5 : -3, marginTop: i % 3 === 0 ? -5 : -3, background: ["#E2231A","#FFC800","#0A84FF","#00B06F","#131313","#FF7AC8"][i % 6], zIndex: 200 }}
          />
        );
      })}
    </AnimatePresence>
  );
}

function SuccessOverlay({ email }: { email: string }) {
  const [, navigate] = useLocation();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: "rgba(19,19,19,.96)", backdropFilter: "blur(20px)" }}>
      <motion.div
        initial={{ scale: 0.75, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
        className="w-full max-w-sm text-center rounded-3xl p-7 relative overflow-hidden"
        style={{ background: "#F2EEE5", border: "3px solid #F2EEE5", boxShadow: "10px 10px 0 rgba(226,35,26,.95)" }}>

        <div className="pattern-dots absolute inset-0 pointer-events-none opacity-60" />

        <div className="relative">
          <div className="relative flex items-center justify-center mb-6">
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 2.5 + i * 0.6, opacity: 0 }}
                transition={{ duration: 1.3, delay: 0.2 + i * 0.15, repeat: Infinity, repeatDelay: 1.2 }}
                className="absolute w-20 h-20 rounded-full border-2"
                style={{ borderColor: i === 0 ? "#E2231A" : i === 1 ? "#FFC800" : "#0A84FF" }} />
            ))}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
              className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center border-[3px]"
              style={{ background: "#00B06F", borderColor: "#F2EEE5", boxShadow: "4px 4px 0 rgba(242,238,229,.35)" }}>
              <Check size={38} color="#fff" strokeWidth={3} />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <h2 className="font-display text-3xl uppercase mb-1">Order Confirmed!</h2>
            <p className="text-sm mb-5 font-mono text-xs uppercase tracking-wider" style={{ color: "#6B655C" }}>
              Confirmation sent to <span className="font-bold normal-case">{email || "your email"}</span>
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="rounded-2xl p-4 mb-4 text-left relative overflow-hidden bg-white"
              style={{ border: "2px solid #131313", boxShadow: "4px 4px 0 #131313" }}
            >
              <div className="flex items-start gap-3 relative">
                <motion.div
                  animate={{ rotate: [-6, 6, -6] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2"
                  style={{ background: "#E2231A", borderColor: "#131313" }}
                >
                  <MessageSquare size={18} color="#fff" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold mb-1">Get Your Items Now</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#6B655C" }}>
                    Click the{" "}
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md mx-0.5 font-mono font-bold align-middle"
                      style={{ background: "#F2EEE5", border: "1.5px solid #131313" }}>
                      chat
                    </span>{" "}
                    icon in the corner to open live chat, provide your details and our claim team will contact you shortly!
                  </p>
                </div>
              </div>

              <motion.span
                animate={{ x: [0, 4, 0], y: [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                className="absolute bottom-2 right-3"
              >
                ↘
              </motion.span>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              whileHover={{ translateX: -2, translateY: -2, boxShadow: "6px 6px 0 #131313" }} whileTap={{ translateX: 2, translateY: 2 }}
              onClick={() => navigate("/")}
              className="w-full py-3.5 rounded-full font-mono text-sm font-semibold uppercase tracking-wider border-[3px]"
              style={{ background: "#131313", color: "#F2EEE5", borderColor: "#131313" }}>
              Back to Store
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const COUNTRIES = [
  { value: "", label: "Select country…" },
  { value: "AF", label: "Afghanistan" }, { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" }, { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" }, { value: "AG", label: "Antigua & Barbuda" },
  { value: "AR", label: "Argentina" }, { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" }, { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" }, { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" }, { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" }, { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" }, { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" }, { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" }, { value: "BA", label: "Bosnia & Herzegovina" },
  { value: "BW", label: "Botswana" }, { value: "BR", label: "Brazil" },
  { value: "BN", label: "Brunei" }, { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" }, { value: "BI", label: "Burundi" },
  { value: "KH", label: "Cambodia" }, { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" }, { value: "CV", label: "Cape Verde" },
  { value: "CF", label: "Central African Republic" }, { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" }, { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" }, { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" }, { value: "CR", label: "Costa Rica" },
  { value: "HR", label: "Croatia" }, { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" }, { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" }, { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" }, { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" }, { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" }, { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" }, { value: "EE", label: "Estonia" },
  { value: "ET", label: "Ethiopia" }, { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" }, { value: "FR", label: "France" },
  { value: "GA", label: "Gabon" }, { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" }, { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" }, { value: "GR", label: "Greece" },
  { value: "GD", label: "Grenada" }, { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" }, { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" }, { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" }, { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" }, { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" }, { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" }, { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" }, { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" }, { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" }, { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" }, { value: "KI", label: "Kiribati" },
  { value: "KP", label: "North Korea" }, { value: "KR", label: "South Korea" },
  { value: "KW", label: "Kuwait" }, { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Laos" }, { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" }, { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" }, { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" }, { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" }, { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" }, { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" }, { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" }, { value: "MH", label: "Marshall Islands" },
  { value: "MR", label: "Mauritania" }, { value: "MU", label: "Mauritius" },
  { value: "MX", label: "Mexico" }, { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldova" }, { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" }, { value: "ME", label: "Montenegro" },
  { value: "MA", label: "Morocco" }, { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" }, { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" }, { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" }, { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" }, { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" }, { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" }, { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" }, { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" }, { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" }, { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" }, { value: "PT", label: "Portugal" },
  { value: "QA", label: "Qatar" }, { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" }, { value: "RW", label: "Rwanda" },
  { value: "KN", label: "Saint Kitts & Nevis" }, { value: "LC", label: "Saint Lucia" },
  { value: "VC", label: "Saint Vincent & the Grenadines" }, { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" }, { value: "ST", label: "São Tomé & Príncipe" },
  { value: "SA", label: "Saudi Arabia" }, { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" }, { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" }, { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" }, { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" }, { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" }, { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" }, { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" }, { value: "SR", label: "Suriname" },
  { value: "SE", label: "Sweden" }, { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syria" }, { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" }, { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" }, { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" }, { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad & Tobago" }, { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" }, { value: "TM", label: "Turkmenistan" },
  { value: "TV", label: "Tuvalu" }, { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" }, { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" }, { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" }, { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" }, { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" }, { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" }, { value: "ZW", label: "Zimbabwe" },
];

export default function Checkout() {
  const { items, totalPrice, clearCart, removeItem } = useCart();
  const [, navigate] = useLocation();
  const { user, openAuthModal } = useAuth();

  const [promo, setPromo] = useState<PromoState>(null);
  const discount = promo
    ? promo.type === "percent" ? totalPrice * (promo.value / 100) : Math.min(promo.value, totalPrice)
    : 0;
  const finalTotal = Math.max(0, totalPrice - discount);

  const [summaryOpen, setSummaryOpen] = useState(true);
  const [billingOpen, setBillingOpen] = useState(false);
  const [openPayment, setOpenPayment] = useState<"card">("card");

  const [email, setEmail] = useState(user?.email || "");

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user?.email]);

  const [billName, setBillName] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");

  const [cardName, setCardName] = useState("");
  const [elemBrand, setElemBrand] = useState<CardBrand>(null);
  const [elemComplete, setElemComplete] = useState({ cardNum: false, expiry: false, cvv: false });
  const brand = elemBrand;

  const cardNumDivRef = useRef<HTMLDivElement>(null);
  const cardExpDivRef = useRef<HTMLDivElement>(null);
  const cardCvvDivRef = useRef<HTMLDivElement>(null);
  const cardNumElRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [burst, setBurst] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const stripeRef = useRef<import("@stripe/stripe-js").Stripe | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);

  const eceContainerRef = useRef<HTMLDivElement>(null);
  const eceElementsRef = useRef<any>(null);
  const [eceAvailable, setEceAvailable] = useState<boolean | null>(null);
  const [eceCollapsed, setEceCollapsed] = useState(false);

  const promoRef = useRef(promo);
  const emailRef = useRef(email);
  const itemsRef = useRef(items);
  const userRef = useRef(user);
  const finalTotalRef = useRef(finalTotal);
  useEffect(() => { promoRef.current = promo; }, [promo]);
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { finalTotalRef.current = finalTotal; }, [finalTotal]);

  useEffect(() => {
    if (!STRIPE_KEY) return;
    let cancelled = false;
    (async () => {
      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(STRIPE_KEY);
      if (!stripe || cancelled) return;
      stripeRef.current = stripe;
      setStripeLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!stripeLoaded || !stripeRef.current) return;
    const stripe = stripeRef.current;
    const amount = Math.max(50, Math.round(finalTotalRef.current * 100));

    const elements = (stripe as any).elements({ mode: "payment", amount, currency: "usd" });
    eceElementsRef.current = elements;

    const ece = elements.create("expressCheckout", {
      buttonType: { applePay: "buy", googlePay: "buy" },
      buttonHeight: 52,
      layout: { maxColumns: 2, maxRows: 1, overflow: "auto" },
    });

    ece.on("ready", ({ availablePaymentMethods }: any) => {
      const hasAny = availablePaymentMethods &&
        Object.values(availablePaymentMethods as Record<string, boolean>).some(Boolean);
      if (hasAny) {
        setEceAvailable(true);
      } else {
        setEceAvailable(false);
        setTimeout(() => setEceCollapsed(true), 100);
      }
    });

    ece.on("confirm", async (event: any) => {
      const currentEmail = emailRef.current || event.billingDetails?.email || "";
      const currentUser = userRef.current;
      const currentItems = itemsRef.current;
      const currentPromo = promoRef.current;
      const customerInfo = {
        email: currentEmail,
        robloxUsername: currentUser?.robloxUsername || currentEmail,
      };
      try {
        const createResp = await fetch(`${BACKEND_URL}/api/payments/create-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems: currentItems.map(i => ({ id: i.id, quantity: i.quantity })),
            customer: customerInfo,
            promoCode: currentPromo?.code || null,
          }),
        });
        const createData = await createResp.json();
        if (!createResp.ok) throw new Error(createData.message || "Payment failed. Please try again.");

        const { clientSecret, orderNumber } = createData.data;
        const orderData = {
          orderRef: orderNumber,
          email: customerInfo.email,
          game: currentItems[0]?.game || null,
          items: currentItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, gradient: i.gradient })),
        };
        try {
          localStorage.setItem("rbstars_last_order", JSON.stringify(orderData));
          const _raw = localStorage.getItem("rbstars_orders");
          const _arr: typeof orderData[] = _raw ? JSON.parse(_raw) : [];
          const _filtered = Array.isArray(_arr) ? _arr.filter(o => o.orderRef !== orderData.orderRef) : [];
          _filtered.push(orderData);
          localStorage.setItem("rbstars_orders", JSON.stringify(_filtered));
        } catch {}

        const { error } = await (stripe as any).confirmPayment({
          elements,
          clientSecret,
          confirmParams: { return_url: `${window.location.origin}/order-success` },
          redirect: "if_required",
        });
        if (error) throw new Error(error.message);

        clearCart();
        navigate("/order-success");
      } catch (err) {
        setErrors({ payment: err instanceof Error ? err.message : "Payment failed. Please try again." });
      }
    });

    if (eceContainerRef.current) ece.mount(eceContainerRef.current);
    return () => { try { ece.unmount(); } catch {} eceElementsRef.current = null; };
  }, [stripeLoaded]);

  useEffect(() => {
    if (!stripeLoaded || !stripeRef.current) return;
    if (!cardNumDivRef.current || !cardExpDivRef.current || !cardCvvDivRef.current) return;
    const stripe = stripeRef.current;
    const elements = (stripe as any).elements();
    const BRAND_MAP: Record<string, CardBrand> = {
      visa: "visa", mastercard: "mastercard", amex: "amex",
      discover: "discover", unionpay: "unionpay", maestro: "maestro",
    };
    const baseStyle = {
      style: {
        base: {
          color: "#131313",
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: "14px",
          fontSmoothing: "antialiased",
          "::placeholder": { color: "#8a8375" },
        },
        invalid: { color: "#E2231A" },
      },
    };
    const numEl = elements.create("cardNumber", baseStyle);
    const expEl = elements.create("cardExpiry", baseStyle);
    const cvcEl = elements.create("cardCvc", baseStyle);
    numEl.mount(cardNumDivRef.current);
    expEl.mount(cardExpDivRef.current);
    cvcEl.mount(cardCvvDivRef.current);
    cardNumElRef.current = numEl;
    numEl.on("change", (e: any) => {
      setElemBrand(BRAND_MAP[e.brand] || null);
      setElemComplete(prev => ({ ...prev, cardNum: !!e.complete }));
    });
    expEl.on("change", (e: any) => {
      setElemComplete(prev => ({ ...prev, expiry: !!e.complete }));
    });
    cvcEl.on("change", (e: any) => {
      setElemComplete(prev => ({ ...prev, cvv: !!e.complete }));
    });
    return () => {
      try { numEl.unmount(); } catch {}
      try { expEl.unmount(); } catch {}
      try { cvcEl.unmount(); } catch {}
      cardNumElRef.current = null;
    };
  }, [stripeLoaded]);

  useEffect(() => {
    if (eceElementsRef.current && finalTotal > 0) {
      try {
        eceElementsRef.current.update({ amount: Math.max(50, Math.round(finalTotal * 100)) });
      } catch {}
    }
  }, [finalTotal]);

  function validate() {
    const e: Record<string, string> = {};
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (!elemComplete.cardNum) e.cardNum = "Enter a valid card number";
    if (!elemComplete.expiry) e.expiry = "Enter expiry date";
    if (!elemComplete.cvv) e.cvv = "Enter security code";
    if (!cardName.trim()) e.cardName = "Enter name on card";
    return e;
  }

  async function doProcessPayment() {
    const customerInfo = {
      email: user?.email || email,
      robloxUsername: user?.robloxUsername || email,
    };
    const cartPayload = items.map((i) => ({ id: i.id, quantity: i.quantity }));

    setBurst(true);
    await new Promise((r) => setTimeout(r, 320));
    setBurst(false);
    setLoading(true);

    try {
      if (!STRIPE_KEY) throw new Error("Stripe is not configured. Please contact support.");

      const { loadStripe } = await import("@stripe/stripe-js");
      if (!stripeRef.current) {
        stripeRef.current = await loadStripe(STRIPE_KEY);
      }
      const stripe = stripeRef.current;
      if (!stripe) throw new Error("Failed to load payment processor. Please refresh and try again.");

      if (!cardNumElRef.current) throw new Error("Card details not ready. Please wait and try again.");
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumElRef.current,
        billing_details: { name: cardName, email: customerInfo.email },
      } as Parameters<typeof stripe.createPaymentMethod>[0]);

      if (pmError || !paymentMethod) {
        throw new Error(pmError?.message || "Invalid card details. Please check and try again.");
      }

      const createResp = await fetch(`${BACKEND_URL}/api/payments/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cartPayload,
          customer: customerInfo,
          paymentMethodId: paymentMethod.id,
          promoCode: promo?.code || null,
        }),
      });
      const createData = await createResp.json();
      if (!createResp.ok) throw new Error(createData.message || "Failed to create payment");

      const { clientSecret, orderNumber } = createData.data;

      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) throw new Error(confirmError.message || "Payment confirmation failed");
      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        throw new Error("Payment was not completed. Please try again.");
      }

      await fetch(`${BACKEND_URL}/api/payments/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      }).catch(() => {});

      const orderData = {
        orderRef: orderNumber,
        email: customerInfo.email,
        game: items[0]?.game || null,
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, gradient: i.gradient })),
      };
      try {
        localStorage.setItem("rbstars_last_order", JSON.stringify(orderData));
        const _raw = localStorage.getItem("rbstars_orders");
        const _arr: typeof orderData[] = _raw ? JSON.parse(_raw) : [];
        const _filtered = Array.isArray(_arr) ? _arr.filter(o => o.orderRef !== orderData.orderRef) : [];
        _filtered.push(orderData);
        localStorage.setItem("rbstars_orders", JSON.stringify(_filtered));
      } catch {}
      clearCart();
      navigate("/order-success");
    } catch (err) {
      setErrors({ payment: err instanceof Error ? err.message : "Payment failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});

    if (!user) {
      openAuthModal("register", () => { doProcessPayment(); });
      return;
    }

    await doProcessPayment();
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen dot-grid flex flex-col items-center justify-center gap-6 px-6" style={{ background: "#F2EEE5" }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center border-[3px] -rotate-3 bg-white"
          style={{ borderColor: "#131313", boxShadow: "6px 6px 0 #131313" }}>
          <Package size={34} />
        </div>
        <h2 className="font-display text-3xl uppercase">Your cart is empty</h2>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/")}
          className="px-8 py-3.5 rounded-full font-mono text-sm font-semibold uppercase tracking-wider text-white border-[3px]"
          style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}>
          Browse Items
        </motion.button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen dot-grid" style={{ background: "#F2EEE5" }}>
        <div className="max-w-5xl mx-auto px-4 py-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="flex items-center justify-between mb-8">
            <motion.button whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-full bg-white border-2 hover:bg-[#131313] hover:text-white transition-colors"
              style={{ borderColor: "#131313" }}>
              <ArrowLeft size={15} /> Back
            </motion.button>

            <div className="flex items-center gap-2.5 select-none">
              <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <rect x="14" y="14" width="36" height="36" rx="7" transform="rotate(12 32 32)" fill="#E2231A" />
                <rect x="26.5" y="26.5" width="11" height="11" rx="2.5" transform="rotate(12 32 32)" fill="#F2EEE5" />
              </svg>
              <span className="font-display text-xl tracking-wide">
                RB<span style={{ color: "#E2231A" }}>STARS</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "#00875A" }}>
              <Lock size={12} strokeWidth={2.5} />
              <span className="hidden sm:inline">Secure Checkout</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-5">

            {/* LEFT — forms */}
            <div className="space-y-3.5 order-2 lg:order-1">

              {/* Contact */}
              <Accordion
                open={true} onToggle={() => {}}
                title="Contact"
                iconEl={<Mail size={14} />}
                delay={0.07}
              >
                <div className="pt-3">
                  <Input label="Email Address" placeholder="you@example.com" value={email} onChange={setEmail} icon={<Mail size={15} />} type="text" error={errors.email} />
                </div>
              </Accordion>

              {/* Billing */}
              <Accordion
                open={billingOpen} onToggle={() => setBillingOpen(o => !o)}
                title="Billing Address"
                badge={<span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full" style={{ background: "#F2EEE5", border: "1.5px solid #131313" }}>Optional</span>}
                iconEl={<MapPin size={14} />}
                subtitle={!billingOpen && addr1 ? <span className="text-xs" style={{ color: "#8a8375" }}>{addr1}{city ? `, ${city}` : ""}</span> : undefined}
                delay={0.12}
              >
                <div className="space-y-3 pt-3">
                  <Input label="Full Name" placeholder="John Doe" value={billName} onChange={setBillName} icon={<User size={15} />} />
                  <Input label="Address Line 1" placeholder="123 Main Street" value={addr1} onChange={setAddr1} icon={<MapPin size={15} />} />
                  <Input label="Address Line 2" placeholder="Apt, Suite (optional)" value={addr2} onChange={setAddr2} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="City" placeholder="New York" value={city} onChange={setCity} />
                    <Input label="State / Province" placeholder="NY" value={stateVal} onChange={setStateVal} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="ZIP / Postal Code" placeholder="10001" value={zip} onChange={setZip} mode="numeric" />
                    <SelectInput label="Country" value={country} onChange={setCountry} options={COUNTRIES} />
                  </div>
                </div>
              </Accordion>

              {/* Express checkout */}
              <motion.div
                initial={false}
                animate={{
                  opacity: eceAvailable === true ? 1 : 0,
                  height: eceCollapsed ? 0 : "auto",
                }}
                transition={{ opacity: { duration: 0.38 }, height: { duration: 0.3 } }}
                className="rounded-2xl overflow-hidden bg-white"
                style={{
                  border: eceAvailable === true ? "2px solid #131313" : "none",
                  pointerEvents: eceAvailable === true ? "auto" : "none",
                }}
              >
                <div className="px-4 py-3 border-b-2" style={{ borderColor: "#131313" }}>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#6B655C" }}>Express Checkout</p>
                </div>
                <div className="px-4 py-3" style={{ minHeight: 68 }}>
                  <div ref={eceContainerRef} />
                </div>
                <div className="flex items-center gap-3 px-4 pb-3">
                  <div className="flex-1 h-[2px]" style={{ background: "rgba(19,19,19,.15)" }} />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#8a8375" }}>or pay with card</span>
                  <div className="flex-1 h-[2px]" style={{ background: "rgba(19,19,19,.15)" }} />
                </div>
              </motion.div>

              {/* Card */}
              <Accordion
                open={openPayment === "card"}
                onToggle={() => setOpenPayment("card")}
                title="Credit / Debit Card"
                iconEl={<RadioDot selected={openPayment === "card"} />}
                headerRight={<BrandIconRow activeBrand={brand} />}
                delay={0.16}
              >
                <div className="space-y-3 pt-3">
                  <div>
                    <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] block mb-1.5" style={{ color: "#6B655C" }}>Card Number</label>
                    <div className="flex items-center gap-2 px-3.5 rounded-xl bg-white" style={{ border: `2px solid ${errors.cardNum ? "#E2231A" : "#131313"}`, minHeight: 48 }}>
                      <div ref={cardNumDivRef} className="flex-1 py-3" />
                      <AnimatePresence>
                        {brand && (
                          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                            {brand === "visa"       && <VisaIcon w={30} />}
                            {brand === "mastercard" && <MastercardIcon w={30} />}
                            {brand === "amex"       && <AmexIcon w={30} />}
                            {brand === "discover"   && <DiscoverIcon w={30} />}
                            {brand === "unionpay"   && <UnionPayIcon w={30} />}
                            {brand === "maestro"    && <MaestroIcon w={30} />}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {errors.cardNum && <p className="mt-1 font-mono text-[11px]" style={{ color: "#E2231A" }}>{errors.cardNum}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] block mb-1.5" style={{ color: "#6B655C" }}>Expiry</label>
                      <div className="px-3.5 rounded-xl bg-white" style={{ border: `2px solid ${errors.expiry ? "#E2231A" : "#131313"}`, minHeight: 48 }}>
                        <div ref={cardExpDivRef} className="py-3" />
                      </div>
                      {errors.expiry && <p className="mt-1 font-mono text-[11px]" style={{ color: "#E2231A" }}>{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] block mb-1.5" style={{ color: "#6B655C" }}>Security Code</label>
                      <div className="px-3.5 rounded-xl bg-white" style={{ border: `2px solid ${errors.cvv ? "#E2231A" : "#131313"}`, minHeight: 48 }}>
                        <div ref={cardCvvDivRef} className="py-3" />
                      </div>
                      {errors.cvv && <p className="mt-1 font-mono text-[11px]" style={{ color: "#E2231A" }}>{errors.cvv}</p>}
                    </div>
                  </div>
                  <Input label="Name on Card" placeholder="As it appears on your card" value={cardName} onChange={setCardName} icon={<User size={15} />} error={errors.cardName} />
                  <CardPreview cardNum="" expiry="" cardName={cardName} brand={brand} />
                </div>
              </Accordion>

              {errors.payment && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-white"
                  style={{ border: "2px solid #E2231A" }}
                >
                  <AlertCircle size={15} style={{ color: "#E2231A" }} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-snug font-medium" style={{ color: "#E2231A" }}>{errors.payment}</p>
                </motion.div>
              )}

              {/* Pay button */}
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="relative">
                <BurstParticles active={burst} />
                <motion.button
                  animate={burst ? { scale: [1, 1.07, 0.97, 1.03, 1] } : { scale: 1 }}
                  whileHover={!loading ? { translateX: -2, translateY: -2, boxShadow: "8px 8px 0 #131313" } : {}}
                  whileTap={!loading ? { translateX: 2, translateY: 2, boxShadow: "2px 2px 0 #131313" } : {}}
                  onClick={handlePay}
                  disabled={loading}
                  className="relative w-full rounded-2xl font-mono font-semibold uppercase tracking-[0.12em] text-white flex items-center justify-center gap-3 text-base border-[3px]"
                  style={{ background: loading ? "#131313" : "#E2231A", padding: "18px 0", borderColor: "#131313", boxShadow: "5px 5px 0 #131313", transition: "background .3s" }}>
                  {loading ? (
                    <><Loader2 size={20} className="animate-spin" /><span>Processing Payment…</span></>
                  ) : (
                    <><Lock size={17} /><span>{`Pay — $${finalTotal.toFixed(2)}`}</span><ChevronRight size={17} /></>
                  )}
                </motion.button>
                <p className="text-center mt-3 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "#8a8375" }}>
                  <Shield size={10} /> 256-bit SSL encrypted · Powered by Stripe
                </p>
              </motion.div>
            </div>

            {/* RIGHT — Order summary */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-6 rounded-2xl overflow-hidden bg-white" style={{ border: "2.5px solid #131313", boxShadow: "6px 6px 0 #131313" }}>

                {/* Summary header */}
                <button onClick={() => setSummaryOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left" style={{ borderBottom: summaryOpen ? "2px solid #131313" : "none" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-2" style={{ borderColor: "#131313", background: "#F7F4EC" }}>
                      <Package size={13} />
                    </div>
                    <div>
                      <p className="font-display text-base uppercase leading-none">Order Summary</p>
                      <p className="font-mono text-[10px] mt-1" style={{ color: "#6B655C" }}>
                        {items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-display text-lg leading-none">${finalTotal.toFixed(2)}</p>
                      {discount > 0 && <p className="text-[10px] line-through mt-0.5" style={{ color: "#8a8375" }}>${totalPrice.toFixed(2)}</p>}
                    </div>
                    <motion.div animate={{ rotate: summaryOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
                      <ChevronDown size={16} />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {summaryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: "hidden" }}>

                      {/* Items */}
                      <div className="px-5 py-3 space-y-3 max-h-52 overflow-y-auto">
                        <AnimatePresence initial={false}>
                        {items.map((item, i) => (
                          <motion.div key={item.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8, scale: 0.95 }} transition={{ delay: 0.04 + i * 0.04 }} className="flex items-center gap-3">
                            <div className="relative flex-shrink-0" style={{ width: 42, height: 42 }}>
                              <div className="w-full h-full rounded-lg overflow-hidden relative border-2" style={{ borderColor: "#131313", background: item.bgImageUrl ? undefined : (item.gradient[0] || "#E2231A") }}>
                                {item.bgImageUrl ? (
                                  <>
                                    <img src={item.bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0" style={{ background: "rgba(19,19,19,.22)" }} />
                                  </>
                                ) : (
                                  <div className="absolute inset-0 pattern-dots-light opacity-60" />
                                )}
                                {item.image && (
                                  <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-contain" style={{ padding: "3px" }} />
                                )}
                              </div>
                              {item.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-md font-mono text-[9px] font-bold text-white flex items-center justify-center border-2"
                                  style={{ background: "#E2231A", borderColor: "#131313" }}>
                                  {item.quantity}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{item.name}</p>
                              {item.originalPrice && <p className="text-[10px] line-through" style={{ color: "#8a8375" }}>${item.originalPrice.toFixed(2)}</p>}
                            </div>
                            <span className="text-sm font-bold flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => removeItem(item.id)}
                              aria-label="Remove item"
                              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#E2231A] hover:text-white transition-colors"
                              style={{ background: "#F2EEE5" }}
                            >
                              <X size={10} strokeWidth={2.5} />
                            </motion.button>
                          </motion.div>
                        ))}
                        </AnimatePresence>
                      </div>

                      {/* Promo */}
                      <div className="px-5 py-3" style={{ borderTop: "2px dashed rgba(19,19,19,.25)" }}>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "#6B655C" }}>Discount Code</p>
                        <PromoInput applied={promo} onApply={setPromo} onRemove={() => setPromo(null)} />
                      </div>

                      {/* Totals */}
                      <div className="px-5 py-3 space-y-2" style={{ borderTop: "2px dashed rgba(19,19,19,.25)" }}>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: "#6B655C" }}>Subtotal</span>
                          <span className="text-xs font-semibold">${totalPrice.toFixed(2)}</span>
                        </div>
                        <AnimatePresence>
                          {discount > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex justify-between">
                              <span className="text-xs flex items-center gap-1" style={{ color: "#6B655C" }}>
                                <Tag size={9} />
                                {promo?.type === "percent" ? `${promo.value}% off` : "Discount"} ({promo?.code})
                              </span>
                              <span className="text-xs font-bold" style={{ color: "#00875A" }}>-${discount.toFixed(2)}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: "#6B655C" }}>Delivery</span>
                          <span className="text-xs font-bold" style={{ color: "#00875A" }}>FREE</span>
                        </div>
                        <div className="flex justify-between items-center pt-2" style={{ borderTop: "2px solid #131313" }}>
                          <span className="font-display text-base uppercase">Total</span>
                          <div className="text-right">
                            <p className="font-display text-2xl leading-none">${finalTotal.toFixed(2)}</p>
                            {discount > 0 && <p className="text-[10px] line-through mt-0.5" style={{ color: "#8a8375" }}>${totalPrice.toFixed(2)}</p>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Trust badges */}
                <div className="px-5 py-3 grid grid-cols-3 gap-2" style={{ borderTop: "2.5px solid #131313", background: "#F7F4EC" }}>
                  {[{ icon: <Zap size={13} />, label: "Instant Delivery" }, { icon: <Shield size={13} />, label: "100% Secure" }, { icon: <Star size={13} fill="#FFC800" />, label: "5★ Rated" }].map((b, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 py-1.5">
                      <div>{b.icon}</div>
                      <span className="text-center font-mono text-[8px] font-bold uppercase tracking-[0.12em]" style={{ color: "#6B655C" }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
}
