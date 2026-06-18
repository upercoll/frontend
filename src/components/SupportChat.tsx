import { useState, useRef, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Gamepad2, Mail, Star, Loader2,
  CheckCheck, Clock, Headphones, ChevronRight, Package,
  ArrowLeft, Edit2, Check, ImagePlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  sender: "customer" | "agent" | "system";
  text: string;
  senderName: string;
  timestamp: Date;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  gradient?: [string, string];
}

interface LastOrder {
  orderRef: string;
  email: string;
  items: OrderItem[];
  game?: string | null;
}

type ChatMode = null | "general" | "claim";
type ClaimStep = "select" | "form" | "waiting" | "active" | "ended" | "claimed" | "review";

const FAQ = [
  {
    q: "How do I receive my items?",
    a: "After your order is placed, click the chat icon and choose \"Claim Chat\". Select your item, enter your Roblox username, and a claim agent will add you in-game to deliver your items.",
  },
  {
    q: "How long does delivery take?",
    a: "Most orders are delivered within 5–15 minutes during active hours. You'll see an agent join your Claim Chat when they're ready.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards (Visa, Mastercard, Amex) and PayPal. All payments are secured with 256-bit SSL encryption.",
  },
  {
    q: "My items haven't arrived yet",
    a: "Open a Claim Chat and our team will prioritize your delivery immediately. Make sure your Roblox username is spelled correctly and your privacy settings allow friend requests.",
  },
  {
    q: "How do I track my order?",
    a: "You'll receive an email confirmation with your order number. You can also check status anytime by opening a Claim Chat with your order details.",
  },
  {
    q: "Can I get a refund?",
    a: "If we're unable to deliver your items, a full refund is processed within 24–48 hours. Contact us via Claim Chat for assistance.",
  },
  {
    q: "Is it safe to buy here?",
    a: "Absolutely. We use trusted payment processors and have completed thousands of orders. Your data is fully encrypted and never shared.",
  },
  {
    q: "Do I need a Roblox account?",
    a: "Yes — you need an active Roblox account to receive items. Make sure your username is correct and your privacy settings allow friend requests or trades.",
  },
];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function loadLastOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem("rbstars_last_order");
    if (!raw) return null;
    return JSON.parse(raw) as LastOrder;
  } catch {
    return null;
  }
}

const CLAIM_SESSION_KEY = "rbstars_claim_session";

interface StoredClaimSession {
  roomId: string;
  orderRef: string | null;
  status: string;
  agentName?: string | null;
}

function saveClaimSession(data: StoredClaimSession) {
  try { localStorage.setItem(CLAIM_SESSION_KEY, JSON.stringify(data)); } catch {}
}

