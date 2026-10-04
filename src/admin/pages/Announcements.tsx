import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Plus, Search, Trash2, Send, Save, X, Loader2, Eye, EyeOff,
  Mail, Users, Ticket, Ban, ChevronRight, Sparkles, Copy, Check, RefreshCw,
  MessageSquareText, Radio, MousePointerClick,
} from "lucide-react";
import { adminApi } from "../api";
import type { Announcement, AnnouncementTheme, BroadcastAudience, EmailBroadcast } from "../types";
import { PageHeader, Badge, Segmented, EmptyState, Skeleton } from "../components/kit";

/* ------------------------------------------------------------------ */
/* Themes — flat fills only, matching the brand's colour-blocking rule. */
/* ------------------------------------------------------------------ */

const THEMES: Record<AnnouncementTheme, { bg: string; soft: string; label: string }> = {
  blue:   { bg: "#005bd3", soft: "#e8f0fe", label: "Blue" },
  pink:   { bg: "#d6336c", soft: "#fdeaf1", label: "Pink" },
  green:  { bg: "#0f7b4f", soft: "#e3f6ec", label: "Green" },
  yellow: { bg: "#b45309", soft: "#fdf1e0", label: "Amber" },
  red:    { bg: "#b42318", soft: "#fdecea", label: "Red" },
  ink:    { bg: "#303030", soft: "#eeeeee", label: "Ink" },
  violet: { bg: "#5b3fd1", soft: "#eeeafc", label: "Violet" },
};
const THEME_KEYS = Object.keys(THEMES) as AnnouncementTheme[];

const AUDIENCES: { key: BroadcastAudience; label: string; blurb: string }[] = [
  { key: "all", label: "Everyone", blurb: "Every registered account" },
  { key: "verified", label: "Verified", blurb: "Confirmed email addresses only" },
  { key: "buyers", label: "Buyers", blurb: "Accounts with spend > $0" },
  { key: "non_buyers", label: "Non-buyers", blurb: "Signed up, never purchased" },
];

const EMPTY_FORM = {
  title: "",
  body: "",
  imageUrl: "",
  theme: "blue" as AnnouncementTheme,
  badge: "",
  ctaLabel: "",
  ctaUrl: "",
  promoCode: "",
  showAsModal: true,
  dismissible: true,
  published: false,
  priority: 0,
  startsAt: "",
  endsAt: "",
};

type Form = typeof EMPTY_FORM;

