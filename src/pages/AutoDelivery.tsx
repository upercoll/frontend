import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Gamepad2, Mail, ArrowLeft, ArrowRight, Loader2, Check,
  CheckCheck, Package, Star, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { P } from "@/lib/storefront";
import { TopNav } from "./Home";
import { RBstar, MailboxGlyph, DeliveryScene } from "@/components/Art";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";
const AUTO_ONLY_GAME = "grow-a-garden-2";

interface LastOrder {
  orderRef: string;
  email: string;
  game?: string | null;
  items?: { id: string; name: string; quantity: number; gradient?: [string, string]; image?: string }[];
}

interface SessionInfo {
  roomId: string;
  status: string;
  mode: string;
  items: { name: string; quantity: number; category?: string }[];
  game: string | null;
  orderRef: string | null;
}

type Step = "username" | "instructions" | "delivering" | "delivered";

const DELIVERY_INSTRUCTIONS = [
  "Join Grow A Garden 2 on the Roblox account matching the username you entered.",
  "Stay inside the server — our bot will find you and deliver your items automatically.",
  "Make sure your in-game privacy settings allow receiving gifts.",
  "Delivery usually takes 1-3 minutes. Do not leave the server until you see the delivered confirmation.",
];

function loadLastOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem("rbstars_last_order");
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch { return null; }
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
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: P.muted }}>{label}</label>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-shadow focus-within:ring-4 focus-within:ring-[#2f8cff]/25"
        style={{ background: P.card, border: `1.5px solid ${error ? "rgba(245,158,11,0.55)" : focused ? P.accentDeep : P.borderStrong}` }}>
        {icon && <span style={{ color: focused ? P.accentDeep : P.faint, flexShrink: 0 }}>{icon}</span>}
        <input type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium min-w-0 placeholder:text-[#8a97ba]"
          style={{ color: P.text }} />
      </div>
      {error && <p className="text-[11px]" style={{ color: P.warn }}>{error}</p>}
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className="w-2 h-2 rounded-full transition-all"
      style={{ background: done ? P.good : active ? P.accentDeep : P.borderStrong, boxShadow: active ? `0 0 0 3px ${P.accentTint}` : "none" }} />
  );
}

