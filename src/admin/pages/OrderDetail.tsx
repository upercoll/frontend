import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft, Package, MessageSquare, X, Loader2, Check, Edit2,
  Printer, MoreHorizontal, RefreshCw, Truck, Tag, AlertTriangle,
  ChevronDown, Plus, Clock, CheckCircle2, XCircle, RotateCcw,
  ShieldCheck, User, Mail, MapPin, CreditCard, Hash,
} from "lucide-react";
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
  partially_refunded: "Partially Refunded",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending:            { bg: "var(--pn-warning-bg)", text: "var(--pn-warning-fg)", border: "var(--pn-warning-line)" },
  paid:               { bg: "var(--pn-action-tint)", text: "var(--pn-info-fg)", border: "var(--pn-action-border)" },
  delivering:         { bg: "var(--pn-action-tint)", text: "var(--pn-action)", border: "var(--pn-action-border)" },
  completed:          { bg: "var(--pn-success-bg)", text: "var(--pn-success-fg)", border: "var(--pn-success-line)" },
  cancelled:          { bg: "var(--pn-critical-bg)", text: "var(--pn-critical-fg)", border: "var(--pn-critical-line)" },
  refunded:           { bg: "var(--pn-surface-2)", text: "var(--pn-text)", border: "var(--pn-border-strong)" },
  partially_refunded: { bg: "var(--pn-warning-bg)", text: "var(--pn-warning-fg)", border: "var(--pn-warning-line)" },
};
import { PageHeader } from "../components/kit";

const VALID_STATUSES = ["pending", "paid", "delivering", "completed", "cancelled", "refunded", "partially_refunded"];

const REFUND_REASONS = [
  "Customer request",
  "Item not delivered",
  "Wrong item",
  "Quality issue",
  "Duplicate order",
  "Other",
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.refunded;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {STATUS_DISPLAY[status] || status}
    </span>
  );
}

