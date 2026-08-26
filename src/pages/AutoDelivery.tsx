import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Gamepad2, Mail, ArrowLeft, ArrowRight, Loader2, Check,
  CheckCheck, Package, Star, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const NAVY = "#0E1A3C";
const ROYAL = "#2B50F6";
const GOLD = "#FFC53D";
const MUTED = "#5A6478";

const AUTO_ONLY_GAME = "grow-a-garden-2";

interface LastOrder {
  orderRef: string;
  email: string;
  game?: string | null;
  items?: { id: string; name: string; quantity: number; gradient?: [string, string] }[];
}

interface SessionInfo {
  roomId: string;
  status: string;
  mode: string;
  items: { name: string; quantity: number; category?: string }[];
  game: string | null;
  orderRef: string | null;
}

type Step =
  | "username"
  | "instructions"
  | "delivering"
  | "delivered";

const DELIVERY_INSTRUCTIONS = [
  "Join Grow A Garden 2 on the Roblox account matching the username you entered.",
  "Stay inside the server — our bot will find you and deliver your items automatically.",
  "Make sure your in-game privacy settings allow receiving gifts.",
  "Delivery usually takes 1–3 minutes. Do not leave the server until you see the delivered confirmation.",
];

function loadLastOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem("rbstars_last_order");
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {
    return null;
  }
}

