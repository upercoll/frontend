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
import { PageHeader } from "../components/kit";

export default function CollabPayouts() {
  const [, params] = useRoute("/admin/collaboration/payouts/:id");
  const id = params?.id || "";
  const qc = useQueryClient();
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");
  const [amount, setAmount] = useState("");

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
    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0 || payoutAmount > unpaidTotal) {
      setMarkError(`Enter an amount from $0.01 to $${unpaidTotal.toFixed(2)}`);
      return;
    }
    if (!confirm(`Mark $${payoutAmount.toFixed(2)} as paid to ${collab?.name}?`)) return;
    setMarking(true); setMarkError("");
    try {
      await adminApi.collab.markPaid(id, { amount: payoutAmount });
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
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--pn-surface-2)" }} />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/admin/collaboration/view/${id}`}>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Link>
        <PageHeader title={`Payouts — ${collab?.name}`} description={collab?.email} icon={DollarSign} />
      </div>

      {unpaidTotal > 0 && (
        <div className="bg-[var(--pn-surface)] rounded-xl p-5 flex items-center justify-between" style={{ border: "1px solid var(--pn-border)" }}>
          <div>
            <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Current Unpaid Balance</p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--pn-success-fg)" }}>${unpaidTotal.toFixed(2)} USD</p>
            <p className="text-xs text-[var(--pn-text-3)] mt-1">{unpaidSales.length} sale{unpaidSales.length !== 1 ? "s" : ""} since last payout</p>
          </div>
          <div className="flex items-end gap-2">
            <label className="text-xs text-[var(--pn-text-2)]">Amount to pay
              <input type="number" min="0.01" max={unpaidTotal} step="0.01" value={amount} placeholder={unpaidTotal.toFixed(2)}
                onChange={e => setAmount(e.target.value)} className="mt-1 block w-32 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }} />
            </label>
            {markError && <p className="text-sm text-[var(--pn-critical-text)] mb-2">{markError}</p>}
            <button onClick={handleMarkPaid} disabled={marking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--pn-success-fg)" }}>
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Pay amount
            </button>
          </div>
        </div>
      )}

      {unpaidTotal <= 0 && (
        <div className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
          <p className="text-sm text-[var(--pn-text-2)]">No unpaid balance currently.</p>
        </div>
      )}

      <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
          <h3 className="font-bold text-sm" style={{ color: "var(--pn-text)" }}>Payout History</h3>
        </div>

        {payouts.length === 0 ? (
          <div className="p-12 text-center text-[var(--pn-text-3)]">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No payouts have been made yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Period End</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Paid At</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Amount</th>
                <th className="px-5 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any, idx: number) => (
                <tr key={p._id} style={{ borderBottom: "1px solid var(--pn-border)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-5 py-3.5 text-sm font-medium text-[var(--pn-text-2)]">#{payouts.length - idx}</td>
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--pn-text)" }}>Payment to {collab?.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                      style={{ background: "var(--pn-success-bg)", color: "var(--pn-success-fg)", borderColor: "var(--pn-success-line)" }}>
                      Paid
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[var(--pn-text-2)]">{fmt(p.periodEnd)}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--pn-text-2)]">{fmt(p.paidAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold" style={{ color: "var(--pn-text)" }}>${p.amount.toFixed(2)} USD</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/collaboration/payouts/${id}/detail/${p._id}`}>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
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
