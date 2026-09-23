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

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; dotPulse?: boolean; label: string }> = {
  pending: { bg: "bg-red-500/15",     text: "text-red-400",     dot: "bg-red-400",     label: "Unclaimed"    },
  active:  { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400", dotPulse: true, label: "In Progress" },
  claimed: { bg: "bg-yellow-500/15",  text: "text-yellow-400",  dot: "bg-yellow-400",  label: "Claimed"      },
  ended:   { bg: "bg-slate-500/15",   text: "text-slate-400",   dot: "bg-slate-500",   label: "Ended"        },
  closed:  { bg: "bg-purple-500/15",  text: "text-purple-400",  dot: "bg-purple-400",  label: "Closed"       },
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
        "w-full text-left px-4 py-3.5 border-b border-white/4 transition-colors flex items-start gap-3",
        selected ? "bg-blue-600/10 border-l-2 border-l-blue-500" : "hover:bg-white/3"
      )}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/10 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-400" />
        </div>
        <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a1628]", cfg.dot, cfg.dotPulse ? "animate-pulse" : "")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-white text-sm font-medium truncate">{session.robloxUsername}</p>
          <span className="text-slate-600 text-[10px] flex-shrink-0">{timeAgo(session.createdAt)}</span>
        </div>
        {session.orderRef && (
          <p className="text-slate-600 text-xs truncate">#{session.orderRef.slice(-6)}</p>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <StatusBadge status={status} agentName={session.assignedAgent?.name} />
          {selected && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
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
    <div className="flex flex-col h-full bg-[#0a1628] border-l border-white/5 overflow-y-auto w-72 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 flex-shrink-0">
        <p className="text-white text-sm font-semibold">Profile</p>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Avatar + name + status */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5 text-center flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white mx-auto mb-3">
          {session.robloxUsername[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="text-white font-semibold text-sm">{session.robloxUsername}</p>
        <p className="text-slate-500 text-xs mt-0.5">Customer</p>
        <div className="flex items-center justify-center mt-2">
          <StatusBadge status={session.status} agentName={session.assignedAgent?.name} />
        </div>
      </div>

      {/* Info rows */}
      <div className="px-4 py-4 space-y-3 border-b border-white/5 flex-shrink-0">
        {infoRows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-slate-600 text-[10px] mb-0.5">{label}</p>
              <p className="text-slate-300 text-xs break-all">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Product grid */}
      {displayItems.length > 0 && (
        <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Order Items</p>
            {orderData?.pricing?.total != null && (
              <span className="text-emerald-400 text-xs font-semibold">${orderData.pricing.total.toFixed(2)}</span>
            )}
          </div>
          {orderData?.status && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-slate-600 text-[10px]">Order Status:</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium",
                orderData.status === "paid" || orderData.status === "completed"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : orderData.status === "cancelled"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-slate-500/15 text-slate-400"
              )}>{orderData.status}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {displayItems.map((item, i) => (
              <div key={i} className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden flex flex-col">
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
        </div>
      )}

      {/* Admin actions */}
      {(onCloseChat || (isOwner && onDeleteSession)) && (
        <div className="px-4 py-4 space-y-2 flex-shrink-0">
          {onCloseChat && !["closed"].includes(session.status) && (
            <button
              onClick={onCloseChat}
              className="w-full py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Close Chat
            </button>
          )}
          {isOwner && onDeleteSession && (
            <button
              onClick={onDeleteSession}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { socket } = useAdminSocket();
  const { profile, user } = useAdminAuth();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isReadOnly = isClosed || session.status === "closed";

  useEffect(() => {
    setText("");
  }, [session.roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  useEffect(() => {
    if (!socket) return;
    const handleTyping = ({ roomId }: { roomId?: string }) => {
      if (roomId && roomId !== session.roomId) return;
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2500);
    };
    socket.on("claim:typing", handleTyping);
    return () => { socket.off("claim:typing", handleTyping); };
  }, [socket, session.roomId]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isReadOnly || !socket) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "40px";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (socket && text.trim()) {
      socket.emit("claim:typing", { roomId: session.roomId, senderName: profile?.displayName || "Admin" });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = "40px";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-4 md:px-5 py-3 border-b border-white/5 flex-shrink-0 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-sm">{session.robloxUsername}</h3>
            <StatusBadge status={session.status} agentName={session.assignedAgent?.name} />
          </div>
          <p className="text-slate-600 text-xs mt-0.5 truncate">
            {[session.contactEmail, session.game].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isReadOnly && (
            <button
              onClick={onClose}
              title="Close chat"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-slate-600 text-[10px] flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" />
              {formatTime(session.createdAt)}
            </p>
            {session.assignedAgent && (
              <p className="text-slate-500 text-[10px] mt-0.5">Agent: {session.assignedAgent.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status banners */}
      {session.status === "pending" && (
        <div className="px-4 md:px-5 py-2.5 flex items-center gap-2 bg-red-500/8 border-b border-red-500/15 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-xs font-medium">Unclaimed — no agent has answered this chat yet</p>
        </div>
      )}
      {session.status === "closed" && (
        <div className="px-4 md:px-5 py-2.5 flex items-center gap-2 bg-purple-500/8 border-b border-purple-500/15 flex-shrink-0">
          <Lock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <p className="text-purple-400 text-xs font-medium">Chat is closed — read-only view</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-600">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.sender === "system") {
              return (
                <div key={msg._id || idx} className="flex justify-center">
                  <span className="text-[11px] text-slate-500 bg-white/4 border border-white/5 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    {msg.text}
                  </span>
                </div>
              );
            }
            const isAgent = msg.sender === "agent";
            return (
              <div key={msg._id || idx} className={cn("flex items-end gap-2", isAgent ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                  isAgent ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                )}>
                  {(msg.senderName || (isAgent ? "A" : "C"))[0].toUpperCase()}
                </div>
                <div className={cn("max-w-[75%]", isAgent ? "items-end" : "items-start", "flex flex-col gap-1")}>
                  <span className={cn("text-[10px] font-medium", isAgent ? "text-purple-400 text-right" : "text-blue-400")}>
                    {msg.senderName}
                  </span>
                  <div className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                    isAgent
                      ? "bg-purple-600/20 text-purple-100 border border-purple-500/15 rounded-tr-sm"
                      : "bg-blue-600/15 text-slate-200 border border-blue-500/10 rounded-tl-sm"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-600">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 flex-shrink-0">C</div>
            <div className="flex gap-1 bg-blue-600/15 border border-blue-500/10 px-3 py-2.5 rounded-2xl rounded-tl-sm">
              {[0, 1, 2].map(i => (
                <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isReadOnly ? (
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message as admin…"
              rows={1}
              className="flex-1 bg-[#0d1f3c] border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ minHeight: 40, maxHeight: 120 }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!text.trim()}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-white/5 text-center flex-shrink-0">
          <p className="text-slate-600 text-xs flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-purple-400/50" />
            {session.status === "closed" ? "Chat closed" : "This session has ended"}
          </p>
        </div>
      )}
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
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/3 transition-colors group"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <Gamepad2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-300 flex-1 text-left truncate">{game}</span>
        <div className="flex items-center gap-1.5">
          {unclaimedCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-500/15 text-red-400">{unclaimedCount} unclaimed</span>
          )}
          {activeCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400">{activeCount} active</span>
          )}
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-600 transition-transform flex-shrink-0", collapsed ? "" : "rotate-180")} />
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
      <div className={`${showChatMobile ? "hidden" : "flex"} md:flex flex-col w-full md:w-80 flex-shrink-0 border-r border-white/5 bg-[#0a1628]`}>
        <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-sm">Open Chats</h2>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                    <span className="text-red-400 font-medium">{pendingCount} unclaimed</span>
                  </span>
                )}
                {activeCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    <span className="text-emerald-400 font-medium">{activeCount} in progress</span>
                  </span>
                )}
                {claimedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                    <span className="text-yellow-400 font-medium">{claimedCount} claimed</span>
                  </span>
                )}
                {pendingCount === 0 && activeCount === 0 && claimedCount === 0 && "No open chats"}
              </p>
            </div>
            <button
              onClick={() => refetchList()}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
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
                  <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-white/5 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600 px-6">
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
      <div className={`${showChatMobile ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden bg-[#060d1a]`}>
        {!selectedSession ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
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
                <div className="md:hidden flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0"
                  style={{ background: "rgba(6,9,28,0.8)" }}>
                  <button onClick={() => setShowChatMobile(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-white text-sm font-medium truncate">{selectedSession.robloxUsername}</span>
                  <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={effStatus || selectedSession.status} agentName={selectedSession.assignedAgent?.name} />
                    <button onClick={() => setShowProfile(p => !p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
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
                <div className="flex flex-col border-l border-white/5 flex-shrink-0">
                  <button onClick={() => setShowProfile(true)}
                    className="m-2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
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
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmClose(null)}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Archive className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1">Close this chat?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The chat will be marked as closed and no further messages can be sent. Both the customer and agent will be notified.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setConfirmClose(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleCloseChat(confirmClose)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
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
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1">Delete this session?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  This permanently removes the claim session and all its messages. The customer will no longer be able to access it. This cannot be undone.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDeleteSession(confirmDelete)} disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
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
