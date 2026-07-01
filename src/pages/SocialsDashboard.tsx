import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Loader2, Plus, Eye, CheckCircle, Clock, ChevronDown,
  AlertCircle, ExternalLink, DollarSign, TrendingUp, Send,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "";

function socialFetch(path: string, method = "GET", body?: unknown) {
  const token = localStorage.getItem("social_token");
  return fetch(`${BASE}/api/collab${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  });
}

function fmtNum(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  in_review: { label: "In Review",  color: "#d97706", bg: "rgba(251,191,36,0.15)" },
  reviewed:  { label: "Reviewed",   color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  accepted:  { label: "Accepted",   color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  paid:      { label: "Paid",       color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
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

const QUEUE_TABS = [
  { label: "All", value: "" },
  { label: "In Review", value: "in_review" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Accepted", value: "accepted" },
  { label: "Paid", value: "paid" },
];

export default function SocialsDashboard() {
  const [, navigate] = useLocation();
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [platform, setPlatform] = useState<"youtube" | "tiktok">("youtube");
  const [url, setUrl] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewErr, setPreviewErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [submitOk, setSubmitOk] = useState(false);

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueTab, setQueueTab] = useState("");
  const [queueDropOpen, setQueueDropOpen] = useState(false);

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("social_token");
    if (!token) { navigate("/socials/login"); return; }
    socialFetch("/me")
      .then((r) => setCreator(r.data?.collaborator))
      .catch(() => { localStorage.removeItem("social_token"); navigate("/socials/login"); })
      .finally(() => setLoading(false));
  }, []);

  const loadQueue = useCallback(() => {
    setQueueLoading(true);
    const q = queueTab ? `?status=${queueTab}` : "";
    socialFetch(`/social/my${q}`)
      .then((r) => setSubmissions(r.data?.submissions || []))
      .catch(() => {})
      .finally(() => setQueueLoading(false));
  }, [queueTab]);

  const loadStats = useCallback(() => {
    socialFetch("/social/stats").then((r) => setStats(r.data?.stats)).catch(() => {});
  }, []);

  useEffect(() => { loadQueue(); loadStats(); }, [loadQueue, loadStats]);

  const handlePreview = async () => {
    if (!url.trim()) return;
    setPreviewing(true); setPreviewErr(""); setPreview(null); setSubmitOk(false);
    try {
      const r = await socialFetch("/social/preview", "POST", { platform, url: url.trim() });
      setPreview(r.data?.info);
    } catch (e: any) {
      setPreviewErr(e.message || "Failed to fetch video info");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitErr(""); setSubmitOk(false);
    try {
      await socialFetch("/social/submit", "POST", { platform, url: url.trim() });
      setSubmitOk(true);
      setUrl(""); setPreview(null);
      loadQueue(); loadStats();
    } catch (e: any) {
      setSubmitErr(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #060a1a 0%, #0c1445 45%, #060a1a 100%)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#a78bfa" }} />
      </div>
    );
  }

  const activeQueueLabel = QUEUE_TABS.find(t => t.value === queueTab)?.label || "All";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #060a1a 0%, #0c1445 45%, #060a1a 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10">
        <header className="flex items-center justify-between px-6 h-16 flex-shrink-0"
          style={{ background: "rgba(6,9,28,0.82)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 16px rgba(124,58,237,0.35)" }}>
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-tight">RBstars</span>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(167,139,250,0.7)" }}>Creator Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white text-xs font-semibold">{creator?.name}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{creator?.email}</p>
            </div>
            <button onClick={() => { localStorage.removeItem("social_token"); navigate("/socials/login"); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <LogOut className="w-3.5 h-3.5" /> Log out
            </button>
          </div>
        </header>

        <main className="p-6 max-w-[1100px] mx-auto space-y-6">
          {stats && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Submitted", value: stats.total, icon: Send, color: "#a78bfa" },
                { label: "In Review", value: stats.inReview, icon: Clock, color: "#fbbf24" },
                { label: "Pending Payout", value: `$${(stats.pendingPayout || 0).toFixed(2)}`, icon: DollarSign, color: "#4ade80" },
                { label: "Total Paid Out", value: `$${(stats.totalPaid || 0).toFixed(2)}`, icon: TrendingUp, color: "#60a5fa" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
                  </div>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                </div>
              ))}
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" style={{ color: "#a78bfa" }} /> Submit a Video
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Paste your YouTube or TikTok video link to submit it for review.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                {(["youtube", "tiktok"] as const).map((p) => (
                  <button key={p} onClick={() => { setPlatform(p); setPreview(null); setPreviewErr(""); setSubmitOk(false); }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex-1"
                    style={platform === p ? {
                      background: p === "youtube" ? "rgba(255,0,0,0.2)" : "rgba(0,0,0,0.4)",
                      border: `1px solid ${p === "youtube" ? "rgba(255,0,0,0.5)" : "rgba(255,255,255,0.3)"}`,
                      color: p === "youtube" ? "#f87171" : "rgba(255,255,255,0.9)",
                    } : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.4)",
                    }}>
                    {p === "youtube" ? <YouTubeIcon className="w-5 h-5" /> : <TikTokIcon className="w-5 h-5" />}
                    {p === "youtube" ? "YouTube" : "TikTok"}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setPreview(null); setPreviewErr(""); setSubmitOk(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePreview(); }}
                  placeholder={platform === "youtube" ? "https://www.youtube.com/watch?v=..." : "https://www.tiktok.com/@user/video/..."}
                  className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                />
                <button onClick={handlePreview} disabled={previewing || !url.trim()}
                  className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                  style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc" }}>
                  {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  {previewing ? "Fetching…" : "Preview"}
                </button>
              </div>

              {previewErr && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-xl" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {previewErr}
                </div>
              )}

              {submitOk && (
                <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> Video submitted! It's now in your queue as "In Review".
                </div>
              )}

              <AnimatePresence>
                {preview && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl overflow-hidden flex gap-4 p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="flex-shrink-0 w-36 h-24 rounded-lg overflow-hidden relative" style={{ background: "#1a1a2e" }}>
                      {preview.thumbnail
                        ? <img src={preview.thumbnail} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            {preview.platform === "youtube" ? <YouTubeIcon className="w-8 h-8 text-red-500" /> : <TikTokIcon className="w-8 h-8 text-white" />}
                          </div>}
                      <div className="absolute bottom-1 right-1">
                        {preview.platform === "youtube" ? <YouTubeIcon className="w-4 h-4 text-red-500" /> : <TikTokIcon className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{preview.title || "Untitled video"}</p>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{preview.channelName || "Unknown channel"}</p>
                      <div className="flex items-center gap-4 mt-2">
                        {preview.views > 0 && (
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                            👁 <span className="font-semibold text-white">{fmtNum(preview.views)}</span> views
                          </div>
                        )}
                        {preview.likes > 0 && (
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                            ♥ <span className="font-semibold text-white">{fmtNum(preview.likes)}</span> likes
                          </div>
                        )}
                        {preview.views === 0 && (
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Analytics shown after admin review</p>
                        )}
                      </div>
                      {submitErr && <p className="text-xs text-red-400 mt-2">{submitErr}</p>}
                      <button onClick={handleSubmit} disabled={submitting}
                        className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}>
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {submitting ? "Submitting…" : "Submit Video"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="font-bold text-white text-sm">Submission Queue</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Track the status of your submitted videos.</p>
              </div>
              <div className="relative">
                <button onClick={() => setQueueDropOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                  {activeQueueLabel} <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {queueDropOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 w-36 rounded-xl overflow-hidden z-20"
                      style={{ background: "rgba(15,20,50,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {QUEUE_TABS.map((t) => (
                        <button key={t.value} onClick={() => { setQueueTab(t.value); setQueueDropOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                          style={{ color: queueTab === t.value ? "#a5b4fc" : "rgba(255,255,255,0.5)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
                          {t.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {queueLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "#a78bfa" }} />
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "#a78bfa" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                  No submissions{queueTab ? ` with status "${activeQueueLabel}"` : ""} yet.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {submissions.map((s: any) => {
                  const cfg = STATUS_CFG[s.status] || STATUS_CFG.in_review;
                  return (
                    <div key={s._id} className="flex items-start gap-4 px-5 py-4">
                      <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden relative" style={{ background: "#1a1a2e" }}>
                        {s.thumbnail
                          ? <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              {s.platform === "youtube" ? <YouTubeIcon className="w-6 h-6 text-red-500" /> : <TikTokIcon className="w-6 h-6 text-white" />}
                            </div>}
                        <div className="absolute bottom-1 right-1">
                          {s.platform === "youtube" ? <YouTubeIcon className="w-3 h-3 text-red-400" /> : <TikTokIcon className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{s.title || "Untitled"}</p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.channelName}</p>
                            <div className="flex items-center gap-3 mt-1">
                              {s.views > 0 && <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>👁 {fmtNum(s.views)}</span>}
                              {s.likes > 0 && <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>♥ {fmtNum(s.likes)}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                            {s.offeredAmount != null && (
                              <span className="text-sm font-bold" style={{ color: "#4ade80" }}>${s.offeredAmount.toFixed(2)}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                            Submitted {fmtDate(s.createdAt)}
                          </span>
                          {s.adminNote && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc" }}>
                              Note: {s.adminNote}
                            </span>
                          )}
                          <a href={s.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] ml-auto"
                            style={{ color: "rgba(99,102,241,0.7)" }}>
                            <ExternalLink className="w-2.5 h-2.5" /> View
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
