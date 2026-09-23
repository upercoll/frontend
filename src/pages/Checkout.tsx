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
      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: "rgba(165,180,252,0.12)", color: "#3BA7FF" }}>
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
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#F4F8FB" }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200"
        style={{
          background: "#0C141B",
          border: `1.5px solid ${error ? "rgba(248,113,113,0.6)" : focused ? "#3BA7FF" : "#2C414E"}`,
          boxShadow: focused ? `0 0 0 3px ${error ? "rgba(248,113,113,0.08)" : "rgba(59,167,255,0.12)"}` : "none",
        }}
      >
        {icon && <span style={{ color: focused ? "#3BA7FF" : "#9BAEBB", flexShrink: 0 }}>{icon}</span>}
        <input
          type={type} inputMode={mode} placeholder={placeholder} value={value} maxLength={maxLen}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#637784] min-w-0"
        />
        {right}
      </div>
      {error && <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "#f87171" }}><AlertCircle size={10} />{error}</p>}
      {hint && !error && <p className="text-[10px] mt-0.5" style={{ color: "#637784" }}>{hint}</p>}
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
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#F4F8FB" }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 rounded-xl transition-all duration-200"
        style={{
          background: "#0C141B",
          border: `1.5px solid ${error ? "rgba(248,113,113,0.6)" : focused ? "#3BA7FF" : "#2C414E"}`,
          boxShadow: focused ? "0 0 0 3px rgba(59,167,255,0.12)" : "none",
        }}
      >
        {icon && <span style={{ color: "#9BAEBB", flexShrink: 0 }}>{icon}</span>}
        <select
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium py-3 appearance-none cursor-pointer"
          style={{ color: value ? "white" : "#637784" }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#0C141B", color: "white" }}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} style={{ color: "#637784", flexShrink: 0 }} />
      </div>
      {error && <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "#f87171" }}><AlertCircle size={10} />{error}</p>}
    </div>
  );
}

