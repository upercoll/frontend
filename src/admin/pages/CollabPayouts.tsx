import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRoute, Link } from "wouter";
import { DollarSign, ChevronLeft, Loader2, Eye, CheckCircle } from "lucide-react";
import { adminApi } from "../api";

function fmt(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CollabPayouts() {
  const [, params] = useRoute("/admin/collaboration/payouts/:id");
  const id = params?.id || "";
  const qc = useQueryClient();
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["collab-payouts", id],
    queryFn: () => adminApi.collab.getCollaboratorPayouts(id),
    enabled: !!id,
  });

  const collab = (data as any)?.data?.collaborator;
  const payouts: any[] = (data as any)?.data?.payouts || [];
  const unpaidTotal: number = (data as any)?.data?.unpaidTotal || 0;
  const unpaidSales: any[] = (data as any)?.data?.unpaidSales || [];

  const handleMarkPaid = async () => {
    if (!confirm(`Mark $${unpaidTotal.toFixed(2)} as paid to ${collab?.name}?`)) return;
    setMarking(true); setMarkError("");
    try {
      await adminApi.collab.markPaid(id);
      qc.invalidateQueries({ queryKey: ["collab-payouts", id] });
      qc.invalidateQueries({ queryKey: ["collab-view", id] });
      qc.invalidateQueries({ queryKey: ["collab-list"] });
      qc.invalidateQueries({ queryKey: ["collab-all-payouts"] });
    } catch (err: any) {
      setMarkError(err.message || "Failed to mark as paid");
    } finally {
      setMarking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-3 max-w-[1000px] mx-auto">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/admin/collaboration/view/${id}`}>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Payouts — {collab?.name}</h2>
          <p className="text-sm text-slate-500">{collab?.email}</p>
        </div>
      </div>

      {unpaidTotal > 0 && (
        <div className="bg-white rounded-xl p-5 flex items-center justify-between" style={{ border: "1px solid #E9EBF5" }}>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Current Unpaid Balance</p>
            <p className="text-3xl font-bold mt-1" style={{ color: "#059669" }}>${unpaidTotal.toFixed(2)} USD</p>
            <p className="text-xs text-slate-400 mt-1">{unpaidSales.length} sale{unpaidSales.length !== 1 ? "s" : ""} since last payout</p>
          </div>
          <div>
            {markError && <p className="text-sm text-red-600 mb-2">{markError}</p>}
            <button onClick={handleMarkPaid} disabled={marking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#059669" }}>
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark as Paid
            </button>
          </div>
        </div>
      )}

      {unpaidTotal <= 0 && (
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <p className="text-sm text-slate-500">No unpaid balance currently.</p>
        </div>
      )}

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <h3 className="font-bold text-sm" style={{ color: "#1e1b4b" }}>Payout History</h3>
        </div>

        {payouts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No payouts have been made yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Period End</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Paid At</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Amount</th>
                <th className="px-5 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any, idx: number) => (
                <tr key={p._id} style={{ borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-500">#{payouts.length - idx}</td>
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "#1e1b4b" }}>Payment to {collab?.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                      style={{ background: "#D1FAE5", color: "#065F46", borderColor: "#6EE7B7" }}>
                      Paid
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{fmt(p.periodEnd)}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{fmt(p.paidAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold" style={{ color: "#1e1b4b" }}>${p.amount.toFixed(2)} USD</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/collaboration/payouts/${id}/detail/${p._id}`}>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#EEF2FF", color: "#4f46e5" }}>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
