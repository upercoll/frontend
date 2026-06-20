import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { StockRequest } from "../../types";
import {
  Archive, Package, ClipboardList, ShoppingBag, User, Calendar,
  CheckCircle2, Loader2, X, ChevronRight, DollarSign, Layers,
  Clock, AlertCircle, BadgeCheck,
} from "lucide-react";
import { Link } from "wouter";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  pending:  { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047", icon: Clock,        label: "Pending" },
  approved: { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD", icon: CheckCircle2, label: "Approved" },
  stocked:  { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7", icon: BadgeCheck,   label: "Stocked" },
  rejected: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", icon: AlertCircle,  label: "Rejected" },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface DetailModalProps {
  req: StockRequest;
  deliveries: any[];
  onClose: () => void;
}

function RequestDetailModal({ req, deliveries, onClose }: DetailModalProps) {
  const st = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
  const StatusIcon = st.icon;

  const reqProductNames = new Set(req.items.map(i => i.productName?.toLowerCase()).filter(Boolean));
  const matchedDeliveries = deliveries.filter(d =>
    (d.items || []).some((it: any) => reqProductNames.has(it.name?.toLowerCase()))
  );

  const timeline = [
    { label: "Submitted", date: req.createdAt, done: true },
    { label: "Approved", date: (req as any).approvedAt, done: req.status !== "pending" && req.status !== "rejected" },
    { label: "Stocked", date: (req as any).stockedAt, done: req.status === "stocked" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 14 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ border: "1px solid #E9EBF5" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <Archive className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base" style={{ color: "#1e1b4b" }}>Stock Request — {req.game}</h3>
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                  <StatusIcon className="w-3 h-3" />
                  {st.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Submitted {fmtDate(req.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-3"
            style={{ background: "#F7F8FC", color: "#6b7280" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
              <p className="text-lg font-bold" style={{ color: "#1e1b4b" }}>
                {req.items.reduce((s, i) => s + i.quantity, 0)}
              </p>
              <p className="text-xs text-slate-400">Total Units</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "#ECFDF5", border: "1px solid #6EE7B7" }}>
              <p className="text-lg font-bold text-emerald-600">${req.totalSaleValue.toFixed(2)}</p>
              <p className="text-xs" style={{ color: "#065F46" }}>Total Value</p>
            </div>
            {req.commission > 0 ? (
              <div className="rounded-xl p-3 text-center" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                <p className="text-lg font-bold text-indigo-600">${req.commission.toFixed(2)}</p>
                <p className="text-xs text-indigo-400">Commission ({req.commissionRate}%)</p>
              </div>
            ) : (
              <div className="rounded-xl p-3 text-center" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                <p className="text-lg font-bold" style={{ color: "#1e1b4b" }}>{req.items.length}</p>
                <p className="text-xs text-slate-400">Product Types</p>
              </div>
            )}
          </div>

          {req.status !== "pending" && (
            <div className="flex items-center gap-0">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: step.done ? (req.status === "rejected" && i === 1 ? "#FEE2E2" : "#ECFDF5") : "#F3F4F6",
                        border: `2px solid ${step.done ? (req.status === "rejected" && i === 1 ? "#FECACA" : "#6EE7B7") : "#E5E7EB"}`,
                      }}>
                      {step.done && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: req.status === "rejected" && i === 1 ? "#DC2626" : "#059669" }} />}
                    </div>
                    <p className="text-[10px] font-semibold mt-1 text-center" style={{ color: step.done ? "#374151" : "#9CA3AF" }}>{step.label}</p>
                    {step.date && step.done && (
                      <p className="text-[9px] text-slate-300 text-center">{fmtDate(step.date)}</p>
                    )}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="h-0.5 flex-1 mb-5" style={{ background: timeline[i + 1].done ? "#6EE7B7" : "#E5E7EB" }} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Requested Items</p>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                    {["Product", "Game", "Qty", "Unit Price", "Total"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {req.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: i < req.items.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName}
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                              style={{ background: (item as any).gradient ? `linear-gradient(135deg,${(item as any).gradient.from},${(item as any).gradient.to})` : "#E9EBF5" }}>
                              <Package className="w-4 h-4 text-white/70" />
                            </div>
                          )}
                          <p className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{item.productName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "#EEF2FF", color: "#4f46e5" }}>
                          {(item as any).game || req.game}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#1e1b4b" }}>×{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        ${item.salePrice != null ? Number(item.salePrice).toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600 text-right">
                        ${item.totalSaleValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(req.adminNotes || req.paymentAmount > 0 || (req as any).stockedBy || (req as any).approvedAt || (req as any).stockedAt || (req as any).rejectedAt) && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Request Details</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {req.paymentAmount > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-slate-500">Payment to you:</span>
                    <span className="font-semibold text-blue-600">${req.paymentAmount.toFixed(2)}</span>
                  </div>
                )}
                {(req as any).stockedBy && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-500">Stocked by:</span>
                    <span className="font-semibold" style={{ color: "#1e1b4b" }}>{(req as any).stockedBy}</span>
                  </div>
                )}
                {(req as any).approvedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-500">Approved:</span>
                    <span className="font-semibold" style={{ color: "#1e1b4b" }}>{fmtDate((req as any).approvedAt)}</span>
                  </div>
                )}
                {(req as any).stockedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-500">Stocked:</span>
                    <span className="font-semibold" style={{ color: "#1e1b4b" }}>{fmtDate((req as any).stockedAt)}</span>
                  </div>
                )}
                {(req as any).rejectedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="text-slate-500">Rejected:</span>
                    <span className="font-semibold text-red-600">{fmtDate((req as any).rejectedAt)}</span>
                  </div>
                )}
              </div>
              {req.adminNotes && (
                <div className="rounded-lg px-3 py-2.5 text-xs"
                  style={{ background: "#EFF6FF", border: "1px solid #DBEAFE", color: "#1D4ED8" }}>
                  <span className="font-semibold">Admin note: </span>{req.adminNotes}
                </div>
              )}
            </div>
          )}

          {req.status === "stocked" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Customer Deliveries
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: matchedDeliveries.length > 0 ? "#ECFDF5" : "#F3F4F6", color: matchedDeliveries.length > 0 ? "#065F46" : "#9CA3AF" }}>
                  {matchedDeliveries.length} found
                </span>
              </div>
              {matchedDeliveries.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs text-slate-400">No customer deliveries recorded for these products yet.</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Deliveries show up here once items from your stock are delivered through the claim system.</p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5" }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                        {["Customer", "Items Delivered", "Handled By", "Date"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matchedDeliveries.map((d: any, i: number) => {
                        const relevantItems = (d.items || []).filter((it: any) => reqProductNames.has(it.name?.toLowerCase()));
                        return (
                          <tr key={i} style={{ borderBottom: i < matchedDeliveries.length - 1 ? "1px solid #F3F4F6" : "none" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{d.robloxUsername}</p>
                              {d.orderRef && (
                                <p className="text-xs text-slate-400 mt-0.5">Order #{d.orderRef}</p>
                              )}
                              {d.game && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{ background: "#F3F4F6", color: "#6B7280" }}>{d.game}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-[160px]">
                              {relevantItems.map((it: any, j: number) => (
                                <div key={j} className="flex items-center gap-1.5 text-xs" style={{ color: "#374151" }}>
                                  <span className="font-medium">{it.name}</span>
                                  {it.quantity > 1 && <span className="text-slate-400">×{it.quantity}</span>}
                                </div>
                              ))}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <p className="text-sm text-slate-600">{d.agentName || "—"}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">{fmtDateTime(d.deliveredAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function StockerHistory() {
  const [activeTab, setActiveTab] = useState<"requests" | "sales">("requests");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["stocker-requests"],
    queryFn: adminApi.stockerPanel.getMyRequests,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["stocker-sold-deliveries"],
    queryFn: adminApi.stockerPanel.getSoldDeliveries,
  });

  const allRequests = data?.data.requests || [];
  const requests = statusFilter ? allRequests.filter(r => r.status === statusFilter) : allRequests;
  const deliveries: any[] = salesData?.data.deliveries || [];

  return (
    <div className="space-y-5 max-w-[900px] mx-auto">
      <AnimatePresence>
        {selectedRequest && (
          <RequestDetailModal
            req={selectedRequest}
            deliveries={deliveries}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            {activeTab === "requests" ? "My Requests" : "Sales & Deliveries"}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            {activeTab === "requests"
              ? "All your stock requests — click one to see full details"
              : "Items from your stock that have been delivered to customers"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "requests" && (
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="stocked">Stocked</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
          <Link href="/stocker/request">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "rgba(99,102,241,0.9)", border: "1px solid rgba(99,102,241,0.4)" }}
            >
              <ClipboardList className="w-4 h-4" />
              New Request
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {[
          { key: "requests", label: "My Requests", icon: Archive },
          { key: "sales", label: "Sales & Deliveries", icon: ShoppingBag },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? "rgba(255,255,255,0.1)" : "transparent",
              color: activeTab === tab.key ? "white" : "rgba(255,255,255,0.4)",
            }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.key === "sales" && deliveries.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
                {deliveries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="space-y-3"
          >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl animate-pulse"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }} />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Archive className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No requests found</p>
                <Link href="/stocker/request">
                  <span className="text-sm cursor-pointer" style={{ color: "#a5b4fc" }}>Submit your first request →</span>
                </Link>
              </div>
            ) : (
              requests.map((req: StockRequest, i: number) => {
                const st = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
                const StatusIcon = st.icon;
                return (
                  <motion.div
                    key={req._id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-2xl p-4 cursor-pointer group"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onClick={() => setSelectedRequest(req)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                        <Archive className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">{req.game}</span>
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: st.bg, color: st.text }}>
                            <StatusIcon className="w-3 h-3" />
                            {st.label}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {req.items.length} item{req.items.length !== 1 ? "s" : ""} ·{" "}
                          <span className="font-semibold text-emerald-400">${req.totalSaleValue.toFixed(2)}</span> value
                          {req.commission > 0 && (
                            <span style={{ color: "rgba(255,255,255,0.35)" }}> · ${req.commission.toFixed(2)} commission</span>
                          )}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{fmtDate(req.createdAt)}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {req.status === "approved" && (
                          <div className="text-xs px-2 py-1 rounded-lg font-medium"
                            style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>
                            ${req.paymentAmount.toFixed(2)} payment
                          </div>
                        )}
                        {req.status === "stocked" && (
                          <div className="text-xs px-2 py-1 rounded-lg font-medium"
                            style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                            ✓ Delivered
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                          style={{ color: "rgba(255,255,255,0.2)" }} />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {req.items.slice(0, 4).map((item, j) => (
                        <div key={j} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt={item.productName} className="w-4 h-4 rounded object-cover" />
                            : <Package className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />}
                          <span style={{ color: "rgba(255,255,255,0.65)" }}>{item.productName}</span>
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>×{item.quantity}</span>
                        </div>
                      ))}
                      {req.items.length > 4 && (
                        <div className="flex items-center px-2 py-1 rounded-lg text-[11px]"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                          +{req.items.length - 4} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === "sales" && (
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="space-y-3"
          >
            {salesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#a78bfa" }} />
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-20 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No deliveries recorded yet</p>
                <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Shows when items from your stock are delivered to customers through the claim system
                </p>
              </div>
            ) : (
              deliveries.map((delivery: any, i: number) => (
                <motion.div
                  key={delivery.roomId || i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                      <CheckCircle2 className="w-5 h-5" style={{ color: "#4ade80" }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white">{delivery.robloxUsername}</span>
                        {delivery.game && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
                            {delivery.game}
                          </span>
                        )}
                        {delivery.orderRef && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
                            #{delivery.orderRef}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                          Delivered
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <User className="w-3 h-3" />
                          <span style={{ color: "rgba(255,255,255,0.6)" }}>{delivery.agentName}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <Calendar className="w-3 h-3" />
                          {delivery.deliveredAt
                            ? new Date(delivery.deliveredAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                            : "Unknown date"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(delivery.items || []).map((item: any, j: number) => (
                      <div key={j} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name} className="w-4 h-4 rounded object-cover" />
                          : <Package className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />}
                        <span style={{ color: "rgba(255,255,255,0.65)" }}>{item.name}</span>
                        {item.quantity > 1 && <span style={{ color: "rgba(255,255,255,0.35)" }}>×{item.quantity}</span>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
