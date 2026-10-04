import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Loader2, Plus, Eye, CheckCircle, Clock, ChevronDown,
  AlertCircle, ExternalLink, DollarSign, TrendingUp, Send,
} from "lucide-react";
import PanelShell, { PanelNavItem } from "@/components/PanelShell";

const BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

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

/* Shopify status palette (tokens defined on .pn-shell in admin/panel.css) */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Tracking",  color: "var(--pn-info-fg)",    bg: "var(--pn-info-bg)" },
  in_review: { label: "In Review", color: "var(--pn-warning-fg)", bg: "var(--pn-warning-bg)" },
  reviewed:  { label: "Reviewed",  color: "var(--pn-info-fg)",    bg: "var(--pn-info-bg)" },
  accepted:  { label: "Accepted",  color: "var(--pn-success-fg)", bg: "var(--pn-success-bg)" },
  paid:      { label: "Paid",      color: "var(--pn-success-fg)", bg: "var(--pn-success-bg)" },
};

function YouTubeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
function TikTokIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.27 8.27 0 0 0 4.84 1.55V7a4.85 4.85 0 0 1-1.07-.31z" />
    </svg>
  );
}

const QUEUE_TABS = [
  { label: "All", value: "" },
  { label: "Tracking", value: "active" },
  { label: "In Review", value: "in_review" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Accepted", value: "accepted" },
  { label: "Paid", value: "paid" },
];

const navItems: PanelNavItem[] = [
  { href: "/socials/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState("");

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

  const handleLogout = () => {
    localStorage.removeItem("social_token");
    navigate("/socials/login");
  };

  const requestPayout = async () => {
    setRequestingPayout(true); setPayoutMessage("");
    try { await socialFetch("/social/request-payout", "POST"); setPayoutMessage("Payout requested — your manager has been notified."); }
    catch (e: any) { setPayoutMessage(e.message || "Could not request payout."); }
    finally { setRequestingPayout(false); }
  };

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
      <PanelShell eyebrow="Creator portal" navItems={navItems} user={null} onLogout={handleLogout}>
        <div className="p-6 max-w-[1100px] mx-auto flex items-center gap-2 text-sm" style={{ color: "var(--pn-text-3)" }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your dashboard…
        </div>
      </PanelShell>
    );
  }

  const activeQueueLabel = QUEUE_TABS.find(t => t.value === queueTab)?.label || "All";

  return (
    <PanelShell
      eyebrow="Creator portal"
      navItems={navItems}
      user={creator ? { name: creator.name, email: creator.email, role: "Content creator" } : null}
      onLogout={handleLogout}
    >
      <div className="p-6 max-w-[1100px] mx-auto space-y-6">
        {/* ── KPI row ── */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Submitted", value: stats.total, icon: Send },
              { label: "In Review", value: stats.inReview, icon: Clock },
              { label: "Pending Payout", value: `$${(stats.pendingPayout || 0).toFixed(2)}`, icon: DollarSign },
              { label: "Total Paid Out", value: `$${(stats.totalPaid || 0).toFixed(2)}`, icon: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="pn-metric">
                <span className="pn-metric__label">
                  <s.icon className="w-3.5 h-3.5" style={{ color: "var(--pn-text-3)" }} />
                  {s.label}
                </span>
                <span className="pn-metric__value">{s.value}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Payout callout ── */}
        <div
          className="pn-card flex items-center justify-between gap-4 px-5 py-4"
          style={{ borderColor: "var(--pn-success-line)", background: "var(--pn-success-bg)" }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--pn-success-fg)" }}>Ready for a payout?</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--pn-success-fg)", opacity: 0.85 }}>
              Request your available balance directly from your dashboard.
            </p>
          </div>
          <button
            onClick={requestPayout}
            disabled={requestingPayout || !(stats?.pendingPayout > 0)}
            className="pn-btn pn-btn--primary shrink-0"
          >
            {requestingPayout ? "Requesting…" : "Request payout"}
          </button>
        </div>
        {payoutMessage && (
          <p className="text-xs text-center" style={{ color: payoutMessage.startsWith("Payout") ? "var(--pn-success-fg)" : "var(--pn-critical-fg)" }}>
            {payoutMessage}
          </p>
        )}

        {/* ── Submit a video ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}
          className="pn-card overflow-hidden">
          <div className="pn-cardhead">
            <div>
              <h3 className="flex items-center gap-2">
                <Plus className="w-4 h-4" style={{ color: "var(--pn-action)" }} /> Submit a Video
              </h3>
              <p>Paste your YouTube or TikTok video link. Views and earnings start tracking immediately.</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex gap-3">
              {(["youtube", "tiktok"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPlatform(p); setPreview(null); setPreviewErr(""); setSubmitOk(false); }}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg font-semibold text-sm transition-all flex-1"
                  style={platform === p ? {
                    background: "var(--pn-action-tint)",
                    border: "1px solid var(--pn-action-border)",
                    color: "var(--pn-action)",
                  } : {
                    background: "var(--pn-surface)",
                    border: "1px solid var(--pn-border-strong)",
                    color: "var(--pn-text-2)",
                  }}
                >
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
                className="flex-1 rounded-lg px-4 py-3 text-sm focus:outline-none"
                style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border-strong)", color: "var(--pn-text)" }}
              />
              <button
                onClick={handlePreview}
                disabled={previewing || !url.trim()}
                className="pn-btn pn-btn--secondary px-4 py-3 rounded-lg flex items-center gap-2"
              >
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                {previewing ? "Fetching…" : "Preview"}
              </button>
            </div>

            {previewErr && (
              <div
                className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg"
                style={{ background: "var(--pn-critical-bg)", border: "1px solid var(--pn-critical-line)", color: "var(--pn-critical-fg)" }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {previewErr}
              </div>
            )}

            {submitOk && (
              <div
                className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg"
                style={{ background: "var(--pn-success-bg)", border: "1px solid var(--pn-success-line)", color: "var(--pn-success-fg)" }}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> Video submitted! It's now in your queue as "In Review".
              </div>
            )}

            <AnimatePresence>
              {preview && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="rounded-lg overflow-hidden flex gap-4 p-4"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
                  <div className="flex-shrink-0 w-36 h-24 rounded-lg overflow-hidden relative" style={{ background: "var(--pn-surface-3)", border: "1px solid var(--pn-border)" }}>
                    {preview.thumbnail
                      ? <img src={preview.thumbnail} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          {preview.platform === "youtube"
                            ? <YouTubeIcon className="w-8 h-8" style={{ color: "#DC2626" } as any} />
                            : <TikTokIcon className="w-8 h-8" style={{ color: "var(--pn-text)" } as any} />}
                        </div>}
                    <div className="absolute bottom-1 right-1">
                      {preview.platform === "youtube"
                        ? <YouTubeIcon className="w-4 h-4" style={{ color: "#DC2626" } as any} />
                        : <TikTokIcon className="w-4 h-4" style={{ color: "var(--pn-text)" } as any} />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--pn-text)" }}>{preview.title || "Untitled video"}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--pn-text-3)" }}>{preview.channelName || "Unknown channel"}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {preview.views > 0 && (
                        <div className="text-xs" style={{ color: "var(--pn-text-3)" }}>
                          👁 <span className="font-semibold" style={{ color: "var(--pn-text)" }}>{fmtNum(preview.views)}</span> views
                        </div>
                      )}
                      {preview.likes > 0 && (
                        <div className="text-xs" style={{ color: "var(--pn-text-3)" }}>
                          ♥ <span className="font-semibold" style={{ color: "var(--pn-text)" }}>{fmtNum(preview.likes)}</span> likes
                        </div>
                      )}
                      {preview.views === 0 && (
                        <p className="text-xs" style={{ color: "var(--pn-text-3)" }}>Analytics shown after admin review</p>
                      )}
                    </div>
                    {submitErr && <p className="text-xs mt-2" style={{ color: "var(--pn-critical-fg)" }}>{submitErr}</p>}
                    <button onClick={handleSubmit} disabled={submitting} className="pn-btn pn-btn--primary mt-3">
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {submitting ? "Submitting…" : "Submit Video"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Submission queue ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }}
          className="pn-card overflow-hidden">
          <div className="pn-cardhead">
            <div>
              <h3>Submission Queue</h3>
              <p>Track the status of your submitted videos.</p>
            </div>
            <div className="relative ml-auto">
              <button
                onClick={() => setQueueDropOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border-strong)", color: "var(--pn-text-2)" }}
              >
                {activeQueueLabel} <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {queueDropOpen && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 w-36 rounded-lg overflow-hidden z-20 py-1"
                    style={{ background: "var(--pn-surface)", border: "1px solid var(--pn-border)", boxShadow: "var(--pn-shadow-2)" }}>
                    {QUEUE_TABS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => { setQueueTab(t.value); setQueueDropOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                        style={{ color: queueTab === t.value ? "var(--pn-action)" : "var(--pn-text-2)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--pn-surface-3)"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
                      >
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
              <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "var(--pn-text-3)" }} />
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--pn-text-3)" }} />
              <p className="text-sm" style={{ color: "var(--pn-text-3)" }}>
                No submissions{queueTab ? ` with status "${activeQueueLabel}"` : ""} yet.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--pn-divider)" }}>
              {submissions.map((s: any) => {
                const cfg = STATUS_CFG[s.status] || STATUS_CFG.in_review;
                return (
                  <div key={s._id} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden relative"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
                      {s.thumbnail
                        ? <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            {s.platform === "youtube"
                              ? <YouTubeIcon className="w-6 h-6" style={{ color: "#DC2626" } as any} />
                              : <TikTokIcon className="w-6 h-6" style={{ color: "var(--pn-text)" } as any} />}
                          </div>}
                      <div className="absolute bottom-1 right-1">
                        {s.platform === "youtube"
                          ? <YouTubeIcon className="w-3 h-3" style={{ color: "#DC2626" } as any} />
                          : <TikTokIcon className="w-3 h-3" style={{ color: "var(--pn-text)" } as any} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--pn-text)" }}>{s.title || "Untitled"}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--pn-text-3)" }}>{s.channelName}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {s.views > 0 && <span className="text-xs" style={{ color: "var(--pn-text-3)" }}>👁 {fmtNum(s.views)}</span>}
                            {s.likes > 0 && <span className="text-xs" style={{ color: "var(--pn-text-3)" }}>♥ {fmtNum(s.likes)}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="pn-badge" style={{ background: cfg.bg, color: cfg.color }}>
                            <span className="pn-badge__dot" />
                            {cfg.label}
                          </span>
                          {s.offeredAmount != null && (
                            <span className="text-sm font-bold" style={{ color: "var(--pn-success-fg)" }}>${s.offeredAmount.toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px]" style={{ color: "var(--pn-text-3)" }}>
                          Submitted {fmtDate(s.createdAt)}
                        </span>
                        {s.adminNote && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md"
                            style={{ background: "var(--pn-info-bg)", color: "var(--pn-info-fg)" }}>
                            Note: {s.adminNote}
                          </span>
                        )}
                        <a href={s.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] ml-auto"
                          style={{ color: "var(--pn-action)" }}>
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
      </div>
    </PanelShell>
  );
}
