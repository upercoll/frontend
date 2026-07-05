import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, RefreshCw, Inbox, ArrowLeft, Mail,
  Gamepad2, Package, Hash, Clock,
  Wifi, WifiOff, X, AlertCircle, User, MessageSquare, Archive, XCircle,
} from "lucide-react";
import { useAdminSocket } from "../../context/AdminSocketContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { adminApi } from "../../api";
import ChatWindow from "../../components/ChatWindow";
import { cn } from "@/lib/utils";
import type { ClaimSession } from "../../types";

// ── helpers ─────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending: { dot: "bg-red-400",     pill: "bg-red-500/15 text-red-400",           label: "Waiting",     pulse: true  },
  active:  { dot: "bg-amber-400",   pill: "bg-amber-500/15 text-amber-400",       label: "In Progress", pulse: true  },
  claimed: { dot: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-400",   label: "Delivered",   pulse: false },
  ended:   { dot: "bg-slate-500",   pill: "bg-slate-500/15 text-slate-400",       label: "Ended",       pulse: false },
  closed:  { dot: "bg-purple-400",  pill: "bg-purple-500/15 text-purple-400",     label: "Closed",      pulse: false },
} as const;

type LiveStatus = { status: ClaimSession["status"]; agentName?: string };
type Tab = "waiting" | "active" | "completed" | "closed";

function playPing() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1100;
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)   return "Now";
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });
}

const GENERIC_ITEM_NAMES = ["general claim", "claim chat"];
function isGenericName(name?: string): boolean {
  return !name || GENERIC_ITEM_NAMES.includes(name.trim().toLowerCase());
}

function getItemLabel(s: ClaimSession): string {
  const raw = s.itemName;
  if (raw && !isGenericName(raw)) return raw.trim();
  const first = s.items?.find(i => i.name && !isGenericName(i.name));
  return first?.name || "";
}

function lastMessagePreview(s: ClaimSession): string {
  const msgs = s.messages?.filter(m => m.sender !== "system") || [];
  if (!msgs.length) return "No messages yet";
  const last = msgs[msgs.length - 1];
  return (last.sender === "agent" ? "You: " : "") + last.text.slice(0, 60);
}

function avatarColor(username: string): string {
  const colors = ["bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-cyan-500", "bg-teal-500", "bg-rose-500", "bg-amber-500"];
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) % colors.length;
  return colors[h];
}

