import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { StockRequest } from "../../types";
import {
  Archive, Package, ClipboardList, ShoppingBag, User, Calendar,
  CheckCircle2, Loader2, X, ChevronRight, DollarSign, Layers,
  Clock, AlertCircle, BadgeCheck,
} from "lucide-react";
import { Link } from "wouter";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  pending:  { bg: "var(--pn-warning-bg)", text: "var(--pn-warning-fg)", border: "var(--pn-warning-line)", icon: Clock,        label: "Pending" },
  approved: { bg: "var(--pn-action-tint)", text: "var(--pn-info-fg)", border: "var(--pn-action-border)", icon: CheckCircle2, label: "Approved" },
  stocked:  { bg: "var(--pn-success-bg)", text: "var(--pn-success-fg)", border: "var(--pn-success-line)", icon: BadgeCheck,   label: "Stocked" },
  rejected: { bg: "var(--pn-critical-bg)", text: "var(--pn-critical-text)", border: "var(--pn-critical-line)", icon: AlertCircle,  label: "Rejected" },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface DetailModalProps {
  req: StockRequest;
  deliveries: any[];
  onClose: () => void;
}
import { PageHeader } from "../../components/kit";

function RequestDetailModal({ req, deliveries, onClose }: DetailModalProps) {
  const st = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
  const StatusIcon = st.icon;

  const reqProductNames = new Set(req.items.map(i => i.productName?.toLowerCase()).filter(Boolean));
  const matchedDeliveries = deliveries.filter(d =>
    (d.items || []).some((it: any) => reqProductNames.has(it.name?.toLowerCase()))
  );

  const timeline = [
    { label: "Submitted", date: req.createdAt, done: true },
    { label: "Approved", date: (req as any).approvedAt, done: req.status !== "pending" && req.status !== "rejected" },
    { label: "Stocked", date: (req as any).stockedAt, done: req.status === "stocked" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 14 }}
        className="pn-modal w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ border: "1px solid var(--pn-border)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--pn-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--pn-action)" }}>
              <Archive className="w-5 h-5 text-[var(--pn-text)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base" style={{ color: "var(--pn-text)" }}>Stock Request — {req.game}</h3>
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                  <StatusIcon className="w-3 h-3" />
                  {st.label}
                </span>
              </div>
              <p className="text-xs text-[var(--pn-text-3)] mt-0.5">Submitted {fmtDate(req.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-3"
            style={{ background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
              <p className="text-lg font-bold" style={{ color: "var(--pn-text)" }}>
                {req.items.reduce((s, i) => s + i.quantity, 0)}
              </p>
              <p className="text-xs text-[var(--pn-text-3)]">Total Units</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--pn-success-bg)", border: "1px solid var(--pn-success-line)" }}>
              <p className="text-lg font-bold text-[var(--pn-success-fg)]">${req.totalSaleValue.toFixed(2)}</p>
              <p className="text-xs" style={{ color: "var(--pn-success-fg)" }}>Total Value</p>
            </div>
            {req.commission > 0 ? (
              <div className="rounded-xl p-3 text-center" style={{ background: "var(--pn-action-tint)", border: "1px solid var(--pn-action-border)" }}>
                <p className="text-lg font-bold text-[var(--pn-action)]">${req.commission.toFixed(2)}</p>
                <p className="text-xs text-[var(--pn-action)]">Commission ({req.commissionRate}%)</p>
              </div>
            ) : (
              <div className="rounded-xl p-3 text-center" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
                <p className="text-lg font-bold" style={{ color: "var(--pn-text)" }}>{req.items.length}</p>
                <p className="text-xs text-[var(--pn-text-3)]">Product Types</p>
              </div>
            )}
          </div>

          {req.status !== "pending" && (
            <div className="flex items-center gap-0">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: step.done ? (req.status === "rejected" && i === 1 ? "var(--pn-critical-bg)" : "var(--pn-success-bg)") : "var(--pn-surface-2)",
                        border: `2px solid ${step.done ? (req.status === "rejected" && i === 1 ? "var(--pn-critical-line)" : "var(--pn-success-line)") : "var(--pn-border)"}`,
                      }}>
                      {step.done && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: req.status === "rejected" && i === 1 ? "var(--pn-critical-text)" : "var(--pn-success-fg)" }} />}
                    </div>
                    <p className="text-[10px] font-semibold mt-1 text-center" style={{ color: step.done ? "var(--pn-text)" : "var(--pn-text-3)" }}>{step.label}</p>
                    {step.date && step.done && (
                      <p className="text-[9px] text-[var(--pn-text-3)] text-center">{fmtDate(step.date)}</p>
                    )}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="h-0.5 flex-1 mb-5" style={{ background: timeline[i + 1].done ? "var(--pn-success-bg)" : "var(--pn-surface-2)" }} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide mb-2">Requested Items</p>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                    {["Product", "Qty", "Store Price", "Your Price", "Diff", "Total"].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide last:text-right">{h}</th>
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
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                                style={{ background: item.gradient ? `linear-gradient(135deg,${item.gradient.from},${item.gradient.to})` : "var(--pn-border)" }}>
                                <Package className="w-4 h-4 text-[var(--pn-text)]" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>{item.productName}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
                                {item.game || req.game}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold" style={{ color: "var(--pn-text)" }}>×{item.quantity}</td>
                        <td className="px-3 py-3 text-sm text-[var(--pn-text-3)]">${storePrice.toFixed(2)}</td>
                        <td className="px-3 py-3 text-sm font-semibold" style={{ color: hasCustom ? "var(--pn-action)" : "var(--pn-text)" }}>
                          ${(hasCustom ? item.customPrice! : storePrice).toFixed(2)}
                        </td>
                        <td className="px-3 py-3">
                          {hasCustom ? (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: diff > 0 ? "var(--pn-success-bg)" : "var(--pn-critical-bg)", color: diff > 0 ? "var(--pn-success-fg)" : "var(--pn-critical-text)" }}>
                              {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                            </span>
                          ) : <span className="text-xs text-[var(--pn-text-3)]">—</span>}
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-[var(--pn-success-fg)] text-right">
                          ${item.totalSaleValue.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {(req.adminNotes || req.paymentAmount > 0 || (req as any).stockedBy || (req as any).approvedAt || (req as any).stockedAt || (req as any).rejectedAt) && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
              <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Request Details</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {req.paymentAmount > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-[var(--pn-action)] flex-shrink-0" />
                    <span className="text-[var(--pn-text-2)]">Payment to you:</span>
                    <span className="font-semibold text-[var(--pn-action)]">${req.paymentAmount.toFixed(2)}</span>
                  </div>
                )}
                {(req as any).stockedBy && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[var(--pn-text-3)] flex-shrink-0" />
                    <span className="text-[var(--pn-text-2)]">Stocked by:</span>
                    <span className="font-semibold" style={{ color: "var(--pn-text)" }}>{(req as any).stockedBy}</span>
                  </div>
                )}
                {(req as any).approvedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--pn-text-3)] flex-shrink-0" />
                    <span className="text-[var(--pn-text-2)]">Approved:</span>
                    <span className="font-semibold" style={{ color: "var(--pn-text)" }}>{fmtDate((req as any).approvedAt)}</span>
                  </div>
                )}
                {(req as any).stockedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--pn-text-3)] flex-shrink-0" />
                    <span className="text-[var(--pn-text-2)]">Stocked:</span>
                    <span className="font-semibold" style={{ color: "var(--pn-text)" }}>{fmtDate((req as any).stockedAt)}</span>
                  </div>
                )}
                {(req as any).rejectedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--pn-critical-text)] flex-shrink-0" />
                    <span className="text-[var(--pn-text-2)]">Rejected:</span>
                    <span className="font-semibold text-[var(--pn-critical-text)]">{fmtDate((req as any).rejectedAt)}</span>
                  </div>
                )}
              </div>
              {req.adminNotes && (
                <div className="rounded-lg px-3 py-2.5 text-xs"
                  style={{ background: "var(--pn-action-tint)", border: "1px solid var(--pn-action-border)", color: "var(--pn-info-fg)" }}>
                  <span className="font-semibold">Admin note: </span>{req.adminNotes}
                </div>
              )}
            </div>
          )}

          {req.status === "stocked" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">
                  Customer Deliveries
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: matchedDeliveries.length > 0 ? "var(--pn-success-bg)" : "var(--pn-surface-2)", color: matchedDeliveries.length > 0 ? "var(--pn-success-fg)" : "var(--pn-text-3)" }}>
                  {matchedDeliveries.length} found
                </span>
              </div>
              {matchedDeliveries.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[var(--pn-text-3)]" />
                  <p className="text-xs text-[var(--pn-text-3)]">No customer deliveries recorded for these products yet.</p>
                  <p className="text-[10px] text-[var(--pn-text-3)] mt-0.5">Deliveries show up here once items from your stock are delivered through the claim system.</p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                        {["Customer", "Items Delivered", "Handled By", "Date"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matchedDeliveries.map((d: any, i: number) => {
                        const relevantItems = (d.items || []).filter((it: any) => reqProductNames.has(it.name?.toLowerCase()));
                        return (
                          <tr key={i} style={{ borderBottom: i < matchedDeliveries.length - 1 ? "1px solid var(--pn-border)" : "none" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>{d.robloxUsername}</p>
                              {d.orderRef && (
                                <p className="text-xs text-[var(--pn-text-3)] mt-0.5">Order #{d.orderRef}</p>
                              )}
                              {d.game && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{ background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>{d.game}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-[160px]">
                              {relevantItems.map((it: any, j: number) => (
                                <div key={j} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--pn-text)" }}>
                                  <span className="font-medium">{it.name || "Item"}</span>
                                  {Number(it.quantity) > 1 && <span className="text-[var(--pn-text-3)]">×{it.quantity}</span>}
                                </div>
                              ))}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-[var(--pn-text-3)] flex-shrink-0" />
                                <p className="text-sm text-[var(--pn-text-2)]">{d.agentName || "—"}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-[var(--pn-text-3)]">{fmtDateTime(d.deliveredAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function StockerHistory() {
  const [activeTab, setActiveTab] = useState<"requests" | "sales">("requests");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [stockingId, setStockingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["stocker-requests"],
    queryFn: adminApi.stockerPanel.getMyRequests,
  });

  const handleMarkStocked = async (e: React.MouseEvent, req: StockRequest) => {
    e.stopPropagation();
    if (stockingId) return;
    if (!confirm(`Mark "${req.game}" request as stocked? This confirms you have added the items to the store.`)) return;
    setStockingId(req._id);
    try {
      await adminApi.stockerPanel.markRequestStocked(req._id);
      await refetch();
      if (selectedRequest?._id === req._id) setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message || "Failed to mark as stocked");
    } finally {
      setStockingId(null);
    }
  };

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["stocker-sold-deliveries"],
    queryFn: adminApi.stockerPanel.getSoldDeliveries,
  });

  const allRequests = data?.data.requests || [];
  const requests = statusFilter ? allRequests.filter(r => r.status === statusFilter) : allRequests;
  const deliveries: any[] = salesData?.data.deliveries || [];

  return (
    <div className="space-y-5 max-w-[900px] mx-auto">
      <AnimatePresence>
        {selectedRequest && (
          <RequestDetailModal
            req={selectedRequest}
            deliveries={deliveries}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </AnimatePresence>

      <PageHeader icon={ClipboardList}
        title={activeTab === "requests" ? "My Requests" : "Sales & Deliveries"}
        description={activeTab === "requests"
          ? "All your stock requests — click one to see full details"
          : "Items from your stock that have been delivered to customers"}>
        <div className="flex items-center gap-3">
          {activeTab === "requests" && (
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="stocked">Stocked</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
          <Link href="/stocker/request">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--pn-text)]"
              style={{ background: "var(--pn-action-tint)", border: "1px solid var(--pn-action-border)" }}
            >
              <ClipboardList className="w-4 h-4" />
              New Request
            </motion.button>
          </Link>
        </div>
      </PageHeader>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }}>
        {[
          { key: "requests", label: "My Requests", icon: Archive },
          { key: "sales", label: "Sales & Deliveries", icon: ShoppingBag },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? "rgba(0,0,0,0.04)" : "transparent",
              color: activeTab === tab.key ? "white" : "var(--pn-text-3)",
            }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.key === "sales" && deliveries.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(74,222,128,0.15)", color: "var(--pn-success-fg)" }}>
                {deliveries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="space-y-3"
          >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl animate-pulse"
                    style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }} />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20 rounded-xl"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }}>
                <Archive className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--pn-text-3)" }} />
                <p className="text-sm" style={{ color: "var(--pn-text-3)" }}>No requests found</p>
                <Link href="/stocker/request">
                  <span className="text-sm cursor-pointer" style={{ color: "var(--pn-action)" }}>Submit your first request →</span>
                </Link>
              </div>
            ) : (
              requests.map((req: StockRequest, i: number) => {
                const st = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
                const StatusIcon = st.icon;
                return (
                  <motion.div
                    key={req._id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-xl p-4 cursor-pointer group"
                    style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }}
                    onClick={() => setSelectedRequest(req)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
style={{ background: "var(--pn-action)" }}>
                        <Archive className="w-5 h-5 text-[var(--pn-text)]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[var(--pn-text)]">{req.game}</span>
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: st.bg, color: st.text }}>
                            <StatusIcon className="w-3 h-3" />
                            {st.label}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--pn-text-2)" }}>
                          {req.items.length} item{req.items.length !== 1 ? "s" : ""} ·{" "}
                          <span className="font-semibold text-[var(--pn-success-fg)]">${req.totalSaleValue.toFixed(2)}</span> value
                          {req.commission > 0 && (
                            <span style={{ color: "var(--pn-text-3)" }}> · ${req.commission.toFixed(2)} commission</span>
                          )}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--pn-text-3)" }}>{fmtDate(req.createdAt)}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {req.status === "approved" && (
                          <div className="flex items-center gap-2">
                            <div className="text-xs px-2 py-1 rounded-lg font-medium"
                              style={{ background: "rgba(59,130,246,0.15)", color: "var(--pn-action)", border: "1px solid rgba(59,130,246,0.2)" }}>
                              ${req.paymentAmount.toFixed(2)} payment
                            </div>
                            <button
                              onClick={e => handleMarkStocked(e, req)}
                              disabled={stockingId === req._id}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold text-[var(--pn-text)] disabled:opacity-50 transition-colors"
                              style={{ background: "rgba(74,222,128,0.9)", border: "1px solid rgba(74,222,128,0.4)" }}
                            >
                              {stockingId === req._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <BadgeCheck className="w-3 h-3" />
                              )}
                              Mark Stocked
                            </button>
                          </div>
                        )}
                        {req.status === "stocked" && (
                          <div className="text-xs px-2 py-1 rounded-lg font-medium"
                            style={{ background: "rgba(74,222,128,0.1)", color: "var(--pn-success-fg)", border: "1px solid rgba(74,222,128,0.2)" }}>
                            ✓ Stocked
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                          style={{ color: "var(--pn-text-3)" }} />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {req.items.slice(0, 4).map((item, j) => (
                        <div key={j} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                          style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }}>
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt={item.productName} className="w-4 h-4 rounded object-cover" />
                            : <Package className="w-3 h-3" style={{ color: "var(--pn-text-3)" }} />}
                          <span style={{ color: "var(--pn-text-2)" }}>{item.productName}</span>
                          <span style={{ color: "var(--pn-text-3)" }}>×{item.quantity}</span>
                        </div>
                      ))}
                      {req.items.length > 4 && (
                        <div className="flex items-center px-2 py-1 rounded-lg text-[11px]"
                          style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)", color: "var(--pn-text-3)" }}>
                          +{req.items.length - 4} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === "sales" && (
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="space-y-3"
          >
            {salesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--pn-action)" }} />
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-20 rounded-xl"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }}>
                <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--pn-text-3)" }} />
                <p className="text-sm" style={{ color: "var(--pn-text-3)" }}>No deliveries recorded yet</p>
                <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: "var(--pn-text-3)" }}>
                  Shows when items from your stock are delivered to customers through the claim system
                </p>
              </div>
            ) : (
              deliveries.map((delivery: any, i: number) => (
                <motion.div
                  key={delivery.roomId || i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                      <CheckCircle2 className="w-5 h-5" style={{ color: "var(--pn-success-fg)" }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[var(--pn-text)]">{delivery.robloxUsername}</span>
                        {delivery.game && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
                            {delivery.game}
                          </span>
                        )}
                        {delivery.orderRef && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(59,130,246,0.15)", color: "var(--pn-action)" }}>
                            #{delivery.orderRef}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(74,222,128,0.1)", color: "var(--pn-success-fg)", border: "1px solid rgba(74,222,128,0.2)" }}>
                          Delivered
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--pn-text-3)" }}>
                          <User className="w-3 h-3" />
                          <span style={{ color: "var(--pn-text-2)" }}>{delivery.agentName}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--pn-text-3)" }}>
                          <Calendar className="w-3 h-3" />
                          {delivery.deliveredAt
                            ? new Date(delivery.deliveredAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                            : "Unknown date"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(delivery.items || []).map((item: any, j: number) => (
                      <div key={j} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--pn-border)" }}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name} className="w-4 h-4 rounded object-cover" />
                          : <Package className="w-3 h-3" style={{ color: "var(--pn-text-3)" }} />}
                        <span style={{ color: "var(--pn-text-2)" }}>{item.name}</span>
                        {item.quantity > 1 && <span style={{ color: "var(--pn-text-3)" }}>×{item.quantity}</span>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
