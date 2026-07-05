import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, DollarSign, Package, Clock, CheckCircle, CircleDollarSign } from "lucide-react";
import { delivererGet } from "@/pages/DelivererLayout";

function fmt(n: number) { return `$${n.toFixed(2)}`; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

export default function DelivererHistory() {
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

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white">My Deliveries</h2>
        <p className="text-sm mt-0.5 text-white/40">All deliveries and your commission earnings</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Unpaid Commission", value: fmt(d?.totalCommission ?? 0), color: "#a78bfa" },
          { label: "Unpaid Revenue",    value: fmt(d?.totalRevenue ?? 0),    color: "#4ade80" },
          { label: "Total Delivered",   value: d?.totalDelivered ?? 0,       color: "#7dd3fc" },
          { label: "Rate",              value: `${d?.commissionRate ?? 20}%`, color: "#fbbf24" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-white font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
            <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold text-sm">Delivery History ({records.length})</h3>
        </div>
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-white/25 text-sm">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-20" />
            No deliveries yet
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {records.map((r: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: r.paidOut ? "rgba(74,222,128,0.1)" : "rgba(14,165,233,0.1)" }}>
                  {r.paidOut
                    ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : <Truck className="w-5 h-5 text-sky-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-semibold">{r.robloxUsername || "Unknown"}</p>
                    {r.paidOut && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>Paid</span>
                    )}
                  </div>
                  <p className="text-white/35 text-xs mt-0.5">
                    {r.game || "—"} · {r.items?.length ?? 0} item{r.items?.length !== 1 ? "s" : ""}
                    {r.orderNumber ? ` · #${r.orderNumber}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <p className="text-emerald-400 text-sm font-bold">{fmt(r.commission)}</p>
                  <p className="text-white/25 text-[10px]">of {fmt(r.orderTotal)} order</p>
                  <p className="text-white/20 text-[10px]">{fmtDate(r.deliveredAt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
