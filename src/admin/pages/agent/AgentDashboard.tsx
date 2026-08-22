import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Star, MessageSquare, Activity, ShoppingBag,
  ArrowRight, Zap, BarChart3, TrendingUp, DollarSign, Package,
} from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "../../api";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminSocket } from "../../context/AdminSocketContext";

function msToTime(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

const GLASS = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  boxShadow: "0 4px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
} as React.CSSProperties;

const GLASS_ACCENT = (color: string) => ({
  background: `linear-gradient(135deg, ${color}18 0%, ${color}06 100%)`,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${color}30`,
  borderRadius: 16,
  boxShadow: `0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`,
} as React.CSSProperties);

function SectionHeading({ icon: Icon, title, action }: { icon: React.ComponentType<{ className?: string }>; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <Icon className="w-3.5 h-3.5" style={{ color: "#a5b4fc" }} />
      </div>
      <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>{title}</h2>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.2), transparent)" }} />
      {action}
    </div>
  );
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  active:  { bg: "rgba(99,102,241,0.12)",  text: "#a5b4fc" },
  claimed: { bg: "rgba(16,185,129,0.12)",  text: "#6ee7b7" },
  ended:   { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.4)" },
};

export default function AgentDashboard() {
  const { user, profile, hasPermission } = useAdminAuth();
  const { connected } = useAdminSocket();

  const canViewClaims = hasPermission("claim_agent");
  const canViewOrders = hasPermission("manage_orders");
  const canViewAnalytics = hasPermission("view_analytics");

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["agent-my-stats"],
    queryFn: adminApi.agentStats.me,
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

  const AGENT_STAT_CONFIGS = [
    { label: "Claims Done", value: agentStats?.completedClaims || 0, color: "#10b981", format: String },
    { label: "Completion Rate", value: `${completionRate}%`, color: "#6366f1" },
    { label: "Avg Response", value: msToTime(agentStats?.avgResponseTimeMs || 0), color: "#f59e0b" },
    { label: "Rating", value: agentStats?.rating?.count ? `${agentStats.rating.average.toFixed(1)}★` : "—", color: "#a78bfa" },
  ];

  const ADMIN_STAT_CONFIGS = [
    { key: "totalRevenue",   label: "Total Revenue",  color: "#10b981", format: (v: number) => `$${v.toFixed(2)}`, icon: DollarSign },
    { key: "ordersToday",    label: "Orders Today",   color: "#6366f1", format: String,                             icon: ShoppingBag },
    { key: "totalOrders",    label: "Total Orders",   color: "#8b5cf6", format: String,                             icon: Zap },
    { key: "onlineAgents",   label: "Online Agents",  color: "#22d3ee", format: String,                             icon: Activity },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(99,102,241,0.7)" }}>
            Team Panel
          </p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome, {profile?.displayName || user?.email?.split("@")[0]}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: connected ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${connected ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)"}` }}>
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
          <span className="text-xs font-semibold" style={{ color: connected ? "#6ee7b7" : "rgba(255,255,255,0.4)" }}>
            {connected ? "Online" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Agent Stats (if claim_agent) */}
      {canViewClaims && (
        <div>
          <SectionHeading icon={Activity} title="My Performance" />
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {AGENT_STAT_CONFIGS.map((cfg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl flex flex-col gap-3"
                  style={GLASS_ACCENT(cfg.color)}>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}30` }}>
                      <Activity className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white tracking-tight">{cfg.value}</p>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{cfg.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Stats (if view_analytics) */}
      {canViewAnalytics && (
        <div>
          <SectionHeading icon={BarChart3} title="Overview" action={
            <Link href="/admin/analytics">
              <span className="flex items-center gap-1 text-xs font-semibold cursor-pointer hover:opacity-80" style={{ color: "#a5b4fc" }}>
                Full Analytics <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          } />
          {analyticsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {ADMIN_STAT_CONFIGS.map((cfg, i) => {
                const raw = dashStats?.[cfg.key as keyof typeof dashStats] as number | undefined;
                const val = raw !== undefined ? cfg.format(raw) : "—";
                const Icon = cfg.icon;
                return (
                  <motion.div key={cfg.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl flex flex-col gap-3"
                    style={GLASS_ACCENT(cfg.color)}>
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}30` }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-white tracking-tight">{val}</p>
                      <p className="text-xs mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{cfg.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <SectionHeading icon={Zap} title="Quick Actions" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {canViewClaims && (
            <Link href="/panel/queue">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="p-5 rounded-2xl cursor-pointer"
                style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.25) 0%,rgba(139,92,246,0.15) 100%)", border: "1px solid rgba(99,102,241,0.3)" }}>
                <MessageSquare className="w-8 h-8 mb-3" style={{ color: "#a5b4fc" }} />
                <p className="text-white font-bold text-lg">Claim Queue</p>
                <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Answer incoming claim requests</p>
              </motion.div>
            </Link>
          )}
          {canViewOrders && (
            <Link href="/admin/orders">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="p-5 rounded-2xl cursor-pointer"
                style={GLASS}>
                <ShoppingBag className="w-8 h-8 mb-3" style={{ color: "#6ee7b7" }} />
                <p className="text-white font-bold text-lg">Orders</p>
                <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>View and manage orders</p>
              </motion.div>
            </Link>
          )}
          {canViewClaims && (
            <Link href="/panel/stats">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="p-5 rounded-2xl cursor-pointer"
                style={GLASS}>
                <TrendingUp className="w-8 h-8 mb-3" style={{ color: "#fbbf24" }} />
                <p className="text-white font-bold text-lg">My Statistics</p>
                <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>View detailed performance metrics</p>
              </motion.div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Orders (if manage_orders) */}
      {canViewOrders && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden" style={GLASS}>
          <div className="px-5 pt-5 pb-1">
            <SectionHeading icon={ShoppingBag} title="Recent Orders" action={
              <Link href="/admin/orders">
                <span className="flex items-center gap-1 text-xs font-semibold cursor-pointer hover:opacity-80" style={{ color: "#a5b4fc" }}>
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            } />
          </div>
          {ordersLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>No orders yet</div>
          ) : (
            <div className="overflow-x-auto px-2 pb-4">
              <table className="w-full">
                <thead>
                  <tr>
                    {["Order", "Customer", "Total", "Status", "Date"].map((h, i) => (
                      <th key={h} className={`text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${i >= 3 ? "hidden lg:table-cell" : ""}`}
                        style={{ color: "rgba(255,255,255,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: any, i: number) => {
                    const statusColors: Record<string, { bg: string; text: string }> = {
                      pending: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
                      paid: { bg: "rgba(99,102,241,0.12)", text: "#a5b4fc" },
                      delivering: { bg: "rgba(139,92,246,0.12)", text: "#c4b5fd" },
                      completed: { bg: "rgba(16,185,129,0.12)", text: "#6ee7b7" },
                      cancelled: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5" },
                      refunded: { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.4)" },
                      partially_refunded: { bg: "rgba(249,115,22,0.12)", text: "#fdba74" },
                    };
                    const sc = statusColors[order.status] || statusColors.refunded;
                    return (
                      <tr key={order._id} className="transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3.5">
                          <Link href={`/admin/orders/${order._id}`}>
                            <span className="text-sm font-mono font-semibold cursor-pointer hover:opacity-80" style={{ color: "#a5b4fc" }}>
                              {order.orderNumber}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden"
                              style={{ background: order.items?.[0]?.productSnapshot?.gradient ? `linear-gradient(135deg,${order.items[0].productSnapshot.gradient.from},${order.items[0].productSnapshot.gradient.to})` : "rgba(99,102,241,0.15)" }}>
                              {order.items?.[0]?.productSnapshot?.imageUrl
                                ? <img src={order.items[0].productSnapshot.imageUrl} className="w-full h-full object-cover" alt="" />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                                  </div>}
                            </div>
                            <p className="text-sm font-medium text-white">{order.customer.robloxUsername}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-white">${(order.pricing?.total || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                            style={{ background: sc.bg, color: sc.text }}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Claims (if claim_agent) */}
      {canViewClaims && recentSessions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl overflow-hidden" style={GLASS}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <SectionHeading icon={MessageSquare} title="Recent Claims" />
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
            {recentSessions.slice(0, 6).map((session: any, i: number) => {
              const sc = STATUS_COLORS[session.status] || STATUS_COLORS.ended;
              return (
                <motion.div key={session._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.1)" }}>
                    <MessageSquare className="w-4 h-4" style={{ color: "#a5b4fc" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{session.robloxUsername}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{session.game || "Unknown game"}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: sc.bg, color: sc.text }}>{session.status}</span>
                    <span className="text-xs hidden sm:block" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
