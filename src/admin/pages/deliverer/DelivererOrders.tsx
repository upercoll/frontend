import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, Package, X, Filter,
} from "lucide-react";
import { delivererGet } from "@/pages/DelivererLayout";
import { useQuery } from "@tanstack/react-query";

const STATUS_DISPLAY: Record<string, string> = {
  pending:            "Unpaid",
  paid:               "Paid",
  delivering:         "Delivering",
  completed:          "Completed",
  cancelled:          "Cancelled",
  refunded:           "Refunded",
  partially_refunded: "Partial Refund",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:            { bg: "var(--pn-warning-bg)", text: "var(--pn-warning-fg)",  dot: "var(--pn-warning)" },
  paid:               { bg: "rgba(219,234,254,0.12)", text: "var(--pn-action)",  dot: "var(--pn-action)" },
  delivering:         { bg: "rgba(237,233,254,0.12)", text: "var(--pn-text-3)",  dot: "var(--pn-action)" },
  completed:          { bg: "rgba(209,250,229,0.12)", text: "var(--pn-success-fg)",  dot: "var(--pn-success-fg)" },
  cancelled:          { bg: "rgba(254,226,226,0.12)", text: "var(--pn-critical-text)",  dot: "var(--pn-critical)" },
  refunded:           { bg: "rgba(243,244,246,0.08)", text: "var(--pn-text-3)",  dot: "var(--pn-text-2)" },
  partially_refunded: { bg: "rgba(255,247,237,0.12)", text: "var(--pn-warning-fg)",  dot: "var(--pn-warning-bg)" },
};
import { PageHeader } from "../../components/kit";

const FILTER_TABS = [
  { label: "All",        value: "" },
  { label: "Paid",       value: "paid" },
  { label: "Delivering", value: "delivering" },
  { label: "Completed",  value: "completed" },
  { label: "Cancelled",  value: "cancelled" },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.refunded;
  return (
    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5" style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {STATUS_DISPLAY[status] || status}
    </span>
  );
}

interface OrderItem {
  productSnapshot: { name: string; imageUrl?: string; gradient?: { from: string; to: string } };
  quantity: number;
  unitPrice: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: { email: string; robloxUsername: string };
  items: OrderItem[];
  pricing: { total: number };
  status: string;
  payment: { status: string };
  createdAt: string;
}

export default function DelivererOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: "25" });
  if (search) params.set("search", search);
  if (status) params.set("status", status);

  const { data, isLoading } = useQuery({
    queryKey: ["deliverer-orders", page, search, status],
    queryFn: () => delivererGet(`/orders?${params}`),
    staleTime: 30000,
  });

  const orders: Order[] = data?.data?.orders || [];
  const total: number   = data?.data?.total  || 0;
  const pages: number   = data?.data?.pages  || 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="Orders" description={`${total} paid orders`} icon={Package} />

      {/* Table card */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--pn-surface)", border: "1px solid var(--pn-border)" }}>
        {/* Filters */}
        <div className="px-5 py-4 border-b border-[var(--pn-border)] space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pn-text-2)]" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order #, email, username…"
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none text-[var(--pn-text)] placeholder-[var(--pn-text-3)]"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <Filter className="w-3.5 h-3.5 text-[var(--pn-text-2)] flex-shrink-0 mt-1" />
            {FILTER_TABS.map(tab => (
              <button key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
                style={status === tab.value
                  ? { background: "var(--pn-action-tint)", color: "var(--pn-action)", border: "1px solid var(--pn-action-tint)" }
                  : { background: "rgba(0,0,0,0.04)", color: "var(--pn-text-2)", border: "1px solid var(--pn-border)" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(0,0,0,0.04)" }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-10 h-10 text-[var(--pn-text)] mx-auto mb-3" />
            <p className="text-[var(--pn-text-2)] text-sm">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--pn-border)" }}>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--pn-text-2)]">Order</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--pn-text-2)]">Customer</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--pn-text-2)] hidden md:table-cell">Items</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--pn-text-2)]">Total</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--pn-text-2)]">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--pn-text-2)] hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <>
                    <tr
                      key={order._id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--pn-border)" }}
                      onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(0,0,0,0.04)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-semibold text-[var(--pn-action)]">{order.orderNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-[var(--pn-text)]">{order.customer.robloxUsername}</p>
                        <p className="text-xs text-[var(--pn-text-2)] truncate max-w-[160px]">{order.customer.email}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          {order.items?.[0]?.productSnapshot?.gradient ? (
                            <div className="w-6 h-6 rounded flex-shrink-0" style={{ background: `linear-gradient(135deg, ${order.items[0].productSnapshot.gradient.from}, ${order.items[0].productSnapshot.gradient.to})` }} />
                          ) : (
                            <div className="w-6 h-6 rounded bg-[var(--pn-surface-2)] border border-[var(--pn-border)] flex items-center justify-center flex-shrink-0">
                              <Package className="w-3 h-3 text-[var(--pn-text-2)]" />
                            </div>
                          )}
                          <span className="text-sm text-[var(--pn-text-3)] truncate max-w-[180px]">
                            {order.items?.slice(0, 2).map(i => i.productSnapshot?.name).filter(Boolean).join(", ")}
                            {(order.items?.length || 0) > 2 && ` +${(order.items?.length || 0) - 2} more`}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-[var(--pn-text)]">${(order.pricing?.total ?? 0).toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-[var(--pn-text-2)]">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </td>
                    </tr>

                    {/* Expanded item detail row */}
                    <AnimatePresence>
                      {expandedOrder === order._id && (
                        <tr key={`${order._id}-expanded`} style={{ borderBottom: "1px solid var(--pn-border)" }}>
                          <td colSpan={6} className="px-5 py-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="py-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <button onClick={e => { e.stopPropagation(); setExpandedOrder(null); }}
                                    className="w-5 h-5 rounded flex items-center justify-center text-[var(--pn-text-2)] hover:text-[var(--pn-text)] hover:bg-[var(--pn-surface-2)]">
                                    <X className="w-3 h-3" />
                                  </button>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--pn-text-2)]">Items in this order</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {order.items.map((item, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }}>
                                      <div className="relative w-full h-14" style={{
                                        background: item.productSnapshot.gradient
                                          ? `linear-gradient(135deg, ${item.productSnapshot.gradient.from} 0%, ${item.productSnapshot.gradient.to} 100%)`
                                          : "var(--pn-surface)",
                                      }}>
                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.1) 1px,transparent 1px)", backgroundSize: "10px 10px" }} />
                                        {item.productSnapshot.imageUrl && (
                                          <img src={item.productSnapshot.imageUrl} alt={item.productSnapshot.name} className="absolute inset-0 w-full h-full object-cover" />
                                        )}
                                      </div>
                                      <div className="p-2">
                                        <p className="text-[var(--pn-text)] text-[11px] font-medium leading-tight line-clamp-2">{item.productSnapshot.name}</p>
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-[var(--pn-text-2)] text-[10px]">×{item.quantity}</span>
                                          <span className="text-[var(--pn-success-fg)] text-[10px] font-semibold">${(item.unitPrice ?? 0).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--pn-border)]">
            <p className="text-sm text-[var(--pn-text-2)]">Page {page} of {pages} · {total} orders</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)", color: "var(--pn-text-3)" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)", color: "var(--pn-text-3)" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
