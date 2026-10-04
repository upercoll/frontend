import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { StockRequest, Stocker } from "../../types";
import {
  ClipboardList, Check, X, Package, ChevronDown, ChevronUp,
  Loader2, Archive, User, Calendar, ShoppingBag, DollarSign,
  BadgeCheck, Clock, AlertCircle, CheckCircle2, Trash2,
} from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending:  { bg: "var(--pn-warning-bg)", text: "var(--pn-warning-fg)", border: "var(--pn-warning-line)" },
  approved: { bg: "var(--pn-action-tint)", text: "var(--pn-info-fg)", border: "var(--pn-action-border)" },
  stocked:  { bg: "var(--pn-success-bg)", text: "var(--pn-success-fg)", border: "var(--pn-success-line)" },
  rejected: { bg: "var(--pn-critical-bg)", text: "var(--pn-critical-text)", border: "var(--pn-critical-line)" },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
import { PageHeader } from "../../components/kit";

function StockedDeliveries({ stockerId, reqItems }: { stockerId: string; reqItems: StockRequest["items"] }) {
  const [loaded, setLoaded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["stocker-sales-detail", stockerId],
    queryFn: () => adminApi.stock.getStockerSales(stockerId),
    enabled: loaded,
  });

  const reqProductNames = new Set(reqItems.map(i => i.productName?.toLowerCase()).filter(Boolean));
  const deliveries: any[] = (data?.data?.deliveries || []).filter((d: any) =>
    (d.items || []).some((it: any) => reqProductNames.has(it.name?.toLowerCase()))
  );

  if (!loaded) {
    return (
      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--pn-border)" }}>
        <button
          onClick={() => setLoaded(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "var(--pn-action-tint)", color: "var(--pn-info-fg)", border: "1px solid var(--pn-action-border)" }}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Load Customer Deliveries
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 flex items-center gap-2 text-sm text-[var(--pn-text-3)]" style={{ borderTop: "1px solid var(--pn-border)" }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading deliveries…
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--pn-border)" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Customer Deliveries</p>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: deliveries.length > 0 ? "var(--pn-success-bg)" : "var(--pn-surface-2)", color: deliveries.length > 0 ? "var(--pn-success-fg)" : "var(--pn-text-3)" }}>
          {deliveries.length} found
        </span>
      </div>
      {deliveries.length === 0 ? (
        <div className="rounded-xl p-5 text-center" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
          <ShoppingBag className="w-7 h-7 mx-auto mb-1.5 text-[var(--pn-text-3)]" />
          <p className="text-xs text-[var(--pn-text-3)]">No customer deliveries recorded for these products yet.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                {["Customer", "Order Ref", "Items Delivered", "Agent", "Date"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d: any, i: number) => {
                const relevantItems = (d.items || []).filter((it: any) => reqProductNames.has(it.name?.toLowerCase()));
                return (
                  <tr key={i} style={{ borderBottom: i < deliveries.length - 1 ? "1px solid var(--pn-border)" : "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold" style={{ color: "var(--pn-text)" }}>{d.robloxUsername}</p>
                      {d.game && <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>{d.game}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--pn-text-2)]">
                      {d.orderRef ? <span style={{ color: "var(--pn-info-fg)" }}>#{d.orderRef}</span> : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--pn-text-2)] max-w-[160px]">
                      {relevantItems.map((it: any, j: number) => (
                        <span key={j} className="block">
                          {it.name || "Item"} ×{Number.isFinite(it.quantity) && it.quantity > 0 ? it.quantity : 1}
                        </span>
                      ))}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[var(--pn-text-3)]" />
                        <span className="text-[var(--pn-text-2)]">{d.agentName || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--pn-text-3)]">{fmtDateTime(d.deliveredAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RequestRow({ req }: { req: StockRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const qc = useQueryClient();

  const approveMut = useMutation({
    mutationFn: (data: { paymentAmount?: number; adminNotes?: string }) =>
      adminApi.stock.approveRequest(req._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock-requests"] }); setApproveOpen(false); },
    onError: (e: Error) => alert(e.message),
  });

  const stockedMut = useMutation({
    mutationFn: (data: { adminNotes?: string }) => adminApi.stock.markStocked(req._id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-requests"] }),
    onError: (e: Error) => alert(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: (data: { adminNotes?: string }) => adminApi.stock.rejectRequest(req._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock-requests"] }); setRejectOpen(false); },
    onError: (e: Error) => alert(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminApi.stock.deleteRequest(req._id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-requests"] }),
    onError: (e: Error) => alert(e.message),
  });

  const st = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
  const stocker = typeof req.stocker === "object" ? req.stocker as Stocker : null;
  const stockerId = stocker?._id || (typeof req.stocker === "string" ? req.stocker : "");

  const timeline = [
    { label: "Submitted", date: req.createdAt, done: true },
    { label: "Approved",  date: (req as any).approvedAt, done: ["approved","stocked"].includes(req.status) },
    { label: "Stocked",   date: (req as any).stockedAt,  done: req.status === "stocked" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="pn-modal"
      style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--pn-action)" }}>
            <Archive className="w-5 h-5 text-[var(--pn-text)]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: "var(--pn-text)" }}>
                {req.stockerName || req.stockerEmail}
              </span>
              <span className="text-xs text-[var(--pn-text-3)]">·</span>
              <span className="text-xs font-medium" style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)", padding: "1px 8px", borderRadius: 6 }}>{req.game}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                {req.status}
              </span>
            </div>
            <p className="text-xs text-[var(--pn-text-3)] mt-0.5">
              {req.items.length} item{req.items.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-semibold text-[var(--pn-success-fg)]">${req.totalSaleValue.toFixed(2)}</span> value
              {req.commission > 0 && (
                <span className="text-[var(--pn-text-3)]"> · ${req.commission.toFixed(2)} commission ({req.commissionRate}%)</span>
              )}
            </p>
            <p className="text-xs text-[var(--pn-text-3)] mt-0.5">{fmtDate(req.createdAt)}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {req.status === "pending" && (
              <>
                <button onClick={() => setApproveOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--pn-text)]"
                  style={{ background: "var(--pn-success-bg)" }}>
                  <Check className="w-3 h-3" /> Approve
                </button>
                <button onClick={() => setRejectOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "var(--pn-critical-bg)", color: "var(--pn-critical-text)", border: "1px solid var(--pn-critical-line)" }}>
                  <X className="w-3 h-3" /> Reject
                </button>
              </>
            )}
            {req.status === "approved" && (
              <button
                onClick={() => { if (window.confirm("Mark as stocked? This will add stock to the products.")) stockedMut.mutate({}); }}
                disabled={stockedMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                style={{ background: "var(--pn-action)" }}>
                {stockedMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                Mark Stocked
              </button>
            )}
            <button
              onClick={() => {
                if (!window.confirm("Permanently delete this stock request? This cannot be undone.")) return;
                deleteMut.mutate();
              }}
              disabled={deleteMut.isPending}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              title="Delete request"
              style={{ background: "var(--pn-critical-bg)", border: "1px solid var(--pn-critical-line)", color: "var(--pn-critical-text)" }}>
              {deleteMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </button>
            <button onClick={() => setExpanded(e => !e)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4">
              <div className="space-y-4 pt-4" style={{ borderTop: "1px solid var(--pn-border)" }}>

                {req.status !== "pending" && (
                  <div className="flex items-center gap-0">
                    {timeline.map((step, i) => (
                      <div key={step.label} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: step.done ? "var(--pn-success-bg)" : "var(--pn-surface-2)",
                              border: `2px solid ${step.done ? "var(--pn-success-line)" : "var(--pn-border)"}`,
                            }}>
                            {step.done && <CheckCircle2 className="w-3 h-3 text-[var(--pn-success-fg)]" />}
                          </div>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: step.done ? "var(--pn-text)" : "var(--pn-text-3)" }}>{step.label}</p>
                          {step.date && step.done && (
                            <p className="text-[9px] text-[var(--pn-text-3)]">{fmtDate(step.date)}</p>
                          )}
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="h-0.5 flex-1 mb-4" style={{ background: timeline[i + 1].done ? "var(--pn-success-bg)" : "var(--pn-surface-2)" }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide mb-2">Items Requested</p>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                          {["Product", "Qty", "Store Price", "Their Price", "Diff", "Total"].map(h => (
                            <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wide text-[var(--pn-text-3)] last:text-right">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {req.items.map((item, i) => {
                          const storePrice = item.storePrice ?? item.salePrice;
                          const hasCustom = item.customPrice != null && Math.abs(item.customPrice - storePrice) > 0.001;
                          const diff = hasCustom ? (item.customPrice! - storePrice) : 0;
                          return (
                            <tr key={i} style={{ borderBottom: i < req.items.length - 1 ? "1px solid var(--pn-border)" : "none" }}>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.productName} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                                      style={{ background: (item as any).gradient ? `linear-gradient(135deg,${(item as any).gradient.from},${(item as any).gradient.to})` : "var(--pn-border)" }}>
                                      <Package className="w-3.5 h-3.5 text-[var(--pn-text)]" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-semibold" style={{ color: "var(--pn-text)" }}>{item.productName}</span>
                                    <div>
                                      <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
                                        {(item as any).game || req.game}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 font-semibold" style={{ color: "var(--pn-text)" }}>×{item.quantity}</td>
                              <td className="px-3 py-2.5 text-[var(--pn-text-3)]">${storePrice.toFixed(2)}</td>
                              <td className="px-3 py-2.5 font-semibold" style={{ color: hasCustom ? "var(--pn-action)" : "var(--pn-text)" }}>
                                ${(hasCustom ? item.customPrice! : storePrice).toFixed(2)}
                              </td>
                              <td className="px-3 py-2.5">
                                {hasCustom ? (
                                  <span className="font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ background: diff > 0 ? "var(--pn-success-bg)" : "var(--pn-critical-bg)", color: diff > 0 ? "var(--pn-success-fg)" : "var(--pn-critical-text)" }}>
                                    {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                                  </span>
                                ) : <span className="text-[var(--pn-text-3)]">—</span>}
                              </td>
                              <td className="px-3 py-2.5 font-semibold text-[var(--pn-success-fg)] text-right">
                                ${item.totalSaleValue.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {(req.adminNotes || req.paymentAmount > 0 || (req as any).stockedBy) && (
                  <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
                    <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Details</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
                      {req.paymentAmount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-[var(--pn-action)]" />
                          <span className="text-[var(--pn-text-2)]">Payment sent:</span>
                          <span className="font-semibold text-[var(--pn-action)]">${req.paymentAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {(req as any).stockedBy && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[var(--pn-text-3)]" />
                          <span className="text-[var(--pn-text-2)]">Stocked by:</span>
                          <span className="font-semibold" style={{ color: "var(--pn-text)" }}>{(req as any).stockedBy}</span>
                        </div>
                      )}
                      {(req as any).stockedAt && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--pn-text-3)]" />
                          <span className="text-[var(--pn-text-2)]">Stocked:</span>
                          <span className="font-semibold" style={{ color: "var(--pn-text)" }}>{fmtDate((req as any).stockedAt)}</span>
                        </div>
                      )}
                    </div>
                    {req.adminNotes && (
                      <div className="rounded-lg px-3 py-2 text-xs"
                        style={{ background: "var(--pn-action-tint)", border: "1px solid var(--pn-action-border)", color: "var(--pn-info-fg)" }}>
                        <span className="font-semibold">Note: </span>{req.adminNotes}
                      </div>
                    )}
                  </div>
                )}

                {req.status === "stocked" && stockerId && (
                  <StockedDeliveries stockerId={stockerId} reqItems={req.items} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {approveOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid var(--pn-border)", background: "var(--pn-success-bg)" }}>
              <p className="text-xs font-semibold text-[var(--pn-success-fg)]">Approve Request</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-[var(--pn-text-2)] block mb-1">Payment amount ($) to stocker</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "white", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-[var(--pn-text-2)] block mb-1">Admin notes (optional)</label>
                  <input type="text" placeholder="Note…"
                    value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "white", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveMut.mutate({ paymentAmount: parseFloat(paymentAmount) || 0, adminNotes })}
                  disabled={approveMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[var(--pn-text)] disabled:opacity-60"
                  style={{ background: "var(--pn-success-bg)" }}>
                  {approveMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Approval
                </button>
                <button onClick={() => setApproveOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {rejectOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid var(--pn-border)", background: "var(--pn-critical-bg)" }}>
              <p className="text-xs font-semibold text-[var(--pn-critical-text)]">Reject Request</p>
              <input type="text" placeholder="Reason for rejection (optional)"
                value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: "white", border: "1px solid var(--pn-critical-line)", color: "var(--pn-text)" }} />
              <div className="flex gap-2">
                <button onClick={() => rejectMut.mutate({ adminNotes })}
                  disabled={rejectMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: "var(--pn-critical)" }}>
                  {rejectMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Reject
                </button>
                <button onClick={() => setRejectOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StockRequests() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["stock-requests", statusFilter],
    queryFn: () => adminApi.stock.listRequests(statusFilter ? { status: statusFilter } : undefined),
  });

  const requests = data?.data.requests || [];

  return (
    <div className="p-6 space-y-5 max-w-[960px] mx-auto">
      <PageHeader title="Stock Requests" icon={ClipboardList}
        description="Review and manage stocker inventory requests — expand to see full item details and customer deliveries">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="stocked">Stocked</option>
          <option value="rejected">Rejected</option>
        </select>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 pn-modal" style={{ border: "1px solid var(--pn-border)" }}>
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-[var(--pn-text-3)]" />
          <p className="text-[var(--pn-text-3)] text-sm">No stock requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <RequestRow key={req._id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}
