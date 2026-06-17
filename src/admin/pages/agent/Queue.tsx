import { useRef, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Clock, Package, CheckCircle, RefreshCw,
  ChevronDown, Wifi, WifiOff, Inbox, Activity, Archive, ArrowLeft,
} from "lucide-react";
import { useAdminSocket } from "../../context/AdminSocketContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { adminApi } from "../../api";
import ChatWindow from "../../components/ChatWindow";
import type { ClaimSession } from "../../types";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ChatListItem({
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
  const itemName = session.itemName || session.items?.[0]?.name || session.game || "General";
  const displayName = session.assignedAgent
    ? `In Progress · ${itemName}`
    : itemName;

  const lastMsg = session.messages?.length
    ? session.messages[session.messages.length - 1]
    : null;

  return (
    <motion.div
      whileHover={{ x: 2 }}
      onClick={onClick}
      className="flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all mb-1"
      style={
        selected
          ? {
              background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 100%)",
              border: "1px solid rgba(99,102,241,0.25)",
            }
          : {
              border: "1px solid transparent",
              background: "rgba(255,255,255,0.02)",
            }
      }
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <span className="text-indigo-300 text-xs font-bold">
          {session.robloxUsername?.[0]?.toUpperCase() || "?"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-white text-xs font-semibold truncate flex-1">{session.robloxUsername}</p>
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-slate-400 text-xs truncate mb-1">{displayName}</p>
        {lastMsg && lastMsg.sender !== "system" && (
          <p className="text-slate-600 text-[10px] truncate">
            {lastMsg.sender === "agent" ? "You: " : ""}{lastMsg.text}
          </p>
        )}
        <p className="text-slate-700 text-[10px] mt-0.5">{timeAgo(session.createdAt)}</p>
      </div>
    </motion.div>
  );
}

function CompletedChatItem({
  session,
  selected,
  onClick,
}: {
  session: ClaimSession;
  selected: boolean;
  onClick: () => void;
}) {
  const itemName = session.itemName || session.items?.[0]?.name || session.game || "General";
  const agentName = session.assignedAgent?.name || "Unknown";

  return (
    <motion.div
      whileHover={{ x: 2 }}
      onClick={onClick}
      className="flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all mb-1"
      style={
        selected
          ? {
              background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 100%)",
              border: "1px solid rgba(99,102,241,0.25)",
            }
          : {
              border: "1px solid transparent",
              background: "rgba(255,255,255,0.02)",
            }
      }
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate mb-0.5">
          {agentName} · {itemName}
        </p>
        <p className="text-slate-400 text-xs truncate">{session.robloxUsername}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ background: session.status === "claimed" ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.1)", color: session.status === "claimed" ? "#34d399" : "#94a3b8" }}>
            {session.status === "claimed" ? "Delivered" : "Ended"}
          </span>
          <p className="text-slate-700 text-[10px]">{timeAgo(session.resolvedAt || session.createdAt)}</p>
        </div>
      </div>
    </motion.div>
  );
}

type SectionKey = "waiting" | "mine" | "completed";

