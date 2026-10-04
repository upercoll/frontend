import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useRoute } from "wouter";
import { adminApi } from "../api";
import {
  ChevronLeft, Loader2, CheckCircle, Video, DollarSign,
  Eye, ExternalLink, Clock, AlertCircle, Hash, Heart,
} from "lucide-react";

function fmtNum(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  in_review: { bg: "var(--pn-warning-bg)", text: "var(--pn-warning-fg)",  border: "var(--pn-warning-line)" },
  reviewed:  { bg: "var(--pn-action-tint)", text: "var(--pn-info-fg)",  border: "var(--pn-action-border)" },
  accepted:  { bg: "var(--pn-success-bg)", text: "var(--pn-success-fg)",  border: "var(--pn-success-line)" },
  paid:      { bg: "var(--pn-surface-2)", text: "var(--pn-text)",  border: "var(--pn-border-strong)" },
};
const STATUS_LABELS: Record<string, string> = {
  in_review: "In Review", reviewed: "Reviewed", accepted: "Accepted", paid: "Paid",
};
import { PageHeader, MetricTile } from "../components/kit";

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.27 8.27 0 0 0 4.84 1.55V7a4.85 4.85 0 0 1-1.07-.31z" />
    </svg>
  );
}

export default function SocialsTrackerDetail() {
  const [, params] = useRoute("/admin/socials/creators/:id");
  const id = params?.id || "";
  const qc = useQueryClient();
  const [marking, setMarking] = useState(false);
  const [markErr, setMarkErr] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingRate, setEditingRate] = useState(false);
  const [rateType, setRateType] = useState<"per_1k" | "per_video">("per_1k");
  const [rate, setRate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["socials-creator-detail", id],
    queryFn: () => adminApi.socials.getCreator(id),
    enabled: !!id,
  });

  const creator = (data as any)?.data?.creator;
  const allSubmissions: any[] = (data as any)?.data?.submissions || [];
  const payouts: any[] = (data as any)?.data?.payouts || [];
  const acceptedSubmissions: any[] = (data as any)?.data?.acceptedSubmissions || [];
  const pendingPayout: number = (data as any)?.data?.pendingPayout || 0;

  const filtered = statusFilter ? allSubmissions.filter(s => s.status === statusFilter) : allSubmissions;

  const totalViews = allSubmissions.reduce((sum, s) => sum + (s.views || 0), 0);
  const inReviewCount = allSubmissions.filter(s => s.status === "in_review").length;
  const paidCount = allSubmissions.filter(s => s.status === "paid").length;
  const totalPaid = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  const saveCreatorRate = async () => {
    await adminApi.socials.updateCreator(id, { socialRateType: rateType, socialRate: Number(rate) || 0 });
    setEditingRate(false); qc.invalidateQueries({ queryKey: ["socials-creator-detail", id] }); qc.invalidateQueries({ queryKey: ["socials-creators"] });
  };

  const partialAmountNum = parseFloat(partialAmount) || 0;
  const isPartial = partialAmountNum > 0 && partialAmountNum < pendingPayout;

  const handleMarkPaid = async () => {
    setMarking(true); setMarkErr("");
    try {
      const payload = { ...(isPartial ? { partialAmount: partialAmountNum } : {}), paymentMethod, proofUrl };
      await adminApi.socials.markPaid(id, payload);
      qc.invalidateQueries({ queryKey: ["socials-creator-detail", id] });
      qc.invalidateQueries({ queryKey: ["socials-creators"] });
      setConfirmOpen(false);
      setPartialAmount("");
    } catch (e: any) {
      setMarkErr(e.message || "Failed to mark as paid");
    } finally {
      setMarking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-3 max-w-[1200px] mx-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--pn-surface-2)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/socials/creators">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Link>
        <PageHeader title={creator?.name || "Creator"} description={creator?.email} icon={Video} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Videos", value: allSubmissions.length, icon: Video, color: "var(--pn-action)" },
          { label: "Total Views", value: fmtNum(totalViews), icon: Eye, color: "var(--pn-action)" },
          { label: "In Review", value: inReviewCount, icon: Clock, color: "var(--pn-warning-fg)" },
          { label: "Total Paid Out", value: `$${totalPaid.toFixed(2)}`, icon: DollarSign, color: "var(--pn-success-fg)" },
        ].map((s, i) => (
          <MetricTile key={i} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      {/* Mark as Paid banner */}
      {pendingPayout > 0 && (
        <div className="bg-[var(--pn-surface)] rounded-xl p-5 flex items-center justify-between" style={{ border: "1px solid var(--pn-border)" }}>
          <div>
            <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Pending Payout</p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--pn-success-fg)" }}>${pendingPayout.toFixed(2)} USD</p>
            <p className="text-xs text-[var(--pn-text-3)] mt-1">
              {acceptedSubmissions.length} accepted video{acceptedSubmissions.length !== 1 ? "s" : ""} pending payment
            </p>
          </div>
          <div>
            {markErr && <p className="text-sm text-[var(--pn-critical-text)] mb-2">{markErr}</p>}
            <button onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--pn-success-fg)" }}>
              <CheckCircle className="w-4 h-4" /> Mark as Paid
            </button>
          </div>
        </div>
      )}

      <div className="bg-[var(--pn-surface)] rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ border: "1px solid var(--pn-border)" }}>
        <div className="flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Default creator rate</p><p className="text-sm font-bold mt-1" style={{ color: "var(--pn-text)" }}>{creator?.socialRateType === "per_video" ? "$" : "$"}{creator?.socialRate || 0}{creator?.socialRateType === "per_video" ? " per video" : " per 1K views"}</p></div>
        {editingRate ? <><select value={rateType} onChange={e => setRateType(e.target.value as any)} className="rounded-lg p-2 text-xs border"><option value="per_1k">Per 1K views</option><option value="per_video">Per video</option></select><input value={rate} onChange={e => setRate(e.target.value)} type="number" className="w-24 rounded-lg p-2 text-xs border" placeholder="Rate"/><button onClick={saveCreatorRate} className="px-3 py-2 rounded-lg bg-[var(--pn-primary)] text-white text-xs font-bold">Save</button></> : <button onClick={() => { setRateType(creator?.socialRateType || "per_1k"); setRate(String(creator?.socialRate || "")); setEditingRate(true); }} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>Change default rate</button>}
      </div>

      {pendingPayout <= 0 && (
        <div className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
          <p className="text-sm text-[var(--pn-text-2)]">No pending payout — all accepted videos have been paid or none are accepted yet.</p>
        </div>
      )}

      {/* Video grid/table */}
      <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--pn-border)" }}>
          <h3 className="font-bold text-sm" style={{ color: "var(--pn-text)" }}>
            Videos ({filtered.length}{statusFilter ? ` filtered` : " total"})
          </h3>
          <div className="flex gap-1">
            {[
              { label: "All", value: "" },
              { label: "In Review", value: "in_review" },
              { label: "Reviewed", value: "reviewed" },
              { label: "Accepted", value: "accepted" },
              { label: "Paid", value: "paid" },
            ].map(t => (
              <button key={t.value} onClick={() => setStatusFilter(t.value)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap"
                style={statusFilter === t.value
                  ? { background: "var(--pn-primary)", color: "#fff" }
                  : { background: "var(--pn-surface-2)", color: "var(--pn-text-2)", border: "1px solid var(--pn-border)" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--pn-text-3)]">
            <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No videos in this category.</p>
          </div>
        ) : (
          /* Video grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {filtered.map((s: any) => {
              const st = STATUS_STYLES[s.status] || STATUS_STYLES.in_review;
              return (
                <motion.div key={s._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--pn-border)", background: "#fff" }}>
                  {/* Thumbnail */}
                  <div className="relative w-full h-40 overflow-hidden" style={{ background: "var(--pn-surface-2)" }}>
                    {s.thumbnail ? (
                      <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {s.platform === "youtube"
                          ? <YouTubeIcon className="w-12 h-12 text-[var(--pn-critical-text)]" />
                          : <TikTokIcon className="w-12 h-12 text-[var(--pn-text-3)]" />}
                      </div>
                    )}
                    {/* Platform badge */}
                    <div className="absolute top-2 left-2">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold"
                        style={{ background: s.platform === "youtube" ? "rgba(255,0,0,0.85)" : "rgba(0,0,0,0.8)", color: "#fff" }}>
                        {s.platform === "youtube"
                          ? <YouTubeIcon className="w-3 h-3" />
                          : <TikTokIcon className="w-3 h-3" />}
                        {s.platform === "youtube" ? "YouTube" : "TikTok"}
                      </span>
                    </div>
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] px-2 py-1 rounded-full font-semibold border"
                        style={{ background: st.bg, color: st.text, borderColor: st.border }}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <p className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: "var(--pn-text)" }}>
                      {s.title || "Untitled"}
                    </p>
                    <p className="text-xs text-[var(--pn-text-3)]">{s.channelName}</p>

                    {/* Stats row */}
                    <div className="flex items-center gap-3">
                      {s.views > 0 && (
                        <div className="flex items-center gap-1 text-xs text-[var(--pn-text-2)]">
                          <Eye className="w-3 h-3" /> {fmtNum(s.views)}
                        </div>
                      )}
                      {s.likes > 0 && (
                        <div className="text-xs text-[var(--pn-text-2)] flex items-center gap-1"><Heart className="w-3 h-3" style={{ color: "var(--pn-critical-text)" }} />{fmtNum(s.likes)}</div>
                      )}
                      <span className="text-xs text-[var(--pn-text-3)] ml-auto">{fmtDate(s.createdAt)}</span>
                    </div>

                    {/* Payout info */}
                    {s.offeredAmount != null && (
                      <div className="pt-2" style={{ borderTop: "1px solid var(--pn-border)" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-[var(--pn-text-3)]">Offered</p>
                            <p className="text-base font-bold" style={{ color: "var(--pn-success-fg)" }}>${s.offeredAmount.toFixed(2)}</p>
                          </div>
                          {s.rateType === "per_view" && s.ratePerView != null && (
                            <div className="text-right">
                              <p className="text-xs text-[var(--pn-text-3)]">Per view</p>
                              <p className="text-xs font-semibold text-[var(--pn-text-2)]">${s.ratePerView}</p>
                            </div>
                          )}
                        </div>
                        {s.paidAt && (
                          <p className="text-[10px] text-[var(--pn-text-3)] mt-1">Paid {fmtDateTime(s.paidAt)}</p>
                        )}
                      </div>
                    )}

                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[var(--pn-action)] hover:text-[var(--pn-action)] transition-colors">
                      <ExternalLink className="w-2.5 h-2.5" /> View video
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout history */}
      <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
          <h3 className="font-bold text-sm" style={{ color: "var(--pn-text)" }}>Payout History</h3>
        </div>
        {payouts.length === 0 ? (
          <div className="p-12 text-center text-[var(--pn-text-3)]">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No payouts have been made yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Videos Paid</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Paid By</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any, idx: number) => (
                <tr key={p._id}
                  style={{ borderBottom: "1px solid var(--pn-border)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-5 py-3.5 text-sm font-medium text-[var(--pn-text-2)]">#{payouts.length - idx}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--pn-text-2)]">{p.submissionCount} video{p.submissionCount !== 1 ? "s" : ""}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--pn-text-2)]">{p.paidBy || "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--pn-text-2)]">{fmtDateTime(p.paidAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold" style={{ color: "var(--pn-text)" }}>${p.amount.toFixed(2)} USD</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm mark-as-paid modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmOpen(false)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
              className="pn-modal w-full max-w-md p-6"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-base mb-2" style={{ color: "var(--pn-text)" }}>Confirm Payout</h3>
              <p className="text-sm text-[var(--pn-text-2)] mb-4">
                Pay <strong>{creator?.name}</strong> for accepted videos. Enter a partial amount to pay less than the full balance, or leave blank to pay all.
              </p>

              {/* Partial amount input */}
              <div className="mb-4 rounded-xl p-4" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
                <label className="block text-xs font-semibold text-[var(--pn-text-2)] mb-1.5">
                  Amount to Pay (USD) <span className="font-normal text-[var(--pn-text-3)]">— leave blank to pay full ${pendingPayout.toFixed(2)}</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--pn-text-3)]">$</span>
                  <input
                    type="number" min="0.01" step="0.01" max={pendingPayout}
                    value={partialAmount}
                    onChange={e => setPartialAmount(e.target.value)}
                    placeholder={pendingPayout.toFixed(2)}
                    className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    style={{ background: "#fff", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                  />
                </div>
                {isPartial && (
                  <p className="text-xs text-[var(--pn-warning-fg)] mt-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Partial payout: ${partialAmountNum.toFixed(2)} of ${pendingPayout.toFixed(2)} owed. The remainder stays pending automatically.
                  </p>
                )}
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: "#fff", border: "1px solid var(--pn-border)" }}><option value="">Payment method (optional)</option>{(creator?.paymentMethods?.length ? creator.paymentMethods : ["paypal", "cashapp", "bank", "crypto", "other"]).map((m: string) => <option key={m} value={m}>{m}</option>)}</select>
                {creator?.requiresPaymentProof && <input value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="Payment proof screenshot URL" className="w-full mt-2 rounded-lg px-3 py-2 text-sm" style={{ background: "#fff", border: "1px solid var(--pn-border)" }} />}
              </div>

              {/* List accepted submissions */}
              <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--pn-border)" }}>
                {acceptedSubmissions.map((s: any) => (
                  <div key={s._id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                    <p className="text-xs font-medium text-[var(--pn-text)] truncate max-w-[220px]">{s.title || s.url}</p>
                    <span className="text-xs font-bold text-[var(--pn-success-fg)] flex-shrink-0">${(s.offeredAmount || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--pn-surface-2)" }}>
                  <p className="text-xs font-bold text-[var(--pn-text-2)]">Total owed</p>
                  <span className="text-sm font-bold" style={{ color: "var(--pn-success-fg)" }}>${pendingPayout.toFixed(2)}</span>
                </div>
              </div>

              {markErr && (
                <div className="flex items-center gap-2 text-sm text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-lg px-4 py-3 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {markErr}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setConfirmOpen(false); setPartialAmount(""); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                  Cancel
                </button>
                <button onClick={handleMarkPaid} disabled={marking || (partialAmountNum > 0 && partialAmountNum > pendingPayout)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "var(--pn-success-fg)" }}>
                  {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isPartial ? `Pay $${partialAmountNum.toFixed(2)}` : `Pay $${pendingPayout.toFixed(2)}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
