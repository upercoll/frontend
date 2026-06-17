import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { adminApi } from "../../api";
import type { StockRequest } from "../../types";
import { Archive, Package, ClipboardList } from "lucide-react";
import { Link } from "wouter";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending:  { bg: "#FEF9C3", text: "#854D0E" },
  approved: { bg: "#EFF6FF", text: "#1D4ED8" },
  stocked:  { bg: "#ECFDF5", text: "#065F46" },
  rejected: { bg: "#FEF2F2", text: "#DC2626" },
};

export default function StockerHistory() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["stocker-requests"],
    queryFn: adminApi.stockerPanel.getMyRequests,
  });

  const allRequests = data?.data.requests || [];
  const requests = statusFilter ? allRequests.filter(r => r.status === statusFilter) : allRequests;

  return (
    <div className="p-6 space-y-5 max-w-[900px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>My Requests</h2>
          <p className="text-sm text-slate-500 mt-0.5">All your stock requests and their status</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ background: "white", border: "1px solid #E9EBF5", color: "#374151" }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="stocked">Stocked</option>
            <option value="rejected">Rejected</option>
          </select>
          <Link href="/stocker/request">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#1e1b4b" }}
            >
              <ClipboardList className="w-4 h-4" />
              New Request
            </motion.button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "white", border: "1px solid #E9EBF5" }} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ border: "1px solid #E9EBF5" }}>
          <Archive className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 text-sm">No requests found</p>
          <Link href="/stocker/request">
            <span className="text-sm text-indigo-500 hover:underline cursor-pointer">Submit your first request →</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: StockRequest, i: number) => {
            const st = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
            return (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl p-4"
                style={{ border: "1px solid #E9EBF5" }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    <Archive className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "#1e1b4b" }}>{req.game}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: st.bg, color: st.text }}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {req.items.length} item{req.items.length !== 1 ? "s" : ""} ·{" "}
                      <span className="font-semibold text-emerald-600">${req.totalSaleValue.toFixed(2)}</span> projected value
                      {req.commission > 0 && ` · $${req.commission.toFixed(2)} commission`}
                    </p>
                    <p className="text-[10px] text-slate-300 mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {req.status === "approved" && (
                      <div className="text-xs px-2 py-1 rounded-lg text-blue-600 font-medium"
                        style={{ background: "#EFF6FF" }}>
                        Payment: ${req.paymentAmount.toFixed(2)}
                      </div>
                    )}
                    {req.status === "stocked" && (
                      <div className="text-xs px-2 py-1 rounded-lg text-emerald-600 font-medium"
                        style={{ background: "#ECFDF5" }}>
                        ✓ Stocked
                      </div>
                    )}
                    {req.adminNotes && (
                      <p className="text-[10px] text-slate-400 mt-1 max-w-32 text-right">{req.adminNotes}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {req.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                      style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.productName} className="w-4 h-4 rounded object-cover" />
                      )}
                      {!item.imageUrl && <Package className="w-3 h-3 text-slate-400" />}
                      <span style={{ color: "#374151" }}>{item.productName}</span>
                      <span className="text-slate-400">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
