import { useState, useEffect, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Check, Star,
  ChevronRight, ChevronDown, Package, AlertCircle,
  User, Mail, MapPin, Tag, X, Loader2, MessageSquare,
  Box, Globe, HelpCircle,
  Headphones, ShieldCheck, Truck,
} from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { RBstar, ItemTileGlyph, MailboxGlyph } from "@/components/Art";
import { TopNav, SiteFooter } from "./Home";

/* ─────────────────────────────────────────────────────────────────────────
   CHECKOUT — dark-navy marketplace theme (same tokens as Home / shop /
   product / cart). All logic (Stripe, promo, tax, ECE, gift cards, billing)
   is unchanged; only the colours moved from the white storefront palette to
   the RoGoat navy. This local `P` shadows the old import so every `P.*`
   reference below resolves to the dark tokens.
   ───────────────────────────────────────────────────────────────────────── */
const P = {
  bg: "#111a2b", band: "#151f38", stage: "#16213c", card: "#1b2745",
  border: "#2a3a60", borderStrong: "#38497a",
  text: "#ffffff", muted: "#a9b3d3", faint: "#8a97ba",
  accent: "#2f8cff", accentDeep: "#0a84ff", accentTint: "rgba(47,140,255,0.16)",
  star: "#FFC53D", starOff: "#3a4a72",
  shadow: "0 8px 24px rgba(0,0,0,0.35)",
  good: "#5fe08e", warn: "#f59e0b", warnTint: "rgba(245,158,11,0.14)",
  bad: "#ff5a4d", badTint: "rgba(239,68,68,0.14)",
  goodTint: "rgba(95,224,142,0.16)",
  shadowSoft: "0 6px 18px rgba(10,110,255,0.35)",
};

const coCSS = `
.co-page{position:relative;min-height:100vh;color:#fff;font-family:Inter,system-ui,sans-serif;
  background:
    radial-gradient(900px 620px at 0% 0%,#1a2b52,transparent 68%),
    radial-gradient(820px 720px at 100% 18%,#15264a,transparent 70%),
    radial-gradient(700px 600px at 82% 92%,#16233f,transparent 70%),
    #111a2b}
.co-page *{box-sizing:border-box}
.co-inner{padding-bottom:24px}
/* Stripe dropdown options render natively — give them the dark surface */
.co-page select option{background:#1b2745;color:#fff}
/* Custom scrollbar to match the shop/product rails */
.co-page ::-webkit-scrollbar{width:9px;height:9px}
.co-page ::-webkit-scrollbar-thumb{background:#2f8cff;border-radius:5px}
.co-page ::-webkit-scrollbar-track{background:#17223d;border-radius:5px}
@media(prefers-reduced-motion:reduce){.co-page *,.co-page *::before,.co-page *::after{animation:none!important;transition:none!important}}
`;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

function fmt4(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}
function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}
function fmtCvv(v: string) { return v.replace(/\D/g, "").slice(0, 4); }

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unionpay" | "maestro" | null;
function detectBrand(num: string): CardBrand {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  if (/^62/.test(n)) return "unionpay";
  if (/^6(?:304|759|761|762|763)/.test(n)) return "maestro";
  return null;
}

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
      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: P.accentTint, color: P.accentDeep }}>
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
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: P.faint }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200"
        style={{
          background: P.card,
          border: `1.5px solid ${error ? "rgba(255,90,77,0.5)" : focused ? P.accentDeep : P.borderStrong}`,
          boxShadow: focused ? `0 0 0 4px ${error ? "rgba(255,90,77,0.10)" : "rgba(47,140,255,0.18)"}` : "none",
        }}
      >
        {icon && <span style={{ color: focused ? P.accentDeep : P.faint, flexShrink: 0 }}>{icon}</span>}
        <input
          type={type} inputMode={mode} placeholder={placeholder} value={value} maxLength={maxLen}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-[#8a97ba] min-w-0"
          style={{ color: P.text }}
        />
        {right}
      </div>
      {error && <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: P.bad }}><AlertCircle size={10} />{error}</p>}
      {hint && !error && <p className="text-[10px] mt-0.5" style={{ color: P.faint }}>{hint}</p>}
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
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: P.faint }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 rounded-xl transition-all duration-200"
        style={{
          background: P.card,
          border: `1.5px solid ${error ? "rgba(255,90,77,0.5)" : focused ? P.accentDeep : P.borderStrong}`,
          boxShadow: focused ? "0 0 0 4px rgba(47,140,255,0.18)" : "none",
        }}
      >
        {icon && <span style={{ color: P.faint, flexShrink: 0 }}>{icon}</span>}
        <select
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium py-3 appearance-none cursor-pointer"
          style={{ color: value ? P.text : P.faint }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#1b2745", color: "#ffffff" }}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} style={{ color: P.faint, flexShrink: 0 }} />
      </div>
      {error && <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: P.bad }}><AlertCircle size={10} />{error}</p>}
    </div>
  );
}

