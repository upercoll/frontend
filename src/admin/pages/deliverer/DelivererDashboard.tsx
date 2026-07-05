import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Package, Clock, Truck, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { delivererGet } from "@/pages/DelivererLayout";

function fmt(n: number) { return `$${n.toFixed(2)}`; }
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DelivererDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    delivererGet("/stats")
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const d = data?.deliverer;
  const records: any[] = data?.recentDeliveries || [];

  const stats = [
    { label: "Unpaid Revenue",   value: fmt(d?.totalRevenue ?? 0),    icon: DollarSign, color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.15)" },
    { label: "Unpaid Commission",value: fmt(d?.totalCommission ?? 0),  icon: TrendingUp, color: "#a78bfa", bg: "rgba(167,139,250,0.08)",  border: "rgba(167,139,250,0.15)" },
    { label: "Total Delivered",  value: d?.totalDelivered ?? 0,        icon: Package,    color: "#7dd3fc", bg: "rgba(125,211,252,0.08)",  border: "rgba(125,211,252,0.15)" },
    { label: "Commission Rate",  value: `${d?.commissionRate ?? 20}%`, icon: Truck,      color: "#fbbf24", bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.15)" },
  ];

  if (loading) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white">Welcome back, {d?.name || "Deliverer"} 👋</h2>
        <p className="text-sm mt-0.5 text-white/40">Here's your delivery summary</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <s.icon className="w-4 h-4" style={{ color: s.color }} />
            <div>
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {d?.lastPayoutAt && (
        <p className="text-white/30 text-xs">
          Last payout: {new Date(d.lastPayoutAt).toLocaleDateString()} · Lifetime revenue: {fmt(d.lifetimeRevenue ?? 0)} · Lifetime commission: {fmt(d.lifetimeCommission ?? 0)}
        </p>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold text-sm">Recent Deliveries</h3>
          <Link href="/deliverer/history">
            <span className="text-sky-400 text-xs cursor-pointer hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></span>
          </Link>
        </div>
        {records.length === 0 ? (
          <div className="py-12 text-center text-white/30 text-sm">No deliveries yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {records.slice(0, 8).map((r, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(14,165,233,0.15)" }}>
                  <Truck className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{r.robloxUsername || "Unknown"}</p>
                  <p className="text-white/30 text-xs">{r.game || "—"} · {r.items?.length ?? 0} item{r.items?.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-emerald-400 text-sm font-semibold">{fmt(r.commission)}</p>
                  <p className="text-white/25 text-xs">{timeAgo(r.deliveredAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/deliverer/queue">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="flex items-center justify-between rounded-2xl px-5 py-4 cursor-pointer"
          style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.15),rgba(2,132,199,0.08))", border: "1px solid rgba(14,165,233,0.2)" }}>
          <div className="flex items-center gap-3">
            <MessageSquareIcon />
            <div>
              <p className="text-white font-semibold text-sm">Go to Claim Queue</p>
              <p className="text-white/40 text-xs">Pick up and deliver pending chats</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-sky-400" />
        </motion.div>
      </Link>
    </div>
  );
}

function MessageSquareIcon() {
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(14,165,233,0.2)" }}>
      <Package className="w-5 h-5 text-sky-400" />
    </div>
  );
}
