import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Package, CheckCircle2, Loader2, Clock, ChevronDown, ChevronUp } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "";
function getToken() { return localStorage.getItem("stocker_token") || ""; }
async function apiGet(path: string) {
  const res = await fetch(`${BASE}/api/stocker${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function fmt(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function StockerDashboard() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeliveries, setShowDeliveries] = useState(false);

  const load = () => {
    const token = getToken();
    if (!token) { navigate("/stocker/login"); return; }
    setLoading(true);
    Promise.all([
      apiGet("/auth/me"),
      apiGet("/payouts"),
    ])
      .then(([meRes, payoutsRes]) => {
        setData({ stocker: meRes.data?.stocker || meRes.data?.user, ...payoutsRes.data });
      })
      .catch(err => {
        if (err.message.includes("401") || err.message.toLowerCase().includes("invalid")) {
          localStorage.removeItem("stocker_token"); navigate("/stocker/login");
        } else { setError(err.message); }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#a78bfa" }} />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-32">
      <p style={{ color: "rgba(255,255,255,0.4)" }}>{error}</p>
    </div>
  );

  const stocker = data?.stocker;
  const unpaidAmount: number = data?.unpaidAmount || 0;
  const totalPaid: number = data?.totalPaid || 0;
  const unpaidDeliveries: any[] = data?.unpaidDeliveries || [];
  const payouts: any[] = data?.payouts || [];

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-white mb-1">Welcome back, {stocker?.name?.split(" ")[0] || "Stocker"}!</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Track your commission earnings and delivery history below.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending Payout", value: `$${unpaidAmount.toFixed(2)}`, icon: Clock, color: "#fbbf24", sub: "awaiting payment" },
          { label: "Total Paid Out", value: `$${totalPaid.toFixed(2)}`, icon: CheckCircle2, color: "#4ade80", sub: "all time" },
          { label: "Commission Rate", value: `${stocker?.commissionRate || 0}%`, icon: TrendingUp, color: "#a78bfa", sub: "per delivery" },
          { label: "Deliveries Pending", value: unpaidDeliveries.length, icon: Package, color: "#60a5fa", sub: "in current period" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}20`, border: `1px solid ${stat.color}30` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.sub}</p>
          </div>
        ))}
      </motion.div>

      {stocker?.cryptoAddress && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="rounded-2xl px-5 py-3 flex items-center gap-3"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: "#a5b4fc" }} />
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
            Payout address: <span className="font-mono text-white">{stocker.cryptoAddress}</span>
            {stocker.cryptoNetwork && <span style={{ color: "rgba(255,255,255,0.4)" }}> · {stocker.cryptoNetwork}</span>}
          </p>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          className="w-full px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: showDeliveries ? "1px solid rgba(255,255,255,0.06)" : "none" }}
          onClick={() => setShowDeliveries(v => !v)}>
          <div>
            <h2 className="font-bold text-white text-sm text-left">
              Current Period — {unpaidDeliveries.length} Deliveries
            </h2>
            <p className="text-xs text-left mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {unpaidAmount > 0
                ? `$${unpaidAmount.toFixed(2)} commission pending — admin will mark as paid when processed`
                : "No pending deliveries in this period"}
            </p>
          </div>
          {showDeliveries ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />}
        </button>
        {showDeliveries && (
          unpaidDeliveries.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "#a78bfa" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No deliveries in the current period yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Date", "Player", "Game", "Items", "Revenue", "Commission"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unpaidDeliveries.map((d: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{fmt(d.deliveredAt)}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-white">{d.robloxUsername}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>{d.game || "-"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {(d.items || []).map((it: any) => `${it.name} ×${it.quantity || 1}`).join(", ")}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-white">${(d.revenue || 0).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "#4ade80" }}>${(d.commission || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="font-bold text-white text-sm">Payout History ({payouts.length})</h2>
        </div>
        {payouts.length === 0 ? (
          <div className="p-10 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "#4ade80" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No payouts yet. Keep delivering!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Paid On", "Period", "Deliveries", "Amount", "Rate"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{fmt(p.createdAt)}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {fmt(p.periodStart)} → {fmt(p.periodEnd)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-white">{p.deliveryCount}</td>
                    <td className="px-5 py-3.5 text-sm font-bold" style={{ color: "#4ade80" }}>${p.amount.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{p.commissionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
