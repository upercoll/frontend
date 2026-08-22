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

const PAPER = "#F2EEE5";

const GLASS = {
  background: "rgba(255,255,255,.035)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(242,238,229,.09)",
  borderRadius: 20,
} as React.CSSProperties;

function SectionHeading({ icon: Icon, title, action }: { icon: React.ComponentType<{ className?: string }>; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 -rotate-3 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(226,35,26,.14)", border: "1px solid rgba(226,35,26,.4)" }}>
        <Icon className="w-3.5 h-3.5" style={{ color: "#FF7A72" }} />
      </div>
      <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(242,238,229,.5)" }}>{title}</h2>
      <div className="flex-1 h-px" style={{ background: "rgba(242,238,229,.1)" }} />
      {action}
    </div>
  );
}

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Unpaid", paid: "Paid", delivering: "Delivering",
  completed: "Completed", cancelled: "Cancelled", refunded: "Refunded",
  partially_refunded: "Partial Refund",
};
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:            { bg: "rgba(255,200,0,.1)",  text: "#FFC800", dot: "#FFC800" },
  paid:               { bg: "rgba(10,132,255,.12)", text: "#6DB8FF", dot: "#0A84FF" },
  delivering:         { bg: "rgba(219,39,119,.12)", text: "#FF9ECF", dot: "#DB2777" },
  completed:          { bg: "rgba(0,176,111,.12)",  text: "#4ADE80", dot: "#00B06F" },
  cancelled:          { bg: "rgba(226,35,26,.14)",  text: "#FF7A72", dot: "#E2231A" },
  refunded:           { bg: "rgba(242,238,229,.06)", text: "rgba(242,238,229,.5)", dot: "rgba(242,238,229,.3)" },
  partially_refunded: { bg: "rgba(234,88,12,.12)",  text: "#FDBA74", dot: "#EA580C" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.refunded;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {STATUS_DISPLAY[status] || status}
    </span>
  );
}

