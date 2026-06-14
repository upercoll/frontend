import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign, ShoppingBag, Users, Package,
  MessageSquare, Activity, TrendingUp, Clock, ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "../api";
import StatCard from "../components/StatCard";
import RevenueChart from "../components/RevenueChart";
import type { Order } from "../types";

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-400/10 text-yellow-400",
    paid: "bg-blue-400/10 text-blue-400",
    delivering: "bg-purple-400/10 text-purple-400",
    completed: "bg-emerald-400/10 text-emerald-400",
    cancelled: "bg-red-400/10 text-red-400",
    refunded: "bg-slate-400/10 text-slate-400",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[status] || "bg-white/5 text-slate-400"}`}>
      {status}
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
        <h2 className="text-white font-semibold text-xl">Overview</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} icon={DollarSign} iconColor="text-emerald-400" delay={0} subtitle="All time" />
          <StatCard title="This Month" value={`$${(stats?.revenueThisMonth || 0).toFixed(2)}`} icon={TrendingUp} iconColor="text-blue-400" change={stats?.revenueGrowth} delay={0.05} subtitle="vs last month" />
          <StatCard title="Orders Today" value={stats?.ordersToday || 0} icon={ShoppingBag} iconColor="text-purple-400" delay={0.1} subtitle={`${stats?.ordersThisMonth || 0} this month`} />
          <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingBag} iconColor="text-orange-400" delay={0.15} />
          <StatCard title="Pending Claims" value={stats?.pendingClaims || 0} icon={MessageSquare} iconColor="text-yellow-400" delay={0.2} subtitle={`${stats?.activeClaims || 0} active`} />
          <StatCard title="Online Agents" value={stats?.onlineAgents || 0} icon={Activity} iconColor="text-emerald-400" delay={0.25} />
          <StatCard title="Products" value={stats?.totalProducts || 0} icon={Package} iconColor="text-pink-400" delay={0.3} />
          <StatCard title="Customers" value={stats?.totalCustomers || 0} icon={Users} iconColor="text-cyan-400" delay={0.35} />
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
          className="bg-[#0d1f3c] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Completion Rate", value: stats?.totalOrders ? `${Math.round(((stats.totalOrders - (stats.pendingClaims || 0)) / stats.totalOrders) * 100)}%` : "—", icon: Activity, color: "text-emerald-400" },
              { label: "Avg Order Value", value: stats?.totalOrders ? `$${((stats.totalRevenue || 0) / stats.totalOrders).toFixed(2)}` : "—", icon: DollarSign, color: "text-blue-400" },
              { label: "Monthly Orders", value: stats?.ordersThisMonth || 0, icon: ShoppingBag, color: "text-purple-400" },
              { label: "Revenue Growth", value: `${stats?.revenueGrowth?.toFixed(1) || 0}%`, icon: TrendingUp, color: stats?.revenueGrowth && stats.revenueGrowth >= 0 ? "text-emerald-400" : "text-red-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 text-xs">{item.label}</p>
                </div>
                <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold">Recent Orders</h3>
          <Link href="/admin/orders">
            <span className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300 transition-colors cursor-pointer">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/3 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-white/5">
                  <th className="text-left px-5 py-3 font-medium">Order</th>
                  <th className="text-left px-5 py-3 font-medium">Customer</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Items</th>
                  <th className="text-left px-5 py-3 font-medium">Total</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: Order, i: number) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${order._id}`}>
                        <span className="text-blue-400 text-sm font-mono hover:text-blue-300 cursor-pointer">{order.orderNumber}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-white text-sm">{order.customer.robloxUsername}</p>
                      <p className="text-slate-500 text-xs">{order.customer.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-slate-300 text-xs">{order.items?.length || 0} item(s)</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-white text-sm font-medium">${(order.pricing?.total || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-slate-500 text-xs">
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