export default function Queue() {
  const { socket, connected, pendingClaims, removePendingClaim } = useAdminSocket();
  const { user, profile } = useAdminAuth();
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

    const handleEnded = ({ roomId }: { roomId: string }) => {
      removePendingClaim(roomId);
      refetch();
    };

    const handleCompleted = ({ roomId }: { roomId: string }) => {
      removePendingClaim(roomId);
      refetch();
    };

    const handleTaken = ({ roomId }: { roomId: string }) => {
      removePendingClaim(roomId);
      refetch();
    };

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
    socket.on("claim:marked_claimed", () => {
      if (selectedSession) refetch();
    });

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

  const handleBack = () => {
    setShowChatMobile(false);
  };

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

  const sections: { key: SectionKey; label: string; icon: React.ElementType; items: ClaimSession[]; color: string }[] = [
    { key: "waiting", label: "Waiting to be Claimed", icon: Inbox, items: allPending, color: "text-yellow-400" },
    { key: "mine", label: "My Active Chats", icon: Activity, items: mine, color: "text-emerald-400" },
    { key: "completed", label: "Completed Chats", icon: Archive, items: completed, color: "text-slate-400" },
  ];

  const isSessionActive =
    selectedSession &&
    selectedSession.status === "active" &&
    selectedSession.assignedAgent?.userId === user?.id;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar — full width on mobile when no chat shown, fixed 320px on md+ */}
      <div
        className={`${showChatMobile ? "hidden" : "flex"} md:flex flex-col w-full md:w-80 flex-shrink-0 overflow-hidden border-r`}
        style={{ background: "rgba(6,9,28,0.6)", borderColor: "rgba(139,92,246,0.1)" }}
      >
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`}
              style={{ boxShadow: connected ? "0 0 6px rgba(52,211,153,0.6)" : "none" }} />
            <p className="text-white text-sm font-semibold">Claim Queue</p>
            {connected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-400 ml-auto" />
            )}
          </div>
          {user?.claimGames && user.claimGames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {user.claimGames.map(g => (
                <span key={g} className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.15)" }}>
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {sections.map(section => {
            const isOpen = openSection === section.key;
            const SIcon = section.icon;
            return (
              <div key={section.key} className="mb-1">
                <button
                  onClick={() => setOpenSection(section.key)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={isOpen ? {
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.12)",
                  } : {
                    border: "1px solid transparent",
                  }}
                >
                  <SIcon className={`w-3.5 h-3.5 flex-shrink-0 ${section.color}`} />
                  <span className="text-xs font-semibold text-white flex-1 text-left truncate">{section.label}</span>
                  {section.items.length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
                      {section.items.length}
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 pb-1">
                        {isLoading && section.key !== "waiting" ? (
                          <div className="px-3 py-4 text-center">
                            <RefreshCw className="w-4 h-4 text-slate-600 animate-spin mx-auto" />
                          </div>
                        ) : section.items.length === 0 ? (
                          <div className="px-3 py-4 text-center">
                            <p className="text-slate-600 text-xs">
                              {section.key === "waiting" ? "No pending claims" :
                               section.key === "mine" ? "No active chats" :
                               "No completed chats yet"}
                            </p>
                          </div>
                        ) : section.key === "completed" ? (
                          section.items.map(s => (
                            <CompletedChatItem
                              key={s.roomId}
                              session={s}
                              selected={selectedSession?.roomId === s.roomId}
                              onClick={() => openSession(s)}
                            />
                          ))
                        ) : (
                          section.items.map(s => (
                            <ChatListItem
                              key={s.roomId}
                              session={s}
                              selected={selectedSession?.roomId === s.roomId}
                              onClick={() => openSession(s)}
                              badge={section.key === "waiting" ? "Claim" : undefined}
                            />
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat panel — full width on mobile when showChatMobile, flex-1 on md+ */}
      <div className={`${showChatMobile ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden`}>
        {loadingSession ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-slate-600 animate-spin" />
          </div>
        ) : selectedSession ? (
          <>
            <div className="flex items-center gap-2 px-3 md:px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {/* Back button — mobile only */}
              <button
                onClick={handleBack}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 flex-shrink-0 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {selectedSession.status === "active"
                    ? `In Progress · ${selectedSession.itemName || selectedSession.game || "Chat"}`
                    : selectedSession.status === "pending"
                    ? `Waiting · ${selectedSession.itemName || selectedSession.game || "Chat"}`
                    : selectedSession.status === "claimed"
                    ? `${selectedSession.assignedAgent?.name || "Agent"} · ${selectedSession.itemName || selectedSession.game || "Chat"}`
                    : `Ended · ${selectedSession.itemName || selectedSession.game || "Chat"}`}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {selectedSession.robloxUsername} · {selectedSession.orderRef ? `Order ${selectedSession.orderRef}` : selectedSession.game}
                </p>
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

            <div className="flex-1 overflow-hidden p-2 md:p-3">
              <ChatWindow
                session={selectedSession}
                onSessionClaimed={handleSessionClaimed}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <MessageSquare className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="text-white font-semibold mb-2">Select a chat</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              Choose a chat from the queue on the left. Type a message in any waiting chat to instantly claim it.
            </p>
            <div className="mt-6 space-y-2 text-left max-w-xs">
              {[
                { icon: Clock, color: "text-yellow-400", text: "Waiting chats need an agent — be first to type to claim" },
                { icon: Package, color: "text-blue-400", text: "Deliver the order, then mark it as delivered" },
                { icon: CheckCircle, color: "text-emerald-400", text: "Submit proof of delivery to complete the claim" },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <tip.icon className={`w-4 h-4 ${tip.color} mt-0.5 flex-shrink-0`} />
                  <p className="text-slate-500 text-xs leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* POD Modal */}
      <AnimatePresence>
        {podMode && selectedSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden">
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
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${noProof ? "bg-amber-500" : "bg-white/10"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${noProof ? "left-4" : "left-0.5"}`} />
                    </div>
                    <span className="text-xs text-slate-400">No proof</span>
                  </label>
                </div>

                {!noProof && (
                  <>
                    <div onClick={() => fileRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${proofFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 hover:border-white/20"}`}>
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
                    <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { setProofFile(e.target.files?.[0] || null); e.target.value = ""; }} />
                  </>
                )}

                {noProof && (
                  <div className="rounded-xl px-4 py-3 text-sm text-amber-400/80 flex items-start gap-2"
                    style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <span>⚠️</span>
                    <span className="text-xs">Skipping proof — the delivery will be marked without a screenshot.</span>
                  </div>
                )}

                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Estimated Delivery Time</label>
                  <input value={estDelivery} onChange={e => setEstDelivery(e.target.value)}
                    placeholder="e.g. 5 minutes"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Notes</label>
                  <textarea value={podNotes} onChange={e => setPodNotes(e.target.value)}
                    placeholder="Optional notes..."
                    rows={2}
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-500/50" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setPodMode(false); setProofFile(null); setNoProof(false); }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={submitProofAndClaim}
                    disabled={submittingPod || (!noProof && !proofFile)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                    {submittingPod ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Mark Delivered
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
