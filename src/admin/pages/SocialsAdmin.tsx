import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../api";
import {
  Video, Loader2, X, ExternalLink, CheckCircle, AlertCircle,
  Eye, Heart, TrendingUp, RefreshCw, BarChart2, Calendar, User, Hash,
} from "lucide-react";

function fmtNum(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "In Review", value: "in_review" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Accepted", value: "accepted" },
  { label: "Paid", value: "paid" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  in_review: { bg: "var(--pn-warning-bg)", text: "var(--pn-warning-fg)",  border: "var(--pn-warning-line)" },
  reviewed:  { bg: "var(--pn-action-tint)", text: "var(--pn-info-fg)",  border: "var(--pn-action-border)" },
  accepted:  { bg: "var(--pn-success-bg)", text: "var(--pn-success-fg)",  border: "var(--pn-success-line)" },
  paid:      { bg: "var(--pn-surface-2)", text: "var(--pn-text)",  border: "var(--pn-border-strong)" },
};
import { PageHeader } from "../components/kit";
const STATUS_LABELS: Record<string, string> = {
  in_review: "In Review", reviewed: "Reviewed", accepted: "Accepted", paid: "Paid",
};

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

interface RateForm {
  rateType: "per_1k" | "per_video";
  ratePerView: string;
  offeredAmount: string;
  adminNote: string;
}

function RateModal({ sub, onClose }: { sub: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<RateForm>({
    rateType: sub.rateType === "per_video" || sub.rateType === "auto" ? "per_video" : "per_1k",
    ratePerView: sub.ratePerView ? String(sub.ratePerView * 1000) : "",
    offeredAmount: sub.offeredAmount ? String(sub.offeredAmount) : "",
    adminNote: sub.adminNote || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const views = sub.views || 0;

  const computedAmount = form.rateType === "per_1k" && form.ratePerView && views
    ? ((parseFloat(form.ratePerView) * views) / 1000).toFixed(2)
    : null;
  const computedRPV = form.rateType === "per_video" && form.offeredAmount && views
    ? (parseFloat(form.offeredAmount) / views).toFixed(6)
    : null;

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      await adminApi.socials.setRate(sub._id, {
        rateType: form.rateType,
        ratePerView: form.rateType === "per_1k" ? parseFloat(form.ratePerView) : undefined,
        offeredAmount: form.rateType === "per_video" ? parseFloat(form.offeredAmount) : undefined,
        adminNote: form.adminNote,
      });
      qc.invalidateQueries({ queryKey: ["socials-admin"] });
      onClose();
    } catch (e: any) {
      setErr(e.message || "Failed to set rate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
        className="pn-modal w-full max-w-md"
        style={{ border: "1px solid var(--pn-border)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
          <h3 className="font-bold text-base" style={{ color: "var(--pn-text)" }}>Set Rate</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text-2)]" style={{ background: "var(--pn-surface-2)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-3">
          <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--pn-surface-2)" }}>
            {sub.thumbnail
              ? <img src={sub.thumbnail} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  {sub.platform === "youtube" ? <YouTubeIcon className="w-5 h-5 text-[var(--pn-critical-text)]" /> : <TikTokIcon className="w-5 h-5 text-[var(--pn-text)]" />}
                </div>}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--pn-text)" }}>{sub.title || "Untitled"}</p>
            <p className="text-xs text-[var(--pn-text-3)]">{sub.channelName}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--pn-text-2)]">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmtNum(sub.views)}</span>
              {sub.likes > 0 && <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-[var(--pn-critical-text)]" />{fmtNum(sub.likes)}</span>}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2 text-[var(--pn-text-2)]">Rate Type</label>
            <div className="flex gap-2">
              {(["per_1k", "per_video"] as const).map((rt) => (
                <button key={rt} onClick={() => setForm(f => ({ ...f, rateType: rt }))}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
                  style={form.rateType === rt
                    ? { background: "var(--pn-primary)", color: "#fff" }
                    : { background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                  {rt === "per_1k" ? "Rate Per 1K Views" : "Fixed Per Video"}
                </button>
              ))}
            </div>
          </div>

          {form.rateType === "per_1k" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--pn-text-2)]">Rate per 1,000 Views ($)</label>
                <input
                  type="number" step="0.000001" min="0"
                  value={form.ratePerView}
                  onChange={e => setForm(f => ({ ...f, ratePerView: e.target.value }))}
                  placeholder="e.g. 0.001"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                />
              </div>
              {computedAmount && (
                <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: "var(--pn-success-bg)", border: "1px solid var(--pn-success-line)" }}>
                  <span className="text-xs font-semibold text-[var(--pn-text-2)]">Auto-calculated total</span>
                  <span className="text-base font-bold text-[var(--pn-success-fg)]">${computedAmount}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--pn-text-2)]">Fixed Amount Offered ($)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.offeredAmount}
                  onChange={e => setForm(f => ({ ...f, offeredAmount: e.target.value }))}
                  placeholder="e.g. 50.00"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                />
              </div>
              {computedRPV && views > 0 && (
                <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: "var(--pn-action-tint)", border: "1px solid var(--pn-action-border)" }}>
                  <span className="text-xs font-semibold text-[var(--pn-text-2)]">Implied rate per view</span>
                  <span className="text-sm font-bold text-[var(--pn-action)]">${computedRPV}/view</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[var(--pn-text-2)]">Note to Creator (optional)</label>
            <input
              value={form.adminNote}
              onChange={e => setForm(f => ({ ...f, adminNote: e.target.value }))}
              placeholder="e.g. Great video, thanks!"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
            />
          </div>

          {err && <div className="text-sm text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-lg px-4 py-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{err}</div>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "var(--pn-success-fg)" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Submit Rate
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnalyticsModal({ sub, onClose, onSetRate, onRefreshed }: { sub: any; onClose: () => void; onSetRate: () => void; onRefreshed: (updated: any) => void }) {
  const qc = useQueryClient();
  const st = STATUS_STYLES[sub.status] || STATUS_STYLES.in_review;

  const [refreshErr, setRefreshErr] = useState("");
  const refreshMutation = useMutation({
    mutationFn: () => adminApi.socials.refreshViews(sub._id),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["socials-admin"] });
      setRefreshErr("");
      // Propagate the updated submission data so the modal shows new stats
      if (res?.data?.submission) onRefreshed(res.data.submission);
    },
    onError: (e: any) => {
      setRefreshErr(e.message || "Refresh failed");
    },
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        className="pn-modal w-full max-w-lg overflow-hidden"
        style={{ border: "1px solid var(--pn-border)" }}
        onClick={e => e.stopPropagation()}>

        {/* Thumbnail header */}
        <div className="relative w-full h-48 overflow-hidden" style={{ background: "#0f0f0f" }}>
          {sub.thumbnail
            ? <img src={sub.thumbnail} alt="" className="w-full h-full object-cover opacity-90" />
            : <div className="w-full h-full flex items-center justify-center">
                {sub.platform === "youtube"
                  ? <YouTubeIcon className="w-16 h-16 text-[var(--pn-critical-text)] opacity-60" />
                  : <TikTokIcon className="w-16 h-16 text-white opacity-60" />}
              </div>}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />

          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ background: "rgba(0,0,0,0.4)" }}>
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-3 right-12">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                style={{ background: sub.platform === "youtube" ? "rgba(255,0,0,0.9)" : "rgba(0,0,0,0.85)", color: "#fff" }}>
                {sub.platform === "youtube" ? <YouTubeIcon className="w-3 h-3" /> : <TikTokIcon className="w-3 h-3" />}
                {sub.platform === "youtube" ? "YouTube" : "TikTok"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                style={{ background: st.bg, color: st.text, borderColor: st.border }}>
                {STATUS_LABELS[sub.status] || sub.status}
              </span>
            </div>
            <p className="font-bold text-white text-sm leading-snug line-clamp-2">{sub.title || "Untitled"}</p>
            <p className="text-xs text-white/70 mt-0.5">{sub.channelName}</p>
          </div>
        </div>

        {/* Analytics grid */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: "var(--pn-action-tint)", border: "1px solid var(--pn-action-border)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-[var(--pn-action)]" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pn-action)]">Views</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--pn-info-fg)" }}>{fmtNum(sub.views)}</p>
              {sub.views > 0 && <p className="text-[10px] text-[var(--pn-action)] mt-0.5">{sub.views.toLocaleString()} total</p>}
            </div>
            <div className="rounded-xl p-3" style={{ background: "var(--pn-critical-bg)", border: "1px solid var(--pn-critical-line)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--pn-critical-text)]" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pn-critical-text)]">Likes</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--pn-critical-fg)" }}>{sub.likes > 0 ? fmtNum(sub.likes) : "—"}</p>
              {sub.likes > 0 && <p className="text-[10px] text-[var(--pn-critical-text)] mt-0.5">{sub.likes.toLocaleString()} total</p>}
            </div>
          </div>

          {/* Meta info */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
            {[
              { icon: User, label: "Creator", value: sub.collaborator?.name || "—" },
              { icon: Calendar, label: "Submitted", value: fmtDate(sub.createdAt) },
              sub.reviewedAt && { icon: CheckCircle, label: "Reviewed", value: fmtDateTime(sub.reviewedAt) },
              sub.paidAt && { icon: Hash, label: "Paid", value: fmtDateTime(sub.paidAt) },
              sub.reviewedBy && { icon: User, label: "Reviewed by", value: sub.reviewedBy },
            ].filter(Boolean).map((row: any, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < 4 ? "1px solid var(--pn-border)" : "none" }}>
                <row.icon className="w-3.5 h-3.5 flex-shrink-0 text-[var(--pn-text-3)]" />
                <span className="text-xs font-semibold text-[var(--pn-text-3)] w-24 flex-shrink-0">{row.label}</span>
                <span className="text-xs font-medium text-[var(--pn-text)] truncate">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Payout info */}
          {sub.offeredAmount != null && (
            <div className="rounded-xl p-4" style={{ background: "var(--pn-success-bg)", border: "1px solid var(--pn-success-line)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pn-success-fg)]">Offered Amount</p>
                  <p className="text-2xl font-bold text-[var(--pn-success-fg)] mt-0.5">${sub.offeredAmount.toFixed(2)}</p>
                </div>
                {sub.rateType === "per_view" && sub.ratePerView != null && (
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pn-success-fg)]">Rate / View</p>
                    <p className="text-sm font-bold text-[var(--pn-success-fg)] mt-0.5">${sub.ratePerView}</p>
                  </div>
                )}
              </div>
              {sub.adminNote && (
                <p className="text-xs text-[var(--pn-success-fg)] mt-2 pt-2" style={{ borderTop: "1px solid var(--pn-success-line)" }}>
                  Note: {sub.adminNote}
                </p>
              )}
            </div>
          )}

          {/* Refresh error */}
          {refreshErr && (
            <div className="text-xs text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{refreshErr}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1 flex-wrap">
            <a href={sub.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
              <ExternalLink className="w-3.5 h-3.5" /> Open Video
            </a>
            {sub.status !== "paid" && (
              <button
                onClick={() => { setRefreshErr(""); refreshMutation.mutate(); }}
                disabled={refreshMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                style={{ background: "var(--pn-action-tint)", border: "1px solid var(--pn-action-border)", color: "var(--pn-info-fg)" }}>
                <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                {refreshMutation.isPending ? "Refreshing…" : "Refresh Views"}
              </button>
            )}
            {sub.status !== "paid" && (
              <button onClick={() => { onClose(); onSetRate(); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--pn-text)] ml-auto"
                style={{ background: sub.offeredAmount ? "var(--pn-action)" : "var(--pn-primary)" }}>
                <BarChart2 className="w-3.5 h-3.5" />
                {sub.offeredAmount ? "Edit Rate" : "Set Rate"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SocialsAdmin() {
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [ratingModal, setRatingModal] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["socials-admin", statusFilter, platformFilter],
    queryFn: () => adminApi.socials.list({ status: statusFilter || undefined, platform: platformFilter || undefined }),
  });

  const submissions: any[] = (data as any)?.data?.submissions || [];
  const total: number = (data as any)?.data?.total || 0;

  // Refresh all visible submissions sequentially
  const [refreshingAll, setRefreshingAll] = useState(false);
  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    const unpaid = submissions.filter(s => s.status !== "paid");
    for (const s of unpaid) {
      try { await adminApi.socials.refreshViews(s._id); } catch {}
    }
    await qc.invalidateQueries({ queryKey: ["socials-admin"] });
    setRefreshingAll(false);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <PageHeader title="Video Submissions" description={`${total} total submissions · click any row to view analytics`} icon={Video}>
        <button
          onClick={handleRefreshAll}
          disabled={refreshingAll || isLoading || submissions.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
          style={{ background: "var(--pn-action-tint)", border: "1px solid var(--pn-action-border)", color: "var(--pn-info-fg)" }}>
          <RefreshCw className={`w-4 h-4 ${refreshingAll ? "animate-spin" : ""}`} />
          {refreshingAll ? "Refreshing…" : "Refresh All Views"}
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {STATUS_TABS.map(t => (
            <button key={t.value} onClick={() => setStatusFilter(t.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={statusFilter === t.value
                ? { background: "var(--pn-primary)", color: "#fff" }
                : { background: "var(--pn-surface-2)", color: "var(--pn-text-2)", border: "1px solid var(--pn-border)" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {[
            { label: "All Platforms", value: "" },
            { label: "YouTube", value: "youtube" },
            { label: "TikTok", value: "tiktok" },
          ].map(p => (
            <button key={p.value} onClick={() => setPlatformFilter(p.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
              style={platformFilter === p.value
                ? { background: "var(--pn-primary)", color: "#fff" }
                : { background: "var(--pn-surface-2)", color: "var(--pn-text-2)", border: "1px solid var(--pn-border)" }}>
              {p.value === "youtube" && <YouTubeIcon className="w-3 h-3" />}
              {p.value === "tiktok" && <TikTokIcon className="w-3 h-3" />}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--pn-surface)] rounded-xl overflow-x-auto" style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "var(--pn-surface-2)" }} />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-16 text-center text-[var(--pn-text-3)]">
            <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No submissions found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Video</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden lg:table-cell">Creator</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden md:table-cell">Platform</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden md:table-cell">Views</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Offered</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden lg:table-cell">Submitted</th>
                <th className="px-5 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s: any) => {
                const st = STATUS_STYLES[s.status] || STATUS_STYLES.in_review;
                return (
                  <tr key={s._id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid var(--pn-border)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    onClick={() => setSelectedSub(s)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: "var(--pn-surface-2)", minWidth: 80 }}>
                          {s.thumbnail
                            ? <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                {s.platform === "youtube" ? <YouTubeIcon className="w-5 h-5 text-[var(--pn-critical-text)]" /> : <TikTokIcon className="w-5 h-5 text-[var(--pn-text)]" />}
                              </div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate max-w-[200px]" style={{ color: "var(--pn-text)" }}>{s.title || "Untitled"}</p>
                          <p className="text-xs text-[var(--pn-text-3)] truncate">{s.channelName}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--pn-action)] mt-0.5">
                            <Eye className="w-2.5 h-2.5" /> Click to view analytics
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <p className="text-sm font-medium" style={{ color: "var(--pn-text)" }}>{s.collaborator?.name || "—"}</p>
                      <p className="text-xs text-[var(--pn-text-3)]">{s.collaborator?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {s.platform === "youtube"
                          ? <><YouTubeIcon className="w-4 h-4 text-[var(--pn-critical-text)]" /><span className="text-xs font-medium text-[var(--pn-text-2)]">YouTube</span></>
                          : <><TikTokIcon className="w-4 h-4 text-[var(--pn-text)]" /><span className="text-xs font-medium text-[var(--pn-text-2)]">TikTok</span></>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--pn-text)" }}>
                        <Eye className="w-3.5 h-3.5 text-[var(--pn-text-3)]" />
                        {fmtNum(s.views)}
                      </div>
                      {s.likes > 0 && <p className="text-xs text-[var(--pn-text-3)] flex items-center gap-0.5"><Heart className="w-3 h-3 text-[var(--pn-critical-text)]" />{fmtNum(s.likes)}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                        style={{ background: st.bg, color: st.text, borderColor: st.border }}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.offeredAmount != null
                        ? <span className="text-sm font-bold" style={{ color: "var(--pn-success-fg)" }}>${s.offeredAmount.toFixed(2)}</span>
                        : <span className="text-xs text-[var(--pn-text-3)]">—</span>}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-[var(--pn-text-3)]">{fmtDate(s.createdAt)}</td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      {s.status !== "paid" && (
                        <button onClick={() => setRatingModal(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: s.offeredAmount ? "var(--pn-action-tint)" : "var(--pn-primary)", color: s.offeredAmount ? "var(--pn-action)" : "#fff" }}>
                          {s.offeredAmount ? "Edit Rate" : "Set Rate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {selectedSub && (
          <AnalyticsModal
            sub={selectedSub}
            onClose={() => setSelectedSub(null)}
            onSetRate={() => setRatingModal(selectedSub)}
            onRefreshed={(updated) => setSelectedSub(updated)}
          />
        )}
        {ratingModal && <RateModal sub={ratingModal} onClose={() => setRatingModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
