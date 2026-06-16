import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign, ShoppingBag, Users, Package,
  MessageSquare, Activity, TrendingUp, ArrowRight,
  BarChart3, Zap,
} from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "../api";
import RevenueChart from "../components/RevenueChart";
import type { Order } from "../types";

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

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Unpaid", paid: "Paid", delivering: "Delivering",
  completed: "Completed", cancelled: "Cancelled", refunded: "Refunded", fulfilled: "Fulfilled",
};
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", dot: "#f59e0b" },
  paid:       { bg: "rgba(99,102,241,0.12)", text: "#a5b4fc", dot: "#6366f1" },
  delivering: { bg: "rgba(139,92,246,0.12)", text: "#c4b5fd", dot: "#8b5cf6" },
  completed:  { bg: "rgba(16,185,129,0.12)", text: "#6ee7b7", dot: "#10b981" },
  cancelled:  { bg: "rgba(239,68,68,0.12)",  text: "#fca5a5", dot: "#ef4444" },
  refunded:   { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.5)", dot: "rgba(255,255,255,0.3)" },
  fulfilled:  { bg: "rgba(16,185,129,0.12)", text: "#6ee7b7", dot: "#10b981" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.refunded;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {STATUS_DISPLAY[status] || status}
    </span>
  );
}

const STAT_CONFIGS = [
  { key: "totalRevenue",    label: "Total Revenue",   icon: DollarSign,    color: "#10b981", format: (v: number) => `$${v.toFixed(2)}` },
  { key: "revenueThisMonth", label: "This Month",     icon: TrendingUp,    color: "#6366f1", format: (v: number) => `$${v.toFixed(2)}` },
  { key: "ordersToday",     label: "Orders Today",    icon: ShoppingBag,   color: "#8b5cf6", format: (v: number) => String(v) },
  { key: "totalOrders",     label: "Total Orders",    icon: Zap,           color: "#f59e0b", format: (v: number) => String(v) },
  { key: "pendingClaims",   label: "Pending Claims",  icon: MessageSquare, color: "#f97316", format: (v: number) => String(v) },
  { key: "onlineAgents",    label: "Online Agents",   icon: Activity,      color: "#22d3ee", format: (v: number) => String(v) },
  { key: "totalProducts",   label: "Products",        icon: Package,       color: "#ec4899", format: (v: number) => String(v) },
  { key: "totalCustomers",  label: "Customers",       icon: Users,         color: "#a78bfa", format: (v: number) => String(v) },
];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["panel-dashboard"],
    queryFn: adminApi.analytics.dashboard,
    refetchInterval: 30000,
  });

  const stats = data?.data.stats;
  const recentOrders = data?.data.recentOrders || [];

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(139,92,246,0.7)" }}>
            Admin Panel
          </p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Live data</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div>
        <SectionHeading icon={BarChart3} title="Overview" />
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CONFIGS.map((cfg, i) => {
              const raw = stats?.[cfg.key as keyof typeof stats] as number | undefined;
              const val = raw !== undefined ? cfg.format(raw) : "—";
              return (
                <motion.div
                  key={cfg.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl flex flex-col gap-3 group"
                  style={GLASS_ACCENT(cfg.color)}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}30` }}>
                      <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl overflow-hidden" style={GLASS}>
          <div className="px-5 pt-5 pb-2">
            <SectionHeading icon={TrendingUp} title="Revenue" />
          </div>
          <div className="px-4 pb-4">
            <RevenueChart />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl"
          style={GLASS}
        >
          <SectionHeading icon={Activity} title="Quick Stats" />
          <div className="space-y-3">
            {[
              { label: "Completion Rate", value: stats?.totalOrders ? `${Math.round(((stats.totalOrders - (stats.pendingClaims || 0)) / stats.totalOrders) * 100)}%` : "—", color: "#10b981" },
              { label: "Avg Order Value", value: stats?.totalOrders ? `$${((stats.totalRevenue || 0) / stats.totalOrders).toFixed(2)}` : "—", color: "#6366f1" },
              { label: "Monthly Orders", value: String(stats?.ordersThisMonth || 0), color: "#8b5cf6" },
              { label: "Revenue Growth", value: `${stats?.revenueGrowth?.toFixed(1) || 0}%`, color: (stats?.revenueGrowth || 0) >= 0 ? "#10b981" : "#ef4444" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{item.label}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl overflow-hidden"
        style={GLASS}
      >
        <div className="px-6 pt-5 pb-1">
          <SectionHeading
            icon={ShoppingBag}
            title="Recent Orders"
            action={
              <Link href="/admin/orders">
                <span className="flex items-center gap-1 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity" style={{ color: "#a5b4fc" }}>
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            }
          />
        </div>

        {isLoading ? (
          <div className="p-6 pt-0 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
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
                  {["Order", "Customer", "Items", "Total", "Status", "Date"].map((h, i) => (
                    <th key={h} className={`text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${i >= 2 && i !== 3 && i !== 4 ? "hidden md:table-cell" : ""} ${i === 5 ? "hidden lg:table-cell" : ""}`}
                      style={{ color: "rgba(255,255,255,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: Order, i: number) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/orders/${order._id}`}>
                        <span className="text-sm font-mono font-semibold cursor-pointer hover:opacity-80 transition-opacity" style={{ color: "#a5b4fc" }}>
                          {order.orderNumber}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-white">{order.customer.robloxUsername}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{order.customer.email}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{order.items?.length || 0} item(s)</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-white">${(order.pricing?.total || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
