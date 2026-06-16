import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Package, MessageSquare, X, Loader2, Check, Edit2 } from "lucide-react";
import { adminApi } from "../api";
import type { Order, ClaimSession } from "../types";
import ChatWindow from "../components/ChatWindow";

const STATUS_DISPLAY: Record<string, string> = {
  pending: "Unpaid", paid: "Paid", delivering: "Delivering",
  completed: "Completed", cancelled: "Cancelled", refunded: "Refunded", fulfilled: "Fulfilled",
};
const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending:   { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  paid:      { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  delivering:{ bg: "#EDE9FE", text: "#5B21B6", border: "#A78BFA" },
  completed: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  refunded:  { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  fulfilled: { bg: "#ECFDF5", text: "#065F46", border: "#34D399" },
};

const VALID_STATUSES = ["pending","paid","delivering","completed","cancelled","refunded","fulfilled"];

export default function OrderDetail() {
  const [, params] = useRoute("/admin/orders/:id");
  const orderId = params?.id || "";
  const qc = useQueryClient();
  const [viewChat, setViewChat] = useState<ClaimSession | null>(null);
  const [editStatus, setEditStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [editNotes, setEditNotes] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["panel-order", orderId],
    queryFn: () => adminApi.orders.get(orderId),
    enabled: !!orderId,
  });

  const updateMut = useMutation({
    mutationFn: ({ status, notes }: { status?: string; notes?: string }) =>
      adminApi.orders.updateStatus(orderId, status || order?.status || "", notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panel-order", orderId] });
      setEditStatus(false);
      setEditNotes(false);
    },
    onError: (err: Error) => alert(err.message),
  });

  const order: Order | undefined = data?.data?.order;
  const claimSession: ClaimSession | undefined = data?.data?.claimSession;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4f46e5" }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-slate-400">Order not found</p>
        <Link href="/admin/orders">
          <button className="mt-4 text-indigo-600 text-sm hover:underline">← Back to Orders</button>
        </Link>
      </div>
    );
  }

  const s = STATUS_STYLES[order.status] || STATUS_STYLES.refunded;

  return (
    <div className="p-6 space-y-5 max-w-[1100px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>
            Order <span style={{ color: "#4f46e5" }}>{order.orderNumber}</span>
          </h2>
          <p className="text-sm text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {claimSession && (
            <button
              onClick={() => setViewChat(claimSession)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "#EEF2FF", color: "#4f46e5", border: "1px solid #C7D2FE" }}
            >
              <MessageSquare className="w-4 h-4" />
              View Claim Chat
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
            <h3 className="font-bold text-sm mb-4" style={{ color: "#1e1b4b" }}>Items ({order.items?.length || 0})</h3>
            <div className="space-y-3">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
                  {item.productSnapshot?.imageUrl ? (
                    <img src={item.productSnapshot.imageUrl} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: item.productSnapshot?.gradient ? `linear-gradient(135deg,${item.productSnapshot.gradient.from},${item.productSnapshot.gradient.to})` : "#E5E7EB" }}>
                      <Package className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1e1b4b" }}>{item.productSnapshot.name}</p>
                    <p className="text-xs text-slate-400">{item.productSnapshot.game} · Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: "#1e1b4b" }}>${item.totalPrice.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">${item.unitPrice.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid #F3F4F6" }}>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>${order.pricing.subtotal.toFixed(2)}</span>
              </div>
              {order.pricing.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>-${order.pricing.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold" style={{ color: "#1e1b4b" }}>
                <span>Total</span>
                <span>${order.pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ color: "#1e1b4b" }}>Admin Notes</h3>
              <button onClick={() => { setAdminNotes(order.adminNotes || ""); setEditNotes(true); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: "#EEF2FF", color: "#4f46e5" }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {editNotes ? (
              <div className="space-y-2">
                <textarea
                  value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3}
                  placeholder="Add internal notes about this order..."
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditNotes(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => updateMut.mutate({ status: order.status, notes: adminNotes })}
                    disabled={updateMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                    style={{ background: "#1e1b4b" }}>
                    {updateMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: order.adminNotes ? "#374151" : "#9ca3af" }}>
                {order.adminNotes || "No notes yet."}
              </p>
            )}
          </div>

          {claimSession && (
            <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: "#1e1b4b" }}>Claim Session</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Room ID</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: "#4f46e5" }}>{claimSession.roomId}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Status</p>
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-0.5"
                    style={{ background: "#ECFDF5", color: "#065F46" }}>
                    {claimSession.status}
                  </span>
                </div>
                {claimSession.assignedAgent && (
                  <div>
                    <p className="text-slate-400 text-xs">Assigned Agent</p>
                    <p className="font-medium mt-0.5" style={{ color: "#1e1b4b" }}>{claimSession.assignedAgent.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-400 text-xs">Messages</p>
                  <p className="font-medium mt-0.5" style={{ color: "#1e1b4b" }}>{claimSession.messages?.length || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "#1e1b4b" }}>Order Status</h3>
            {editStatus ? (
              <div className="space-y-2">
                <select
                  value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                >
                  <option value="">Select status</option>
                  {VALID_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_DISPLAY[s] || s}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setEditStatus(false)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => { if (newStatus) updateMut.mutate({ status: newStatus }); }}
                    disabled={!newStatus || updateMut.isPending}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "#1e1b4b" }}>
                    {updateMut.isPending ? "Saving…" : "Update"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm px-3 py-1.5 rounded-full font-semibold border"
                  style={{ background: s.bg, color: s.text, borderColor: s.border }}>
                  {STATUS_DISPLAY[order.status] || order.status}
                </span>
                <button
                  onClick={() => { setNewStatus(order.status); setEditStatus(true); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "#EEF2FF", color: "#4f46e5" }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "#1e1b4b" }}>Customer</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Roblox Username</p>
                <p className="font-semibold mt-0.5" style={{ color: "#1e1b4b" }}>{order.customer.robloxUsername}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Email</p>
                <p className="mt-0.5 text-slate-600 break-all">{order.customer.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "#1e1b4b" }}>Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Method</span>
                <span className="font-medium capitalize" style={{ color: "#1e1b4b" }}>{order.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-semibold capitalize"
                  style={{ color: order.payment.status === "succeeded" ? "#10b981" : "#ef4444" }}>
                  {order.payment.status}
                </span>
              </div>
              {order.payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid at</span>
                  <span style={{ color: "#374151" }}>{new Date(order.payment.paidAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
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
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ background: "rgba(124,58,237,0.2)", borderBottom: "1px solid rgba(196,181,253,0.1)" }}>
                <h3 className="text-white font-semibold">Claim Chat — {order.orderNumber}</h3>
                <button onClick={() => setViewChat(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
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