function CardPreview({ cardNum, expiry, cardName, brand }: { cardNum: string; expiry: string; cardName: string; brand: CardBrand }) {
  if (!cardNum && !expiry && !cardName) return null;

  /* The card face is brand artwork, not page decoration — each network's own
     flat colour, the same hexes its icon already uses. Flat, no gradients. */
  const themes: Record<string, { bg: string }> = {
    visa:       { bg: "#1a1f71" },
    mastercard: { bg: "#1c1c1e" },
    amex:       { bg: "#007bc1" },
    discover:   { bg: "#c2410c" },
    unionpay:   { bg: "#e41e26" },
    maestro:    { bg: "#0a0a0a" },
  };
  const bg = brand ? themes[brand].bg : "#1b2745";

  const masked = cardNum
    ? cardNum.split(" ").map((g, i) => i < 2 ? g.replace(/\d/g, "•") : g).join("  ")
    : "••••  ••••  ••••  ••••";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative mt-4 rounded-2xl overflow-hidden select-none"
      style={{ background: bg, border: `1px solid ${P.border}`, aspectRatio: "1.586", width: "100%" }}
    >
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        {}
        <div className="flex items-start justify-between">
          {}
          <div className="relative" style={{ width: 40, height: 30 }}>
            <div className="absolute inset-0 rounded-md" style={{ background: "#d4a843", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
            <div className="absolute inset-0 rounded-md overflow-hidden">
              <div className="absolute w-full" style={{ top: "33%", height: "1px", background: "rgba(0,0,0,0.25)" }} />
              <div className="absolute w-full" style={{ top: "66%", height: "1px", background: "rgba(0,0,0,0.25)" }} />
              <div className="absolute h-full" style={{ left: "33%", width: "1px", background: "rgba(0,0,0,0.25)" }} />
              <div className="absolute h-full" style={{ left: "66%", width: "1px", background: "rgba(0,0,0,0.25)" }} />
              <div className="absolute rounded-sm" style={{ top: "22%", left: "22%", right: "22%", bottom: "22%", background: "rgba(0,0,0,0.1)" }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {}
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none" opacity="0.6">
              <path d="M9 11c0-1.1.9-2 2-2" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M9 11c0-2.2 1.8-4 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M9 11c0-3.3 2.7-6 6-6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            {}
            <div>
              {brand === "visa"       && <VisaIcon w={44} />}
              {brand === "mastercard" && <MastercardIcon w={44} />}
              {brand === "amex"       && <AmexIcon w={44} />}
              {brand === "discover"   && <DiscoverIcon w={44} />}
              {brand === "unionpay"   && <UnionPayIcon w={44} />}
              {brand === "maestro"    && <MaestroIcon w={44} />}
              {!brand && (
                <div className="rounded-md flex items-center justify-center" style={{ width: 44, height: 28, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <span className="text-[8px] font-extrabold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>CARD</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        {/* tighter tracking on phones: the spaced-out mask was ~228px wide and
            clipped the ~240px card art below ~360px */}
        <p className="font-mono text-white tracking-[0.1em] text-[13px] sm:tracking-[0.2em] sm:text-[15px] font-semibold drop-shadow whitespace-nowrap">
          {masked}
        </p>

        {}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[8px] uppercase tracking-[0.15em] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Card Holder</p>
            <p className="text-[13px] font-extrabold uppercase tracking-wide text-white truncate max-w-[145px] drop-shadow">{cardName || "YOUR NAME"}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-[0.15em] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Expires</p>
            <p className="text-[13px] font-extrabold text-white drop-shadow">{expiry || "MM / YY"}</p>
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
  const [showGiftCards, setShowGiftCards] = useState(false);

  const giftCards = (() => {
    try {
      const raw = localStorage.getItem("rbstars_gift_card");
      if (!raw) return [];
      const card = JSON.parse(raw);
      if (card.used) return [];
      return [card];
    } catch { return []; }
  })();

  function applyGiftCard(card: { code: string; type: string; value: number }) {
    onApply({ code: card.code, type: card.type as "percent" | "fixed", value: card.value });
    setCode("");
    setShowGiftCards(false);
  }

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

  const [focused, setFocused] = useState(false);

  if (applied) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-between px-3.5 py-3 rounded-xl"
        style={{ background: P.card, border: `1.5px solid ${P.border}`, boxShadow: P.shadow }}>
        <div className="flex items-center gap-2">
          <Check size={14} color={P.good} />
          <span className="text-sm font-extrabold" style={{ color: P.text }}>{applied.code}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: P.badTint, color: P.bad }}>
            {applied.type === "percent" ? `-${applied.value}%` : `-$${applied.value}`}
          </span>
        </div>
        <button onClick={onRemove}><X size={14} color={P.muted} /></button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1 relative">
      <div className="relative flex items-center rounded-xl overflow-hidden transition-all duration-200"
        style={{ background: P.card, border: `1.5px solid ${focused ? P.accentDeep : P.borderStrong}`, boxShadow: focused ? "0 0 0 4px rgba(47,140,255,0.18)" : "none" }}>
        <input
          placeholder="Discount code or gift card"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }}
          onFocus={() => { setFocused(true); if (giftCards.length > 0) setShowGiftCards(true); }}
          onBlur={() => { setFocused(false); setTimeout(() => setShowGiftCards(false), 200); }}
          onKeyDown={e => e.key === "Enter" && handleApply()}
          /* pr-[96px] reserves the Apply button's footprint — without it the
             placeholder slid underneath the button below ~400px */
          className="flex-1 min-w-0 bg-transparent outline-none text-sm font-bold tracking-wide placeholder:text-[#8a97ba] placeholder:font-bold placeholder:text-sm px-5 pr-[96px] py-[18px]"
          style={{ color: P.text }}
        />
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          onClick={handleApply} disabled={loading || !code.trim()}
          className="absolute right-0 top-0 bottom-0 px-6 font-extrabold text-sm flex items-center justify-center rounded-r-[11px] transition-colors"
          style={{
            background: loading || !code.trim() ? P.band : P.accentDeep,
            color: loading || !code.trim() ? P.faint : "#fff",
            boxShadow: loading || !code.trim() ? "none" : "0 6px 16px rgba(10,90,220,.35)",
          }}>
          {loading ? (
            <motion.span className="flex items-center" animate={{ scale: [1, 1.16, 1] }}
              transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}>
              <RBstar size={14} color={P.star} />
            </motion.span>
          ) : "Apply"}
        </motion.button>
      </div>

      {/* Gift card dropdown */}
      {showGiftCards && giftCards.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden"
          style={{ background: P.card, border: `1.5px solid ${P.border}`, boxShadow: "0 14px 36px rgba(0,0,0,0.45)" }}>
          <div className="px-3 py-2" style={{ borderBottom: `1px solid ${P.border}`, background: P.band }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: P.faint }}>Available Gift Cards</p>
          </div>
          {giftCards.map((card: any) => (
            <button key={card.code} onClick={() => applyGiftCard(card)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#1f2f52]">
              <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: P.band, border: `1px solid ${P.border}` }}>
                <img src="/IMG_0750.png" alt="" className="w-full h-full object-contain" />
              </div>
                <div>
                  <p className="text-xs font-extrabold" style={{ color: P.text }}>{card.code}</p>
                  <p className="text-[10px]" style={{ color: P.faint }}>{card.label}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: P.badTint, color: P.bad }}>
                -{card.value}%
              </span>
            </button>
          ))}
        </motion.div>
      )}

      {err && <p className="text-[11px] flex items-center gap-1" style={{ color: P.bad }}><AlertCircle size={10} />{err}</p>}
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
            className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
            style={{ width: i % 3 === 0 ? 10 : 6, height: i % 3 === 0 ? 10 : 6, marginLeft: i % 3 === 0 ? -5 : -3, marginTop: i % 3 === 0 ? -5 : -3, background: [P.bad, P.star, P.accentDeep, P.good, P.faint, P.accent][i % 6], zIndex: 200 }}
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
      style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(24px)" }}>
      <motion.div
        initial={{ scale: 0.75, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
        className="w-full max-w-sm text-center">

        {}
        <div className="relative flex items-center justify-center mb-6">
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 2.5 + i * 0.6, opacity: 0 }}
              transition={{ duration: 1.3, delay: 0.2 + i * 0.15, repeat: Infinity, repeatDelay: 1.2 }}
              className="absolute w-20 h-20 rounded-full border-2"
              style={{ borderColor: i === 0 ? P.accent : i === 1 ? P.star : P.bad }} />
          ))}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
            className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: P.good, boxShadow: "0 0 40px rgba(95,224,142,0.45)" }}>
            <Check size={38} color="white" strokeWidth={3} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h2 className="text-3xl font-extrabold mb-1" style={{ color: P.text }}>Order Confirmed!</h2>
          <p className="text-sm mb-5" style={{ color: P.accentDeep }}>
            Confirmation sent to <span className="font-bold" style={{ color: P.text }}>{email || "your email"}</span>
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="rounded-2xl p-4 mb-4 text-left relative overflow-hidden"
            style={{ background: P.card, border: `1.5px solid ${P.border}`, boxShadow: P.shadow }}
          >
            <div className="flex items-start gap-3 relative">
              <motion.div
                animate={{ scale: [1, 1.12, 1], boxShadow: ["0 0 0px rgba(47,140,255,0)", "0 0 18px rgba(47,140,255,0.7)", "0 0 0px rgba(47,140,255,0)"] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: P.accentDeep }}
              >
                <MessageSquare size={18} color="white" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold mb-1" style={{ color: P.text }}>Get Your Items Now</p>
                <p className="text-xs leading-relaxed" style={{ color: P.muted }}>
                  Click on the{" "}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md mx-0.5 font-bold"
                    style={{ background: P.accentTint, color: P.accentDeep, verticalAlign: "middle" }}>
                    <MessageSquare size={9} /> chat
                  </span>{" "}
                  icon in the corner to open live chat, provide your details and our claim team will contact you shortly!
                </p>
              </div>
            </div>

            <motion.div
              animate={{ x: [0, 4, 0], y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              className="absolute bottom-3 right-3 text-lg"
              style={{ color: P.faint }}
            >
              ↘
            </motion.div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="w-full py-3.5 rounded-2xl font-extrabold"
            style={{ background: P.accentTint, color: P.accentDeep, border: "1px solid rgba(47,140,255,0.3)" }}>
            Back to Store
          </motion.button>
        </motion.div>
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

  useEffect(() => {
    const stored = localStorage.getItem("rbstars_gift_card");
    if (stored && !promo) {
      try {
        const card = JSON.parse(stored);
        if (!card.used) {
          setPromo({ code: card.code, type: card.type, value: card.value });
        }
      } catch {}
      return; // gift card wins; a saved win stays saved for next order
    }
    // Auto-apply the latest spin/level win — validated server-side first, so
    // an expired or already-used code never shows a fake discount.
    const won = localStorage.getItem("rbstars_won_promo");
    if (won && !promo) {
      try {
        const w = JSON.parse(won);
        if (w?.code) {
          fetch(`${BACKEND_URL}/api/promo/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: w.code }),
          })
            .then((r) => {
              if (r.status >= 400 && r.status < 500) {
                localStorage.removeItem("rbstars_won_promo"); // expired or used up
                return null;
              }
              return r.json();
            })
            .then((res) => {
              const d = res?.data;
              if (d?.code && d?.discountType) {
                setPromo({ code: d.code, type: d.discountType, value: d.discountValue });
              }
            })
            .catch(() => {}); // offline — keep it and retry next visit
        }
      } catch {}
    }
  }, []);
  const discount = promo
    ? promo.type === "percent" ? totalPrice * (promo.value / 100) : Math.min(promo.value, totalPrice)
    : 0;

  // Sales tax is charged on the discounted amount, matching the backend's
  // buildPricing() exactly. This is DISPLAY ONLY — the Stripe amount always
  // comes from the server, so a tampered response cannot change what's charged.
  const [tax, setTax] = useState<{ enabled: boolean; rate: number; label: string }>({
    enabled: false, rate: 0, label: "Sales Tax",
  });
  useEffect(() => {
    let alive = true;
    fetch(`${BACKEND_URL}/api/settings/tax`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (alive && json?.data) setTax(json.data);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const taxableAmount = Math.max(0, totalPrice - discount);
  const taxAmount = tax.enabled && tax.rate > 0
    ? Math.round(taxableAmount * (tax.rate / 100) * 100) / 100
    : 0;
  const finalTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

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
  // One-shot submit guard, shared by both payment paths — a Pay-button double
  // click OR a double ECE confirm used to create two PaymentIntents/Orders.
  const submittingRef = useRef(false);
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
      if (submittingRef.current) return;
      submittingRef.current = true;
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
          total: finalTotalRef.current,
          items: currentItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, gradient: i.gradient })),
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
        try {
          const gcRaw = localStorage.getItem("rbstars_gift_card");
          if (gcRaw) {
            const gc = JSON.parse(gcRaw);
            gc.used = true;
            localStorage.setItem("rbstars_gift_card", JSON.stringify(gc));
          }
        } catch {}
        navigate("/order-success");
      } catch (err) {
        setErrors({ payment: err instanceof Error ? err.message : "Payment failed. Please try again." });
      } finally {
        submittingRef.current = false;
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
    /* PRESENTATION ONLY. Stripe's own field styling — the same font and size
       as before, with the text colour flipped so typed card details stay
       readable on the white inputs. Mounting, events and amounts untouched. */
    const baseStyle = {
      style: {
        base: {
          color: "#e6ecff",
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: "14px",
          fontSmoothing: "antialiased",
          "::placeholder": { color: "#8a97ba" },
        },
        invalid: { color: "#ff5a4d" },
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
    // Guard BEFORE any await — a second click in the burst window used to
    // create a second PaymentIntent.
    if (submittingRef.current) return;
    submittingRef.current = true;

    // Read through the ref: this callback may have been created before the
    // register-through-checkout login finished, which used to fall back to the
    // typed email as the Roblox username on first checkout.
    const currentUser = userRef.current;
    const customerInfo = {
      email: currentUser?.email || emailRef.current,
      robloxUsername: currentUser?.robloxUsername || emailRef.current,
    };
    const cartPayload = items.map((i) => ({ id: i.id, quantity: i.quantity }));

    // Disable the button before the 320ms burst, not after it.
    setLoading(true);
    setBurst(true);
    await new Promise((r) => setTimeout(r, 320));
    setBurst(false);

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
        total: finalTotalRef.current,
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, gradient: i.gradient })),
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
      submittingRef.current = false;
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
      <div className="co-page">
        <style>{coCSS}</style>
        <TopNav onHome={() => navigate("/")} />
        <div className="min-h-[68vh] flex flex-col items-center justify-center gap-5 px-6">
          {/* Honest empty state: the unit of commerce, with nothing in it. */}
          <span className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: P.accentTint, border: "1px solid rgba(47,140,255,0.3)" }}>
            <ItemTileGlyph className="w-10 h-10" />
          </span>
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-black font-mont" style={{ color: P.text }}>Your cart is empty</h2>
            <p className="text-sm" style={{ color: P.muted }}>Browse the store and add the items you want first.</p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="px-8 py-3.5 rounded-2xl font-black text-sm"
            style={{ background: "linear-gradient(180deg,#0a84ff,#0a50d6)", color: "#fff", boxShadow: "0 6px 18px rgba(10,110,255,.35)" }}>
            Browse Items
          </motion.button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="co-page">
      <style>{coCSS}</style>
      <TopNav onHome={() => navigate("/")} />

      <div className="co-inner">
        {/* ── LAYOUT ── */}
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 px-6 md:px-16 py-10 lg:py-14 lg:max-w-[860px]">

            {/* Express Checkout */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mb-8">
              <p className="text-center text-sm font-semibold mb-4" style={{ color: P.faint }}>Express checkout</p>
              <div className="flex gap-3">
                <motion.div initial={false}
                  animate={{ opacity: eceAvailable === true ? 1 : 0, height: eceCollapsed ? 0 : "auto" }}
                  transition={{ opacity: { duration: 0.38 }, height: { duration: 0.3 } }}
                  className="flex-1"
                  style={{ pointerEvents: eceAvailable === true ? "auto" : "none" }}
                >
                  <div ref={eceContainerRef} style={{ minHeight: 52 }} />
                </motion.div>
              </div>
            </motion.div>

            {/* OR Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px" style={{ background: P.border }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: P.faint }}>OR</span>
              <div className="flex-1 h-px" style={{ background: P.border }} />
            </div>

            {/* Contact */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-8">
              <h2 className="text-xl font-extrabold mb-4" style={{ color: P.text }}>Contact Email <span className="text-sm font-semibold" style={{ color: P.faint }}>(Used for Delivery)</span></h2>
              <div className="relative">
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-shadow focus-within:ring-4 focus-within:ring-[#2f8cff]/25"
                  style={{ background: P.card, border: `1.5px solid ${errors.email ? "rgba(255,90,77,0.5)" : P.borderStrong}` }}>
                  <Mail size={16} style={{ color: P.faint, flexShrink: 0 }} />
                  <input type="email" placeholder="you@example.com" value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-[#8a97ba] min-w-0"
                    style={{ color: P.text }} />
                </div>
                {errors.email && <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: P.bad }}><AlertCircle size={10} />{errors.email}</p>}
              </div>
              <label className="flex items-start gap-3 mt-4 cursor-pointer select-none group">
                <input type="checkbox" defaultChecked
                  className="mt-1 w-4 h-4 rounded accent-[#0a84ff] cursor-pointer" />
                <span className="text-sm leading-relaxed group-hover:text-white transition-colors" style={{ color: P.muted }}>
                  Get exclusive discounts and offers on Roblox items. Check your email to confirm your subscription!
                </span>
              </label>
            </motion.div>

            {/* Payment */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-8">
              <h2 className="text-xl font-extrabold mb-1.5" style={{ color: P.text }}>Payment</h2>
              <p className="text-sm mb-5" style={{ color: P.faint }}>All transactions are secure and encrypted.</p>

              {/* Credit card method */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow, overflow: "visible" }}>
                <div className="flex items-center gap-3.5 p-4 rounded-xl mb-4" style={{ background: P.accentTint, border: `1.5px solid ${P.accent}` }}>
                  <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0" style={{ border: `2px solid ${P.accentDeep}`, background: P.accentDeep }}>
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-sm font-bold flex-1" style={{ color: P.text }}>Credit card</span>
                  <img src="/payment-cards.png" alt="Visa, Mastercard, American Express" className="h-8 shrink-0 rounded-md object-contain" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.36))" }} />
                </div>

                {/* Card fields */}
                <div className="space-y-3" style={{ position: "relative", zIndex: 1 }}>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: P.faint }}>Card number</label>
                    <div className="relative flex items-center gap-2 px-4 rounded-xl" style={{ background: P.card, border: `1.5px solid ${errors.cardNum ? "rgba(255,90,77,0.5)" : P.borderStrong}`, minHeight: 48, overflow: "visible" }}>
                      <div ref={cardNumDivRef} className="flex-1 py-3" style={{ position: "relative", zIndex: 2 }} />
                      <Lock size={14} style={{ color: P.faint, flexShrink: 0 }} />
                    </div>
                    {errors.cardNum && <p className="text-[11px] mt-1" style={{ color: P.bad }}>{errors.cardNum}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: P.faint }}>Expiration</label>
                      <div className="relative px-4 rounded-xl" style={{ background: P.card, border: `1.5px solid ${errors.expiry ? "rgba(255,90,77,0.5)" : P.borderStrong}`, minHeight: 48, overflow: "visible" }}>
                        <div ref={cardExpDivRef} className="py-3" style={{ position: "relative", zIndex: 2 }} />
                      </div>
                      {errors.expiry && <p className="text-[11px] mt-1" style={{ color: P.bad }}>{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: P.faint }}>Security code</label>
                      <div className="relative flex items-center gap-2 px-4 rounded-xl" style={{ background: P.card, border: `1.5px solid ${errors.cvv ? "rgba(255,90,77,0.5)" : P.borderStrong}`, minHeight: 48, overflow: "visible" }}>
                        <div ref={cardCvvDivRef} className="flex-1 py-3" style={{ position: "relative", zIndex: 2 }} />
                        <HelpCircle size={14} style={{ color: P.faint, flexShrink: 0 }} />
                      </div>
                      {errors.cvv && <p className="text-[11px] mt-1" style={{ color: P.bad }}>{errors.cvv}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: P.faint }}>Name on card</label>
                    <div className="flex items-center gap-3 px-4 rounded-xl" style={{ background: P.card, border: `1.5px solid ${errors.cardName ? "rgba(255,90,77,0.5)" : P.borderStrong}`, minHeight: 48 }}>
                      <User size={15} style={{ color: P.faint, flexShrink: 0 }} />
                      <input type="text" placeholder="As it appears on your card" value={cardName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCardName(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-[#8a97ba] min-w-0"
                        style={{ color: P.text }} />
                    </div>
                    {errors.cardName && <p className="text-[11px] mt-1" style={{ color: P.bad }}>{errors.cardName}</p>}
                  </div>
                </div>
              </div>

              <CardPreview cardNum="" expiry="" cardName={cardName} brand={brand} />
            </motion.div>

            {/* Billing Address */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mb-8">
              <h2 className="text-xl font-extrabold mb-4" style={{ color: P.text }}>Billing address</h2>

              {/* Country selector */}
              <div className="mb-3.5">
                <SelectInput label="Country / Region" value={country} onChange={setCountry} options={COUNTRIES} icon={<Globe size={15} />} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3.5">
                <Input label="First name" placeholder="John" value={billName} onChange={setBillName} />
                <Input label="Last name" placeholder="Doe" value={addr2} onChange={setAddr2} />
              </div>
              <div className="mb-3.5">
                <Input label="Address" placeholder="123 Main Street" value={addr1} onChange={setAddr1} icon={<MapPin size={15} />} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" placeholder="New York" value={city} onChange={setCity} />
                <Input label="Postal code" placeholder="(optional)" value={zip} onChange={setZip} mode="numeric" />
              </div>
            </motion.div>

            <div className="h-px mb-6" style={{ background: P.border }} />

            {/* ── Designed moment: the promise this whole store is built on.
                One mailbox, one strip, right where the buyer decides. ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="flex items-start gap-3.5 p-4 rounded-2xl mb-6"
              style={{ background: "linear-gradient(100deg,rgba(47,140,255,0.12),rgba(47,140,255,0.02) 70%)", border: "1px solid rgba(47,140,255,0.28)", boxShadow: "0 0 26px rgba(47,140,255,0.10)" }}>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: P.card, border: `1px solid ${P.border}` }}>
                <MailboxGlyph size={34} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold" style={{ color: P.text }}>Delivered to your Roblox account</p>
                <p className="text-xs leading-relaxed mt-0.5" style={{ color: P.muted }}>
                  Confirm your Roblox username when you claim — your items are delivered to your in-game mailbox.
                </p>
              </div>
            </motion.div>

            {/* Payment Error */}
            {errors.payment && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-6"
                style={{ background: P.warnTint, border: "1px solid rgba(245,158,11,0.45)" }}>
                <AlertCircle size={15} color={P.warn} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-snug" style={{ color: P.warn }}>{errors.payment}</p>
              </motion.div>
            )}

            {/* Pay Button */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative">
              <BurstParticles active={burst} />
              <motion.button
                animate={burst ? { scale: [1, 1.07, 0.97, 1.03, 1] } : { scale: 1 }}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
                onClick={handlePay}
                disabled={loading}
                className="relative w-full rounded-2xl font-black flex items-center justify-center gap-3 text-base"
                style={{ background: "linear-gradient(180deg,#0a84ff,#0a50d6)", color: "#fff", padding: "18px 0", boxShadow: "0 8px 22px rgba(10,110,255,.4)" }}>
                {loading ? (
                  <>
                    {/* Brand mark instead of a spinner — "the payment is running" */}
                    <motion.span className="flex items-center" animate={{ scale: [1, 1.16, 1] }}
                      transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}>
                      <RBstar size={20} color="#fff" />
                    </motion.span>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>{`Pay — $${finalTotal.toFixed(2)}`}</span>
                )}
              </motion.button>
              <p className="text-center text-[11px] mt-3 flex items-center justify-center gap-1.5" style={{ color: P.faint }}>
                <Shield size={10} /> 256-bit SSL encrypted · Powered by Stripe
              </p>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: ORDER SUMMARY ── */}
          {/* borderLeft is lg-gated: the split only starts at lg, so below it the
              column is full-width and an ungated border drew a stray hairline. */}
          {/* The summary reads as an inset panel beside the form, so it gets
              the band surface and a lg-gated hairline (ungated, below lg the
              full-width column drew a stray line). */}
          <div className="lg:w-[520px] flex-shrink-0 px-6 md:px-10 py-10 lg:py-14 border-t border-[#2a3a60] lg:border-t-0 lg:border-l lg:border-[#2a3a60]"
            style={{ background: P.band }}>
            <div className="lg:sticky lg:top-6">

              {/* Order Items */}
              <div className="mb-6">
                {items.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                    className="flex items-center gap-4 mb-5">
                    <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
                      <div className="w-full h-full rounded-xl overflow-hidden" style={{ background: P.stage, border: `2px solid ${P.border}` }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : item.bgImageUrl ? (
                          <div className="w-full h-full relative">
                            <img src={item.bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.18)" }} />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: item.gradient?.[0] || P.border }}>
                            <Box size={24} color={P.muted} />
                          </div>
                        )}
                      </div>
                      {item.quantity > 1 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[11px] font-extrabold text-white flex items-center justify-center"
                          style={{ background: P.accentDeep, border: `2px solid ${P.band}` }}>
                          {item.quantity}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold truncate" style={{ color: P.text }}>{item.name}</p>
                    </div>
                    <span className="text-base font-extrabold flex-shrink-0" style={{ color: P.text }}>${(item.price * item.quantity).toFixed(2)}</span>
                  </motion.div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <PromoInput applied={promo} onApply={setPromo} onRemove={() => setPromo(null)} />
              </div>

              {/* Tax */}
              {taxAmount > 0 && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-semibold" style={{ color: P.muted }}>
                    {tax.label} ({tax.rate}%)
                  </span>
                  <span className="text-sm font-bold" style={{ color: P.text }}>
                    ${taxAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between py-5" style={{ borderTop: `1px solid ${P.border}` }}>
                <span className="text-2xl font-extrabold" style={{ color: P.text }}>Total</span>
                <div className="text-right flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold" style={{ color: P.faint }}>USD</span>
                  <span className="text-3xl font-extrabold" style={{ color: P.text }}>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Support / Guarantee / Delivery Banner */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl overflow-hidden mt-2"
                style={{ border: `1px solid ${P.border}` }}>
                <img src="/banner-support.jpg" alt="Support, Guarantee, Delivery" className="w-full h-auto object-cover" />
              </motion.div>

            </div>
          </div>

        </div>
      </div>
      <SiteFooter />
    </div>
  );

}