// ── ConvoItem ────────────────────────────────────────────────────────────────
function ConvoItem({
  session, liveStatus, selected, onClick, unreadCount, livePreview, canClose, onClose,
}: {
  session: ClaimSession; liveStatus?: LiveStatus; selected: boolean;
  onClick: () => void; unreadCount: number; livePreview?: string;
  canClose?: boolean; onClose?: (e: React.MouseEvent) => void;
}) {
  const effStatus = liveStatus?.status || session.status;
  const cfg = STATUS_CFG[effStatus] || STATUS_CFG.ended;
  const item    = getItemLabel(session);
  const preview = livePreview || lastMessagePreview(session);
  const hasUnread = unreadCount > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
      className={cn(
        "w-full text-left px-3 py-3.5 flex items-start gap-3 border-b border-white/[0.04] transition-colors cursor-pointer relative group",
        selected
          ? "bg-indigo-600/10 border-l-2 border-l-indigo-500"
          : hasUnread
          ? "bg-blue-500/5 hover:bg-blue-500/8"
          : "hover:bg-white/[0.03]"
      )}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white", avatarColor(session.robloxUsername))}>
          {session.robloxUsername[0]?.toUpperCase() ?? "?"}
        </div>
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[2px] border-[#0a1628]",
          cfg.dot, cfg.pulse ? "animate-pulse" : ""
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={cn("text-xs font-semibold truncate", hasUnread ? "text-white" : "text-slate-200")}>
            {session.robloxUsername}
          </p>
          <span className="text-slate-600 text-[10px] flex-shrink-0">{timeAgo(session.createdAt)}</span>
        </div>
        <p className={cn("text-[11px] truncate leading-relaxed", hasUnread ? "text-slate-300 font-medium" : "text-slate-500")}>
          {preview}
        </p>
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {item && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/15 truncate max-w-[100px]">{item}</span>
          )}
          {session.game && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/15 truncate max-w-[80px]">{session.game}</span>
          )}
          {hasUnread && (
            <span className="ml-auto flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {canClose && (
        <button
          onClick={e => { e.stopPropagation(); onClose?.(e); }}
          title="Close chat"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-purple-400 hover:bg-purple-500/10"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── ProfilePanel ─────────────────────────────────────────────────────────────
function ProfilePanel({
  session, liveStatus, isMyActiveSession, isMyCompletedSession, onClose, onDeliver, onEnd, onCloseChat, onCancel,
}: {
  session: ClaimSession; liveStatus?: LiveStatus; isMyActiveSession: boolean; isMyCompletedSession?: boolean;
  onClose: () => void; onDeliver: () => void; onEnd: () => void; onCloseChat?: () => void; onCancel?: () => void;
}) {
  const effStatus = liveStatus?.status || session.status;
  const effAgent  = liveStatus?.agentName || session.assignedAgent?.name;
  const cfg  = STATUS_CFG[effStatus] || STATUS_CFG.ended;

  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (!session.orderRef) { setOrderData(null); return; }
    adminApi.orders.get(session.orderRef)
      .then((res: any) => setOrderData(res?.data || null))
      .catch(() => setOrderData(null));
  }, [session.orderRef]);

  const infoRows = [
    session.contactEmail && { icon: Mail,    label: "Email",   value: session.contactEmail },
    session.game         && { icon: Gamepad2, label: "Game",    value: session.game },
    session.orderRef     && { icon: Hash,     label: "Order",   value: `#${session.orderRef.slice(-8)}` },
    { icon: Clock, label: "Started", value: timeAgo(session.createdAt) },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  // imageUrl is on the populated product ref, not productSnapshot (snapshot schema has no imageUrl field)
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

      {/* Avatar + name + status */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5 text-center flex-shrink-0">
        <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-3", avatarColor(session.robloxUsername))}>
          {session.robloxUsername[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="text-white font-semibold text-sm">{session.robloxUsername}</p>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <span className="text-slate-500 text-xs">Customer</span>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", cfg.pill)}>
            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1 mb-px", cfg.dot, cfg.pulse ? "animate-pulse" : "")} />
            {effAgent && (effStatus === "active" || effStatus === "claimed") ? `${cfg.label} · ${effAgent}` : cfg.label}
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

      {/* Ordered items product grid */}
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
                {/* Gradient always shown as base; image overlaid on top — matches product card style sitewide */}
                <div
                  className="relative w-full h-16 overflow-hidden flex-shrink-0"
                  style={{
                    background: item.gradient
                      ? `linear-gradient(135deg, ${item.gradient.from} 0%, ${item.gradient.to} 100%)`
                      : "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)",
                      backgroundSize: "12px 12px",
                    }}
                  />
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-white text-[11px] font-medium leading-tight line-clamp-2">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-500 text-[10px]">×{item.qty}</span>
                    {item.price != null && (
                      <span className="text-emerald-400 text-[10px] font-semibold">${item.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {orderData?.status && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-slate-600 text-[10px]">Status:</span>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium capitalize",
                orderData.status === "paid" ? "bg-emerald-500/15 text-emerald-400" :
                orderData.status === "cancelled" ? "bg-red-500/15 text-red-400" :
                "bg-slate-500/15 text-slate-400"
              )}>{orderData.status}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isMyActiveSession && (
        <div className="px-4 py-4 space-y-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={onDeliver}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Mark as Completed
          </motion.button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Order
            </button>
          )}
          {onCloseChat && (
            <button
              onClick={onCloseChat}
              className="w-full py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Close Chat
            </button>
          )}
          <button
            onClick={onEnd}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
          >
            End Chat
          </button>
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function Queue() {
  const { socket, connected, pendingClaims, removePendingClaim } = useAdminSocket();
  const { user } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedRoomIdRef = useRef<string | null>(null);

  const [activeTab, setActiveTab]             = useState<Tab>("waiting");
  const [mobilePanel, setMobilePanel]         = useState<0 | 1 | 2>(0);
  const [selectedSession, setSelectedSession] = useState<ClaimSession | null>(null);
  const [loadingSession, setLoadingSession]   = useState(false);
  const [showProfile, setShowProfile]         = useState(true);
  const [liveStatuses, setLiveStatuses] = useState<Map<string, LiveStatus>>(new Map());
  const [unread, setUnread]             = useState<Map<string, number>>(new Map());
  const [lastActivity, setLastActivity] = useState<Map<string, number>>(new Map());
  const [livePreview, setLivePreview]   = useState<Map<string, string>>(new Map());

  // Close confirmation modal
  const [closingSession, setClosingSession] = useState<ClaimSession | null>(null);

  // POD modal
  const [podMode, setPodMode]           = useState(false);
  const [proofFiles, setProofFiles]     = useState<File[]>([]);
  const [estDelivery, setEstDelivery]   = useState("");
  const [podNotes, setPodNotes]         = useState("");
  const [submittingPod, setSubmittingPod] = useState(false);
  const [noProof, setNoProof]           = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["agent-queue"],
    queryFn: () => adminApi.claimSessions.getAgentQueue(),
    refetchInterval: 30000,
  });

  const pending:   ClaimSession[] = (data as any)?.data?.pending   || [];
  const mine:      ClaimSession[] = (data as any)?.data?.mine      || [];
  const completed: ClaimSession[] = (data as any)?.data?.completed || [];
  const closedRaw: ClaimSession[] = (data as any)?.data?.closed    || [];

  const allSessions = useMemo<ClaimSession[]>(() => {
    const map = new Map<string, ClaimSession>();
    closedRaw.forEach(s => map.set(s.roomId, s));
    completed.forEach(s => map.set(s.roomId, s));
    mine.forEach(s => map.set(s.roomId, s));
    pending.forEach(s => map.set(s.roomId, s));
    pendingClaims.forEach(pc => {
      if (!map.has(pc.roomId)) {
        map.set(pc.roomId, {
          _id: pc.roomId, roomId: pc.roomId,
          robloxUsername: pc.robloxUsername, contactEmail: pc.contactEmail || "",
          game: pc.game, itemName: pc.itemName, items: pc.items || [],
          status: "pending", messages: [], createdAt: pc.createdAt,
        } as ClaimSession);
      }
    });
    return Array.from(map.values());
  }, [pending, mine, completed, closedRaw, pendingClaims]);

  const getEffStatus = (s: ClaimSession) => liveStatuses.get(s.roomId)?.status || s.status;

  const isMySession = useCallback((s: ClaimSession) =>
    String(s.assignedAgent?.userId) === String(user?.id) ||
    liveStatuses.get(s.roomId)?.agentName === user?.name,
  [user, liveStatuses]);

  // Waiting
  const waitingSessions = useMemo(() =>
    allSessions
      .filter(s => getEffStatus(s) === "pending")
      .sort((a, b) => {
        const au = unread.get(a.roomId) || 0, bu = unread.get(b.roomId) || 0;
        if (au !== bu) return bu - au;
        const aa = lastActivity.get(a.roomId) || 0, ba = lastActivity.get(b.roomId) || 0;
        return ba - aa || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }),
  [allSessions, liveStatuses, unread, lastActivity]);

  // In Progress: only THIS agent's active chats
  const myActiveSessions = useMemo(() =>
    allSessions
      .filter(s => getEffStatus(s) === "active" && isMySession(s))
      .sort((a, b) => {
        const au = unread.get(a.roomId) || 0, bu = unread.get(b.roomId) || 0;
        if (au !== bu) return bu - au;
        const aa = lastActivity.get(a.roomId) || 0, ba = lastActivity.get(b.roomId) || 0;
        return ba - aa;
      }),
  [allSessions, liveStatuses, unread, lastActivity, isMySession]);

  // Completed: only THIS agent's delivered/ended chats
  const myCompletedSessions = useMemo(() =>
    allSessions
      .filter(s => {
        const st = getEffStatus(s);
        return (st === "claimed" || st === "ended") && isMySession(s);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [allSessions, liveStatuses, isMySession]);

  // Closed: only THIS agent's closed chats
  const myClosedSessions = useMemo(() =>
    allSessions
      .filter(s => getEffStatus(s) === "closed" && isMySession(s))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [allSessions, liveStatuses, isMySession]);

  const waitingUnread = waitingSessions.reduce((acc, s) => acc + (unread.get(s.roomId) || 0), 0);
  const activeUnread  = myActiveSessions.reduce((acc, s) => acc + (unread.get(s.roomId) || 0), 0);
  const totalBadge    = waitingSessions.length + waitingUnread + activeUnread;

  const tabSessions: ClaimSession[] =
    activeTab === "waiting"   ? waitingSessions   :
    activeTab === "active"    ? myActiveSessions  :
    activeTab === "completed" ? myCompletedSessions :
    myClosedSessions;

  useEffect(() => { selectedRoomIdRef.current = selectedSession?.roomId ?? null; }, [selectedSession?.roomId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onTaken = ({ roomId, agentName }: { roomId: string; agentName: string }) => {
      setLiveStatuses(p => { const n = new Map(p); n.set(roomId, { status: "active", agentName }); return n; });
      removePendingClaim(roomId);
      refetch();
    };
    const onCompleted = ({ roomId }: { roomId: string }) => {
      setLiveStatuses(p => { const n = new Map(p); n.set(roomId, { status: "claimed", agentName: p.get(roomId)?.agentName }); return n; });
      removePendingClaim(roomId);
      refetch();
      setSelectedSession(s => s?.roomId === roomId ? { ...s, status: "claimed" } : s);
      if (roomId === selectedRoomIdRef.current) setActiveTab("completed");
    };
    const onEnded = ({ roomId }: { roomId: string }) => {
      setLiveStatuses(p => { const n = new Map(p); n.set(roomId, { status: "ended", agentName: p.get(roomId)?.agentName }); return n; });
      removePendingClaim(roomId);
      refetch();
    };
    const onClosed = ({ roomId }: { roomId: string }) => {
      setLiveStatuses(p => { const n = new Map(p); n.set(roomId, { status: "closed", agentName: p.get(roomId)?.agentName }); return n; });
      removePendingClaim(roomId);
      refetch();
      setSelectedSession(s => s?.roomId === roomId ? { ...s, status: "closed" } : s);
      if (roomId === selectedRoomIdRef.current) setActiveTab("closed");
    };
    const onAutoAssigned = ({ roomId, session }: { roomId: string; session: ClaimSession }) => {
      removePendingClaim(roomId);
      refetch();
      setSelectedSession(session);
      setActiveTab("active");
      setMobilePanel(1);
    };
    const onCustomerMsg = ({ roomId, text }: { roomId: string; senderName: string; text: string }) => {
      playPing();
      setLastActivity(p => { const n = new Map(p); n.set(roomId, Date.now()); return n; });
      setLivePreview(p => { const n = new Map(p); n.set(roomId, text.slice(0, 60)); return n; });
      if (roomId !== selectedRoomIdRef.current) {
        setUnread(p => { const n = new Map(p); n.set(roomId, (n.get(roomId) || 0) + 1); return n; });
      }
    };

    socket.on("queue:claim_taken",         onTaken);
    socket.on("queue:claim_completed",     onCompleted);
    socket.on("queue:claim_ended",         onEnded);
    socket.on("queue:claim_closed",        onClosed);
    socket.on("queue:claim_auto_assigned", onAutoAssigned);
    socket.on("queue:customer_message",    onCustomerMsg);

    return () => {
      socket.off("queue:claim_taken",         onTaken);
      socket.off("queue:claim_completed",     onCompleted);
      socket.off("queue:claim_ended",         onEnded);
      socket.off("queue:claim_closed",        onClosed);
      socket.off("queue:claim_auto_assigned", onAutoAssigned);
      socket.off("queue:customer_message",    onCustomerMsg);
    };
  }, [socket, removePendingClaim, refetch]);

  const openSession = useCallback(async (s: ClaimSession) => {
    setMobilePanel(1);
    setUnread(p => { const n = new Map(p); n.delete(s.roomId); return n; });
    selectedRoomIdRef.current = s.roomId;

    setLoadingSession(true);
    try {
      const res = await (adminApi.claimSessions as any).getFullSession(s.roomId);
      const full = res?.data?.session || res?.data;
      setSelectedSession(full || s);
      socket?.emit("claim:agent_browse", { roomId: s.roomId });
    } catch {
      setSelectedSession(s);
      socket?.emit("claim:agent_browse", { roomId: s.roomId });
    } finally {
      setLoadingSession(false);
    }
  }, [socket]);

  const handleSessionClaimed = useCallback((session: ClaimSession) => {
    setSelectedSession(session);
    removePendingClaim(session.roomId);
    refetch();
  }, [removePendingClaim, refetch]);

  const submitPod = async () => {
    if (!selectedSession || (!noProof && proofFiles.length === 0)) return;
    setSubmittingPod(true);
    try {
      if (!noProof && proofFiles.length > 0) {
        const form = new FormData();
        proofFiles.forEach(f => form.append("proofs", f));
        form.append("roomId", selectedSession.roomId);
        if (estDelivery) form.append("estimatedDelivery", estDelivery);
        if (podNotes)    form.append("notes", podNotes);
        await adminApi.proof.submit(form);
      }
      socket?.emit("claim:mark_claimed", { roomId: selectedSession.roomId });
      setPodMode(false);
      setProofFiles([]); setEstDelivery(""); setPodNotes(""); setNoProof(false);
      setActiveTab("completed");
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit proof");
    } finally {
      setSubmittingPod(false);
    }
  };

  const endChat = () => {
    if (!socket || !selectedSession) return;
    if (!confirm("End this chat without marking as completed?")) return;
    socket.emit("claim:end", { roomId: selectedSession.roomId });
    setSelectedSession(s => s ? { ...s, status: "ended" } : s);
    refetch();
  };

  const cancelOrder = async () => {
    if (!selectedSession?.orderRef) {
      alert("No order linked to this session.");
      return;
    }
    if (!confirm("Cancel this order? This will mark it as cancelled and end the chat.")) return;
    try {
      await adminApi.orders.updateStatus(selectedSession.orderRef, "cancelled");
      socket?.emit("claim:end", { roomId: selectedSession.roomId });
      setSelectedSession(s => s ? { ...s, status: "ended" } : s);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to cancel order");
    }
  };

  const confirmCloseChat = () => {
    if (!socket || !closingSession) return;
    socket.emit("claim:close", { roomId: closingSession.roomId });
    setClosingSession(null);
  };

  const selLive             = selectedSession ? liveStatuses.get(selectedSession.roomId) : undefined;
  const selEffStatus        = selLive?.status || selectedSession?.status;
  const isMyActive          = selEffStatus === "active" && !!selectedSession && isMySession(selectedSession);
  const isMyCompletedOrEnded = (selEffStatus === "claimed" || selEffStatus === "ended") && !!selectedSession && isMySession(selectedSession);

  const TABS: { key: Tab; label: string; count: number; badge?: number }[] = [
    { key: "waiting",   label: "Waiting",     count: waitingSessions.length,    badge: waitingUnread || undefined },
    { key: "active",    label: "In Progress",  count: myActiveSessions.length,   badge: activeUnread || undefined },
    { key: "completed", label: "Completed",    count: myCompletedSessions.length },
    { key: "closed",    label: "Closed",       count: myClosedSessions.length },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#060d1a]">

      {/* ══════ LEFT: Inbox ══════ */}
      <div className={cn(
        "flex flex-col flex-shrink-0 border-r border-white/5 bg-[#0a1628] w-full md:w-72",
        mobilePanel !== 0 ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", connected ? "bg-emerald-400" : "bg-red-400")}
                style={{ boxShadow: connected ? "0 0 6px rgba(52,211,153,0.6)" : undefined }} />
              <span className="text-white font-semibold text-sm">Inbox</span>
              {totalBadge > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold">{totalBadge}</span>
              )}
            </div>
            {connected
              ? <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
          </div>
          {user?.claimGames && user.claimGames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {user.claimGames.map(g => (
                <span key={g} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/10">{g}</span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-semibold transition-colors relative",
                activeTab === tab.key
                  ? "text-indigo-400 border-b-2 border-indigo-500"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={cn(
                  "ml-1 text-[9px] px-1 py-0.5 rounded font-bold",
                  activeTab === tab.key ? "bg-indigo-500/20 text-indigo-300" : "bg-white/8 text-slate-500"
                )}>{tab.count}</span>
              )}
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && allSessions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-4 h-4 text-slate-700 animate-spin" />
            </div>
          ) : tabSessions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Inbox className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-600 text-sm font-medium">
                {activeTab === "waiting"   ? "No waiting chats"    :
                 activeTab === "active"    ? "No active chats"     :
                 activeTab === "completed" ? "No completed chats yet" :
                 "No closed chats yet"}
              </p>
              <p className="text-slate-700 text-xs mt-0.5">
                {activeTab === "waiting"   ? "New claims appear here"          :
                 activeTab === "active"    ? "Claim a chat to see it here"     :
                 activeTab === "completed" ? "Chats you complete appear here"  :
                 "Close a completed chat to archive it here"}
              </p>
            </div>
          ) : (
            tabSessions.map(s => {
              const canClose =
                (getEffStatus(s) === "claimed" || getEffStatus(s) === "ended") &&
                isMySession(s);
              return (
                <ConvoItem
                  key={s.roomId} session={s}
                  liveStatus={liveStatuses.get(s.roomId)}
                  selected={selectedSession?.roomId === s.roomId}
                  onClick={() => openSession(s)}
                  unreadCount={unread.get(s.roomId) || 0}
                  livePreview={livePreview.get(s.roomId)}
                  canClose={canClose}
                  onClose={() => setClosingSession(s)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* ══════ CENTER: Chat ══════ */}
      <div className={cn(
        "flex flex-col flex-1 min-w-0 overflow-hidden",
        mobilePanel === 1 ? "flex" : "hidden md:flex"
      )}>
        {loadingSession ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-slate-700 animate-spin" />
          </div>
        ) : selectedSession ? (
          <>
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0 bg-[#0a1628]">
              <button onClick={() => setMobilePanel(0)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0", avatarColor(selectedSession.robloxUsername))}>
                {selectedSession.robloxUsername[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{selectedSession.robloxUsername}</p>
                <p className="text-slate-500 text-[11px] truncate">
                  {[selectedSession.game, getItemLabel(selectedSession)].filter(Boolean).join(" · ") || "Customer"}
                </p>
              </div>
              {selEffStatus === "pending" && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/15 px-2 py-1 rounded-full flex-shrink-0">
                  <AlertCircle className="w-3 h-3" /> Unclaimed
                </span>
              )}
              {isMyActive && (
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setPodMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark as Completed
                  </motion.button>
                  <button
                    onClick={() => setClosingSession(selectedSession)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Close Chat
                  </button>
                </div>
              )}
              <button onClick={() => setShowProfile(p => !p)}
                className={cn("hidden md:flex w-8 h-8 rounded-lg items-center justify-center transition-colors flex-shrink-0",
                  showProfile ? "bg-indigo-600/20 text-indigo-400" : "text-slate-500 hover:text-white hover:bg-white/5")}>
                <User className="w-4 h-4" />
              </button>
              <button onClick={() => setMobilePanel(2)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 flex-shrink-0">
                <User className="w-4 h-4" />
              </button>
            </div>

            {isMyActive && (
              <div className="sm:hidden px-3 py-2 border-b border-white/5 bg-[#0a1628] flex-shrink-0 flex gap-2">
                <button
                  onClick={() => setPodMode(true)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark as Completed
                </button>
                <button
                  onClick={() => setClosingSession(selectedSession)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Close Chat
                </button>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <ChatWindow
                key={selectedSession.roomId}
                session={selectedSession}
                onSessionClaimed={handleSessionClaimed}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/8 border border-indigo-500/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-slate-700" />
            </div>
            <h3 className="text-white font-semibold mb-1">Select a conversation</h3>
            <p className="text-slate-500 text-sm max-w-xs">Choose a chat from the inbox on the left to start helping a customer.</p>
            <div className="mt-6 space-y-3 text-left max-w-xs w-full">
              {([
                ["bg-red-400",     "Waiting — no agent yet, type to claim"],
                ["bg-amber-400",   "In Progress — actively helping a customer"],
                ["bg-emerald-400", "Completed — order delivery confirmed"],
                ["bg-purple-400",  "Closed — archived by you, read-only"],
              ] as const).map(([color, label]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", color)} />
                  <p className="text-slate-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════ RIGHT: Profile Panel ══════ */}
      <AnimatePresence>
        {selectedSession && (showProfile || mobilePanel === 2) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: undefined, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={cn("flex-shrink-0 overflow-hidden", mobilePanel === 2 ? "flex w-full md:w-72" : "hidden md:flex md:w-72")}
          >
            <div className="w-full">
              <ProfilePanel
                session={selectedSession} liveStatus={selLive}
                isMyActiveSession={isMyActive}
                isMyCompletedSession={isMyCompletedOrEnded}
                onClose={() => { setShowProfile(false); setMobilePanel(1); }}
                onDeliver={() => setPodMode(true)}
                onEnd={endChat}
                onCloseChat={() => setClosingSession(selectedSession)}
                onCancel={cancelOrder}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mobilePanel === 2 && (
        <button onClick={() => setMobilePanel(1)}
          className="md:hidden fixed top-[72px] left-3 z-30 w-8 h-8 bg-[#0a1628] border border-white/10 rounded-lg flex items-center justify-center text-slate-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      {/* ══════ POD Modal ══════ */}
      <AnimatePresence>
        {podMode && selectedSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">Proof of Delivery</h3>
                <p className="text-slate-400 text-xs mt-0.5">Submit proof before marking as completed</p>
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
                            <button type="button" onClick={() => setProofFiles(p => p.filter((_, j) => j !== i))}
                              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
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
                        setProofFiles(p => {
                          const combined = [...p, ...newFiles];
                          return combined.slice(0, 5);
                        });
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
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Est. Delivery Time</label>
                  <input value={estDelivery} onChange={e => setEstDelivery(e.target.value)} placeholder="e.g. 5 minutes"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Notes</label>
                  <textarea value={podNotes} onChange={e => setPodNotes(e.target.value)} placeholder="Optional notes…" rows={2}
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 resize-none" />
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
                  {submittingPod
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Submitting…</>
                    : <><CheckCircle className="w-3.5 h-3.5" />Mark as Completed</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ Close Chat Confirmation Modal ══════ */}
      <AnimatePresence>
        {closingSession && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setClosingSession(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Archive className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1">Close this chat?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  This will archive the chat with{" "}
                  <span className="text-white font-medium">{closingSession.robloxUsername}</span>.
                  It'll move to your Closed tab — you can still read it, but no further messages can be sent.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => setClosingSession(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCloseChat}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Close Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
