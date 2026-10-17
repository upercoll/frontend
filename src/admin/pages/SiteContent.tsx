import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Save, RotateCcw, Edit2, Check, X, Loader2, PenSquare, ChevronDown, ChevronUp } from "lucide-react";
import { adminApi } from "../api";
import type { SiteContentItem } from "../types";
import { PageHeader, EmptyState } from "../components/kit";
import ImageUpload from "../components/ImageUpload";

/* The promo banner renders fluid-width at a fixed 188px tall (176px on
   mobile), so its artwork has to be wide. Rather than ship a badly cropped
   banner, reject anything outside this range before it uploads. */
const BANNER_HINT =
  "Recommended 1600 × 320 px (5:1). The banner renders full-width at 188 px tall and crops to cover, so keep text and the subject centred. Minimum 1000 × 200 px.";

const readDims = (file: File) =>
  new Promise<{ w: number; h: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });

async function validateBannerImage(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return "That file isn't an image.";
  const d = await readDims(file);
  if (!d) return "Couldn't read that image — try a PNG, JPG or WebP.";
  if (d.w < 1000 || d.h < 200) return `Too small (${d.w} × ${d.h} px). Minimum is 1000 × 200 px.`;
  const ratio = d.w / d.h;
  if (ratio < 3 || ratio > 9) {
    return `Wrong shape (${d.w} × ${d.h} px is ${ratio.toFixed(2)}:1). The banner is wide — aim for 5:1, e.g. 1600 × 320 px.`;
  }
  return null;
}

interface EditState {
  key: string;
  value: unknown;
  original: unknown;
}

