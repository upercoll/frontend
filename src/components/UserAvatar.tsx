import { useEffect, useMemo, useState } from "react";

/* ── Customer avatar ──────────────────────────────────────────────────────
   One circle, used everywhere a customer is shown in the storefront chrome
   (top bar, mobile drawer, bottom nav, navbar). It renders the buyer's
   Roblox headshot when we have one and initials when we don't, so the
   logged-in state always reads as a person rather than a generic icon.

   Props are deliberately tiny:
     name  — display name, for the initials fallback
     src   — robloxAvatarUrl (may be null, or may 404 — both fall back)
     size  — pixel diameter
     ring  — the blue halo around the circle (on by default)
   ────────────────────────────────────────────────────────────────────────── */

const GRADIENTS: [string, string][] = [
  ["#2f8cff", "#0a50d6"], // brand blue
  ["#7b5cff", "#4338ca"], // violet
  ["#12b886", "#0a7f5f"], // green
  ["#f59e0b", "#d97706"], // amber
  ["#ec4899", "#be185d"], // pink
  ["#22c55e", "#15803d"], // grass
];

function initialsOf(name?: string | null) {
  const clean = (name || "").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Stable per-name colour: the same buyer keeps the same circle colour on
   every device, and two buyers rarely collide. */
function gradientOf(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export default function UserAvatar({
  name,
  src,
  size = 28,
  ring = true,
  className = "",
  style,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [broken, setBroken] = useState(false);

  /* A new account (or a repaired avatar URL) must get another chance at
     loading — otherwise one bad URL would poison the circle for the session. */
  useEffect(() => { setBroken(false); }, [src]);

  const label = useMemo(() => initialsOf(name), [name]);
  const [from, to] = useMemo(() => gradientOf(name || label), [name, label]);
  const showImage = !!src && !broken;

  return (
    <span
      className={`ua shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: showImage ? "#151f38" : `linear-gradient(140deg,${from},${to})`,
        boxShadow: ring
          ? "0 0 0 1.5px rgba(47,140,255,0.55), 0 0 0 4px rgba(47,140,255,0.12)"
          : "none",
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={src as string}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            fontSize: Math.max(9, Math.round(size * 0.38)),
            fontWeight: 800,
            letterSpacing: "0.02em",
            color: "#fff",
            lineHeight: 1,
            userSelect: "none",
            textShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
