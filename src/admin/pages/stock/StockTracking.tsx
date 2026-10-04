import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { Stocker, StockRequest } from "../../types";
import {
  Users, Plus, X, Loader2, Archive, TrendingUp, Package, Mail,
  ChevronDown, ChevronUp, Edit2, Trash2, DollarSign, CheckCircle2, Clock,
} from "lucide-react";

const inp = "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]";
const inpStyle = { background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" };
const labelStyle = "block text-xs font-semibold mb-1.5 text-[var(--pn-text-2)]";

interface EditModalProps {
  stocker: Stocker;
  onClose: () => void;
}
import { PageHeader, MetricTile } from "../../components/kit";

function EditModal({ stocker, onClose }: EditModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState(stocker.name || "");
  const [commissionRate, setCommissionRate] = useState(String(stocker.commissionRate));
  const [cryptoAddress, setCryptoAddress] = useState((stocker as any).cryptoAddress || "");
  const [cryptoNetwork, setCryptoNetwork] = useState((stocker as any).cryptoNetwork || "");
  const [status, setStatus] = useState(stocker.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await adminApi.stock.updateStocker(stocker._id, {
        name,
        commissionRate: parseFloat(commissionRate) || 0,
        cryptoAddress,
        cryptoNetwork,
        status,
      });
      qc.invalidateQueries({ queryKey: ["stock-stockers"] });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        className="pn-modal w-full max-w-md"
        style={{ border: "1px solid var(--pn-border)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
          <h3 className="font-bold text-lg" style={{ color: "var(--pn-text)" }}>Edit Stocker</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className={labelStyle}>Display Name</label>
            <input className={inp} style={inpStyle} value={name} onChange={e => setName(e.target.value)} placeholder={stocker.email} />
          </div>
          <div>
            <label className={labelStyle}>Commission Rate (%)</label>
            <input className={inp} style={inpStyle} type="number" min="0" max="100" step="0.1"
              value={commissionRate} onChange={e => setCommissionRate(e.target.value)} />
            <p className="text-xs text-[var(--pn-text-3)] mt-1">Commission percentage on delivered items</p>
          </div>
          <div>
            <label className={labelStyle}>Crypto Address (payout)</label>
            <input className={inp} style={inpStyle} value={cryptoAddress} onChange={e => setCryptoAddress(e.target.value)}
              placeholder="e.g. 0x1234... or wallet address" />
          </div>
          <div>
            <label className={labelStyle}>Crypto Network / Notes</label>
            <input className={inp} style={inpStyle} value={cryptoNetwork} onChange={e => setCryptoNetwork(e.target.value)}
              placeholder="e.g. ETH, BTC, USDT TRC20" />
          </div>
          <div>
            <label className={labelStyle}>Status</label>
            <select className={inp} style={inpStyle} value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          {error && (
            <div className="text-sm rounded-xl px-4 py-3" style={{ background: "var(--pn-critical-bg)", border: "1px solid var(--pn-critical-line)", color: "var(--pn-critical-text)" }}>
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "var(--pn-primary)" }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

interface PayoutModalProps {
  stocker: Stocker;
  onClose: () => void;
}

function PayoutModal({ stocker, onClose }: PayoutModalProps) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["stocker-payouts", stocker._id],
    queryFn: () => adminApi.stock.getStockerPayouts(stocker._id),
  });

  const payoutData = data?.data;
  const unpaidAmount: number = payoutData?.unpaidAmount || 0;
  const unpaidDeliveries: any[] = payoutData?.unpaidDeliveries || [];
  const payouts: any[] = payoutData?.payouts || [];

  const handleMarkPaid = async () => {
    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0 || payoutAmount > unpaidAmount) {
      setError(`Enter an amount from $0.01 to $${unpaidAmount.toFixed(2)}`);
      return;
    }
    if (!confirm(`Mark $${payoutAmount.toFixed(2)} as paid to ${stocker.name || stocker.email}?`)) return;
    setMarking(true); setError("");
    try {
      await adminApi.stock.markStockerPaid(stocker._id, { notes, amount: payoutAmount });
      qc.invalidateQueries({ queryKey: ["stocker-payouts", stocker._id] });
      qc.invalidateQueries({ queryKey: ["stock-stockers"] });
    } catch (err: any) {
      setError(err.message || "Failed to mark as paid");
    } finally {
      setMarking(false);
    }
  };

  function fmt(date: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        className="pn-modal w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ border: "1px solid var(--pn-border)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--pn-border)" }}>
          <div>
            <h3 className="font-bold text-lg" style={{ color: "var(--pn-text)" }}>Payouts — {stocker.name || stocker.email}</h3>
            <p className="text-xs text-[var(--pn-text-3)] mt-0.5">{stocker.commissionRate}% commission rate</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--pn-action)" }} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Pending Payout", value: `$${unpaidAmount.toFixed(2)}`, color: "var(--pn-warning-fg)", bg: "var(--pn-warning-bg)", icon: Clock },
                { label: "Deliveries (period)", value: unpaidDeliveries.length, color: "var(--pn-info-fg)", bg: "var(--pn-action-tint)", icon: Package },
                { label: "Total Payouts", value: payouts.length, color: "var(--pn-success-fg)", bg: "var(--pn-success-bg)", icon: CheckCircle2 },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: s.color, opacity: 0.8 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {(payoutData as any)?.stocker?.cryptoAddress && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "var(--pn-action-tint)", border: "1px solid var(--pn-action-border)" }}>
                <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: "var(--pn-action)" }} />
                <div className="text-sm">
                  <span className="font-medium" style={{ color: "var(--pn-text)" }}>Crypto: </span>
                  <span className="font-mono text-xs" style={{ color: "var(--pn-action)" }}>{(payoutData as any).stocker.cryptoAddress}</span>
                  {(payoutData as any).stocker.cryptoNetwork && (
                    <span className="text-[var(--pn-text-3)] text-xs"> · {(payoutData as any).stocker.cryptoNetwork}</span>
                  )}
                </div>
              </div>
            )}

            {unpaidAmount > 0 && (
              <div className="rounded-xl p-4" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
                <p className="text-xs font-semibold text-[var(--pn-text-2)] uppercase tracking-wide mb-3">Mark as Paid</p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-[var(--pn-text-3)] mb-1">Amount to pay</label>
                    <input type="number" min="0.01" max={unpaidAmount} step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder={unpaidAmount.toFixed(2)} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                      style={inpStyle} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[var(--pn-text-3)] mb-1">Notes (optional)</label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                      style={inpStyle} value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Payment notes, tx hash, etc." />
                  </div>
                  <button onClick={handleMarkPaid} disabled={marking}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 flex-shrink-0"
                    style={{ background: "var(--pn-success-fg)" }}>
                    {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Pay amount
                  </button>
                </div>
                {error && <p className="text-xs mt-2" style={{ color: "var(--pn-critical-text)" }}>{error}</p>}
              </div>
            )}

            {unpaidDeliveries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide mb-2">Current Period Deliveries</p>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                        {["Date", "Player", "Items", "Revenue", "Commission"].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidDeliveries.map((d: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--pn-border)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                          <td className="px-3 py-2.5 text-[var(--pn-text-2)]">{fmt(d.deliveredAt)}</td>
                          <td className="px-3 py-2.5 font-medium" style={{ color: "var(--pn-text)" }}>{d.robloxUsername}</td>
                          <td className="px-3 py-2.5 text-[var(--pn-text-2)] max-w-[180px] truncate">
                            {(d.items || []).map((it: any) => `${it.name || "Item"}×${Number.isFinite(it.quantity) && it.quantity > 0 ? it.quantity : 1}`).join(", ")}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-[var(--pn-success-fg)]">${(d.revenue || 0).toFixed(2)}</td>
                          <td className="px-3 py-2.5 font-semibold text-[var(--pn-action)]">${(d.commission || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {payouts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide mb-2">Payout History</p>
                <div className="space-y-2">
                  {payouts.map((p: any) => (
                    <div key={p._id} className="flex items-center justify-between px-4 py-3 rounded-xl text-sm"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[var(--pn-success-fg)] flex-shrink-0" />
                        <div>
                          <p className="font-semibold" style={{ color: "var(--pn-text)" }}>${p.amount.toFixed(2)}</p>
                          <p className="text-xs text-[var(--pn-text-3)]">{p.deliveryCount} deliveries · {fmt(p.periodStart)} → {fmt(p.periodEnd)}</p>
                          {p.notes && <p className="text-xs text-[var(--pn-text-3)] italic">{p.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right text-xs text-[var(--pn-text-3)]">
                        <p>Paid {fmt(p.createdAt)}</p>
                        {p.markedPaidBy && <p>by {p.markedPaidBy}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payouts.length === 0 && unpaidDeliveries.length === 0 && (
              <div className="text-center py-10">
                <DollarSign className="w-10 h-10 mx-auto mb-2 text-[var(--pn-text-3)]" />
                <p className="text-[var(--pn-text-3)] text-sm">No payouts or deliveries yet.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StockerCard({ stocker }: { stocker: Stocker }) {
  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPayouts, setShowPayouts] = useState(false);

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["stocker-detail", stocker._id],
    queryFn: () => adminApi.stock.getStockerDetail(stocker._id),
    enabled: expanded,
  });

  const qc = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: () => adminApi.stock.deleteStocker(stocker._id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-stockers"] }),
    onError: (e: Error) => alert(e.message),
  });

  const detail = detailData?.data;

  return (
    <>
      <AnimatePresence>
        {showEdit && <EditModal stocker={stocker} onClose={() => setShowEdit(false)} />}
        {showPayouts && <PayoutModal stocker={stocker} onClose={() => setShowPayouts(false)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="pn-modal"
        style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--pn-action)" }}>
              <span className="text-white text-sm font-bold">
                {(stocker.name || stocker.email)[0].toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm" style={{ color: "var(--pn-text)" }}>
                  {stocker.name || stocker.email.split("@")[0]}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: stocker.status === "active" ? "var(--pn-success-bg)" : stocker.status === "invited" ? "var(--pn-warning-bg)" : "var(--pn-surface-2)",
                    color: stocker.status === "active" ? "var(--pn-success-fg)" : stocker.status === "invited" ? "var(--pn-warning-fg)" : "var(--pn-text-2)",
                  }}>
                  {stocker.status}
                </span>
              </div>
              <p className="text-xs text-[var(--pn-text-3)] mt-0.5">{stocker.email}</p>
            </div>

            <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-center">
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--pn-text)" }}>{stocker.stockedCount ?? 0}</p>
                <p className="text-[10px] text-[var(--pn-text-3)]">stocked</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--pn-success-fg)]">${Number((stocker as any).totalRevenue || 0).toFixed(2)}</p>
                <p className="text-[10px] text-[var(--pn-text-3)]">revenue</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--pn-action)]">${Number((stocker as any).totalCommissionOwed || 0).toFixed(2)}</p>
                <p className="text-[10px] text-[var(--pn-text-3)]">owed</p>
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--pn-text)" }}>{stocker.commissionRate}%</p>
                <p className="text-[10px] text-[var(--pn-text-3)]">rate</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowPayouts(true)}
                title="View payouts"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "var(--pn-success-bg)", color: "var(--pn-success-fg)", border: "1px solid var(--pn-success-line)" }}>
                <DollarSign className="w-3 h-3" /> Payouts
              </button>
              <button
                onClick={() => setShowEdit(true)}
                title="Edit stocker"
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Permanently remove ${stocker.name || stocker.email}? This will disable their account.`)) {
                    deleteMut.mutate();
                  }
                }}
                title="Delete stocker"
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--pn-critical-bg)", color: "var(--pn-critical-text)" }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setExpanded(e => !e)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}>
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
                className="overflow-hidden">
                <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--pn-border)" }}>
                  {detailLoading ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--pn-text-3)]">
                      <Loader2 className="w-4 h-4 animate-spin" />Loading history...
                    </div>
                  ) : detail ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Total Requests", value: detail.stats.totalRequests, color: "var(--pn-text)" },
                          { label: "Pending", value: detail.stats.pendingRequests, color: "var(--pn-warning-fg)" },
                          { label: "Stocked", value: detail.stats.stockedRequests, color: "var(--pn-success-fg)" },
                          { label: "Items Stocked", value: detail.stocker.totalStocked, color: "var(--pn-info-fg)" },
                        ].map(s => (
                          <div key={s.label} className="text-center p-2 rounded-xl" style={{ background: "var(--pn-surface-2)" }}>
                            <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px] text-[var(--pn-text-3)]">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      {detail.requests.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide mb-2">Recent Requests</p>
                          <div className="space-y-1.5">
                            {detail.requests.slice(0, 5).map((r: StockRequest) => (
                              <div key={r._id} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ background: "var(--pn-surface-2)" }}>
                                <span className="text-[var(--pn-text-2)]">{r.game} · {r.items.length} items</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[var(--pn-text-2)] font-semibold">Stock value: ${Number(r.totalSaleValue || 0).toFixed(2)}</span>
                                  <span className="px-1.5 py-0.5 rounded-full font-medium text-[10px]"
                                    style={{
                                      background: r.status === "stocked" ? "var(--pn-success-bg)" : r.status === "pending" ? "var(--pn-warning-bg)" : r.status === "approved" ? "var(--pn-action-tint)" : "var(--pn-critical-bg)",
                                      color: r.status === "stocked" ? "var(--pn-success-fg)" : r.status === "pending" ? "var(--pn-warning-fg)" : r.status === "approved" ? "var(--pn-info-fg)" : "var(--pn-critical-text)",
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
      <PageHeader title="Stocker Tracking" description="Manage stocker accounts, commissions, and payouts" icon={Users}>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setShowInvite(true); setInviteError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--pn-primary)" }}>
          <Plus className="w-4 h-4" />
          Invite Stocker
        </motion.button>
      </PageHeader>

      {stockers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Stockers", value: stockers.length, icon: Users, color: "var(--pn-action)" },
            { label: "Delivered-Sale Revenue", value: `$${stockers.reduce((s, t) => s + Number((t as any).totalRevenue || 0), 0).toFixed(2)}`, icon: TrendingUp, color: "var(--pn-success-fg)" },
            { label: "Commission Currently Owed", value: `$${stockers.reduce((s, t) => s + Number((t as any).totalCommissionOwed || 0), 0).toFixed(2)}`, icon: Package, color: "var(--pn-warning-fg)" },
          ].map(stat => (
            <MetricTile key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }} />
          ))}
        </div>
      ) : stockers.length === 0 ? (
        <div className="text-center py-20 pn-modal" style={{ border: "1px solid var(--pn-border)" }}>
          <Users className="w-12 h-12 mx-auto mb-3 text-[var(--pn-text-3)]" />
          <p className="text-[var(--pn-text-3)] text-sm">No stockers yet. Invite someone to get started.</p>
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
            onClick={() => setShowInvite(false)}>
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="pn-modal w-full max-w-md"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                <h3 className="font-bold text-lg" style={{ color: "var(--pn-text)" }}>Invite Stocker</h3>
                <button onClick={() => setShowInvite(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pn-text-3)]" />
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required
                      placeholder="stocker@example.com"
                      className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Name (optional)</label>
                  <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                    placeholder="Display name"
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Commission Rate (%)</label>
                  <input type="number" min="0" max="100" value={inviteRate} onChange={e => setInviteRate(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
                  <p className="text-xs text-[var(--pn-text-3)] mt-1">Commission percentage on actual deliveries</p>
                </div>
                {inviteError && (
                  <div className="text-sm rounded-xl px-4 py-3" style={{ background: "var(--pn-critical-bg)", border: "1px solid var(--pn-critical-line)", color: "var(--pn-critical-text)" }}>
                    {inviteError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowInvite(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={inviteMut.isPending}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "var(--pn-primary)" }}>
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
