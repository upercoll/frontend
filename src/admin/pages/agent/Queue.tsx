import { useRef, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Clock, Package, CheckCircle, RefreshCw,
  ChevronDown, Wifi, WifiOff, Inbox, Activity, Archive,
  ArrowLeft, User, Mail, Gamepad2, AlertCircle,
} from "lucide-react";
import { useAdminSocket } from "../../context/AdminSocketContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { adminApi } from "../../api";
import ChatWindow from "../../components/ChatWindow";
import { cn } from "@/lib/utils";
import type { ClaimSession } from "../../types";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; dotPulse?: boolean; label: string }> = {
  pending: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400", label: "Waiting" },
  active:  { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400", dotPulse: true, label: "In Progress" },
  claimed: { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400", label: "Delivered" },
  ended:   { bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-500", label: "Ended" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getItemLabel(session: ClaimSession): string {
  const raw = session.itemName;
  if (raw && raw !== "General Claim" && raw.trim()) return raw;
  if (session.items && session.items.length > 0 && session.items[0]?.name) return session.items[0].name;
  if (session.game && session.game.trim()) return session.game;
  return "General Claim";
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

function SessionRow({
  session,
  selected,
  onClick,
  badge,
}: {
  session: ClaimSession;
  selected: boolean;
  onClick: () => void;
  badge?: string;
}) {
  const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.ended;
  const itemLabel = getItemLabel(session);
  const lastMsg = session.messages?.length
    ? session.messages[session.messages.length - 1]
    : null;

  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 border-b border-white/4 transition-colors flex items-start gap-3",
        selected ? "bg-indigo-600/10 border-l-2 border-l-indigo-500" : "hover:bg-white/3"
      )}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-700/20 border border-indigo-500/15 flex items-center justify-center">
          <span className="text-indigo-300 text-sm font-bold">
            {session.robloxUsername?.[0]?.toUpperCase() || "?"}
          </span>
        </div>
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a1628]",
          cfg.dot,
          cfg.dotPulse ? "animate-pulse" : ""
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-white text-sm font-semibold truncate">{session.robloxUsername}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300">
                {badge}
              </span>
            )}
            <span className="text-slate-600 text-[10px]">{timeAgo(session.createdAt)}</span>
          </div>
        </div>

        <p className="text-slate-500 text-xs truncate mt-0.5">{itemLabel}</p>

        {lastMsg && lastMsg.sender !== "system" && (
          <p className="text-slate-600 text-[10px] truncate mt-0.5">
            {lastMsg.sender === "agent" ? "You: " : ""}{lastMsg.text}
          </p>
        )}

        <div className="flex items-center justify-between mt-1.5">
          <StatusBadge status={session.status} agentName={session.assignedAgent?.name} />
          {session.orderRef && (
            <span className="text-slate-700 text-[10px]">#{session.orderRef.slice(-6)}</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function SectionHeader({
  label,
  icon: Icon,
  count,
  color,
  isOpen,
  onToggle,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/3 transition-colors group"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className={cn("w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0", color === "amber" ? "bg-amber-500/10" : color === "emerald" ? "bg-emerald-500/10" : "bg-slate-500/10")}>
        <Icon className={cn("w-3 h-3", color === "amber" ? "text-amber-400" : color === "emerald" ? "text-emerald-400" : "text-slate-400")} />
      </div>
      <span className={cn("text-xs font-bold flex-1 text-left", color === "amber" ? "text-amber-300" : color === "emerald" ? "text-emerald-300" : "text-slate-400")}>
        {label}
      </span>
      {count > 0 && (
        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold", color === "amber" ? "bg-amber-500/15 text-amber-400" : color === "emerald" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400")}>
          {count}
        </span>
      )}
      <ChevronDown className={cn("w-3.5 h-3.5 text-slate-600 transition-transform flex-shrink-0", isOpen ? "rotate-180" : "")} />
    </button>
  );
}

type SectionKey = "waiting" | "mine" | "completed";