const STAT_CONFIGS = [
  { key: "totalRevenue",    label: "Total Revenue",   icon: DollarSign,    color: "#00B06F", format: (v: number) => `$${v.toFixed(2)}` },
  { key: "revenueThisMonth", label: "This Month",     icon: TrendingUp,    color: "#0A84FF", format: (v: number) => `$${v.toFixed(2)}` },
  { key: "ordersToday",     label: "Orders Today",    icon: ShoppingBag,   color: "#E2231A", format: (v: number) => String(v) },
  { key: "totalOrders",     label: "Total Orders",    icon: Zap,           color: "#FFC800", format: (v: number) => String(v) },
  { key: "pendingClaims",   label: "Pending Claims",  icon: MessageSquare, color: "#DB2777", format: (v: number) => String(v) },
  { key: "onlineAgents",    label: "Online Agents",   icon: Activity,      color: "#0891B2", format: (v: number) => String(v) },
  { key: "totalProducts",   label: "Products",        icon: Package,       color: "#F2EEE5", format: (v: number) => String(v) },
  { key: "totalCustomers",  label: "Customers",       icon: Users,         color: "#FF7A72", format: (v: number) => String(v) },
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
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] mb-1" style={{ color: "#FF7A72" }}>
            Admin Panel
          </p>
          <h1 className="font-display text-4xl uppercase tracking-wide" style={{ color: PAPER }}>Dashboard</h1>
          <p className="font-mono text-[11px] mt-1 uppercase tracking-wider" style={{ color: "rgba(242,238,229,.4)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full rotate-1"
          style={{ background: "rgba(0,176,111,.08)", border: "1px solid rgba(0,176,111,.3)" }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00B06F" }} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(242,238,229,.65)" }}>Live data</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div>
        <SectionHeading icon={BarChart3} title="Overview" />
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(242,238,229,.04)", border: "1px solid rgba(242,238,229,.07)" }} />
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
                  whileHover={{ y: -4 }}
                  className="p-4 rounded-2xl flex flex-col gap-3 group relative overflow-hidden"
                  style={{
                    ...GLASS,
                    borderColor: `${cfg.color}45`,
                    transition: "border-color .2s ease",
                  }}
                >
                  <div className="pattern-dots-light absolute inset-0 pointer-events-none opacity-30" />
                  <div className="relative flex items-center justify-between">
                    <div className="w-9 h-9 -rotate-3 rounded-xl flex items-center justify-center"
                      style={{ background: `${cfg.color}1f`, border: `1px solid ${cfg.color}55` }}>
                      <cfg.icon className="w-4 h-4" style={{ color: cfg.color === PAPER ? PAPER : cfg.color }} />
                    </div>
                    <span className="tilt-sq !w-2 !h-2" style={{ background: cfg.color }} />
                  </div>
                  <div className="relative">
                    <p className="font-display text-[26px] leading-none tracking-tight" style={{ color: PAPER }}>{val}</p>
                    <p className="font-mono text-[10px] mt-1.5 font-medium uppercase tracking-[0.14em]" style={{ color: "rgba(242,238,229,.42)" }}>{cfg.label}</p>
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
              { label: "Completion Rate", value: stats?.totalOrders ? `${Math.round(((stats.totalOrders - (stats.pendingClaims || 0)) / stats.totalOrders) * 100)}%` : "—", color: "#4ADE80" },
              { label: "Avg Order Value", value: stats?.totalOrders ? `$${((stats.totalRevenue || 0) / stats.totalOrders).toFixed(2)}` : "—", color: "#6DB8FF" },
              { label: "Monthly Orders", value: String(stats?.ordersThisMonth || 0), color: "#FF9ECF" },
              { label: "Revenue Growth", value: `${stats?.revenueGrowth?.toFixed(1) || 0}%`, color: (stats?.revenueGrowth || 0) >= 0 ? "#4ADE80" : "#FF7A72" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl"
                style={{ background: "rgba(242,238,229,.03)", border: "1px solid rgba(242,238,229,.07)" }}>
                <div className="flex items-center gap-2.5">
                  <span className="tilt-sq !w-2 !h-2 flex-shrink-0" style={{ background: item.color }} />
                  <p className="text-xs font-medium" style={{ color: "rgba(242,238,229,.55)" }}>{item.label}</p>
                </div>
                <p className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</p>
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
                <span className="flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:text-[#FF7A72] transition-colors" style={{ color: "#FF7A72" }}>
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            }
          />
        </div>

        {isLoading ? (
          <div className="p-6 pt-0 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(242,238,229,.04)" }} />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-10 text-center font-mono text-xs uppercase tracking-wider" style={{ color: "rgba(242,238,229,.35)" }}>No orders yet</div>
        ) : (
          <div className="overflow-x-auto px-2 pb-4">
            <table className="w-full">
              <thead>
                <tr>
                  {["Order", "Customer", "Items", "Total", "Status", "Date"].map((h, i) => (
                    <th key={h} className={`text-left px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${i >= 2 && i !== 3 && i !== 4 ? "hidden md:table-cell" : ""} ${i === 5 ? "hidden lg:table-cell" : ""}`}
                      style={{ color: "rgba(242,238,229,.4)", borderBottom: "1px solid rgba(242,238,229,.1)" }}>
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
                    style={{ borderBottom: "1px solid rgba(242,238,229,.06)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(242,238,229,.03)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/orders/${order._id}`}>
                        <span className="text-sm font-mono font-semibold cursor-pointer hover:text-[#FF7A72] transition-colors" style={{ color: "#FF7A72" }}>
                          {order.orderNumber}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold" style={{ color: PAPER }}>{order.customer.robloxUsername}</p>
                      <p className="text-xs" style={{ color: "rgba(242,238,229,.4)" }}>{order.customer.email}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs font-mono" style={{ color: "rgba(242,238,229,.5)" }}>{order.items?.length || 0} item(s)</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold" style={{ color: PAPER }}>${(order.pricing?.total || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs font-mono" style={{ color: "rgba(242,238,229,.35)" }}>
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
