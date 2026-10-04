import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, User, Gamepad2, Clock, Package, Mail, RefreshCw,
  ChevronRight, AlertCircle, ArrowLeft, ChevronDown, Hash, X,
  Send, Lock, Archive, Trash2, Info,
} from "lucide-react";
import { adminApi } from "../api";
import { useAdminSocket } from "../context/AdminSocketContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { cn } from "@/lib/utils";
import type { ClaimSession, ClaimMessage } from "../types";
import { ThreadPanel, ThreadBadge, ThreadMeta } from "../components/ChatThread";
import type { ThreadMessage } from "../components/ChatThread";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; dotPulse?: boolean; label: string }> = {
  pending: { bg: "bg-[var(--pn-critical-bg)]",     text: "text-[var(--pn-critical-text)]",     dot: "bg-[var(--pn-critical)]",     label: "Unclaimed"    },
  active:  { bg: "bg-[var(--pn-success-bg)]", text: "text-[var(--pn-success-fg)]", dot: "bg-[var(--pn-success-fg)]", dotPulse: true, label: "In Progress" },
  claimed: { bg: "bg-[var(--pn-warning-bg)]",  text: "text-[var(--pn-warning-fg)]",  dot: "bg-[var(--pn-warning)]",  label: "Claimed"      },
  ended:   { bg: "bg-[var(--pn-surface-2)]",   text: "text-[var(--pn-text-3)]",   dot: "bg-[var(--pn-neutral-bg)]",   label: "Ended"        },
  closed:  { bg: "bg-[var(--pn-action-tint)]",  text: "text-[var(--pn-action)]",  dot: "bg-[var(--pn-action)]",  label: "Closed"       },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
}

function StatusBadge({ status, agentName }: { status: string; agentName?: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ended;
  const label = status === "active" && agentName ? `In Progress · ${agentName}` : cfg.label;
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1", cfg.bg, cfg.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full inline-block flex-shrink-0", cfg.dot, cfg.dotPulse ? "animate-pulse" : "")} />
      {label}
    </span>
  );
}

interface SessionRowProps {
  session: ClaimSession;
  selected: boolean;
  onClick: () => void;
  liveStatus?: ClaimSession["status"];
}

function SessionRow({ session, selected, onClick, liveStatus }: SessionRowProps) {
  const status = liveStatus || session.status;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ended;
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 border-b border-[var(--pn-border)] transition-colors flex items-start gap-3",
        selected ? "bg-[var(--pn-action-tint)] border-l-2 border-l-blue-500" : "hover:bg-[var(--pn-surface-2)]"
      )}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-full bg-[var(--pn-action)] border border-[var(--pn-action-border)] flex items-center justify-center">
          <User className="w-4 h-4 text-[var(--pn-action)]" />
        </div>
        <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--pn-surface)]", cfg.dot, cfg.dotPulse ? "animate-pulse" : "")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[var(--pn-text)] text-sm font-medium truncate">{session.robloxUsername}</p>
          <span className="text-[var(--pn-text-2)] text-[10px] flex-shrink-0">{timeAgo(session.createdAt)}</span>
        </div>
        {session.orderRef && (
          <p className="text-[var(--pn-text-2)] text-xs truncate">#{session.orderRef.slice(-6)}</p>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <StatusBadge status={status} agentName={session.assignedAgent?.name} />
          {selected && <ChevronRight className="w-3.5 h-3.5 text-[var(--pn-action)]" />}
        </div>
      </div>
    </motion.button>
  );
}