export default function SiteContent() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<string, EditState>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ hero: true });

  const { data, isLoading } = useQuery({
    queryKey: ["panel-site-content"],
    queryFn: adminApi.siteContent.getAll,
  });

  const content = data?.data.content || {};

  const startEdit = (item: SiteContentItem) => {
    setEditing((prev) => ({ ...prev, [item.key]: { key: item.key, value: item.value, original: item.value } }));
  };

  const cancelEdit = (key: string) => {
    setEditing((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const saveEdit = async (key: string) => {
    const editData = editing[key];
    if (!editData) return;
    setSaving(key);
    try {
      await adminApi.siteContent.update(key, editData.value);
      qc.invalidateQueries({ queryKey: ["panel-site-content"] });
      cancelEdit(key);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const resetItem = async (key: string) => {
    if (!confirm("Reset this item to its default value?")) return;
    try {
      await adminApi.siteContent.reset(key);
      qc.invalidateQueries({ queryKey: ["panel-site-content"] });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reset");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const renderEditor = (item: SiteContentItem) => {
    const edit = editing[item.key];
    const currentValue = edit ? edit.value : item.value;

    if (item.type === "boolean") {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!edit) startEdit(item);
              setEditing((prev) => ({ ...prev, [item.key]: { ...prev[item.key], key: item.key, value: !currentValue, original: item.value } }));
            }}
            className={`relative w-10 h-5 rounded-full transition-all ${currentValue ? "bg-[var(--pn-primary)]" : "bg-[var(--pn-surface-2)]"}`}
          >
            <motion.span animate={{ x: currentValue ? 20 : 2 }} className="absolute top-0.5 w-4 h-4 bg-[var(--pn-surface)] rounded-full shadow" />
          </button>
          <span className="text-[var(--pn-text-3)] text-sm">{currentValue ? "Enabled" : "Disabled"}</span>
          {edit && (
            <div className="flex gap-2 ml-2">
              <button onClick={() => saveEdit(item.key)} disabled={saving === item.key}
                className="flex items-center gap-1 px-2.5 py-1 bg-[var(--pn-primary)] hover:bg-[var(--pn-primary-hover)] text-white rounded-lg text-xs transition-colors">
                {saving === item.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
              <button onClick={() => cancelEdit(item.key)} className="px-2.5 py-1 bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] rounded-lg text-xs transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );
    }

    if (item.type === "color") {
      return (
        <div className="flex items-center gap-3">
          <input type="color" value={String(currentValue || "#000000")}
            onChange={(e) => {
              if (!edit) startEdit(item);
              setEditing((prev) => ({ ...prev, [item.key]: { key: item.key, value: e.target.value, original: item.value } }));
            }}
            className="w-10 h-10 rounded-lg border border-[var(--pn-border)] cursor-pointer" />
          <span className="text-[var(--pn-text-3)] text-sm font-mono">{String(currentValue)}</span>
          {edit && (
            <div className="flex gap-2">
              <button onClick={() => saveEdit(item.key)} disabled={saving === item.key}
                className="flex items-center gap-1 px-2.5 py-1 bg-[var(--pn-primary)] text-white rounded-lg text-xs">
                {saving === item.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
              <button onClick={() => cancelEdit(item.key)} className="px-2.5 py-1 bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] rounded-lg text-xs">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );
    }

    if (item.type === "image") {
      // Banner slot: uploads straight to R2 and stores the URL as this value.
      // A blank value falls back to the built-in gradient + game art on the site.
      const isBanner = item.key.startsWith("banner_");
      return (
        <div className="space-y-2">
          <ImageUpload
            label=""
            value={String(currentValue ?? "")}
            folder="rbstars/banners"
            hint={isBanner ? BANNER_HINT : undefined}
            validate={isBanner ? validateBannerImage : undefined}
            onChange={(url) => {
              if (!edit) startEdit(item);
              setEditing((prev) => ({ ...prev, [item.key]: { ...prev[item.key], key: item.key, value: url, original: item.value } }));
            }}
          />
          {isBanner && (
            <p className="text-xs text-[var(--pn-text-3)] leading-relaxed">
              Leave empty to keep the default banner art. Files under 1000 × 200 px, or a
              ratio outside 3:1–9:1, are rejected so the banner never crops badly.
            </p>
          )}
          {edit && (
            <div className="flex gap-2">
              <button onClick={() => saveEdit(item.key)} disabled={saving === item.key}
                className="flex items-center gap-1 px-2.5 py-1 bg-[var(--pn-primary)] text-white rounded-lg text-xs">
                {saving === item.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
              <button onClick={() => cancelEdit(item.key)} className="px-2.5 py-1 bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] rounded-lg text-xs">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {edit ? (
          <>
            {item.type === "richtext" ? (
              <textarea
                value={String(edit.value || "")}
                onChange={(e) => setEditing((prev) => ({ ...prev, [item.key]: { ...prev[item.key], value: e.target.value } }))}
                rows={4}
                className="w-full bg-[var(--pn-surface)] border border-[var(--pn-action-border)] text-[var(--pn-text)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--pn-action-border)] resize-none"
                autoFocus
              />
            ) : (
              <input
                value={String(edit.value || "")}
                onChange={(e) => setEditing((prev) => ({ ...prev, [item.key]: { ...prev[item.key], value: e.target.value } }))}
                className="w-full bg-[var(--pn-surface)] border border-[var(--pn-action-border)] text-[var(--pn-text)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                autoFocus
              />
            )}
            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => saveEdit(item.key)} disabled={saving === item.key}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pn-primary)] hover:bg-[var(--pn-primary-hover)] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-60">
                {saving === item.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </motion.button>
              <button onClick={() => cancelEdit(item.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] hover:text-[var(--pn-text)] rounded-lg text-xs transition-colors">
                <X className="w-3 h-3" />
                Cancel
              </button>
              {item.defaultValue !== undefined && (
                <button onClick={() => resetItem(item.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] hover:text-[var(--pn-text-3)] rounded-lg text-xs transition-colors ml-auto">
                  <RotateCcw className="w-3 h-3" /> Reset to default
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-start justify-between gap-3 group">
            <p className="text-[var(--pn-text-3)] text-sm leading-relaxed flex-1">{String(currentValue || "")} </p>
            <button onClick={() => startEdit(item)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text)] transition-all">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const sections = Object.keys(content);
  const sectionLabels: Record<string, string> = {
    hero: "Hero Section",
    navigation: "Navigation",
    features: "Features Section",
    banners: "Promo Banners",
    footer: "Footer",
    loader: "Loading Screen",
    seo: "SEO & Meta",
  };

  return (
    <div className="p-6 space-y-4 max-w-[1000px] mx-auto">
      <PageHeader title="Site Content" description="Edit the text and content displayed on your storefront. Click any item to edit, then save." icon={PenSquare} />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-[var(--pn-surface)] rounded-xl border border-[var(--pn-border)] animate-pulse" />)}
        </div>
      ) : sections.length === 0 ? (
        <EmptyState icon={PenSquare} title="No content items found." />
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const items: SiteContentItem[] = content[section];
            const isExpanded = expandedSections[section] !== false;

            return (
              <div key={section} className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl overflow-hidden">
                <button onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--pn-surface-2)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--pn-action-tint)] flex items-center justify-center">
                      <PenSquare className="w-4 h-4 text-[var(--pn-action)]" />
                    </div>
                    <div className="text-left">
                      <p className="text-[var(--pn-text)] font-medium">{sectionLabels[section] || section.charAt(0).toUpperCase() + section.slice(1)}</p>
                      <p className="text-[var(--pn-text-2)] text-xs">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--pn-text-2)]" /> : <ChevronDown className="w-4 h-4 text-[var(--pn-text-2)]" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="border-t border-[var(--pn-border)] divide-y divide-[var(--pn-divider)]">
                        {items.map((item) => (
                          <div key={item._id} className="px-5 py-4 hover:bg-[var(--pn-surface-2)] transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[var(--pn-text-3)] text-sm font-medium">{item.label}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] font-mono">{item.type}</span>
                              {item.lastEditedBy && (
                                <span className="text-[10px] text-[var(--pn-text-2)] ml-auto">Edited by {item.lastEditedBy}</span>
                              )}
                            </div>
                            {renderEditor(item)}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