function relative(dateStr?: string | null) {
  if (!dateStr) return "—";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputCls =
  "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--pn-action)]";
const inpStyle: React.CSSProperties = {
  background: "var(--pn-surface-2)",
  border: "1px solid var(--pn-border)",
  color: "var(--pn-text)",
};

/* ------------------------------------------------------------------ */
/* Live preview — an in-page miniature of the storefront popup.        */
/* ------------------------------------------------------------------ */

function PopupPreview({ a }: { a: Partial<Form> }) {
  const theme = THEMES[(a.theme as AnnouncementTheme) || "blue"] || THEMES.blue;
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--pn-border)" }}>
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ borderColor: "var(--pn-border)", background: "var(--pn-surface-2)" }}>
        <Eye size={13} style={{ color: "var(--pn-text-3)" }} />
        <span className="text-[11px] font-semibold" style={{ color: "var(--pn-text-2)" }}>
          Customer popup preview
        </span>
        {!a.showAsModal && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: theme.soft, color: theme.bg }}>
            Feed only
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4" style={{ background: "var(--pn-bg)" }}>
        <div className="rounded-xl overflow-hidden flex flex-col sm:flex-row" style={{ border: "1px solid var(--pn-border)" }}>
          {/* Art panel */}
          <div
            className="relative sm:w-2/5 shrink-0 min-h-[120px] sm:min-h-0 flex items-center justify-center p-4"
            style={{ background: theme.bg }}
          >
            {a.imageUrl ? (
              <img src={a.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              /* decorative flat shapes */
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full" style={{ background: "rgba(255,255,255,.14)" }} />
                <div className="absolute bottom-4 right-3 w-10 h-10 rounded-full" style={{ background: "rgba(255,255,255,.10)" }} />
                <div
                  className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-xl"
                  style={{ border: "2px solid rgba(255,255,255,.22)" }}
                />
              </div>
            )}
            <Megaphone className="relative" size={30} style={{ color: "rgba(255,255,255,.9)" }} />
          </div>

          {/* Content panel */}
          <div className="flex-1 p-4 sm:p-5" style={{ background: "var(--pn-surface)" }}>
            {a.badge && (
              <span
                className="inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded mb-2"
                style={{ background: theme.soft, color: theme.bg }}
              >
                {a.badge}
              </span>
            )}
            <h4 className="text-base sm:text-lg font-bold leading-tight" style={{ color: "var(--pn-text)" }}>
              {a.title || "Untitled announcement"}
            </h4>
            <p
              className="text-xs mt-1.5 leading-relaxed line-clamp-4"
              style={{ color: "var(--pn-text-2)", whiteSpace: "pre-wrap" }}
            >
              {a.body || "Your message will appear here."}
            </p>
            <div className="flex items-center gap-2 mt-3">
              {a.ctaLabel && (
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: theme.bg, color: "#fff" }}
                >
                  {a.ctaLabel}
                </span>
              )}
              {a.promoCode && (
                <span
                  className="px-2 py-1 rounded font-mono text-[10px] font-bold"
                  style={{ background: theme.soft, color: theme.bg }}
                >
                  {a.promoCode}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-[10px] mt-2" style={{ color: "var(--pn-text-3)" }}>
          Popup appears on site load. Dismissed announcements are remembered per device.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Thread row                                                          */
/* ------------------------------------------------------------------ */

function ThreadRow({
  a, selected, onSelect,
}: { a: Announcement; selected: boolean; onSelect: () => void }) {
  const theme = THEMES[(a.theme as AnnouncementTheme) || "blue"] || THEMES.blue;
  const live = !!a.isLive;
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
      style={{
        background: selected ? "var(--pn-surface-2)" : "transparent",
        border: `1px solid ${selected ? "var(--pn-border)" : "transparent"}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ background: live ? theme.bg : "var(--pn-border-strong)" }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {a.badge && (
              <span
                className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-px rounded shrink-0"
                style={{ background: theme.soft, color: theme.bg }}
              >
                {a.badge}
              </span>
            )}
            <span className="text-sm font-semibold truncate" style={{ color: "var(--pn-text)" }}>
              {a.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: "var(--pn-text-3)" }}>
            <span>{relative(a.createdAt)}</span>
            {!!a.views && <span>· {a.views} views</span>}
            {a.endsAt && <span>· ends {relative(a.endsAt)}</span>}
          </div>
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
          style={
            live
              ? { background: "var(--pn-success-bg)", color: "var(--pn-success-fg)" }
              : { background: "var(--pn-surface-2)", color: "var(--pn-text-3)" }
          }
        >
          {live ? "Live" : a.published ? "Scheduled" : "Draft"}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function Announcements() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"posts" | "email">("posts");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const listQuery = useQuery({
    queryKey: ["announcements"],
    queryFn: () => adminApi.announcements.listAll(),
  });
  const items: Announcement[] = useMemo(() => listQuery.data?.data?.announcements || [], [listQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.body || "").toLowerCase().includes(q) ||
        (a.badge || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const selected = useMemo(
    () => items.find((a) => String(a._id) === selectedId) || null,
    [items, selectedId]
  );

  // Auto-open the newest post the first time the list arrives.
  useEffect(() => {
    if (!selectedId && !editing && items.length > 0) setSelectedId(String(items[0]._id));
  }, [items, selectedId, editing]);

  const toForm = (a: Announcement): Form => ({
    title: a.title || "",
    body: a.body || "",
    imageUrl: a.imageUrl || "",
    theme: (a.theme as AnnouncementTheme) || "blue",
    badge: a.badge || "",
    ctaLabel: a.ctaLabel || "",
    ctaUrl: a.ctaUrl || "",
    promoCode: a.promoCode || "",
    showAsModal: a.showAsModal !== false,
    dismissible: a.dismissible !== false,
    published: !!a.published,
    priority: a.priority || 0,
    startsAt: toLocalInput(a.startsAt),
    endsAt: toLocalInput(a.endsAt),
  });

  useEffect(() => {
    if (selected && !editing) setForm(toForm(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?._id, editing]);

  const payload = (f: Form) => ({
    title: f.title.trim(),
    body: f.body.trim(),
    imageUrl: f.imageUrl.trim() || null,
    theme: f.theme,
    badge: f.badge.trim() || null,
    ctaLabel: f.ctaLabel.trim() || null,
    ctaUrl: f.ctaUrl.trim() || null,
    promoCode: f.promoCode.trim().toUpperCase() || null,
    showAsModal: f.showAsModal,
    dismissible: f.dismissible,
    published: f.published,
    priority: Number(f.priority) || 0,
    startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
    endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (selected) return adminApi.announcements.update(String(selected._id), payload(form));
      return adminApi.announcements.create(payload(form));
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      const id = String(res?.data?.announcement?._id || res?.data?.announcement?.id || "");
      if (id) setSelectedId(id);
      setEditing(false);
      setNotice("Saved");
      window.setTimeout(() => setNotice(""), 2200);
    },
    onError: (err: Error) => setNotice(err.message),
  });

  const removeMut = useMutation({
    mutationFn: () => adminApi.announcements.remove(String(selected?._id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setSelectedId(null);
      setEditing(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: Error) => setNotice(err.message),
  });

  const startNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setEditing(true);
  };

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const liveCount = items.filter((a) => a.isLive).length;
  const draftCount = items.filter((a) => !a.published).length;

  return (
    <div className="p-6 space-y-5 max-w-[1440px] mx-auto">
      <PageHeader
        icon={Megaphone}
        title="Announcements"
        description="Site-wide posts shown to customers as a popup on load, plus bulk discount emails."
      >
        <>
          {notice && (
            <span className="text-xs font-semibold" style={{ color: "var(--pn-text-2)" }}>
              {notice}
            </span>
          )}
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as "posts" | "email")}
            options={[
              { value: "posts", label: `Announcements (${items.length})` },
              { value: "email", label: "Email Broadcast" },
            ]}
          />
        </>
      </PageHeader>

      {tab === "posts" ? (
        <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* ── Thread list ─────────────────────────────── */}
          <div
            className="rounded-xl border overflow-hidden flex flex-col"
            style={{ background: "var(--pn-surface)", borderColor: "var(--pn-border)" }}
          >
            <div className="p-3 border-b space-y-2.5" style={{ borderColor: "var(--pn-border)" }}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--pn-text-3)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search announcements…"
                    className={`${inputCls} pl-8`}
                    style={inpStyle}
                  />
                </div>
                <button
                  onClick={startNew}
                  className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0"
                  style={{ background: "var(--pn-primary)", color: "#fff" }}
                >
                  <Plus size={15} /> New
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--pn-text-3)" }}>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--pn-success-fg)" }} />
                  {liveCount} live
                </span>
                <span>·</span>
                <span>{draftCount} drafts</span>
              </div>
            </div>

            <div className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 330px)" }}>
              {listQuery.isLoading ? (
                <div className="p-2 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : listQuery.isError ? (
                <div className="p-4 text-center">
                  <p className="text-sm font-semibold" style={{ color: "var(--pn-critical-text)" }}>
                    Couldn&apos;t load announcements
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--pn-text-3)" }}>
                    {(listQuery.error as Error)?.message}
                  </p>
                  <button onClick={() => listQuery.refetch()} className="mt-3 text-xs font-semibold" style={{ color: "var(--pn-action)" }}>
                    Retry
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={MessageSquareText}
                  title={search ? "No matches" : "No announcements yet"}
                  body={
                    search
                      ? "Try a different search term."
                      : "Create your first post — it pops up for every customer the moment the site loads."
                  }
                />
              ) : (
                filtered.map((a) => (
                  <ThreadRow
                    key={String(a._id)}
                    a={a}
                    selected={String(a._id) === String(selected?._id)}
                    onSelect={() => { setSelectedId(String(a._id)); setEditing(false); }}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Post detail / editor ────────────────────── */}
          <div className="space-y-4 min-w-0">
            {!selected && !editing ? (
              <div
                className="rounded-xl border p-10 text-center"
                style={{ background: "var(--pn-surface)", borderColor: "var(--pn-border)" }}
              >
                <Megaphone size={34} className="mx-auto mb-3 opacity-30" style={{ color: "var(--pn-text-3)" }} />
                <p className="font-semibold" style={{ color: "var(--pn-text)" }}>
                  Pick a post or start a new one
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--pn-text-3)" }}>
                  Announcements you publish show up as a popup the next time a customer opens the site.
                </p>
                <button
                  onClick={startNew}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
                  style={{ background: "var(--pn-primary)", color: "#fff" }}
                >
                  <Plus size={15} /> New announcement
                </button>
              </div>
            ) : (
              <>
                {/* Forum-post header */}
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ background: "var(--pn-surface)", borderColor: "var(--pn-border)" }}
                >
                  <div
                    className="h-1.5"
                    style={{ background: THEMES[(form.theme as AnnouncementTheme) || "blue"].bg }}
                  />
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <Badge tone={selected?.isLive ? "success" : form.published ? "warning" : "neutral"}>
                            {selected?.isLive ? "Live now" : form.published ? "Scheduled" : "Draft"}
                          </Badge>
                          {form.badge && (
                            <span
                              className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
                              style={{
                                background: THEMES[form.theme].soft,
                                color: THEMES[form.theme].bg,
                              }}
                            >
                              {form.badge}
                            </span>
                          )}
                          <span className="text-[11px]" style={{ color: "var(--pn-text-3)" }}>
                            by {selected?.createdByEmail || "you"} · {relative(selected?.createdAt)}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--pn-text)" }}>
                          {editing ? form.title || "New announcement" : selected?.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        {!editing && selected && (
                          <>
                            <button
                              onClick={() => {
                                setForm(toForm(selected));
                                setEditing(true);
                              }}
                              className="px-3 py-2 rounded-lg text-sm font-semibold border"
                              style={{
                                background: "var(--pn-surface-2)",
                                border: "1px solid var(--pn-border)",
                                color: "var(--pn-text)",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (!confirm("Delete this announcement?")) return;
                                removeMut.mutate();
                              }}
                              className="w-9 h-9 rounded-lg flex items-center justify-center border"
                              style={{
                                background: "var(--pn-surface-2)",
                                border: "1px solid var(--pn-border)",
                                color: "var(--pn-critical-text)",
                              }}
                            >
                              {removeMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </>
                        )}
                        {editing && (
                          <>
                            <button
                              onClick={() => {
                                setEditing(false);
                                if (selected) setForm(toForm(selected));
                                else { setSelectedId(null); setForm(EMPTY_FORM); }
                              }}
                              className="px-3 py-2 rounded-lg text-sm font-semibold border"
                              style={{
                                background: "var(--pn-surface-2)",
                                border: "1px solid var(--pn-border)",
                                color: "var(--pn-text)",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (!form.title.trim() || !form.body.trim()) {
                                  setNotice("Title and message are required");
                                  window.setTimeout(() => setNotice(""), 2200);
                                  return;
                                }
                                saveMut.mutate();
                              }}
                              disabled={saveMut.isPending}
                              className="px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                              style={{ background: "var(--pn-primary)", color: "#fff" }}
                            >
                              {saveMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                              Save
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Publish controls work in both modes */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap" style={{ borderColor: "var(--pn-border)" }}>
                      <button
                        onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border"
                        style={
                          form.published
                            ? { background: "var(--pn-success-bg)", color: "var(--pn-success-fg)", border: "1px solid var(--pn-success-line)" }
                            : { background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }
                        }
                      >
                        {form.published ? <Eye size={13} /> : <EyeOff size={13} />}
                        {form.published ? "Published" : "Unpublished"}
                      </button>
                      <button
                        onClick={() => setForm((f) => ({ ...f, showAsModal: !f.showAsModal }))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border"
                        style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}
                      >
                        <Sparkles size={13} />
                        {form.showAsModal ? "Popup on load" : "Feed only"}
                      </button>
                      <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--pn-text-2)" }}>
                        <input
                          type="checkbox"
                          checked={form.dismissible}
                          onChange={(e) => setForm((f) => ({ ...f, dismissible: e.target.checked }))}
                          className="w-3.5 h-3.5 rounded"
                        />
                        Can be dismissed
                      </label>
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-[11px]" style={{ color: "var(--pn-text-3)" }}>Priority</span>
                        <input
                          type="number"
                          value={form.priority}
                          onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                          className="w-16 rounded-lg px-2 py-1 text-xs text-center"
                          style={inpStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body / editor */}
                <div
                  className="rounded-xl border p-4 sm:p-5"
                  style={{ background: "var(--pn-surface)", borderColor: "var(--pn-border)" }}
                >
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                          Title
                        </label>
                        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                          className={inputCls} style={inpStyle} placeholder="Flash sale — 30% off everything" />
                      </div>

                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                          Message
                        </label>
                        <textarea
                          value={form.body}
                          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                          rows={5}
                          className={`${inputCls} resize-y leading-relaxed`}
                          style={inpStyle}
                          placeholder="Tell customers what's happening…"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                            Badge
                          </label>
                          <input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                            className={inputCls} style={inpStyle} placeholder="SALE / NEW / MAINTENANCE" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                            Promo code (optional)
                          </label>
                            <input
                              value={form.promoCode}
                              onChange={(e) => setForm((f) => ({ ...f, promoCode: e.target.value.toUpperCase() }))}
                              className={`${inputCls} font-mono`}
                              style={inpStyle}
                              placeholder="LAUNCH20"
                            />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                            Button label
                          </label>
                          <input value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                            className={inputCls} style={inpStyle} placeholder="Shop the sale" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                            Button link
                          </label>
                          <input value={form.ctaUrl} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                            className={inputCls} style={inpStyle} placeholder="/game/grow-a-garden-2" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                          Art image URL (optional)
                        </label>
                        <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                          className={inputCls} style={inpStyle} placeholder="https://… (blank = branded pattern)" />
                      </div>

                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                          Colour theme
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {THEME_KEYS.map((k) => (
                            <button
                              key={k}
                              onClick={() => setForm((f) => ({ ...f, theme: k }))}
                              className="w-9 h-9 rounded-lg flex items-center justify-center border transition-transform"
                              style={{
                                background: THEMES[k].bg,
                                border: form.theme === k ? "2px solid var(--pn-text)" : "1px solid var(--pn-border)",
                              }}
                              title={THEMES[k].label}
                            >
                              {form.theme === k && <Check size={15} color="#fff" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                            Starts
                          </label>
                          <input type="datetime-local" value={form.startsAt}
                            onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                            className={inputCls} style={inpStyle} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
                            Ends
                          </label>
                          <input type="datetime-local" value={form.endsAt}
                            onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                            className={inputCls} style={inpStyle} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ color: "var(--pn-text-2)" }}
                    >
                      {selected?.body}
                    </p>
                  )}
                </div>

                <PopupPreview a={form} />

                {selected?.published && selected?.promoCode && (
                  <div
                    className="rounded-xl border p-3 flex items-center gap-2 text-xs"
                    style={{ background: "var(--pn-surface)", borderColor: "var(--pn-border)" }}
                  >
                    <Ticket size={14} style={{ color: "var(--pn-text-3)" }} />
                    <span style={{ color: "var(--pn-text-2)" }}>Promo code shown in the popup:</span>
                    <code className="font-mono font-bold" style={{ color: "var(--pn-text)" }}>
                      {selected.promoCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(selected.promoCode || "");
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1500);
                      }}
                      className="ml-auto p-1 rounded"
                      style={{ color: copied ? "var(--pn-success-fg)" : "var(--pn-text-3)" }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <BroadcastTab />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Email broadcast tab                                                 */
/* ------------------------------------------------------------------ */

function BroadcastTab() {
  const qc = useQueryClient();
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [confirming, setConfirming] = useState(false);

  const countQuery = useQuery({
    queryKey: ["announce-audience", audience],
    queryFn: () => adminApi.announcements.audienceCount(audience),
  });
  const historyQuery = useQuery({
    queryKey: ["announce-broadcasts"],
    queryFn: () => adminApi.announcements.broadcasts(),
    // Poll while something is still going out so the progress bars move.
    refetchInterval: (q) =>
      (q.state.data?.data?.broadcasts || []).some((b: EmailBroadcast) =>
        b.status === "sending" || b.status === "queued"
      )
        ? 4000
        : false,
  });
  const history: EmailBroadcast[] = historyQuery.data?.data?.broadcasts || [];
  const recipients = countQuery.data?.data?.count ?? 0;

  const sendMut = useMutation({
    mutationFn: () =>
      adminApi.announcements.sendBroadcast({
        subject: subject.trim(),
        body: body.trim(),
        audience,
        promoCode: promoCode.trim().toUpperCase() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
      }),
    onSuccess: () => {
      setConfirming(false);
      setSubject("");
      setBody("");
      setPromoCode("");
      setCtaLabel("");
      setCtaUrl("");
      qc.invalidateQueries({ queryKey: ["announce-broadcasts"] });
    },
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => adminApi.announcements.cancelBroadcast(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announce-broadcasts"] }),
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* ── Composer ─────────────────────────────── */}
      <div
        className="rounded-xl border p-5 space-y-4 min-w-0"
        style={{ background: "var(--pn-surface)", borderColor: "var(--pn-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--pn-surface-2)" }}>
            <Mail size={17} style={{ color: "var(--pn-text)" }} />
          </span>
          <div>
            <h2 className="font-bold" style={{ color: "var(--pn-text)" }}>Send to everyone</h2>
            <p className="text-xs" style={{ color: "var(--pn-text-3)" }}>
              Goes to every registered account in the selected audience.
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold leading-none" style={{ color: "var(--pn-text)" }}>
              {recipients.toLocaleString()}
            </p>
            <p className="text-[11px]" style={{ color: "var(--pn-text-3)" }}>recipients</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>
            Audience
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {AUDIENCES.map((a) => (
              <button
                key={a.key}
                onClick={() => setAudience(a.key)}
                className="text-left px-3 py-2.5 rounded-lg border transition-colors"
                style={{
                  background: audience === a.key ? "var(--pn-action-tint)" : "var(--pn-surface-2)",
                  border: `1px solid ${audience === a.key ? "var(--pn-action-border)" : "var(--pn-border)"}`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Users size={12} style={{ color: audience === a.key ? "var(--pn-action)" : "var(--pn-text-3)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--pn-text)" }}>{a.label}</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--pn-text-3)" }}>{a.blurb}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} style={inpStyle}
            placeholder="25% off everything this weekend 🎉" />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
            className={`${inputCls} resize-y leading-relaxed`} style={inpStyle}
            placeholder={'Hey there!\n\nWe just dropped a weekend sale…\n\nUse the code below at checkout.'} />
          <p className="text-[11px] mt-1" style={{ color: "var(--pn-text-3)" }}>
            Blank lines start a new paragraph.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>Promo code</label>
            <input value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className={`${inputCls} font-mono`} style={inpStyle} placeholder="WEEKEND25" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>Button label</label>
            <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputCls}
              style={inpStyle} placeholder="Shop now" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--pn-text-2)" }}>Button link</label>
            <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={inputCls}
              style={inpStyle} placeholder="/products" />
          </div>
        </div>

        {/* Email preview */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--pn-border)" }}>
          <div className="px-3 py-2 text-[11px] font-semibold border-b"
            style={{ borderColor: "var(--pn-border)", background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>
            Email preview
          </div>
          <div className="p-3" style={{ background: "var(--pn-bg)" }}>
            <div className="max-w-[420px] mx-auto rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #e3e3e3" }}>
              <div style={{ background: "#131313", padding: "12px 18px" }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>RBstars</span>
              </div>
              <div style={{ padding: "18px" }}>
                <p style={{ margin: 0, color: "#131313", fontWeight: 800, fontSize: 15 }}>
                  {subject || "Your subject line"}
                </p>
                {(body || "Your message will appear here.")
                  .split(/\n{2,}/)
                  .map((chunk, i) => (
                    <p key={i} style={{ margin: "12px 0 0", color: "#303030", fontSize: 13, lineHeight: 1.6 }}>
                      {chunk.replace(/\n/g, " ")}
                    </p>
                  ))}
                {promoCode && (
                  <div style={{ marginTop: 16, textAlign: "center" }}>
                    <span style={{ display: "inline-block", background: "#005bd3", color: "#fff", fontFamily: "monospace",
                      fontWeight: 700, fontSize: 15, padding: "9px 20px", borderRadius: 6 }}>
                      {promoCode}
                    </span>
                  </div>
                )}
                {ctaLabel && (
                  <div style={{ marginTop: 16 }}>
                    <span style={{ display: "inline-block", background: "#303030", color: "#fff", fontWeight: 600,
                      fontSize: 13, padding: "10px 22px", borderRadius: 6 }}>
                      {ctaLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {confirming && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="rounded-lg p-3 text-sm flex items-start gap-2.5"
              style={{ background: "var(--pn-warning-bg)", border: "1px solid var(--pn-warning-line)" }}
            >
              <Ban size={16} style={{ color: "var(--pn-warning-fg)" }} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold" style={{ color: "var(--pn-warning-fg)" }}>
                  Send this to {recipients.toLocaleString()} people?
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--pn-text-2)" }}>
                  This can&apos;t be unsent. Cancellable while it&apos;s still going out.
                </p>
              </div>
              <div className="ml-auto flex gap-2 shrink-0">
                <button onClick={() => setConfirming(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                  No
                </button>
                <button
                  onClick={() => sendMut.mutate()}
                  disabled={sendMut.isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--pn-critical)" }}
                >
                  {sendMut.isPending ? "Sending…" : "Send now"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {sendMut.isError && (
          <p className="text-xs" style={{ color: "var(--pn-critical-text)" }}>{(sendMut.error as Error)?.message}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setConfirming(true)}
            disabled={!subject.trim() || !body.trim() || recipients === 0 || sendMut.isPending}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-40"
            style={{ background: "var(--pn-primary)" }}
          >
            {sendMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {sendMut.isPending ? "Queuing…" : "Review & send"}
          </button>
          <button
            onClick={() => { setSubject(""); setBody(""); setPromoCode(""); setCtaLabel(""); setCtaUrl(""); }}
            className="px-3 py-2.5 rounded-lg text-sm font-semibold border"
            style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Send history ──────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden flex flex-col"
        style={{ background: "var(--pn-surface)", borderColor: "var(--pn-border)" }}
      >
        <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: "var(--pn-border)" }}>
          <Radio size={14} style={{ color: "var(--pn-text-2)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>Send history</span>
          {history.some((b) => b.status === "sending") && (
            <button onClick={() => historyQuery.refetch()} className="ml-auto p-1 rounded" style={{ color: "var(--pn-text-3)" }}>
              <RefreshCw size={14} className="animate-spin" />
            </button>
          )}
        </div>

        <div className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
          {historyQuery.isLoading ? (
            <div className="p-2 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : historyQuery.isError ? (
            <div className="p-4 text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--pn-critical-text)" }}>
                Couldn&apos;t load history
              </p>
              <button onClick={() => historyQuery.refetch()} className="mt-2 text-xs" style={{ color: "var(--pn-action)" }}>
                Retry
              </button>
            </div>
          ) : history.length === 0 ? (
            <EmptyState icon={Mail} title="Nothing sent yet" body="Your broadcast history will show up here." />
          ) : (
            history.map((b) => {
              const pct = b.recipients > 0 ? Math.round(((b.sent + b.failed) / b.recipients) * 100) : 0;
              const tone =
                b.status === "sent" ? "success" : b.status === "cancelled" ? "neutral" : "warning";
              return (
                <div key={String(b._id)} className="p-3 rounded-lg" style={{ background: "var(--pn-surface-2)" }}>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--pn-text)" }}>{b.subject}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--pn-text-3)" }}>
                        {AUDIENCES.find((a) => a.key === b.audience)?.label || b.audience} · {relative(b.createdAt)}
                      </p>
                    </div>
                    <Badge tone={tone}>{b.status}</Badge>
                  </div>

                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pn-surface)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: b.failed > 0 ? "var(--pn-warning-fg)" : "var(--pn-success-fg)",
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: "var(--pn-text-3)" }}>
                    <span>{b.sent} sent</span>
                    {b.failed > 0 && <span style={{ color: "var(--pn-critical-text)" }}>{b.failed} failed</span>}
                    <span>of {b.recipients}</span>
                    {b.promoCode && <span className="font-mono">{b.promoCode}</span>}
                    {(b.status === "sending" || b.status === "queued") && (
                      <button
                        onClick={() => cancelMut.mutate(String(b._id))}
                        className="ml-auto font-semibold"
                        style={{ color: "var(--pn-critical-text)" }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  {!!b.lastError && (
                    <p className="text-[10px] mt-1 truncate" style={{ color: "var(--pn-critical-text)" }} title={b.lastError}>
                      {b.lastError}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}