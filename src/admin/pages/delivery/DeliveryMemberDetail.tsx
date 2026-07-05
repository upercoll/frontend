import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Truck, DollarSign, CheckCircle, Clock, Package,
  Loader2, AlertCircle, Settings, X, ChevronLeft,
} from "lucide-react";
import { adminApi } from "../../api";

function fmt(n: number) { return `$${Number(n || 0).toFixed(2)}`; }
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function EditCommissionModal({ deliverer, onClose }: { deliverer: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [rate, setRate] = useState(deliverer.commissionRate ?? 20);
  const [error, setError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => adminApi.delivery.update(deliverer._id, { commissionRate: rate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["delivery-member", deliverer._id] }); qc.invalidateQueries({ queryKey: ["delivery-team"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="w-full max-w-xs rounded-2xl p-6"
        style={{ background: "#0d1525", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold">Edit Commission Rate</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-white/50">Commission Rate (%)</label>
            <input type="number" min={0} max={100} value={rate} onChange={e => setRate(Number(e.target.value))}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
            <p className="text-white/25 text-xs mt-1">This affects future deliveries only</p>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)" }}>Cancel</button>
            <button onClick={() => mutate()} disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DeliveryMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showEditComm, setShowEditComm] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paidMsg, setPaidMsg] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["delivery-member", id],
    queryFn: () => adminApi.delivery.get(id),
  });

  const d = data?.data?.deliverer;
  const records: any[] = data?.data?.records || [];
  const stats = data?.data?.stats;

  const handleMarkPaid = async () => {
    if (!confirm(`Mark all unpaid deliveries as paid for ${d?.name || d?.email}? This will reset their unpaid tracking.`)) return;
    setMarkingPaid(true); setPaidMsg("");
    try {
      const res = await adminApi.delivery.markPaid(id);
      setPaidMsg(`Paid ${fmt(res.data?.paidCommission ?? 0)} commission on ${fmt(res.data?.paidRevenue ?? 0)} revenue`);
      qc.invalidateQueries({ queryKey: ["delivery-member", id] });
      qc.invalidateQueries({ queryKey: ["delivery-team"] });
    } catch (err: any) {
      setPaidMsg("Error: " + err.message);
    } finally {
      setMarkingPaid(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-32 rounded-xl bg-white/5" />
        <div className="h-32 rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!d) return <div className="text-white/40 text-sm p-8">Deliverer not found</div>;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <AnimatePresence>{showEditComm && <EditCommissionModal deliverer={d} onClose={() => setShowEditComm(false)} />}</AnimatePresence>

      <Link href="/admin/delivery-team">
        <button className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Delivery Team
        </button>
      </Link>

      {/* Header card */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-xl"
          style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "#fff" }}>
          {(d.name || d.email)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg">{d.name || d.email}</h2>
          <p className="text-white/40 text-sm">{d.email}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: d.status === "active" ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)", color: d.status === "active" ? "#4ade80" : "#fbbf24" }}>
              {d.status}
            </span>
            <span className="text-white/35 text-xs">{d.commissionRate}% commission</span>
            {d.lastLogin && <span className="text-white/25 text-xs">Last login: {fmtDate(d.lastLogin)}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setShowEditComm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Settings className="w-3.5 h-3.5" /> Commission
          </button>
          <button onClick={handleMarkPaid} disabled={markingPaid || (d.totalRevenue || 0) === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-colors"
            style={{ background: "rgba(74,222,128,0.9)", border: "1px solid rgba(74,222,128,0.4)" }}>
            {markingPaid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Mark as Paid
          </button>
        </div>
      </div>

      {paidMsg && (
        <div className="px-4 py-3 rounded-xl text-sm text-emerald-400 flex items-center gap-2"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {paidMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Unpaid Revenue",    value: fmt(stats?.totalRevenue ?? 0),    color: "#4ade80" },
          { label: "Unpaid Commission", value: fmt(stats?.totalCommission ?? 0),  color: "#a78bfa" },
          { label: "Lifetime Revenue",  value: fmt(stats?.lifetimeRevenue ?? 0),  color: "#7dd3fc" },
          { label: "Total Deliveries",  value: stats?.totalDeliveries ?? 0,       color: "#fbbf24" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
            <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Delivery records — orders-style */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Delivery Records ({records.length})</h3>
          {d.lastPayoutAt && <span className="text-white/30 text-xs">Last paid: {fmtDate(d.lastPayoutAt)}</span>}
        </div>
        {records.length === 0 ? (
          <div className="py-12 text-center text-white/25 text-sm">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-20" /> No deliveries recorded
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {records.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: r.paidOut ? "rgba(74,222,128,0.08)" : "rgba(14,165,233,0.08)" }}>
                  {r.paidOut
                    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                    : <Clock className="w-4 h-4 text-sky-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-semibold">{r.robloxUsername || "Unknown"}</p>
                    {r.paidOut
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>Paid</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(14,165,233,0.1)", color: "#7dd3fc" }}>Unpaid</span>}
                  </div>
                  <p className="text-white/35 text-xs mt-0.5">
                    {r.game || "—"}
                    {r.items?.length > 0 && ` · ${r.items.map((it: any) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(", ")}`}
                  </p>
                  {r.orderNumber && <p className="text-white/20 text-[10px] mt-0.5 font-mono">#{r.orderNumber}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-emerald-400 text-sm font-bold">{fmt(r.commission)}</p>
                  <p className="text-white/25 text-[10px]">{r.commissionRate}% of {fmt(r.orderTotal)}</p>
                  <p className="text-white/20 text-[10px] mt-0.5">{fmtDate(r.deliveredAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
