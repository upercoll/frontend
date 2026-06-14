import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FileCheck, Eye, Clock, User, Package, X, ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
import { adminApi } from "../api";
import type { ProofOfDelivery } from "../types";
import { cn } from "@/lib/utils";

export default function ProofOfDeliveryPage() {
  const [page, setPage] = useState(1);
  const [viewedFilter, setViewedFilter] = useState("");
  const [selectedProof, setSelectedProof] = useState<ProofOfDelivery | null>(null);
  const [imageOpen, setImageOpen] = useState(false);

  const params: Record<string, string> = { page: String(page), limit: "20" };
  if (viewedFilter) params.viewed = viewedFilter;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["panel-proof", params],
    queryFn: () => adminApi.proof.list(params),
  });

  const proofs = data?.data.proofs || [];
  const total = data?.data.total || 0;
  const unviewed = data?.data.unviewedCount || 0;
  const pages = Math.ceil(total / 20);

  const openProof = async (proof: ProofOfDelivery) => {
    setSelectedProof(proof);
    if (!proof.viewedByOwner) {
      await adminApi.proof.get(proof._id);
      refetch();
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-semibold text-lg">Proof of Delivery</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {total} submissions
            {unviewed > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unviewed} new</span>}
          </p>
        </div>
        <select value={viewedFilter} onChange={(e) => { setViewedFilter(e.target.value); setPage(1); }}
          className="bg-[#0d1f3c] border border-white/10 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">All Submissions</option>
          <option value="false">Unviewed</option>
          <option value="true">Viewed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />)}
        </div>
      ) : proofs.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No proof of delivery submissions yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proofs.map((proof: ProofOfDelivery, i: number) => (
            <motion.div key={proof._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={cn("bg-[#0d1f3c] border rounded-xl overflow-hidden cursor-pointer hover:border-white/15 transition-colors group",
                !proof.viewedByOwner ? "border-blue-500/30" : "border-white/5")}
              onClick={() => openProof(proof)}>
              <div className="aspect-video relative overflow-hidden">
                <img src={proof.proofImageUrl} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {!proof.viewedByOwner && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-medium">{proof.agentName}</p>
                  {proof.game && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">{proof.game}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <User className="w-3 h-3 text-slate-500" />
                  {proof.robloxUsername || "—"}
                </div>
                {proof.estimatedDelivery && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    ETA: {proof.estimatedDelivery}
                  </div>
                )}
                <p className="text-slate-600 text-[10px]">{new Date(proof.createdAt).toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg bg-[#0d1f3c] border border-white/5 disabled:opacity-30 flex items-center justify-center text-slate-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="w-8 h-8 rounded-lg bg-[#0d1f3c] border border-white/5 disabled:opacity-30 flex items-center justify-center text-slate-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedProof && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProof(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">Proof of Delivery</h3>
                <button onClick={() => setSelectedProof(null)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => setImageOpen(true)}>
                  <img src={selectedProof.proofImageUrl} alt="Proof" className="w-full max-h-64 object-contain bg-black/20" />
                  <p className="text-center text-slate-500 text-xs py-1.5">Click to view full size</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Agent", value: selectedProof.agentName, icon: User },
                    { label: "Game", value: selectedProof.game || "—", icon: Gamepad2 },
                    { label: "Roblox User", value: selectedProof.robloxUsername || "—", icon: User },
                    { label: "Est. Delivery", value: selectedProof.estimatedDelivery, icon: Clock },
                    { label: "Order Ref", value: selectedProof.orderRef || "—", icon: Package },
                    { label: "Submitted", value: new Date(selectedProof.createdAt).toLocaleString(), icon: Clock },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/3 border border-white/5 rounded-lg p-3">
                      <p className="text-slate-500 text-xs flex items-center gap-1.5"><item.icon className="w-3 h-3" />{item.label}</p>
                      <p className="text-white text-sm font-medium mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {selectedProof.notes && (
                  <div className="bg-white/3 border border-white/5 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Agent Notes</p>
                    <p className="text-slate-200 text-sm">{selectedProof.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {imageOpen && selectedProof && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
            onClick={() => setImageOpen(false)}>
            <img src={selectedProof.proofImageUrl} alt="Proof" className="max-w-full max-h-full object-contain rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
