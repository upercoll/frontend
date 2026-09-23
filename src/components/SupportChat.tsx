import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Gamepad2, Mail, Star, Loader2,
  CheckCheck, Clock, Headphones, ChevronRight, Package,
  ArrowLeft, Edit2, Check, ImagePlus, Bot,
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

type ChatMode = null | "claim";
type ClaimStep = "order-select" | "select" | "form" | "waiting" | "active" | "ended" | "claimed" | "review";

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
  robloxUser?: string;
  contactEmail?: string;
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

function clearLastOrder() {
  try { localStorage.removeItem("rbstars_last_order"); } catch {}
}

/**
 * Mark an order as delivered in localStorage and fire a window event so the
 * PaymentSuccess page can hide the "Claim Your Items Now" button in real-time.
 */
function signalDelivered(orderRef: string | null) {
  try {
    if (orderRef) localStorage.setItem("rbstars_delivered_" + orderRef, "1");
    window.dispatchEvent(
      new CustomEvent("rbstars:claim-delivered", { detail: { orderRef } })
    );
  } catch {}
}

function loadOrders(): LastOrder[] {
  try {
    const raw = localStorage.getItem("rbstars_orders");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function removeOrderFromStorage(orderRef: string) {
  try {
    const remaining = loadOrders().filter(o => o.orderRef !== orderRef);
    if (remaining.length > 0) localStorage.setItem("rbstars_orders", JSON.stringify(remaining));
    else localStorage.removeItem("rbstars_orders");
  } catch {}
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
      <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#F4F8FB" }}>{label}</label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
        style={{
          background: "#0C141B",
          border: `1.5px solid ${error ? "#fca5a5" : focused ? "#3BA7FF" : "#2C414E"}`,
          boxShadow: focused ? "0 0 0 3px rgba(59,167,255,0.08)" : "none",
        }}
      >
        {icon && <span style={{ color: "#3BA7FF", flexShrink: 0 }}>{icon}</span>}
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 font-medium min-w-0"
          style={{ color: "#F4F8FB" }}
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
        <span className="text-[10px] px-3 py-1 rounded-full font-semibold" style={{ background: "#1C2A34", color: "#9BAEBB" }}>
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
          style={{ background: "#3BA7FF" }}>
          <Star size={10} fill="white" color="white" />
        </div>
      )}
      <div className={`max-w-[78%] ${isCustomer ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        {!isCustomer && (
          <span className="text-[9px] font-bold ml-1" style={{ color: "#5CB8FF" }}>{msg.senderName}</span>
        )}
        <div
          className="px-3 py-2 text-sm leading-relaxed"
          style={{
            background: isCustomer ? "#3BA7FF" : "#18242D",
            color: "white",
            borderRadius: isCustomer ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          }}
        >
          {msg.text}
        </div>
        <span className="text-[9px] mx-1" style={{ color: "#637784" }}>{fmtTime(msg.timestamp)}</span>
      </div>
    </motion.div>
  );
}

export default function SupportChat() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const gameSlug = (() => {
    const m = window.location.pathname.match(/^\/game\/([^/]+)/);
    if (m) return m[1];
    try {
      const raw = localStorage.getItem("rbstars_last_order");
      if (raw) return JSON.parse(raw)?.game || null;
    } catch {}
    return null;
  })();
  // Grow A Garden 2 is fully automated — the manual Claim Chat is hidden for it.
  const isAutoOnlyGame = gameSlug === "grow-a-garden-2";
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>(null);

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
  const [nextSlotAt, setNextSlotAt] = useState<string | null>(null);
  const [, setSlotTick] = useState(0);

  const [orders, setOrders] = useState<LastOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LastOrder | null>(null);
  // Alias so existing code that references lastOrder keeps working
  const lastOrder: LastOrder | null = selectedOrder;

  // Tracks the orderRef of the current active claim session — captured at socket-setup
  // time to avoid stale-closure issues inside the socket useEffect.
  const sessionOrderRef = useRef<string | null>(null);

  useEffect(() => {
    if (!nextSlotAt) return;
    const id = setInterval(() => setSlotTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [nextSlotAt]);

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, agentTyping]);

  useEffect(() => {
    if (claimStep === "active" && open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [claimStep, open]);

  useEffect(() => {
    function handleOpenClaim() {
      setOpen(true);
      setMode("claim");

      // Clear any stale completed/delivered session — customer should never see
      // a "Continue Chat" prompt for an already-delivered order.
      const stored = loadClaimSession();
      if (stored && (stored.status === "claimed" || stored.status === "ended" || stored.status === "closed")) {
        clearClaimSession();
        clearLastOrder();
        if (stored.orderRef) {
          removeOrderFromStorage(stored.orderRef);
          signalDelivered(stored.orderRef);
        }
      }

      const storedOrders = loadOrders();
      setOrders(storedOrders);
      const freshStored = loadClaimSession();
      if (freshStored && (freshStored.status === "pending" || freshStored.status === "active")) {
        handleRejoinSession();
      } else if (storedOrders.length > 1) {
        setClaimStep("order-select");
      } else {
        if (storedOrders.length === 1) setSelectedOrder(storedOrders[0]);
        setClaimStep("select");
      }
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

    socket.on("claim:ended", () => {
      const ordRef = sessionOrderRef.current;
      clearClaimSession();
      clearLastOrder();
      if (ordRef) removeOrderFromStorage(ordRef);
      sessionOrderRef.current = null;
      socket.disconnect();
      // Completely dismiss the widget — no review step
      closeAndReset();
    });

    socket.on("claim:closed", () => {
      // Admin closed the chat — dismiss the widget entirely
      clearClaimSession();
      clearLastOrder();
      socket.disconnect();
      closeAndReset();
    });

    socket.on("claim:marked_claimed", () => {
      const ordRef = sessionOrderRef.current;
      clearClaimSession();
      clearLastOrder();
      if (ordRef) {
        removeOrderFromStorage(ordRef);
        signalDelivered(ordRef);
      }
      sessionOrderRef.current = null;
      socket.disconnect();
      // Items delivered — hide the widget completely, no review prompt
      closeAndReset();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const closeAndReset = useCallback((claimedOrderRef?: string) => {
    if (claimedOrderRef) removeOrderFromStorage(claimedOrderRef);
    setOpen(false);
    setMode(null);
    setClaimStep("select");
    setSelectedItem(null);
    setSelectedOrder(null);
    setOrders([]);
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
    sessionOrderRef.current = null;
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
      sessionOrderRef.current = lastOrder?.orderRef || null;
      const res = await fetch(`${BACKEND}/api/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robloxUsername: robloxUser.trim(),
          contactEmail: contactEmail.trim(),
          orderRef: lastOrder?.orderRef || null,
          itemName: (selectedItem?.id && selectedItem.id !== "general" && selectedItem.name !== "General Claim") ? selectedItem.name : null,
          items: lastOrder?.items || [],
          game: selectedOrder?.game || gameSlug || null,
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
      setNextSlotAt(data.data.nextSlotAt || null);

      saveClaimSession({
        roomId: rid,
        orderRef: lastOrder?.orderRef || null,
        status: sessionStatus,
        agentName: data.data.assignedAgent?.name || null,
        robloxUser: robloxUser.trim(),
        contactEmail: contactEmail.trim(),
      });

      if (sessionStatus === "claimed") {
        // Items already delivered — dismiss entirely, signal PaymentSuccess page
        clearClaimSession();
        clearLastOrder();
        const oRef = lastOrder?.orderRef || null;
        if (oRef) {
          removeOrderFromStorage(oRef);
          signalDelivered(oRef);
        }
        closeAndReset();
      } else if (sessionStatus === "ended" || sessionStatus === "closed") {
        // Session over — dismiss entirely
        clearClaimSession();
        clearLastOrder();
        if (lastOrder?.orderRef) removeOrderFromStorage(lastOrder.orderRef);
        closeAndReset();
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

  async function handleRejoinSession() {
    const stored = loadClaimSession();
    if (!stored?.roomId) { setClaimStep("form"); return; }

    const storedUser = stored.robloxUser || "";
    const storedEmail = stored.contactEmail || lastOrder?.email || "";

    if (storedUser) setRobloxUser(storedUser);
    if (storedEmail) setContactEmail(storedEmail);

    setClaimStep("waiting");

    try {
      const res = await fetch(`${BACKEND}/api/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robloxUsername: storedUser || "Customer",
          contactEmail: storedEmail,
          orderRef: stored.orderRef || null,
          game: gameSlug || null,
          items: lastOrder?.items || [],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setClaimStep("form"); return; }

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
      setNextSlotAt(data.data.nextSlotAt || null);

      if (sessionStatus === "claimed") {
        clearClaimSession();
        clearLastOrder();
        const oRef = stored.orderRef || null;
        if (oRef) {
          removeOrderFromStorage(oRef);
          signalDelivered(oRef);
        }
        closeAndReset();
      } else if (sessionStatus === "ended" || sessionStatus === "closed") {
        clearClaimSession();
        clearLastOrder();
        if (stored.orderRef) removeOrderFromStorage(stored.orderRef);
        closeAndReset();
      } else if (sessionStatus === "active") {
        setAgentName(data.data.assignedAgent?.name || "RBstars Agent");
        setRoomId(rid);
        setClaimStep("active");
      } else {
        setRoomId(rid);
      }
    } catch {
      setClaimStep("form");
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

  function renderModeSelect() {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 pb-2 text-center">
          <div className="w-11 h-11 rounded-full mx-auto mb-2.5 overflow-hidden">
            <img src="/bot-mascot.webp" alt="" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-sm font-extrabold mb-0.5" style={{ color: "#F4F8FB" }}>How can we help?</h3>
          <p className="text-[11px]" style={{ color: "#9BAEBB" }}>Choose an option to get started</p>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-3 justify-center">
          {}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/tickets")}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all"
            style={{
              background: "#0C141B",
              border: "1.5px solid #2C414E",
            }}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "2px solid #F4F8FB" }}>
              <img src="/support-icon.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold" style={{ color: "#F4F8FB" }}>General Support</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#9BAEBB" }}>Submit a ticket and track its status</p>
            </div>
            <ChevronRight size={15} color="#637784" />
          </motion.button>

          {}
          {isAutoOnlyGame && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/auto-delivery")}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all"
            style={{
              background: "#0C141B",
              border: "1.5px solid #2C414E",
            }}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "2px solid #F4F8FB" }}>
              <img src="/support-icon.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold" style={{ color: "#F4F8FB" }}>
                Auto Delivery (Bot)
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#9BAEBB" }}>
                Bot delivers your items automatically — no waiting for an agent
              </p>
            </div>
            <ChevronRight size={15} color="#637784" />
          </motion.button>
          )}

          {}
          {!isAutoOnlyGame && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setMode("claim");
              const storedOrders = loadOrders();
              setOrders(storedOrders);
              if (storedOrders.length > 1) {
                setClaimStep("order-select");
              } else {
                if (storedOrders.length === 1) setSelectedOrder(storedOrders[0]);
                setClaimStep("select");
              }
            }}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all"
            style={{
              background: "#0C141B",
              border: "1.5px solid #2C414E",
            }}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "2px solid #F4F8FB" }}>
              <img src="/support-icon.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: "#F4F8FB" }}>
                Claim Chat
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(59,167,255,0.15)", color: "#3BA7FF" }}>
                  ITEMS
                </span>
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#9BAEBB" }}>
                {(() => {
                  const n = loadOrders().reduce((s, o) => s + (o.items?.length || 0), 0);
                  return n > 0 ? `${n} item${n !== 1 ? "s" : ""} ready to claim` : "Receive your purchased items";
                })()}
              </p>
            </div>
            <ChevronRight size={15} color="#637784" />
          </motion.button>
          )}
        </div>
      </div>
    );
  }

  function renderClaimSelect() {
    const storedSession = loadClaimSession();
    const orderDelivered =
      storedSession &&
      storedSession.orderRef === (lastOrder?.orderRef ?? null) &&
      storedSession.status === "claimed";

    if (orderDelivered) {
      return (
        <div className="flex flex-col h-full items-center justify-center p-6 text-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22C55E" }}>
            <CheckCheck size={24} color="#22C55E" />
          </div>
          <div>
            <p className="text-base font-extrabold mb-1" style={{ color: "#F4F8FB" }}>Order Delivered!</p>
            <p className="text-xs leading-relaxed" style={{ color: "#9BAEBB" }}>
              Your items have been delivered to your Roblox account. Check your inventory!
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => { clearClaimSession(); }}
            className="text-[11px] font-semibold px-4 py-2 rounded-xl"
            style={{ background: "rgba(59,167,255,0.15)", color: "#3BA7FF", border: "1px solid #3BA7FF" }}
          >
            Start New Chat
          </motion.button>
        </div>
      );
    }

    const pendingSession =
      storedSession &&
      storedSession.orderRef === (lastOrder?.orderRef ?? null) &&
      (storedSession.status === "pending" || storedSession.status === "active");

    if (pendingSession) {
      return (
        <div className="flex flex-col h-full justify-center p-4 gap-4">
          <div className="rounded-2xl p-4 text-center" style={{ background: "#1C2A34", border: "1.5px solid #3BA7FF" }}>
            <MessageSquare size={28} color="#5CB8FF" className="mx-auto mb-2" />
            <p className="text-sm font-extrabold mb-1" style={{ color: "#F4F8FB" }}>Chat In Progress</p>
            <p className="text-[11px] leading-relaxed" style={{ color: "#9BAEBB" }}>
              You already have an active claim session for this order.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => handleRejoinSession()}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: "#3BA7FF" }}
          >
            <MessageSquare size={15} />Continue Chat
          </motion.button>
        </div>
      );
    }

    if (!lastOrder || !lastOrder.items?.length) {
      return (
        <div className="flex flex-col h-full justify-center items-center p-4 gap-4 text-center">
          <img src="/no-order-icon.png" alt="" className="w-28 h-28 object-contain" />
          <p className="text-sm font-extrabold" style={{ color: "#F4F8FB" }}>No Recent Order Found</p>
          <p className="text-[11px] leading-relaxed max-w-[240px]" style={{ color: "#9BAEBB" }}>
            Place an order first, then return here to claim your items. If you already ordered, your items will appear here.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedItem({ id: "general", name: "General Claim" });
              setClaimStep("form");
            }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }}
          >
            Open General Claim Chat
          </motion.button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-bold" style={{ color: "#F4F8FB" }}>Select item to claim</p>
          {lastOrder.orderRef && (
            <p className="text-[10px] mt-0.5" style={{ color: "#637784" }}>Order {lastOrder.orderRef}</p>
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
              style={{ background: "#1C2A34", border: "1.5px solid #2C414E" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex-shrink-0"
                style={{ background: item.gradient ? item.gradient[0] : "#3BA7FF" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-extrabold truncate" style={{ color: "#F4F8FB" }}>{item.name}</p>
                {item.quantity > 1 && (
                  <p className="text-[10px]" style={{ color: "#637784" }}>Qty: {item.quantity}</p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
                <img src="/IMG_0732.png" alt="" className="w-3 h-3 object-contain" />
                <span className="text-[10px] font-extrabold" style={{ color: "#F4F8FB" }}>Claim</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  function renderOrderSelect() {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 pb-2 text-center flex-shrink-0">
          <img src="/IMG_0732.png" alt="" className="w-20 h-20 object-contain mx-auto mb-2" />
          <p className="text-sm font-extrabold" style={{ color: "#F4F8FB" }}>Which order to claim?</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#9BAEBB" }}>You have multiple orders — select one below</p>
        </div>
        <div className="flex-1 px-4 pb-4 overflow-y-auto space-y-2 mt-1">
          {orders.map(order => (
            <motion.button
              key={order.orderRef}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedOrder(order);
                setContactEmail(order.email || "");
                setClaimStep("select");
              }}
              className="w-full text-left rounded-xl p-3 flex items-center gap-3"
              style={{ background: "#1C2A34", border: "1.5px solid #2C414E" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#3BA7FF" }}>
                <Package size={14} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: "#637784" }}>
                  Order #{order.orderRef}
                </p>
                <p className="text-[11px] font-extrabold truncate" style={{ color: "#F4F8FB" }}>
                  {order.items?.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ") || "Items"}
                </p>
              </div>
              <ChevronRight size={14} color="#637784" className="flex-shrink-0" />
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
          <img src="/IMG_0732.png" alt="" className="w-20 h-20 object-contain mx-auto mb-2" />
          <p className="text-xs font-extrabold" style={{ color: "#F4F8FB" }}>{selectedItem?.name === "General Claim" ? "General Claim Chat" : `${selectedItem?.name} Claim`}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#9BAEBB" }}>Enter your details to connect with the claim team</p>
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
          <div className="rounded-xl p-3" style={{ background: "#1C2A34", border: "1px solid #3BA7FF" }}>
            <p className="text-[10px] leading-relaxed" style={{ color: "#F4F8FB" }}>
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
              style={{ background: "#3BA7FF", color: "white", boxShadow: "0 4px 0 #1a6bbf" }}
            >
              {submitting
                ? <><Loader2 size={15} className="animate-spin" />Connecting…</>
                : "Start Claim Chat"}
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
                style={{ background: "#1C2A34", border: "1px solid #3BA7FF" }}
              >
                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#F4F8FB" }}>
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
                      style={{ background: "#1C2A34", border: "1px solid #2C414E", color: "#F4F8FB" }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUserInfo}
                      disabled={editSaving || !editValue.trim()}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: editValue.trim() ? "#3BA7FF" : "#2C414E" }}
                    >
                      {editSaving ? <Loader2 size={12} className="animate-spin text-white" /> : <Check size={13} color="white" />}
                    </button>
                    <button
                      onClick={() => { setEditMode(null); setEditValue(""); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "#0C141B" }}
                    >
                      <X size={13} color="#9BAEBB" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="edit-buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[10px] text-center mb-1.5" style={{ color: "#637784" }}>Change before agent arrives</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditMode("roblox"); setEditValue(robloxUser); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold"
                    style={{ background: "#18242D", border: "1px solid #2C414E", color: "#3BA7FF" }}
                  >
                    <Gamepad2 size={11} />Change Username
                  </button>
                  <button
                    onClick={() => { setEditMode("email"); setEditValue(contactEmail); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold"
                    style={{ background: "#18242D", border: "1px solid #2C414E", color: "#3BA7FF" }}
                  >
                    <Mail size={11} />Change Email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {}
        <div className="p-3 pt-0 text-center border-t" style={{ borderColor: "#2C414E" }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="w-4 h-4 rounded-full border-2"
              style={{ borderColor: "#3BA7FF", borderTopColor: "transparent" }}
            />
            <span className="text-xs font-semibold" style={{ color: "#3BA7FF" }}>Waiting for claim team…</span>
          </div>
          <p className="text-[10px]" style={{ color: "#637784" }}>Usually responds within 2–5 minutes</p>
          {nextSlotAt && (
            <div className="mt-1.5 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
              style={{ background: "#1C2A34", border: "1px solid #3BA7FF", color: "#4338ca" }}>
              <Clock size={11} />
              <span>Opens at {nextSlotAt} GMT+3</span>
              <span className="font-mono opacity-60">({fmtSlotCountdown(nextSlotAt)})</span>
            </div>
          )}
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
            style={{ borderColor: "#2C414E", background: "#18242D" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#3BA7FF" }}>
              <Star size={9} fill="white" color="white" />
            </div>
            <span className="text-xs font-bold" style={{ color: "#F4F8FB" }}>{agentName}</span>
            {claimStep === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto flex-shrink-0" />}
            {claimStep === "claimed" && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
                ✓ Delivered
              </span>
            )}
            {claimStep === "ended" && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(59,167,255,0.15)", color: "#5CB8FF" }}>
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
                style={{ background: "#3BA7FF" }}>
                <Star size={10} fill="white" color="white" />
              </div>
              <div className="px-3 py-2 rounded-2xl" style={{ background: "#18242D", borderRadius: "18px 18px 18px 4px" }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#5CB8FF" }}
                      animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {isEnded && (
          <div className="px-4 py-3 text-center" style={{ borderTop: "1px solid #2C414E" }}>
            <div className="rounded-xl p-3" style={{
              background: claimStep === "claimed" ? "rgba(34,197,94,0.12)" : "rgba(59,167,255,0.08)",
              border: `1px solid ${claimStep === "claimed" ? "#22C55E" : "#3BA7FF"}`,
            }}>
              {claimStep === "claimed" ? (
                <>
                  <CheckCheck size={16} color="#22C55E" className="mx-auto mb-1" />
                  <p className="text-xs font-bold" style={{ color: "#22C55E" }}>Order Delivered!</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9BAEBB" }}>Check your Roblox inventory</p>
                </>
              ) : (
                <>
                  <Clock size={16} color="#5CB8FF" className="mx-auto mb-1" />
                  <p className="text-xs font-bold" style={{ color: "#F4F8FB" }}>Chat Ended</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9BAEBB" }}>Thank you for using RBstars!</p>
                </>
              )}
            </div>
          </div>
        )}

        {claimStep === "active" && (
          <div className="p-3 border-t" style={{ borderColor: "#2C414E" }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); handleTyping(); }}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 px-3 py-2.5 rounded-xl min-w-0"
                style={{ background: "#1C2A34", border: "1.5px solid #2C414E", color: "#F4F8FB" }}
              />
              <motion.button
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: input.trim() ? "#3BA7FF" : "#2C414E" }}
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
            style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22C55E" }}>
            <CheckCheck size={24} color="#22C55E" />
          </div>
          <p className="text-base font-extrabold mb-1" style={{ color: "#F4F8FB" }}>Review Submitted!</p>
          <p className="text-xs" style={{ color: "#9BAEBB" }}>Thank you for your feedback</p>
        </div>
      );
    }
    const starLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-4 pt-4 pb-2 text-center flex-shrink-0">
          <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
            style={{
              background: isDelivered ? "rgba(34,197,94,0.12)" : "rgba(59,167,255,0.08)",
              border: `1px solid ${isDelivered ? "#22C55E" : "#3BA7FF"}`,
            }}>
            {isDelivered ? <CheckCheck size={18} color="#22C55E" /> : <Clock size={18} color="#5CB8FF" />}
          </div>
          <p className="text-sm font-extrabold" style={{ color: "#F4F8FB" }}>
            {isDelivered ? "Items Delivered! 🎉" : "Chat Ended"}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#9BAEBB" }}>Share your experience with us</p>
        </div>
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#3BA7FF" }}>Your Rating</p>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map(star => (
              <motion.button key={star} whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.85 }} onClick={() => setReviewStars(star)}>
                <Star size={30} fill={star <= reviewStars ? "#f59e0b" : "none"} color={star <= reviewStars ? "#f59e0b" : "#2C414E"} strokeWidth={1.5} />
              </motion.button>
            ))}
            {reviewStars > 0 && (
              <span className="text-[11px] font-bold ml-1" style={{ color: "#f59e0b" }}>{starLabels[reviewStars]}</span>
            )}
          </div>
        </div>
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#3BA7FF" }}>Review (optional)</p>
          <textarea
            value={reviewComment}
            onChange={e => setReviewComment(e.target.value)}
            placeholder="How was your experience?"
            rows={3}
            maxLength={300}
            className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400 px-3 py-2.5 rounded-xl resize-none"
            style={{ background: "#1C2A34", border: "1.5px solid #2C414E", color: "#F4F8FB" }}
          />
        </div>
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#3BA7FF" }}>Attach Proof (optional)</p>
          {reviewProofPreview ? (
            <div className="relative">
              <img src={reviewProofPreview} alt="proof" className="w-full h-20 object-cover rounded-xl"
                style={{ border: "1px solid #2C414E" }} />
              <button onClick={() => { setReviewProof(null); setReviewProofPreview(null); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.6)" }}>
                <X size={10} color="white" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer text-[11px] font-semibold"
              style={{ background: "#1C2A34", border: "1.5px dashed #3BA7FF", color: "#5CB8FF" }}>
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
            style={{ background: "#18242D", border: "1px solid #2C414E", color: "#9BAEBB" }}>
            Skip
          </motion.button>
          <motion.button
            whileHover={{ scale: reviewStars > 0 ? 1.02 : 1 }}
            whileTap={{ scale: reviewStars > 0 ? 0.97 : 1 }}
            onClick={handleReviewSubmit}
            disabled={reviewStars === 0 || reviewSubmitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-1.5"
            style={{ background: reviewStars > 0 ? "#3BA7FF" : "#2C414E", opacity: reviewSubmitting ? 0.7 : 1 }}>
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
    const canGoBack = mode !== null && (claimStep === "select" || claimStep === "form");
    const title =
      mode === null ? "RBstars Support"
        : claimStep === "select" ? "Claim Chat"
            : claimStep === "form" ? (selectedItem?.name === "General Claim" ? "General Claim Chat" : `${selectedItem?.name || "Item"} Claim`)
              : claimStep === "waiting" ? (selectedItem?.name === "General Claim" ? "General Claim Chat" : `${selectedItem?.name || "Item"} Claim`)
                : claimStep === "review" ? "Rate Your Experience"
                  : agentName || "Claim Chat";

    const subtitle =
      mode === null ? "We're here to help"
          : claimStep === "waiting" ? "Waiting for agent…"
            : claimStep === "active" ? `Online — ${agentName}`
              : claimStep === "claimed" ? "Delivered ✓"
                : claimStep === "ended" ? "Chat Ended"
                  : claimStep === "review" ? "Your feedback matters"
                    : "RBstars Claim Team";

    return (
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "#131C23", borderBottom: "1px solid #2C414E" }}>
        <div className="flex items-center gap-2.5">
          {canGoBack ? (
            <button
              onClick={() => {
                if (claimStep === "form") { setClaimStep("select"); setSelectedItem(null); }
                else if (claimStep === "select") { setMode(null); }
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#0C141B" }}
            >
              <ArrowLeft size={14} color="#9BAEBB" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <img src="/header-banner.png" alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <p className="text-sm font-extrabold leading-tight" style={{ color: "#F4F8FB" }}>{title}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-semibold" style={{ color: "#22C55E" }}>{subtitle}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => claimStep === "review" ? closeAndReset() : setOpen(false)}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "#0C141B" }}
        >
          <X size={14} color="#9BAEBB" />
        </button>
      </div>
    );
  }

  function renderBody() {
    if (mode === null) return renderModeSelect();
    if (mode === "claim") {
      if (claimStep === "order-select") return renderOrderSelect();
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
              background: "#131C23",
              border: "1.5px solid #2C414E",
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
        whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(59,167,255,0.7)" }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-4 z-[300] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: "#3BA7FF", boxShadow: "0 4px 24px rgba(59,167,255,0.55)" }}
      >
        {hasActivity && (
          <motion.span
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full"
            style={{ background: "#3BA7FF" }}
          />
        )}
        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#3BA7FF]" />
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
