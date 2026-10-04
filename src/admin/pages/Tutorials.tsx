import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Pencil, Trash2, X, Loader2, GripVertical, Eye, EyeOff, Video } from "lucide-react";
import { adminApi } from "../api";
import type { Tutorial } from "../types";
import { PageHeader } from "../components/kit";

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

export default function Tutorials() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Tutorial | null>(null);
  const [form, setForm] = useState({ game: "", title: "", description: "", videoUrl: "", thumbnailUrl: "", gradientFrom: "#3BA7FF", gradientTo: "#131C23", sortOrder: "0" });
  const [formError, setFormError] = useState("");
  const [thumbPreviewError, setThumbPreviewError] = useState(false);

  const autoThumb = getYouTubeThumbnail(form.videoUrl);
  const effectiveThumb = form.thumbnailUrl || autoThumb || null;

  const { data, isLoading } = useQuery({
    queryKey: ["panel-tutorials"],
    queryFn: () => adminApi.tutorials.list(),
  });

  const createMut = useMutation({
    mutationFn: adminApi.tutorials.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["panel-tutorials"] }); closeForm(); },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tutorial> }) =>
      adminApi.tutorials.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["panel-tutorials"] }); closeForm(); },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: adminApi.tutorials.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-tutorials"] }),
    onError: (err: Error) => alert(err.message),
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.tutorials.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-tutorials"] }),
  });

  const tutorials: Tutorial[] = data?.data?.tutorials || [];

  const openCreate = () => {
    setEditItem(null);
    setForm({ game: "", title: "", description: "", videoUrl: "", thumbnailUrl: "", gradientFrom: "#3BA7FF", gradientTo: "#131C23", sortOrder: String(tutorials.length) });
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (t: Tutorial) => {
    setEditItem(t);
    setForm({
      game: t.game,
      title: t.title,
      description: t.description || "",
      videoUrl: t.videoUrl || "",
      thumbnailUrl: t.thumbnailUrl || "",
      gradientFrom: t.gradient?.from || "#3BA7FF",
      gradientTo: t.gradient?.to || "#131C23",
      sortOrder: String(t.sortOrder || 0),
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.game || !form.title) { setFormError("Game and title are required"); return; }
    const payload = {
      game: form.game.trim(),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      thumbnailUrl: form.thumbnailUrl.trim() || getYouTubeThumbnail(form.videoUrl) || undefined,
      gradient: { from: form.gradientFrom, to: form.gradientTo },
      sortOrder: parseInt(form.sortOrder) || 0,
    };
    if (editItem) {
      updateMut.mutate({ id: editItem._id, data: payload });
    } else {
      createMut.mutate(payload as any);
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  const gameGroups: Record<string, Tutorial[]> = {};
  tutorials.forEach((t) => {
    if (!gameGroups[t.game]) gameGroups[t.game] = [];
    gameGroups[t.game].push(t);
  });

  return (
    <div className="p-6 space-y-5 max-w-[1000px] mx-auto">
      <PageHeader title="Tutorials" description="Manage game tutorials shown on the homepage" icon={BookOpen}>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--pn-primary)" }}
        >
          <Plus className="w-4 h-4" />
          Add Tutorial
        </motion.button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }} />
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="text-center py-16 bg-[var(--pn-surface)] rounded-xl" style={{ border: "1px solid var(--pn-border)" }}>
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-[var(--pn-text-3)]" />
          <p className="text-[var(--pn-text-3)]">No tutorials yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(gameGroups).map(([game, items]) => (
            <div key={game}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pn-text-3)] mb-2 px-1">{game}</h3>
              <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
                {items.map((t, i) => (
                  <div
                    key={t._id}
                    className="flex items-center gap-4 p-4 transition-colors"
                    style={{ borderBottom: i < items.length - 1 ? "1px solid var(--pn-border)" : "none", opacity: t.active ? 1 : 0.5 }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden"
                      style={t.thumbnailUrl ? undefined : { background: `linear-gradient(135deg,${t.gradient?.from},${t.gradient?.to})` }}
                    >
                      {t.thumbnailUrl ? (
                        <img src={t.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-[var(--pn-text)]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--pn-text)" }}>{t.title}</p>
                      {t.description && <p className="text-xs text-[var(--pn-text-3)] truncate mt-0.5">{t.description}</p>}
                      {t.videoUrl && <p className="text-xs text-[var(--pn-action)] truncate mt-0.5 flex items-center gap-1"><Video className="w-3 h-3 flex-shrink-0" /><span className="truncate">{t.videoUrl}</span></p>}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActiveMut.mutate({ id: t._id, active: !t.active })}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: t.active ? "var(--pn-success-bg)" : "var(--pn-surface-2)", color: t.active ? "var(--pn-success-fg)" : "var(--pn-text-3)" }}
                        title={t.active ? "Hide" : "Show"}
                      >
                        {t.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${t.title}"?`)) {
                            deleteMut.mutate(t._id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: "var(--pn-critical-bg)", color: "var(--pn-critical-text)" }}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={closeForm}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="pn-modal w-full max-w-lg overflow-hidden"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                <h3 className="font-bold text-lg" style={{ color: "var(--pn-text)" }}>
                  {editItem ? "Edit Tutorial" : "Add Tutorial"}
                </h3>
                <button onClick={closeForm} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Game *</label>
                    <input
                      value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} required
                      placeholder="Blox Fruits"
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Sort Order</label>
                    <input
                      type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Title *</label>
                  <input
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                    placeholder="How to claim Blox Fruits items"
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Description</label>
                  <textarea
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2} placeholder="Brief description of this tutorial"
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)] resize-none"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Video URL</label>
                  <input
                    value={form.videoUrl}
                    onChange={(e) => {
                      setThumbPreviewError(false);
                      setForm({ ...form, videoUrl: e.target.value });
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                  />
                  {autoThumb && !thumbPreviewError && (
                    <div className="mt-2 rounded-xl overflow-hidden relative" style={{ aspectRatio: "16/9", border: "1px solid var(--pn-border)" }}>
                      <img
                        src={autoThumb}
                        alt="YouTube thumbnail"
                        className="w-full h-full object-cover"
                        onError={() => setThumbPreviewError(true)}
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
                        Auto-detected thumbnail
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>
                    Thumbnail URL
                    {autoThumb && !form.thumbnailUrl && (
                      <span className="ml-2 text-xs font-normal text-[var(--pn-success-fg)]">auto-filled from YouTube</span>
                    )}
                  </label>
                  <input
                    value={form.thumbnailUrl}
                    onChange={(e) => { setThumbPreviewError(false); setForm({ ...form, thumbnailUrl: e.target.value }); }}
                    placeholder={autoThumb ? autoThumb : "https://... (leave blank to use YouTube thumbnail)"}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                  />
                  {effectiveThumb && form.thumbnailUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", border: "1px solid var(--pn-border)" }}>
                      <img src={effectiveThumb} alt="Thumbnail preview" className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Card Gradient</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-xs text-[var(--pn-text-3)]">From</label>
                      <input type="color" value={form.gradientFrom} onChange={(e) => setForm({ ...form, gradientFrom: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0" style={{ background: "none" }} />
                      <span className="text-xs text-[var(--pn-text-3)]">{form.gradientFrom}</span>
                    </div>
                    <div
                      className="flex-1 h-8 rounded-lg"
                      style={{ background: `linear-gradient(135deg,${form.gradientFrom},${form.gradientTo})` }}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-xs text-[var(--pn-text-3)]">To</label>
                      <input type="color" value={form.gradientTo} onChange={(e) => setForm({ ...form, gradientTo: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0" style={{ background: "none" }} />
                      <span className="text-xs text-[var(--pn-text-3)]">{form.gradientTo}</span>
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="text-sm rounded-xl px-4 py-3" style={{ background: "var(--pn-critical-bg)", border: "1px solid var(--pn-critical-line)", color: "var(--pn-critical-text)" }}>
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeForm}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={isPending}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "var(--pn-primary)" }}>
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editItem ? "Save Changes" : "Create Tutorial"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