function CardPreview({ cardNum, expiry, cardName, brand }: { cardNum: string; expiry: string; cardName: string; brand: CardBrand }) {
  if (!cardNum && !expiry && !cardName) return null;

  const themes: Record<string, { bg: string }> = {
    visa:       { bg: "linear-gradient(135deg,#0d1057 0%,#1e3a8a 45%,#3730a3 100%)" },
    mastercard: { bg: "linear-gradient(135deg,#1c1c1e 0%,#3d0000 50%,#7c1d00 100%)" },
    amex:       { bg: "linear-gradient(135deg,#004c87 0%,#0073b7 55%,#00a8e0 100%)" },
    discover:   { bg: "linear-gradient(135deg,#7c2d12 0%,#c2410c 55%,#ea580c 100%)" },
    unionpay:   { bg: "linear-gradient(135deg,#7f1d1d 0%,#1e3a8a 50%,#1e40af 100%)" },
    maestro:    { bg: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)" },
  };
  const bg = brand ? themes[brand].bg : "linear-gradient(135deg,#131C23 0%,#1C2A34 55%,#2C414E 100%)";

  const masked = cardNum
    ? cardNum.split(" ").map((g, i) => i < 2 ? g.replace(/\d/g, "•") : g).join("  ")
    : "••••  ••••  ••••  ••••";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative mt-4 rounded-2xl overflow-hidden select-none"
      style={{ background: bg, aspectRatio: "1.586", width: "100%" }}
    >
      {}
      <div className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg,rgba(255,255,255,.8) 0px,rgba(255,255,255,.8) 1px,transparent 1px,transparent 16px)" }} />
      {}
      <motion.div
        animate={{ x: ["-120%", "220%"] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: "linear", repeatDelay: 2.5 }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.14) 50%,transparent 62%)" }}
      />
      {}
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 opacity-25 rounded-full"
        style={{ background: "radial-gradient(circle,rgba(165,180,252,0.8),transparent 70%)", filter: "blur(20px)" }} />

      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        {}
        <div className="flex items-start justify-between">
          {}
          <div className="relative" style={{ width: 40, height: 30 }}>
            <div className="absolute inset-0 rounded-md" style={{ background: "linear-gradient(135deg,#d4a843,#f0c84a,#c9982a)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
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
        <p className="font-mono text-white tracking-[0.2em] text-[15px] font-semibold drop-shadow">
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
        style={{ background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.35)" }}>
        <div className="flex items-center gap-2">
          <Check size={14} color="#4ade80" />
          <span className="text-sm font-extrabold text-white">{applied.code}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>
            {applied.type === "percent" ? `-${applied.value}%` : `-$${applied.value}`}
          </span>
        </div>
        <button onClick={onRemove}><X size={14} color="#637784" /></button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1 relative">
      <div className="relative flex items-center rounded-xl overflow-hidden transition-all duration-200"
        style={{ background: "#0C141B", border: `1.5px solid ${focused ? "#3BA7FF" : "#2C414E"}`, boxShadow: focused ? "0 0 12px rgba(59,167,255,0.35), 0 0 0 3px rgba(59,167,255,0.12)" : "none" }}>
        <input
          placeholder="Discount code or gift card"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }}
          onFocus={() => { setFocused(true); if (giftCards.length > 0) setShowGiftCards(true); }}
          onBlur={() => { setFocused(false); setTimeout(() => setShowGiftCards(false), 200); }}
          onKeyDown={e => e.key === "Enter" && handleApply()}
          className="flex-1 bg-transparent outline-none text-sm font-bold text-white tracking-wide placeholder:text-[#637784] placeholder:font-bold placeholder:text-sm px-5 py-[18px]"
        />
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          onClick={handleApply} disabled={loading || !code.trim()}
          className="absolute right-0 top-0 bottom-0 px-6 font-extrabold text-sm text-white flex items-center justify-center rounded-r-[11px] transition-colors"
          style={{ background: loading || !code.trim() ? "rgba(59,167,255,0.15)" : "#3BA7FF" }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
        </motion.button>
      </div>

      {/* Gift card dropdown */}
      {showGiftCards && giftCards.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden"
          style={{ background: "#1C2A34", border: "1.5px solid #2C414E", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <div className="px-3 py-2" style={{ borderBottom: "1px solid #2C414E" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#637784" }}>Available Gift Cards</p>
          </div>
          {giftCards.map((card: any) => (
            <button key={card.code} onClick={() => applyGiftCard(card)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5">
              <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/IMG_0750.png" alt="" className="w-full h-full object-contain" />
              </div>
                <div>
                  <p className="text-xs font-extrabold" style={{ color: "#F4F8FB" }}>{card.code}</p>
                  <p className="text-[10px]" style={{ color: "#637784" }}>{card.label}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
                -{card.value}%
              </span>
            </button>
          ))}
        </motion.div>
      )}

      {err && <p className="text-[11px] flex items-center gap-1" style={{ color: "#f87171" }}><AlertCircle size={10} />{err}</p>}
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
            style={{ width: i % 3 === 0 ? 10 : 6, height: i % 3 === 0 ? 10 : 6, marginLeft: i % 3 === 0 ? -5 : -3, marginTop: i % 3 === 0 ? -5 : -3, background: ["#dc2626","#f97316","#ec4899","#3BA7FF","#9BAEBB","#fbbf24"][i % 6], zIndex: 200 }}
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
      style={{ background: "rgba(19,28,35,0.97)", backdropFilter: "blur(24px)" }}>
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
              style={{ borderColor: i === 0 ? "#3BA7FF" : i === 1 ? "#ec4899" : "#dc2626" }} />
          ))}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
            className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "#16a34a", boxShadow: "0 0 40px rgba(22,163,74,0.5)" }}>
            <Check size={38} color="white" strokeWidth={3} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h2 className="text-3xl font-extrabold text-white mb-1">Order Confirmed!</h2>
          <p className="text-sm mb-5" style={{ color: "#3BA7FF" }}>
            Confirmation sent to <span className="text-white font-bold">{email || "your email"}</span>
          </p>

          {}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="rounded-2xl p-4 mb-4 text-left relative overflow-hidden"
            style={{ background: "rgba(59,167,255,0.2)", border: "1.5px solid rgba(165,180,252,0.2)" }}
          >
            {}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20"
              style={{ background: "rgba(59,167,255,0.15)", filter: "blur(16px)" }} />

            <div className="flex items-start gap-3 relative">
              {}
              <motion.div
                animate={{ scale: [1, 1.12, 1], boxShadow: ["0 0 0px rgba(59,167,255,0)", "0 0 18px rgba(59,167,255,0.7)", "0 0 0px rgba(59,167,255,0)"] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#3BA7FF" }}
              >
                <MessageSquare size={18} color="white" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-white mb-1">Get Your Items Now</p>
                <p className="text-xs leading-relaxed" style={{ color: "#9BAEBB" }}>
                  Click on the{" "}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md mx-0.5 font-bold"
                    style={{ background: "rgba(59,167,255,0.35)", color: "#9BAEBB", verticalAlign: "middle" }}>
                    <MessageSquare size={9} /> chat
                  </span>{" "}
                  icon in the corner to open live chat, provide your details and our claim team will contact you shortly!
                </p>
              </div>
            </div>

            {}
            <motion.div
              animate={{ x: [0, 4, 0], y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              className="absolute bottom-3 right-3 text-lg"
              style={{ color: "#9BAEBB" }}
            >
              ↘
            </motion.div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(59,167,255,0.4)" }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="w-full py-3.5 rounded-2xl font-extrabold text-white"
            style={{ background: "rgba(59,167,255,0.2)", border: "1px solid rgba(165,180,252,0.15)" }}>
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
    }
  }, []);
  const discount = promo
    ? promo.type === "percent" ? totalPrice * (promo.value / 100) : Math.min(promo.value, totalPrice)
    : 0;
  const finalTotal = Math.max(0, totalPrice - discount);

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
          color: "#ffffff",
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: "14px",
          fontSmoothing: "antialiased",
          "::placeholder": { color: "#637784" },
        },
        invalid: { color: "#ef4444" },
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: "#131C23" }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
          <Package size={34} color="#3BA7FF" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Your cart is empty</h2>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/")}
          className="px-8 py-3.5 rounded-2xl font-extrabold text-white"
          style={{ background: "#3BA7FF" }}>
          Browse Items
        </motion.button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ background: "#131C23" }}>
        {/* ── TOPBAR ── */}
        <div className="w-full relative overflow-hidden sm:h-[73px] h-[60px]" style={{ borderBottom: "1px solid #2C414E", background: "#0F1920" }}>
          {/* Right side — neat row */}
          <img src="/item-star.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <img src="/item-gem.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <img src="/item-crystals.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />

          {/* Left side — neat row */}
          <img src="/item-controller.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <img src="/item-sword.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <img src="/item-heart.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />

          {/* Center logo */}
          <button onClick={() => navigate("/")} className="absolute flex items-center gap-2 sm:gap-3 select-none z-10" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ background: "#3BA7FF", boxShadow: "0 2px 10px rgba(59,167,255,0.4)" }}>
              <Star size={18} fill="white" color="white" />
            </div>
            <span className="font-extrabold tracking-tight text-white" style={{ fontSize: 22, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
              RB<span style={{ color: "#3BA7FF" }}>stars</span>
            </span>
          </button>
        </div>

        {/* ── LAYOUT ── */}
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 px-6 md:px-16 py-10 lg:py-14 lg:max-w-[860px]">

            {/* Express Checkout */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mb-8">
              <p className="text-center text-sm font-semibold mb-4" style={{ color: "#637784" }}>Express checkout</p>
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
              <div className="flex-1 h-px" style={{ background: "#2C414E" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#637784" }}>OR</span>
              <div className="flex-1 h-px" style={{ background: "#2C414E" }} />
            </div>

            {/* Contact */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-8">
              <h2 className="text-xl font-extrabold text-white mb-4">Contact Email <span className="text-sm font-semibold" style={{ color: "#637784" }}>(Used for Delivery)</span></h2>
              <div className="relative">
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: "#0C141B", border: `1.5px solid ${errors.email ? "rgba(239,68,68,0.5)" : "#2C414E"}` }}>
                  <Mail size={16} style={{ color: "#9BAEBB", flexShrink: 0 }} />
                  <input type="email" placeholder="you@example.com" value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#4b5563] min-w-0" />
                </div>
                {errors.email && <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: "#f87171" }}><AlertCircle size={10} />{errors.email}</p>}
              </div>
              <label className="flex items-start gap-3 mt-4 cursor-pointer select-none group">
                <input type="checkbox" defaultChecked
                  className="mt-1 w-4 h-4 rounded accent-[#3BA7FF] cursor-pointer" />
                <span className="text-sm leading-relaxed group-hover:text-white transition-colors" style={{ color: "#9BAEBB" }}>
                  Get exclusive discounts and offers on Roblox items. Check your email to confirm your subscription!
                </span>
              </label>
            </motion.div>

            {/* Payment */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-8">
              <h2 className="text-xl font-extrabold text-white mb-1.5">Payment</h2>
              <p className="text-sm mb-5" style={{ color: "#637784" }}>All transactions are secure and encrypted.</p>

              {/* Credit card method */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: "#1C2A34", border: "1.5px solid #2C414E", overflow: "visible" }}>
                <div className="flex items-center gap-3.5 p-4 rounded-xl mb-4" style={{ background: "#0C141B", border: "1.5px solid #3BA7FF", boxShadow: "0 0 12px rgba(59,167,255,0.25), 0 0 0 3px rgba(59,167,255,0.08)" }}>
                  <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0" style={{ border: "2px solid #3BA7FF", background: "#3BA7FF" }}>
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-sm font-bold text-white flex-1">Credit card</span>
                  <img src="/payment-cards.png" alt="Visa, Mastercard, American Express" className="h-8 rounded-md object-contain" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.3))" }} />
                </div>

                {/* Card fields */}
                <div className="space-y-3" style={{ position: "relative", zIndex: 1 }}>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Card number</label>
                    <div className="relative flex items-center gap-2 px-4 rounded-xl" style={{ background: "#0C141B", border: `1.5px solid ${errors.cardNum ? "rgba(239,68,68,0.5)" : "#2C414E"}`, minHeight: 48, overflow: "visible" }}>
                      <div ref={cardNumDivRef} className="flex-1 py-3" style={{ position: "relative", zIndex: 2 }} />
                      <Lock size={14} style={{ color: "#637784", flexShrink: 0 }} />
                    </div>
                    {errors.cardNum && <p className="text-[11px] mt-1" style={{ color: "#f87171" }}>{errors.cardNum}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Expiration</label>
                      <div className="relative px-4 rounded-xl" style={{ background: "#0C141B", border: `1.5px solid ${errors.expiry ? "rgba(239,68,68,0.5)" : "#2C414E"}`, minHeight: 48, overflow: "visible" }}>
                        <div ref={cardExpDivRef} className="py-3" style={{ position: "relative", zIndex: 2 }} />
                      </div>
                      {errors.expiry && <p className="text-[11px] mt-1" style={{ color: "#f87171" }}>{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Security code</label>
                      <div className="relative flex items-center gap-2 px-4 rounded-xl" style={{ background: "#0C141B", border: `1.5px solid ${errors.cvv ? "rgba(239,68,68,0.5)" : "#2C414E"}`, minHeight: 48, overflow: "visible" }}>
                        <div ref={cardCvvDivRef} className="flex-1 py-3" style={{ position: "relative", zIndex: 2 }} />
                        <HelpCircle size={14} style={{ color: "#637784", flexShrink: 0 }} />
                      </div>
                      {errors.cvv && <p className="text-[11px] mt-1" style={{ color: "#f87171" }}>{errors.cvv}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Name on card</label>
                    <div className="flex items-center gap-3 px-4 rounded-xl" style={{ background: "#0C141B", border: `1.5px solid ${errors.cardName ? "rgba(239,68,68,0.5)" : "#2C414E"}`, minHeight: 48 }}>
                      <User size={15} style={{ color: "#9BAEBB", flexShrink: 0 }} />
                      <input type="text" placeholder="As it appears on your card" value={cardName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCardName(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#4b5563] min-w-0" />
                    </div>
                    {errors.cardName && <p className="text-[11px] mt-1" style={{ color: "#f87171" }}>{errors.cardName}</p>}
                  </div>
                </div>
              </div>

              <CardPreview cardNum="" expiry="" cardName={cardName} brand={brand} />
            </motion.div>

            {/* Billing Address */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mb-8">
              <h2 className="text-xl font-extrabold text-white mb-4">Billing address</h2>

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

            <div className="h-px mb-6" style={{ background: "#2C414E" }} />

            {/* Payment Error */}
            {errors.payment && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-6"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <AlertCircle size={15} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-snug" style={{ color: "#EF4444" }}>{errors.payment}</p>
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
                className="relative w-full rounded-2xl font-extrabold text-white flex items-center justify-center gap-3 text-base"
                style={{ background: "#3BA7FF", padding: "18px 0", boxShadow: "0 4px 0 0 #2980b9, 0 6px 16px rgba(0,0,0,0.3)" }}>
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /><span>Processing Payment...</span></>
                ) : (
                  <span>{`Pay — $${finalTotal.toFixed(2)}`}</span>
                )}
              </motion.button>
              <p className="text-center text-[11px] mt-3 flex items-center justify-center gap-1.5" style={{ color: "#637784" }}>
                <Shield size={10} /> 256-bit SSL encrypted · Powered by Stripe
              </p>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: ORDER SUMMARY ── */}
          <div className="lg:w-[520px] flex-shrink-0 px-6 md:px-10 py-10 lg:py-14" style={{ borderLeft: "1px solid #2C414E" }}>
            <div className="lg:sticky lg:top-6">

              {/* Order Items */}
              <div className="mb-6">
                {items.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                    className="flex items-center gap-4 mb-5">
                    <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
                      <div className="w-full h-full rounded-xl overflow-hidden" style={{ background: "#1C2A34", border: "2px solid #F4F8FB" }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : item.bgImageUrl ? (
                          <div className="w-full h-full relative">
                            <img src={item.bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.18)" }} />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: item.gradient?.[0] || "#2C414E" }}>
                            <Box size={24} color="#637784" />
                          </div>
                        )}
                      </div>
                      {item.quantity > 1 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[11px] font-extrabold text-white flex items-center justify-center"
                          style={{ background: "#3BA7FF", border: "2px solid #131C23" }}>
                          {item.quantity}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-white truncate">{item.name}</p>
                    </div>
                    <span className="text-base font-extrabold flex-shrink-0" style={{ color: "#F4F8FB" }}>${(item.price * item.quantity).toFixed(2)}</span>
                  </motion.div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <PromoInput applied={promo} onApply={setPromo} onRemove={() => setPromo(null)} />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-5" style={{ borderTop: "1px solid #2C414E" }}>
                <span className="text-2xl font-extrabold text-white">Total</span>
                <div className="text-right flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold" style={{ color: "#637784" }}>USD</span>
                  <span className="text-3xl font-extrabold" style={{ color: "#F4F8FB" }}>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Support / Guarantee / Delivery Banner */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl overflow-hidden mt-2">
                <img src="/banner-support.jpg" alt="Support, Guarantee, Delivery" className="w-full h-auto object-cover" />
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </>
  );

}
