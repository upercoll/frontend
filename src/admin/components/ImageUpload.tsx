import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | string[];
  onChange: (urls: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  folder?: string;
  label?: string;
  /** small line under the label, e.g. the exact size the image renders at */
  hint?: string;
  /** return an error string (or a promise of one) to reject a file before it
      is uploaded — used to enforce the exact size a slot renders at */
  validate?: (file: File) => string | null | Promise<string | null>;
  className?: string;
  light?: boolean;
}

/* Safety net for URLs returned by the upload API: collapse any accidental
   double slash after the host (never touches the protocol's `://`). The
   backend normalizes too — this just means an upload can't come back as a
   broken preview even if the API is running an older build. */
const fixUrl = (u: string) => u.replace(/([^:])\/\//g, "$1/");

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  folder = "rbstars/uploads",
  label = "Upload Image",
  hint,
  validate,
  className,
  light = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  /* URLs whose preview failed to load in this browser. A stored URL that 404s
     (the old double-slash R2 bug) used to look like a successful upload with
     a silent broken-image cross — now it gets a loud, explicit warning. */
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "";
  const token = localStorage.getItem("panel_token");

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      if (validate) {
        const results = await Promise.all(files.map((f) => validate(f)));
        const bad = results.find(Boolean);
        if (bad) { setUploadError(bad); return; }
      }
      if (multiple) {
        const form = new FormData();
        files.forEach((f) => form.append("files", f));
        const res = await fetch(`${apiUrl}/api/panel/upload/multiple?folder=${folder}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        let data: any = {};
        try { data = await res.json(); } catch {}
        if (!res.ok) throw new Error(data.message || data.detail || `Server error ${res.status}`);
        /* NB: do not name this `files` — that shadowed the `files` parameter a
           few lines above (`files.forEach`), which is a temporal dead zone and
           threw "Cannot access 'files' before initialization" (minified: 'H')
           on every multi-image / gallery upload. */
        const uploaded = data?.data?.files;
        if (!Array.isArray(uploaded) || !uploaded.length) throw new Error("Upload succeeded but the server returned no image URLs");
        const urls = uploaded.map((f: { url: string }) => fixUrl(f.url));
        const existing = Array.isArray(value) ? value : [];
        onChange([...existing, ...urls].slice(0, maxFiles));
      } else {
        const form = new FormData();
        form.append("file", files[0]);
        const res = await fetch(`${apiUrl}/api/panel/upload/single?folder=${folder}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        let data: any = {};
        try { data = await res.json(); } catch {}
        if (!res.ok) throw new Error(data.message || data.detail || `Server error ${res.status}`);
        const raw = data?.data?.url;
        if (!raw || typeof raw !== "string") throw new Error("Upload succeeded but the server returned no image URL");
        onChange(fixUrl(raw));
      }
    } catch (err: any) {
      const msg = err?.message && err.message !== "undefined" ? err.message : "Upload failed — please try again";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }, [value, onChange, multiple, maxFiles, folder, apiUrl, token, validate]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    uploadFiles(files);
  };

  const removeImage = (urlToRemove: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((u) => u !== urlToRemove));
    } else {
      onChange("");
    }
  };

  const images = multiple ? (Array.isArray(value) ? value : []) : value ? [value as string] : [];

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className={cn("text-sm font-medium", light ? "text-[var(--pn-text-2)]" : "text-[var(--pn-text-3)]")}>{label}</p>}
      {hint && <p className="text-xs text-[var(--pn-text-3)] leading-relaxed -mt-1">{hint}</p>}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
          light
            ? dragOver ? "border-indigo-400 bg-indigo-50" : "border-[var(--pn-border)] hover:border-indigo-300 bg-[var(--pn-surface-2)]"
            : dragOver ? "border-[var(--pn-action-border)] bg-[var(--pn-action-tint)]" : "border-[var(--pn-border)] hover:border-[var(--pn-border)] bg-[var(--pn-surface-2)]",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className={cn("w-6 h-6 animate-spin", light ? "text-[var(--pn-action)]" : "text-[var(--pn-action)]")} />
            <p className={cn("text-sm", light ? "text-[var(--pn-text-2)]" : "text-[var(--pn-text-3)]")}>Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", light ? "bg-indigo-50" : "bg-[var(--pn-action-tint)]")}>
              <Upload className={cn("w-4 h-4", light ? "text-[var(--pn-action)]" : "text-[var(--pn-action)]")} />
            </div>
            <div>
              <p className={cn("text-sm font-medium", light ? "text-[var(--pn-text-2)]" : "text-[var(--pn-text-3)]")}>
                Drop {multiple ? "images" : "an image"} here, or click to browse
              </p>
              <p className={cn("text-xs mt-0.5", light ? "text-[var(--pn-text-3)]" : "text-[var(--pn-text-2)]")}>PNG, JPG, WebP up to 10MB{multiple ? ` (max ${maxFiles})` : ""}</p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className={cn(
          "flex items-start gap-2 text-xs px-3 py-2 rounded-lg",
          light
            ? "bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] text-[var(--pn-critical-text)]"
            : "bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] text-[var(--pn-critical-text)]"
        )}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          uploadFiles(files);
          e.target.value = "";
        }}
      />

      {images.length > 0 && (
        <div className={cn("grid gap-3", multiple ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5" : "grid-cols-2")}>
          <AnimatePresence>
            {images.map((url, i) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "relative group aspect-square rounded-lg overflow-hidden border",
                  broken[url] ? "border-[var(--pn-critical-line)]" : "border-[var(--pn-border)]"
                )}
              >
                <img
                  src={url}
                  className="w-full h-full object-cover"
                  alt={`Upload ${i + 1}`}
                  onError={() => setBroken(b => ({ ...b, [url]: true }))}
                  onLoad={() => setBroken(b => (b[url] ? { ...b, [url]: false } : b))}
                />
                {broken[url] && (
                  <span className="absolute left-1.5 bottom-1.5 right-1.5 text-[10px] leading-tight font-semibold px-1.5 py-1 rounded bg-[var(--pn-critical-bg)] text-[var(--pn-critical-text)] border border-[var(--pn-critical-line)]">
                    Failed to load — re-upload
                  </span>
                )}
                {/* Hover action bar. NOT .pn-scrim: that class is a fixed,
                    full-viewport dialog layer, which made this look like a
                    stray red cross floating over the page. Local overlay,
                    neutral control — removing an image should never look
                    like an error. */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(url); }}
                    aria-label={`Remove image ${i + 1}`}
                    title="Remove image"
                    className="h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-black/70"
                    style={{ background: "rgba(15,23,42,0.82)", border: "1px solid rgba(255,255,255,0.28)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {Object.values(broken).some(Boolean) && (
        <div className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] text-[var(--pn-critical-text)]">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>One or more images failed to load — the link is broken. Re-upload them before saving, otherwise the product saves with a dead image.</span>
        </div>
      )}
    </div>
  );
}
