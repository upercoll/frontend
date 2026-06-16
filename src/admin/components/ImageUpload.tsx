import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | string[];
  onChange: (urls: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  folder?: string;
  label?: string;
  className?: string;
  light?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  folder = "rbstars/uploads",
  label = "Upload Image",
  className,
  light = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "";
  const token = localStorage.getItem("panel_token");

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
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
        const urls = data.data.files.map((f: { url: string }) => f.url);
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
        onChange(data.data.url);
      }
    } catch (err: any) {
      const msg = err?.message && err.message !== "undefined" ? err.message : "Upload failed — please try again";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }, [value, onChange, multiple, maxFiles, folder, apiUrl, token]);

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
      {label && <p className={cn("text-sm font-medium", light ? "text-slate-600" : "text-slate-300")}>{label}</p>}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
          light
            ? dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 bg-slate-50"
            : dragOver ? "border-blue-500 bg-blue-500/5" : "border-white/10 hover:border-white/20 bg-white/2",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className={cn("w-6 h-6 animate-spin", light ? "text-indigo-500" : "text-blue-400")} />
            <p className={cn("text-sm", light ? "text-slate-500" : "text-slate-400")}>Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", light ? "bg-indigo-50" : "bg-blue-500/10")}>
              <Upload className={cn("w-4 h-4", light ? "text-indigo-500" : "text-blue-400")} />
            </div>
            <div>
              <p className={cn("text-sm font-medium", light ? "text-slate-600" : "text-slate-300")}>
                Drop {multiple ? "images" : "an image"} here, or click to browse
              </p>
              <p className={cn("text-xs mt-0.5", light ? "text-slate-400" : "text-slate-500")}>PNG, JPG, WebP up to 10MB{multiple ? ` (max ${maxFiles})` : ""}</p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className={cn(
          "flex items-start gap-2 text-xs px-3 py-2 rounded-lg",
          light
            ? "bg-red-50 border border-red-200 text-red-600"
            : "bg-red-500/10 border border-red-500/20 text-red-400"
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
                className="relative group aspect-square rounded-lg overflow-hidden border border-white/10"
              >
                <img src={url} className="w-full h-full object-cover" alt={`Upload ${i + 1}`} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(url); }}
                    className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
