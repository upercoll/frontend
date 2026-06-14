import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Eye, MessageSquare, ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { adminApi } from "../api";
import type { Order, ClaimSession } from "../types";
import ChatWindow from "../components/ChatWindow";

const STATUS_OPTIONS = ["", "pending", "paid", "delivering", "completed", "cancelled", "refunded"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  paid: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  delivering: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  completed: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  cancelled: "bg-red-400/10 text-red-400 border-red-400/20",
  refunded: "bg-slate-400/10 text-slate-400 border-slate-400/20",
};

export default function Orders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [viewChat, setViewChat] = useState<ClaimSession | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const qc = useQueryClient();

  const params: Record<string, string> = { page: String(page), limit: "20" };
  if (search) params.search = search;
  if (status) params.status = status;

  const { data, isLoading } = useQuery({
    queryKey: ["panel-orders", params],
    queryFn: () => adminApi.orders.list(params),
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

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order #, email, Roblox username..."
            className="w-full bg-[#0d1f3c] border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-[#0d1f3c] border border-white/10 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || "All Statuses"}</option>
          ))}
        </select>
      </div>

      <div className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <p className="text-slate-400 text-sm">{total} orders</p>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/3 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No orders found</div>
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
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Claim</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: Order, i: number) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-blue-400 text-sm font-mono">{order.orderNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-white text-sm font-medium">{order.customer.robloxUsername}</p>
                      <p className="text-slate-500 text-xs">{order.customer.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-slate-300 text-xs">{order.items?.slice(0, 2).map((i) => i.productSnapshot.name).join(", ")}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-white text-sm font-medium">${order.pricing.total.toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_COLORS[order.status] || "bg-white/5 text-slate-400 border-white/10"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {order.claimSession && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.claimSession.status] || "bg-white/5 text-slate-400"}`}>
                          {order.claimSession.assignedAgent?.name || order.claimSession.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/orders/${order._id}`}>
                          <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        {order.claimSession && (
                          <button
                            onClick={() => openChat(order._id)}
                            className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center text-blue-400 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/5">
            <p className="text-slate-500 text-sm">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setViewChat(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl h-[600px] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Claim Chat</h3>
                <button onClick={() => setViewChat(null)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ChatWindow session={viewChat} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
