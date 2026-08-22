import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
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
    <div className="bg-white border-2 rounded-xl p-3" style={{ borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}>
      <p className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "#8a8375" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold font-mono">
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
    <div className="rounded-xl p-5 sm:p-6" style={{ background: "#F7F4EC", border: "2px solid #131313" }}>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-lg uppercase tracking-wide">Revenue Overview</h3>
          <p className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#8a8375" }}>
            {period === "monthly" ? `Jan – Dec ${year}` : "Last 30 days"}
          </p>
        </div>
        <div className="flex gap-2">
          {(["monthly", "daily"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider border-2 transition-all ${
                period === p ? "text-white" : "hover:bg-[#131313] hover:text-white"
              }`}
              style={
                period === p
                  ? { background: "#131313", color: "#F2EEE5", borderColor: "#131313" }
                  : { background: "#fff", color: "#6B655C", borderColor: "#131313" }
              }
            >
              {p === "monthly" ? "Monthly" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-[3px] rounded-full animate-spin" style={{ borderColor: "rgba(19,19,19,.15)", borderTopColor: "#E2231A" }} />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#13131314" />
            <XAxis
              dataKey={period === "monthly" ? "month" : "label"}
              tick={{ fill: "#8a8375", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8a8375", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#E2231A"
              strokeWidth={2.5}
              fill="#E2231A"
              fillOpacity={0.08}
              dot={false}
              activeDot={{ r: 5, fill: "#E2231A", stroke: "#131313", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
