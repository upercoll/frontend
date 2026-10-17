import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  Send, CheckCheck, Mail, Gamepad2,
  Loader2, Clock, Star, ArrowLeft, AlertTriangle, Package, ChevronRight,
  Quote, Reply, Shield,
} from "lucide-react";
import { P } from "@/lib/storefront";
import { TopNav } from "./Home";
import { RBstar, MailboxGlyph, SpeechBubble } from "@/components/Art";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

interface Message {
  id: string;
  sender: "customer" | "agent" | "system";
  text: string;
  senderName: string;
  timestamp: Date;
}

type PageStep = "order-select" | "select" | "form" | "waiting" | "active" | "ended" | "claimed";

interface LastOrder {
  orderRef: string;
  email: string;
  game?: string | null;
  items?: { id: string; name: string; quantity: number; gradient?: [string, string]; image?: string }[];
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}


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
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  type?: string;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? "rgba(255,90,77,0.5)" : focused ? P.accentDeep : P.borderStrong;
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: P.muted }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all focus-within:ring-4 focus-within:ring-[#2f8cff]/25"
        style={{ background: P.card, border: `1.5px solid ${borderColor}` }}
      >
        {icon && (
          <span style={{ color: focused ? P.accentDeep : P.faint, flexShrink: 0 }}>{icon}</span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium min-w-0 placeholder:text-[#8a97ba]"
          style={{ color: P.text }}
        />
      </div>
      {error && <p className="text-[11px]" style={{ color: P.bad }}>{error}</p>}
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className="w-2 h-2 rounded-full transition-all"
      style={{
        background: done ? P.good : active ? P.accentDeep : P.borderStrong,
        boxShadow: active ? `0 0 0 3px ${P.accentTint}` : "none",
      }}
    />
  );
}

function fmtFull(iso: string | Date) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + " at " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function relativeTime(iso: string | Date) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function PostAvatar({ sender }: { sender: string }) {
  if (sender === "agent") {
    return (
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ border: `2px solid ${P.accentDeep}`, boxShadow: P.shadow }}
      >
        <img src="/staff-avatar.webp" alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (sender === "system") {
    return (
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: P.band, border: `1px solid ${P.border}` }}
      >
        <Shield size={20} color={P.muted} />
      </div>
    );
  }
  return (
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ border: `2px solid ${P.good}`, boxShadow: P.shadow }}
    >
      <img src="/customer-avatar.png" alt="" className="h-full w-full object-cover" />
    </div>
  );
}

function PostAuthor({ msg }: { msg: Message }) {
  const roleLabel =
    msg.sender === "agent" ? "Support Agent"
    : msg.sender === "system" ? "System"
    : "Customer";
  // Sender names stay secondary on white; the role chip is a plain group chip
  // (blue = a group) for the agent and a neutral band chip for the buyer.
  const chipStyle = msg.sender === "agent"
    ? { background: P.accentTint, color: P.accentDeep }
    : { background: P.band, color: P.muted };
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold" style={{ color: P.muted }}>
        {msg.senderName || roleLabel}
      </span>
      <span
        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={chipStyle}
      >
        {roleLabel}
      </span>
    </div>
  );
}