function Field({
  label, placeholder, value, onChange, icon, type = "text", error,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon?: React.ReactNode;
  type?: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: MUTED }}>{label}</label>
      <div
        className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-white transition-all"
        style={{
          border: `1.5px solid ${error ? "#D92D20" : focused ? ROYAL : "rgba(14,26,60,.14)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(43,80,246,.12)" : "none",
        }}
      >
        {icon && <span style={{ color: focused ? ROYAL : "#9AA3B8", flexShrink: 0 }}>{icon}</span>}
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#9AA3B8] font-medium min-w-0"
          style={{ color: NAVY }}
        />
      </div>
      {error && <p className="text-[10px] font-medium" style={{ color: "#D92D20" }}>{error}</p>}
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className="w-2.5 h-2.5 rounded-full transition-all"
      style={{
        background: done ? "#0E9F6E" : active ? ROYAL : "rgba(14,26,60,.18)",
        boxShadow: active ? "0 0 8px rgba(43,80,246,.5)" : "none",
      }}
    />
  );
}

export default function AutoDelivery() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("username");
  const [order] = useState<LastOrder | null>(() => loadLastOrder());

  const [robloxUser, setRobloxUser] = useState(user?.robloxUsername || "");
  const [contactEmail, setContactEmail] = useState(user?.email || order?.email || "");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<SessionInfo | null>(null);
  sessionRef.current = session;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // Status polling once a session exists — mirrors the claim chat "claimed" flow.
  useEffect(() => {
    if (step !== "delivering" || !sessionRef.current?.roomId) return;
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND}/api/claims/${sessionRef.current!.roomId}/status`);
        const data = await res.json();
        if (!res.ok || !data.success) return;
        const s = data.data;
        if (s.status === "claimed" || s.status === "ended") {
          if (pollRef.current) clearInterval(pollRef.current);
          try {
            localStorage.setItem("rbstars_delivered_" + (s.orderRef || ""), "1");
            localStorage.removeItem("rbstars_last_order");
            const raw = localStorage.getItem("rbstars_orders");
            if (raw) {
              const arr = JSON.parse(raw);
              if (s.orderRef) {
                const next = Array.isArray(arr) ? arr.filter((o: LastOrder) => o.orderRef !== s.orderRef) : [];
                if (next.length > 0) localStorage.setItem("rbstars_orders", JSON.stringify(next));
                else localStorage.removeItem("rbstars_orders");
              }
            }
          } catch {}
          window.dispatchEvent(
            new CustomEvent("rbstars:claim-delivered", { detail: { orderRef: s.orderRef } })
          );
          setSession(prev => ({ ...(prev || s), status: "claimed" }));
          setStep("delivered");
        }
      } catch {}
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, retryKey]);

  function handleContinueFromUsername() {
    const e: Record<string, string> = {};
    if (!robloxUser.trim()) e.robloxUser = "Enter your Roblox username";
    if (!contactEmail.includes("@")) e.contactEmail = "Enter a valid email";
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setCreateError(null);
    setStep("instructions");
  }

  async function handleCreateSession() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`${BACKEND}/api/claims/auto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robloxUsername: robloxUser.trim(),
          contactEmail: contactEmail.trim(),
          orderRef: order?.orderRef || null,
          game: order?.game || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to start automated delivery");
      setSession(data.data);
      setStep("delivering");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current);
    setStep("username");
    setSession(null);
    setCreateError(null);
  }

  const isGAG2 = !order?.game || order.game === AUTO_ONLY_GAME;
  const progressIdx = step === "username" ? 0 : step === "instructions" ? 1 : step === "delivering" ? 2 : 3;

  if (!isGAG2) {
    return (
      <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4" style={{ background: "#F6F8FE" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-[28px] p-7 text-center space-y-4 relative overflow-hidden bg-white"
          style={{ boxShadow: "var(--shadow-soft-lg)", border: "1px solid rgba(14,26,60,.08)" }}
        >
          <div className="pattern-dots absolute inset-0 pointer-events-none opacity-50" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center -rotate-6"
              style={{ background: "#FFF6DC", boxShadow: "var(--shadow-soft-sm)" }}>
              <AlertTriangle size={22} color="#D99A00" />
            </div>
            <p className="font-display text-xl tracking-tight mt-5 mb-2 leading-snug" style={{ color: NAVY }}>
              Auto Delivery is only available for Grow A Garden 2
            </p>
            <p className="text-xs leading-relaxed mb-6" style={{ color: MUTED }}>
              This order is for a different game. Please use the Claim Chat to connect with a delivery agent.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2"
              style={{ background: ROYAL, boxShadow: "0 10px 26px -8px rgba(43,80,246,.5)" }}
            >
              <ArrowLeft size={15} />Back to Store
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "#F6F8FE" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-[28px] p-6 sm:p-8 overflow-hidden bg-white"
        style={{ boxShadow: "var(--shadow-soft-lg)", border: "1px solid rgba(14,26,60,.08)" }}
      >
        <div className="pattern-dots absolute inset-0 pointer-events-none opacity-40" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: [-4, 4, -4], y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-white"
              style={{ background: NAVY, boxShadow: "var(--shadow-soft-md)" }}
            >
              <Bot size={30} color={GOLD} />
            </motion.div>
          </div>
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl tracking-tight mb-2 leading-tight" style={{ color: NAVY }}>
              Automated <span className="font-serif-italic" style={{ color: ROYAL }}>delivery.</span>
            </h1>
            <p className="text-sm font-medium" style={{ color: MUTED }}>
              Our bot delivers your items instantly — no waiting for an agent
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {["Username", "How It Works", "Delivering", "Delivered"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <StepDot active={progressIdx === i} done={progressIdx > i} />
                  <span className="text-[8px] font-bold uppercase tracking-wider"
                    style={{ color: progressIdx >= i ? NAVY : "#9AA3B8" }}>
                    {label}
                  </span>
                </div>
                {i < 3 && <div className="w-6 h-[2.5px] rounded-full" style={{ background: progressIdx > i ? "#0E9F6E" : "rgba(14,26,60,.1)" }} />}
              </div>
            ))}
          </div>

          {/* Step content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl p-5"
            style={{ background: "#F9FBFF", border: "1px solid rgba(14,26,60,.08)" }}
          >
            <AnimatePresence mode="wait">
              {/* ── STEP 1 ── */}
              {step === "username" && (
                <motion.div key="username" className="space-y-3.5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-1">
                    <div className="w-11 h-11 rounded-2xl mx-auto mb-2.5 flex items-center justify-center" style={{ background: "#EEF3FB", color: ROYAL }}>
                      <Gamepad2 size={19} />
                    </div>
                    <p className="text-sm font-bold mb-0.5" style={{ color: NAVY }}>Confirm Your Details</p>
                    <p className="text-[11px]" style={{ color: MUTED }}>
                      The bot delivers to this exact Roblox account
                    </p>
                  </div>
                  <Field label="Roblox Username" placeholder="Your in-game username" value={robloxUser} onChange={setRobloxUser} icon={<Gamepad2 size={14} />} error={formErrors.robloxUser} />
                  <Field label="Contact Email" placeholder="For order notifications" value={contactEmail} onChange={setContactEmail} icon={<Mail size={14} />} type="email" error={formErrors.contactEmail} />
                  {order?.items?.length ? (
                    <div className="rounded-xl p-3.5" style={{ background: "#E7F8F1", border: "1px solid rgba(14,159,110,.3)" }}>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#0E9F6E" }}>
                        <Package size={10} className="inline mr-1" />Your Items
                      </p>
                      {order.items.map((it, idx) => (
                        <p key={idx} className="text-[11px] font-semibold" style={{ color: NAVY }}>
                          {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl p-3.5" style={{ background: "#FFF6DC", border: "1px solid rgba(217,154,0,.3)" }}>
                      <p className="text-[10px] leading-relaxed font-medium" style={{ color: "#92670a" }}>
                        <AlertTriangle size={10} className="inline mr-1" />
                        No recent order found on this device. Your items will be resolved from your paid order automatically.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleContinueFromUsername}
                    className="w-full py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(180deg,#3D63FF 0%,#2B50F6 100%)", boxShadow: "0 10px 26px -8px rgba(43,80,246,.55)" }}
                  >
                    Confirm & Continue <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 bg-white hover:bg-[#EEF3FB] transition-colors"
                    style={{ color: NAVY, border: "1px solid rgba(14,26,60,.12)" }}
                  >
                    <ArrowLeft size={13} />Back to Store
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2 ── */}
              {step === "instructions" && (
                <motion.div key="instructions" className="space-y-3"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-1">
                    <div className="w-11 h-11 rounded-2xl mx-auto mb-2.5 flex items-center justify-center" style={{ background: "#EEF3FB", color: ROYAL }}>
                      <Bot size={19} />
                    </div>
                    <p className="text-sm font-bold mb-0.5" style={{ color: NAVY }}>How It Works</p>
                    <p className="text-[11px]" style={{ color: MUTED }}>
                      Follow these steps — the bot handles the rest
                    </p>
                  </div>
                  <div className="space-y-2">
                    {DELIVERY_INSTRUCTIONS.map((line, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl p-3 bg-white"
                        style={{ border: "1px solid rgba(14,26,60,.08)" }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-[9px] font-bold"
                          style={{ background: GOLD, color: NAVY }}>
                          {i + 1}
                        </div>
                        <p className="text-[11px] leading-relaxed flex-1 font-medium" style={{ color: NAVY }}>{line}</p>
                      </div>
                    ))}
                  </div>
                  {createError && (
                    <p className="text-[11px] text-center font-medium" style={{ color: "#D92D20" }}>{createError}</p>
                  )}
                  <button
                    onClick={handleCreateSession}
                    disabled={creating}
                    className="w-full py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "#0E9F6E", boxShadow: "0 10px 26px -8px rgba(14,159,110,.5)" }}
                  >
                    {creating ? <><Loader2 size={15} className="animate-spin" />Starting Bot…</> : <><Bot size={15} />Start Delivery</>}
                  </button>
                  <button
                    onClick={() => setStep("username")}
                    className="w-full py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 bg-white hover:bg-[#EEF3FB] transition-colors"
                    style={{ color: NAVY, border: "1px solid rgba(14,26,60,.12)" }}
                  >
                    <ArrowLeft size={13} />Back
                  </button>
                </motion.div>
              )}

              {/* ── STEP 3 ── */}
              {step === "delivering" && (
                <motion.div key="delivering" className="py-5 text-center space-y-4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div
                    animate={{ scale: [1, 1.07, 1], rotate: [-3, 3, -3] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
                    style={{ background: NAVY, boxShadow: "var(--shadow-soft-md)" }}
                  >
                    <Bot size={28} color={GOLD} />
                  </motion.div>
                  <div>
                    <p className="font-display text-lg tracking-tight mb-1" style={{ color: NAVY }}>Bot Delivering Your Items…</p>
                    <p className="text-[11px]" style={{ color: MUTED }}>
                      Stay inside the game. This usually takes 1–3 minutes.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-full border-2"
                      style={{ borderColor: "rgba(14,26,60,.2)", borderTopColor: ROYAL }}
                    />
                    <span className="text-xs font-semibold" style={{ color: "#0E9F6E" }}>
                      {session?.items?.length
                        ? `Delivering ${session.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}`
                        : "Waiting for delivery…"}
                    </span>
                  </div>
                  {session?.items?.length ? (
                    <div className="rounded-xl p-3.5 text-left bg-white" style={{ border: "1px solid rgba(14,26,60,.08)" }}>
                      {session.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 py-1">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EEF3FB", color: ROYAL }}>
                            <Package size={11} />
                          </div>
                          <p className="text-[11px] font-semibold flex-1" style={{ color: NAVY }}>
                            {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                          </p>
                          {it.category && (
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: ROYAL }}>
                              {it.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => { setRetryKey(k => k + 1); }}
                    className="mx-auto flex items-center gap-1.5 py-2 px-4 rounded-full text-[11px] font-semibold bg-white hover:bg-[#EEF3FB] transition-colors"
                    style={{ color: NAVY, border: "1px solid rgba(14,26,60,.12)" }}
                  >
                    <RefreshCw size={12} />Check Status
                  </button>
                </motion.div>
              )}

              {/* ── STEP 4 ── */}
              {step === "delivered" && (
                <motion.div key="delivered" className="py-5 text-center space-y-4"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
                    style={{ background: "#0E9F6E", boxShadow: "0 16px 36px -8px rgba(14,159,110,.5)" }}
                  >
                    <CheckCheck size={28} color="#fff" />
                  </motion.div>
                  <div>
                    <p className="font-display text-xl tracking-tight mb-1" style={{ color: NAVY }}>Items Delivered! ✓</p>
                    <p className="text-[11px]" style={{ color: "#0E9F6E" }}>
                      Your items have been delivered to your Roblox account. Check your inventory!
                    </p>
                  </div>
                  {session?.items?.length ? (
                    <div className="rounded-xl p-3.5 text-left" style={{ background: "#E7F8F1", border: "1px solid rgba(14,159,110,.3)" }}>
                      {session.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 py-1">
                          <Check size={11} color="#0E9F6E" strokeWidth={3} className="flex-shrink-0" />
                          <p className="text-[11px] font-semibold flex-1" style={{ color: NAVY }}>
                            {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => navigate("/")}
                    className="w-full py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: NAVY, boxShadow: "0 12px 30px -10px rgba(14,26,60,.5)" }}
                  >
                    <Star size={15} fill={GOLD} color={GOLD} />Back to Store
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <p className="text-center text-[10px] mt-5 font-medium" style={{ color: "#9AA3B8" }}>
            Once delivered, this order is marked complete — it cannot be delivered again.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
