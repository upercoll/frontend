import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  Banknote, ShoppingBag, Inbox, Radio, Wallet, Users, Boxes,
  ReceiptText, TrendingUp, ArrowUpRight, CircleCheck, Timer,
  Headset, Target, Layers,
} from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "../api";
import RevenueChart from "../components/RevenueChart";
import {
  PageHeader, Card, CardHeader, CardBody, MetricTile, Badge,
  ListRow, EmptyState, MetricSkeleton, RowSkeleton, Skeleton,
} from "../components/kit";
import type { Order } from "../types";

const STATUS_META: Record<string, { label: string; tone: "success" | "warning" | "action" | "critical" | "neutral" }> = {
  pending:            { label: "Unpaid",            tone: "warning" },
  paid:               { label: "Paid",              tone: "action" },
  delivering:         { label: "Delivering",        tone: "action" },
  completed:          { label: "Completed",         tone: "success" },
  cancelled:          { label: "Cancelled",         tone: "critical" },
  refunded:           { label: "Refunded",          tone: "neutral" },
  partially_refunded: { label: "Partial refund",    tone: "warning" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, tone: "neutral" as const };
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
}

const STATUS_ORDER = ["completed", "paid", "delivering", "pending", "cancelled", "refunded", "partially_refunded"];

export default function Dashboard() {
  const reduce = useReducedMotion();

  const { data, isLoading } = useQuery({
    queryKey: ["panel-dashboard"],
    queryFn: adminApi.analytics.dashboard,
    refetchInterval: 30000,
  });

  const { data: summaryData } = useQuery({
    queryKey: ["analytics-summary", "all"],
    queryFn: () => adminApi.analytics.salesSummary("all"),
    refetchInterval: 60000,
  });

  const stats = data?.data.stats;
  const recentOrders = data?.data.recentOrders || [];
  const summary = summaryData?.data;
  const breakdown = summary?.statusBreakdown as Record<string, number> | undefined;

  const statusBars = useMemo(() => {
    if (!breakdown) return [];
    const entries = STATUS_ORDER.filter(k => breakdown[k] !== undefined)
      .map(k => ({ key: k, ...STATUS_META[k], count: breakdown[k] }));
    const extras = Object.entries(breakdown)
      .filter(([k]) => !STATUS_ORDER.includes(k))
      .map(([k, count]) => ({ key: k, label: k, tone: "neutral" as const, count }));
    const all = [...entries, ...extras];
    const total = all.reduce((s, e) => s + e.count, 0) || 1;
    return all.map(e => ({ ...e, pct: (e.count / total) * 100 }));
  }, [breakdown]);

  const fmtMoney = (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const num = (v: number | undefined) => (v ?? 0).toLocaleString("en-US");

  // Completion rate must be measured over ORDERS. The old expression subtracted
// pending CLAIM SESSIONS from total orders — two unrelated counters — so a brand
// new store (0 orders, 0 claims) reported 0% and any store with open claims
// reported nonsense.
  const breakdownOrderTotal = breakdown
    ? Object.values(breakdown).reduce((sum, n) => sum + (Number(n) || 0), 0)
    : 0;
  const breakdownCompleted = breakdown
    ? (breakdown.completed || 0) + (breakdown.partially_refunded || 0) + (breakdown.refunded || 0)
    : 0;
  const completionRate =
    breakdownOrderTotal > 0 ? Math.round((breakdownCompleted / breakdownOrderTotal) * 100) : null;

  return (
    <div className="p-6 space-y-5 max-w-[1440px] mx-auto">

      <PageHeader
        title="Dashboard"
        description={new Date().toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        })}
        eyebrow="RBstars"
      >
        <Badge tone="success" dot>Live</Badge>
        <Link href="/admin/analytics">
          <span className="pn-btn pn-btn--secondary">
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.2} />
            Analytics
          </span>
        </Link>
      </PageHeader>

      {/* ── Headline metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {isLoading ? (
          <MetricSkeleton count={4} />
        ) : (
          <>
            <MetricTile
              label="Revenue this month"
              value={fmtMoney(stats?.revenueThisMonth || 0)}
              delta={stats?.revenueGrowth}
              hint="vs last month"
              icon={Banknote}
            />
            <MetricTile
              label="Orders today"
              value={num(stats?.ordersToday)}
              hint={`${num(stats?.ordersThisMonth)} this month`}
              icon={ShoppingBag}
            />
            <MetricTile
              label="Awaiting claim"
              value={num(stats?.pendingClaims)}
              deltaInvert
              hint="open claim sessions"
              icon={Inbox}
            />
            <MetricTile
              label="Agents online"
              value={num(stats?.onlineAgents)}
              hint="live right now"
              icon={Radio}
            />
          </>
        )}
      </div>

      {/* ── Chart + quick stats ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <RevenueChart />
        </Card>

        <Card>
          <CardHeader title="Business snapshot" subtitle="Across all time" icon={Layers} />
          {isLoading ? (
            <CardBody className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardBody>
          ) : (
            <div>
              <ListRow
                icon={Wallet} title="Total revenue" value={fmtMoney(stats?.totalRevenue || 0)}
              />
              <ListRow
                icon={ReceiptText} title="Total orders" value={num(stats?.totalOrders)}
              />
              <ListRow
                icon={Users} title="Customers" value={num(stats?.totalCustomers)}
              />
              <ListRow
                icon={Boxes} title="Products" value={num(stats?.totalProducts)}
              />
              <ListRow
                icon={Target}
                title="Completion rate"
                value={completionRate === null ? "—" : `${completionRate}%`}
                right={completionRate !== null && <Badge tone={completionRate >= 90 ? "success" : completionRate >= 70 ? "warning" : "critical"}>{completionRate >= 90 ? "Healthy" : completionRate >= 70 ? "Watch" : "Low"}</Badge>}
              />
              <ListRow
                icon={TrendingUp}
                title="Avg. order value"
                value={stats?.totalOrders ? fmtMoney((stats.totalRevenue || 0) / stats.totalOrders) : "—"}
              />
            </div>
          )}
        </Card>
      </div>

      {/* ── Order status distribution ── */}
      <Card>
        <CardHeader
          title="Order status"
          subtitle={summary ? `${num(summary.orders)} orders across all time` : "All time"}
          icon={Layers}
        />
        {isLoading ? (
          <CardBody><Skeleton className="h-5 w-full" /><Skeleton className="h-3 w-1/2 mt-3" /></CardBody>
        ) : !statusBars.length ? (
          <CardBody>
            <p className="text-sm" style={{ color: "var(--pn-text-3)" }}>
              No orders yet — the status breakdown appears once your first order lands.
            </p>
          </CardBody>
        ) : (
          <CardBody>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--pn-surface-2)" }}>
              {statusBars.map(s => (
                <motion.div
                  key={s.key}
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                  style={{
                    background: {
                      success: "var(--pn-success-fg)", warning: "var(--pn-warning-fg)",
                      action: "var(--pn-action)", critical: "var(--pn-critical)",
                      neutral: "var(--pn-border-strong)",
                    }[s.tone],
                  }}
                  title={`${s.label}: ${s.count}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
              {statusBars.map(s => (
                <span key={s.key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--pn-text-2)" }}>
                  <span className="w-2 h-2 rounded-full" style={{
                    background: {
                      success: "var(--pn-success-fg)", warning: "var(--pn-warning-fg)",
                      action: "var(--pn-action)", critical: "var(--pn-critical)",
                      neutral: "var(--pn-border-strong)",
                    }[s.tone],
                  }} />
                  {s.label}
                  <b style={{ color: "var(--pn-text)" }}>{s.count.toLocaleString()}</b>
                  <span style={{ color: "var(--pn-text-3)" }}>{s.pct.toFixed(0)}%</span>
                </span>
              ))}
            </div>
          </CardBody>
        )}
      </Card>

      {/* ── Recent orders (spreadsheet) ── */}
      <Card>
        <CardHeader
          title="Recent orders"
          subtitle="Newest first"
          icon={ShoppingBag}
          action={
            <Link href="/admin/orders">
              <span className="pn-btn pn-btn--plain">
                View all <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
              </span>
            </Link>
          }
        />
        {isLoading ? (
          <RowSkeleton count={5} />
        ) : recentOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            body="Orders will show up here as soon as customers start checking out."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="hidden md:table-cell">Items</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: Order, i: number) => (
                  <motion.tr
                    key={order._id}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reduce ? 0 : i * 0.03, duration: 0.25 }}
                  >
                    <td>
                      <Link href={`/admin/orders/${order._id}`}>
                        <a className="text-[13px] font-medium" style={{ color: "var(--pn-action)" }}>
                          {order.orderNumber}
                        </a>
                      </Link>
                    </td>
                    <td>
                      <p className="text-[13px] font-medium" style={{ color: "var(--pn-text)" }}>
                        {order.customer.robloxUsername}
                      </p>
                      <p className="text-xs" style={{ color: "var(--pn-text-3)" }}>{order.customer.email}</p>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="text-xs" style={{ color: "var(--pn-text-2)" }}>
                        {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--pn-text)" }}>
                        ${(order.pricing?.total || 0).toFixed(2)}
                      </span>
                    </td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="hidden lg:table-cell">
                      <span className="text-xs" style={{ color: "var(--pn-text-3)" }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Store health ── */}
      <Card>
        <CardHeader title="Store health" subtitle="Signals worth a glance today" icon={CircleCheck} />
        <div className="grid grid-cols-1 sm:grid-cols-3"
             style={{ background: "var(--pn-divider)", gap: 1 }}>
          {[
            {
              icon: CircleCheck, tone: "success" as const,
              title: completionRate === null ? "No orders yet" : `${completionRate}% completion`,
              body: completionRate === null
                ? "Complete your first sale to unlock this signal."
                : "Claim sessions that finished without getting stuck.",
            },
            {
              icon: Headset, tone: (stats?.onlineAgents || 0) > 0 ? ("success" as const) : ("warning" as const),
              title: `${num(stats?.onlineAgents)} agents online`,
              body: (stats?.onlineAgents || 0) > 0
                ? "Someone is on duty to handle claims."
                : "No agents online — claims will queue up.",
            },
            {
              icon: Timer, tone: (stats?.pendingClaims || 0) > 5 ? ("warning" as const) : ("neutral" as const),
              title: `${num(stats?.pendingClaims)} open claims`,
              body: (stats?.pendingClaims || 0) > 5
                ? "Backlog is building — worth checking the queue."
                : "Queue is under control.",
            },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-4"
                 style={{ background: "var(--pn-surface)" }}>
              <span className="pn-row__icon shrink-0" style={{
                color: s.tone === "success" ? "var(--pn-success-fg)"
                     : s.tone === "warning" ? "var(--pn-warning-fg)"
                     : "var(--pn-text-3)",
                background: s.tone === "success" ? "var(--pn-success-bg)"
                         : s.tone === "warning" ? "var(--pn-warning-bg)"
                         : "var(--pn-surface-2)",
                borderColor: "transparent",
              }}>
                <s.icon className="w-4 h-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: "var(--pn-text)" }}>{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--pn-text-3)", lineHeight: 1.5 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
