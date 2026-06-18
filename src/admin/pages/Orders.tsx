import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Eye, MessageSquare, ChevronLeft, ChevronRight,
  X, CheckSquare, Square, ChevronDown, Package, Loader2, RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "../api";
import type { Order, ClaimSession } from "../types";
import ChatWindow from "../components/ChatWindow";

const STATUS_DISPLAY: Record<string, string> = {
  pending:            "Unpaid",
  paid:               "Paid",
  delivering:         "Delivering",
  completed:          "Completed",
  cancelled:          "Cancelled",
  refunded:           "Refunded",
  partially_refunded: "Partial Refund",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending:            { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  paid:               { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  delivering:         { bg: "#EDE9FE", text: "#5B21B6", border: "#A78BFA" },
  completed:          { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  cancelled:          { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  refunded:           { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  partially_refunded: { bg: "#FFF7ED", text: "#9A3412", border: "#FDBA74" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.refunded;
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {STATUS_DISPLAY[status] || status}
    </span>
  );
}

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Unpaid", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Delivering", value: "delivering" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
  { label: "Partial Refund", value: "partially_refunded" },
];

const VALID_STATUSES = ["pending", "paid", "delivering", "completed", "cancelled", "refunded", "partially_refunded"];

export default function Orders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [viewChat, setViewChat] = useState<ClaimSession | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDropOpen, setBulkDropOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const qc = useQueryClient();

  const params: Record<string, string> = { page: String(page), limit: "25" };
  if (search) params.search = search;
  if (status) params.status = status;

  const { data, isLoading } = useQuery({
    queryKey: ["panel-orders", params],
    queryFn: () => adminApi.orders.list(params),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.orders.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-orders"] }),
  });

  const orders = data?.data.orders || [];
  const total = data?.data.total || 0;
  const pages = data?.data.pages || 1;

  const openChat = async (orderId: string) => {
    setLoadingChat(true);
    try {
      const res = await adminApi.orders.getClaimChat(orderId);
      setViewChat(res.data.claimSession);
    } catch {
      alert("No claim session found for this order");
    } finally {
      setLoadingChat(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map((o: Order) => o._id)));
  };

  const handleStripeSync = async () => {
    setSyncing(true);
    try {
      const res = await adminApi.orders.syncStripe();
      qc.invalidateQueries({ queryKey: ["panel-orders"] });
      alert(`Stripe sync complete!\n\nChecked: ${res.data.checked} orders\nFixed (now marked paid): ${res.data.fixed} orders\n${res.data.fixed > 0 ? `\nFixed orders: ${res.data.fixedOrders.join(", ")}` : ""}`);
    } catch (e: any) {
      alert(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkUpdate = async (newStatus: string) => {
    if (!newStatus || selected.size === 0) return;
    setBulkLoading(true);
    setBulkDropOpen(false);
    try {
      await adminApi.orders.bulkUpdateStatus(Array.from(selected), newStatus);
      qc.invalidateQueries({ queryKey: ["panel-orders"] });
      setSelected(new Set());
    } catch (e: any) {
      alert(e.message || "Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Orders</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} total orders</p>
        </div>
        <button
          onClick={handleStripeSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
          style={{ background: "#4f46e5", color: "#fff" }}
          title="Check Stripe for any orders that were paid but not updated in the system"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncing ? "Syncing..." : "Sync with Stripe"}
        </button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by order #, email, username..."
                className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
              />
            </div>

            {selected.size > 0 && (
              <div className="relative">
                <button
                  onClick={() => setBulkDropOpen((o) => !o)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "#1e1b4b", color: "#fff" }}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {selected.size} selected
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {bulkDropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl z-10 overflow-hidden"
                      style={{ border: "1px solid #E9EBF5" }}
                    >
                      <div className="px-3 py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Update Status</p>
                      </div>
                      {VALID_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleBulkUpdate(s)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#F7F8FC] transition-colors"
                          style={{ color: "#374151" }}
                        >
                          → {STATUS_DISPLAY[s] || s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1); setSelected(new Set()); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                style={status === tab.value
                  ? { background: "#1e1b4b", color: "#fff" }
                  : { background: "#F7F8FC", color: "#6b7280", border: "1px solid #E9EBF5" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-slate-400">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll}>
                      {selected.size === orders.length && orders.length > 0
                        ? <CheckSquare className="w-4 h-4" style={{ color: "#4f46e5" }} />
                        : <Square className="w-4 h-4 text-slate-300" />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: Order) => {
                  const isSelected = selected.has(order._id);
                  return (
                    <tr
                      key={order._id}
                      className="transition-colors cursor-pointer"
                      style={{
                        borderBottom: "1px solid #F3F4F6",
                        background: isSelected ? "#EEF2FF" : undefined,
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td className="px-4 py-3.5 w-10" onClick={(e) => { e.stopPropagation(); toggleSelect(order._id); }}>
                        {isSelected
                          ? <CheckSquare className="w-4 h-4" style={{ color: "#4f46e5" }} />
                          : <Square className="w-4 h-4 text-slate-300" />}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-mono font-semibold" style={{ color: "#4f46e5" }}>{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium" style={{ color: "#1e1b4b" }}>{order.customer.robloxUsername}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">{order.customer.email}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          {order.items?.[0]?.productSnapshot?.imageUrl ? (
                            <img src={order.items[0].productSnapshot.imageUrl} className="w-6 h-6 rounded object-cover flex-shrink-0" alt="" />
                          ) : (
                            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: order.items?.[0]?.productSnapshot?.gradient ? `linear-gradient(135deg, ${order.items[0].productSnapshot.gradient.from}, ${order.items[0].productSnapshot.gradient.to})` : "#E5E7EB" }}>
                              <Package className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <span className="text-sm text-slate-600 truncate max-w-[180px]">
                            {order.items?.slice(0, 2).map((i) => i.productSnapshot.name).join(", ")}
                            {(order.items?.length || 0) > 2 && ` +${(order.items?.length || 0) - 2} more`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>${order.pricing.total.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/orders/${order._id}`}>
                            <button
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: "#EEF2FF", color: "#4f46e5" }}
                              title="View order"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          {order.claimSession && (
                            <button
                              onClick={() => openChat(order._id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: "#EEF2FF", color: "#4f46e5" }}
                              title="View claim chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-sm text-slate-400">Page {page} of {pages} · {total} orders</p>
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

      <AnimatePresence>
        {viewChat && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setViewChat(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
              className="w-full max-w-2xl h-[600px] flex flex-col bg-[#110025] rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: "1px solid rgba(196,181,253,0.15)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ background: "rgba(124,58,237,0.2)", borderBottom: "1px solid rgba(196,181,253,0.1)" }}>
                <h3 className="text-white font-semibold">Claim Chat</h3>
                <button onClick={() => setViewChat(null)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ChatWindow session={viewChat} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
