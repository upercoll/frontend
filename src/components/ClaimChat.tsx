import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Check, User, Mail,
  Gamepad2, Loader2, CheckCheck, Clock, Star
} from "lucide-react";

interface Message {
  id: string;
  sender: "customer" | "agent" | "system";
  text: string;
  senderName: string;
  timestamp: Date;
}

type ChatStep = "idle" | "form" | "waiting" | "active" | "ended" | "claimed";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(new Date(d));
}

function fmtSlotCountdown(slotHhmm: string) {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const [h, m] = slotHhmm.split(":").map(Number);
  const target = new Date(now);
  target.setUTCHours(h, m, 0, 0);
  if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
  const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;
  if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, "0")}m`;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
      <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: `1.5px solid ${error ? "rgba(248,113,113,0.6)" : focused ? "#7c3aed" : "rgba(196,181,253,0.2)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
        }}>
        {icon && <span style={{ color: "#7c3aed", flexShrink: 0 }}>{icon}</span>}
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#6b5c8a] font-medium min-w-0"
        />
      </div>
      {error && <p className="text-[10px]" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}

function Bubble({ msg }: { msg: Message }) {
  if (msg.sender === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-1"
      >
        <span className="text-[10px] px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(196,181,253,0.1)", color: "#a78bfa" }}>
          {msg.text}
        </span>
      </motion.div>
    );
  }

  const isCustomer = msg.sender === "customer";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 ${isCustomer ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isCustomer && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
          style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
          <Star size={10} fill="white" color="white" />
        </div>
      )}
      <div className={`max-w-[78%] ${isCustomer ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        {!isCustomer && (
          <span className="text-[9px] font-bold ml-1" style={{ color: "#a78bfa" }}>{msg.senderName}</span>
        )}
        <div
          className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
          style={{
            background: isCustomer
              ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
              : "rgba(255,255,255,0.07)",
            color: "white",
            borderRadius: isCustomer ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          }}
        >
          {msg.text}
        </div>
        <span className="text-[9px] mx-1" style={{ color: "#4a3a6b" }}>{fmtTime(msg.timestamp)}</span>
      </div>
    </motion.div>
  );
}

interface ClaimChatProps {
  orderEmail?: string;
}

export default function ClaimChat({ orderEmail = "" }: ClaimChatProps) {
  const [step, setStep] = useState<ChatStep>("idle");
  const [open, setOpen] = useState(false);

  const [robloxUser, setRobloxUser] = useState("");
  const [contactEmail, setContactEmail] = useState(orderEmail);
  const [nextSlotAt, setNextSlotAt] = useState<string | null>(null);
  const [, setSlotTick] = useState(0);

  useEffect(() => {
    if (!nextSlotAt) return;
    const id = setInterval(() => setSlotTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [nextSlotAt]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentTyping, setAgentTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentTyping]);

  useEffect(() => {
    if (step === "active" && open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step, open]);

  useEffect(() => {
    if (!roomId) return;

    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.emit("claim:join", { roomId });

    socket.on("claim:agent_joined", ({ agentName: name }: { agentName: string }) => {
      const displayName = name || "RBstars Agent";
      setAgentName(displayName);
      setStep("active");
    });

    socket.on("claim:new_message", (msg: { _id?: string; sender: string; text: string; senderName: string; timestamp: string }) => {
      setMessages(prev => [
        ...prev,
        {
          id: msg._id?.toString() || makeId(),
          sender: msg.sender as Message["sender"],
          text: msg.text,
          senderName: msg.senderName,
          timestamp: new Date(msg.timestamp),
        },
      ]);
    });

    socket.on("claim:typing", ({ senderName }: { senderName: string }) => {
      if (senderName === robloxUser) return;
      setAgentTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setAgentTyping(false), 2500);
    });

    socket.on("claim:ended", () => {
      setStep("ended");
      setAgentTyping(false);
    });

    socket.on("claim:marked_claimed", () => {
      setStep("claimed");
      setAgentTyping(false);
      try { localStorage.removeItem("rbstars_last_order"); } catch {}
    });

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  async function handleFormSubmit() {
    const e: Record<string, string> = {};
    if (!robloxUser.trim()) e.robloxUser = "Enter your Roblox username";
    if (!contactEmail.includes("@")) e.contactEmail = "Enter a valid email";
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setSubmitting(true);

    try {
      let orderRef: string | undefined;
      let orderItems: { name: string; quantity: number }[] | undefined;
      let orderGame: string | null = null;
      try {
        const lastOrderRaw = localStorage.getItem("rbstars_last_order");
        if (lastOrderRaw) {
          const lastOrder = JSON.parse(lastOrderRaw);
          orderRef = lastOrder?.orderNumber || lastOrder?.orderRef;
          orderGame = lastOrder?.game || null;
          orderItems = lastOrder?.items?.map((i: { productSnapshot?: { name?: string }; name?: string; quantity?: number }) => ({
            name: i.productSnapshot?.name || i.name || "",
            quantity: i.quantity || 1,
          }));
        }
      } catch {}

      const urlGame = window.location.pathname.match(/^\/game\/([^/]+)/)?.[1] || null;
      const game = urlGame || orderGame;

      const resp = await fetch(`${BACKEND_URL}/api/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robloxUsername: robloxUser.trim(),
          contactEmail,
          orderRef,
          game,
          items: orderItems,
          itemName: orderItems?.[0]?.name || null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || "Failed to start chat");

      const newRoomId: string = data.data.roomId;
      setRoomId(newRoomId);

      const seedMsgs: Message[] = (data.data.messages || []).map((m: {
        sender: string; text: string; senderName: string; timestamp: string;
      }) => ({
        id: makeId(),
        sender: m.sender as Message["sender"],
        text: m.text,
        senderName: m.senderName,
        timestamp: new Date(m.timestamp),
      }));
      setMessages(seedMsgs);

      const sessionStatus: string = data.data.status;
      if (sessionStatus === "claimed") {
        if (data.data.assignedAgent?.name) setAgentName(data.data.assignedAgent.name);
        setStep("claimed");
      } else if (sessionStatus === "ended") {
        if (data.data.assignedAgent?.name) setAgentName(data.data.assignedAgent.name);
        setStep("ended");
      } else if (sessionStatus === "active") {
        if (data.data.assignedAgent?.name) setAgentName(data.data.assignedAgent.name);
        setStep("active");
      } else {
        setNextSlotAt(data.data.nextSlotAt || null);
        setStep("waiting");
      }
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || step !== "active" || !roomId || !socketRef.current) return;
    setInput("");
    socketRef.current.emit("claim:message", {
      roomId,
      text,
      senderName: robloxUser,
      sender: "customer",
    });
  }

  function renderBody() {
    if (step === "idle" || step === "form") {
      return (
        <div className="flex flex-col h-full">
          {}
          <div className="p-4 pb-3 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
              <MessageSquare size={22} color="white" />
            </div>
            <h3 className="text-base font-extrabold text-white mb-1">Connect with Claim Team</h3>
            <p className="text-xs leading-relaxed" style={{ color: "#a78bfa" }}>
              Fill in your details below and our team will join shortly to deliver your items.
            </p>
          </div>

          {}
          <div className="flex-1 px-4 space-y-3 overflow-y-auto">
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
            <div className="rounded-xl p-3" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(196,181,253,0.12)" }}>
              <p className="text-[10px] leading-relaxed" style={{ color: "#a78bfa" }}>
                📧 A confirmation will be sent to your email when the claim team joins. You can close this chat and return any time.
              </p>
            </div>
            {formErrors.submit && (
              <p className="text-[11px] text-center" style={{ color: "#f87171" }}>{formErrors.submit}</p>
            )}
          </div>

          {}
          <div className="p-4 pt-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleFormSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#dc2626,#9f1239)" }}
            >
              {submitting ? <><Loader2 size={15} className="animate-spin" />Connecting…</> : <><MessageSquare size={15} />Start Claim Chat</>}
            </motion.button>
          </div>
        </div>
      );
    }

    if (step === "waiting") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={scrollRef}>
            {messages.map(m => <Bubble key={m.id} msg={m} />)}
          </div>

          {}
          <div className="p-4 text-center border-t" style={{ borderColor: "rgba(196,181,253,0.08)" }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="w-4 h-4 rounded-full border-2 border-t-transparent"
                style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }}
              />
              <span className="text-xs font-semibold" style={{ color: "#a78bfa" }}>Waiting for claim team…</span>
            </div>
            <p className="text-[10px]" style={{ color: "#4a3a6b" }}>Usually responds within 2–5 minutes</p>
            {nextSlotAt && (
              <div className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(196,181,253,0.2)", color: "#a78bfa" }}>
                <Clock size={11} />
                <span>Opens at {nextSlotAt} GMT+3</span>
                <span className="font-mono opacity-70">({fmtSlotCountdown(nextSlotAt)})</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (step === "active" || step === "ended" || step === "claimed") {
      return (
        <div className="flex flex-col h-full">
          {}
          {agentName && (
            <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: "rgba(196,181,253,0.08)", background: "rgba(124,58,237,0.08)" }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#7c3aed" }}>
                <Star size={9} fill="white" color="white" />
              </div>
              <span className="text-xs font-bold text-white">{agentName}</span>
              {step === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto" />}
              {step === "claimed" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>✓ Delivered</span>}
              {step === "ended" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(107,92,138,0.3)", color: "#a78bfa" }}>Ended</span>}
            </div>
          )}

          {}
          <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
            {messages.map(m => <Bubble key={m.id} msg={m} />)}
            {agentTyping && (
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                  <Star size={10} fill="white" color="white" />
                </div>
                <div className="px-3 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", borderRadius: "18px 18px 18px 4px" }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#a78bfa" }}
                        animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {}
          {(step === "ended" || step === "claimed") && (
            <div className="px-4 py-3 text-center" style={{ borderTop: "1px solid rgba(196,181,253,0.08)" }}>
              <div className="rounded-xl p-3" style={{ background: step === "claimed" ? "rgba(34,197,94,0.1)" : "rgba(124,58,237,0.1)", border: `1px solid ${step === "claimed" ? "rgba(34,197,94,0.25)" : "rgba(196,181,253,0.12)"}` }}>
                {step === "claimed" ? (
                  <>
                    <CheckCheck size={16} color="#4ade80" className="mx-auto mb-1" />
                    <p className="text-xs font-bold" style={{ color: "#4ade80" }}>Order Delivered!</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#6b5c8a" }}>Check your Roblox inventory</p>
                  </>
                ) : (
                  <>
                    <Clock size={16} color="#a78bfa" className="mx-auto mb-1" />
                    <p className="text-xs font-bold text-white">Chat Ended</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#6b5c8a" }}>Thank you for using RBstars!</p>
                  </>
                )}
              </div>
            </div>
          )}

          {}
          {step === "active" && (
            <div className="p-3 border-t" style={{ borderColor: "rgba(196,181,253,0.08)" }}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    if (socketRef.current && roomId && e.target.value.trim()) {
                      socketRef.current.emit("claim:typing", { roomId, senderName: robloxUser });
                    }
                  }}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#4a3a6b] px-3 py-2.5 rounded-xl min-w-0"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(196,181,253,0.15)" }}
                />
                <motion.button
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: input.trim() ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(124,58,237,0.15)" }}
                >
                  <Send size={14} color="white" />
                </motion.button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  }

  const hasUnread = step === "waiting" || step === "active";

  return (
    <>
      {}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 z-[300] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: 320,
              height: 480,
              background: "#110025",
              border: "1.5px solid rgba(196,181,253,0.18)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.15)",
            }}
          >
            {}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.35),rgba(109,40,217,0.2))", borderBottom: "1px solid rgba(196,181,253,0.1)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                  <Star size={13} fill="white" color="white" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white leading-tight">Claim Support</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[9px] font-semibold" style={{ color: "#4ade80" }}>
                      {step === "waiting" ? "Waiting for agent…" : step === "active" ? `Online — ${agentName}` : "RBstars Team"}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                <X size={14} color="#a78bfa" />
              </button>
            </div>

            {}
            <div className="flex-1 min-h-0">
              {renderBody()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 280, damping: 20 }}
        whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(124,58,237,0.7)" }}
        whileTap={{ scale: 0.92 }}
        onClick={() => { setOpen(o => !o); if (!open && step === "idle") setStep("form"); }}
        className="fixed bottom-6 right-4 z-[300] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 4px 24px rgba(124,58,237,0.55)" }}
      >
        {}
        {hasUnread && (
          <motion.span
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full"
            style={{ background: "#7c3aed" }}
          />
        )}
        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#7c3aed]" />
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={22} color="white" /></motion.div>
            : <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageSquare size={22} color="white" strokeWidth={2} /></motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </>
  );
}
