import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { Stocker, StockRequest } from "../../types";
import { Users, Plus, X, Loader2, Archive, TrendingUp, Package, Mail, ChevronDown, ChevronUp } from "lucide-react";

function StockerCard({ stocker }: { stocker: Stocker }) {
  const [expanded, setExpanded] = useState(false);

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["stocker-detail", stocker._id],
    queryFn: () => adminApi.stock.getStockerDetail(stocker._id),
    enabled: expanded,
  });

  const qc = useQueryClient();

  const updateMut = useMutation({
    mutationFn: (data: { commissionRate?: number; status?: string }) =>
      adminApi.stock.updateStocker(stocker._id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-stockers"] }),
    onError: (e: Error) => alert(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminApi.stock.deleteStocker(stocker._id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-stockers"] }),
    onError: (e: Error) => alert(e.message),
  });

  const [editRate, setEditRate] = useState<number | null>(null);
  const detail = detailData?.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <span className="text-white text-sm font-bold">
              {(stocker.name || stocker.email)[0].toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm" style={{ color: "#1e1b4b" }}>
                {stocker.name || stocker.email.split("@")[0]}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: stocker.status === "active" ? "#ECFDF5" : stocker.status === "invited" ? "#FEF9C3" : "#F3F4F6",
                  color: stocker.status === "active" ? "#065F46" : stocker.status === "invited" ? "#854D0E" : "#6B7280",
                }}>
                {stocker.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{stocker.email}</p>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <p className="text-xs font-bold" style={{ color: "#1e1b4b" }}>{stocker.stockedCount ?? 0}</p>
              <p className="text-[10px] text-slate-400">stocked</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-emerald-600">${stocker.totalRevenue.toFixed(0)}</p>
              <p className="text-[10px] text-slate-400">revenue</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-indigo-600">${stocker.totalCommission.toFixed(0)}</p>
              <p className="text-[10px] text-slate-400">commission</p>
            </div>
            <div className="text-center">
              {editRate !== null ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" max="100" value={editRate}
                    onChange={e => setEditRate(parseFloat(e.target.value) || 0)}
                    className="w-14 text-xs rounded px-1 py-0.5 text-center"
                    style={{ border: "1px solid #A5B4FC", color: "#1e1b4b" }}
                  />
                  <span className="text-xs text-slate-400">%</span>
                  <button
                    onClick={() => { updateMut.mutate({ commissionRate: editRate }); setEditRate(null); }}
                    className="text-emerald-600 hover:opacity-70 text-xs"
                  >✓</button>
                  <button onClick={() => setEditRate(null)} className="text-slate-400 hover:opacity-70 text-xs">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setEditRate(stocker.commissionRate)}
                  className="hover:text-indigo-500 transition-colors text-center"
                >
                  <p className="text-xs font-bold" style={{ color: "#1e1b4b" }}>{stocker.commissionRate}%</p>
                  <p className="text-[10px] text-slate-400">commission rate</p>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {stocker.status === "active" && (
              <button
                onClick={() => {
                  if (window.confirm(`Disable ${stocker.name || stocker.email}?`)) {
                    updateMut.mutate({ status: "disabled" });
                  }
                }}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}
              >
                Disable
              </button>
            )}
            {stocker.status === "disabled" && (
              <button
                onClick={() => updateMut.mutate({ status: "active" })}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "#ECFDF5", color: "#10B981", border: "1px solid #6EE7B7" }}
              >
                Enable
              </button>
            )}
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#6b7280" }}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                {detailLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading history...
                  </div>
                ) : detail ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Total Requests", value: detail.stats.totalRequests, color: "#1e1b4b" },
                        { label: "Pending", value: detail.stats.pendingRequests, color: "#854D0E" },
                        { label: "Stocked", value: detail.stats.stockedRequests, color: "#065F46" },
                        { label: "Total Items Stocked", value: detail.stocker.totalStocked, color: "#1D4ED8" },
                      ].map(s => (
                        <div key={s.label} className="text-center p-2 rounded-xl" style={{ background: "#F7F8FC" }}>
                          <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                          <p className="text-[10px] text-slate-400">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {detail.requests.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent Requests</p>
                        <div className="space-y-1.5">
                          {detail.requests.slice(0, 5).map((r: StockRequest) => (
                            <div key={r._id} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ background: "#F7F8FC" }}>
                              <span className="text-slate-600">{r.game} · {r.items.length} items</span>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600 font-semibold">${r.totalSaleValue.toFixed(2)}</span>
                                <span className="px-1.5 py-0.5 rounded-full font-medium text-[10px]"
                                  style={{
                                    background: r.status === "stocked" ? "#ECFDF5" : r.status === "pending" ? "#FEF9C3" : r.status === "approved" ? "#EFF6FF" : "#FEF2F2",
                                    color: r.status === "stocked" ? "#065F46" : r.status === "pending" ? "#854D0E" : r.status === "approved" ? "#1D4ED8" : "#DC2626",
                                  }}>
                                  {r.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function StockTracking() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRate, setInviteRate] = useState("10");
  const [inviteError, setInviteError] = useState("");

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["stock-stockers"],
    queryFn: adminApi.stock.listStockers,
  });

  const inviteMut = useMutation({
    mutationFn: (d: { email: string; name?: string; commissionRate?: number }) =>
      adminApi.stock.inviteStocker(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-stockers"] });
      setShowInvite(false);
      setInviteEmail(""); setInviteName(""); setInviteRate("10");
    },
    onError: (e: Error) => setInviteError(e.message),
  });

  const stockers = data?.data.stockers || [];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) { setInviteError("Email is required"); return; }
    inviteMut.mutate({ email: inviteEmail, name: inviteName, commissionRate: parseFloat(inviteRate) || 10 });
  };

  return (
    <div className="p-6 space-y-5 max-w-[900px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Stocker Tracking</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage stocker accounts and track their performance</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setShowInvite(true); setInviteError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#1e1b4b" }}
        >
          <Plus className="w-4 h-4" />
          Invite Stocker
        </motion.button>
      </div>

      {stockers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Stockers", value: stockers.length, icon: Users, color: "#6366f1" },
            { label: "Total Revenue Generated", value: `$${stockers.reduce((s, t) => s + t.totalRevenue, 0).toFixed(0)}`, icon: TrendingUp, color: "#10B981" },
            { label: "Total Commission Owed", value: `$${stockers.reduce((s, t) => s + t.totalCommission, 0).toFixed(0)}`, icon: Package, color: "#F59E0B" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ border: "1px solid #E9EBF5" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: "#1e1b4b" }}>{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }} />
          ))}
        </div>
      ) : stockers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ border: "1px solid #E9EBF5" }}>
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 text-sm">No stockers yet. Invite someone to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stockers.map(s => <StockerCard key={s._id} stocker={s} />)}
        </div>
      )}

      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
              style={{ border: "1px solid #E9EBF5" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <h3 className="font-bold text-lg" style={{ color: "#1e1b4b" }}>Invite Stocker</h3>
                <button onClick={() => setShowInvite(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "#F7F8FC", color: "#6b7280" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "#374151" }}>Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required
                      placeholder="stocker@example.com"
                      className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "#374151" }}>Name (optional)</label>
                  <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                    placeholder="Display name"
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "#374151" }}>Commission Rate (%)</label>
                  <input type="number" min="0" max="100" value={inviteRate} onChange={e => setInviteRate(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                  />
                  <p className="text-xs text-slate-400 mt-1">Commission on projected revenue from their stocked items</p>
                </div>
                {inviteError && (
                  <div className="text-sm rounded-xl px-4 py-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
                    {inviteError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowInvite(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={inviteMut.isPending}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "#1e1b4b" }}>
                    {inviteMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send Invite
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