function HeroPanel({ step }: { step: Step }) {
  const [, navigate] = useLocation();
  const stepText: Record<Step, string> = {
    username: "Enter your Roblox username and we'll handle the rest — fast, safe, fully automated.",
    instructions: "Follow these quick steps. Our bot does all the heavy lifting.",
    delivering: "Our bot is working hard. Items arrive in 1-3 minutes.",
    delivered: "Your items are in your inventory. Enjoy!",
  };
  return (
    /* The persistent side panel: the page's alternating band — flat navy,
       and the copy is the only thing in it. */
    <div className="relative flex flex-col items-center justify-center text-center p-10 overflow-hidden"
      style={{ background: P.band, borderRight: `1px solid ${P.border}` }}>
      <button onClick={() => navigate("/")} aria-label="RBstars home"
        className="relative z-10 mb-6 select-none">
        <img src="/rb-logo.png" alt="RBstars" className="w-20 h-20 rounded-full object-cover" />
      </button>
      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }} className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: P.accentDeep }}>
          Auto Delivery
        </p>
        <p className="text-[15px] leading-relaxed max-w-[260px] mx-auto" style={{ color: P.muted }}>
          {stepText[step]}
        </p>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: P.accent }} />
    </div>
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

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

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
          window.dispatchEvent(new CustomEvent("rbstars:claim-delivered", { detail: { orderRef: s.orderRef } }));
          setSession(prev => ({ ...(prev || s), status: "claimed" }));
          setStep("delivered");
        }
      } catch {}
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
        body: JSON.stringify({ robloxUsername: robloxUser.trim(), contactEmail: contactEmail.trim(), orderRef: order?.orderRef || null, game: order?.game || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to start automated delivery");
      setSession(data.data);
      setStep("delivering");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setCreating(false); }
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
      <div className="min-h-screen rglow">
      <TopNav onHome={() => navigate("/")} />
        <div className="flex items-center justify-center px-4 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl p-8 text-center space-y-4"
            style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}>
            {/* Wrong-game state: attention, not alarm — amber says "do this
                instead", which is what the Claim Chat instruction needs. */}
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: P.warnTint, border: "1px solid rgba(245,158,11,0.45)" }}>
              <AlertTriangle size={24} color={P.warn} />
            </div>
            <p className="text-lg font-extrabold" style={{ color: P.text }}>Auto Delivery Only for Grow A Garden 2</p>
            <p className="text-sm" style={{ color: P.muted }}>
              This order is for a different game. Please use the Claim Chat to connect with a delivery agent.
            </p>
            <button onClick={() => navigate("/")}
              className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
              style={{ background: P.accentDeep, boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}>
              <ArrowLeft size={15} /> Back to Store
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rglow">
      <TopNav onHome={() => navigate("/")} />

      {/* Main split layout */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left hero panel — desktop only */}
        <div className="hidden md:flex w-[380px] flex-shrink-0">
          <HeroPanel step={step} />
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg mx-auto">

            {/* Mobile logo */}
            <div className="sm:hidden flex items-center gap-2.5 mb-6">
              <img src="/rb-logo.png" alt="RBstars" className="w-10 h-10 object-contain" />
            </div>

            {/* Step header — the mascot is gone; each state now carries the
                delivery graphic that actually belongs to it, down in the card. */}
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-extrabold mb-1" style={{ color: P.text }}>
                {step === "username" && "Confirm Your Details"}
                {step === "instructions" && "How It Works"}
                {step === "delivering" && "Delivering Your Items"}
                {step === "delivered" && "Items Delivered!"}
              </h2>
              <p className="text-sm" style={{ color: P.muted }}>
                {step === "username" && "The bot delivers to this exact Roblox account"}
                {step === "instructions" && "Follow these steps — the bot handles the rest"}
                {step === "delivering" && "Stay inside the game, this usually takes 1-3 minutes"}
                {step === "delivered" && "Your items are in your inventory"}
              </p>
            </div>

            {/* Stepper — wraps on narrow screens; connectors shrink on
                mobile so the four steps fit a 320px phone in one or two rows */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 mb-5">
              {["Details", "Instructions", "Delivering", "Done"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <StepDot active={progressIdx === i} done={progressIdx > i} />
                    <span className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: progressIdx >= i ? P.accentDeep : P.faint }}>{label}</span>
                  </div>
                  {i < 3 && <div className="w-2 sm:w-8 h-px" style={{ background: progressIdx > i ? P.good : P.border }} />}
                </div>
              ))}
            </div>

            {/* Container card */}
            <div className="rounded-2xl p-5 sm:p-6" style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}>
              {/* Step content */}
              <div>
              <AnimatePresence mode="wait">
                {step === "username" && (
                  <motion.div key="username" className="space-y-4"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                    {/* Head of the flow: packed → travels → your mailbox. One
                        graphic for this state, and it is the promise itself. */}
                    <DeliveryScene className="w-full max-w-[280px] h-auto mx-auto block" />
                    <Field label="Roblox Username" placeholder="Your in-game username" value={robloxUser}
                      onChange={setRobloxUser} icon={<Gamepad2 size={15} />} error={formErrors.robloxUser} />
                    <Field label="Contact Email" placeholder="For order notifications" value={contactEmail}
                      onChange={setContactEmail} icon={<Mail size={15} />} type="email" error={formErrors.contactEmail} />
                    {order?.items?.length ? (
                      <div className="rounded-xl p-3.5" style={{ background: P.band, border: `1px solid ${P.border}` }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: P.accentDeep }}>
                          <Package size={10} className="inline mr-1" />Your Items
                        </p>
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 py-1">
                            {it.image ? (
                              <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                                style={{ background: P.stage, border: `1.5px solid ${P.borderStrong}` }}>
                                <img src={it.image} alt="" className="w-6 h-6 object-contain" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: it.gradient?.[0] || P.borderStrong }} />
                            )}
                            <p className="text-[12px] font-semibold" style={{ color: P.text }}>
                              {it.name}{it.quantity > 1 ? ` x${it.quantity}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl p-3" style={{ background: P.warnTint, border: "1px solid rgba(245,158,11,0.45)" }}>
                        <p className="text-[11px] leading-relaxed" style={{ color: P.warn }}>
                          <AlertTriangle size={10} className="inline mr-1" />
                          No recent order found. Your items will be resolved from your paid order.
                        </p>
                      </div>
                    )}
                    <button onClick={handleContinueFromUsername}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                      style={{ background: P.accentDeep, boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}>
                      Confirm & Continue <ArrowRight size={15} />
                    </button>
                    <button onClick={() => navigate("/")}
                      className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      style={{ background: P.card, border: `1px solid ${P.borderStrong}`, color: P.muted }}>
                      <ArrowLeft size={13} /> Back to Store
                    </button>
                  </motion.div>
                )}

                {step === "instructions" && (
                  <motion.div key="instructions" className="space-y-3"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    {/* The how-it-works band: a P.band inset so it alternates
                        against the white card instead of darkening it. */}
                    <div className="space-y-2.5 rounded-2xl p-3"
                      style={{ background: P.band, border: `1px solid ${P.border}` }}>
                      {DELIVERY_INSTRUCTIONS.map((line, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                          style={{ background: P.card, border: `1px solid ${P.border}` }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: P.accentDeep, boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}>
                            <span className="text-[10px] font-extrabold text-white">{i + 1}</span>
                          </div>
                          <p className="text-[12px] leading-relaxed flex-1" style={{ color: P.text }}>{line}</p>
                        </div>
                      ))}
                    </div>
                    {createError && (
                      /* Retryable failure → amber, not scolding red. The
                         Start Delivery button directly below is the retry. */
                      <p className="text-[11px] text-center rounded-xl px-3 py-2.5 font-semibold"
                        style={{ background: P.warnTint, border: "1px solid rgba(245,158,11,0.45)", color: P.warn }}>{createError}</p>
                    )}
                    <button onClick={handleCreateSession} disabled={creating}
                      className="w-full py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(180deg,#0a84ff,#0a50d6)", color: "#fff", boxShadow: "0 8px 22px rgba(10,110,255,.4)", opacity: creating ? 0.7 : 1 }}>
                      {creating ? <><RBstar size={16} color="#fff" />Starting Bot...</> : "Start Delivery"}
                    </button>
                    <button onClick={() => setStep("username")}
                      className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      style={{ background: P.card, border: `1px solid ${P.borderStrong}`, color: P.muted }}>
                      <ArrowLeft size={13} /> Back
                    </button>
                  </motion.div>
                )}

                {step === "delivering" && (
                  <motion.div key="delivering" className="py-8 text-center space-y-5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Waiting state: the mailbox with its gold flag up — the
                        subject of this whole page — flat in an accent tint,
                        no glow. */}
                    <motion.div animate={{ scale: [1, 1.08, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                      style={{ background: P.accentTint, border: "1px solid rgba(47,140,255,0.3)" }}>
                      <MailboxGlyph size={36} />
                    </motion.div>
                    <div>
                      <p className="text-lg font-extrabold mb-1" style={{ color: P.text }}>Bot Delivering Your Items...</p>
                      <p className="text-[11px]" style={{ color: P.muted }}>Stay inside the game. Usually takes 1-3 minutes.</p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {/* Brand pulse instead of a spinner — the honest status
                          copy below it is what actually tells you anything. */}
                      <motion.div animate={{ scale: [1, 1.16, 1] }}
                        transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                        className="flex items-center justify-center flex-shrink-0">
                        <RBstar size={16} color={P.accentDeep} />
                      </motion.div>
                      <span className="text-xs font-semibold" style={{ color: P.accentDeep }}>
                        {session?.items?.length
                          ? `Delivering ${session.items.map(i => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(", ")}`
                          : "Waiting for delivery..."}
                      </span>
                    </div>
                    {session?.items?.length ? (
                      <div className="rounded-xl p-3.5 text-left" style={{ background: P.band, border: `1px solid ${P.border}` }}>
                        {session.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 py-1.5">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: P.accentTint }}>
                              <Package size={11} color={P.accentDeep} />
                            </div>
                            <p className="text-[11px] font-semibold flex-1" style={{ color: P.text }}>
                              {it.name}{it.quantity > 1 ? ` x${it.quantity}` : ""}
                            </p>
                            {it.category && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{ background: P.card, border: `1px solid ${P.borderStrong}`, color: P.muted }}>{it.category}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <button onClick={() => setRetryKey(k => k + 1)}
                      className="mx-auto flex items-center gap-1.5 py-2 px-4 rounded-xl text-[11px] font-semibold"
                      style={{ background: P.accentTint, border: "1px solid rgba(47,140,255,0.3)", color: P.accentDeep }}>
                      <RefreshCw size={12} /> Check Status
                    </button>
                  </motion.div>
                )}

                {step === "delivered" && (
                  <motion.div key="delivered" className="py-8 text-center space-y-5"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    {/* Payoff: calm and flat — mint tint, brand star, no glow
                        and no confetti. The promise already happened. */}
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                      className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                      style={{ background: P.goodTint, border: "1px solid rgba(95,224,142,0.45)" }}>
                      <RBstar size={28} color={P.star} />
                    </motion.div>
                    <div>
                      <p className="text-xl font-extrabold mb-1" style={{ color: P.text }}>Items Delivered!</p>
                      <p className="text-[12px]" style={{ color: P.good }}>Check your Roblox inventory.</p>
                    </div>
                    {session?.items?.length ? (
                      <div className="rounded-xl p-3.5 text-left" style={{ background: P.band, border: `1px solid ${P.border}` }}>
                        {session.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 py-1.5">
                            <Check size={11} color={P.good} className="flex-shrink-0" />
                            <p className="text-[12px] font-semibold flex-1" style={{ color: P.text }}>
                              {it.name}{it.quantity > 1 ? ` x${it.quantity}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <button onClick={() => navigate("/")}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                      style={{ background: P.accentDeep, boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}>
                      Back to Store
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>

            <p className="text-center text-[10px] mt-4" style={{ color: P.faint }}>
              Once delivered, this order is marked complete and cannot be delivered again.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
