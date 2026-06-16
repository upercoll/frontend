import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign, ShoppingBag, Users, Package,
  MessageSquare, Activity, TrendingUp, ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "../api";
import StatCard from "../components/StatCard";
import RevenueChart from "../components/RevenueChart";
import type { Order } from "../types";

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Unpaid", paid: "Paid", delivering: "Delivering",
  completed: "Completed", cancelled: "Cancelled", refunded: "Refunded", fulfilled: "Fulfilled",
};
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending:    { bg: "#FEF9C3", text: "#854D0E" },
  paid:       { bg: "#DBEAFE", text: "#1E40AF" },
  delivering: { bg: "#EDE9FE", text: "#5B21B6" },
  completed:  { bg: "#D1FAE5", text: "#065F46" },
  cancelled:  { bg: "#FEE2E2", text: "#991B1B" },
  refunded:   { bg: "#F3F4F6", text: "#374151" },
  fulfilled:  { bg: "#ECFDF5", text: "#065F46" },
};

function OrderStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.refunded;
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ background: s.bg, color: s.text }}>
      {STATUS_DISPLAY[status] || status}
    </span>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["panel-dashboard"],
    queryFn: adminApi.analytics.dashboard,
    refetchInterval: 30000,
  });

  const stats = data?.data.stats;
  const recentOrders = data?.data.recentOrders || [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="font-bold text-xl" style={{ color: "#1e1b4b" }}>Overview</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} icon={DollarSign} iconColor="text-emerald-500" delay={0} subtitle="All time" />
          <StatCard title="This Month" value={`$${(stats?.revenueThisMonth || 0).toFixed(2)}`} icon={TrendingUp} iconColor="text-indigo-500" change={stats?.revenueGrowth} delay={0.05} subtitle="vs last month" />
          <StatCard title="Orders Today" value={stats?.ordersToday || 0} icon={ShoppingBag} iconColor="text-violet-500" delay={0.1} subtitle={`${stats?.ordersThisMonth || 0} this month`} />
          <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingBag} iconColor="text-orange-500" delay={0.15} />
          <StatCard title="Pending Claims" value={stats?.pendingClaims || 0} icon={MessageSquare} iconColor="text-amber-500" delay={0.2} subtitle={`${stats?.activeClaims || 0} active`} />
          <StatCard title="Online Agents" value={stats?.onlineAgents || 0} icon={Activity} iconColor="text-emerald-500" delay={0.25} />
          <StatCard title="Products" value={stats?.totalProducts || 0} icon={Package} iconColor="text-pink-500" delay={0.3} />
          <StatCard title="Customers" value={stats?.totalCustomers || 0} icon={Users} iconColor="text-cyan-500" delay={0.35} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-5"
          style={{ border: "1px solid #E9EBF5" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: "#1e1b4b" }}>Quick Stats</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Completion Rate", value: stats?.totalOrders ? `${Math.round(((stats.totalOrders - (stats.pendingClaims || 0)) / stats.totalOrders) * 100)}%` : "—", icon: Activity, color: "#10b981" },
              { label: "Avg Order Value", value: stats?.totalOrders ? `$${((stats.totalRevenue || 0) / stats.totalOrders).toFixed(2)}` : "—", icon: DollarSign, color: "#4f46e5" },
              { label: "Monthly Orders", value: stats?.ordersThisMonth || 0, icon: ShoppingBag, color: "#8b5cf6" },
              { label: "Revenue Growth", value: `${stats?.revenueGrowth?.toFixed(1) || 0}%`, icon: TrendingUp, color: (stats?.revenueGrowth || 0) >= 0 ? "#10b981" : "#ef4444" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400">{item.label}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: item.color }}>{String(item.value)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl overflow-hidden"
        style={{ border: "1px solid #E9EBF5" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <h3 className="font-bold text-sm" style={{ color: "#1e1b4b" }}>Recent Orders</h3>
          <Link href="/admin/orders">
            <span className="text-sm flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity" style={{ color: "#4f46e5" }}>
              View all <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Items</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: Order, i: number) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${order._id}`}>
                        <span className="text-sm font-mono font-semibold cursor-pointer hover:opacity-80" style={{ color: "#4f46e5" }}>{order.orderNumber}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium" style={{ color: "#1e1b4b" }}>{order.customer.robloxUsername}</p>
                      <p className="text-xs text-slate-400">{order.customer.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-slate-400">{order.items?.length || 0} item(s)</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>${(order.pricing?.total || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">
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
