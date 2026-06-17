import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, User, Gamepad2, Clock, Package, Mail, RefreshCw,
  ChevronRight, AlertCircle, ArrowLeft, ChevronDown,
} from "lucide-react";
import { adminApi } from "../api";
import { useAdminSocket } from "../context/AdminSocketContext";
import { cn } from "@/lib/utils";
import type { ClaimSession, ClaimMessage } from "../types";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; dotPulse?: boolean; label: string }> = {
  pending: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    dot: "bg-red-400",
    label: "Unclaimed",
  },
  active: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    dotPulse: true,
    label: "In Progress",
  },
  claimed: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
    label: "Claimed",
  },
  ended: {
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    dot: "bg-slate-500",
    label: "Ended",
  },
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
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface SessionRowProps {
  session: ClaimSession;
  selected: boolean;
  onClick: () => void;
  liveStatus?: ClaimSession["status"];
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

interface ChatPaneProps {
  session: ClaimSession;
  messages: ClaimMessage[];
  loading: boolean;
}

function ChatPane({ session, messages, loading }: ChatPaneProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-5 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-semibold text-base">{session.robloxUsername}</h3>
              <StatusBadge status={session.status} agentName={session.assignedAgent?.name} />
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-slate-500 text-xs">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[180px]">{session.contactEmail}</span>
              </span>
              {session.game && (
                <span className="flex items-center gap-1 text-slate-500 text-xs">
                  <Gamepad2 className="w-3 h-3" />
                  {session.game}
                </span>
              )}
              {session.orderRef && (
                <span className="text-slate-500 text-xs">Order #{session.orderRef}</span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-slate-500 text-xs flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" />
              {formatTime(session.createdAt)}
            </p>
            {session.assignedAgent && (
              <p className="text-slate-400 text-[11px] mt-0.5 font-medium">Agent: {session.assignedAgent.name}</p>
            )}
          </div>
        </div>
        {session.items?.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Package className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            {session.items.map((item, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

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
          <>
            {messages.map((msg) => {
              if (msg.sender === "system") {
                return (
                  <div key={msg._id} className="flex justify-center">
                    <span className="text-[11px] text-slate-600 bg-white/4 border border-white/5 px-3 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                );
              }
              const isAgent = msg.sender === "agent";
              return (
                <div key={msg._id} className={cn("flex items-end gap-2", isAgent ? "flex-row-reverse" : "flex-row")}>
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
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function GameGroup({
  game,
  sessions,
  selectedRoomId,
  liveStatusMap,
  onSelect,
}: {
  game: string;
  sessions: ClaimSession[];
  selectedRoomId: string | null;
  liveStatusMap: Map<string, string>;
  onSelect: (roomId: string) => void;
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
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-500/15 text-red-400">
              {unclaimedCount} unclaimed
            </span>
          )}
          {activeCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400">
              {activeCount} active
            </span>
          )}
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-600 transition-transform flex-shrink-0", collapsed ? "" : "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {sessions.map(session => (
              <SessionRow
                key={session.roomId}
                session={session}
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
  const { activeClaims } = useAdminSocket();

  const { data: listData, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ["panel-open-chats"],
    queryFn: () => adminApi.claimSessions.active(),
    refetchInterval: 10000,
  });

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["panel-claim-session", selectedRoomId],
    queryFn: () => adminApi.claimSessions.getSession(selectedRoomId!),
    enabled: !!selectedRoomId,
    refetchInterval: 5000,
  });

  const sessions: ClaimSession[] = listData?.data.sessions || [];
  const liveStatusMap = new Map(activeClaims.map((c) => [c.roomId, c.status]));

  const sortedSessions = [...sessions].sort((a, b) => {
    const order = { pending: 0, active: 1, claimed: 2, ended: 3 };
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
  const messages: ClaimMessage[] = sessionData?.data.messages || [];

  const pendingCount = sessions.filter(s => s.status === "pending").length;
  const activeCount = sessions.filter(s => s.status === "active").length;
  const claimedCount = sessions.filter(s => s.status === "claimed").length;

  useEffect(() => {
    if (!selectedRoomId && sortedSessions.length > 0) {
      setSelectedRoomId(sortedSessions[0].roomId);
    }
  }, [sessions.length]);

  const handleSelectSession = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowChatMobile(true);
  };

  return (
    <div className="flex h-full overflow-hidden">
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
                key={game}
                game={game}
                sessions={gameSessions}
                selectedRoomId={selectedRoomId}
                liveStatusMap={liveStatusMap}
                onSelect={handleSelectSession}
              />
            ))
          )}
        </div>
      </div>

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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col h-full"
            >
              <div className="md:hidden flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0"
                style={{ background: "rgba(6,9,28,0.8)" }}>
                <button
                  onClick={() => setShowChatMobile(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-white text-sm font-medium truncate">{selectedSession.robloxUsername}</span>
                <div className="ml-auto flex-shrink-0">
                  <StatusBadge status={selectedSession.status} agentName={selectedSession.assignedAgent?.name} />
                </div>
              </div>

              {selectedSession.status === "pending" && (
                <div className="px-4 md:px-5 py-2.5 flex items-center gap-2 bg-red-500/8 border-b border-red-500/15 flex-shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-medium">Unclaimed — no agent has answered this chat yet</p>
                </div>
              )}
              <ChatPane
                session={selectedSession}
                messages={messages}
                loading={sessionLoading}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
