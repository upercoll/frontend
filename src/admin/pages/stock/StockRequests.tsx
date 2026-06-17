import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { StockRequest, Stocker } from "../../types";
import { ClipboardList, Check, X, Package, ChevronDown, ChevronUp, Loader2, Archive } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending:  { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  approved: { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD" },
  stocked:  { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  rejected: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
};

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
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{req.game}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                {req.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {req.items.length} item{req.items.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-semibold text-emerald-600">${req.totalSaleValue.toFixed(2)}</span> projected revenue
              {req.commission > 0 && (
                <span className="text-slate-400"> · ${req.commission.toFixed(2)} commission ({req.commissionRate}%)</span>
              )}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {req.status === "pending" && (
              <>
                <button
                  onClick={() => setApproveOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                  style={{ background: "#10B981" }}
                >
                  <Check className="w-3 h-3" />
                  Approve
                </button>
                <button
                  onClick={() => setRejectOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
                >
                  <X className="w-3 h-3" />
                  Reject
                </button>
              </>
            )}
            {req.status === "approved" && (
              <button
                onClick={() => {
                  if (window.confirm("Mark this request as stocked? This will automatically add stock to the products.")) {
                    stockedMut.mutate({});
                  }
                }}
                disabled={stockedMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: "#6366f1" }}
              >
                {stockedMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                Mark Stocked
              </button>
            )}
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
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
              className="overflow-hidden mt-4"
            >
              <div className="space-y-2 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Items</p>
                {req.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "#F7F8FC" }}>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.productName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    )}
                    {!item.imageUrl && (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: item.gradient ? `linear-gradient(135deg,${item.gradient.from},${item.gradient.to})` : "#E9EBF5" }}>
                        <Package className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#1e1b4b" }}>{item.productName}</p>
                      <p className="text-xs text-slate-400">{item.game}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold" style={{ color: "#1e1b4b" }}>× {item.quantity}</p>
                      <p className="text-xs text-emerald-600">${item.totalSaleValue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {req.adminNotes && (
                  <div className="mt-2 p-2 rounded-lg text-xs text-slate-500" style={{ background: "#F7F8FC" }}>
                    <span className="font-semibold">Admin notes:</span> {req.adminNotes}
                  </div>
                )}
                {req.paymentAmount > 0 && (
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-slate-500">Payment sent: <span className="font-semibold text-slate-700">${req.paymentAmount.toFixed(2)}</span></span>
                    {req.stockedAt && <span className="text-slate-500">Stocked by: <span className="font-semibold text-slate-700">{req.stockedBy}</span></span>}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {approveOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: "1px solid #F3F4F6", background: "#F7FFF9" }}>
              <p className="text-xs font-semibold text-emerald-700">Approve Request</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Payment amount ($) sent to stocker</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "white", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Admin notes (optional)</label>
                  <input
                    type="text" placeholder="Note..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "white", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approveMut.mutate({ paymentAmount: parseFloat(paymentAmount) || 0, adminNotes })}
                  disabled={approveMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: "#10B981" }}
                >
                  {approveMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Approval
                </button>
                <button
                  onClick={() => setApproveOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#6b7280" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {rejectOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: "1px solid #F3F4F6", background: "#FFF5F5" }}>
              <p className="text-xs font-semibold text-red-600">Reject Request</p>
              <input
                type="text" placeholder="Reason for rejection (optional)"
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: "white", border: "1px solid #FECACA", color: "#1e1b4b" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => rejectMut.mutate({ adminNotes })}
                  disabled={rejectMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: "#EF4444" }}
                >
                  {rejectMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Reject
                </button>
                <button
                  onClick={() => setRejectOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#6b7280" }}
                >
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
    <div className="p-6 space-y-5 max-w-[900px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Stock Requests</h2>
          <p className="text-sm text-slate-500 mt-0.5">Review and manage stocker inventory requests</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="stocked">Stocked</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
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
