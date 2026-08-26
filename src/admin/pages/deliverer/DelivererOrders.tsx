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
  pending:            { bg: "rgba(254,249,195,0.15)", text: "#fde047",  dot: "#ca8a04" },
  paid:               { bg: "rgba(219,234,254,0.12)", text: "#93c5fd",  dot: "#3b82f6" },
  delivering:         { bg: "rgba(237,233,254,0.12)", text: "#c4b5fd",  dot: "#7c3aed" },
  completed:          { bg: "rgba(209,250,229,0.12)", text: "#6ee7b7",  dot: "#10b981" },
  cancelled:          { bg: "rgba(254,226,226,0.12)", text: "#fca5a5",  dot: "#ef4444" },
  refunded:           { bg: "rgba(243,244,246,0.08)", text: "#9ca3af",  dot: "#6b7280" },
  partially_refunded: { bg: "rgba(255,247,237,0.12)", text: "#fdba74",  dot: "#f97316" },
};

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Orders</h2>
          <p className="text-slate-500 text-sm mt-0.5">{total} paid orders</p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,22,40,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Filters */}
        <div className="px-5 py-4 border-b border-white/5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order #, email, username…"
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none text-white placeholder-slate-600"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <Filter className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-1" />
            {FILTER_TABS.map(tab => (
              <button key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
                style={status === tab.value
                  ? { background: "rgba(14,165,233,0.2)", color: "#7dd3fc", border: "1px solid rgba(14,165,233,0.3)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Order</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Customer</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 hidden md:table-cell">Items</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Total</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <>
                    <tr
                      key={order._id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.025)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-semibold text-sky-400">{order.orderNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{order.customer.robloxUsername}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[160px]">{order.customer.email}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          {order.items?.[0]?.productSnapshot?.gradient ? (
                            <div className="w-6 h-6 rounded flex-shrink-0" style={{ background: `linear-gradient(135deg, ${order.items[0].productSnapshot.gradient.from}, ${order.items[0].productSnapshot.gradient.to})` }} />
                          ) : (
                            <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <Package className="w-3 h-3 text-slate-500" />
                            </div>
                          )}
                          <span className="text-sm text-slate-300 truncate max-w-[180px]">
                            {order.items?.slice(0, 2).map(i => i.productSnapshot?.name).filter(Boolean).join(", ")}
                            {(order.items?.length || 0) > 2 && ` +${(order.items?.length || 0) - 2} more`}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-white">${order.pricing.total.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </td>
                    </tr>

                    {/* Expanded item detail row */}
                    <AnimatePresence>
                      {expandedOrder === order._id && (
                        <tr key={`${order._id}-expanded`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td colSpan={6} className="px-5 py-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="py-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <button onClick={e => { e.stopPropagation(); setExpandedOrder(null); }}
                                    className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5">
                                    <X className="w-3 h-3" />
                                  </button>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Items in this order</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {order.items.map((item, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                      <div className="relative w-full h-14" style={{
                                        background: item.productSnapshot.gradient
                                          ? `linear-gradient(135deg, ${item.productSnapshot.gradient.from} 0%, ${item.productSnapshot.gradient.to} 100%)`
                                          : "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                                      }}>
                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "10px 10px" }} />
                                        {item.productSnapshot.imageUrl && (
                                          <img src={item.productSnapshot.imageUrl} alt={item.productSnapshot.name} className="absolute inset-0 w-full h-full object-cover" />
                                        )}
                                      </div>
                                      <div className="p-2">
                                        <p className="text-white text-[11px] font-medium leading-tight line-clamp-2">{item.productSnapshot.name}</p>
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-slate-500 text-[10px]">×{item.quantity}</span>
                                          <span className="text-emerald-400 text-[10px] font-semibold">${item.unitPrice.toFixed(2)}</span>
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
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/5">
            <p className="text-sm text-slate-500">Page {page} of {pages} · {total} orders</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
