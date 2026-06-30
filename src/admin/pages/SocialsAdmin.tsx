import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../api";
import {
  Video, Loader2, X, ExternalLink, CheckCircle, AlertCircle,
  ChevronDown, Eye, TrendingUp,
} from "lucide-react";

function fmtNum(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "In Review", value: "in_review" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Accepted", value: "accepted" },
  { label: "Paid", value: "paid" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  in_review: { bg: "#FEF9C3", text: "#854D0E",  border: "#FDE047" },
  reviewed:  { bg: "#EFF6FF", text: "#1D4ED8",  border: "#93C5FD" },
  accepted:  { bg: "#ECFDF5", text: "#065F46",  border: "#6EE7B7" },
  paid:      { bg: "#F3F4F6", text: "#374151",  border: "#D1D5DB" },
};
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
  rateType: "per_view" | "auto";
  ratePerView: string;
  offeredAmount: string;
  adminNote: string;
}

function RateModal({ sub, onClose }: { sub: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<RateForm>({
    rateType: sub.rateType || "per_view",
    ratePerView: sub.ratePerView ? String(sub.ratePerView) : "",
    offeredAmount: sub.offeredAmount ? String(sub.offeredAmount) : "",
    adminNote: sub.adminNote || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const views = sub.views || 0;

  const computedAmount = form.rateType === "per_view" && form.ratePerView && views
    ? (parseFloat(form.ratePerView) * views).toFixed(2)
    : null;
  const computedRPV = form.rateType === "auto" && form.offeredAmount && views
    ? (parseFloat(form.offeredAmount) / views).toFixed(6)
    : null;

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      await adminApi.socials.setRate(sub._id, {
        rateType: form.rateType,
        ratePerView: form.rateType === "per_view" ? parseFloat(form.ratePerView) : undefined,
        offeredAmount: form.rateType === "auto" ? parseFloat(form.offeredAmount) : undefined,
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
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        style={{ border: "1px solid #E9EBF5" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <h3 className="font-bold text-base" style={{ color: "#1e1b4b" }}>Set Rate</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600" style={{ background: "#F7F8FC" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video preview inside modal */}
        <div className="px-6 pt-4 flex gap-3">
          <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#F7F8FC" }}>
            {sub.thumbnail
              ? <img src={sub.thumbnail} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  {sub.platform === "youtube" ? <YouTubeIcon className="w-5 h-5 text-red-500" /> : <TikTokIcon className="w-5 h-5 text-slate-700" />}
                </div>}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "#1e1b4b" }}>{sub.title || "Untitled"}</p>
            <p className="text-xs text-slate-400">{sub.channelName}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>👁 {fmtNum(sub.views)}</span>
              {sub.likes > 0 && <span>♥ {fmtNum(sub.likes)}</span>}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Rate type toggle */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-500">Rate Type</label>
            <div className="flex gap-2">
              {(["per_view", "auto"] as const).map((rt) => (
                <button key={rt} onClick={() => setForm(f => ({ ...f, rateType: rt }))}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
                  style={form.rateType === rt
                    ? { background: "#1e1b4b", color: "#fff" }
                    : { background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                  {rt === "per_view" ? "Rate Per View" : "Fixed Amount (Auto)"}
                </button>
              ))}
            </div>
          </div>

          {form.rateType === "per_view" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-500">Rate per View ($)</label>
                <input
                  type="number" step="0.000001" min="0"
                  value={form.ratePerView}
                  onChange={e => setForm(f => ({ ...f, ratePerView: e.target.value }))}
                  placeholder="e.g. 0.001"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                />
              </div>
              {computedAmount && (
                <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <span className="text-xs font-semibold text-slate-500">Auto-calculated total</span>
                  <span className="text-base font-bold text-emerald-700">${computedAmount}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-500">Fixed Amount Offered ($)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.offeredAmount}
                  onChange={e => setForm(f => ({ ...f, offeredAmount: e.target.value }))}
                  placeholder="e.g. 50.00"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                />
              </div>
              {computedRPV && views > 0 && (
                <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                  <span className="text-xs font-semibold text-slate-500">Implied rate per view</span>
                  <span className="text-sm font-bold text-sky-700">${computedRPV}/view</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-500">Note to Creator (optional)</label>
            <input
              value={form.adminNote}
              onChange={e => setForm(f => ({ ...f, adminNote: e.target.value }))}
              placeholder="e.g. Great video, thanks!"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
            />
          </div>

          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{err}</div>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#059669" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Submit Rate
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SocialsAdmin() {
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [ratingModal, setRatingModal] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["socials-admin", statusFilter, platformFilter],
    queryFn: () => adminApi.socials.list({ status: statusFilter || undefined, platform: platformFilter || undefined }),
  });

  const submissions: any[] = (data as any)?.data?.submissions || [];
  const total: number = (data as any)?.data?.total || 0;

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Video Submissions</h2>
        <p className="text-sm text-slate-500 mt-0.5">{total} total submissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {STATUS_TABS.map(t => (
            <button key={t.value} onClick={() => setStatusFilter(t.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={statusFilter === t.value
                ? { background: "#1e1b4b", color: "#fff" }
                : { background: "#F7F8FC", color: "#6b7280", border: "1px solid #E9EBF5" }}>
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
                ? { background: "#1e1b4b", color: "#fff" }
                : { background: "#F7F8FC", color: "#6b7280", border: "1px solid #E9EBF5" }}>
              {p.value === "youtube" && <YouTubeIcon className="w-3 h-3" />}
              {p.value === "tiktok" && <TikTokIcon className="w-3 h-3" />}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No submissions found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Video</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Creator</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Platform</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Views</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Offered</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Submitted</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s: any) => {
                const st = STATUS_STYLES[s.status] || STATUS_STYLES.in_review;
                return (
                  <tr key={s._id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: "#F7F8FC", minWidth: 80 }}>
                          {s.thumbnail
                            ? <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                {s.platform === "youtube" ? <YouTubeIcon className="w-5 h-5 text-red-500" /> : <TikTokIcon className="w-5 h-5 text-slate-700" />}
                              </div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate max-w-[200px]" style={{ color: "#1e1b4b" }}>{s.title || "Untitled"}</p>
                          <p className="text-xs text-slate-400 truncate">{s.channelName}</p>
                          <a href={s.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-600 mt-0.5">
                            <ExternalLink className="w-2.5 h-2.5" /> View video
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <p className="text-sm font-medium" style={{ color: "#1e1b4b" }}>{s.collaborator?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{s.collaborator?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {s.platform === "youtube"
                          ? <><YouTubeIcon className="w-4 h-4 text-red-500" /><span className="text-xs font-medium text-slate-600">YouTube</span></>
                          : <><TikTokIcon className="w-4 h-4 text-slate-700" /><span className="text-xs font-medium text-slate-600">TikTok</span></>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "#1e1b4b" }}>
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {fmtNum(s.views)}
                      </div>
                      {s.likes > 0 && <p className="text-xs text-slate-400">♥ {fmtNum(s.likes)}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                        style={{ background: st.bg, color: st.text, borderColor: st.border }}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.offeredAmount != null
                        ? <span className="text-sm font-bold" style={{ color: "#059669" }}>${s.offeredAmount.toFixed(2)}</span>
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400">{fmtDate(s.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      {s.status !== "paid" && (
                        <button onClick={() => setRatingModal(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: s.offeredAmount ? "#EEF2FF" : "#1e1b4b", color: s.offeredAmount ? "#4f46e5" : "#fff" }}>
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
        {ratingModal && <RateModal sub={ratingModal} onClose={() => setRatingModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
