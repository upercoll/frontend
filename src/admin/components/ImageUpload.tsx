import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | string[];
  onChange: (urls: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  folder?: string;
  label?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  folder = "rbstars/uploads",
  label = "Upload Image",
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "";
  const token = localStorage.getItem("panel_token");

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      if (multiple) {
        const form = new FormData();
        files.forEach((f) => form.append("files", f));
        const res = await fetch(`${apiUrl}/api/panel/upload/multiple?folder=${folder}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        onChange(data.data.url);
      }
    } catch (err) {
      console.error("Upload failed:", err);
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
    <div className={cn("space-y-3", className)}>
      {label && <p className="text-slate-300 text-sm font-medium">{label}</p>}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          dragOver ? "border-blue-500 bg-blue-500/5" : "border-white/10 hover:border-white/20 bg-white/2",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-slate-400 text-sm">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-300 text-sm font-medium">
                Drop {multiple ? "images" : "an image"} here, or click to browse
              </p>
              <p className="text-slate-500 text-xs mt-1">PNG, JPG, WebP up to 10MB{multiple ? ` (max ${maxFiles})` : ""}</p>
            </div>
          </div>
        )}
      </div>

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