export default function Queue() {
  const { socket, connected, pendingClaims, removePendingClaim } = useAdminSocket();
  const { user } = useAdminAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedSession, setSelectedSession] = useState<ClaimSession | null>(null);
  const [openSection, setOpenSection] = useState<SectionKey>("waiting");
  const [loadingSession, setLoadingSession] = useState(false);
  const [podMode, setPodMode] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [estDelivery, setEstDelivery] = useState("");
  const [podNotes, setPodNotes] = useState("");
  const [submittingPod, setSubmittingPod] = useState(false);
  const [noProof, setNoProof] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["agent-queue"],
    queryFn: () => adminApi.claimSessions.getAgentQueue(),
    refetchInterval: 30000,
  });

  const pending: ClaimSession[] = (data as any)?.data?.pending || [];
  const mine: ClaimSession[] = (data as any)?.data?.mine || [];
  const completed: ClaimSession[] = (data as any)?.data?.completed || [];

  const allPending = [
    ...pendingClaims
      .filter(pc => !pending.some(p => p.roomId === pc.roomId))
      .map(pc => ({
        _id: pc.roomId,
        roomId: pc.roomId,
        robloxUsername: pc.robloxUsername,
        contactEmail: pc.contactEmail || "",
        game: pc.game,
        itemName: pc.itemName,
        items: pc.items || [],
        status: "pending" as const,
        messages: [],
        createdAt: pc.createdAt,
      })),
    ...pending,
  ];

  useEffect(() => {
    if (!socket) return;
    const handleClaimed = ({ roomId }: { roomId: string }) => {
      removePendingClaim(roomId);
      refetch();
      if (selectedSession?.roomId === roomId) {
        setSelectedSession(prev => prev ? { ...prev, status: "claimed" } : prev);
      }
    };
    const handleEnded = ({ roomId }: { roomId: string }) => { removePendingClaim(roomId); refetch(); };
    const handleCompleted = ({ roomId }: { roomId: string }) => { removePendingClaim(roomId); refetch(); };
    const handleTaken = ({ roomId }: { roomId: string }) => { removePendingClaim(roomId); refetch(); };
    const handleAutoAssigned = ({ roomId, session }: { roomId: string; session: ClaimSession }) => {
      removePendingClaim(roomId);
      refetch();
      setSelectedSession(session);
      setOpenSection("mine");
      setShowChatMobile(true);
    };
    socket.on("queue:claim_completed", handleCompleted);
    socket.on("queue:claim_ended", handleEnded);
    socket.on("queue:claim_taken", handleTaken);
    socket.on("queue:claim_auto_assigned", handleAutoAssigned);
    socket.on("claim:marked_claimed", () => { if (selectedSession) refetch(); });
    return () => {
      socket.off("queue:claim_completed", handleCompleted);
      socket.off("queue:claim_ended", handleEnded);
      socket.off("queue:claim_taken", handleTaken);
      socket.off("queue:claim_auto_assigned", handleAutoAssigned);
      socket.off("claim:marked_claimed");
    };
  }, [socket, selectedSession, removePendingClaim, refetch]);

  const openSession = useCallback(async (sessionOrStub: ClaimSession) => {
    setShowChatMobile(true);
    if (sessionOrStub.messages && sessionOrStub.messages.length > 0) {
      setSelectedSession(sessionOrStub);
      socket?.emit("claim:agent_browse", { roomId: sessionOrStub.roomId });
      return;
    }
    setLoadingSession(true);
    try {
      const res = await (adminApi.claimSessions as any).getFullSession(sessionOrStub.roomId);
      const fullSession = res?.data?.session || res?.data;
      setSelectedSession(fullSession || sessionOrStub);
      socket?.emit("claim:agent_browse", { roomId: sessionOrStub.roomId });
    } catch {
      setSelectedSession(sessionOrStub);
      socket?.emit("claim:agent_browse", { roomId: sessionOrStub.roomId });
    } finally {
      setLoadingSession(false);
    }
  }, [socket]);

  const handleSessionClaimed = useCallback((session: ClaimSession) => {
    setSelectedSession(session);
    setOpenSection("mine");
    removePendingClaim(session.roomId);
    refetch();
  }, [removePendingClaim, refetch]);

  const markClaimed = () => setPodMode(true);

  const submitProofAndClaim = async () => {
    if (!selectedSession) return;
    if (!noProof && !proofFile) return;
    setSubmittingPod(true);
    try {
      if (!noProof && proofFile) {
        const form = new FormData();
        form.append("proof", proofFile);
        form.append("roomId", selectedSession.roomId);
        if (estDelivery) form.append("estimatedDelivery", estDelivery);
        if (podNotes) form.append("notes", podNotes);
        await adminApi.proof.submit(form);
      }
      socket?.emit("claim:mark_claimed", { roomId: selectedSession.roomId });
      setPodMode(false);
      setProofFile(null);
      setEstDelivery("");
      setPodNotes("");
      setNoProof(false);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmittingPod(false);
    }
  };

  const endChat = () => {
    if (!socket || !selectedSession) return;
    if (!confirm("End this chat without marking as delivered?")) return;
    socket.emit("claim:end", { roomId: selectedSession.roomId });
    setSelectedSession(prev => prev ? { ...prev, status: "ended" } : prev);
    refetch();
  };

  const isSessionActive =
    selectedSession &&
    selectedSession.status === "active" &&
    selectedSession.assignedAgent?.userId === user?.id;

  const sections: {
    key: SectionKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    items: ClaimSession[];
    color: string;
  }[] = [
    { key: "waiting",   label: "Waiting to be Claimed", icon: Inbox,   items: allPending, color: "amber" },
    { key: "mine",      label: "My Active Chats",        icon: Activity, items: mine,      color: "emerald" },
    { key: "completed", label: "Completed Chats",        icon: Archive,  items: completed, color: "slate" },
  ];

  const selectedItemLabel = selectedSession ? getItemLabel(selectedSession) : "";

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Sidebar ── */}
      <div
        className={cn(
          showChatMobile ? "hidden" : "flex",
          "md:flex flex-col w-full md:w-80 flex-shrink-0 border-r border-white/5 bg-[#0a1628]"
        )}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connected ? "bg-emerald-400" : "bg-red-400"
              )}
                style={{ boxShadow: connected ? "0 0 6px rgba(52,211,153,0.6)" : "none" }}
              />
              <h2 className="text-white font-semibold text-sm">Claim Queue</h2>
            </div>
            {connected
              ? <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              : <WifiOff className="w-3.5 h-3.5 text-red-400" />
            }
          </div>

          {user?.claimGames && user.claimGames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {user.claimGames.map(g => (
                <span key={g}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/15">
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 flex-wrap">
            {allPending.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span className="text-amber-400 font-medium">{allPending.length} waiting</span>
              </span>
            )}
            {mine.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className="text-emerald-400 font-medium">{mine.length} active</span>
              </span>
            )}
            {allPending.length === 0 && mine.length === 0 && "Queue is quiet"}
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {sections.map(section => {
            const isOpen = openSection === section.key;
            return (
              <div key={section.key} className="mb-px">
                <SectionHeader
                  label={section.label}
                  icon={section.icon}
                  count={section.items.length}
                  color={section.color}
                  isOpen={isOpen}
                  onToggle={() => setOpenSection(isOpen ? section.key : section.key)}
                />

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {isLoading && section.key !== "waiting" ? (
                        <div className="px-4 py-6 text-center">
                          <RefreshCw className="w-4 h-4 text-slate-600 animate-spin mx-auto" />
                        </div>
                      ) : section.items.length === 0 ? (
                        <div className="px-4 py-5 text-center">
                          <p className="text-slate-600 text-xs">
                            {section.key === "waiting" ? "No pending claims" :
                             section.key === "mine" ? "No active chats" :
                             "No completed chats yet"}
                          </p>
                        </div>
                      ) : (
                        section.items.map(s => (
                          <SessionRow
                            key={s.roomId}
                            session={s}
                            selected={selectedSession?.roomId === s.roomId}
                            onClick={() => openSession(s)}
                            badge={section.key === "waiting" ? "Claim" : undefined}
                          />
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <div className={cn(
        showChatMobile ? "flex" : "hidden",
        "md:flex flex-1 flex-col overflow-hidden bg-[#060d1a]"
      )}>
        {loadingSession ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-slate-600 animate-spin" />
          </div>
        ) : selectedSession ? (
          <>
            {/* Chat header */}
            <div
              className="flex items-center gap-2 px-3 md:px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <button
                onClick={() => setShowChatMobile(false)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 flex-shrink-0 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-semibold truncate">{selectedSession.robloxUsername}</p>
                  <StatusBadge status={selectedSession.status} agentName={selectedSession.assignedAgent?.name} />
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {selectedSession.contactEmail && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[160px]">{selectedSession.contactEmail}</span>
                    </span>
                  )}
                  {selectedSession.game && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Gamepad2 className="w-3 h-3" />
                      {selectedSession.game}
                    </span>
                  )}
                  {selectedItemLabel && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Package className="w-3 h-3" />
                      {selectedItemLabel}
                    </span>
                  )}
                </div>
              </div>

              {isSessionActive && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={markClaimed}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark Delivered</span>
                    <span className="sm:hidden">Deliver</span>
                  </motion.button>
                  <button onClick={endChat}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl text-xs transition-colors">
                    <span className="hidden sm:inline">End Chat</span>
                    <span className="sm:hidden">End</span>
                  </button>
                </div>
              )}
            </div>

            {selectedSession.status === "pending" && (
              <div className="px-4 py-2.5 flex items-center gap-2 bg-amber-500/8 border-b border-amber-500/15 flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-amber-400 text-xs font-medium">
                  Unclaimed — type a message below to instantly claim this chat
                </p>
              </div>
            )}

            <div className="flex-1 overflow-hidden p-2 md:p-3">
              <ChatWindow
                session={selectedSession}
                onSessionClaimed={handleSessionClaimed}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-indigo-500/8 border border-indigo-500/12">
              <MessageSquare className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="text-white font-semibold mb-2">Select a chat</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              Choose a chat from the queue on the left. Type a message in any waiting chat to instantly claim it.
            </p>
            <div className="mt-6 space-y-2.5 text-left max-w-xs">
              {[
                { icon: Clock, color: "text-amber-400", text: "Waiting chats need an agent — be first to type to claim" },
                { icon: Package, color: "text-blue-400", text: "Deliver the order, then mark it as delivered" },
                { icon: CheckCircle, color: "text-emerald-400", text: "Submit proof of delivery to complete the claim" },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <tip.icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", tip.color)} />
                  <p className="text-slate-500 text-xs leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── POD Modal ── */}
      <AnimatePresence>
        {podMode && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">Proof of Delivery Required</h3>
                <p className="text-slate-400 text-xs mt-0.5">Submit proof before marking as delivered</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-sm font-medium">
                    Proof Screenshot {noProof ? "(skipped)" : "*"}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => { setNoProof(v => !v); if (!noProof) setProofFile(null); }}
                      className={cn("relative w-9 h-5 rounded-full transition-colors flex-shrink-0", noProof ? "bg-amber-500" : "bg-white/10")}
                    >
                      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", noProof ? "left-4" : "left-0.5")} />
                    </div>
                    <span className="text-xs text-slate-400">No proof</span>
                  </label>
                </div>

                {!noProof && (
                  <>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors",
                        proofFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 hover:border-white/20"
                      )}
                    >
                      {proofFile ? (
                        <div>
                          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                          <p className="text-emerald-300 text-sm">{proofFile.name}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-400 text-sm">Tap to upload screenshot</p>
                          <p className="text-slate-600 text-xs mt-0.5">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { setProofFile(e.target.files?.[0] || null); e.target.value = ""; }}
                    />
                  </>
                )}

                {noProof && (
                  <div className="rounded-xl px-4 py-3 text-xs text-amber-400/80 flex items-start gap-2 bg-amber-500/8 border border-amber-500/20">
                    <span>⚠️</span>
                    <span>Skipping proof — the delivery will be marked without a screenshot.</span>
                  </div>
                )}

                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Estimated Delivery Time</label>
                  <input
                    value={estDelivery}
                    onChange={e => setEstDelivery(e.target.value)}
                    placeholder="e.g. 5 minutes"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Notes</label>
                  <textarea
                    value={podNotes}
                    onChange={e => setPodNotes(e.target.value)}
                    placeholder="Optional delivery notes…"
                    rows={2}
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/5 flex gap-3">
                <button
                  onClick={() => { setPodMode(false); setProofFile(null); setNoProof(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitProofAndClaim}
                  disabled={submittingPod || (!noProof && !proofFile)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors",
                    (!noProof && !proofFile) || submittingPod
                      ? "bg-emerald-700/40 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  {submittingPod
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
                    : <><CheckCircle className="w-3.5 h-3.5" /> Mark as Delivered</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
