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
      <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#6B655C" }}>{label}</label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white transition-all"
        style={{
          border: `2px solid ${error ? "#E2231A" : "#131313"}`,
          boxShadow: focused ? "3px 3px 0 #131313" : "none",
        }}
      >
        {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#8a8375] font-medium min-w-0"
        />
      </div>
      {error && <p className="font-mono text-[10px]" style={{ color: "#E2231A" }}>{error}</p>}
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className="w-2.5 h-2.5 rounded-[3px] rotate-12 transition-all"
      style={{
        background: done ? "#00B06F" : active ? "#E2231A" : "rgba(19,19,19,.2)",
        border: active || done ? "1.5px solid #131313" : "none",
        boxShadow: active ? "2px 2px 0 #131313" : "none",
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
      <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4" style={{ background: "#F2EEE5" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl p-6 text-center space-y-4 relative overflow-hidden"
          style={{ background: "#fff", border: "3px solid #131313", boxShadow: "9px 10px 0 #131313" }}
        >
          <div className="pattern-dots absolute inset-0 pointer-events-none opacity-50" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border-2 -rotate-6 bg-white"
              style={{ borderColor: "#FFC800", boxShadow: "3px 3px 0 #131313" }}>
              <AlertTriangle size={22} style={{ color: "#B45309" }} />
            </div>
            <p className="font-display text-lg uppercase mt-4 mb-2">Auto Delivery Is Only Available for Grow A Garden 2</p>
            <p className="text-xs leading-relaxed mb-5" style={{ color: "#6B655C" }}>
              This order is for a different game. Please use the Claim Chat to connect with a delivery agent.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-full font-mono text-xs font-semibold uppercase tracking-wider text-white flex items-center justify-center gap-2 border-[3px]"
              style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}
            >
              <ArrowLeft size={15} />Back to Store
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "#F2EEE5" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-7 overflow-hidden"
        style={{ background: "#FFFFFF", border: "3px solid #131313", boxShadow: "9px 10px 0 #131313" }}
      >
        <div className="pattern-dots absolute inset-0 pointer-events-none opacity-40" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-[3px] -rotate-6"
              style={{ background: "#00B06F", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}>
              <Bot size={30} color="#fff" />
            </div>
          </div>
          <div className="text-center mb-5">
            <h1 className="font-display text-2xl sm:text-3xl uppercase leading-none mb-2">
              Automated <span className="text-outline">Delivery</span>
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "#6B655C" }}>
              Our bot delivers instantly — no waiting for an agent
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {["Username", "How It Works", "Delivering", "Delivered"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <StepDot active={progressIdx === i} done={progressIdx > i} />
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: progressIdx >= i ? "#131313" : "rgba(19,19,19,.4)" }}>
                    {label}
                  </span>
                </div>
                {i < 3 && <div className="w-6 h-[3px] rounded-full" style={{ background: progressIdx > i ? "#00B06F" : "rgba(19,19,19,.15)" }} />}
              </div>
            ))}
          </div>

          {/* Step content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl p-5 bg-white"
            style={{ border: "2px solid #131313", boxShadow: "4px 4px 0 #131313" }}
          >
            <AnimatePresence mode="wait">
              {/* ── STEP 1: username ── */}
              {step === "username" && (
                <motion.div key="username" className="space-y-3"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-1">
                    <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border-2 rotate-[-5deg]"
                      style={{ borderColor: "#131313", background: "#F2EEE5" }}>
                      <Gamepad2 size={18} />
                    </div>
                    <p className="text-sm font-bold mb-0.5">Confirm Your Details</p>
                    <p className="text-[11px]" style={{ color: "#6B655C" }}>
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
                    <div className="rounded-xl p-3" style={{ background: "#E9F8EF", border: "2px solid #00B06F" }}>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] mb-1.5" style={{ color: "#00875A" }}>
                        <Package size={10} className="inline mr-1" />Your Items
                      </p>
                      {order.items.map((it, idx) => (
                        <p key={idx} className="text-[11px] font-semibold">
                          {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl p-3" style={{ background: "#FFF6DC", border: "2px solid #FFC800" }}>
                      <p className="text-[10px] leading-relaxed font-medium" style={{ color: "#92670a" }}>
                        <AlertTriangle size={10} className="inline mr-1" />
                        No recent order found on this device. Your items will be resolved from your paid order automatically.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleContinueFromUsername}
                    className="w-full py-3 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white flex items-center justify-center gap-2 border-[3px]"
                    style={{ background: "#00B06F", borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}
                  >
                    Confirm & Continue <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full py-2.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-white border-2 hover:bg-[#131313] hover:text-white transition-colors"
                    style={{ borderColor: "#131313" }}
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
                    <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border-2 rotate-[4deg]"
                      style={{ borderColor: "#131313", background: "#F2EEE5" }}>
                      <Bot size={18} />
                    </div>
                    <p className="text-sm font-bold mb-0.5">How It Works</p>
                    <p className="text-[11px]" style={{ color: "#6B655C" }}>
                      Follow these steps — the bot handles the rest
                    </p>
                  </div>
                  <div className="space-y-2">
                    {DELIVERY_INSTRUCTIONS.map((line, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl p-2.5 bg-white"
                        style={{ border: "2px solid #131313" }}>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border-[1.5px]"
                          style={{ background: "#FFC800", borderColor: "#131313" }}>
                          <span className="font-mono text-[9px] font-bold">{i + 1}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed flex-1 font-medium">{line}</p>
                      </div>
                    ))}
                  </div>
                  {createError && (
                    <p className="text-[11px] text-center font-mono" style={{ color: "#E2231A" }}>{createError}</p>
                  )}
                  <button
                    onClick={handleCreateSession}
                    disabled={creating}
                    className="w-full py-3 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white flex items-center justify-center gap-2 border-[3px] disabled:opacity-60"
                    style={{ background: "#00B06F", borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}
                  >
                    {creating ? <><Loader2 size={15} className="animate-spin" />Starting Bot…</> : <><Bot size={15} />Start Delivery</>}
                  </button>
                  <button
                    onClick={() => setStep("username")}
                    className="w-full py-2.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-white border-2 hover:bg-[#131313] hover:text-white transition-colors"
                    style={{ borderColor: "#131313" }}
                  >
                    <ArrowLeft size={13} />Back
                  </button>
                </motion.div>
              )}

              {/* ── STEP 3: delivering ── */}
              {step === "delivering" && (
                <motion.div key="delivering" className="py-4 text-center space-y-4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], rotate: [-4, 4, -4] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border-[3px]"
                    style={{ background: "#00B06F", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}
                  >
                    <Bot size={28} color="#fff" />
                  </motion.div>
                  <div>
                    <p className="font-display text-lg uppercase mb-1">Bot Delivering Your Items…</p>
                    <p className="text-[11px]" style={{ color: "#6B655C" }}>
                      Stay inside the game. This usually takes 1–3 minutes.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 rounded-full border-[2.5px] border-t-transparent"
                      style={{ borderColor: "#131313" }}
                    />
                    <span className="text-xs font-semibold" style={{ color: "#00875A" }}>
                      {session?.items?.length
                        ? `Delivering ${session.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}`
                        : "Waiting for delivery…"}
                    </span>
                  </div>
                  {session?.items?.length ? (
                    <div className="rounded-xl p-3 text-left" style={{ background: "#F7F4EC", border: "2px solid #131313" }}>
                      {session.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 py-1">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border-[1.5px]"
                            style={{ background: "#F2EEE5", borderColor: "#131313" }}>
                            <Package size={11} />
                          </div>
                          <p className="text-[11px] font-semibold flex-1">
                            {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                          </p>
                          {it.category && (
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded font-bold text-white"
                              style={{ background: "#00B06F", border: "1.5px solid #131313" }}>
                              {it.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => { setRetryKey(k => k + 1); }}
                    className="mx-auto flex items-center gap-1.5 py-2 px-4 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider bg-white border-2 hover:bg-[#131313] hover:text-white transition-colors"
                    style={{ borderColor: "#131313" }}
                  >
                    <RefreshCw size={12} />Check Status
                  </button>
                </motion.div>
              )}

              {/* ── STEP 4: delivered ── */}
              {step === "delivered" && (
                <motion.div key="delivered" className="py-4 text-center space-y-4"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <motion.div
                    initial={{ scale: 0, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border-[3px]"
                    style={{ background: "#00B06F", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}
                  >
                    <CheckCheck size={28} color="#fff" />
                  </motion.div>
                  <div>
                    <p className="font-display text-xl uppercase mb-1">Items Delivered! ✓</p>
                    <p className="text-[11px]" style={{ color: "#00875A" }}>
                      Your items have been delivered to your Roblox account. Check your inventory!
                    </p>
                  </div>
                  {session?.items?.length ? (
                    <div className="rounded-xl p-3 text-left" style={{ background: "#E9F8EF", border: "2px solid #00B06F" }}>
                      {session.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 py-1">
                          <Check size={11} color="#00875A" strokeWidth={3} className="flex-shrink-0" />
                          <p className="text-[11px] font-semibold flex-1">
                            {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => navigate("/")}
                    className="w-full py-3 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white flex items-center justify-center gap-2 border-[3px]"
                    style={{ background: "#131313", borderColor: "#131313", boxShadow: "4px 4px 0 rgba(226,35,26,.9)" }}
                  >
                    <Star size={15} fill="#FFC800" stroke="#FFC800" />Back to Store
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <p className="text-center font-mono text-[9px] uppercase tracking-[0.14em] mt-4" style={{ color: "#8a8375" }}>
            Once delivered, this order is marked complete — it cannot be delivered again.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
