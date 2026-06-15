import { useState, useEffect, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Lock, Check, Star,
  ChevronRight, ChevronDown, Zap, Package, AlertCircle,
  User, Mail, MapPin, Tag, X, Loader2, MessageSquare,
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
      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: "rgba(165,180,252,0.12)", color: "#818CF8" }}>
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
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#818CF8" }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: `1.5px solid ${error ? "rgba(248,113,113,0.6)" : focused ? "#4F46E5" : "rgba(165,180,252,0.22)"}`,
          boxShadow: focused ? `0 0 0 3px ${error ? "rgba(248,113,113,0.08)" : "rgba(79,70,229,0.12)"}` : "none",
        }}
      >
        {icon && <span style={{ color: focused ? "#A5B4FC" : "#4F46E5", flexShrink: 0 }}>{icon}</span>}
        <input
          type={type} inputMode={mode} placeholder={placeholder} value={value} maxLength={maxLen}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#6b5c8a] min-w-0"
        />
        {right}
      </div>
      {error && <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "#f87171" }}><AlertCircle size={10} />{error}</p>}
      {hint && !error && <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{hint}</p>}
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
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#818CF8" }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 rounded-xl transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: `1.5px solid ${error ? "rgba(248,113,113,0.6)" : focused ? "#4F46E5" : "rgba(165,180,252,0.22)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(79,70,229,0.12)" : "none",
        }}
      >
        {icon && <span style={{ color: "#4F46E5", flexShrink: 0 }}>{icon}</span>}
        <select
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium py-3 appearance-none cursor-pointer"
          style={{ color: value ? "white" : "#64748B" }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#1a0038", color: "white" }}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} style={{ color: "#64748B", flexShrink: 0 }} />
      </div>
      {error && <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "#f87171" }}><AlertCircle size={10} />{error}</p>}
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: `1.5px solid ${open ? "rgba(79,70,229,0.5)" : "rgba(165,180,252,0.13)"}`,
        transition: "border-color 0.2s",
        boxShadow: open ? "0 0 0 3px rgba(79,70,229,0.06)" : "none",
      }}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        {iconEl && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg || "rgba(79,70,229,0.22)" }}>
            {iconEl}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-extrabold text-white">{title}</span>
            {badge}
          </div>
          {subtitle && <div className="mt-0.5">{subtitle}</div>}
        </div>
        {headerRight && <div className="flex-shrink-0 ml-1">{headerRight}</div>}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }} className="flex-shrink-0 ml-1">
          <ChevronDown size={16} color={open ? "#A5B4FC" : "#64748B"} />
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
            <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(165,180,252,0.07)" }}>
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
      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ border: `2px solid ${selected ? "#4F46E5" : "#475569"}`, background: selected ? "#4F46E5" : "transparent", transition: "all 0.18s" }}
    >
      {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
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
  const bg = brand ? themes[brand].bg : "linear-gradient(135deg,#1e0050 0%,#1E1B4B 55%,#3730A3 100%)";

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
        style={{ background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.35)" }}>
        <div className="flex items-center gap-2">
          <Check size={14} color="#4ade80" />
          <span className="text-sm font-extrabold text-white">{applied.code}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>
            {applied.type === "percent" ? `-${applied.value}%` : `-$${applied.value}`}
          </span>
        </div>
        <button onClick={onRemove}><X size={14} color="#64748B" /></button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(165,180,252,0.22)" }}>
          <Tag size={13} color="#4F46E5" />
          <input
            placeholder="Enter promo code"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && handleApply()}
            className="flex-1 bg-transparent outline-none text-sm font-bold text-white uppercase tracking-wider placeholder:text-[#6b5c8a] placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
          />
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          onClick={handleApply} disabled={loading || !code.trim()}
          className="px-4 rounded-xl font-extrabold text-sm text-white flex items-center gap-1.5"
          style={{ background: loading || !code.trim() ? "rgba(79,70,229,0.2)" : "linear-gradient(135deg,#4F46E5,#3730A3)", minWidth: 72, justifyContent: "center" }}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
        </motion.button>
      </div>
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
            style={{ width: i % 3 === 0 ? 10 : 6, height: i % 3 === 0 ? 10 : 6, marginLeft: i % 3 === 0 ? -5 : -3, marginTop: i % 3 === 0 ? -5 : -3, background: ["#dc2626","#f97316","#ec4899","#4F46E5","#A5B4FC","#fbbf24"][i % 6], zIndex: 200 }}
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
      style={{ background: "rgba(13,0,32,0.97)", backdropFilter: "blur(24px)" }}>
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
              style={{ borderColor: i === 0 ? "#4F46E5" : i === 1 ? "#ec4899" : "#dc2626" }} />
          ))}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
            className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 0 40px rgba(22,163,74,0.5)" }}>
            <Check size={38} color="white" strokeWidth={3} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h2 className="text-3xl font-extrabold text-white mb-1">Order Confirmed!</h2>
          <p className="text-sm mb-5" style={{ color: "#818CF8" }}>
            Confirmation sent to <span className="text-white font-bold">{email || "your email"}</span>
          </p>

          {}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="rounded-2xl p-4 mb-4 text-left relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.2),rgba(55,48,163,0.12))", border: "1.5px solid rgba(165,180,252,0.2)" }}
          >
            {}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle,#4F46E5,transparent)", filter: "blur(16px)" }} />

            <div className="flex items-start gap-3 relative">
              {}
              <motion.div
                animate={{ scale: [1, 1.12, 1], boxShadow: ["0 0 0px rgba(79,70,229,0)", "0 0 18px rgba(79,70,229,0.7)", "0 0 0px rgba(79,70,229,0)"] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}
              >
                <MessageSquare size={18} color="white" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-white mb-1">Get Your Items Now</p>
                <p className="text-xs leading-relaxed" style={{ color: "#A5B4FC" }}>
                  Click on the{" "}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md mx-0.5 font-bold"
                    style={{ background: "rgba(79,70,229,0.35)", color: "#e9d5ff", verticalAlign: "middle" }}>
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
              style={{ color: "#A5B4FC" }}
            >
              ↘
            </motion.div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(79,70,229,0.4)" }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="w-full py-3.5 rounded-2xl font-extrabold text-white"
            style={{ background: "rgba(79,70,229,0.2)", border: "1px solid rgba(165,180,252,0.15)" }}>
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
  const { items, totalPrice, clearCart } = useCart();
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

  const prButtonRef = useRef<HTMLDivElement>(null);
  const prRef = useRef<any>(null);
  const [prAvailable, setPrAvailable] = useState(false);

  const promoRef = useRef(promo);
  const emailRef = useRef(email);
  const itemsRef = useRef(items);
  const userRef = useRef(user);
  useEffect(() => { promoRef.current = promo; }, [promo]);
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { userRef.current = user; }, [user]);

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
    let mounted = true;
    (async () => {
      const amount = Math.max(1, Math.round(finalTotal * 100));
      const pr = (stripe as any).paymentRequest({
        country: "US",
        currency: "usd",
        total: { label: "RBstars Order", amount },
        requestPayerName: true,
        requestPayerEmail: true,
      });
      const result = await pr.canMakePayment();
      if (!result || !mounted) return;
      prRef.current = pr;
      setPrAvailable(true);
      pr.on("paymentmethod", async (ev: any) => {
        try {
          const currentEmail = ev.payerEmail || emailRef.current;
          const currentUser = userRef.current;
          const currentItems = itemsRef.current;
          const currentPromo = promoRef.current;
          const customerInfo = {
            email: currentEmail,
            robloxUsername: currentUser?.robloxUsername || currentEmail,
          };
          const cartPayload = currentItems.map((i) => ({ id: i.id, quantity: i.quantity }));
          const createResp = await fetch(`${BACKEND_URL}/api/payments/create-intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cartItems: cartPayload,
              customer: customerInfo,
              paymentMethodId: ev.paymentMethod.id,
              promoCode: currentPromo?.code || null,
            }),
          });
          const createData = await createResp.json();
          if (!createResp.ok) {
            ev.complete("fail");
            setErrors({ payment: createData.message || "Payment failed. Please try again." });
            return;
          }
          const { clientSecret, orderNumber } = createData.data;
          const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );
          if (confirmError || !paymentIntent) {
            ev.complete("fail");
            setErrors({ payment: confirmError?.message || "Payment failed. Please try again." });
            return;
          }
          if (paymentIntent.status === "requires_action") {
            ev.complete("success");
            const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
            if (actionError) { setErrors({ payment: actionError.message || "Payment failed." }); return; }
          } else {
            ev.complete("success");
          }
          const orderData = {
            orderRef: orderNumber,
            email: customerInfo.email,
            items: currentItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, gradient: i.gradient })),
          };
          try { localStorage.setItem("rbstars_last_order", JSON.stringify(orderData)); } catch {}
          clearCart();
          navigate("/order-success");
        } catch {
          ev.complete("fail");
          setErrors({ payment: "Payment failed. Please try again." });
        }
      });
    })();
    return () => { mounted = false; };
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
          "::placeholder": { color: "#4b5563" },
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
    if (prRef.current && finalTotal > 0) {
      try {
        prRef.current.update({
          total: { label: "RBstars Order", amount: Math.max(1, Math.round(finalTotal * 100)) },
        });
      } catch {}
    }
  }, [finalTotal]);

  useEffect(() => {
    if (!prAvailable || !prButtonRef.current || !stripeRef.current) return;
    const stripe = stripeRef.current;
    const elements = (stripe as any).elements();
    const btn = elements.create("paymentRequestButton", {
      paymentRequest: prRef.current,
      style: { paymentRequestButton: { theme: "dark", height: "52px", type: "default" } },
    });
    btn.mount(prButtonRef.current);
    return () => { try { btn.unmount(); } catch {} };
  }, [prAvailable]);

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
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, gradient: i.gradient })),
      };
      try { localStorage.setItem("rbstars_last_order", JSON.stringify(orderData)); } catch {}
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: "#0C0B2E" }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "rgba(79,70,229,0.12)", border: "1.5px solid rgba(165,180,252,0.15)" }}>
          <Package size={34} color="#4F46E5" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Your cart is empty</h2>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/")}
          className="px-8 py-3.5 rounded-2xl font-extrabold text-white"
          style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
          Browse Items
        </motion.button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ background: "#0C0B2E" }}>
        {}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full opacity-[0.16]" style={{ background: "radial-gradient(circle,#4F46E5,transparent 70%)", filter: "blur(70px)" }} />
          <div className="absolute bottom-[-5%] right-[-5%] w-[45vw] h-[45vw] rounded-full opacity-[0.1]" style={{ background: "radial-gradient(circle,#dc2626,transparent 70%)", filter: "blur(70px)" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">

          {}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="flex items-center justify-between mb-8">
            <motion.button whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
              style={{ color: "#A5B4FC", background: "rgba(79,70,229,0.1)", border: "1px solid rgba(165,180,252,0.15)" }}>
              <ArrowLeft size={15} /> Back
            </motion.button>

            {}
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center shadow-lg">
                <Star size={16} fill="white" color="white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                RB<span style={{ color: "#A5B4FC" }}>stars</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Lock size={12} color="#16a34a" />
              <span style={{ color: "#16a34a" }}>Secure Checkout</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-5">

            {}
            <div className="space-y-3.5 order-2 lg:order-1">

              {}
              <Accordion
                open={true} onToggle={() => {}}
                title="Contact"
                iconEl={<Mail size={13} color="#A5B4FC" />}
                delay={0.07}
              >
                <div className="pt-3">
                  <Input label="Email Address" placeholder="you@example.com" value={email} onChange={setEmail} icon={<Mail size={15} />} type="text" error={errors.email} />
                </div>
              </Accordion>

              {}
              <Accordion
                open={billingOpen} onToggle={() => setBillingOpen(o => !o)}
                title="Billing Address"
                badge={<span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "rgba(79,70,229,0.15)", color: "#818CF8" }}>Optional</span>}
                iconEl={<MapPin size={13} color="#A5B4FC" />}
                subtitle={!billingOpen && addr1 ? <span className="text-xs" style={{ color: "#6B7280" }}>{addr1}{city ? `, ${city}` : ""}</span> : undefined}
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

              {(prAvailable || !stripeLoaded) && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, delay: 0.14 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.035)", border: "1.5px solid rgba(165,180,252,0.13)" }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(165,180,252,0.07)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#818CF8" }}>Express Checkout</p>
                  </div>
                  <div className="px-4 py-3">
                    {prAvailable ? (
                      <div ref={prButtonRef} style={{ minHeight: 52 }} />
                    ) : (
                      <div className="flex items-center justify-center py-3" style={{ minHeight: 52 }}>
                        <Loader2 size={16} className="animate-spin" style={{ color: "#4F46E5" }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 px-4 pb-3">
                    <div className="flex-1 h-px" style={{ background: "rgba(165,180,252,0.12)" }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>or pay with card</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(165,180,252,0.12)" }} />
                  </div>
                </motion.div>
              )}

              {}
              <Accordion
                open={openPayment === "card"}
                onToggle={() => setOpenPayment("card")}
                title="Credit / Debit Card"
                iconEl={<RadioDot selected={openPayment === "card"} />}
                iconBg="transparent"
                headerRight={<BrandIconRow activeBrand={brand} />}
                delay={0.16}
              >
                <div className="space-y-3 pt-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#818CF8" }}>Card Number</label>
                    <div className="flex items-center gap-2 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: `1.5px solid ${errors.cardNum ? "rgba(239,68,68,0.5)" : "rgba(165,180,252,0.15)"}`, minHeight: 44 }}>
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
                    {errors.cardNum && <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{errors.cardNum}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#818CF8" }}>Expiry</label>
                      <div className="px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: `1.5px solid ${errors.expiry ? "rgba(239,68,68,0.5)" : "rgba(165,180,252,0.15)"}`, minHeight: 44 }}>
                        <div ref={cardExpDivRef} className="py-3" />
                      </div>
                      {errors.expiry && <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#818CF8" }}>Security Code</label>
                      <div className="px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: `1.5px solid ${errors.cvv ? "rgba(239,68,68,0.5)" : "rgba(165,180,252,0.15)"}`, minHeight: 44 }}>
                        <div ref={cardCvvDivRef} className="py-3" />
                      </div>
                      {errors.cvv && <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{errors.cvv}</p>}
                    </div>
                  </div>
                  <Input label="Name on Card" placeholder="As it appears on your card" value={cardName} onChange={setCardName} icon={<User size={15} />} error={errors.cardName} />
                  <CardPreview cardNum="" expiry="" cardName={cardName} brand={brand} />
                </div>
              </Accordion>

              {errors.payment && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.25)" }}
                >
                  <AlertCircle size={15} color="#ef4444" className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-snug" style={{ color: "#ef4444" }}>{errors.payment}</p>
                </motion.div>
              )}

              {/* 5. Pay Button */}
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="relative">
                <BurstParticles active={burst} />
                <motion.button
                  animate={burst ? { scale: [1, 1.07, 0.97, 1.03, 1] } : { scale: 1 }}
                  whileHover={!loading ? { scale: 1.02, boxShadow: "0 0 45px rgba(220,38,38,0.5)" } : {}}
                  whileTap={!loading ? { scale: 0.97 } : {}}
                  onClick={handlePay}
                  disabled={loading}
                  className="relative w-full rounded-2xl font-extrabold text-white flex items-center justify-center gap-3 text-base overflow-hidden"
                  style={{ background: loading ? "linear-gradient(135deg,#4F46E5,#3730A3)" : "linear-gradient(135deg,#dc2626 0%,#9f1239 100%)", padding: "18px 0", transition: "background 0.5s" }}>
                  {!loading && (
                    <motion.div
                      initial={{ x: "-100%" }} animate={{ x: "220%" }}
                      transition={{ repeat: Infinity, duration: 2.8, ease: "linear", repeatDelay: 0.8 }}
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.11),transparent)", width: "40%" }} />
                  )}
                  {loading ? (
                    <><Loader2 size={20} className="animate-spin" /><span>Processing Payment…</span></>
                  ) : (
                    <><Lock size={17} /><span>{`Pay — $${finalTotal.toFixed(2)}`}</span><ChevronRight size={17} /></>
                  )}
                </motion.button>
                <p className="text-center text-[11px] mt-3 flex items-center justify-center gap-1.5" style={{ color: "#475569" }}>
                  <Shield size={10} /> 256-bit SSL encrypted · Powered by Stripe
                </p>
              </motion.div>
            </div>

            {/* ── RIGHT: Order Summary ── */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="order-1 lg:order-2">
              <div className="sticky top-6 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.035)", border: "1.5px solid rgba(165,180,252,0.13)" }}>

                {/* Summary header */}
                <button onClick={() => setSummaryOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(79,70,229,0.22)" }}>
                      <Package size={13} color="#A5B4FC" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-white">Order Summary</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>
                        {items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-extrabold" style={{ color: "#A5B4FC" }}>${finalTotal.toFixed(2)}</p>
                      {discount > 0 && <p className="text-[10px] line-through" style={{ color: "#475569" }}>${totalPrice.toFixed(2)}</p>}
                    </div>
                    <motion.div animate={{ rotate: summaryOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
                      <ChevronDown size={16} color={summaryOpen ? "#A5B4FC" : "#64748B"} />
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
                      <div className="px-5 py-3 space-y-3 max-h-52 overflow-y-auto" style={{ borderTop: "1px solid rgba(165,180,252,0.07)" }}>
                        {items.map((item, i) => (
                          <motion.div key={item.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 + i * 0.04 }} className="flex items-center gap-3">
                            <div className="relative flex-shrink-0" style={{ width: 42, height: 42 }}>
                              <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ background: `linear-gradient(135deg,${item.gradient[0]},${item.gradient[1]})` }}>
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "8px 8px" }} />
                                {item.image && (
                                  <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                                )}
                              </div>
                              {item.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full text-[9px] font-extrabold text-white flex items-center justify-center" style={{ background: "#4F46E5" }}>
                                  {item.quantity}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                              {item.originalPrice && <p className="text-[10px] line-through" style={{ color: "#475569" }}>${item.originalPrice.toFixed(2)}</p>}
                            </div>
                            <span className="text-sm font-extrabold flex-shrink-0" style={{ color: "#A5B4FC" }}>${(item.price * item.quantity).toFixed(2)}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Promo code */}
                      <div className="px-5 py-3" style={{ borderTop: "1px solid rgba(165,180,252,0.07)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748B" }}>Discount Code</p>
                        <PromoInput applied={promo} onApply={setPromo} onRemove={() => setPromo(null)} />
                      </div>

                      {/* Totals */}
                      <div className="px-5 py-3 space-y-2" style={{ borderTop: "1px solid rgba(165,180,252,0.07)" }}>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: "#6B7280" }}>Subtotal</span>
                          <span className="text-xs font-semibold text-white">${totalPrice.toFixed(2)}</span>
                        </div>
                        <AnimatePresence>
                          {discount > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex justify-between">
                              <span className="text-xs flex items-center gap-1" style={{ color: "#6B7280" }}>
                                <Tag size={9} />
                                {promo?.type === "percent" ? `${promo.value}% off` : "Discount"} ({promo?.code})
                              </span>
                              <span className="text-xs font-semibold" style={{ color: "#4ade80" }}>-${discount.toFixed(2)}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: "#6B7280" }}>Delivery</span>
                          <span className="text-xs font-bold" style={{ color: "#4ade80" }}>FREE</span>
                        </div>
                        <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid rgba(165,180,252,0.08)" }}>
                          <span className="text-sm font-extrabold text-white">Total</span>
                          <div className="text-right">
                            <p className="text-xl font-extrabold" style={{ color: "#A5B4FC" }}>${finalTotal.toFixed(2)}</p>
                            {discount > 0 && <p className="text-[10px] line-through" style={{ color: "#475569" }}>${totalPrice.toFixed(2)}</p>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Trust badges */}
                <div className="px-5 py-3 grid grid-cols-3 gap-2" style={{ borderTop: "1px solid rgba(165,180,252,0.07)", background: "rgba(0,0,0,0.12)" }}>
                  {[{ icon: <Zap size={13} />, label: "Instant Delivery" }, { icon: <Shield size={13} />, label: "100% Secure" }, { icon: <Star size={13} fill="#A5B4FC" color="#A5B4FC" />, label: "5★ Rated" }].map((b, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 py-1.5">
                      <div style={{ color: "#A5B4FC" }}>{b.icon}</div>
                      <span className="text-[9px] font-bold text-center uppercase tracking-wider" style={{ color: "#64748B" }}>{b.label}</span>
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
