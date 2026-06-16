import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, BarChart3, Zap, Target, Percent } from "lucide-react";
import { adminApi } from "../api";

const PERIODS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

function StatCard({ icon: Icon, label, value, growth, prefix = "", color = "#4f46e5" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  growth?: number;
  prefix?: string;
  color?: string;
}) {
  const isPositive = (growth || 0) >= 0;
  return (
    <div className="bg-white rounded-xl p-5 transition-shadow hover:shadow-md" style={{ border: "1px solid #E9EBF5" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {growth !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: "#1e1b4b" }}>{prefix}{typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState("month");
  const [chartPeriod, setChartPeriod] = useState<"monthly" | "daily">("monthly");

  const { data: summaryData } = useQuery({
    queryKey: ["analytics-summary", period],
    queryFn: () => adminApi.analytics.salesSummary(period),
  });

  const { data: conversionData } = useQuery({
    queryKey: ["analytics-conversion"],
    queryFn: adminApi.analytics.conversion,
  });

  const { data: chartData } = useQuery({
    queryKey: ["analytics-chart", chartPeriod],
    queryFn: () => adminApi.analytics.revenue(chartPeriod),
  });

  const { data: byGameData } = useQuery({
    queryKey: ["analytics-by-game"],
    queryFn: adminApi.analytics.byGame,
  });

  const { data: topProductsData } = useQuery({
    queryKey: ["analytics-top-products"],
    queryFn: adminApi.analytics.topProducts,
  });

  const summary = summaryData?.data;
  const conversion = conversionData?.data;
  const chart = chartData?.data?.chart || [];
  const byGame = byGameData?.data?.byGame || [];
  const topProducts = topProductsData?.data?.topProducts || [];

  const maxRevenue = Math.max(...chart.map((c: any) => c.revenue), 1);
  const totalGameRevenue = byGame.reduce((sum: number, g: any) => sum + g.revenue, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">Sales performance and business insights</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={period === p.value
                ? { background: "#1e1b4b", color: "#fff" }
                : { color: "#6b7280" }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign} label="Revenue" value={summary?.revenue || 0}
          growth={summary?.revenueGrowth} prefix="$" color="#4f46e5"
        />
        <StatCard
          icon={ShoppingBag} label="Orders" value={summary?.orders || 0}
          growth={summary?.ordersGrowth} color="#0ea5e9"
        />
        <StatCard
          icon={BarChart3} label="Avg. Order Value" value={summary?.avgOrderValue || 0}
          prefix="$" color="#8b5cf6"
        />
        <StatCard
          icon={Target} label="Conversion Rate" value={`${conversion?.conversionRate || 0}%`}
          color="#10b981"
        />
      </div>

      {conversion && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Total Checkouts</p>
            <p className="text-2xl font-bold" style={{ color: "#1e1b4b" }}>{conversion.totalOrders.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Successful Payments</p>
            <p className="text-2xl font-bold text-emerald-600">{conversion.paidOrders.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Abandonment Rate</p>
            <p className="text-2xl font-bold text-red-500">{conversion.abandonmentRate}%</p>
          </div>
        </div>
      )}

      {summary?.statusBreakdown && (
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#1e1b4b" }}>Order Status Breakdown</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(summary.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                <span className="text-sm font-semibold capitalize" style={{ color: "#1e1b4b" }}>{status === "pending" ? "Unpaid" : status}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold" style={{ color: "#1e1b4b" }}>Revenue Chart</h3>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
            {(["monthly", "daily"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className="px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize"
                style={chartPeriod === p ? { background: "#1e1b4b", color: "#fff" } : { color: "#6b7280" }}
              >
                {p === "monthly" ? "Monthly" : "Daily (30d)"}
              </button>
            ))}
          </div>
        </div>
        {chart.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-300">No data</div>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {chart.map((point: any, i: number) => {
              const height = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.02, duration: 0.4 }}
                  className="flex-1 rounded-t-sm relative group cursor-pointer"
                  style={{ background: "linear-gradient(to top, #4f46e5, #818cf8)", minHeight: point.revenue > 0 ? 2 : 0 }}
                >
                  {point.revenue > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#1e1b4b] text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10 shadow-lg">
                      ${point.revenue.toFixed(0)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        <div className="flex justify-between mt-2">
          {chart.filter((_: any, i: number) => chartPeriod === "monthly" || i % 7 === 0).map((point: any, i: number) => (
            <span key={i} className="text-[9px] text-slate-300">
              {point.month || point.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#1e1b4b" }}>Revenue by Game</h3>
          {byGame.length === 0 ? (
            <p className="text-slate-300 text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {byGame.map((g: any, i: number) => {
                const pct = totalGameRevenue > 0 ? (g.revenue / totalGameRevenue) * 100 : 0;
                const colors = ["#4f46e5", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
                const col = colors[i % colors.length];
                return (
                  <div key={g._id || i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "#374151" }}>{g._id || "Unknown"}</span>
                      <span className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>${g.revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-[#F7F8FC] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: col }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{g.orders} orders · {pct.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#1e1b4b" }}>Top Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-slate-300 text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 8).map((p: any, i: number) => (
                <div key={p._id || i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#92400e" : "#E9EBF5", color: i < 3 ? "#fff" : "#6b7280" }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#1e1b4b" }}>{p.name}</p>
                    <p className="text-xs text-slate-400">{p.game} · {p.totalSold} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">${p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
