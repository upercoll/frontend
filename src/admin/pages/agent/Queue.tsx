import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Clock, Package, Wifi, WifiOff, CheckCircle, RefreshCw } from "lucide-react";
import { useAdminSocket } from "../../context/AdminSocketContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { adminApi } from "../../api";
import ChatWindow from "../../components/ChatWindow";

export default function Queue() {
  const { socket, connected, assignedSession, clearAssignedSession } = useAdminSocket();
  const { user } = useAdminAuth();
  const [podMode, setPodMode] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [estDelivery, setEstDelivery] = useState("");
  const [podNotes, setPodNotes] = useState("");
  const [submittingPod, setSubmittingPod] = useState(false);
  const [noProof, setNoProof] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { refetch } = useQuery({
    queryKey: ["agent-pending-claims"],
    queryFn: () => adminApi.orders.list({ status: "paid", page: "1", limit: "5" }),
    refetchInterval: 10000,
  });

  const markClaimed = () => {
    setPodMode(true);
  };

  const submitProofAndClaim = async () => {
    if (!assignedSession) return;
    if (!noProof && !proofFile) return;
    setSubmittingPod(true);
    try {
      if (!noProof && proofFile) {
        const form = new FormData();
        form.append("proof", proofFile);
        form.append("roomId", assignedSession.roomId);
        if (estDelivery) form.append("estimatedDelivery", estDelivery);
        if (podNotes) form.append("notes", podNotes);
        await adminApi.proof.submit(form);
      }

      socket?.emit("claim:mark_claimed", { roomId: assignedSession.roomId });

      setPodMode(false);
      setProofFile(null);
      setEstDelivery("");
      setPodNotes("");
      setNoProof(false);
      clearAssignedSession();
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmittingPod(false);
    }
  };

  const endChat = () => {
    if (!socket || !assignedSession) return;
    if (!confirm("End this chat without marking as delivered?")) return;
    socket.emit("claim:end", { roomId: assignedSession.roomId });
    clearAssignedSession();
  };

  if (assignedSession) {
    return (
      <div className="p-4 sm:p-6 h-[calc(100vh-64px)] flex flex-col max-w-[900px] mx-auto">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold">Active Claim</h2>
            <p className="text-slate-400 text-xs">Order: {assignedSession.orderRef || "—"} · {assignedSession.game}</p>
          </div>
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={markClaimed}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-colors">
              <CheckCircle className="w-4 h-4" /> Mark Delivered
            </motion.button>
            <button onClick={endChat} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-3.5 py-2 rounded-xl text-sm transition-colors">
              End Chat
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatWindow session={assignedSession} />
        </div>

        <AnimatePresence>
          {podMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
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
                        onClick={() => { setNoProof((v) => !v); if (!noProof) setProofFile(null); }}
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
                            <p className="text-slate-400 text-sm">Click to upload screenshot</p>
                            <p className="text-slate-600 text-xs mt-0.5">PNG, JPG up to 10MB</p>
                          </div>
                        )}
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { setProofFile(e.target.files?.[0] || null); e.target.value = ""; }} />
                    </>
                  )}

                  {noProof && (
                    <div className="rounded-xl px-4 py-3 text-sm text-amber-400/80 flex items-start gap-2"
                      style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <span className="mt-0.5">⚠</span>
                      <p>Marking as delivered without proof. The claim will still be closed and the customer notified.</p>
                    </div>
                  )}

                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Estimated Delivery Time <span className="text-slate-500 font-normal">(optional)</span></label>
                    <input value={estDelivery} onChange={(e) => setEstDelivery(e.target.value)} placeholder="e.g. 5-10 minutes, Immediate"
                      className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Notes <span className="text-slate-500 font-normal">(optional)</span></label>
                    <textarea value={podNotes} onChange={(e) => setPodNotes(e.target.value)} rows={2} placeholder="Any additional notes..."
                      className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => { setPodMode(false); setNoProof(false); setProofFile(null); }}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl text-sm font-medium">
                      Cancel
                    </button>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={submitProofAndClaim}
                      disabled={(!noProof && !proofFile) || submittingPod}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                      {submittingPod ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {noProof ? "Mark Delivered (No Proof)" : "Submit & Mark Delivered"}
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

  return (
    <div className="p-6 space-y-6 max-w-[700px] mx-auto">
      <div className="text-center py-8">
        <motion.div
          animate={{ scale: connected ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: connected ? Infinity : 0, duration: 2, ease: "easeInOut" }}
          className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${connected ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-white/5 border border-white/10"}`}>
          {connected ? <Wifi className="w-8 h-8 text-emerald-400" /> : <WifiOff className="w-8 h-8 text-slate-500" />}
        </motion.div>
        <h2 className="text-white font-bold text-xl mb-2">
          {connected ? "Ready for Claims" : "Connecting..."}
        </h2>
        <p className="text-slate-400 text-sm mb-1">
          {connected ? "You're in the queue. Claim requests will appear as popups." : "Establishing connection to the server..."}
        </p>
        {user?.claimGames && user.claimGames.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {user.claimGames.map((g) => (
              <span key={g} className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{g}</span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#0d1f3c] border border-white/5 rounded-xl p-5">
        <h3 className="text-white font-medium mb-3">How it works</h3>
        <div className="space-y-3">
          {[
            { icon: MessageSquare, color: "text-blue-400 bg-blue-400/10", text: "When a customer places an order for your game, a claim request will pop up on your screen." },
            { icon: Clock, color: "text-yellow-400 bg-yellow-400/10", text: "You have 30 seconds to answer. If you decline or don't respond, it moves to the next agent." },
            { icon: Package, color: "text-purple-400 bg-purple-400/10", text: "Once you answer, chat with the customer, deliver their items, and submit proof of delivery." },
            { icon: CheckCircle, color: "text-emerald-400 bg-emerald-400/10", text: "Mark the claim as delivered after uploading your proof screenshot." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed pt-1">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
