import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, User, Gamepad2, Clock, Package, Mail, RefreshCw, ChevronRight, AlertCircle } from "lucide-react";
import { adminApi } from "../api";
import { useAdminSocket } from "../context/AdminSocketContext";
import { cn } from "@/lib/utils";
import type { ClaimSession, ClaimMessage } from "../types";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  active: "bg-emerald-500/15 text-emerald-400",
  claimed: "bg-blue-500/15 text-blue-400",
  ended: "bg-slate-500/15 text-slate-400",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-400",
  active: "bg-emerald-400 animate-pulse",
  claimed: "bg-blue-400",
  ended: "bg-slate-500",
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
  liveStatus?: "pending" | "active" | "claimed" | "ended";
}

function SessionRow({ session, selected, onClick, liveStatus }: SessionRowProps) {
  const status = liveStatus || session.status;
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
        <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a1628]", STATUS_DOT[status])} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-white text-sm font-medium truncate">{session.robloxUsername}</p>
          <span className="text-slate-600 text-[10px] flex-shrink-0">{timeAgo(session.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {session.game && (
            <span className="flex items-center gap-1 text-slate-500 text-xs">
              <Gamepad2 className="w-3 h-3" />
              {session.game}
            </span>
          )}
          {session.game && session.orderRef && <span className="text-slate-700 text-xs">·</span>}
          {session.orderRef && (
            <span className="text-slate-600 text-xs truncate">#{session.orderRef.slice(-6)}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1", STATUS_COLOR[status])}>
            <span className={cn("w-1.5 h-1.5 rounded-full inline-block", STATUS_DOT[status].replace("animate-pulse", ""))} />
            {status === "active" ? (session.assignedAgent?.name ? `Active — ${session.assignedAgent.name}` : "Active") :
             status === "pending" ? "Waiting" :
             status === "claimed" ? "Claimed" : "Ended"}
          </span>
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
      <div className="px-5 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-base">{session.robloxUsername}</h3>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLOR[session.status])}>
                {session.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-slate-500 text-xs">
                <Mail className="w-3 h-3" />
                {session.contactEmail}
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
              <p className="text-slate-600 text-[10px] mt-0.5">Agent: {session.assignedAgent.name}</p>
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

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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
                  <div className={cn("max-w-[70%]", isAgent ? "items-end" : "items-start", "flex flex-col gap-1")}>
                    <span className={cn("text-[10px] font-medium", isAgent ? "text-purple-400 text-right" : "text-blue-400")}>
                      {msg.senderName}
                    </span>
                    <div className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
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

export default function OpenChats() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
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
    const aPriority = a.status === "pending" ? 0 : a.status === "active" ? 1 : 2;
    const bPriority = b.status === "pending" ? 0 : b.status === "active" ? 1 : 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const selectedSession = sortedSessions.find((s) => s.roomId === selectedRoomId);
  const messages: ClaimMessage[] = sessionData?.data.messages || [];

  const pendingCount = sessions.filter((s) => s.status === "pending").length;
  const activeCount = sessions.filter((s) => s.status === "active").length;

  useEffect(() => {
    if (!selectedRoomId && sortedSessions.length > 0) {
      setSelectedRoomId(sortedSessions[0].roomId);
    }
  }, [sessions.length]);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/5 bg-[#0a1628]">
        <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-sm">Open Chats</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {pendingCount > 0 && <span className="text-yellow-400 font-medium">{pendingCount} waiting</span>}
                {pendingCount > 0 && activeCount > 0 && " · "}
                {activeCount > 0 && <span className="text-emerald-400 font-medium">{activeCount} active</span>}
                {pendingCount === 0 && activeCount === 0 && "No open chats"}
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
            <AnimatePresence>
              {sortedSessions.map((session) => (
                <motion.div
                  key={session.roomId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                >
                  <SessionRow
                    session={session}
                    selected={selectedRoomId === session.roomId}
                    onClick={() => setSelectedRoomId(session.roomId)}
                    liveStatus={liveStatusMap.get(session.roomId) as ClaimSession["status"] | undefined}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#060d1a]">
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
              {selectedSession.status === "pending" && (
                <div className="px-5 py-2.5 flex items-center gap-2 bg-yellow-500/8 border-b border-yellow-500/15 flex-shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                  <p className="text-yellow-400 text-xs font-medium">Waiting for an agent to answer this chat</p>
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
