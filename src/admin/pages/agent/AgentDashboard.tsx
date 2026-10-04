import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  CircleCheck, Target, Timer, Star, MessageSquare, Radio,
  ShoppingBag, ArrowRight, Banknote, ReceiptText, Package,
  TrendingUp, LayoutGrid, Zap,
} from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "../../api";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminSocket } from "../../context/AdminSocketContext";
import {
  PageHeader, Card, CardHeader, MetricTile, Badge, EmptyState,
  MetricSkeleton, RowSkeleton,
} from "../../components/kit";

function msToTime(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

const CLAIM_TONE: Record<string, "success" | "action" | "warning" | "neutral"> = {
  pending: "warning", active: "action", claimed: "success", ended: "neutral",
};

const ORDER_TONE: Record<string, "success" | "action" | "warning" | "critical" | "neutral"> = {
  pending: "warning", paid: "action", delivering: "action", completed: "success",
  cancelled: "critical", refunded: "neutral", partially_refunded: "warning",
};

const QUICK_ACTIONS = [
  { href: "/panel/queue", icon: MessageSquare, title: "Claim queue", body: "Answer incoming claim requests", gate: "claim_agent", featured: true },
  { href: "/admin/orders", icon: ShoppingBag, title: "Orders", body: "View and manage orders", gate: "manage_orders" },
  { href: "/panel/stats", icon: TrendingUp, title: "My statistics", body: "Detailed performance metrics", gate: "claim_agent" },
] as const;

export default function AgentDashboard() {
  const { user, profile, hasPermission } = useAdminAuth();
  const { connected } = useAdminSocket();
  const reduce = useReducedMotion();

  const canViewClaims = hasPermission("claim_agent");
  const canViewOrders = hasPermission("manage_orders");
  const canViewAnalytics = hasPermission("view_analytics");

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["agent-my-stats"],
    queryFn: adminApi.agentStats.getMe,
    refetchInterval: 30000,
    enabled: canViewClaims,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["panel-dashboard"],
    queryFn: adminApi.analytics.dashboard,
    refetchInterval: 30000,
    enabled: canViewAnalytics,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["panel-orders", { page: "1", limit: "5" }],
    queryFn: () => adminApi.orders.list({ page: "1", limit: "5" }),
    refetchInterval: 30000,
    enabled: canViewOrders,
  });

  const agentStats = statsData?.data.stats;
  const completionRate = statsData?.data.completionRate || 0;
  const recentSessions = statsData?.data.recentSessions || [];

  const dashStats = analyticsData?.data.stats;
  const recentOrders = ordersData?.data.orders || [];

  const rise = reduce ? {} : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">

      <PageHeader
        title={`Welcome, ${profile?.displayName || user?.email?.split("@")[0]}`}
        description={new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        eyebrow="Team panel"
      >
        <Badge tone={connected ? "success" : "neutral"} dot>
          {connected ? "Online" : "Connecting…"}
        </Badge>
      </PageHeader>

      {/* ── My performance ── */}
      {canViewClaims && (
        <Card>
          <CardHeader title="My performance" subtitle="Across every claim you've handled" icon={Target}
                      action={<Link href="/panel/stats"><span className="pn-btn pn-btn--plain">Details <ArrowRight className="w-3.5 h-3.5" /></span></Link>} />
          {statsLoading ? (
            <CardBodySkeleton />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4"
                 style={{ background: "var(--pn-surface-2)" }}>
              <MetricTile label="Claims done" value={(agentStats?.completedClaims || 0).toLocaleString()} icon={CircleCheck} />
              <MetricTile label="Completion rate" value={`${completionRate}%`} icon={Target}
                          hint={completionRate >= 90 ? "strong" : completionRate >= 70 ? "needs attention" : "low"} />
              <MetricTile label="Avg response" value={msToTime(agentStats?.avgResponseTimeMs || 0)} icon={Timer} />
              <MetricTile
                label="Rating"
                value={agentStats?.rating?.count ? `${agentStats.rating.average.toFixed(1)}★` : "—"}
                hint={agentStats?.rating?.count ? `${agentStats.rating.count} ratings` : "no ratings yet"}
                icon={Star}
              />
            </div>
          )}
        </Card>
      )}

      {/* ── Overview ── */}
      {canViewAnalytics && (
        <Card>
          <CardHeader title="Store overview" subtitle="Shared numbers, updated every 30s" icon={LayoutGrid}
                      action={<Link href="/admin/analytics"><span className="pn-btn pn-btn--plain">Full analytics <ArrowRight className="w-3.5 h-3.5" /></span></Link>} />
          {analyticsLoading ? (
            <CardBodySkeleton />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4"
                 style={{ background: "var(--pn-surface-2)" }}>
              <MetricTile
                label="Total revenue"
                value={dashStats?.totalRevenue !== undefined ? `$${(dashStats.totalRevenue as number).toFixed(2)}` : "—"}
                icon={Banknote}
              />
              <MetricTile label="Orders today" value={dashStats?.ordersToday !== undefined ? String(dashStats.ordersToday) : "—"} icon={ShoppingBag} />
              <MetricTile label="Total orders" value={dashStats?.totalOrders !== undefined ? String(dashStats.totalOrders) : "—"} icon={ReceiptText} />
              <MetricTile label="Agents online" value={dashStats?.onlineAgents !== undefined ? String(dashStats.onlineAgents) : "—"} icon={Radio} />
            </div>
          )}
        </Card>
      )}

      {/* ── Quick actions ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5" style={{ color: "var(--pn-text-3)" }} />
          <h2 className="pn-navlabel">Quick actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.filter(a => (a.gate === "claim_agent" ? canViewClaims : a.gate === "manage_orders" ? canViewOrders : true)).map(a => (
            <Link key={a.href} href={a.href}>
              <motion.div {...rise}
                className="pn-card p-4 flex items-start gap-3 cursor-pointer transition-colors h-full"
                style={a.featured ? { background: "var(--pn-action-tint)", borderColor: "var(--pn-action-border)" } : undefined}>
                <span className="pn-row__icon" style={{
                  background: a.featured ? "var(--pn-surface)" : "var(--pn-surface-2)",
                  borderColor: a.featured ? "var(--pn-action-border)" : "var(--pn-border)",
                  color: a.featured ? "var(--pn-action)" : "var(--pn-text-2)",
                }}>
                  <a.icon className="w-4 h-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold" style={{ color: "var(--pn-text)" }}>{a.title}</span>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--pn-text-2)" }}>{a.body}</span>
                </span>
                <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--pn-text-3)" }} />
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent orders ── */}
      {canViewOrders && (
        <Card>
          <CardHeader
            title="Recent orders"
            subtitle="Newest first"
            icon={ShoppingBag}
            action={<Link href="/admin/orders"><span className="pn-btn pn-btn--plain">View all <ArrowRight className="w-3.5 h-3.5" /></span></Link>}
          />
          {ordersLoading ? (
            <RowSkeleton count={5} />
          ) : recentOrders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders yet" body="Orders appear here as customers check out." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th className="text-right">Total</th>
                    <th>Status</th>
                    <th className="hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: any) => (
                    <tr key={order._id}>
                      <td>
                        <Link href={`/admin/orders/${order._id}`}>
                          <span className="text-[13px] font-mono font-semibold" style={{ color: "var(--pn-action)" }}>
                            {order.orderNumber}
                          </span>
                        </Link>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center"
                                style={{
                                  background: order.items?.[0]?.productSnapshot?.gradient
                                    ? `linear-gradient(135deg,${order.items[0].productSnapshot.gradient.from},${order.items[0].productSnapshot.gradient.to})`
                                    : "var(--pn-surface-2)",
                                  border: "1px solid var(--pn-border)",
                                }}>
                            {order.items?.[0]?.productSnapshot?.imageUrl
                              ? <img src={order.items[0].productSnapshot.imageUrl} className="w-full h-full object-cover" alt="" />
                              : <Package className="w-3.5 h-3.5" style={{ color: "var(--pn-text-3)" }} />}
                          </span>
                          <span className="text-[13px] font-medium" style={{ color: "var(--pn-text)" }}>
                            {order.customer.robloxUsername}
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <span className="text-[13px] font-semibold" style={{ color: "var(--pn-text)" }}>
                          ${(order.pricing?.total || 0).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <Badge tone={ORDER_TONE[order.status] || "neutral"} dot>{order.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-xs" style={{ color: "var(--pn-text-3)" }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Recent claims ── */}
      {canViewClaims && (
        <Card>
          <CardHeader title="Recent claims" subtitle="Latest sessions you've handled" icon={MessageSquare} />
          {recentSessions.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No claims yet" body="Sessions you pick up will be listed here." />
          ) : (
            <div>
              {recentSessions.slice(0, 6).map((session: any, i: number) => (
                <motion.div key={session._id}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduce ? 0 : i * 0.04, duration: 0.25 }}>
                  <div className="pn-row">
                    <span className="pn-row__icon" style={{ color: "var(--pn-action)", background: "var(--pn-action-tint)", borderColor: "transparent" }}>
                      <MessageSquare className="w-4 h-4" strokeWidth={2} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="pn-row__title block truncate">{session.robloxUsername}</span>
                      <span className="pn-row__meta block truncate">{session.game || "Unknown game"}</span>
                    </span>
                    <Badge tone={CLAIM_TONE[session.status] || "neutral"}>{session.status}</Badge>
                    <span className="pn-row__meta hidden sm:block w-24 text-right">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      )}

    </div>
  );
}

function CardBodySkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4" style={{ background: "var(--pn-surface-2)" }}>
      <MetricSkeleton count={4} />
    </div>
  );
}
