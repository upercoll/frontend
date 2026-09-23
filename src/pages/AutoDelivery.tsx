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
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#F4F8FB" }}>{label}</label>
      <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all"
        style={{ background: "#0C141B", border: `1.5px solid ${error ? "rgba(248,113,113,0.5)" : focused ? "#3BA7FF" : "#2C414E"}` }}>
        {icon && <span style={{ color: focused ? "#3BA7FF" : "#637784", flexShrink: 0 }}>{icon}</span>}
        <input type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#475569] min-w-0" />
      </div>
      {error && <p className="text-[11px]" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className="w-2 h-2 rounded-full transition-all"
      style={{ background: done ? "#22C55E" : active ? "#3BA7FF" : "#2C414E", boxShadow: active ? "0 0 8px rgba(59,167,255,0.5)" : "none" }} />
  );
}

function HeroPanel({ step }: { step: Step }) {
  const stepText: Record<Step, string> = {
    username: "Enter your Roblox username and we'll handle the rest — fast, safe, fully automated.",
    instructions: "Follow these quick steps. Our bot does all the heavy lifting.",
    delivering: "Our bot is working hard. Items arrive in 1-3 minutes.",
    delivered: "Your items are in your inventory. Enjoy!",
  };
  return (
    <div className="relative flex flex-col items-center justify-center text-center p-8 overflow-hidden" style={{ background: "#0D1520" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.4 }} />
        <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
        <div className="absolute top-[45%] left-[10%] w-1 h-1 rounded-full" style={{ background: "#5CB8FF", opacity: 0.25 }} />
        <div className="absolute top-[60%] right-[12%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.35 }} />
        <div className="absolute top-[80%] left-[25%] w-1.5 h-1.5 rounded-full" style={{ background: "#5CB8FF", opacity: 0.2 }} />
        <div className="absolute top-[15%] left-[50%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
        <div className="absolute top-[70%] right-[35%] w-1 h-1 rounded-full" style={{ background: "#5CB8FF", opacity: 0.25 }} />
        <div className="absolute top-[35%] left-[35%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.4 }} />
        <div className="absolute top-[55%] right-[45%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.3 }} />
        <div className="absolute top-[90%] left-[60%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.35 }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,167,255,0.15), transparent 70%)" }} />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }} className="relative z-10 mb-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 8px 24px rgba(59,167,255,0.3)" }}>
          <Star size={36} fill="white" color="white" />
        </div>
      </motion.div>
      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }} className="relative z-10">
        <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: "#F4F8FB" }}>
          RB<span style={{ color: "#3BA7FF" }}>stars</span>
        </h1>
        <p className="text-sm leading-relaxed max-w-[220px] mx-auto" style={{ color: "#637784" }}>
          {stepText[step]}
        </p>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3BA7FF" }} />
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
      <div className="min-h-screen" style={{ background: "#131C23" }}>
        <div className="w-full relative overflow-hidden sm:h-[73px] h-[60px]" style={{ borderBottom: "1px solid #2C414E", background: "#0F1920" }}>
          <img src="/item-star.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <img src="/item-gem.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <img src="/item-crystals.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <img src="/item-controller.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <img src="/item-sword.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <img src="/item-heart.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
          <button onClick={() => navigate("/")} className="absolute flex items-center gap-2 sm:gap-3 select-none z-10" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ background: "#3BA7FF", boxShadow: "0 2px 10px rgba(59,167,255,0.4)" }}>
              <Star size={18} fill="white" color="white" />
            </div>
            <span className="font-extrabold tracking-tight text-white" style={{ fontSize: 22, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
              RB<span style={{ color: "#3BA7FF" }}>stars</span>
            </span>
          </button>
        </div>
        <div className="flex items-center justify-center px-4 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl p-8 text-center space-y-4"
            style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "rgba(251,191,36,0.15)", border: "1px solid #fbbf24" }}>
              <AlertTriangle size={24} color="#fbbf24" />
            </div>
            <p className="text-lg font-extrabold" style={{ color: "#F4F8FB" }}>Auto Delivery Only for Grow A Garden 2</p>
            <p className="text-sm" style={{ color: "#637784" }}>
              This order is for a different game. Please use the Claim Chat to connect with a delivery agent.
            </p>
            <button onClick={() => navigate("/")}
              className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
              style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9" }}>
              <ArrowLeft size={15} /> Back to Store
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#131C23" }}>
      {/* Topbar */}
      <div className="w-full relative overflow-hidden sm:h-[73px] h-[60px]" style={{ borderBottom: "1px solid #2C414E", background: "#0F1920" }}>
        <img src="/item-star.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-gem.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-crystals.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-controller.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-sword.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-heart.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <button onClick={() => navigate("/")} className="absolute flex items-center gap-2 sm:gap-3 select-none z-10" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ background: "#3BA7FF", boxShadow: "0 2px 10px rgba(59,167,255,0.4)" }}>
            <Star size={18} fill="white" color="white" />
          </div>
          <span className="font-extrabold tracking-tight text-white" style={{ fontSize: 22, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            RB<span style={{ color: "#3BA7FF" }}>stars</span>
          </span>
        </button>
      </div>

      {/* Main split layout */}
      <div className="flex flex-col sm:flex-row min-h-[calc(100vh-73px)]">
        {/* Left hero panel — desktop only */}
        <div className="hidden sm:flex w-[380px] flex-shrink-0">
          <HeroPanel step={step} />
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg mx-auto">

            {/* Mobile logo */}
            <div className="sm:hidden flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#3BA7FF" }}>
                <Star size={17} fill="white" color="white" />
              </div>
              <span className="text-lg font-black" style={{ color: "#F4F8FB" }}>RB<span style={{ color: "#3BA7FF" }}>stars</span></span>
            </div>

            {/* Step header */}
            <div className="mb-5 text-center">
              <img src="/bot-mascot.webp" alt="" className="w-40 h-40 mx-auto mb-4 object-contain" style={{ filter: "drop-shadow(0 4px 20px rgba(59,167,255,0.3))" }} />
              <h2 className="text-2xl font-extrabold mb-1" style={{ color: "#F4F8FB" }}>
                {step === "username" && "Confirm Your Details"}
                {step === "instructions" && "How It Works"}
                {step === "delivering" && "Delivering Your Items"}
                {step === "delivered" && "Items Delivered!"}
              </h2>
              <p className="text-sm" style={{ color: "#637784" }}>
                {step === "username" && "The bot delivers to this exact Roblox account"}
                {step === "instructions" && "Follow these steps — the bot handles the rest"}
                {step === "delivering" && "Stay inside the game, this usually takes 1-3 minutes"}
                {step === "delivered" && "Your items are in your inventory"}
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-5">
              {["Details", "Instructions", "Delivering", "Done"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <StepDot active={progressIdx === i} done={progressIdx > i} />
                    <span className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: progressIdx >= i ? "#3BA7FF" : "#475569" }}>{label}</span>
                  </div>
                  {i < 3 && <div className="w-8 h-px" style={{ background: progressIdx > i ? "#22C55E" : "#2C414E" }} />}
                </div>
              ))}
            </div>

            {/* Container card */}
            <div className="rounded-2xl p-6" style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
              {/* Step content */}
              <div>
              <AnimatePresence mode="wait">
                {step === "username" && (
                  <motion.div key="username" className="space-y-4"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                    <Field label="Roblox Username" placeholder="Your in-game username" value={robloxUser}
                      onChange={setRobloxUser} icon={<Gamepad2 size={15} />} error={formErrors.robloxUser} />
                    <Field label="Contact Email" placeholder="For order notifications" value={contactEmail}
                      onChange={setContactEmail} icon={<Mail size={15} />} type="email" error={formErrors.contactEmail} />
                    {order?.items?.length ? (
                      <div className="rounded-xl p-3.5" style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#3BA7FF" }}>
                          <Package size={10} className="inline mr-1" />Your Items
                        </p>
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 py-1">
                            {it.image ? (
                              <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                                style={{ background: "#1C2A34", border: "1.5px solid #F4F8FB" }}>
                                <img src={it.image} alt="" className="w-6 h-6 object-contain" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: it.gradient?.[0] || "#2C414E" }} />
                            )}
                            <p className="text-[12px] font-semibold" style={{ color: "#F4F8FB" }}>
                              {it.name}{it.quantity > 1 ? ` x${it.quantity}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                        <p className="text-[11px] leading-relaxed" style={{ color: "#fbbf24" }}>
                          <AlertTriangle size={10} className="inline mr-1" />
                          No recent order found. Your items will be resolved from your paid order.
                        </p>
                      </div>
                    )}
                    <button onClick={handleContinueFromUsername}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                      style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9" }}>
                      Confirm & Continue <ArrowRight size={15} />
                    </button>
                    <button onClick={() => navigate("/")}
                      className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      style={{ background: "#0C141B", border: "1px solid #2C414E", color: "#9BAEBB" }}>
                      <ArrowLeft size={13} /> Back to Store
                    </button>
                  </motion.div>
                )}

                {step === "instructions" && (
                  <motion.div key="instructions" className="space-y-3"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <div className="space-y-2.5">
                      {DELIVERY_INSTRUCTIONS.map((line, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                          style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: "#3BA7FF", boxShadow: "0 2px 0 0 #2980b9" }}>
                            <span className="text-[10px] font-extrabold text-white">{i + 1}</span>
                          </div>
                          <p className="text-[12px] leading-relaxed flex-1" style={{ color: "#F4F8FB" }}>{line}</p>
                        </div>
                      ))}
                    </div>
                    {createError && (
                      <p className="text-[11px] text-center" style={{ color: "#f87171" }}>{createError}</p>
                    )}
                    <button onClick={handleCreateSession} disabled={creating}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                      style={{ background: "#22C55E", boxShadow: "0 4px 0 0 #15803d", opacity: creating ? 0.7 : 1 }}>
                      {creating ? <><Loader2 size={16} className="animate-spin" />Starting Bot...</> : "Start Delivery"}
                    </button>
                    <button onClick={() => setStep("username")}
                      className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      style={{ background: "#0C141B", border: "1px solid #2C414E", color: "#9BAEBB" }}>
                      <ArrowLeft size={13} /> Back
                    </button>
                  </motion.div>
                )}

                {step === "delivering" && (
                  <motion.div key="delivering" className="py-8 text-center space-y-5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div animate={{ scale: [1, 1.08, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                      style={{ background: "#22C55E", boxShadow: "0 0 40px rgba(34,197,94,0.4)" }}>
                      <Bot size={28} color="white" />
                    </motion.div>
                    <div>
                      <p className="text-lg font-extrabold mb-1" style={{ color: "#F4F8FB" }}>Bot Delivering Your Items...</p>
                      <p className="text-[11px]" style={{ color: "#637784" }}>Stay inside the game. Usually takes 1-3 minutes.</p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <motion.div animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 rounded-full border-2"
                        style={{ borderColor: "#22C55E", borderTopColor: "transparent" }} />
                      <span className="text-xs font-semibold" style={{ color: "#22C55E" }}>
                        {session?.items?.length
                          ? `Delivering ${session.items.map(i => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(", ")}`
                          : "Waiting for delivery..."}
                      </span>
                    </div>
                    {session?.items?.length ? (
                      <div className="rounded-xl p-3.5 text-left" style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
                        {session.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 py-1.5">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: "rgba(59,167,255,0.15)" }}>
                              <Package size={11} color="#3BA7FF" />
                            </div>
                            <p className="text-[11px] font-semibold flex-1" style={{ color: "#F4F8FB" }}>
                              {it.name}{it.quantity > 1 ? ` x${it.quantity}` : ""}
                            </p>
                            {it.category && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>{it.category}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <button onClick={() => setRetryKey(k => k + 1)}
                      className="mx-auto flex items-center gap-1.5 py-2 px-4 rounded-xl text-[11px] font-semibold"
                      style={{ background: "#0C141B", border: "1px solid #2C414E", color: "#9BAEBB" }}>
                      <RefreshCw size={12} /> Check Status
                    </button>
                  </motion.div>
                )}

                {step === "delivered" && (
                  <motion.div key="delivered" className="py-8 text-center space-y-5"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                      className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                      style={{ background: "#22C55E", boxShadow: "0 0 40px rgba(34,197,94,0.5)" }}>
                      <CheckCheck size={28} color="white" />
                    </motion.div>
                    <div>
                      <p className="text-xl font-extrabold mb-1" style={{ color: "#F4F8FB" }}>Items Delivered!</p>
                      <p className="text-[12px]" style={{ color: "#22C55E" }}>Check your Roblox inventory.</p>
                    </div>
                    {session?.items?.length ? (
                      <div className="rounded-xl p-3.5 text-left" style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
                        {session.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 py-1.5">
                            <Check size={11} color="#22C55E" className="flex-shrink-0" />
                            <p className="text-[12px] font-semibold flex-1" style={{ color: "#F4F8FB" }}>
                              {it.name}{it.quantity > 1 ? ` x${it.quantity}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <button onClick={() => navigate("/")}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                      style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9" }}>
                      Back to Store
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>

            <p className="text-center text-[10px] mt-4" style={{ color: "#475569" }}>
              Once delivered, this order is marked complete and cannot be delivered again.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
