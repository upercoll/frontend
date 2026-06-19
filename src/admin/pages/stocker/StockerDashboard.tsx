import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { Stocker, StockRequest } from "../../types";
import {
  Users, Plus, X, Loader2, Archive, TrendingUp, Package, Mail,
  ChevronRight, BarChart2, ShoppingBag, User, Calendar, CheckCircle2, ArrowLeft,
} from "lucide-react";

interface SalesModalProps {
  stocker: Stocker;
  onClose: () => void;
}

function SalesModal({ stocker, onClose }: SalesModalProps) {
  const [activeTab, setActiveTab] = useState<"deliveries" | "products">("deliveries");

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["stocker-detail", stocker._id],
    queryFn: () => adminApi.stock.getStockerDetail(stocker._id),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["stocker-sales", stocker._id],
    queryFn: () => adminApi.stock.getStockerSales(stocker._id),
  });

  const detail = detailData?.data;
  const sales = salesData?.data;
  const isLoading = detailLoading || salesLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ border: "1px solid #E9EBF5" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#6b7280" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg" style={{ color: "#1e1b4b" }}>
              {stocker.name || stocker.email.split("@")[0]}
            </h3>
            <p className="text-xs text-slate-400">{stocker.email} · {stocker.commissionRate}% commission</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#F7F8FC", color: "#6b7280" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#6366f1" }} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Items Stocked", value: stocker.totalStocked, color: "#1D4ED8", bg: "#EFF6FF" },
                { label: "Total Revenue", value: `$${stocker.totalRevenue.toFixed(0)}`, color: "#065F46", bg: "#ECFDF5" },
                { label: "Commission Earned", value: `$${stocker.totalCommission.toFixed(0)}`, color: "#7c3aed", bg: "#EDE9FE" },
                { label: "Deliveries Made", value: sales?.total || 0, color: "#B45309", bg: "#FEF9C3" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: s.color, opacity: 0.8 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
              {[
                { key: "deliveries", label: "Delivery History", icon: CheckCircle2 },
                { key: "products", label: "Product Breakdown", icon: BarChart2 },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab.key ? "white" : "transparent",
                    color: activeTab === tab.key ? "#1e1b4b" : "#6b7280",
                    boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "deliveries" && (
              <div>
                {!sales?.deliveries?.length ? (
                  <div className="text-center py-12 rounded-xl" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm text-slate-400">No deliveries recorded yet</p>
                    <p className="text-xs text-slate-300 mt-1">Deliveries appear once claim chats are marked as delivered</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sales.deliveries.map((delivery: any, i: number) => (
                      <motion.div
                        key={delivery.roomId || i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-white rounded-xl p-4"
                        style={{ border: "1px solid #E9EBF5" }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "#EEF2FF" }}>
                            <User className="w-4 h-4" style={{ color: "#6366f1" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm" style={{ color: "#1e1b4b" }}>
                                {delivery.robloxUsername}
                              </span>
                              {delivery.game && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ background: "#F3F4F6", color: "#6B7280" }}>
                                  {delivery.game}
                                </span>
                              )}
                              {delivery.orderRef && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                                  #{delivery.orderRef}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Handled by <span className="font-medium text-slate-600 ml-0.5">{delivery.agentName}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {delivery.deliveredAt
                                  ? new Date(delivery.deliveredAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
                                  : "Unknown date"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {(delivery.items || []).map((item: any, j: number) => (
                                <div key={j} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-4 h-4 rounded object-cover" />
                                  ) : (
                                    <Package className="w-3 h-3 text-slate-400" />
                                  )}
                                  <span style={{ color: "#374151" }}>{item.name}</span>
                                  {item.quantity > 1 && <span className="text-slate-400">×{item.quantity}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                              style={{ background: "#ECFDF5", color: "#065F46" }}>
                              <CheckCircle2 className="w-3 h-3" />
                              Delivered
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-3">
                {/* Stocked products from requests */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Products Stocked</p>
                  {!detail?.requests?.some((r: StockRequest) => r.status === "stocked") ? (
                    <div className="text-center py-8 rounded-xl" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                      <Archive className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">No stocked requests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detail?.requests
                        .filter((r: StockRequest) => r.status === "stocked")
                        .flatMap((r: StockRequest) => r.items.map(item => ({ ...item, stockedAt: r.stockedAt })))
                        .reduce((acc: any[], item: any) => {
                          const existing = acc.find(a => a.productName === item.productName);
                          if (existing) { existing.quantity += item.quantity; }
                          else { acc.push({ ...item }); }
                          return acc;
                        }, [])
                        .map((item: any, i: number) => {
                          const saleInfo = sales?.productSummary?.find((s: any) =>
                            s.productName?.toLowerCase() === item.productName?.toLowerCase()
                          );
                          const soldQty = saleInfo?.totalSold || 0;
                          const remaining = item.quantity - soldQty;
                          return (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                              style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-white/70" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: "#1e1b4b" }}>{item.productName}</p>
                                <p className="text-xs text-slate-400">{item.game}</p>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0 text-xs text-right">
                                <div>
                                  <p className="font-bold" style={{ color: "#1D4ED8" }}>{item.quantity}</p>
                                  <p className="text-slate-400">stocked</p>
                                </div>
                                <div>
                                  <p className="font-bold text-emerald-600">{soldQty}</p>
                                  <p className="text-slate-400">sold</p>
                                </div>
                                <div>
                                  <p className="font-bold" style={{ color: remaining > 0 ? "#374151" : "#9ca3af" }}>{Math.max(0, remaining)}</p>
                                  <p className="text-slate-400">left</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Recent requests summary */}
                {detail?.requests?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent Requests</p>
                    <div className="space-y-1.5">
                      {detail.requests.slice(0, 5).map((r: StockRequest) => (
                        <div key={r._id} className="flex items-center justify-between p-2.5 rounded-xl text-xs"
                          style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                          <span className="text-slate-600">{r.game} · {r.items.length} item{r.items.length !== 1 ? "s" : ""}</span>
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
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StockerCard({ stocker }: { stocker: Stocker }) {
  const [showModal, setShowModal] = useState(false);

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

  return (
    <>
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
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "#EEF2FF", color: "#6366f1", border: "1px solid #C7D2FE" }}
              >
                Details
                <ChevronRight className="w-3 h-3" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <SalesModal stocker={stocker} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
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
