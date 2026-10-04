import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { adminApi } from "../api";
import { Segmented, EmptyState, Skeleton } from "./kit";

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--pn-surface)", border: "1px solid var(--pn-border)",
      borderRadius: 8, padding: "8px 10px", boxShadow: "var(--pn-shadow-pop)",
    }}>
      <p style={{ fontSize: 11, color: "var(--pn-text-3)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: "var(--pn-text)" }}>
          {p.name === "revenue" ? `$${p.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart() {
  const [period, setPeriod] = useState<"monthly" | "daily">("monthly");
  const [year] = useState(new Date().getFullYear());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["panel-revenue-chart", period, year],
    queryFn: () => adminApi.analytics.revenue(period, year),
  });

  const chart = data?.data.chart || [];
  const total = chart.reduce((s: number, p: any) => s + (p.revenue || 0), 0);

  return (
    <>
      <div className="pn-cardhead">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-action)" }}>
          <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate">Revenue</h3>
          <p className="truncate">
            {period === "monthly" ? `Jan – Dec ${year}` : "Last 30 days"}
            {total > 0 && <> · ${total.toLocaleString("en-US", { maximumFractionDigits: 0 })} total</>}
          </p>
        </div>
        <Segmented
          value={period}
          onChange={setPeriod}
          options={[
            { label: "Monthly", value: "monthly" as const },
            { label: "30 days", value: "daily" as const },
          ]}
        />
      </div>

      <div className="pn-cardbody">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[240px] w-full" />
          </div>
        ) : isError || chart.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No revenue data yet"
            body="Revenue will be charted here once orders start coming in."
          />
        ) : (
          <ResponsiveContainer width="100%" height={248}>
            <AreaChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
              <defs>
                <linearGradient id="pnRevFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--pn-action)" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="var(--pn-action)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--pn-divider)" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey={period === "monthly" ? "month" : "label"}
                tick={{ fill: "var(--pn-text-3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={18}
              />
              <YAxis
                tick={{ fill: "var(--pn-text-3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={54}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v}`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--pn-border-strong)" }} />
              <ReferenceLine y={0} stroke="var(--pn-border)" />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--pn-action)"
                strokeWidth={2}
                fill="url(#pnRevFill)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--pn-action)", stroke: "var(--pn-surface)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}