function loadClaimSession(): StoredClaimSession | null {
  try {
    const raw = localStorage.getItem(CLAIM_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearClaimSession() {
  try { localStorage.removeItem(CLAIM_SESSION_KEY); } catch {}
}

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

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

function Bubble({ msg }: { msg: Message }) {
  if (msg.sender === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-1"
      >
        <span className="text-[10px] px-3 py-1 rounded-full font-semibold" style={{ background: "#f0f0f0", color: "#6b7280" }}>
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
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2 ${isCustomer ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isCustomer && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
          style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
          <Star size={10} fill="white" color="white" />
        </div>
      )}
      <div className={`max-w-[78%] ${isCustomer ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        {!isCustomer && (
          <span className="text-[9px] font-bold ml-1" style={{ color: "#6366f1" }}>{msg.senderName}</span>
        )}
        <div
          className="px-3 py-2 text-sm leading-relaxed"
          style={{
            background: isCustomer ? "linear-gradient(135deg,#4F46E5,#3730A3)" : "#f3f4f6",
            color: isCustomer ? "white" : "#374151",
            borderRadius: isCustomer ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          }}
        >
          {msg.text}
        </div>
        <span className="text-[9px] mx-1" style={{ color: "#9ca3af" }}>{fmtTime(msg.timestamp)}</span>
      </div>
    </motion.div>
  );
}

export default function SupportChat() {
  const { user } = useAuth();
  const gameSlug = (() => {
    const m = window.location.pathname.match(/^\/game\/([^/]+)/);
    if (m) return m[1];
    try {
      const raw = localStorage.getItem("rbstars_last_order");
      if (raw) return JSON.parse(raw)?.game || null;
    } catch {}
    return null;
  })();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>(null);

  const [faqMessages, setFaqMessages] = useState<Message[]>([
    {
      id: "bot-welcome",
      sender: "agent",
      senderName: "RBstars Bot",
      text: "Hi! I'm here to help. Choose a question below or type your own.",
      timestamp: new Date(),
    },
  ]);
  const [faqInput, setFaqInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [askedFaqs, setAskedFaqs] = useState<Set<string>>(new Set());

  const [claimStep, setClaimStep] = useState<ClaimStep>("select");
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);
  const [robloxUser, setRobloxUser] = useState(user?.robloxUsername || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentTyping, setAgentTyping] = useState(false);

  const [editMode, setEditMode] = useState<"roblox" | "email" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [reviewStars, setReviewStars] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewProof, setReviewProof] = useState<File | null>(null);
  const [reviewProofPreview, setReviewProofPreview] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [chatOutcome, setChatOutcome] = useState<"claimed" | "ended" | null>(null);

  const [lastOrder] = useState<LastOrder | null>(() => loadLastOrder());

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const faqScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, agentTyping]);

  useEffect(() => {
    if (faqScrollRef.current) faqScrollRef.current.scrollTop = faqScrollRef.current.scrollHeight;
  }, [faqMessages, botTyping]);

  useEffect(() => {
    if (claimStep === "active" && open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [claimStep, open]);

  useEffect(() => {
    function handleOpenClaim() {
      setOpen(true);
      setMode("claim");
      setClaimStep("select");
    }
    window.addEventListener("rbstars:open-claim", handleOpenClaim);
    return () => window.removeEventListener("rbstars:open-claim", handleOpenClaim);
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const socket = io(BACKEND, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("claim:join", { roomId });
    });

    socket.on("claim:agent_joined", ({ agentName: name }: { agentName: string; message: string }) => {
      setAgentName(name);
      setMessages(prev => [...prev, {
        id: makeId(),
        sender: "system",
        text: `${name} has joined the chat`,
        senderName: "System",
        timestamp: new Date(),
      }]);
      setClaimStep("active");
      setEditMode(null);
      const stored = loadClaimSession();
      if (stored) saveClaimSession({ ...stored, status: "active", agentName: name });
    });

    socket.on("claim:new_message", (msg: { sender: string; text: string; senderName: string; timestamp: string }) => {
      setMessages(prev => [...prev, {
        id: makeId(),
        sender: msg.sender as "customer" | "agent" | "system",
        text: msg.text,
        senderName: msg.senderName || "Agent",
        timestamp: new Date(msg.timestamp || Date.now()),
      }]);
      setAgentTyping(false);
    });

    socket.on("claim:typing", () => {
      setAgentTyping(true);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setAgentTyping(false), 3000);
    });

    socket.on("claim:ended", ({ message }: { message: string }) => {
      setMessages(prev => [...prev, {
        id: makeId(), sender: "system", text: message, senderName: "System", timestamp: new Date(),
      }]);
      setClaimStep("ended");
      setChatOutcome("ended");
      const stored = loadClaimSession();
      if (stored) saveClaimSession({ ...stored, status: "ended" });
      setTimeout(() => setClaimStep("review"), 1500);
    });

    socket.on("claim:marked_claimed", ({ message }: { message: string }) => {
      setMessages(prev => [...prev, {
        id: makeId(), sender: "system", text: message, senderName: "System", timestamp: new Date(),
      }]);
      setClaimStep("claimed");
      setChatOutcome("claimed");
      const stored = loadClaimSession();
      if (stored) saveClaimSession({ ...stored, status: "claimed" });
      setTimeout(() => setClaimStep("review"), 1500);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const closeAndReset = useCallback(() => {
    setOpen(false);
    setMode(null);
    setClaimStep("select");
    setSelectedItem(null);
    setRoomId(null);
    setMessages([]);
    setAgentName(null);
    setAgentTyping(false);
    setInput("");
    setEditMode(null);
    setEditValue("");
    setRobloxUser(user?.robloxUsername || "");
    setContactEmail(user?.email || "");
    setFormErrors({});
    setReviewStars(0);
    setReviewComment("");
    setReviewProof(null);
    setReviewProofPreview(null);
    setReviewSubmitting(false);
    setReviewSubmitted(false);
    setChatOutcome(null);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  async function handleFormSubmit() {
    const e: Record<string, string> = {};
    if (!robloxUser.trim()) e.robloxUser = "Enter your Roblox username";
    if (!contactEmail.includes("@")) e.contactEmail = "Enter a valid email";
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setSubmitting(true);

    try {
      const res = await fetch(`${BACKEND}/api/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robloxUsername: robloxUser.trim(),
          contactEmail: contactEmail.trim(),
          orderRef: lastOrder?.orderRef || null,
          itemName: (selectedItem?.id && selectedItem.id !== "general" && selectedItem.name !== "General Claim") ? selectedItem.name : null,
          items: lastOrder?.items || [],
          game: gameSlug || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to start chat");

      const rid = data.data.roomId;
      const sessionStatus: string = data.data.status || "pending";
      const existingMessages: Message[] = (data.data.messages || []).map((m: { sender: string; text: string; senderName: string; timestamp: string }) => ({
        id: makeId(),
        sender: m.sender as "customer" | "agent" | "system",
        text: m.text,
        senderName: m.senderName,
        timestamp: new Date(m.timestamp),
      }));

      setMessages(existingMessages);

      saveClaimSession({
        roomId: rid,
        orderRef: lastOrder?.orderRef || null,
        status: sessionStatus,
        agentName: data.data.assignedAgent?.name || null,
      });

      if (sessionStatus === "claimed") {
        setChatOutcome("claimed");
        setClaimStep("claimed");
        setTimeout(() => setClaimStep("review"), 1500);
      } else if (sessionStatus === "ended") {
        setChatOutcome("ended");
        setClaimStep("ended");
        setTimeout(() => setClaimStep("review"), 1500);
      } else if (sessionStatus === "active") {
        setAgentName(data.data.assignedAgent?.name || "RBstars Agent");
        setRoomId(rid);
        setClaimStep("active");
      } else {
        setRoomId(rid);
        setClaimStep("waiting");
      }
    } catch (err) {
      setFormErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || claimStep !== "active" || !socketRef.current || !roomId) return;

    const senderLabel = user?.displayName || robloxUser || "Customer";
    const msg: Message = {
      id: makeId(),
      sender: "customer",
      text,
      senderName: senderLabel,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    setInput("");

    socketRef.current.emit("claim:message", {
      roomId,
      text,
      senderName: senderLabel,
      sender: "customer",
    });
  }

  function handleTyping() {
    if (socketRef.current && roomId) {
      const senderLabel = user?.displayName || robloxUser || "Customer";
      socketRef.current.emit("claim:typing", { roomId, senderName: senderLabel });
    }
  }

  async function handleSaveUserInfo() {
    if (!editValue.trim() || !roomId) return;
    setEditSaving(true);

    const body = editMode === "roblox"
      ? { robloxUsername: editValue.trim() }
      : { contactEmail: editValue.trim() };

    try {
      const res = await fetch(`${BACKEND}/api/claims/${roomId}/user-info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        if (editMode === "roblox") setRobloxUser(editValue.trim());
        else setContactEmail(editValue.trim());
      }
    } catch {

    } finally {
      setEditMode(null);
      setEditValue("");
      setEditSaving(false);
    }
  }

  async function handleReviewSubmit() {
    if (reviewStars === 0 || !roomId) return;
    setReviewSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("rating", String(reviewStars));
      if (reviewComment.trim()) formData.append("comment", reviewComment.trim());
      if (reviewProof) formData.append("proofImage", reviewProof);

      await fetch(`${BACKEND}/api/claims/${roomId}/feedback`, {
        method: "POST",
        body: formData,
      });

      setReviewSubmitted(true);
      clearClaimSession();
      setTimeout(() => closeAndReset(), 2000);
    } catch {
    } finally {
      setReviewSubmitting(false);
    }
  }

  function handleFaqQuestion(q: string, a: string) {
    if (askedFaqs.has(q)) return;
    setAskedFaqs(prev => new Set([...prev, q]));

    const customerMsg: Message = {
      id: makeId(), sender: "customer", senderName: "You", text: q, timestamp: new Date(),
    };
    setFaqMessages(prev => [...prev, customerMsg]);
    setBotTyping(true);

    setTimeout(() => {
      setBotTyping(false);
      const botMsg: Message = {
        id: makeId(), sender: "agent", senderName: "RBstars Bot", text: a, timestamp: new Date(),
      };
      setFaqMessages(prev => [...prev, botMsg]);
    }, 900 + Math.random() * 400);
  }

  function handleFaqInput() {
    const text = faqInput.trim();
    if (!text) return;
    setFaqInput("");

    const match = FAQ.find(f =>
      f.q.toLowerCase().includes(text.toLowerCase()) ||
      text.toLowerCase().includes(f.q.toLowerCase().slice(0, 10))
    );

    const customerMsg: Message = {
      id: makeId(), sender: "customer", senderName: "You", text, timestamp: new Date(),
    };
    setFaqMessages(prev => [...prev, customerMsg]);
    setBotTyping(true);

    setTimeout(() => {
      setBotTyping(false);
      const answer = match
        ? match.a
        : "I'm not sure about that specific question, but feel free to open a Claim Chat for personalized help from our team!";
      setFaqMessages(prev => [...prev, {
        id: makeId(), sender: "agent", senderName: "RBstars Bot", text: answer, timestamp: new Date(),
      }]);
    }, 900 + Math.random() * 400);
  }

  function renderModeSelect() {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 pb-2 text-center">
          <div className="w-11 h-11 rounded-full mx-auto mb-2.5 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)", boxShadow: "0 0 18px rgba(79,70,229,0.25)" }}>
            <MessageSquare size={20} color="white" />
          </div>
          <h3 className="text-sm font-extrabold mb-0.5" style={{ color: "#1e1b4b" }}>How can we help?</h3>
          <p className="text-[11px]" style={{ color: "#6b7280" }}>Choose an option to get started</p>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-3 justify-center">
          {}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode("general")}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all"
            style={{
              background: "#f9fafb",
              border: "1.5px solid #e5e7eb",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#ede9fe" }}>
              <Headphones size={18} color="#7c3aed" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold" style={{ color: "#1e1b4b" }}>General Support</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>FAQs, payment help & general questions</p>
            </div>
            <ChevronRight size={15} color="#9ca3af" />
          </motion.button>

          {}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMode("claim"); setClaimStep("select"); }}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg,#fff1f2,#ffe4e6)",
              border: "1.5px solid #fecdd3",
            }}
          >
            <motion.div
              animate={{ x: ["-120%", "220%"] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "linear", repeatDelay: 2 }}
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)", width: "40%" }}
            />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#fee2e2" }}>
              <Package size={18} color="#dc2626" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: "#1e1b4b" }}>
                Claim Chat
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>
                  ITEMS
                </span>
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#9f1239" }}>
                {lastOrder?.items?.length ? `${lastOrder.items.length} item${lastOrder.items.length !== 1 ? "s" : ""} ready to claim` : "Receive your purchased items"}
              </p>
            </div>
            <ChevronRight size={15} color="#f43f5e" />
          </motion.button>
        </div>

        <div className="px-4 pb-4">
          <div className="rounded-xl p-2.5 text-center" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-[10px]" style={{ color: "#16a34a" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1" />
              Support team online · Usually replies in 2–5 min
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderGeneralSupport() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={faqScrollRef}>
          {faqMessages.map(m => <Bubble key={m.id} msg={m} />)}
          {botTyping && (
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
                <Star size={10} fill="white" color="white" />
              </div>
              <div className="px-3 py-2 rounded-2xl" style={{ background: "#f3f4f6", borderRadius: "18px 18px 18px 4px" }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }}
                      animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {}
          {!botTyping && faqMessages.length < 5 && (
            <div className="flex flex-col gap-1.5 pt-1">
              {FAQ.filter(f => !askedFaqs.has(f.q)).slice(0, 4).map(f => (
                <motion.button
                  key={f.q}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleFaqQuestion(f.q, f.a)}
                  className="text-left px-3 py-2 rounded-xl text-[11px] font-semibold"
                  style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#3730a3" }}
                >
                  {f.q}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="p-3 border-t" style={{ borderColor: "#f3f4f6" }}>
          <div className="flex gap-2">
            <input
              value={faqInput}
              onChange={e => setFaqInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleFaqInput()}
              placeholder="Type a question…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 px-3 py-2.5 rounded-xl min-w-0"
              style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", color: "#1e1b4b" }}
            />
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
              onClick={handleFaqInput}
              disabled={!faqInput.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: faqInput.trim() ? "linear-gradient(135deg,#4F46E5,#3730A3)" : "#e0e7ff" }}
            >
              <Send size={14} color="white" />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  function renderClaimSelect() {
    const storedSession = loadClaimSession();
    const orderDelivered =
      storedSession &&
      storedSession.orderRef === lastOrder?.orderRef &&
      storedSession.status === "claimed";

    if (orderDelivered) {
      return (
        <div className="flex flex-col h-full items-center justify-center p-6 text-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "#dcfce7", border: "2px solid #86efac" }}>
            <CheckCheck size={24} color="#16a34a" />
          </div>
          <div>
            <p className="text-base font-extrabold mb-1" style={{ color: "#1e1b4b" }}>Order Delivered!</p>
            <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
              Your items have been delivered to your Roblox account. Check your inventory!
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => { clearClaimSession(); }}
            className="text-[11px] font-semibold px-4 py-2 rounded-xl"
            style={{ background: "#ede9fe", color: "#4f46e5", border: "1px solid #c4b5fd" }}
          >
            Start New Chat
          </motion.button>
        </div>
      );
    }

    const pendingSession =
      storedSession &&
      storedSession.orderRef === lastOrder?.orderRef &&
      (storedSession.status === "pending" || storedSession.status === "active");

    if (!lastOrder || !lastOrder.items?.length) {
      return (
        <div className="flex flex-col h-full justify-center p-4 gap-4">
          <div className="rounded-2xl p-4 text-center" style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb" }}>
            <Package size={28} color="#4F46E5" className="mx-auto mb-2" />
            <p className="text-sm font-extrabold mb-1" style={{ color: "#1e1b4b" }}>No Recent Order Found</p>
            <p className="text-[11px] leading-relaxed" style={{ color: "#6b7280" }}>
              Place an order first, then return here to claim your items. If you already ordered, your items will appear here.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedItem({ id: "general", name: "General Claim" });
              setClaimStep("form");
            }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: "#ede9fe", border: "1.5px solid #c4b5fd", color: "#4f46e5" }}
          >
            Open General Claim Chat
          </motion.button>
        </div>
      );
    }

    if (pendingSession) {
      return (
        <div className="flex flex-col h-full justify-center p-4 gap-4">
          <div className="rounded-2xl p-4 text-center" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
            <MessageSquare size={28} color="#6366f1" className="mx-auto mb-2" />
            <p className="text-sm font-extrabold mb-1" style={{ color: "#1e1b4b" }}>Chat In Progress</p>
            <p className="text-[11px] leading-relaxed" style={{ color: "#6b7280" }}>
              You already have an active claim session for this order.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedItem({ id: "existing", name: "Claim Chat" });
              setContactEmail(lastOrder?.email || "");
              setClaimStep("form");
            }}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}
          >
            <MessageSquare size={15} />Continue Chat
          </motion.button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-bold" style={{ color: "#1e1b4b" }}>Select item to claim</p>
          {lastOrder.orderRef && (
            <p className="text-[10px] mt-0.5" style={{ color: "#9ca3af" }}>Order {lastOrder.orderRef}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-1 space-y-2">
          {lastOrder.items.map(item => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedItem({ id: item.id, name: item.name });
                setContactEmail(lastOrder.email || "");
                setClaimStep("form");
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
              style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex-shrink-0"
                style={{ background: item.gradient ? `linear-gradient(135deg,${item.gradient[0]},${item.gradient[1]})` : "linear-gradient(135deg,#4F46E5,#3730A3)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-extrabold truncate" style={{ color: "#1e1b4b" }}>{item.name}</p>
                {item.quantity > 1 && (
                  <p className="text-[10px]" style={{ color: "#9ca3af" }}>Qty: {item.quantity}</p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "#fee2e2", border: "1px solid #fecaca" }}>
                <Package size={11} color="#dc2626" />
                <span className="text-[10px] font-extrabold" style={{ color: "#dc2626" }}>Claim</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  function renderClaimForm() {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 pb-3 text-center">
          <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
            style={{ background: "#fee2e2", border: "1px solid #fecaca" }}>
            <Package size={18} color="#dc2626" />
          </div>
          <p className="text-xs font-extrabold" style={{ color: "#1e1b4b" }}>{selectedItem?.name} Claim</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#6b7280" }}>Enter your details to connect with the claim team</p>
        </div>

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
            placeholder="For delivery updates"
            value={contactEmail}
            onChange={setContactEmail}
            icon={<Mail size={14} />}
            type="email"
            error={formErrors.contactEmail}
          />
          <div className="rounded-xl p-3" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <p className="text-[10px] leading-relaxed" style={{ color: "#3730a3" }}>
              Make sure your Roblox account allows friend requests. Our agent will add you in-game to deliver your items.
            </p>
          </div>
          {formErrors.submit && (
            <p className="text-[11px] text-center" style={{ color: "#ef4444" }}>{formErrors.submit}</p>
          )}
        </div>

        <div className="p-4 pt-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleFormSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#dc2626,#9f1239)" }}
          >
            {submitting
              ? <><Loader2 size={15} className="animate-spin" />Connecting…</>
              : <><MessageSquare size={15} />Start Claim Chat</>}
          </motion.button>
        </div>
      </div>
    );
  }

  function renderWaiting() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
          {messages.map(m => <Bubble key={m.id} msg={m} />)}
        </div>

        {}
        <div className="px-3 pb-2 space-y-2">
          <AnimatePresence mode="wait">
            {editMode ? (
              <motion.div
                key="edit-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl overflow-hidden"
                style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
              >
                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#3730a3" }}>
                    {editMode === "roblox" ? "New Roblox Username" : "New Email Address"}
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSaveUserInfo()}
                      placeholder={editMode === "roblox" ? "New username…" : "New email…"}
                      type={editMode === "email" ? "email" : "text"}
                      className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 px-2.5 py-2 rounded-lg min-w-0"
                      style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#1e1b4b" }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUserInfo}
                      disabled={editSaving || !editValue.trim()}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: editValue.trim() ? "#4F46E5" : "#e0e7ff" }}
                    >
                      {editSaving ? <Loader2 size={12} className="animate-spin text-white" /> : <Check size={13} color="white" />}
                    </button>
                    <button
                      onClick={() => { setEditMode(null); setEditValue(""); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "#f3f4f6" }}
                    >
                      <X size={13} color="#6b7280" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="edit-buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[10px] text-center mb-1.5" style={{ color: "#9ca3af" }}>Change before agent arrives</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditMode("roblox"); setEditValue(robloxUser); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold"
                    style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#4f46e5" }}
                  >
                    <Gamepad2 size={11} />Change Username
                  </button>
                  <button
                    onClick={() => { setEditMode("email"); setEditValue(contactEmail); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold"
                    style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#4f46e5" }}
                  >
                    <Mail size={11} />Change Email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {}
        <div className="p-3 pt-0 text-center border-t" style={{ borderColor: "#f3f4f6" }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="w-4 h-4 rounded-full border-2"
              style={{ borderColor: "#4F46E5", borderTopColor: "transparent" }}
            />
            <span className="text-xs font-semibold" style={{ color: "#4f46e5" }}>Waiting for claim team…</span>
          </div>
          <p className="text-[10px]" style={{ color: "#9ca3af" }}>Usually responds within 2–5 minutes</p>
        </div>
      </div>
    );
  }

  function renderActiveChat() {
    const isEnded = claimStep === "ended" || claimStep === "claimed";

    return (
      <div className="flex flex-col h-full">
        {agentName && (
          <div className="px-4 py-2 flex items-center gap-2 border-b flex-shrink-0"
            style={{ borderColor: "#e5e7eb", background: "#f5f3ff" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#4F46E5" }}>
              <Star size={9} fill="white" color="white" />
            </div>
            <span className="text-xs font-bold" style={{ color: "#1e1b4b" }}>{agentName}</span>
            {claimStep === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto flex-shrink-0" />}
            {claimStep === "claimed" && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "#dcfce7", color: "#16a34a" }}>
                ✓ Delivered
              </span>
            )}
            {claimStep === "ended" && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "#ede9fe", color: "#6366f1" }}>
                Ended
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
          {messages.map(m => <Bubble key={m.id} msg={m} />)}
          {agentTyping && (
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
                <Star size={10} fill="white" color="white" />
              </div>
              <div className="px-3 py-2 rounded-2xl" style={{ background: "#f3f4f6", borderRadius: "18px 18px 18px 4px" }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }}
                      animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {isEnded && (
          <div className="px-4 py-3 text-center" style={{ borderTop: "1px solid #f3f4f6" }}>
            <div className="rounded-xl p-3" style={{
              background: claimStep === "claimed" ? "#dcfce7" : "#eff6ff",
              border: `1px solid ${claimStep === "claimed" ? "#86efac" : "#bfdbfe"}`,
            }}>
              {claimStep === "claimed" ? (
                <>
                  <CheckCheck size={16} color="#16a34a" className="mx-auto mb-1" />
                  <p className="text-xs font-bold" style={{ color: "#16a34a" }}>Order Delivered!</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6b7280" }}>Check your Roblox inventory</p>
                </>
              ) : (
                <>
                  <Clock size={16} color="#6366f1" className="mx-auto mb-1" />
                  <p className="text-xs font-bold" style={{ color: "#1e1b4b" }}>Chat Ended</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6b7280" }}>Thank you for using RBstars!</p>
                </>
              )}
            </div>
          </div>
        )}

        {claimStep === "active" && (
          <div className="p-3 border-t" style={{ borderColor: "#f3f4f6" }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); handleTyping(); }}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 px-3 py-2.5 rounded-xl min-w-0"
                style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", color: "#1e1b4b" }}
              />
              <motion.button
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: input.trim() ? "linear-gradient(135deg,#4F46E5,#3730A3)" : "#e0e7ff" }}
              >
                <Send size={14} color="white" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderReview() {
    const isDelivered = chatOutcome === "claimed";
    if (reviewSubmitted) {
      return (
        <div className="flex flex-col h-full items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full mb-4 flex items-center justify-center"
            style={{ background: "#dcfce7", border: "2px solid #86efac" }}>
            <CheckCheck size={24} color="#16a34a" />
          </div>
          <p className="text-base font-extrabold mb-1" style={{ color: "#1e1b4b" }}>Review Submitted!</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>Thank you for your feedback</p>
        </div>
      );
    }
    const starLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-4 pt-4 pb-2 text-center flex-shrink-0">
          <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
            style={{
              background: isDelivered ? "#dcfce7" : "#eff6ff",
              border: `1px solid ${isDelivered ? "#86efac" : "#bfdbfe"}`,
            }}>
            {isDelivered ? <CheckCheck size={18} color="#16a34a" /> : <Clock size={18} color="#6366f1" />}
          </div>
          <p className="text-sm font-extrabold" style={{ color: "#1e1b4b" }}>
            {isDelivered ? "Items Delivered! 🎉" : "Chat Ended"}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>Share your experience with us</p>
        </div>
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#4f46e5" }}>Your Rating</p>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map(star => (
              <motion.button key={star} whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.85 }} onClick={() => setReviewStars(star)}>
                <Star size={30} fill={star <= reviewStars ? "#f59e0b" : "none"} color={star <= reviewStars ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
              </motion.button>
            ))}
            {reviewStars > 0 && (
              <span className="text-[11px] font-bold ml-1" style={{ color: "#f59e0b" }}>{starLabels[reviewStars]}</span>
            )}
          </div>
        </div>
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#4f46e5" }}>Review (optional)</p>
          <textarea
            value={reviewComment}
            onChange={e => setReviewComment(e.target.value)}
            placeholder="How was your experience?"
            rows={3}
            maxLength={300}
            className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400 px-3 py-2.5 rounded-xl resize-none"
            style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", color: "#1e1b4b" }}
          />
        </div>
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#4f46e5" }}>Attach Proof (optional)</p>
          {reviewProofPreview ? (
            <div className="relative">
              <img src={reviewProofPreview} alt="proof" className="w-full h-20 object-cover rounded-xl"
                style={{ border: "1px solid #e5e7eb" }} />
              <button onClick={() => { setReviewProof(null); setReviewProofPreview(null); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.6)" }}>
                <X size={10} color="white" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer text-[11px] font-semibold"
              style={{ background: "#f9fafb", border: "1.5px dashed #c4b5fd", color: "#6366f1" }}>
              <ImagePlus size={14} />
              Attach screenshot
              <input type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setReviewProof(file);
                  const reader = new FileReader();
                  reader.onload = ev => setReviewProofPreview(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }} />
            </label>
          )}
        </div>
        <div className="px-4 pb-4 flex gap-2 flex-shrink-0 mt-auto">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => closeAndReset()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#6b7280" }}>
            Skip
          </motion.button>
          <motion.button
            whileHover={{ scale: reviewStars > 0 ? 1.02 : 1 }}
            whileTap={{ scale: reviewStars > 0 ? 0.97 : 1 }}
            onClick={handleReviewSubmit}
            disabled={reviewStars === 0 || reviewSubmitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-1.5"
            style={{ background: reviewStars > 0 ? "linear-gradient(135deg,#4F46E5,#3730A3)" : "#e0e7ff", opacity: reviewSubmitting ? 0.7 : 1 }}>
            {reviewSubmitting
              ? <Loader2 size={13} className="animate-spin" />
              : <Star size={13} fill={reviewStars > 0 ? "white" : "none"} color="white" strokeWidth={2} />}
            Submit
          </motion.button>
        </div>
      </div>
    );
  }

  function renderHeader() {
    const canGoBack = mode !== null && (mode === "general" || claimStep === "select" || claimStep === "form");
    const title =
      mode === null ? "RBstars Support"
        : mode === "general" ? "General Support"
          : claimStep === "select" ? "Claim Chat"
            : claimStep === "form" ? `${selectedItem?.name || "Item"} Claim`
              : claimStep === "waiting" ? `${selectedItem?.name || "Item"} Claim`
                : claimStep === "review" ? "Rate Your Experience"
                  : agentName || "Claim Chat";

    const subtitle =
      mode === null ? "We're here to help"
        : mode === "general" ? "Automated support"
          : claimStep === "waiting" ? "Waiting for agent…"
            : claimStep === "active" ? `Online — ${agentName}`
              : claimStep === "claimed" ? "Delivered ✓"
                : claimStep === "ended" ? "Chat Ended"
                  : claimStep === "review" ? "Your feedback matters"
                    : "RBstars Claim Team";

    return (
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2.5">
          {canGoBack ? (
            <button
              onClick={() => {
                if (mode === "general") { setMode(null); }
                else if (claimStep === "form") { setClaimStep("select"); setSelectedItem(null); }
                else if (claimStep === "select") { setMode(null); }
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#f3f4f6" }}
            >
              <ArrowLeft size={14} color="#6b7280" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
              <Star size={13} fill="white" color="white" />
            </div>
          )}
          <div>
            <p className="text-sm font-extrabold leading-tight" style={{ color: "#1e1b4b" }}>{title}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-semibold" style={{ color: "#16a34a" }}>{subtitle}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => claimStep === "review" ? closeAndReset() : setOpen(false)}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "#f3f4f6" }}
        >
          <X size={14} color="#6b7280" />
        </button>
      </div>
    );
  }

  function renderBody() {
    if (mode === null) return renderModeSelect();
    if (mode === "general") return renderGeneralSupport();
    if (mode === "claim") {
      if (claimStep === "select") return renderClaimSelect();
      if (claimStep === "form") return renderClaimForm();
      if (claimStep === "waiting") return renderWaiting();
      if (claimStep === "review") return renderReview();
      return renderActiveChat();
    }
    return null;
  }

  const hasActivity = mode !== null && (claimStep === "waiting" || claimStep === "active");

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-3 sm:right-6 z-[300] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: "min(360px, calc(100vw - 24px))",
              height: "min(520px, calc(100vh - 128px))",
              background: "#ffffff",
              border: "1.5px solid #e5e7eb",
              boxShadow: "0 24px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(99,102,241,0.08)",
            }}
          >
            {renderHeader()}
            <div className="flex-1 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${mode}-${claimStep}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="h-full"
                >
                  {renderBody()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 280, damping: 20 }}
        whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(79,70,229,0.7)" }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-4 z-[300] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)", boxShadow: "0 4px 24px rgba(79,70,229,0.55)" }}
      >
        {hasActivity && (
          <motion.span
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full"
            style={{ background: "#4F46E5" }}
          />
        )}
        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#4F46E5]" />
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
