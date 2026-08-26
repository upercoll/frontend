import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { adminApi } from "../api";

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a1628] border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white text-sm font-medium">
          {p.name === "revenue" ? `$${p.value.toFixed(2)}` : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart() {
  const [period, setPeriod] = useState<"monthly" | "daily">("monthly");
  const [year] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["panel-revenue-chart", period, year],
    queryFn: () => adminApi.analytics.revenue(period, year),
  });

  const chart = data?.data.chart || [];

  return (
    <div className="bg-[#0d1f3c] border border-white/5 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold">Revenue Overview</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            {period === "monthly" ? `Jan – Dec ${year}` : "Last 30 days"}
          </p>
        </div>
        <div className="flex gap-2">
          {(["monthly", "daily"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {p === "monthly" ? "Monthly" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis
              dataKey={period === "monthly" ? "month" : "label"}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#revGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
