import { Package } from "lucide-react";

interface MissingArtworkProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { icon: 20, text: "text-[9px]", pad: "p-2" },
  md: { icon: 28, text: "text-[10px]", pad: "p-3" },
  lg: { icon: 40, text: "text-xs", pad: "p-5" },
};

/**
 * Controlled missing-artwork state.
 * Displayed when a product has no verified image — never silently
 * replaced with a random image from another game or source.
 */
export default function MissingArtwork({ name, size = "md", className = "" }: MissingArtworkProps) {
  const s = sizeMap[size];
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 ${s.pad} ${className}`}
      style={{
        background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 4px, transparent 4px, transparent 8px)",
        border: "1px dashed rgba(255,255,255,0.12)",
        borderRadius: "inherit",
      }}
    >
      <Package size={s.icon} color="rgba(255,255,255,0.15)" />
      <p
        className={`font-medium leading-tight text-center line-clamp-2 ${s.text}`}
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        {name}
      </p>
    </div>
  );
}
