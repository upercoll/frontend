import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, RefreshCw, Inbox, ArrowLeft, Mail,
  Gamepad2, Package, Hash, Clock,
  Wifi, WifiOff, X, AlertCircle, User, MessageSquare, Archive, XCircle, Trash2,
} from "lucide-react";
import { useAdminSocket } from "../../context/AdminSocketContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { adminApi } from "../../api";
import { playClaimSound } from "../../lib/sounds";
import ChatWindow from "../../components/ChatWindow";
import { cn } from "@/lib/utils";
import type { ClaimSession } from "../../types";

// ── helpers ─────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending: { dot: "bg-[var(--pn-critical)]",     pill: "bg-[var(--pn-critical-bg)] text-[var(--pn-critical-text)]",           label: "Waiting",     pulse: true  },
  active:  { dot: "bg-[var(--pn-warning)]",   pill: "bg-[var(--pn-warning-bg)] text-[var(--pn-warning-fg)]",       label: "In Progress", pulse: true  },
  claimed: { dot: "bg-[var(--pn-success-fg)]", pill: "bg-[var(--pn-success-bg)] text-[var(--pn-success-fg)]",   label: "Delivered",   pulse: false },
  ended:   { dot: "bg-[var(--pn-neutral-bg)]",   pill: "bg-[var(--pn-surface-2)] text-[var(--pn-text-2)]",       label: "Ended",       pulse: false },
  closed:  { dot: "bg-[var(--pn-action)]",  pill: "bg-[var(--pn-action-tint)] text-[var(--pn-action)]",     label: "Closed",      pulse: false },
} as const;

