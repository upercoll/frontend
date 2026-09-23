import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Gamepad2, Mail, ArrowLeft, ArrowRight, Loader2, Check,
  CheckCheck, Package, Star, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

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
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4f46e5" }}>{label}</label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
        style={{
          background: "#f9fafb",
          border: `1.5px solid ${error ? "#fca5a5" : focused ? "#4F46E5" : "#e5e7eb"}`,
          boxShadow: focused ? "0 0 0 3px rgba(79,70,229,0.08)" : "none",
        }}
      >
        {icon && <span style={{ color: "#4F46E5", flexShrink: 0 }}>{icon}</span>}
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 font-medium min-w-0"
          style={{ color: "#1e1b4b" }}
        />
      </div>
      {error && <p className="text-[10px]" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className="w-2 h-2 rounded-full transition-all"
      style={{
        background: done ? "#16a34a" : active ? "#4F46E5" : "#d1d5db",
        boxShadow: active ? "0 0 8px rgba(79,70,229,0.5)" : "none",
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
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg,#0C0B2E 0%,#0F0C2E 50%,#0C0B2E 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl p-6 text-center space-y-4"
          style={{ background: "rgba(255,255,255,0.035)", border: "1.5px solid rgba(165,180,252,0.13)" }}
        >
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <AlertTriangle size={22} color="#fcd34d" />
          </div>
          <p className="text-base font-extrabold text-white">Auto Delivery is Only Available for Grow A Garden 2</p>
          <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
            This order is for a different game. Please use the Claim Chat to connect with a delivery agent.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
          >
            <ArrowLeft size={15} />Back to Store
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0C0B2E 0%,#0F0C2E 50%,#0C0B2E 100%)" }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle,#22c55e,transparent)", filter: "blur(80px)" }}
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle,#4F46E5,transparent)", filter: "blur(80px)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 0 40px rgba(22,163,74,0.45)" }}>
            <Bot size={30} color="white" />
          </div>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-white mb-1">Automated Delivery</h1>
          <p className="text-sm" style={{ color: "#818CF8" }}>
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
                  style={{ color: progressIdx >= i ? "#a5b4fc" : "#475569" }}>
                  {label}
                </span>
              </div>
              {i < 3 && <div className="w-6 h-px" style={{ background: progressIdx > i ? "#22c55e" : "#334155" }} />}
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
          style={{ background: "rgba(255,255,255,0.035)", border: "1.5px solid rgba(165,180,252,0.13)" }}
        >
          <AnimatePresence mode="wait">
            {/* ── STEP 1: username ── */}
            {step === "username" && (
              <motion.div key="username" className="space-y-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-1">
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ background: "rgba(79,70,229,0.15)", border: "1px solid rgba(165,180,252,0.25)" }}>
                    <Gamepad2 size={18} color="#a5b4fc" />
                  </div>
                  <p className="text-sm font-extrabold text-white mb-0.5">Confirm Your Details</p>
                  <p className="text-[11px]" style={{ color: "#64748B" }}>
                    The bot delivers to this exact Roblox account
                  </p>
                </div>
                <Field
                  label="Roblox Username"
                  placeholder="Your in-game username"
                  value={robloxUser}
                  onChange={setRobloxUser}
                  icon={<Gamepad2 size={14} />}
                  error={formErrors.robloxUser}
                />
                <Field
                  label="Contact Email"
                  placeholder="For order notifications"
                  value={contactEmail}
                  onChange={setContactEmail}
                  icon={<Mail size={14} />}
                  type="email"
                  error={formErrors.contactEmail}
                />
                {order?.items?.length ? (
                  <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#86efac" }}>
                      <Package size={10} className="inline mr-1" style={{ color: "#4ade80" }} />
                      Your Items
                    </p>
                    {order.items.map((it, idx) => (
                      <p key={idx} className="text-[11px] font-semibold text-white">
                        {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <p className="text-[10px] leading-relaxed" style={{ color: "#fcd34d" }}>
                      <AlertTriangle size={10} className="inline mr-1" />
                      No recent order found on this device. Your items will be resolved from your paid order automatically.
                    </p>
                  </div>
                )}
                <button
                  onClick={handleContinueFromUsername}
                  className="w-full py-3 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
                >
                  Confirm & Continue <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(79,70,229,0.15)", border: "1.5px solid rgba(165,180,252,0.2)", color: "#A5B4FC" }}
                >
                  <ArrowLeft size={13} />Back to Store
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: instructions ── */}
            {step === "instructions" && (
              <motion.div key="instructions" className="space-y-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-1">
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ background: "rgba(79,70,229,0.15)", border: "1px solid rgba(165,180,252,0.25)" }}>
                    <Bot size={18} color="#a5b4fc" />
                  </div>
                  <p className="text-sm font-extrabold text-white mb-0.5">How It Works</p>
                  <p className="text-[11px]" style={{ color: "#64748B" }}>
                    Follow these steps — the bot handles the rest
                  </p>
                </div>
                <div className="space-y-2">
                  {DELIVERY_INSTRUCTIONS.map((line, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl p-2.5"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(165,180,252,0.1)" }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
                        <span className="text-[9px] font-extrabold text-white">{i + 1}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-white flex-1">{line}</p>
                    </div>
                  ))}
                </div>
                {createError && (
                  <p className="text-[11px] text-center" style={{ color: "#f87171" }}>{createError}</p>
                )}
                <button
                  onClick={handleCreateSession}
                  disabled={creating}
                  className="w-full py-3 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
                >
                  {creating ? <><Loader2 size={15} className="animate-spin" />Starting Bot…</> : <><Bot size={15} />Start Delivery</>}
                </button>
                <button
                  onClick={() => setStep("username")}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(79,70,229,0.15)", border: "1.5px solid rgba(165,180,252,0.2)", color: "#A5B4FC" }}
                >
                  <ArrowLeft size={13} />Back
                </button>
              </motion.div>
            )}

            {/* ── STEP 3: delivering ── */}
            {step === "delivering" && (
              <motion.div key="delivering" className="py-6 text-center space-y-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 0 40px rgba(22,163,74,0.4)" }}
                >
                  <Bot size={28} color="white" />
                </motion.div>
                <div>
                  <p className="text-base font-extrabold text-white mb-1">Bot Delivering Your Items…</p>
                  <p className="text-[11px]" style={{ color: "#64748B" }}>
                    Stay inside the game. This usually takes 1–3 minutes.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 rounded-full border-2"
                    style={{ borderColor: "#22c55e", borderTopColor: "transparent" }}
                  />
                  <span className="text-xs font-semibold" style={{ color: "#4ade80" }}>
                    {session?.items?.length
                      ? `Delivering ${session.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}`
                      : "Waiting for delivery…"}
                  </span>
                </div>
                {session?.items?.length ? (
                  <div className="rounded-xl p-3 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(165,180,252,0.1)" }}>
                    {session.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 py-1">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(79,70,229,0.2)" }}>
                          <Package size={11} color="#a5b4fc" />
                        </div>
                        <p className="text-[11px] font-semibold text-white flex-1">
                          {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                        </p>
                        {it.category && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
                            {it.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  onClick={() => { setRetryKey(k => k + 1); }}
                  className="mx-auto flex items-center gap-1.5 py-2 px-4 rounded-xl text-[11px] font-semibold"
                  style={{ background: "rgba(79,70,229,0.15)", border: "1px solid rgba(165,180,252,0.2)", color: "#A5B4FC" }}
                >
                  <RefreshCw size={12} />Check Status
                </button>
              </motion.div>
            )}

            {/* ── STEP 4: delivered ── */}
            {step === "delivered" && (
              <motion.div key="delivered" className="py-6 text-center space-y-4"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 0 40px rgba(22,163,74,0.5)" }}
                >
                  <CheckCheck size={28} color="white" />
                </motion.div>
                <div>
                  <p className="text-lg font-extrabold text-white mb-1">Items Delivered! ✓</p>
                  <p className="text-[11px]" style={{ color: "#86efac" }}>
                    Your items have been delivered to your Roblox account. Check your inventory!
                  </p>
                </div>
                {session?.items?.length ? (
                  <div className="rounded-xl p-3 text-left" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    {session.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 py-1">
                        <Check size={11} color="#4ade80" className="flex-shrink-0" />
                        <p className="text-[11px] font-semibold text-white flex-1">
                          {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  onClick={() => navigate("/")}
                  className="w-full py-3 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
                >
                  <Star size={15} />Back to Store
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-[10px] mt-4" style={{ color: "#475569" }}>
          Once delivered, this order is marked complete — it cannot be delivered again.
        </p>
      </motion.div>
    </div>
  );
}
