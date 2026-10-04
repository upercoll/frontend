import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Users, DollarSign, ShoppingBag, UserX, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { adminApi } from "../api";
import { PageHeader, MetricTile } from "../components/kit";

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
      <PageHeader title="Customers" description="Manage customer accounts and view their order history" icon={Users} />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Total Customers", value: stats.total, color: "var(--pn-action)" },
            { icon: Users, label: "Active Customers", value: stats.active, color: "var(--pn-success-fg)" },
            { icon: TrendingUp, label: "New This Month", value: stats.newThisMonth, color: "#f59e0b" },
            { icon: DollarSign, label: "Top Spender", value: stats.topSpenders?.[0] ? `$${stats.topSpenders[0].total.toFixed(2)}` : "-", color: "var(--pn-action)" },
          ].map(({ icon: Icon, label, value }, i) => (
            <MetricTile key={i} label={label}
              value={typeof value === "number" ? value.toLocaleString() : value}
              icon={Icon} />
          ))}
        </div>
      )}

      {stats?.topSpenders && stats.topSpenders.length > 0 && (
        <div className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "var(--pn-text)" }}>Top Spenders</h3>
          <div className="space-y-3">
            {stats.topSpenders.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-[var(--pn-text)] flex-shrink-0"
                  style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : "#cd7f32" }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--pn-text)" }}>{s.robloxUsername || s._id}</p>
                  <p className="text-xs text-[var(--pn-text-3)] truncate">{s._id}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[var(--pn-success-fg)]">${s.total.toFixed(2)}</p>
                  <p className="text-xs text-[var(--pn-text-3)]">{s.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pn-text-3)]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search customers by email, name, or Roblox username..."
              className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "var(--pn-surface-2)" }} />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-[var(--pn-text-3)]">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden md:table-cell">Roblox</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Orders</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Spent</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden lg:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer: any) => (
                  <tr
                    key={customer._id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--pn-border)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--pn-surface-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--pn-action)" }}>
                          <span className="text-white text-xs font-bold">{customer.displayName[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--pn-text)" }}>{customer.displayName}</p>
                          <p className="text-xs text-[var(--pn-text-3)] truncate max-w-[160px]">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-[var(--pn-text-2)]">{customer.robloxUsername}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-[var(--pn-text-3)]" />
                        <span className="text-sm font-medium" style={{ color: "var(--pn-text)" }}>{customer.orderCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-[var(--pn-success-fg)]">${(customer.totalSpent || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-[var(--pn-text-3)]">{new Date(customer.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={customer.active !== false ? { background: "var(--pn-success-bg)", color: "var(--pn-success-fg)" } : { background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>
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
                        style={{ background: customer.active !== false ? "var(--pn-critical-bg)" : "var(--pn-success-bg)", color: customer.active !== false ? "var(--pn-critical-text)" : "var(--pn-success-fg)" }}
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
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: "1px solid var(--pn-border)" }}>
            <p className="text-sm text-[var(--pn-text-3)]">Page {page} of {pages} · {total} customers</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
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