function Post({ msg, onQuote }: { msg: Message; onQuote?: (text: string) => void }) {
  if (msg.sender === "system") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="h-px flex-1" style={{ background: P.border }} />
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
            style={{ background: P.band, border: `1px solid ${P.border}`, color: P.muted }}>
            <Shield size={12} />
            {msg.text}
          </span>
          <div className="h-px flex-1" style={{ background: P.border }} />
        </div>
      </motion.div>
    );
  }

  /* Two-sided thread: the buyer's own message is the blue side (accentDeep +
     white text), the agent's is the quiet band side with a hairline border.
     Alignment is untouched — only the colour of each side differs. */
  const isCustomer = msg.sender === "customer";
  const linkColor = isCustomer ? "#ffffff" : P.accentDeep;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="py-5" style={{ borderBottom: `1px solid ${P.border}` }}>
        {/* Post header */}
        <div className="mb-3 flex items-start gap-3">
          <PostAvatar sender={msg.sender} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PostAuthor msg={msg} />
            </div>
            <span className="mt-0.5 text-xs" style={{ color: P.faint }}>
              {relativeTime(msg.timestamp)} · {fmtFull(msg.timestamp)}
            </span>
          </div>
        </div>

        {/* Post content — the bubble itself */}
        <div className="mb-3 text-[15px] leading-[1.7] pl-4 pr-4 py-3 rounded-2xl sm:pl-15"
          style={{
            background: isCustomer ? P.accentDeep : P.band,
            color: isCustomer ? "#fff" : P.text,
            border: isCustomer ? "none" : `1px solid ${P.border}`,
          }}>
          {msg.text.split("\n").map((line, li) => {
            let html = line
              .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
              .replace(/_(.+?)_/g, "<i>$1</i>")
              .replace(/\[(.+?)\]\((.+?)\)/g, `<a href="$2" target="_blank" style="color:${linkColor};font-weight:600;text-decoration:${isCustomer ? "underline" : "none"}">$1</a>`)
              .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin-top:8px" />');
            return (
              <p key={li} className={li > 0 ? "mt-3" : ""}>
                <span dangerouslySetInnerHTML={{ __html: html }} />
              </p>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 sm:pl-15">
          <button className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: P.muted }}>
            <AlertTriangle size={13} />
            Report
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: P.muted }}
            onClick={() => onQuote?.(msg.text)}>
            <Quote size={13} />
            Quote
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: P.accentDeep }}
            onClick={() => onQuote?.("> " + msg.text.split("\n")[0])}>
            <Reply size={13} />
            Reply
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function HeroPanel({ step }: { step: PageStep }) {
  const [, navigate] = useLocation();
  const stepText: Record<PageStep, string> = {
    "order-select": "Select the order you'd like to claim items from.",
    "select": "Choose which item from your order you'd like to claim.",
    form: "Enter your details and our claim team will pick up your order right away.",
    waiting: "You\u2019re in the queue \u2014 an agent will join shortly.",
    active: "Live chat with a claim agent. They\u2019ll deliver your items.",
    ended: "This chat session has ended. Thank you for using RBstars!",
    claimed: "Your order is delivered! Check your Roblox inventory.",
  };
  /* The rule under the panel echoes the state the page is actually in —
     blue = talking/acting, amber = waiting on someone, mint = delivered. */
  const barColor =
    step === "waiting" ? P.warn
    : step === "claimed" ? P.good
    : step === "ended" ? P.muted
    : P.accentDeep;
  return (
    <div
      className="relative flex flex-col items-center justify-center text-center p-8 overflow-hidden rounded-2xl"
      style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full" style={{ background: P.accent, opacity: 0.4 }} />
        <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 rounded-full" style={{ background: P.accent, opacity: 0.3 }} />
        <div className="absolute top-[45%] left-[10%] w-1 h-1 rounded-full" style={{ background: P.accent, opacity: 0.25 }} />
        <div className="absolute top-[60%] right-[12%] w-1 h-1 rounded-full" style={{ background: P.accent, opacity: 0.35 }} />
        <div className="absolute top-[80%] left-[25%] w-1.5 h-1.5 rounded-full" style={{ background: P.accent, opacity: 0.2 }} />
        <div className="absolute top-[15%] left-[50%] w-1 h-1 rounded-full" style={{ background: P.accent, opacity: 0.3 }} />
        <div className="absolute top-[70%] right-[35%] w-1 h-1 rounded-full" style={{ background: P.accent, opacity: 0.25 }} />
        <div className="absolute top-[35%] left-[35%] w-0.5 h-0.5 rounded-full" style={{ background: P.accent, opacity: 0.4 }} />
        <div className="absolute top-[55%] right-[45%] w-0.5 h-0.5 rounded-full" style={{ background: P.accent, opacity: 0.3 }} />
        <div className="absolute top-[90%] left-[60%] w-0.5 h-0.5 rounded-full" style={{ background: P.accent, opacity: 0.35 }} />
      </div>
      {/* The radial glow behind the copy is gone — flat navy, flat colour. */}
      <div
        className="hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
        aria-hidden="true"
      />
      <button onClick={() => navigate("/")} aria-label="RBstars home"
        className="relative z-10 mb-6 select-none">
        <img src="/rb-logo.png" alt="RBstars" className="w-20 h-20 rounded-full object-cover" />
      </button>
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: P.accentDeep }}>
          Claim Chat
        </p>
        <p className="text-sm leading-relaxed max-w-[240px] mx-auto" style={{ color: P.muted }}>
          {stepText[step]}
        </p>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: barColor }} />
    </div>
  );
}