export default function OrderDetail() {
  const [, params] = useRoute("/admin/orders/:id");
  const orderId = params?.id || "";
  const qc = useQueryClient();

  const [viewChat, setViewChat] = useState<ClaimSession | null>(null);
  const [editStatus, setEditStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [editNotes, setEditNotes] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState(REFUND_REASONS[0]);
  const [refundRestockItems, setRefundRestockItems] = useState(true);
  const [showFulfill, setShowFulfill] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [editTags, setEditTags] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [showMoreActions, setShowMoreActions] = useState(false);

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
      setEditStatus(false); setEditNotes(false);
    },
    onError: (err: Error) => alert(err.message),
  });

  const fulfillMut = useMutation({
    mutationFn: () => adminApi.orders.fulfill(orderId, { trackingNumber, carrier }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panel-order", orderId] });
      setShowFulfill(false); setTrackingNumber(""); setCarrier("");
    },
    onError: (err: Error) => alert(err.message),
  });

  // Refundable = order total minus anything already refunded (backend enforces this too,
  // but the UI must not offer an amount that will just be rejected).
  const orderPricing = data?.data?.order?.pricing;
  const alreadyRefunded = data?.data?.order?.refundAmount || 0;
  const refundable = Math.max(0, (orderPricing?.total || 0) - alreadyRefunded);

  const refundMut = useMutation({
    mutationFn: () => adminApi.orders.refund(orderId, {
      amount: parseFloat(refundAmount),
      reason: refundReason,
      restockItems: refundRestockItems,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["panel-order", orderId] });
      setShowRefund(false);
      setRefundAmount("");
      alert(res.data.message);
    },
    onError: (err: Error) => alert(err.message),
  });

  const tagsMut = useMutation({
    mutationFn: (tags: string[]) => adminApi.orders.updateTags(orderId, tags),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panel-order", orderId] });
      setEditTags(false);
    },
  });

  const timelineMut = useMutation({
    mutationFn: () => adminApi.orders.addTimeline(orderId, { action: "Comment added", details: comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panel-order", orderId] });
      setComment("");
    },
    onError: (err: Error) => setCommentError(err.message),
  });

  const order: Order | undefined = data?.data?.order;
  const claimSession: ClaimSession | undefined = data?.data?.claimSession;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--pn-action)" }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-[var(--pn-text-3)]">Order not found</p>
        <Link href="/admin/orders">
          <button className="mt-4 text-[var(--pn-action)] text-sm hover:underline">← Back to Orders</button>
        </Link>
      </div>
    );
  }

  const s = STATUS_STYLES[order.status] || STATUS_STYLES.refunded;
  const isPaid = order.payment?.status === "succeeded";
  const isFulfilled = order.status === "completed";
  const isRefundable = isPaid && !["refunded", "cancelled"].includes(order.status);
  const isFulfillable = !isFulfilled && ["paid", "delivering"].includes(order.status);
  const tags: string[] = (order as any).tags || [];
  const timeline: Array<{ action: string; by: string; details?: string; timestamp: string }> = (order as any).timeline || [];
  const customerOrderCount: number = (order as any).customerOrderCount || 1;

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTags = [...tags, tagInput.trim()];
    tagsMut.mutate(newTags);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    tagsMut.mutate(tags.filter(t => t !== tag));
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/admin/orders">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <PageHeader title={`#${order.orderNumber}`} icon={Package}
            description={<>
              {new Date(order.createdAt).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
              {" "}&mdash; from {(order as any).source || "Online Store"}
            </>}>
            <StatusBadge status={order.payment?.status === "succeeded" ? "paid" : "pending"} />
            <StatusBadge status={order.status} />
          </PageHeader>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isRefundable && (
            <button onClick={() => setShowRefund(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ background: "white", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
              <RotateCcw className="w-3.5 h-3.5" />
              Refund
            </button>
          )}
          {isFulfillable && (
            <button onClick={() => setShowFulfill(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white"
              style={{ background: "var(--pn-primary)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Completed
            </button>
          )}
          {claimSession && (
            <button onClick={() => setViewChat(claimSession)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ background: "white", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowMoreActions(v => !v)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ background: "white", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
              More actions <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {showMoreActions && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1.5 w-44 bg-[var(--pn-surface)] rounded-xl z-20 overflow-hidden"
                  style={{ border: "1px solid var(--pn-border)" }}>
                  <button onClick={() => { setNewStatus(order.status); setEditStatus(true); setShowMoreActions(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--pn-surface-2)] flex items-center gap-2" style={{ color: "var(--pn-text)" }}>
                    <Edit2 className="w-3.5 h-3.5" /> Change Status
                  </button>
                  <button onClick={() => window.print()}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--pn-surface-2)] flex items-center gap-2" style={{ color: "var(--pn-text)" }}>
                    <Printer className="w-3.5 h-3.5" /> Print Order
                  </button>
                  {!["cancelled", "refunded"].includes(order.status) && isPaid && (
                    <button onClick={() => {
                      if (window.confirm("Cancel this order?")) updateMut.mutate({ status: "cancelled" });
                      setShowMoreActions(false);
                    }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--pn-critical-bg)] flex items-center gap-2" style={{ color: "var(--pn-critical-text)" }}>
                      <XCircle className="w-3.5 h-3.5" /> Cancel Order
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items / Fulfillment Card */}
          <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--pn-border)" }}>
              <div className="flex items-center gap-2">
                {isFulfilled
                  ? <CheckCircle2 className="w-4 h-4 text-[var(--pn-success-fg)]" />
                  : <Clock className="w-4 h-4 text-[var(--pn-warning-fg)]" />}
                <span className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>
                  {isFulfilled ? "Completed" : "Pending Delivery"}
                </span>
              </div>
              {isFulfilled && order.fulfilledAt && (
                <span className="text-xs text-[var(--pn-text-3)]">
                  {new Date((order as any).fulfilledAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="p-5">
              {isFulfilled && (
                <div className="flex items-center gap-2 text-xs text-[var(--pn-text-2)] mb-4 pb-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                  <Truck className="w-3.5 h-3.5" />
                  <span>
                    {(order as any).delivery?.trackingNumber
                      ? `Tracking: ${(order as any).delivery.trackingNumber}`
                      : "Shipping not required"}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.productSnapshot?.imageUrl ? (
                      <img src={item.productSnapshot.imageUrl} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-[var(--pn-border)]" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border border-[var(--pn-border)]"
                        style={{ background: item.productSnapshot?.gradient ? `linear-gradient(135deg,${item.productSnapshot.gradient.from},${item.productSnapshot.gradient.to})` : "var(--pn-border)" }}>
                        <Package className="w-5 h-5 text-[var(--pn-text)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--pn-text)" }}>{item.productSnapshot.name}</p>
                      <p className="text-xs text-[var(--pn-text-3)]">{item.productSnapshot.game}</p>
                    </div>
                    <div className="text-right flex-shrink-0 text-sm" style={{ color: "var(--pn-text)" }}>
                      ${(item.unitPrice ?? 0).toFixed(2)} × {item.quantity}
                    </div>
                    <div className="text-right flex-shrink-0 font-bold text-sm w-20" style={{ color: "var(--pn-text)" }}>
                      ${item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {!isFulfilled && (
                <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--pn-border)" }}>
                  <button onClick={() => setShowFulfill(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                    style={{ background: "var(--pn-primary)" }}>
                    <Plus className="w-3.5 h-3.5" />
                    Add tracking / Complete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
            <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: "1px solid var(--pn-border)" }}>
              <CreditCard className="w-4 h-4" style={{ color: isPaid ? "var(--pn-success-fg)" : "var(--pn-warning-fg)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>
                {isPaid ? "Paid" : "Unpaid"}
              </span>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div className="flex justify-between text-[var(--pn-text-2)]">
                <span>Subtotal</span>
                <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""} &nbsp; ${(order.pricing?.subtotal ?? 0).toFixed(2)}</span>
              </div>
              {order.pricing.discount > 0 && (
                <div className="flex justify-between text-[var(--pn-success-fg)]">
                  <span>Discount {order.pricing.promoCode ? `(${order.pricing.promoCode})` : ""}</span>
                  <span>-${(order.pricing?.discount ?? 0).toFixed(2)}</span>
                </div>
              )}
              {(order.pricing?.tax ?? 0) > 0 && (
                <div className="flex justify-between text-[var(--pn-text-2)]">
                  <span>{order.pricing.taxLabel || "Sales Tax"}</span>
                  <span>${(order.pricing.tax ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2" style={{ color: "var(--pn-text)", borderTop: "1px solid var(--pn-border)" }}>
                <span>Total</span>
                <span>${(order.pricing?.total ?? 0).toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-[var(--pn-text-3)]">
                Revenue counts ${Math.max(0, (order.pricing?.total ?? 0) - (order.pricing?.tax ?? 0)).toFixed(2)}
                {" "}— tax is excluded because it is remitted, not earned.
              </p>
              <div className="flex justify-between text-[var(--pn-text-2)]">
                <span>{isPaid ? "Paid" : "Pending"}</span>
                <span>${isPaid ? (order.pricing?.total ?? 0).toFixed(2) : "0.00"}</span>
              </div>
              {(order as any).refundAmount > 0 && (
                <div className="flex justify-between text-[var(--pn-warning-fg)]">
                  <span>Refunded</span>
                  <span>-${((order as any).refundAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-[var(--pn-text-3)] pt-1">
                <span>Payment method</span>
                <span className="capitalize">{order.payment.method}</span>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm" style={{ color: "var(--pn-text)" }}>Internal Notes</h3>
              <button onClick={() => { setAdminNotes(order.adminNotes || ""); setEditNotes(true); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {editNotes ? (
              <div className="space-y-2">
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3}
                  placeholder="Add internal notes..."
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)] resize-none"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} autoFocus />
                <div className="flex gap-2">
                  <button onClick={() => setEditNotes(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>Cancel</button>
                  <button onClick={() => updateMut.mutate({ status: order.status, notes: adminNotes })}
                    disabled={updateMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: "var(--pn-primary)" }}>
                    {updateMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: order.adminNotes ? "var(--pn-text)" : "var(--pn-text-3)" }}>
                {order.adminNotes || "No notes yet."}
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
            <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--pn-border)" }}>
              <h3 className="font-semibold text-sm" style={{ color: "var(--pn-text)" }}>Timeline</h3>
            </div>
            <div className="p-5">
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: "var(--pn-action)" }}>
                  {((data as any)?.data?.profile?.displayName || "A")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea value={comment} onChange={e => { setComment(e.target.value); if (commentError) setCommentError(""); }} rows={2}
                    placeholder="Leave a comment..."
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)] resize-none"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
                  <div className="flex justify-between items-center mt-2">
                    <p className={`text-xs ${commentError ? "text-[var(--pn-critical-text)]" : "text-[var(--pn-text-3)]"}`}>
                      {commentError || "Only staff can see comments"}
                    </p>
                    <button onClick={() => { if (comment.trim()) timelineMut.mutate(); }}
                      disabled={!comment.trim() || timelineMut.isPending}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-colors"
                      style={{ background: "var(--pn-primary)" }}>
                      {timelineMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-2">
                {[...timeline].reverse().map((event, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--pn-action)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: "var(--pn-text)" }}>{event.action}</p>
                      {event.details && <p className="text-xs text-[var(--pn-text-3)] mt-0.5">{event.details}</p>}
                      <p className="text-xs text-[var(--pn-text-3)] mt-0.5">
                        {event.by} &mdash; {new Date(event.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--pn-border-strong)" }} />
                  <p className="text-sm text-[var(--pn-text-3)]">
                    Order placed &mdash; {new Date(order.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Notes from customer */}
          <div className="bg-[var(--pn-surface)] rounded-xl p-4" style={{ border: "1px solid var(--pn-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>Notes</h3>
              <button className="w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--pn-text-3)" }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-[var(--pn-text-3)]">{(order as any).notes || "No notes from customer"}</p>
          </div>

          {/* Order Status */}
          <div className="bg-[var(--pn-surface)] rounded-xl p-4" style={{ border: "1px solid var(--pn-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>Order Status</h3>
              <button onClick={() => { setNewStatus(order.status); setEditStatus(true); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {editStatus ? (
              <div className="space-y-2">
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                  <option value="">Select status</option>
                  {VALID_STATUSES.filter(s => isPaid || !["cancelled", "refunded"].includes(s)).map((s) => (
                    <option key={s} value={s}>{STATUS_DISPLAY[s] || s}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setEditStatus(false)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>Cancel</button>
                  <button onClick={() => { if (newStatus) updateMut.mutate({ status: newStatus }); }}
                    disabled={!newStatus || updateMut.isPending}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--pn-primary)" }}>
                    {updateMut.isPending ? "Saving…" : "Update"}
                  </button>
                </div>
              </div>
            ) : (
              <StatusBadge status={order.status} />
            )}
          </div>

          {/* Customer */}
          <div className="bg-[var(--pn-surface)] rounded-xl p-4" style={{ border: "1px solid var(--pn-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>Customer</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--pn-action-tint)] flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-[var(--pn-action)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--pn-action)" }}>{order.customer.robloxUsername}</p>
                  <p className="text-xs text-[var(--pn-text-3)]">{customerOrderCount} order{customerOrderCount !== 1 ? "s" : ""}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--pn-text-2)] mb-1">Contact information</p>
                <p className="text-xs text-[var(--pn-action)] break-all">{order.customer.email}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--pn-text-2)] mb-1">Shipping address</p>
                {order.customer.shippingAddress?.line1 ? (
                  <div className="text-xs text-[var(--pn-text-2)] space-y-0.5">
                    <p>{order.customer.shippingAddress.line1}</p>
                    {order.customer.shippingAddress.line2 && <p>{order.customer.shippingAddress.line2}</p>}
                    <p>{order.customer.shippingAddress.city}, {order.customer.shippingAddress.state} {order.customer.shippingAddress.postalCode}</p>
                    <p>{order.customer.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--pn-text-3)]">No shipping address provided</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--pn-text-2)] mb-1">Billing address</p>
                {order.customer.billingAddress?.name ? (
                  <div className="text-xs text-[var(--pn-text-2)] space-y-0.5">
                    <p className="font-medium">{order.customer.billingAddress.name}</p>
                    {order.customer.billingAddress.line1 && <p>{order.customer.billingAddress.line1}</p>}
                    {order.customer.billingAddress.city && (
                      <p>{order.customer.billingAddress.city}, {order.customer.billingAddress.state} {order.customer.billingAddress.postalCode}</p>
                    )}
                    {order.customer.billingAddress.country && <p>{order.customer.billingAddress.country}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--pn-text-3)]">Same as shipping</p>
                )}
              </div>
            </div>
          </div>

          {/* Conversion Summary */}
          <div className="bg-[var(--pn-surface)] rounded-xl p-4" style={{ border: "1px solid var(--pn-border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--pn-text)" }}>Conversion summary</h3>
            <div className="space-y-1.5 text-xs text-[var(--pn-text-2)]">
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-[var(--pn-text-3)]" />
                <span>This is their {customerOrderCount === 1 ? "1st" : customerOrderCount === 2 ? "2nd" : customerOrderCount === 3 ? "3rd" : `${customerOrderCount}th`} order</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-[var(--pn-text-3)]" />
                <span className="capitalize">{order.payment.method} payment</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--pn-text-3)]" />
                <span>Payment {order.payment.status}</span>
              </div>
            </div>
          </div>

          {/* Order Risk */}
          <div className="bg-[var(--pn-surface)] rounded-xl p-4" style={{ border: "1px solid var(--pn-border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--pn-text)" }}>Order risk</h3>
            <div className="flex items-center gap-1 mb-2">
              {["low", "medium", "high"].map((level, i) => {
                const risk = (order as any).riskLevel || "low";
                const activeIdx = risk === "low" ? 0 : risk === "medium" ? 1 : 2;
                return (
                  <div key={level} className="h-2 flex-1 rounded-full"
                    style={{ background: i <= activeIdx ? (i === 0 ? "var(--pn-success-bg)" : i === 1 ? "var(--pn-warning-bg)" : "var(--pn-critical)") : "var(--pn-surface-2)" }} />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-[var(--pn-text-3)] mb-2">
              <span>Low</span><span>Medium</span><span>High</span>
            </div>
            <p className="text-xs text-[var(--pn-text-2)]">
              {(order as any).riskLevel === "high"
                ? "High risk order. Review before fulfilling."
                : (order as any).riskLevel === "medium"
                ? "Medium risk. Verify customer details."
                : "Chargeback risk is low. You can fulfill this order."}
            </p>
          </div>

          {/* Tags */}
          <div className="bg-[var(--pn-surface)] rounded-xl p-4" style={{ border: "1px solid var(--pn-border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--pn-text)" }}>Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map(tag => (
                <span key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag..."
                className="flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
              <button onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--pn-primary)", color: "white" }}>
                Add
              </button>
            </div>
          </div>

          {/* Claim Session */}
          {claimSession && (
            <div className="bg-[var(--pn-surface)] rounded-xl p-4" style={{ border: "1px solid var(--pn-border)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--pn-text)" }}>Claim Session</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--pn-text-3)]">Room ID</span>
                  <span className="font-mono text-[var(--pn-action)]">{claimSession.roomId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--pn-text-3)]">Status</span>
                  <span className="font-semibold capitalize">{claimSession.status}</span>
                </div>
                {claimSession.assignedAgent && (
                  <div className="flex justify-between">
                    <span className="text-[var(--pn-text-3)]">Agent</span>
                    <span style={{ color: "var(--pn-text)" }}>{claimSession.assignedAgent.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--pn-text-3)]">Messages</span>
                  <span style={{ color: "var(--pn-text)" }}>{claimSession.messages?.length || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      <AnimatePresence>
        {showRefund && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4"
            onClick={() => setShowRefund(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="pn-modal w-full max-w-md overflow-hidden"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: "var(--pn-text)" }}>Issue Refund</h3>
                  <p className="text-xs text-[var(--pn-text-3)] mt-0.5">Order total: ${(order.pricing?.total ?? 0).toFixed(2)}</p>
                </div>
                <button onClick={() => setShowRefund(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-3 rounded-xl text-xs" style={{ background: "var(--pn-warning-bg)", border: "1px solid var(--pn-warning-line)", color: "var(--pn-warning-fg)" }}>
                  <p className="font-semibold mb-1">What happens when you refund:</p>
                  <ul className="space-y-0.5 list-disc list-inside text-[var(--pn-text-2)]">
                    <li>Order is marked as "Refunded" or "Partially Refunded"</li>
                    <li>Customer gets email confirmation</li>
                    <li>Accounting records adjust automatically</li>
                  </ul>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Refund Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pn-text-3)] text-sm">$</span>
                    <input type="number" step="0.01" min="0.01" max={refundable}
                      value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                      placeholder={refundable.toFixed(2)}
                      className="w-full rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
                  </div>
                  {alreadyRefunded > 0 && (
                    <p className="text-xs mt-1.5" style={{ color: "var(--pn-warning-fg)" }}>
                      ${alreadyRefunded.toFixed(2)} already refunded — ${refundable.toFixed(2)} remaining
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setRefundAmount(refundable.toFixed(2))}
                      className="text-xs px-3 py-1 rounded-lg"
                      style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>Full</button>
                    <button onClick={() => setRefundAmount((refundable / 2).toFixed(2))}
                      className="text-xs px-3 py-1 rounded-lg"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}>50%</button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Reason</label>
                  <select value={refundReason} onChange={e => setRefundReason(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                    {REFUND_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={refundRestockItems} onChange={e => setRefundRestockItems(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--pn-action)]" />
                  <span className="text-sm text-[var(--pn-text-2)]">Restock items automatically</span>
                </label>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setShowRefund(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>Cancel</button>
                <button onClick={() => { const amt = parseFloat(refundAmount); if (amt > 0) refundMut.mutate(); }}
                  disabled={!refundAmount || !(parseFloat(refundAmount) > 0) || parseFloat(refundAmount) > refundable || refundMut.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "var(--pn-critical)" }}>
                  {refundMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {parseFloat(refundAmount) > refundable ? "Exceeds refundable" : "Issue Refund"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Fulfill Modal */}
        {showFulfill && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4"
            onClick={() => setShowFulfill(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="pn-modal w-full max-w-md overflow-hidden"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                <h3 className="font-bold text-lg" style={{ color: "var(--pn-text)" }}>Complete Order</h3>
                <button onClick={() => setShowFulfill(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Tracking Number (optional)</label>
                  <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="e.g. 1Z999AA10123456784"
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Carrier (optional)</label>
                  <select value={carrier} onChange={e => setCarrier(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                    <option value="">Not applicable (digital delivery)</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="USPS">USPS</option>
                    <option value="DHL">DHL</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setShowFulfill(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>Cancel</button>
                <button onClick={() => fulfillMut.mutate()}
                  disabled={fulfillMut.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "var(--pn-primary)" }}>
                  {fulfillMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Mark as Completed
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Claim Chat Modal */}
        {viewChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4"
            onClick={() => setViewChat(null)}>
            <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
              className="w-full max-w-2xl h-[600px] flex flex-col pn-modal"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ background: "var(--pn-action-tint)", borderBottom: "1px solid var(--pn-border)" }}>
                <h3 className="text-[var(--pn-text)] font-semibold">Claim Chat — {order.orderNumber}</h3>
                <button onClick={() => setViewChat(null)}
                  className="w-8 h-8 rounded-lg bg-[var(--pn-surface-2)] flex items-center justify-center text-[var(--pn-text-2)] hover:text-[var(--pn-text)]">
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
