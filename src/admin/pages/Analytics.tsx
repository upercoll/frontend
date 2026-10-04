import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  Banknote, ShoppingBag, ReceiptText, Target, Globe,
  TrendingUp, Trophy, Gamepad2, Layers, Activity,
} from "lucide-react";
import { adminApi } from "../api";
import {
  PageHeader, Card, CardHeader, MetricTile, Badge, Segmented,
  EmptyState, MetricSkeleton,
} from "../components/kit";

const PERIODS = [
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "This year", value: "year" },
  { label: "All time", value: "all" },
];

const BAR_COLORS = [
  "var(--pn-action)", "var(--pn-success-fg)", "var(--pn-warning-fg)",
  "var(--pn-critical)", "var(--pn-info-fg)", "var(--pn-border-strong)",
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Unpaid", partially_refunded: "Partial refund",
};

export default function Analytics() {
  const reduce = useReducedMotion();
  const [period, setPeriod] = useState("month");
  const [chartPeriod, setChartPeriod] = useState<"monthly" | "daily">("monthly");

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
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
  const { data: trafficData } = useQuery({
    queryKey: ["analytics-traffic"],
    queryFn: adminApi.analytics.traffic,
  });

  const summary = summaryData?.data;
  const conversion = conversionData?.data;
  const chart = chartData?.data?.chart || [];
  const byGame = byGameData?.data?.byGame || [];
  const topProducts = topProductsData?.data?.topProducts || [];
  const trafficChart = trafficData?.data?.chart || [];
  const trafficSummary = trafficData?.data?.summary;
  const maxTrafficValue = Math.max(...trafficChart.map((d: any) => Math.max(d.newCustomers, d.orderAttempts)), 1);
  const maxRevenue = Math.max(...chart.map((c: any) => c.revenue), 1);
  const totalGameRevenue = byGame.reduce((sum: number, g: any) => sum + g.revenue, 0);

  const statusBreakdown = summary?.statusBreakdown as Record<string, number> | undefined;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">

      <PageHeader
        title="Analytics"
        description="Sales performance and business insights"
        eyebrow="Insights"
      >
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
      </PageHeader>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {summaryLoading ? <MetricSkeleton count={4} /> : (
          <>
            <MetricTile label="Revenue" value={`$${(summary?.revenue || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                        delta={summary?.revenueGrowth} hint="vs previous period" icon={Banknote} />
            <MetricTile label="Orders" value={(summary?.orders || 0).toLocaleString()}
                        delta={summary?.ordersGrowth} hint="vs previous period" icon={ShoppingBag} />
            <MetricTile label="Avg. order value" value={`$${(summary?.avgOrderValue || 0).toFixed(2)}`} hint="revenue ÷ orders" icon={ReceiptText} />
            <MetricTile label="Conversion rate" value={`${conversion?.conversionRate || 0}%`} hint="checkout completion" icon={Target} />
          </>
        )}
      </div>

      {/* ── Checkout funnel ── */}
      {conversion && (
        <Card>
          <CardHeader title="Checkout funnel" subtitle="Every order attempt, end to end" icon={TrendingUp} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4" style={{ background: "var(--pn-surface-2)" }}>
            <MetricTile label="Total checkouts" value={conversion.totalOrders.toLocaleString()} icon={ShoppingBag} />
            <MetricTile label="Successful payments" value={conversion.paidOrders.toLocaleString()} icon={Banknote} />
            <MetricTile label="Abandonment rate" value={`${conversion.abandonmentRate}%`} icon={Target}
                        hint={conversion.abandonmentRate > 30 ? "worth investigating" : "healthy"} />
          </div>
        </Card>
      )}

      {/* ── Status breakdown ── */}
      {statusBreakdown && (
        <Card>
          <CardHeader title="Order status" subtitle={`Breakdown for the selected period`} icon={Layers} />
          <div className="pn-cardbody flex flex-wrap gap-2">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const tone = status === "completed" ? "success"
                : status === "cancelled" ? "critical"
                : status === "pending" ? "warning"
                : status === "refunded" ? "neutral" : "action";
              return (
                <Badge key={status} tone={tone} dot>
                  {STATUS_LABEL[status] || status} · {Number(count).toLocaleString()}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Revenue chart ── */}
      <Card>
        <CardHeader
          title="Revenue"
          subtitle={chartPeriod === "monthly" ? "By month" : "Last 30 days"}
          icon={TrendingUp}
          action={
            <Segmented
              value={chartPeriod}
              onChange={setChartPeriod}
              options={[
                { label: "Monthly", value: "monthly" as const },
                { label: "Daily (30d)", value: "daily" as const },
              ]}
            />
          }
        />
        <div className="pn-cardbody">
          {chart.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No revenue data yet" body="Bars appear once orders start landing in this period." />
          ) : (
            <>
              <div className="flex items-end gap-1 h-40">
                {chart.map((point: any, i: number) => {
                  const height = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
                  return (
                    <motion.div
                      key={i}
                      initial={reduce ? false : { height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: reduce ? 0 : i * 0.02, duration: 0.4 }}
                      className="flex-1 rounded-t-sm relative group cursor-pointer"
                      style={{ background: "var(--pn-action)", minHeight: point.revenue > 0 ? 2 : 0 }}
                    >
                      {point.revenue > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10"
                             style={{ background: "var(--pn-text)", boxShadow: "var(--pn-shadow-pop)" }}>
                          ${point.revenue.toFixed(0)}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                {chart.filter((_: any, i: number) => chartPeriod === "monthly" || i % 7 === 0).map((point: any, i: number) => (
                  <span key={i} className="text-[10px]" style={{ color: "var(--pn-text-3)" }}>
                    {point.month || point.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ── Site traffic ── */}
      {trafficSummary && (
        <Card>
          <CardHeader
            title="Site traffic (last 30 days)"
            subtitle="New customer signups & order activity"
            icon={Globe}
            action={
              <span className="flex items-center gap-5 text-right">
                {[
                  { v: trafficSummary.newCustomers30d, l: "New customers", c: "var(--pn-success-fg)" },
                  { v: trafficSummary.orderAttempts30d, l: "Order attempts", c: "var(--pn-action)" },
                  { v: trafficSummary.totalCustomers, l: "Total customers", c: "var(--pn-text)" },
                ].map(s => (
                  <span key={s.l} className="leading-tight">
                    <b className="block text-[15px] font-semibold" style={{ color: s.c }}>{s.v.toLocaleString()}</b>
                    <span className="text-[10.5px]" style={{ color: "var(--pn-text-3)" }}>{s.l}</span>
                  </span>
                ))}
              </span>
            }
          />
          <div className="pn-cardbody">
            {trafficChart.length === 0 ? (
              <EmptyState icon={Globe} title="No traffic data yet" body="Daily signups and order attempts will chart here." />
            ) : (
              <>
                <div className="flex items-end gap-0.5 h-32 mb-2">
                  {trafficChart.map((point: any, i: number) => {
                    const customerH = maxTrafficValue > 0 ? (point.newCustomers / maxTrafficValue) * 100 : 0;
                    const orderH = maxTrafficValue > 0 ? (point.orderAttempts / maxTrafficValue) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex items-end gap-px relative group">
                        <motion.div
                          initial={reduce ? false : { height: 0 }}
                          animate={{ height: `${orderH}%` }}
                          transition={{ delay: reduce ? 0 : i * 0.01, duration: 0.3 }}
                          className="flex-1 rounded-t-sm"
                          style={{ background: "var(--pn-action-tint)", minHeight: point.orderAttempts > 0 ? 1 : 0 }}
                        />
                        <motion.div
                          initial={reduce ? false : { height: 0 }}
                          animate={{ height: `${customerH}%` }}
                          transition={{ delay: reduce ? 0 : i * 0.01, duration: 0.3 }}
                          className="flex-1 rounded-t-sm"
                          style={{ background: "var(--pn-success-fg)", minHeight: point.newCustomers > 0 ? 1 : 0 }}
                        />
                        {(point.newCustomers > 0 || point.orderAttempts > 0) && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block text-white text-[10px] rounded px-2 py-1.5 whitespace-nowrap z-10 pointer-events-none"
                               style={{ background: "var(--pn-text)", boxShadow: "var(--pn-shadow-pop)" }}>
                            <div className="font-semibold">{point.label}</div>
                            <div style={{ color: "#7ff1bb" }}>+{point.newCustomers} customers</div>
                            <div style={{ color: "#99c7ff" }}>{point.orderAttempts} orders</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between">
                  {trafficChart.filter((_: any, i: number) => i % 7 === 0).map((point: any, i: number) => (
                    <span key={i} className="text-[10px]" style={{ color: "var(--pn-text-3)" }}>{point.label}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--pn-divider)" }}>
                  <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--pn-text-2)" }}>
                    <span className="w-3 h-2 rounded-sm" style={{ background: "var(--pn-success-fg)" }} /> New customers
                  </span>
                  <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--pn-text-2)" }}>
                    <span className="w-3 h-2 rounded-sm" style={{ background: "var(--pn-action-tint)" }} /> Order attempts
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* ── Breakdowns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Revenue by game" subtitle="Share of total revenue" icon={Gamepad2} />
          <div className="pn-cardbody">
            {byGame.length === 0 ? (
              <EmptyState icon={Gamepad2} title="No game revenue yet" body="Revenue splits out per title once orders complete." />
            ) : (
              <div className="space-y-4">
                {byGame.map((g: any, i: number) => {
                  const pct = totalGameRevenue > 0 ? (g.revenue / totalGameRevenue) * 100 : 0;
                  return (
                    <div key={g._id || i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-medium flex items-center gap-2" style={{ color: "var(--pn-text)" }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                          {g._id || "Unknown"}
                        </span>
                        <span className="text-[13px] font-semibold" style={{ color: "var(--pn-text)" }}>
                          ${g.revenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--pn-surface-2)" }}>
                        <motion.div
                          initial={reduce ? false : { width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: reduce ? 0 : i * 0.08, ease: [0.19, 1, 0.22, 1] }}
                          className="h-full rounded-full"
                          style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                        />
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "var(--pn-text-3)" }}>
                        {g.orders} orders · {pct.toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top products" subtitle="Best sellers by revenue" icon={Trophy} />
          <div className="pn-cardbody">
            {topProducts.length === 0 ? (
              <EmptyState icon={Trophy} title="No product data yet" body="Best sellers rank up here once they sell." />
            ) : (
              <div className="space-y-3">
                {topProducts.slice(0, 8).map((p: any, i: number) => (
                  <div key={p._id || i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{
                            background: i < 3 ? "var(--pn-primary)" : "var(--pn-surface-2)",
                            color: i < 3 ? "#fff" : "var(--pn-text-2)",
                          }}>
                      {i + 1}
                    </span>
                    <span className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                          style={{
                            background: p.gradient
                              ? `linear-gradient(135deg,${p.gradient.from},${p.gradient.to})`
                              : "var(--pn-surface-2)",
                            border: "1px solid var(--pn-border)",
                          }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-[11px] font-bold" style={{ color: "var(--pn-text-2)" }}>{(p.name || "?")[0]}</span>}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium truncate" style={{ color: "var(--pn-text)" }}>{p.name}</span>
                      <span className="block text-xs truncate" style={{ color: "var(--pn-text-3)" }}>{p.game} · {p.totalSold} sold</span>
                    </span>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--pn-success-fg)" }}>
                      ${p.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {!summaryLoading && !summary && (
        <Card>
          <EmptyState icon={Activity} title="No analytics yet" body="Pick a different period, or wait for your first orders." />
        </Card>
      )}
    </div>
  );
}