function loadOrders(): LastOrder[] {
  try {
    const raw = localStorage.getItem("rbstars_orders");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch {}
  const single = loadLastOrder();
  return single ? [single] : [];
}

const CLAIM_SESSION_KEY = "rbstars_claim_session";

function loadClaimSession(): { roomId: string; status: string; orderRef: string | null } | null {
  try {
    const raw = localStorage.getItem(CLAIM_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearClaimSession() {
  try { localStorage.removeItem(CLAIM_SESSION_KEY); } catch {}
}

function removeOrderFromStorage(orderRef: string) {
  try {
    const raw = localStorage.getItem("rbstars_orders");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const next = arr.filter((o: LastOrder) => o.orderRef !== orderRef);
        if (next.length > 0) localStorage.setItem("rbstars_orders", JSON.stringify(next));
        else localStorage.removeItem("rbstars_orders");
      }
    }
  } catch {}
}

export default function ClaimChatPage() {
  const [, navigate] = useLocation();

  const [orders] = useState<LastOrder[]>(() => loadOrders());
  const [selectedOrder, setSelectedOrder] = useState<LastOrder | null>(
    orders.length === 1 ? orders[0] : null
  );
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);

  const initialStep: PageStep = orders.length > 1 ? "order-select" : orders.length === 1 ? "select" : "form";
  const [step, setStep] = useState<PageStep>(initialStep);
  const [robloxUser, setRobloxUser] = useState("");
  const [contactEmail, setContactEmail] = useState(orders[0]?.email || "");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentTyping, setAgentTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reply, setReply] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentTyping]);

  useEffect(() => {
    if (step === "active") {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [step]);

  useEffect(() => {
    if (!roomId) return;
    if (step === "claimed" || step === "ended") return;

    const socket = io(BACKEND, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.emit("claim:join", { roomId });

    socket.on("claim:agent_joined", ({ agentName: name }: { agentName: string }) => {
      const displayName = name || "RBstars Agent";
      setAgentName(displayName);
      setStep("active");
    });

    socket.on(
      "claim:new_message",
      (msg: { _id?: string; sender: string; text: string; senderName: string; timestamp: string }) => {
        setMessages((prev) => [
          ...prev,
          {
            id: msg._id?.toString() || makeId(),
            sender: msg.sender as Message["sender"],
            text: msg.text,
            senderName: msg.senderName,
            timestamp: new Date(msg.timestamp),
          },
        ]);
      },
    );

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

    // Admin removed/closed the chat — the audit found this listener missing, so
    // ClaimChatPage stayed on "active" forever after an admin closed it.
    socket.on("claim:closed", () => {
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
      const orderRef = selectedOrder?.orderRef || null;
      const orderGame = selectedOrder?.game || null;
      const orderItems = selectedItem ? [{ name: selectedItem.name, quantity: 1 }] : undefined;

      const urlGame = window.location.pathname.match(/^\/game\/([^/]+)/)?.[1] || null;
      const game = urlGame || orderGame;

      const resp = await fetch(BACKEND + "/api/claims", {
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
        setStep("waiting");
      }
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function handleSend() {
    const text = reply.trim();
    if (!text || step !== "active" || !roomId || !socketRef.current) return;
    setReply("");
    // Append our own message immediately — the server echoes to everyone EXCEPT
    // the sender, and this page had no claim:message_ack listener, so without
    // this the customer's own messages never appeared at all.
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        sender: "customer" as Message["sender"],
        text,
        senderName: robloxUser,
        timestamp: new Date(),
      },
    ]);
    socketRef.current.emit("claim:message", {
      roomId,
      text,
      senderName: robloxUser,
      sender: "customer",
    });
  }

  const progressIdx = step === "order-select" ? 0 : step === "select" ? 1 : step === "form" ? 2 : step === "waiting" ? 3 : step === "active" ? 4 : 5;

  return (
    <div className="min-h-screen rglow">
      <TopNav onHome={() => navigate("/")} />

      {/* Main split layout */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left hero panel — a floating card, not a dark column */}
        <div className="hidden md:flex w-[380px] flex-shrink-0 p-5">
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

            {/* Step header */}
            <div className="mb-5 text-center">
              <img src="/chat-icon.png" alt="" className="w-40 h-40 mx-auto mb-4 object-contain" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.20))" }} />

              <h2 className="text-2xl font-black mb-1" style={{ color: P.text }}>
                {step === "order-select" && "Select Your Order"}
                {step === "select" && "Choose an Item"}
                {step === "form" && "Connect with Claim Team"}
                {step === "waiting" && "Waiting for Agent"}
                {step === "active" && "Live Claim Chat"}
                {step === "ended" && "Chat Ended"}
                {step === "claimed" && "Order Delivered!"}
              </h2>
              <p className="text-sm" style={{ color: P.muted }}>
                {step === "order-select" && "Select the order you'd like to claim items from"}
                {step === "select" && "Choose which item you'd like to claim"}
                {step === "form" && (selectedItem ? `Claiming ${selectedItem.name}` : "Fill in your details and our team will join shortly")}
                {step === "waiting" && "An agent will pick up your order soon"}
                {step === "active" && "Chat with your claim agent below"}
                {step === "ended" && "This session has been closed"}
                {step === "claimed" && "Check your Roblox inventory"}
              </p>
            </div>

            {/* Stepper — wraps on narrow screens: six labels plus five
                connectors need ~400px, which overflowed every phone at 320–440.
                Connectors shrink on mobile so a single row still fits ~430. */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 mb-5">
              {["Order", "Item", "Details", "Queue", "Chat", "Done"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <StepDot active={progressIdx === i} done={progressIdx > i} />
                    <span className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: progressIdx >= i ? P.accentDeep : P.faint }}>{label}</span>
                  </div>
                  {i < 5 && <div className="w-2 sm:w-6 h-px" style={{ background: progressIdx > i ? P.good : P.border }} />}
                </div>
              ))}
            </div>

            {/* Container card */}
            <div className="rounded-2xl p-6" style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}>
              <AnimatePresence mode="wait">
                {/* ── Order select ── */}
                {step === "order-select" && (
                  <motion.div key="order-select" className="space-y-3"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                    <p className="text-xs font-bold" style={{ color: P.text }}>Which order to claim?</p>
                    <p className="text-[10px]" style={{ color: P.muted }}>You have multiple orders — select one below</p>
                    {orders.map(o => (
                      <motion.button key={o.orderRef} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedOrder(o); setContactEmail(o.email || ""); setStep("select"); }}
                        className="w-full text-left rounded-xl p-3 flex items-center gap-3"
                        style={{ background: P.band, border: `1px solid ${P.border}` }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: P.accentDeep }}>
                          <Package size={14} color="white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold mb-0.5" style={{ color: P.faint }}>Order #{o.orderRef}</p>
                          <p className="text-[11px] font-extrabold truncate" style={{ color: P.text }}>
                            {o.items?.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ") || "Items"}
                          </p>
                        </div>
                        <ChevronRight size={14} color={P.faint} className="flex-shrink-0" />
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* ── Item select ── */}
                {step === "select" && (
                  <motion.div key="select" className="space-y-3"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    {selectedOrder?.items?.length ? (
                      <>
                        <p className="text-xs font-bold" style={{ color: P.text }}>Select item to claim</p>
                        {selectedOrder.orderRef && <p className="text-[10px]" style={{ color: P.faint }}>Order {selectedOrder.orderRef}</p>}
                        {selectedOrder.items.map(item => (
                          <motion.button key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setSelectedItem({ id: item.id, name: item.name });
                              setContactEmail(selectedOrder.email || "");
                              setStep("form");
                            }}
                            className="w-full flex items-center gap-4 p-3.5 rounded-xl text-left"
                            style={{ background: P.band, border: `1px solid ${P.border}` }}>
                            {/* Image container — cart style */}
                            <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                              style={{ background: P.stage, border: `2px solid ${P.border}` }}>
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-contain" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl" style={{ background: item.gradient?.[0] || "#2f8cff" }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-extrabold truncate" style={{ color: P.text }}>{item.name}</p>
                              {item.quantity > 1 && <p className="text-[10px] mt-0.5" style={{ color: P.faint }}>Qty: {item.quantity}</p>}
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg"
                              style={{ background: P.card, border: `1px solid ${P.borderStrong}` }}>
                              <img src="/IMG_0732.png" alt="" className="w-3 h-3 object-contain" />
                              <span className="text-[10px] font-extrabold" style={{ color: P.text }}>Claim</span>
                            </div>
                          </motion.button>
                        ))}
                      </>
                    ) : (
                      <>
                        <div className="text-center py-6">
                          <img src="/no-order-icon.png" alt="" className="w-28 h-28 object-contain mx-auto mb-3" />
                          <p className="text-sm font-extrabold" style={{ color: P.text }}>No Recent Order Found</p>
                          <p className="text-[11px] leading-relaxed max-w-[240px] mx-auto mt-1" style={{ color: P.muted }}>
                            Place an order first, then return here to claim your items.
                          </p>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => { setSelectedItem({ id: "general", name: "General Claim" }); setStep("form"); }}
                          className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: P.accentDeep, color: "#fff", boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}>
                          Open General Claim Chat
                        </motion.button>
                      </>
                    )}
                    {orders.length > 1 && (
                      <button onClick={() => setStep("order-select")} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: P.accentDeep }}>
                        <ArrowLeft size={12} /> Back to orders
                      </button>
                    )}
                  </motion.div>
                )}

                {step === "form" && (
                  <motion.div key="form" className="space-y-4"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                    <Field label="Roblox Username" placeholder="Your in-game username" value={robloxUser}
                      onChange={setRobloxUser} icon={<Gamepad2 size={15} />} error={formErrors.robloxUser} />
                    <Field label="Contact Email" placeholder="For order notifications" value={contactEmail}
                      onChange={setContactEmail} icon={<Mail size={15} />} type="email" error={formErrors.contactEmail} />
                    {formErrors.submit && (
                      <p className="text-[11px] text-center rounded-xl px-3 py-2.5"
                        style={{ background: P.badTint, border: "1px solid rgba(255,90,77,0.4)", color: P.bad }}>
                        {formErrors.submit}
                      </p>
                    )}
                    <button onClick={handleFormSubmit} disabled={submitting}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                      style={{ background: P.accentDeep, boxShadow: "0 6px 16px rgba(10,110,255,.35)", opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? (
                        <>
                          <motion.span
                            animate={{ scale: [1, 1.16, 1] }}
                            transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                            className="inline-flex"
                          ><RBstar size={16} color="#fff" /></motion.span>
                          Connecting...
                        </>
                      ) : "Start Claim Chat"}
                    </button>
                    <button onClick={() => navigate("/")}
                      className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      style={{ background: P.card, border: `1px solid ${P.borderStrong}`, color: P.muted }}>
                      <ArrowLeft size={13} /> Back to Store
                    </button>
                  </motion.div>
                )}

                {step === "waiting" && (
                  <motion.div key="waiting" className="space-y-4"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <div className="max-h-[300px] overflow-y-auto space-y-2" ref={scrollRef}>
                      {messages.map((m) => <Post key={m.id} msg={m} onQuote={(text) => {
                        setReply(prev => prev ? prev + "\n\n" + text + "\n\n" : text + "\n\n");
                        setTimeout(() => textareaRef.current?.focus(), 0);
                      }} />)}
                    </div>
                    <div className="py-6 text-center space-y-3">
                      {/* Waiting = amber: you're queued on someone else. Gold
                          flag on the mailbox says "you have mail pending". */}
                      <div className="flex flex-col items-center gap-2.5 rounded-2xl px-6 py-6"
                        style={{ background: P.warnTint, border: "1px solid rgba(245,158,11,0.45)" }}>
                        <MailboxGlyph size={34} />
                        <span className="text-sm font-black" style={{ color: P.warn }}>Waiting for claim team...</span>
                      </div>
                      <p className="text-[11px]" style={{ color: P.faint }}>Usually responds within 2-5 minutes</p>
                    </div>
                  </motion.div>
                )}

                {(step === "active" || step === "ended" || step === "claimed") && (
                  <motion.div key="active" className="flex flex-col"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    /* min()/dvh rather than a literal 420px: on a short or
                       landscape phone the fixed pane pushed the composer
                       below the fold and fought the on-screen keyboard */
                    style={{ height: "max(240px, min(420px, 56dvh))" }}>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
                      {messages.map((m) => <Post key={m.id} msg={m} onQuote={(text) => {
                        setReply(prev => prev ? prev + "\n\n" + text + "\n\n" : text + "\n\n");
                        setTimeout(() => textareaRef.current?.focus(), 0);
                      }} />)}
                      {/* Empty conversation — the page's designed moment */}
                      {messages.length === 0 && (
                        <div className="min-h-[240px] flex flex-col items-center justify-center text-center gap-3 py-6">
                          <SpeechBubble className="w-16 h-16" />
                          <p className="text-sm font-black" style={{ color: P.text }}>No messages yet</p>
                          <p className="text-[11px] leading-relaxed max-w-[240px]" style={{ color: P.muted }}>
                            Messages exchanged in this claim chat will appear here.
                          </p>
                        </div>
                      )}
                      {agentTyping && (
                        <div className="py-4" style={{ borderBottom: `1px solid ${P.border}` }}>
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
                              style={{ border: `2px solid ${P.accentDeep}`, boxShadow: P.shadow }}>
                              <img src="/staff-avatar.webp" alt="" className="h-full w-full object-cover" />
                            </div>
                            <div className="flex items-center gap-1.5 pt-3">
                              {[0, 1, 2].map((i) => (
                                <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: P.muted }}
                                  animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                              ))}
                              <span className="text-xs ml-1" style={{ color: P.faint }}>typing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {(step === "ended" || step === "claimed") && (
                      <div className="px-4 py-3 text-center flex-shrink-0" style={{ borderTop: `1px solid ${P.border}` }}>
                        <div className="rounded-xl p-3"
                          style={{
                            background: step === "claimed" ? P.goodTint : P.accentTint,
                            border: "1px solid " + (step === "claimed" ? P.good : "rgba(47,140,255,0.3)")
                          }}>
                          {step === "claimed" ? (
                            <>
                              <RBstar size={18} color={P.good} className="mx-auto mb-1" />
                              <p className="text-xs font-bold" style={{ color: P.good }}>Order Delivered!</p>
                              <p className="text-[10px] mt-0.5" style={{ color: P.muted }}>Check your Roblox inventory</p>
                            </>
                          ) : (
                            <>
                              <Clock size={16} className="mx-auto mb-1" style={{ color: P.accentDeep }} />
                              <p className="text-xs font-bold" style={{ color: P.text }}>Chat Ended</p>
                              <p className="text-[10px] mt-0.5" style={{ color: P.muted }}>Thank you for using RBstars!</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {step === "active" && (
                      <div className="p-3 pt-2 flex-shrink-0" style={{ borderTop: `1px solid ${P.border}` }}>
                        <div className="flex gap-2">
                          <input
                            ref={textareaRef as any}
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 outline-none text-sm px-3 py-2.5 rounded-xl min-w-0 transition-shadow focus:ring-4 focus:ring-[#2f8cff]/25 placeholder:text-[#8a97ba]"
                            style={{ background: P.card, border: `1px solid ${P.borderStrong}`, color: P.text }}
                          />
                          <motion.button
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                            onClick={handleSend}
                            disabled={!reply.trim()}
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: reply.trim() ? P.accentDeep : P.borderStrong }}>
                            <Send size={14} color={reply.trim() ? "white" : P.faint} />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-center text-[10px] mt-4" style={{ color: P.faint }}>
              Once delivered, this order is marked complete and cannot be claimed again.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
