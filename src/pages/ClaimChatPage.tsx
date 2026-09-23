import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  Send, CheckCheck, Mail, Gamepad2,
  Loader2, Clock, Star, ArrowLeft, AlertTriangle, Package, ChevronRight,
  Quote, Reply, Shield,
} from "lucide-react";

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
  const borderColor = error ? "rgba(248,113,113,0.5)" : focused ? "#3BA7FF" : "#2C414E";
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#F4F8FB" }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all"
        style={{ background: "#0C141B", border: `1.5px solid ${borderColor}` }}
      >
        {icon && (
          <span style={{ color: focused ? "#3BA7FF" : "#637784", flexShrink: 0 }}>{icon}</span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#475569] min-w-0"
        />
      </div>
      {error && <p className="text-[11px]" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className="w-2 h-2 rounded-full transition-all"
      style={{
        background: done ? "#22C55E" : active ? "#3BA7FF" : "#2C414E",
        boxShadow: active ? "0 0 8px rgba(59,167,255,0.5)" : "none",
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
        style={{ border: "2px solid #3BA7FF", boxShadow: "0 3px 0 #1a6bbf" }}
      >
        <img src="/staff-avatar.webp" alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (sender === "system") {
    return (
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: "#637784", boxShadow: "0 3px 0 #4a5d6a" }}
      >
        <Shield size={20} color="#fff" />
      </div>
    );
  }
  return (
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ border: "2px solid #22C55E", boxShadow: "0 3px 0 #188c46" }}
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
  const roleColor = "#F4F8FB";
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold" style={{ color: "#F4F8FB" }}>
        {msg.senderName || roleLabel}
      </span>
      <span
        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: roleColor + "20", color: roleColor }}
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
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
            style={{ background: "#18242D", color: "#637784" }}>
            <Shield size={12} />
            {msg.text}
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Post header */}
        <div className="mb-3 flex items-start gap-3">
          <PostAvatar sender={msg.sender} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PostAuthor msg={msg} />
            </div>
            <span className="mt-0.5 text-xs" style={{ color: "#637784" }}>
              {relativeTime(msg.timestamp)} · {fmtFull(msg.timestamp)}
            </span>
          </div>
        </div>

        {/* Post content */}
        <div className="mb-3 text-[15px] leading-[1.7] sm:pl-15" style={{ color: "#D1D5DB" }}>
          {msg.text.split("\n").map((line, li) => {
            let html = line
              .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
              .replace(/_(.+?)_/g, "<i>$1</i>")
              .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#3BA7FF;font-weight:600;text-decoration:none">$1</a>')
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
          <button className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:brightness-125"
            style={{ color: "#637784" }}>
            <AlertTriangle size={13} />
            Report
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:brightness-125"
            style={{ color: "#637784" }}
            onClick={() => onQuote?.(msg.text)}>
            <Quote size={13} />
            Quote
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:brightness-125"
            style={{ color: "#3BA7FF" }}
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
  const stepText: Record<PageStep, string> = {
    "order-select": "Select the order you'd like to claim items from.",
    "select": "Choose which item from your order you'd like to claim.",
    form: "Enter your details and our claim team will pick up your order right away.",
    waiting: "You\u2019re in the queue \u2014 an agent will join shortly.",
    active: "Live chat with a claim agent. They\u2019ll deliver your items.",
    ended: "This chat session has ended. Thank you for using RBstars!",
    claimed: "Your order is delivered! Check your Roblox inventory.",
  };
  return (
    <div
      className="relative flex flex-col items-center justify-center text-center p-8 overflow-hidden"
      style={{ background: "#0D1520" }}
    >
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
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,167,255,0.15), transparent 70%)" }}
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative z-10 mb-6"
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto overflow-hidden"
          style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 8px 24px rgba(59,167,255,0.3)" }}
        >
          <Star size={36} fill="white" color="white" />
        </div>
      </motion.div>
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
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
    socketRef.current.emit("claim:message", {
      roomId,
      text,
      senderName: robloxUser,
      sender: "customer",
    });
  }

  const progressIdx = step === "order-select" ? 0 : step === "select" ? 1 : step === "form" ? 2 : step === "waiting" ? 3 : step === "active" ? 4 : 5;

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
        {/* Left hero panel */}
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
              <img src="/chat-icon.png" alt="" className="w-40 h-40 mx-auto mb-4 object-contain" style={{ filter: "drop-shadow(0 4px 20px rgba(59,167,255,0.3))" }} />

              <h2 className="text-2xl font-extrabold mb-1" style={{ color: "#F4F8FB" }}>
                {step === "order-select" && "Select Your Order"}
                {step === "select" && "Choose an Item"}
                {step === "form" && "Connect with Claim Team"}
                {step === "waiting" && "Waiting for Agent"}
                {step === "active" && "Live Claim Chat"}
                {step === "ended" && "Chat Ended"}
                {step === "claimed" && "Order Delivered!"}
              </h2>
              <p className="text-sm" style={{ color: "#637784" }}>
                {step === "order-select" && "Select the order you'd like to claim items from"}
                {step === "select" && "Choose which item you'd like to claim"}
                {step === "form" && (selectedItem ? `Claiming ${selectedItem.name}` : "Fill in your details and our team will join shortly")}
                {step === "waiting" && "An agent will pick up your order soon"}
                {step === "active" && "Chat with your claim agent below"}
                {step === "ended" && "This session has been closed"}
                {step === "claimed" && "Check your Roblox inventory"}
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-5">
              {["Order", "Item", "Details", "Queue", "Chat", "Done"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <StepDot active={progressIdx === i} done={progressIdx > i} />
                    <span className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: progressIdx >= i ? "#3BA7FF" : "#475569" }}>{label}</span>
                  </div>
                  {i < 5 && <div className="w-6 h-px" style={{ background: progressIdx > i ? "#22C55E" : "#2C414E" }} />}
                </div>
              ))}
            </div>

            {/* Container card */}
            <div className="rounded-2xl p-6" style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
              <AnimatePresence mode="wait">
                {/* ── Order select ── */}
                {step === "order-select" && (
                  <motion.div key="order-select" className="space-y-3"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                    <p className="text-xs font-bold" style={{ color: "#F4F8FB" }}>Which order to claim?</p>
                    <p className="text-[10px]" style={{ color: "#637784" }}>You have multiple orders — select one below</p>
                    {orders.map(o => (
                      <motion.button key={o.orderRef} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedOrder(o); setContactEmail(o.email || ""); setStep("select"); }}
                        className="w-full text-left rounded-xl p-3 flex items-center gap-3"
                        style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#3BA7FF" }}>
                          <Package size={14} color="white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold mb-0.5" style={{ color: "#637784" }}>Order #{o.orderRef}</p>
                          <p className="text-[11px] font-extrabold truncate" style={{ color: "#F4F8FB" }}>
                            {o.items?.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ") || "Items"}
                          </p>
                        </div>
                        <ChevronRight size={14} color="#637784" className="flex-shrink-0" />
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
                        <p className="text-xs font-bold" style={{ color: "#F4F8FB" }}>Select item to claim</p>
                        {selectedOrder.orderRef && <p className="text-[10px]" style={{ color: "#637784" }}>Order {selectedOrder.orderRef}</p>}
                        {selectedOrder.items.map(item => (
                          <motion.button key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setSelectedItem({ id: item.id, name: item.name });
                              setContactEmail(selectedOrder.email || "");
                              setStep("form");
                            }}
                            className="w-full flex items-center gap-4 p-3.5 rounded-xl text-left"
                            style={{ background: "#0C141B", border: "1.5px solid #2C414E" }}>
                            {/* Image container — cart style */}
                            <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                              style={{ background: "#1C2A34", border: "2px solid #F4F8FB" }}>
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-contain" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl" style={{ background: item.gradient?.[0] || "#3BA7FF" }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-extrabold truncate" style={{ color: "#F4F8FB" }}>{item.name}</p>
                              {item.quantity > 1 && <p className="text-[10px] mt-0.5" style={{ color: "#637784" }}>Qty: {item.quantity}</p>}
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg"
                              style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
                              <img src="/IMG_0732.png" alt="" className="w-3 h-3 object-contain" />
                              <span className="text-[10px] font-extrabold" style={{ color: "#F4F8FB" }}>Claim</span>
                            </div>
                          </motion.button>
                        ))}
                      </>
                    ) : (
                      <>
                        <div className="text-center py-6">
                          <img src="/no-order-icon.png" alt="" className="w-28 h-28 object-contain mx-auto mb-3" />
                          <p className="text-sm font-extrabold" style={{ color: "#F4F8FB" }}>No Recent Order Found</p>
                          <p className="text-[11px] leading-relaxed max-w-[240px] mx-auto mt-1" style={{ color: "#637784" }}>
                            Place an order first, then return here to claim your items.
                          </p>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => { setSelectedItem({ id: "general", name: "General Claim" }); setStep("form"); }}
                          className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: "#0C141B", border: "1px solid #2C414E", color: "#F4F8FB" }}>
                          Open General Claim Chat
                        </motion.button>
                      </>
                    )}
                    {orders.length > 1 && (
                      <button onClick={() => setStep("order-select")} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#3BA7FF" }}>
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
                      <p className="text-[11px] text-center" style={{ color: "#f87171" }}>{formErrors.submit}</p>
                    )}
                    <button onClick={handleFormSubmit} disabled={submitting}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                      style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9", opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? <><Loader2 size={16} className="animate-spin" />Connecting...</> : "Start Claim Chat"}
                    </button>
                    <button onClick={() => navigate("/")}
                      className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      style={{ background: "#0C141B", border: "1px solid #2C414E", color: "#9BAEBB" }}>
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
                      <div className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                          className="w-4 h-4 rounded-full border-2"
                          style={{ borderColor: "#3BA7FF", borderTopColor: "transparent" }} />
                        <span className="text-sm font-semibold" style={{ color: "#3BA7FF" }}>Waiting for claim team...</span>
                      </div>
                      <p className="text-[11px]" style={{ color: "#637784" }}>Usually responds within 2-5 minutes</p>
                    </div>
                  </motion.div>
                )}

                {(step === "active" || step === "ended" || step === "claimed") && (
                  <motion.div key="active" className="flex flex-col"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ height: 420 }}>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
                      {messages.map((m) => <Post key={m.id} msg={m} onQuote={(text) => {
                        setReply(prev => prev ? prev + "\n\n" + text + "\n\n" : text + "\n\n");
                        setTimeout(() => textareaRef.current?.focus(), 0);
                      }} />)}
                      {agentTyping && (
                        <div className="py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
                              style={{ border: "2px solid #3BA7FF", boxShadow: "0 3px 0 #1a6bbf" }}>
                              <img src="/staff-avatar.webp" alt="" className="h-full w-full object-cover" />
                            </div>
                            <div className="flex items-center gap-1.5 pt-3">
                              {[0, 1, 2].map((i) => (
                                <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: "#3BA7FF" }}
                                  animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                              ))}
                              <span className="text-xs ml-1" style={{ color: "#637784" }}>typing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {(step === "ended" || step === "claimed") && (
                      <div className="px-4 py-3 text-center flex-shrink-0" style={{ borderTop: "1px solid #2C414E" }}>
                        <div className="rounded-xl p-3"
                          style={{
                            background: step === "claimed" ? "rgba(34,197,94,0.1)" : "rgba(59,167,255,0.1)",
                            border: "1px solid " + (step === "claimed" ? "rgba(34,197,94,0.25)" : "rgba(59,167,255,0.15)")
                          }}>
                          {step === "claimed" ? (
                            <>
                              <CheckCheck size={16} className="mx-auto mb-1" style={{ color: "#22C55E" }} />
                              <p className="text-xs font-bold" style={{ color: "#22C55E" }}>Order Delivered!</p>
                              <p className="text-[10px] mt-0.5" style={{ color: "#637784" }}>Check your Roblox inventory</p>
                            </>
                          ) : (
                            <>
                              <Clock size={16} className="mx-auto mb-1" style={{ color: "#637784" }} />
                              <p className="text-xs font-bold" style={{ color: "#F4F8FB" }}>Chat Ended</p>
                              <p className="text-[10px] mt-0.5" style={{ color: "#637784" }}>Thank you for using RBstars!</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {step === "active" && (
                      <div className="p-3 pt-2 flex-shrink-0" style={{ borderTop: "1px solid #2C414E" }}>
                        <div className="flex gap-2">
                          <input
                            ref={textareaRef as any}
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#475569] px-3 py-2.5 rounded-xl min-w-0"
                            style={{ background: "#0C141B", border: "1.5px solid #2C414E" }}
                          />
                          <motion.button
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                            onClick={handleSend}
                            disabled={!reply.trim()}
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: reply.trim() ? "#3BA7FF" : "rgba(59,167,255,0.15)" }}>
                            <Send size={14} color="white" />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-center text-[10px] mt-4" style={{ color: "#475569" }}>
              Once delivered, this order is marked complete and cannot be claimed again.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
