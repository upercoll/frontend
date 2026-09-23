import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  CheckCircle, RefreshCw, Inbox, ArrowLeft, Mail, Gamepad2,
  Hash, Clock, X, User, MessageSquare, Archive, Wifi, WifiOff,
  Send, Loader2, Truck, Package,
} from "lucide-react";
import { delivererGet, delivererPost, getDelivererToken } from "@/pages/DelivererLayout";
import { cn } from "@/lib/utils";

const BACKEND_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";

// ── helpers ──────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending: { dot: "bg-red-400",     pill: "bg-red-500/15 text-red-400",           label: "Waiting",     pulse: true  },
  active:  { dot: "bg-amber-400",   pill: "bg-amber-500/15 text-amber-400",       label: "In Progress", pulse: true  },
  claimed: { dot: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-400",   label: "Delivered",   pulse: false },
  ended:   { dot: "bg-slate-500",   pill: "bg-slate-500/15 text-slate-400",       label: "Ended",       pulse: false },
  closed:  { dot: "bg-purple-400",  pill: "bg-purple-500/15 text-purple-400",     label: "Closed",      pulse: false },
} as const;

type SessionStatus = "pending" | "active" | "claimed" | "ended" | "closed";
type Tab = "waiting" | "active" | "completed";

interface Session {
  _id: string; roomId: string; robloxUsername: string; contactEmail: string;
  game?: string; orderRef?: string; status: SessionStatus;
  items: { name: string; quantity: number }[];
  messages?: Message[]; createdAt: string;
  assignedAgent?: { userId: string; name: string; joinedAt: string };
  delivererAssigned?: { delivererId: string; name: string };
}

interface Message {
  _id?: string; sender: "customer" | "agent" | "system"; text: string;
  senderName: string; timestamp: string;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "Now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmt(t: string) {
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const GENERIC = ["general claim", "claim chat"];
function isGenericName(name?: string) { return !name || GENERIC.includes(name.trim().toLowerCase()); }
function getItemLabel(s: Session) {
  const first = s.items?.find(i => i.name && !isGenericName(i.name));
  return first?.name || "";
}

function avatarColor(username: string) {
  const colors = ["bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-cyan-500", "bg-teal-500", "bg-rose-500", "bg-amber-500"];
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) % colors.length;
  return colors[h];
}

function makeId() { return Math.random().toString(36).slice(2, 10); }

