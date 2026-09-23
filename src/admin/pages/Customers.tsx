import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Users, DollarSign, ShoppingBag, UserX, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { adminApi } from "../api";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const params: Record<string, string> = { page: String(page), limit: "20" };
  if (search) params.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ["panel-customers", params],
    queryFn: () => adminApi.customers.list(params),
  });

  const { data: statsData } = useQuery({
    queryKey: ["panel-customers-stats"],
    queryFn: adminApi.customers.stats,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.customers.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-customers"] }),
    onError: (err: Error) => alert(err.message),
  });

  const customers = data?.data?.customers || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;
  const stats = statsData?.data;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Customers</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage customer accounts and view their order history</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Total Customers", value: stats.total, color: "#4f46e5" },
            { icon: Users, label: "Active Customers", value: stats.active, color: "#10b981" },
            { icon: TrendingUp, label: "New This Month", value: stats.newThisMonth, color: "#f59e0b" },
            { icon: DollarSign, label: "Top Spender", value: stats.topSpenders?.[0] ? `$${stats.topSpenders[0].total.toFixed(2)}` : "-", color: "#8b5cf6" },
          ].map(({ icon: Icon, label, value, color }, i) => (
            <div key={i} className="bg-white rounded-xl p-4" style={{ border: "1px solid #E9EBF5" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: "#1e1b4b" }}>{typeof value === "number" ? value.toLocaleString() : value}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats?.topSpenders && stats.topSpenders.length > 0 && (
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#1e1b4b" }}>Top Spenders</h3>
          <div className="space-y-3">
            {stats.topSpenders.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : "#cd7f32" }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#1e1b4b" }}>{s.robloxUsername || s._id}</p>
                  <p className="text-xs text-slate-400 truncate">{s._id}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-600">${s.total.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{s.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search customers by email, name, or Roblox username..."
              className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-slate-300">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Roblox</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Orders</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Spent</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer: any) => (
                  <tr
                    key={customer._id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                          <span className="text-white text-xs font-bold">{customer.displayName[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#1e1b4b" }}>{customer.displayName}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{customer.robloxUsername}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-medium" style={{ color: "#1e1b4b" }}>{customer.orderCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-emerald-600">${(customer.totalSpent || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{new Date(customer.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={customer.active !== false ? { background: "#ECFDF5", color: "#065F46" } : { background: "#F3F4F6", color: "#6B7280" }}>
                        {customer.active !== false ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => {
                          const newActive = customer.active === false;
                          if (window.confirm(`${newActive ? "Enable" : "Disable"} ${customer.email}?`)) {
                            updateMut.mutate({ id: customer._id, active: newActive });
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: customer.active !== false ? "#FEF2F2" : "#ECFDF5", color: customer.active !== false ? "#EF4444" : "#10B981" }}
                        title={customer.active !== false ? "Disable" : "Enable"}
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-sm text-slate-400">Page {page} of {pages} · {total} customers</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