type LiveStatus = { status: ClaimSession["status"]; agentName?: string };
type Tab = "waiting" | "active" | "completed" | "closed";

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
  // Identity colours for avatars — deliberately NOT tokens: these are
  // functional (they hash a username to a stable colour), and Shopify's
  // avatar palette is exactly this set.
  const colors = ["bg-[#005bd3]", "bg-[#2c6ecb]", "bg-[#5e35b1]", "bg-[#008060]", "bg-[#b98900]", "bg-[#d72c0d]", "bg-[#5c5f62]"];
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
        "w-full text-left px-3 py-3.5 flex items-start gap-3 border-b border-[var(--pn-border)] transition-colors cursor-pointer relative group",
        selected
          ? "bg-[var(--pn-action-tint)] border-l-2 border-l-indigo-500"
          : hasUnread
          ? "bg-[var(--pn-action-tint)] hover:bg-[var(--pn-action-tint)]"
          : "hover:bg-[var(--pn-surface-2)]"
      )}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white", avatarColor(session.robloxUsername))}>
          {session.robloxUsername[0]?.toUpperCase() ?? "?"}
        </div>
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[2px] border-[var(--pn-surface)]",
          cfg.dot, cfg.pulse ? "animate-pulse" : ""
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={cn("text-xs font-semibold truncate", hasUnread ? "text-[var(--pn-text)]" : "text-[var(--pn-text-3)]")}>
            {session.robloxUsername}
          </p>
          <span className="text-[var(--pn-text-2)] text-[10px] flex-shrink-0">{timeAgo(session.createdAt)}</span>
        </div>
        <p className={cn("text-[11px] truncate leading-relaxed", hasUnread ? "text-[var(--pn-text-3)] font-medium" : "text-[var(--pn-text-2)]")}>
          {preview}
        </p>
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {item && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--pn-action-tint)] text-[var(--pn-action)] border border-[var(--pn-action-border)] truncate max-w-[100px]">{item}</span>
          )}
          {session.game && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] border border-[var(--pn-border)] truncate max-w-[80px]">{session.game}</span>
          )}
          {hasUnread && (
            <span className="ml-auto flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--pn-action)] text-white">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {canClose && (
        <button
          onClick={e => { e.stopPropagation(); onClose?.(e); }}
          title="Close chat"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md flex items-center justify-center text-[var(--pn-text-2)] hover:text-[var(--pn-action)] hover:bg-[var(--pn-action-tint)]"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── ProfilePanel ─────────────────────────────────────────────────────────────
function ProfilePanel({
  session, liveStatus, isMyActiveSession, isMyCompletedSession, onClose, onDeliver, onEnd, onCloseChat, onCancel, onDeleteSession, isOwner,
}: {
  session: ClaimSession; liveStatus?: LiveStatus; isMyActiveSession: boolean; isMyCompletedSession?: boolean;
  onClose: () => void; onDeliver: () => void; onEnd: () => void; onCloseChat?: () => void; onCancel?: () => void;
  onDeleteSession?: () => void; isOwner?: boolean;
}) {
  const effStatus = liveStatus?.status || session.status;
  const effAgent  = liveStatus?.agentName || session.assignedAgent?.name;
  const cfg  = STATUS_CFG[effStatus] || STATUS_CFG.ended;

  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (!session.orderRef) { setOrderData(null); return; }
    adminApi.orders.getByRef(session.orderRef)
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
    <div className="flex flex-col h-full bg-[var(--pn-surface)] border-l border-[var(--pn-border)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--pn-border)] flex-shrink-0">
        <p className="text-[var(--pn-text)] text-sm font-semibold">Profile</p>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--pn-text-2)] hover:text-[var(--pn-text)] hover:bg-[var(--pn-surface-2)] transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Avatar + name + status */}
      <div className="px-4 pt-5 pb-4 border-b border-[var(--pn-border)] text-center flex-shrink-0">
        <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-3", avatarColor(session.robloxUsername))}>
          {session.robloxUsername[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="text-[var(--pn-text)] font-semibold text-sm">{session.robloxUsername}</p>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <span className="text-[var(--pn-text-2)] text-xs">Customer</span>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", cfg.pill)}>
            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1 mb-px", cfg.dot, cfg.pulse ? "animate-pulse" : "")} />
            {effAgent && (effStatus === "active" || effStatus === "claimed") ? `${cfg.label} · ${effAgent}` : cfg.label}
          </span>
        </div>
      </div>

      {/* Info rows */}
      <div className="px-4 py-4 space-y-3 border-b border-[var(--pn-border)] flex-shrink-0">
        {infoRows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className="w-3.5 h-3.5 text-[var(--pn-text-2)] flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[var(--pn-text-2)] text-[10px] leading-none mb-0.5">{label}</p>
              <p className="text-[var(--pn-text-3)] text-xs break-all">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ordered items product grid */}
      {orderItems.length > 0 && (
        <div className="px-4 py-4 border-b border-[var(--pn-border)] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--pn-text-2)] text-[10px] font-semibold uppercase tracking-wider">Order Items</p>
            {orderData?.pricing?.total != null && (
              <span className="text-[var(--pn-success-fg)] text-xs font-semibold">${(orderData.pricing?.total ?? 0).toFixed(2)}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {orderItems.map((item, i) => (
              <div key={i} className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl overflow-hidden flex flex-col">
                {/* Gradient always shown as base; image overlaid on top — matches product card style sitewide */}
                <div
                  className="relative w-full h-16 overflow-hidden flex-shrink-0"
                  style={{
                    background: item.gradient
                      ? `linear-gradient(135deg, ${item.gradient.from} 0%, ${item.gradient.to} 100%)`
                      : "var(--pn-surface)",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(0,0,0,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.1) 1px,transparent 1px)",
                      backgroundSize: "12px 12px",
                    }}
                  />
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[var(--pn-text)] text-[11px] font-medium leading-tight line-clamp-2">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[var(--pn-text-2)] text-[10px]">×{item.qty}</span>
                    {item.price != null && (
                      <span className="text-[var(--pn-success-fg)] text-[10px] font-semibold">${item.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {orderData?.status && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[var(--pn-text-2)] text-[10px]">Order Status:</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium",
                orderData.status === "paid" || orderData.status === "completed"
                  ? "bg-[var(--pn-success-bg)] text-[var(--pn-success-fg)]"
                  : orderData.status === "cancelled"
                  ? "bg-[var(--pn-critical-bg)] text-[var(--pn-critical-text)]"
                  : "bg-[var(--pn-surface-2)] text-[var(--pn-text-2)]"
              )}>{orderData.status}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {(isMyActiveSession || (isOwner && onDeleteSession)) && (
        <div className="px-4 py-4 space-y-2 flex-shrink-0">
          {isMyActiveSession && (
            <>
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={onDeliver}
                className="w-full py-2.5 bg-[var(--pn-success-fg)] hover:bg-[var(--pn-success-fg)] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark as Completed
              </motion.button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="w-full py-2.5 bg-[var(--pn-critical-bg)] hover:bg-[var(--pn-critical-bg)] text-[var(--pn-critical-text)] hover:text-[var(--pn-critical-text)] border border-[var(--pn-critical-line)] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel Order
                </button>
              )}
              {onCloseChat && (
                <button
                  onClick={onCloseChat}
                  className="w-full py-2.5 bg-[var(--pn-action-tint)] hover:bg-[var(--pn-action-tint)] text-[var(--pn-action)] hover:text-[var(--pn-action)] border border-[var(--pn-action-border)] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Close Chat
                </button>
              )}
              <button
                onClick={onEnd}
                className="w-full py-2.5 bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] hover:text-[var(--pn-text)] rounded-xl text-xs font-medium transition-colors"
              >
                End Chat
              </button>
            </>
          )}
          {isOwner && onDeleteSession && (
            <button
              onClick={onDeleteSession}
              className="w-full py-2.5 bg-[var(--pn-critical-bg)] hover:bg-[var(--pn-critical-bg)] text-[var(--pn-critical-text)] hover:text-[var(--pn-critical-text)] border border-[var(--pn-critical-line)] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Session
            </button>
          )}
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

  // Delete confirmation (owner only)
  const [deletingSession, setDeletingSession] = useState<ClaimSession | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      playClaimSound();
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
      await adminApi.orders.updateStatusByRef(selectedSession.orderRef, "cancelled");
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

  const handleDeleteSession = async () => {
    if (!deletingSession) return;
    setDeleting(true);
    try {
      await (adminApi.claimSessions as any).deleteSession(deletingSession.roomId);
      if (selectedSession?.roomId === deletingSession.roomId) setSelectedSession(null);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete session");
    } finally {
      setDeleting(false);
      setDeletingSession(null);
    }
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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[var(--pn-surface-2)]">

      {/* ══════ LEFT: Inbox ══════ */}
      <div className={cn(
        "flex flex-col flex-shrink-0 border-r border-[var(--pn-border)] bg-[var(--pn-surface)] w-full md:w-72",
        mobilePanel !== 0 ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[var(--pn-border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", connected ? "bg-[var(--pn-success-fg)]" : "bg-[var(--pn-critical)]")}
                style={{ boxShadow: connected ? "0 0 6px rgba(52,211,153,0.6)" : undefined }} />
              <span className="text-[var(--pn-text)] font-semibold text-sm">Inbox</span>
              {totalBadge > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--pn-critical-bg)] text-[var(--pn-critical-text)] font-bold">{totalBadge}</span>
              )}
            </div>
            {connected
              ? <Wifi className="w-3.5 h-3.5 text-[var(--pn-success-fg)]" />
              : <WifiOff className="w-3.5 h-3.5 text-[var(--pn-critical-text)]" />}
          </div>
          {user?.claimGames && user.claimGames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {user.claimGames.map(g => (
                <span key={g} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--pn-action-tint)] text-[var(--pn-action)] border border-[var(--pn-action-border)]">{g}</span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--pn-border)] flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-semibold transition-colors relative",
                activeTab === tab.key
                  ? "text-[var(--pn-action)] border-b-2 border-[var(--pn-action-border)]"
                  : "text-[var(--pn-text-2)] hover:text-[var(--pn-text-3)]"
              )}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={cn(
                  "ml-1 text-[9px] px-1 py-0.5 rounded font-bold",
                  activeTab === tab.key ? "bg-[var(--pn-action-tint)] text-[var(--pn-action)]" : "bg-[var(--pn-surface-2)] text-[var(--pn-text-2)]"
                )}>{tab.count}</span>
              )}
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--pn-action)]" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && allSessions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-4 h-4 text-[var(--pn-text)] animate-spin" />
            </div>
          ) : tabSessions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Inbox className="w-8 h-8 text-[var(--pn-text)] mx-auto mb-2" />
              <p className="text-[var(--pn-text-2)] text-sm font-medium">
                {activeTab === "waiting"   ? "No waiting chats"    :
                 activeTab === "active"    ? "No active chats"     :
                 activeTab === "completed" ? "No completed chats yet" :
                 "No closed chats yet"}
              </p>
              <p className="text-[var(--pn-text)] text-xs mt-0.5">
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
            <RefreshCw className="w-5 h-5 text-[var(--pn-text)] animate-spin" />
          </div>
        ) : selectedSession ? (
          <>
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--pn-border)] flex-shrink-0 bg-[var(--pn-surface)]">
              <button onClick={() => setMobilePanel(0)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text)] hover:bg-[var(--pn-surface-2)] flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0", avatarColor(selectedSession.robloxUsername))}>
                {selectedSession.robloxUsername[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--pn-text)] text-sm font-semibold truncate">{selectedSession.robloxUsername}</p>
                <p className="text-[var(--pn-text-2)] text-[11px] truncate">
                  {[selectedSession.game, getItemLabel(selectedSession)].filter(Boolean).join(" · ") || "Customer"}
                </p>
              </div>
              {selEffStatus === "pending" && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--pn-warning-fg)] bg-[var(--pn-warning-bg)] border border-[var(--pn-warning-line)] px-2 py-1 rounded-full flex-shrink-0">
                  <AlertCircle className="w-3 h-3" /> Unclaimed
                </span>
              )}
              {isMyActive && (
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setPodMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-[var(--pn-success-fg)] hover:bg-[var(--pn-success-fg)] transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark as Completed
                  </motion.button>
                  <button
                    onClick={() => setClosingSession(selectedSession)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[var(--pn-action)] hover:text-[var(--pn-action)] bg-[var(--pn-action-tint)] hover:bg-[var(--pn-action-tint)] border border-[var(--pn-action-border)] transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Close Chat
                  </button>
                </div>
              )}
              <button onClick={() => setShowProfile(p => !p)}
                className={cn("hidden md:flex w-8 h-8 rounded-lg items-center justify-center transition-colors flex-shrink-0",
                  showProfile ? "bg-[var(--pn-action-tint)] text-[var(--pn-action)]" : "text-[var(--pn-text-2)] hover:text-[var(--pn-text)] hover:bg-[var(--pn-surface-2)]")}>
                <User className="w-4 h-4" />
              </button>
              <button onClick={() => setMobilePanel(2)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--pn-text-2)] hover:text-[var(--pn-text)] hover:bg-[var(--pn-surface-2)] flex-shrink-0">
                <User className="w-4 h-4" />
              </button>
            </div>

            {isMyActive && (
              <div className="sm:hidden px-3 py-2 border-b border-[var(--pn-border)] bg-[var(--pn-surface)] flex-shrink-0 flex gap-2">
                <button
                  onClick={() => setPodMode(true)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-[var(--pn-success-fg)] hover:bg-[var(--pn-success-fg)] transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark as Completed
                </button>
                <button
                  onClick={() => setClosingSession(selectedSession)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-[var(--pn-action)] hover:text-[var(--pn-action)] bg-[var(--pn-action-tint)] hover:bg-[var(--pn-action-tint)] border border-[var(--pn-action-border)] transition-colors flex items-center justify-center gap-1.5"
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
            <div className="w-16 h-16 rounded-xl bg-[var(--pn-action-tint)] border border-[var(--pn-action-border)] flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-[var(--pn-text)]" />
            </div>
            <h3 className="text-[var(--pn-text)] font-semibold mb-1">Select a conversation</h3>
            <p className="text-[var(--pn-text-2)] text-sm max-w-xs">Choose a chat from the inbox on the left to start helping a customer.</p>
            <div className="mt-6 space-y-3 text-left max-w-xs w-full">
              {([
                ["bg-[var(--pn-critical)]",     "Waiting — no agent yet, type to claim"],
                ["bg-[var(--pn-warning)]",   "In Progress — actively helping a customer"],
                ["bg-[var(--pn-success-fg)]", "Completed — order delivery confirmed"],
                ["bg-[var(--pn-action)]",  "Closed — archived by you, read-only"],
              ] as const).map(([color, label]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", color)} />
                  <p className="text-[var(--pn-text-2)] text-xs">{label}</p>
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
                onDeleteSession={user?.isOwner ? () => setDeletingSession(selectedSession) : undefined}
                isOwner={user?.isOwner}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mobilePanel === 2 && (
        <button onClick={() => setMobilePanel(1)}
          className="md:hidden fixed top-[72px] left-3 z-30 w-8 h-8 bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-lg flex items-center justify-center text-[var(--pn-text-3)]">
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      {/* ══════ POD Modal ══════ */}
      <AnimatePresence>
        {podMode && selectedSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pn-scrim z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-t-2xl sm:rounded-xl w-full sm:max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--pn-border)]">
                <h3 className="text-[var(--pn-text)] font-semibold">Proof of Delivery</h3>
                <p className="text-[var(--pn-text-3)] text-xs mt-0.5">Submit proof before marking as completed</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[var(--pn-text-3)] text-sm font-medium">Screenshots {noProof ? "(skipped)" : `(${proofFiles.length}/5)`}</label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div onClick={() => { setNoProof(v => !v); if (!noProof) setProofFiles([]); }}
                      className={cn("relative w-9 h-5 rounded-full transition-colors flex-shrink-0", noProof ? "bg-[var(--pn-warning)]" : "bg-[var(--pn-surface-2)]")}>
                      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-[var(--pn-surface)] shadow transition-all", noProof ? "left-4" : "left-0.5")} />
                    </div>
                    <span className="text-xs text-[var(--pn-text-3)]">No proof</span>
                  </label>
                </div>
                {!noProof && (
                  <>
                    {proofFiles.length > 0 && (
                      <div className="space-y-1.5">
                        {proofFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 bg-[var(--pn-success-bg)] border border-[var(--pn-success-line)] rounded-lg px-3 py-2">
                            <CheckCircle className="w-3.5 h-3.5 text-[var(--pn-success-fg)] flex-shrink-0" />
                            <p className="text-[var(--pn-success-fg)] text-xs flex-1 truncate">{f.name}</p>
                            <button type="button" onClick={() => setProofFiles(p => p.filter((_, j) => j !== i))}
                              className="text-[var(--pn-text-2)] hover:text-[var(--pn-critical-text)] transition-colors flex-shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {proofFiles.length < 5 && (
                      <div onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors border-[var(--pn-border)] hover:border-[var(--pn-border)]">
                        <p className="text-[var(--pn-text-3)] text-sm">{proofFiles.length === 0 ? "Tap to upload screenshots" : "Add another screenshot"}</p>
                        <p className="text-[var(--pn-text-2)] text-xs mt-0.5">PNG, JPG up to 10MB · max 5 images</p>
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
                  <div className="rounded-xl px-4 py-3 text-xs text-[var(--pn-warning-fg)] flex items-start gap-2 bg-[var(--pn-warning-bg)] border border-[var(--pn-warning-line)]">
                    <span>⚠️</span><span>Skipping proof — delivery will be marked without a screenshot.</span>
                  </div>
                )}
                <div>
                  <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Est. Delivery Time</label>
                  <input value={estDelivery} onChange={e => setEstDelivery(e.target.value)} placeholder="e.g. 5 minutes"
                    className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] placeholder-[var(--pn-text-3)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]" />
                </div>
                <div>
                  <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Notes</label>
                  <textarea value={podNotes} onChange={e => setPodNotes(e.target.value)} placeholder="Optional notes…" rows={2}
                    className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] placeholder-[var(--pn-text-3)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)] resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--pn-border)] flex gap-3">
                <button onClick={() => { setPodMode(false); setProofFiles([]); setNoProof(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[var(--pn-text-3)] hover:text-[var(--pn-text)] bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] transition-colors">
                  Cancel
                </button>
                <button onClick={submitPod} disabled={submittingPod || (!noProof && proofFiles.length === 0)}
                  className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold text-[var(--pn-text)] flex items-center justify-center gap-2 transition-colors",
                    (!noProof && proofFiles.length === 0) || submittingPod ? "bg-[var(--pn-success-fg)]/40 cursor-not-allowed" : "bg-[var(--pn-success-fg)] hover:bg-[var(--pn-success-fg)]")}>
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
            className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4"
            onClick={() => setClosingSession(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-5">
                <div className="w-10 h-10 rounded-xl bg-[var(--pn-action-tint)] border border-[var(--pn-action-border)] flex items-center justify-center mb-4">
                  <Archive className="w-5 h-5 text-[var(--pn-action)]" />
                </div>
                <h3 className="text-[var(--pn-text)] font-semibold text-base mb-1">Close this chat?</h3>
                <p className="text-[var(--pn-text-3)] text-sm leading-relaxed">
                  This will archive the chat with{" "}
                  <span className="text-[var(--pn-text)] font-medium">{closingSession.robloxUsername}</span>.
                  It'll move to your Closed tab — you can still read it, but no further messages can be sent.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => setClosingSession(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[var(--pn-text-3)] hover:text-[var(--pn-text)] bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCloseChat}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--pn-action)] hover:bg-[var(--pn-primary)] transition-colors flex items-center justify-center gap-2"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Close Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Session Modal (owner only) */}
      <AnimatePresence>
        {deletingSession && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4"
            onClick={() => setDeletingSession(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-5">
                <div className="w-10 h-10 rounded-xl bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] flex items-center justify-center mb-4">
                  <Trash2 className="w-5 h-5 text-[var(--pn-critical-text)]" />
                </div>
                <h3 className="text-[var(--pn-text)] font-semibold text-base mb-1">Delete this session?</h3>
                <p className="text-[var(--pn-text-3)] text-sm leading-relaxed">
                  This permanently removes the claim session for{" "}
                  <span className="text-[var(--pn-text)] font-medium">{deletingSession.robloxUsername}</span>{" "}
                  and all its messages. This cannot be undone.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => setDeletingSession(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[var(--pn-text-3)] hover:text-[var(--pn-text)] bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSession}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--pn-critical)] hover:bg-[var(--pn-critical-text)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
