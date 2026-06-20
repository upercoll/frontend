import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { StockRequest, Stocker } from "../../types";
import {
  ClipboardList, Check, X, Package, ChevronDown, ChevronUp,
  Loader2, Archive, User, Calendar, ShoppingBag, DollarSign,
  BadgeCheck, Clock, AlertCircle, CheckCircle2,
} from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending:  { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  approved: { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD" },
  stocked:  { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  rejected: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StockedDeliveries({ stockerId, reqItems }: { stockerId: string; reqItems: StockRequest["items"] }) {
  const [loaded, setLoaded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["stocker-sales-detail", stockerId],
    queryFn: () => adminApi.stock.getStockerSales(stockerId),
    enabled: loaded,
  });

  const reqProductNames = new Set(reqItems.map(i => i.productName?.toLowerCase()).filter(Boolean));
  const deliveries: any[] = (data?.data?.deliveries || []).filter((d: any) =>
    (d.items || []).some((it: any) => reqProductNames.has(it.name?.toLowerCase()))
  );

  if (!loaded) {
    return (
      <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
        <button
          onClick={() => setLoaded(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #DBEAFE" }}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Load Customer Deliveries
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 flex items-center gap-2 text-sm text-slate-400" style={{ borderTop: "1px solid #F3F4F6" }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading deliveries…
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Customer Deliveries</p>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: deliveries.length > 0 ? "#ECFDF5" : "#F3F4F6", color: deliveries.length > 0 ? "#065F46" : "#9CA3AF" }}>
          {deliveries.length} found
        </span>
      </div>
      {deliveries.length === 0 ? (
        <div className="rounded-xl p-5 text-center" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
          <ShoppingBag className="w-7 h-7 mx-auto mb-1.5 text-slate-200" />
          <p className="text-xs text-slate-400">No customer deliveries recorded for these products yet.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                {["Customer", "Order Ref", "Items Delivered", "Agent", "Date"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d: any, i: number) => {
                const relevantItems = (d.items || []).filter((it: any) => reqProductNames.has(it.name?.toLowerCase()));
                return (
                  <tr key={i} style={{ borderBottom: i < deliveries.length - 1 ? "1px solid #F3F4F6" : "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold" style={{ color: "#1e1b4b" }}>{d.robloxUsername}</p>
                      {d.game && <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: "#EEF2FF", color: "#4f46e5" }}>{d.game}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {d.orderRef ? <span style={{ color: "#1D4ED8" }}>#{d.orderRef}</span> : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[160px]">
                      {relevantItems.map((it: any, j: number) => (
                        <span key={j} className="block">
                          {it.name} ×{it.quantity || 1}
                        </span>
                      ))}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600">{d.agentName || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{fmtDateTime(d.deliveredAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RequestRow({ req }: { req: StockRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const qc = useQueryClient();

  const approveMut = useMutation({
    mutationFn: (data: { paymentAmount?: number; adminNotes?: string }) =>
      adminApi.stock.approveRequest(req._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock-requests"] }); setApproveOpen(false); },
    onError: (e: Error) => alert(e.message),
  });

  const stockedMut = useMutation({
    mutationFn: (data: { adminNotes?: string }) => adminApi.stock.markStocked(req._id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-requests"] }),
    onError: (e: Error) => alert(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: (data: { adminNotes?: string }) => adminApi.stock.rejectRequest(req._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock-requests"] }); setRejectOpen(false); },
    onError: (e: Error) => alert(e.message),
  });

  const st = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
  const stocker = typeof req.stocker === "object" ? req.stocker as Stocker : null;
  const stockerId = stocker?._id || (typeof req.stocker === "string" ? req.stocker : "");

  const timeline = [
    { label: "Submitted", date: req.createdAt, done: true },
    { label: "Approved",  date: (req as any).approvedAt, done: ["approved","stocked"].includes(req.status) },
    { label: "Stocked",   date: (req as any).stockedAt,  done: req.status === "stocked" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <Archive className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: "#1e1b4b" }}>
                {req.stockerName || req.stockerEmail}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs font-medium" style={{ background: "#EEF2FF", color: "#4f46e5", padding: "1px 8px", borderRadius: 6 }}>{req.game}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                {req.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {req.items.length} item{req.items.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-semibold text-emerald-600">${req.totalSaleValue.toFixed(2)}</span> value
              {req.commission > 0 && (
                <span className="text-slate-400"> · ${req.commission.toFixed(2)} commission ({req.commissionRate}%)</span>
              )}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">{fmtDate(req.createdAt)}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {req.status === "pending" && (
              <>
                <button onClick={() => setApproveOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: "#10B981" }}>
                  <Check className="w-3 h-3" /> Approve
                </button>
                <button onClick={() => setRejectOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  <X className="w-3 h-3" /> Reject
                </button>
              </>
            )}
            {req.status === "approved" && (
              <button
                onClick={() => { if (window.confirm("Mark as stocked? This will add stock to the products.")) stockedMut.mutate({}); }}
                disabled={stockedMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                style={{ background: "#6366f1" }}>
                {stockedMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                Mark Stocked
              </button>
            )}
            <button onClick={() => setExpanded(e => !e)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#6b7280" }}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4">
              <div className="space-y-4 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>

                {req.status !== "pending" && (
                  <div className="flex items-center gap-0">
                    {timeline.map((step, i) => (
                      <div key={step.label} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: step.done ? "#ECFDF5" : "#F3F4F6",
                              border: `2px solid ${step.done ? "#6EE7B7" : "#E5E7EB"}`,
                            }}>
                            {step.done && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          </div>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: step.done ? "#374151" : "#9CA3AF" }}>{step.label}</p>
                          {step.date && step.done && (
                            <p className="text-[9px] text-slate-300">{fmtDate(step.date)}</p>
                          )}
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="h-0.5 flex-1 mb-4" style={{ background: timeline[i + 1].done ? "#6EE7B7" : "#E5E7EB" }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Items Requested</p>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5" }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                          {["Product", "Game", "Qty", "Unit Price", "Total"].map(h => (
                            <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wide text-slate-400 last:text-right">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {req.items.map((item, i) => (
                          <tr key={i} style={{ borderBottom: i < req.items.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.productName} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                                    style={{ background: (item as any).gradient ? `linear-gradient(135deg,${(item as any).gradient.from},${(item as any).gradient.to})` : "#E9EBF5" }}>
                                    <Package className="w-3.5 h-3.5 text-white/70" />
                                  </div>
                                )}
                                <span className="font-semibold" style={{ color: "#1e1b4b" }}>{item.productName}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#EEF2FF", color: "#4f46e5" }}>
                                {(item as any).game || req.game}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-semibold" style={{ color: "#1e1b4b" }}>×{item.quantity}</td>
                            <td className="px-3 py-2.5 text-slate-500">
                              ${item.salePrice != null ? Number(item.salePrice).toFixed(2) : "—"}
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-emerald-600 text-right">
                              ${item.totalSaleValue.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {(req.adminNotes || req.paymentAmount > 0 || (req as any).stockedBy) && (
                  <div className="rounded-xl p-3 space-y-2" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Details</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
                      {req.paymentAmount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-slate-500">Payment sent:</span>
                          <span className="font-semibold text-blue-600">${req.paymentAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {(req as any).stockedBy && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-500">Stocked by:</span>
                          <span className="font-semibold" style={{ color: "#1e1b4b" }}>{(req as any).stockedBy}</span>
                        </div>
                      )}
                      {(req as any).stockedAt && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-500">Stocked:</span>
                          <span className="font-semibold" style={{ color: "#1e1b4b" }}>{fmtDate((req as any).stockedAt)}</span>
                        </div>
                      )}
                    </div>
                    {req.adminNotes && (
                      <div className="rounded-lg px-3 py-2 text-xs"
                        style={{ background: "#EFF6FF", border: "1px solid #DBEAFE", color: "#1D4ED8" }}>
                        <span className="font-semibold">Note: </span>{req.adminNotes}
                      </div>
                    )}
                  </div>
                )}

                {req.status === "stocked" && stockerId && (
                  <StockedDeliveries stockerId={stockerId} reqItems={req.items} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {approveOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid #F3F4F6", background: "#F7FFF9" }}>
              <p className="text-xs font-semibold text-emerald-700">Approve Request</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Payment amount ($) to stocker</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "white", border: "1px solid #E9EBF5", color: "#1e1b4b" }} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Admin notes (optional)</label>
                  <input type="text" placeholder="Note…"
                    value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "white", border: "1px solid #E9EBF5", color: "#1e1b4b" }} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveMut.mutate({ paymentAmount: parseFloat(paymentAmount) || 0, adminNotes })}
                  disabled={approveMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: "#10B981" }}>
                  {approveMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Approval
                </button>
                <button onClick={() => setApproveOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#6b7280" }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {rejectOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid #F3F4F6", background: "#FFF5F5" }}>
              <p className="text-xs font-semibold text-red-600">Reject Request</p>
              <input type="text" placeholder="Reason for rejection (optional)"
                value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: "white", border: "1px solid #FECACA", color: "#1e1b4b" }} />
              <div className="flex gap-2">
                <button onClick={() => rejectMut.mutate({ adminNotes })}
                  disabled={rejectMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: "#EF4444" }}>
                  {rejectMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Reject
                </button>
                <button onClick={() => setRejectOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#6b7280" }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StockRequests() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["stock-requests", statusFilter],
    queryFn: () => adminApi.stock.listRequests(statusFilter ? { status: statusFilter } : undefined),
  });

  const requests = data?.data.requests || [];

  return (
    <div className="p-6 space-y-5 max-w-[960px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Stock Requests</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Review and manage stocker inventory requests — expand to see full item details and customer deliveries
          </p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="stocked">Stocked</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ border: "1px solid #E9EBF5" }}>
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 text-sm">No stock requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <RequestRow key={req._id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}