// ── ConvoItem ─────────────────────────────────────────────────────────────────
function ConvoItem({ session, selected, onClick, unread }: {
  session: Session; selected: boolean; onClick: () => void; unread: number;
}) {
  const cfg = STATUS_CFG[session.status] || STATUS_CFG.ended;
  const item = getItemLabel(session);
  const last = session.messages?.filter(m => m.sender !== "system").slice(-1)[0];
  const preview = last ? (last.sender === "agent" ? "You: " : "") + last.text.slice(0, 60) : "No messages yet";

  return (
    <div
      role="button" tabIndex={0} onClick={onClick} onKeyDown={e => e.key === "Enter" && onClick()}
      className={cn(
        "w-full text-left px-3 py-3.5 flex items-start gap-3 border-b border-white/[0.04] transition-colors cursor-pointer relative",
        selected ? "bg-sky-600/10 border-l-2 border-l-sky-500" : unread > 0 ? "bg-blue-500/5 hover:bg-blue-500/8" : "hover:bg-white/[0.03]"
      )}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white", avatarColor(session.robloxUsername))}>
          {session.robloxUsername[0]?.toUpperCase() ?? "?"}
        </div>
        <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[2px] border-[#0a1628]", cfg.dot, cfg.pulse ? "animate-pulse" : "")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={cn("text-xs font-semibold truncate", unread > 0 ? "text-white" : "text-slate-200")}>{session.robloxUsername}</p>
          <span className="text-slate-600 text-[10px] flex-shrink-0">{timeAgo(session.createdAt)}</span>
        </div>
        <p className={cn("text-[11px] truncate leading-relaxed", unread > 0 ? "text-slate-300 font-medium" : "text-slate-500")}>{preview}</p>
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {item && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/15 truncate max-w-[100px]">{item}</span>}
          {session.game && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/15 truncate max-w-[80px]">{session.game}</span>}
          {unread > 0 && <span className="ml-auto flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">{unread} new</span>}
        </div>
      </div>
    </div>
  );
}

// ── ProfilePanel ──────────────────────────────────────────────────────────────
function ProfilePanel({ session, isMyActive, onClose, onDeliver, onEnd, onCloseChat }: {
  session: Session; isMyActive: boolean;
  onClose: () => void; onDeliver: () => void; onEnd: () => void; onCloseChat: () => void;
}) {
  const cfg = STATUS_CFG[session.status] || STATUS_CFG.ended;
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (!session.orderRef) { setOrderData(null); return; }
    delivererGet(`/orders/by-ref/${encodeURIComponent(session.orderRef)}`)
      .then((res: any) => setOrderData(res?.data || null))
      .catch(() => setOrderData(null));
  }, [session.orderRef]);

  const infoRows = [
    session.contactEmail && { icon: Mail,    label: "Email",   value: session.contactEmail },
    session.game         && { icon: Gamepad2, label: "Game",    value: session.game },
    session.orderRef     && { icon: Hash,     label: "Order",   value: `#${session.orderRef.slice(-8)}` },
    { icon: Clock, label: "Started", value: timeAgo(session.createdAt) },
    session.assignedAgent?.name && { icon: User, label: "Agent", value: session.assignedAgent.name },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  const orderItems: { name: string; qty: number; price?: number; imageUrl?: string; gradient?: { from: string; to: string } }[] =
    orderData?.items?.length
      ? orderData.items.map((i: any) => ({
          name: i.productSnapshot?.name || i.product?.name || i.name,
          qty: i.quantity,
          price: i.unitPrice,
          imageUrl: i.product?.imageUrl,
          gradient: i.productSnapshot?.gradient || i.product?.gradient,
        }))
      : (session.items || []).map(i => ({ name: i.name, qty: i.quantity }));

  return (
    <div className="flex flex-col h-full bg-[#0a1628] border-l border-white/5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 flex-shrink-0">
        <p className="text-white text-sm font-semibold">Profile</p>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Avatar + status */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5 text-center flex-shrink-0">
        <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-3", avatarColor(session.robloxUsername))}>
          {session.robloxUsername[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="text-white font-semibold text-sm">{session.robloxUsername}</p>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <span className="text-slate-500 text-xs">Customer</span>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", cfg.pill)}>
            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1 mb-px", cfg.dot, cfg.pulse ? "animate-pulse" : "")} />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Info rows */}
      <div className="px-4 py-4 space-y-3 border-b border-white/5 flex-shrink-0">
        {infoRows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-slate-600 text-[10px] leading-none mb-0.5">{label}</p>
              <p className="text-slate-300 text-xs break-all">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Order items product cards — same as agent panel */}
      {orderItems.length > 0 && (
        <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Order Items</p>
            {orderData?.pricing?.total != null && (
              <span className="text-emerald-400 text-xs font-semibold">${orderData.pricing.total.toFixed(2)}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {orderItems.map((item, i) => (
              <div key={i} className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden flex flex-col">
                <div
                  className="relative w-full h-16 overflow-hidden flex-shrink-0"
                  style={{ background: item.gradient ? `linear-gradient(135deg, ${item.gradient.from} 0%, ${item.gradient.to} 100%)` : "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}
                >
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "12px 12px" }} />
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />}
                </div>
                <div className="p-2">
                  <p className="text-white text-[11px] font-medium leading-tight line-clamp-2">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-500 text-[10px]">×{item.qty}</span>
                    {item.price != null && <span className="text-emerald-400 text-[10px] font-semibold">${item.price.toFixed(2)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {orderData?.status && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-slate-600 text-[10px]">Order Status:</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium",
                orderData.status === "paid" || orderData.status === "completed" ? "bg-emerald-500/15 text-emerald-400"
                : orderData.status === "cancelled" ? "bg-red-500/15 text-red-400"
                : "bg-slate-500/15 text-slate-400"
              )}>{orderData.status}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isMyActive && (
        <div className="px-4 py-4 space-y-2 flex-shrink-0">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onDeliver}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" />Mark as Delivered
          </motion.button>
          <button onClick={onCloseChat}
            className="w-full py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
            <Archive className="w-3.5 h-3.5" />Close Chat
          </button>
          <button onClick={onEnd}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors">
            End Chat
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DelivererQueue() {
  const [sessions, setSessions] = useState<{ pending: Session[]; mine: Session[]; completed: Session[] }>({ pending: [], mine: [], completed: [] });
  const [activeTab, setActiveTab] = useState<Tab>("waiting");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<0 | 1 | 2>(0);
  const [unread, setUnread] = useState<Map<string, number>>(new Map());
  const [connected, setConnected] = useState(false);
  const [delivererName, setDelivererName] = useState("");
  const [closingSession, setClosingSession] = useState<Session | null>(null);

  // POD modal state (same as agent panel)
  const [podMode, setPodMode] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [podNotes, setPodNotes] = useState("");
  const [noProof, setNoProof] = useState(false);
  const [submittingPod, setSubmittingPod] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRoomIdRef = useRef<string | null>(null);

  // Get deliverer name on mount
  useEffect(() => {
    delivererGet("/auth/me")
      .then((res: any) => setDelivererName(res.data?.user?.name || res.data?.user?.email || "Deliverer"))
      .catch(() => {});
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      const res = await delivererGet("/claims");
      setSessions(res.data);
    } catch {}
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // ── Socket setup (scoped to selected session room) ────────────────────────
  useEffect(() => {
    if (!selectedSession) return;
    if (selectedSession.status === "claimed" || selectedSession.status === "ended" || selectedSession.status === "closed") return;

    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      auth: { token: getDelivererToken() },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.emit("claim:join", { roomId: selectedSession.roomId });

    socket.on("claim:new_message", (msg: Message) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.text === msg.text && last?.senderName === msg.senderName) return prev;
        return [...prev, msg];
      });
      if (selectedSession.roomId !== selectedRoomIdRef.current) {
        setUnread(p => { const n = new Map(p); n.set(selectedSession.roomId, (n.get(selectedSession.roomId) || 0) + 1); return n; });
      }
    });

    socket.on("claim:message_ack", (msg: Message) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.text === msg.text && last?.senderName === msg.senderName) return prev;
        return [...prev, msg];
      });
    });

    socket.on("claim:agent_joined", ({ agentName }: { agentName: string }) => {
      setSelectedSession(s => s ? { ...s, status: "active", assignedAgent: { userId: "", name: agentName, joinedAt: new Date().toISOString() } } : s);
    });

    socket.on("claim:marked_claimed", () => {
      setSelectedSession(s => s ? { ...s, status: "claimed" } : s);
      setSessions(prev => ({
        ...prev,
        mine: prev.mine.filter(s => s.roomId !== selectedSession.roomId),
        completed: selectedSession ? [{ ...selectedSession, status: "claimed" }, ...prev.completed] : prev.completed,
      }));
      setActiveTab("completed");
      loadQueue();
    });

    socket.on("claim:ended", () => {
      setSelectedSession(s => s ? { ...s, status: "ended" } : s);
      loadQueue();
    });

    socket.on("claim:closed", () => {
      setSelectedSession(s => s ? { ...s, status: "closed" } : s);
      loadQueue();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [selectedSession?.roomId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const openSession = useCallback(async (s: Session) => {
    setMobilePanel(1);
    selectedRoomIdRef.current = s.roomId;
    setUnread(p => { const n = new Map(p); n.delete(s.roomId); return n; });
    try {
      const res = await delivererGet(`/claims/${s.roomId}`);
      const full: Session = res.data.session;
      setSelectedSession(full);
      setMessages(full.messages || []);
    } catch {
      setSelectedSession(s);
      setMessages(s.messages || []);
    }
  }, []);

  const claimSession = async (roomId: string) => {
    setClaiming(roomId);
    try {
      await delivererPost(`/claims/${roomId}/claim`);
      await loadQueue();
      const res = await delivererGet(`/claims/${roomId}`);
      const full: Session = res.data.session;
      setSelectedSession(full);
      setMessages(full.messages || []);
      setMobilePanel(1);
      setActiveTab("active");
    } catch (err: any) { alert(err.message || "Failed to claim"); }
    finally { setClaiming(null); }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = msgText.trim();
    if (!text || !selectedSession || selectedSession.status !== "active") return;
    setSendingMsg(true);
    const optimistic: Message = { _id: makeId(), sender: "agent", text, senderName: delivererName, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setMsgText("");
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("claim:message", { roomId: selectedSession.roomId, text, senderName: delivererName, sender: "agent" });
      } else {
        await delivererPost(`/claims/${selectedSession.roomId}/message`, { text });
      }
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      alert(err.message || "Failed to send");
    } finally { setSendingMsg(false); }
  };

  const submitPod = async () => {
    if (!selectedSession || (!noProof && proofFiles.length === 0)) return;
    setSubmittingPod(true);
    try {
      const form = new FormData();
      if (!noProof) proofFiles.forEach(f => form.append("proofs", f));
      if (podNotes) form.append("notes", podNotes);
      const res = await fetch(`${BACKEND_URL}/api/deliverer/claims/${selectedSession.roomId}/deliver`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getDelivererToken()}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to deliver");
      setPodMode(false);
      setProofFiles([]); setPodNotes(""); setNoProof(false);
      setActiveTab("completed");
      setSelectedSession(s => s ? { ...s, status: "claimed" } : s);
      await loadQueue();
    } catch (err: any) {
      alert(err instanceof Error ? err.message : "Failed to submit");
    } finally { setSubmittingPod(false); }
  };

  const endChat = () => {
    if (!socketRef.current || !selectedSession) return;
    if (!confirm("End this chat without marking as delivered?")) return;
    socketRef.current.emit("claim:end", { roomId: selectedSession.roomId });
    setSelectedSession(s => s ? { ...s, status: "ended" } : s);
    loadQueue();
  };

  const confirmClose = () => {
    if (!socketRef.current || !closingSession) return;
    socketRef.current.emit("claim:close", { roomId: closingSession.roomId });
    setClosingSession(null);
    setSelectedSession(s => s && s.roomId === closingSession.roomId ? { ...s, status: "closed" } : s);
    loadQueue();
  };

  // Tab data
  const waitingSessions = sessions.pending;
  const activeSessions  = sessions.mine;
  const completedSessions = sessions.completed;

  const tabSessions: Session[] =
    activeTab === "waiting"   ? waitingSessions :
    activeTab === "active"    ? activeSessions  :
    completedSessions;

  const isMyActive = selectedSession?.status === "active" && !!selectedSession.delivererAssigned;

  const TABS = [
    { key: "waiting"   as Tab, label: "Waiting",     count: waitingSessions.length },
    { key: "active"    as Tab, label: "In Progress",  count: activeSessions.length  },
    { key: "completed" as Tab, label: "Completed",    count: completedSessions.length },
  ];

  return (
    <div className="flex h-[calc(100vh-64px-48px)] overflow-hidden rounded-2xl" style={{ background: "rgba(6,9,28,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>

      {/* ══════ LEFT: Inbox ══════ */}
      <div className={cn("flex flex-col flex-shrink-0 border-r border-white/5 bg-[#0a1628] w-full md:w-72", mobilePanel !== 0 ? "hidden md:flex" : "flex")}>
        <div className="px-4 py-3.5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", connected ? "bg-emerald-400" : "bg-red-400")} style={{ boxShadow: connected ? "0 0 6px rgba(52,211,153,0.6)" : undefined }} />
              <span className="text-white font-semibold text-sm">Claim Queue</span>
            </div>
            <div className="flex items-center gap-1">
              {connected ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
              <button onClick={loadQueue} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-colors ml-1">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 flex-shrink-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn("flex-1 py-2.5 text-[10px] font-semibold transition-colors",
                activeTab === tab.key ? "text-sky-400 border-b-2 border-sky-500" : "text-slate-500 hover:text-slate-300")}>
              {tab.label}
              {tab.count > 0 && <span className={cn("ml-1 text-[9px] px-1 py-0.5 rounded font-bold", activeTab === tab.key ? "bg-sky-500/20 text-sky-300" : "bg-white/8 text-slate-500")}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {tabSessions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Inbox className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-600 text-sm font-medium">
                {activeTab === "waiting" ? "No waiting chats" : activeTab === "active" ? "No active chats" : "No completed chats"}
              </p>
            </div>
          ) : (
            tabSessions.map(s => (
              <ConvoItem key={s.roomId} session={s} selected={selectedSession?.roomId === s.roomId}
                onClick={() => openSession(s)} unread={unread.get(s.roomId) || 0} />
            ))
          )}
        </div>
      </div>

      {/* ══════ CENTER: Chat ══════ */}
      <div className={cn("flex flex-col flex-1 min-w-0 overflow-hidden", mobilePanel === 1 ? "flex" : "hidden md:flex")}>
        {!selectedSession ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/8 border border-sky-500/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-slate-700" />
            </div>
            <h3 className="text-white font-semibold mb-1">Select a conversation</h3>
            <p className="text-slate-500 text-sm max-w-xs">Choose a chat from the queue to start delivering.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0 bg-[#0a1628]">
              <button onClick={() => setMobilePanel(0)} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0", avatarColor(selectedSession.robloxUsername))}>
                {selectedSession.robloxUsername[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{selectedSession.robloxUsername}</p>
                <p className="text-slate-500 text-[11px] truncate">{[selectedSession.game, getItemLabel(selectedSession)].filter(Boolean).join(" · ") || "Customer"}</p>
              </div>

              {/* Claim button for pending */}
              {selectedSession.status === "pending" && (
                <button onClick={() => claimSession(selectedSession.roomId)} disabled={!!claiming}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white disabled:opacity-50 flex-shrink-0 transition-colors"
                  style={{ background: "rgba(14,165,233,0.9)" }}>
                  {claiming === selectedSession.roomId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                  Claim Chat
                </button>
              )}

              {/* Mark Delivered + Close for active */}
              {isMyActive && (
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setPodMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" />Mark as Delivered
                  </motion.button>
                  <button onClick={() => setClosingSession(selectedSession)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors">
                    <Archive className="w-3.5 h-3.5" />Close Chat
                  </button>
                </div>
              )}

              <button onClick={() => setShowProfile(p => !p)}
                className={cn("hidden md:flex w-8 h-8 rounded-lg items-center justify-center transition-colors flex-shrink-0",
                  showProfile ? "bg-sky-600/20 text-sky-400" : "text-slate-500 hover:text-white hover:bg-white/5")}>
                <User className="w-4 h-4" />
              </button>
              <button onClick={() => setMobilePanel(2)} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 flex-shrink-0">
                <User className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile action bar */}
            {selectedSession.status === "pending" && (
              <div className="sm:hidden px-3 py-2 border-b border-white/5 bg-[#0a1628] flex-shrink-0">
                <button onClick={() => claimSession(selectedSession.roomId)} disabled={!!claiming}
                  className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ background: "rgba(14,165,233,0.9)" }}>
                  {claiming === selectedSession.roomId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                  Claim Chat
                </button>
              </div>
            )}
            {isMyActive && (
              <div className="sm:hidden px-3 py-2 border-b border-white/5 bg-[#0a1628] flex-shrink-0 flex gap-2">
                <button onClick={() => setPodMode(true)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />Mark as Delivered
                </button>
                <button onClick={() => setClosingSession(selectedSession)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 flex items-center justify-center gap-1.5">
                  <Archive className="w-3.5 h-3.5" />Close Chat
                </button>
              </div>
            )}

            {/* Items strip */}
            {selectedSession.items?.length > 0 && (
              <div className="px-4 py-2 flex items-center gap-2 flex-wrap border-b border-white/5 flex-shrink-0">
                <Package className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                {selectedSession.items.map((item, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full text-sky-300/70 flex-shrink-0" style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.12)" }}>
                    {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
                  </span>
                ))}
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => {
                if (msg.sender === "system") {
                  return (
                    <div key={i} className="flex justify-center">
                      <span className="text-[11px] px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>{msg.text}</span>
                    </div>
                  );
                }
                const isAgent = msg.sender === "agent";
                return (
                  <div key={i} className={cn("flex items-end gap-2", isAgent ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                      isAgent ? "bg-sky-500/20 text-sky-400" : avatarColor(selectedSession.robloxUsername) + " opacity-80")}>
                      {(msg.senderName || (isAgent ? "D" : "C"))[0].toUpperCase()}
                    </div>
                    <div className={cn("max-w-[75%] flex flex-col gap-1", isAgent ? "items-end" : "items-start")}>
                      <span className={cn("text-[10px] font-medium", isAgent ? "text-sky-400 text-right" : "text-slate-400")}>
                        {msg.senderName}
                      </span>
                      <div className={cn("px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                        isAgent ? "bg-sky-600/20 text-sky-100 border border-sky-500/15 rounded-tr-sm" : "bg-white/7 text-slate-200 border border-white/5 rounded-tl-sm")}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-white/25 mx-1">{fmt(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivered banner */}
            {(selectedSession.status === "claimed" || selectedSession.status === "ended") && (
              <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{
                  background: selectedSession.status === "claimed" ? "rgba(74,222,128,0.08)" : "rgba(124,58,237,0.08)",
                  border: `1px solid ${selectedSession.status === "claimed" ? "rgba(74,222,128,0.15)" : "rgba(196,181,253,0.15)"}`,
                }}>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: selectedSession.status === "claimed" ? "#4ade80" : "#a78bfa" }} />
                  <p className="text-xs font-medium" style={{ color: selectedSession.status === "claimed" ? "#4ade80" : "#a78bfa" }}>
                    {selectedSession.status === "claimed" ? "Delivered — order complete" : "Chat ended"}
                  </p>
                </div>
              </div>
            )}

            {/* Message input */}
            {isMyActive && (
              <form onSubmit={sendMessage} className="px-4 py-3 border-t border-white/5 flex-shrink-0 flex gap-2">
                <input value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                <button type="submit" disabled={sendingMsg || !msgText.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-colors"
                  style={{ background: "rgba(14,165,233,0.9)" }}>
                  {sendingMsg ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* ══════ RIGHT: Profile Panel ══════ */}
      <AnimatePresence>
        {selectedSession && (showProfile || mobilePanel === 2) && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: undefined, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={cn("flex-shrink-0 overflow-hidden", mobilePanel === 2 ? "flex w-full md:w-72" : "hidden md:flex md:w-72")}>
            <div className="w-full">
              <ProfilePanel
                session={selectedSession}
                isMyActive={isMyActive}
                onClose={() => { setShowProfile(false); setMobilePanel(1); }}
                onDeliver={() => setPodMode(true)}
                onEnd={endChat}
                onCloseChat={() => setClosingSession(selectedSession)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mobilePanel === 2 && (
        <button onClick={() => setMobilePanel(1)} className="md:hidden fixed top-[72px] left-3 z-30 w-8 h-8 bg-[#0a1628] border border-white/10 rounded-lg flex items-center justify-center text-slate-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      {/* ══════ POD Modal (same as agent) ══════ */}
      <AnimatePresence>
        {podMode && selectedSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">Proof of Delivery</h3>
                <p className="text-slate-400 text-xs mt-0.5">Submit proof before marking as delivered</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-sm font-medium">Screenshots {noProof ? "(skipped)" : `(${proofFiles.length}/5)`}</label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div onClick={() => { setNoProof(v => !v); if (!noProof) setProofFiles([]); }}
                      className={cn("relative w-9 h-5 rounded-full transition-colors flex-shrink-0", noProof ? "bg-amber-500" : "bg-white/10")}>
                      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", noProof ? "left-4" : "left-0.5")} />
                    </div>
                    <span className="text-xs text-slate-400">No proof</span>
                  </label>
                </div>
                {!noProof && (
                  <>
                    {proofFiles.length > 0 && (
                      <div className="space-y-1.5">
                        {proofFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <p className="text-emerald-300 text-xs flex-1 truncate">{f.name}</p>
                            <button type="button" onClick={() => setProofFiles(p => p.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {proofFiles.length < 5 && (
                      <div onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors border-white/10 hover:border-white/20">
                        <p className="text-slate-400 text-sm">{proofFiles.length === 0 ? "Tap to upload screenshots" : "Add another screenshot"}</p>
                        <p className="text-slate-600 text-xs mt-0.5">PNG, JPG up to 10MB · max 5 images</p>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => {
                        const newFiles = Array.from(e.target.files || []);
                        setProofFiles(p => [...p, ...newFiles].slice(0, 5));
                        e.target.value = "";
                      }} />
                  </>
                )}
                {noProof && (
                  <div className="rounded-xl px-4 py-3 text-xs text-amber-400/80 flex items-start gap-2 bg-amber-500/8 border border-amber-500/20">
                    <span>⚠️</span><span>Skipping proof — delivery will be marked without a screenshot.</span>
                  </div>
                )}
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Notes</label>
                  <textarea value={podNotes} onChange={e => setPodNotes(e.target.value)} placeholder="Optional delivery notes…" rows={2}
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/5 flex gap-3">
                <button onClick={() => { setPodMode(false); setProofFiles([]); setNoProof(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button onClick={submitPod} disabled={submittingPod || (!noProof && proofFiles.length === 0)}
                  className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors",
                    (!noProof && proofFiles.length === 0) || submittingPod ? "bg-emerald-700/40 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700")}>
                  {submittingPod ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Submitting…</> : <><CheckCircle className="w-3.5 h-3.5" />Mark as Delivered</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ Close Chat Confirmation ══════ */}
      <AnimatePresence>
        {closingSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setClosingSession(null)}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Archive className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1">Close this chat?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  This will archive the chat with <span className="text-white font-medium">{closingSession.robloxUsername}</span>. No further messages can be sent.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setClosingSession(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={confirmClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                  <Archive className="w-3.5 h-3.5" />Close Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