// ── Shared order profile panel (same layout as agent queue) ───────────────────
function OrderProfilePanel({
  session,
  onClose,
  onCloseChat,
  onDeleteSession,
  isOwner,
}: {
  session: ClaimSession;
  onClose: () => void;
  onCloseChat?: () => void;
  onDeleteSession?: () => void;
  isOwner?: boolean;
}) {
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (!session.orderRef) { setOrderData(null); return; }
    adminApi.orders.getByRef(session.orderRef)
      .then((res: any) => setOrderData(res?.data || null))
      .catch(() => setOrderData(null));
  }, [session.orderRef]);

  const displayItems: { name: string; qty: number; price?: number; imageUrl?: string; gradient?: { from: string; to: string } }[] =
    orderData?.items?.length
      ? orderData.items.map((i: any) => ({
          name: i.productSnapshot?.name || i.product?.name || i.name,
          qty: i.quantity,
          price: i.unitPrice,
          imageUrl: i.product?.imageUrl,
          gradient: i.productSnapshot?.gradient || i.product?.gradient,
        }))
      : (session.items || []).map(i => ({ name: i.name, qty: i.quantity }));

  const infoRows = [
    session.contactEmail && { icon: Mail,    label: "Email",   value: session.contactEmail },
    session.game         && { icon: Gamepad2, label: "Game",    value: session.game },
    session.orderRef     && { icon: Hash,     label: "Order",   value: `#${session.orderRef.slice(-8)}` },
    { icon: Clock, label: "Started", value: timeAgo(session.createdAt) },
    session.assignedAgent && { icon: User, label: "Agent", value: session.assignedAgent.name },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  return (
    <div className="flex flex-col h-full bg-[var(--pn-surface)] border-l border-[var(--pn-border)] overflow-y-auto w-72 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--pn-border)] flex-shrink-0">
        <p className="text-[var(--pn-text)] text-sm font-semibold">Profile</p>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--pn-text-2)] hover:text-[var(--pn-text)] hover:bg-[var(--pn-surface-2)] transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Avatar + name + status */}
      <div className="px-4 pt-5 pb-4 border-b border-[var(--pn-border)] text-center flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-[var(--pn-action)] flex items-center justify-center text-xl font-bold text-white mx-auto mb-3">
          {session.robloxUsername[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="text-[var(--pn-text)] font-semibold text-sm">{session.robloxUsername}</p>
        <p className="text-[var(--pn-text-2)] text-xs mt-0.5">Customer</p>
        <div className="flex items-center justify-center mt-2">
          <StatusBadge status={session.status} agentName={session.assignedAgent?.name} />
        </div>
      </div>

      {/* Info rows */}
      <div className="px-4 py-4 space-y-3 border-b border-[var(--pn-border)] flex-shrink-0">
        {infoRows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className="w-3.5 h-3.5 text-[var(--pn-text-2)] flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[var(--pn-text-2)] text-[10px] mb-0.5">{label}</p>
              <p className="text-[var(--pn-text-3)] text-xs break-all">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Product grid */}
      {displayItems.length > 0 && (
        <div className="px-4 py-4 border-b border-[var(--pn-border)] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--pn-text-2)] text-[10px] font-semibold uppercase tracking-wider">Order Items</p>
            {orderData?.pricing?.total != null && (
              <span className="text-[var(--pn-success-fg)] text-xs font-semibold">${(orderData.pricing?.total ?? 0).toFixed(2)}</span>
            )}
          </div>
          {orderData?.status && (
            <div className="mb-3 flex items-center gap-2">
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
          <div className="grid grid-cols-2 gap-2">
            {displayItems.map((item, i) => (
              <div key={i} className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl overflow-hidden flex flex-col">
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
        </div>
      )}

      {/* Admin actions */}
      {(onCloseChat || (isOwner && onDeleteSession)) && (
        <div className="px-4 py-4 space-y-2 flex-shrink-0">
          {onCloseChat && !["closed"].includes(session.status) && (
            <button
              onClick={onCloseChat}
              className="w-full py-2.5 bg-[var(--pn-action-tint)] hover:bg-[var(--pn-action-tint)] text-[var(--pn-action)] hover:text-[var(--pn-action)] border border-[var(--pn-action-border)] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Close Chat
            </button>
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

// ── ChatPane ─────────────────────────────────────────────────────────────────
interface ChatPaneProps {
  session: ClaimSession;
  messages: ClaimMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
  isClosed: boolean;
}

function ChatPane({ session, messages, loading, onSend, onClose, isClosed }: ChatPaneProps) {
  const [text, setText] = useState("");
  const { socket } = useAdminSocket();
  const { profile, user } = useAdminAuth();
  const isReadOnly = isClosed || session.status === "closed";

  // Clear the draft when switching conversations.
  useEffect(() => {
    setText("");
  }, [session.roomId]);

  // Tell the customer we're typing (best effort — never blocks sending).
  const notifyTyping = () => {
    if (!socket) return;
    socket.emit("claim:typing", {
      roomId: session.roomId,
      senderName: profile?.displayName || user?.email || "Support",
    });
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isReadOnly) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div
      className="flex flex-col h-full min-h-0 rounded-xl border overflow-hidden"
      style={{ background: "var(--pn-surface)", borderColor: "var(--pn-border)" }}
    >
      <ThreadPanel
        messages={loading ? [] : (messages as unknown as ThreadMessage[])}
        draft={text}
        onDraftChange={(v) => { setText(v); notifyTyping(); }}
        onSend={handleSend}
        sendLabel="Send Reply"
        placeholder={loading ? "Loading messages…" : "Type a message as admin…"}
        readOnly={isReadOnly}
        readOnlyNote={session.status === "closed" ? "Chat closed" : "This session has ended"}
        emptyLabel="No messages yet"
        meta={
          <>
            <ThreadBadge
              label={session.status}
              bg={session.status === "active" ? "var(--pn-success-bg)" : "var(--pn-warning-bg)"}
              fg={session.status === "active" ? "var(--pn-success-fg)" : "var(--pn-warning-fg)"}
            />
            <ThreadMeta>{session.robloxUsername}</ThreadMeta>
            <ThreadMeta>{session.contactEmail}</ThreadMeta>
            {session.game && <ThreadMeta>{session.game}</ThreadMeta>}
            {session.orderRef && <ThreadMeta>{session.orderRef}</ThreadMeta>}
          </>
        }
      />
    </div>
  );
}
function GameGroup({
  game, sessions, selectedRoomId, liveStatusMap, onSelect,
}: {
  game: string; sessions: ClaimSession[]; selectedRoomId: string | null;
  liveStatusMap: Map<string, string>; onSelect: (roomId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const unclaimedCount = sessions.filter(s => s.status === "pending").length;
  const activeCount = sessions.filter(s => s.status === "active").length;

  return (
    <div className="mb-1">
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--pn-surface-2)] transition-colors group"
        style={{ borderBottom: "1px solid var(--pn-border)" }}
      >
        <Gamepad2 className="w-3.5 h-3.5 text-[var(--pn-text-2)] flex-shrink-0" />
        <span className="text-xs font-bold text-[var(--pn-text-3)] flex-1 text-left truncate">{game}</span>
        <div className="flex items-center gap-1.5">
          {unclaimedCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[var(--pn-critical-bg)] text-[var(--pn-critical-text)]">{unclaimedCount} unclaimed</span>
          )}
          {activeCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[var(--pn-success-bg)] text-[var(--pn-success-fg)]">{activeCount} active</span>
          )}
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-[var(--pn-text-2)] transition-transform flex-shrink-0", collapsed ? "" : "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden"
          >
            {sessions.map(session => (
              <SessionRow
                key={session.roomId} session={session}
                selected={selectedRoomId === session.roomId}
                onClick={() => onSelect(session.roomId)}
                liveStatus={liveStatusMap.get(session.roomId) as ClaimSession["status"] | undefined}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OpenChats() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const [liveMessages, setLiveMessages] = useState<Map<string, ClaimMessage[]>>(new Map());
  const [sessionStatusMap, setSessionStatusMap] = useState<Map<string, ClaimSession["status"]>>(new Map());
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const { socket, activeClaims } = useAdminSocket();
  const { user, profile } = useAdminAuth();
  const queryClient = useQueryClient();

  const { data: listData, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ["panel-open-chats"],
    queryFn: () => adminApi.claimSessions.active(),
    refetchInterval: 10000,
  });

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["panel-claim-session", selectedRoomId],
    queryFn: () => adminApi.claimSessions.getSession(selectedRoomId!),
    enabled: !!selectedRoomId,
    refetchInterval: 30000,
  });

  const sessions: ClaimSession[] = listData?.data.sessions || [];
  const liveStatusMap = new Map([
    ...activeClaims.map((c) => [c.roomId, c.status] as [string, string]),
    ...Array.from(sessionStatusMap.entries()).map(([k, v]) => [k, v] as [string, string]),
  ]);

  const sortedSessions = [...sessions].sort((a, b) => {
    const order = { pending: 0, active: 1, claimed: 2, ended: 3, closed: 4 };
    const aPri = order[a.status as keyof typeof order] ?? 3;
    const bPri = order[b.status as keyof typeof order] ?? 3;
    if (aPri !== bPri) return aPri - bPri;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const gameGroups = sortedSessions.reduce<Record<string, ClaimSession[]>>((acc, s) => {
    const key = s.game || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const selectedSession = sortedSessions.find((s) => s.roomId === selectedRoomId);

  // Merge API messages with live socket messages
  const apiMessages: ClaimMessage[] = sessionData?.data?.messages || selectedSession?.messages || [];
  const socketMessages = liveMessages.get(selectedRoomId || "") || [];
  const messages: ClaimMessage[] = (() => {
    const all = [...apiMessages];
    const existingIds = new Set(all.map(m => m._id).filter(Boolean));
    for (const m of socketMessages) {
      if (!m._id || !existingIds.has(m._id)) {
        all.push(m);
        if (m._id) existingIds.add(m._id);
      }
    }
    return all;
  })();

  const pendingCount = sessions.filter(s => s.status === "pending").length;
  const activeCount = sessions.filter(s => s.status === "active").length;
  const claimedCount = sessions.filter(s => s.status === "claimed").length;

  // Auto-select first session
  useEffect(() => {
    if (!selectedRoomId && sortedSessions.length > 0) {
      setSelectedRoomId(sortedSessions[0].roomId);
    }
  }, [sessions.length]);

  // Join socket room when session is selected
  useEffect(() => {
    if (!socket || !selectedRoomId) return;
    if (!joinedRoomsRef.current.has(selectedRoomId)) {
      socket.emit("claim:agent_browse", { roomId: selectedRoomId });
      joinedRoomsRef.current.add(selectedRoomId);
    }
  }, [socket, selectedRoomId]);

  // Socket listeners for live message updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: ClaimMessage & { roomId: string }) => {
      const roomId = data.roomId;
      if (!roomId) return;
      setLiveMessages(prev => {
        const existing = prev.get(roomId) || [];
        if (data._id && existing.some(m => m._id === data._id)) return prev;
        const next = new Map(prev);
        next.set(roomId, [...existing, data]);
        return next;
      });
    };

    const handleStatusChange = ({ roomId, status }: { roomId: string; status: string }) => {
      setSessionStatusMap(prev => {
        const next = new Map(prev);
        next.set(roomId, status as ClaimSession["status"]);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["panel-open-chats"] });
    };

    const handleClosed = ({ roomId }: { roomId: string }) => {
      setSessionStatusMap(prev => {
        const next = new Map(prev);
        next.set(roomId, "closed");
        return next;
      });
    };

    const handleDeleted = ({ roomId }: { roomId: string }) => {
      if (roomId === selectedRoomId) setSelectedRoomId(null);
      queryClient.invalidateQueries({ queryKey: ["panel-open-chats"] });
    };

    socket.on("claim:new_message",         handleNewMessage);
    socket.on("admin:claim_status_changed", handleStatusChange);
    socket.on("claim:closed",              ({ message }: any) => {
      // Handled via admin:claim_status_changed mostly, but also listen to direct event
    });
    socket.on("admin:claim_deleted",       handleDeleted);

    return () => {
      socket.off("claim:new_message",          handleNewMessage);
      socket.off("admin:claim_status_changed", handleStatusChange);
      socket.off("admin:claim_deleted",        handleDeleted);
    };
  }, [socket, selectedRoomId, queryClient]);

  const handleSendMessage = useCallback((text: string) => {
    if (!socket || !selectedRoomId) return;
    socket.emit("claim:message", {
      roomId: selectedRoomId,
      text,
      sender: "agent",
      senderName: profile?.displayName || user?.email || "Admin",
    });
  }, [socket, selectedRoomId, profile, user]);

  const handleCloseChat = useCallback((roomId: string) => {
    if (!socket) return;
    socket.emit("claim:close", { roomId });
    setSessionStatusMap(prev => {
      const next = new Map(prev);
      next.set(roomId, "closed");
      return next;
    });
    setConfirmClose(null);
    queryClient.invalidateQueries({ queryKey: ["panel-open-chats"] });
  }, [socket, queryClient]);

  const handleDeleteSession = useCallback(async (roomId: string) => {
    setActionLoading(true);
    try {
      await (adminApi.claimSessions as any).deleteSession(roomId);
      if (selectedRoomId === roomId) setSelectedRoomId(null);
      queryClient.invalidateQueries({ queryKey: ["panel-open-chats"] });
    } catch (err: any) {
      alert(err?.message || "Failed to delete session");
    } finally {
      setActionLoading(false);
      setConfirmDelete(null);
    }
  }, [selectedRoomId, queryClient]);

  const handleSelectSession = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowChatMobile(true);
    // Join the socket room for this session
    if (socket && !joinedRoomsRef.current.has(roomId)) {
      socket.emit("claim:agent_browse", { roomId });
      joinedRoomsRef.current.add(roomId);
    }
  };

  const effStatus = selectedRoomId
    ? (sessionStatusMap.get(selectedRoomId) || selectedSession?.status)
    : undefined;

  const isReadOnlyChat = !effStatus || effStatus === "closed";

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Session List ── */}
      <div className={`${showChatMobile ? "hidden" : "flex"} md:flex flex-col w-full md:w-80 flex-shrink-0 border-r border-[var(--pn-border)] bg-[var(--pn-surface)]`}>
        <div className="px-4 py-4 border-b border-[var(--pn-border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[var(--pn-text)] font-semibold text-sm">Open Chats</h2>
              <p className="text-[var(--pn-text-2)] text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--pn-critical)] inline-block" />
                    <span className="text-[var(--pn-critical-text)] font-medium">{pendingCount} unclaimed</span>
                  </span>
                )}
                {activeCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--pn-success-fg)] animate-pulse inline-block" />
                    <span className="text-[var(--pn-success-fg)] font-medium">{activeCount} in progress</span>
                  </span>
                )}
                {claimedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--pn-warning)] inline-block" />
                    <span className="text-[var(--pn-warning-fg)] font-medium">{claimedCount} claimed</span>
                  </span>
                )}
                {pendingCount === 0 && activeCount === 0 && claimedCount === 0 && "No open chats"}
              </p>
            </div>
            <button
              onClick={() => refetchList()}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--pn-text-2)] hover:text-[var(--pn-text-3)] hover:bg-[var(--pn-surface-2)] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="space-y-px pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3.5 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--pn-surface-2)] animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-[var(--pn-surface-2)] rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-[var(--pn-surface-2)] rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[var(--pn-text-2)] px-6">
              <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm text-center">No open chats right now</p>
            </div>
          ) : (
            Object.entries(gameGroups).map(([game, gameSessions]) => (
              <GameGroup
                key={game} game={game} sessions={gameSessions}
                selectedRoomId={selectedRoomId} liveStatusMap={liveStatusMap}
                onSelect={handleSelectSession}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Center: Chat ── */}
      <div className={`${showChatMobile ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden bg-[var(--pn-surface-2)]`}>
        {!selectedSession ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--pn-text-2)]">
            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Select a chat to view</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSession.roomId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex h-full overflow-hidden"
            >
              {/* Chat area */}
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Mobile back button */}
                <div className="md:hidden flex items-center gap-2 px-3 py-2.5 border-b border-[var(--pn-border)] flex-shrink-0"
                  style={{ background: "var(--pn-surface)" }}>
                  <button onClick={() => setShowChatMobile(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text)] hover:bg-[var(--pn-surface-2)] transition-colors flex-shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[var(--pn-text)] text-sm font-medium truncate">{selectedSession.robloxUsername}</span>
                  <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={effStatus || selectedSession.status} agentName={selectedSession.assignedAgent?.name} />
                    <button onClick={() => setShowProfile(p => !p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--pn-text-2)] hover:text-[var(--pn-text)] hover:bg-[var(--pn-surface-2)] transition-colors">
                      <User className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <ChatPane
                  session={{ ...selectedSession, status: effStatus || selectedSession.status }}
                  messages={messages}
                  loading={sessionLoading}
                  onSend={handleSendMessage}
                  onClose={() => setConfirmClose(selectedSession.roomId)}
                  isClosed={isReadOnlyChat}
                />
              </div>

              {/* Right profile panel */}
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }} animate={{ width: 288, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col overflow-hidden flex-shrink-0"
                  >
                    <OrderProfilePanel
                      session={{ ...selectedSession, status: effStatus || selectedSession.status }}
                      onClose={() => setShowProfile(false)}
                      onCloseChat={isReadOnlyChat ? undefined : () => setConfirmClose(selectedSession.roomId)}
                      onDeleteSession={user?.isOwner ? () => setConfirmDelete(selectedSession.roomId) : undefined}
                      isOwner={user?.isOwner}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle profile button (when panel is hidden) */}
              {!showProfile && (
                <div className="flex flex-col border-l border-[var(--pn-border)] flex-shrink-0">
                  <button onClick={() => setShowProfile(true)}
                    className="m-2 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--pn-text-2)] hover:text-[var(--pn-text)] hover:bg-[var(--pn-surface-2)] transition-colors"
                    title="Show profile">
                    <User className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Confirm Close Chat Modal ── */}
      <AnimatePresence>
        {confirmClose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmClose(null)}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl w-full max-w-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="w-10 h-10 rounded-xl bg-[var(--pn-action-tint)] border border-[var(--pn-action-border)] flex items-center justify-center mb-4">
                  <Archive className="w-5 h-5 text-[var(--pn-action)]" />
                </div>
                <h3 className="text-[var(--pn-text)] font-semibold text-base mb-1">Close this chat?</h3>
                <p className="text-[var(--pn-text-3)] text-sm leading-relaxed">
                  The chat will be marked as closed and no further messages can be sent. Both the customer and agent will be notified.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setConfirmClose(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[var(--pn-text-3)] hover:text-[var(--pn-text)] bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleCloseChat(confirmClose)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--pn-action)] hover:bg-[var(--pn-primary)] transition-colors flex items-center justify-center gap-2">
                  <Archive className="w-3.5 h-3.5" />
                  Close Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Session Modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl w-full max-w-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="w-10 h-10 rounded-xl bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] flex items-center justify-center mb-4">
                  <Trash2 className="w-5 h-5 text-[var(--pn-critical-text)]" />
                </div>
                <h3 className="text-[var(--pn-text)] font-semibold text-base mb-1">Delete this session?</h3>
                <p className="text-[var(--pn-text-3)] text-sm leading-relaxed">
                  This permanently removes the claim session and all its messages. The customer will no longer be able to access it. This cannot be undone.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[var(--pn-text-3)] hover:text-[var(--pn-text)] bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDeleteSession(confirmDelete)} disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--pn-critical)] hover:bg-[var(--pn-critical-text)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {actionLoading ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
