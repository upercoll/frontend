import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ArrowRight, Megaphone } from "lucide-react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";
const DISMISS_KEY = "rbstars_dismissed_announcements";
const SEEN_KEY = "rbstars_seen_announcements";

type Theme = "blue" | "pink" | "green" | "yellow" | "red" | "ink" | "violet";

/**
 * Flat colour pairs — the brand is built on colour blocking, not gradients, so
 * the art panel is one solid fill with flat shapes on top of it.
 */
const THEMES: Record<Theme, { bg: string; onBg: string; soft: string; onSoft: string }> = {
  blue:   { bg: "#005bd3", onBg: "#ffffff", soft: "#e8f0fe", onSoft: "#00429a" },
  pink:   { bg: "#d6336c", onBg: "#ffffff", soft: "#fdeaf1", onSoft: "#a11f4c" },
  green:  { bg: "#0f7b4f", onBg: "#ffffff", soft: "#e3f6ec", onSoft: "#0a5738" },
  yellow: { bg: "#b45309", onBg: "#ffffff", soft: "#fdf1e0", onSoft: "#7c3c06" },
  red:    { bg: "#b42318", onBg: "#ffffff", soft: "#fdecea", onSoft: "#7d160e" },
  ink:    { bg: "#303030", onBg: "#ffffff", soft: "#eeeeee", onSoft: "#1f1f1f" },
  violet: { bg: "#5b3fd1", onBg: "#ffffff", soft: "#eeeafc", onSoft: "#3d2591" },
};

interface LiveAnnouncement {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  theme: Theme;
  badge: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  showAsModal: boolean;
  dismissible: boolean;
  promoCode: string | null;
  publishedAt: string;
  endsAt: string | null;
}

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    // localStorage can hold anything — never trust the shape.
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    // Keep the list bounded — it only ever needs recent ids.
    localStorage.setItem(key, JSON.stringify(list.slice(-60)));
  } catch {}
}

/**
 * Site-wide announcement popup.
 *
 * Shows the highest-priority live announcement that this device hasn't
 * dismissed yet. Dismissals are remembered per announcement id, so publishing
 * a new post re-opens the popup for everyone.
 */
export default function AnnouncementPopup() {
  const [current, setCurrent] = useState<LiveAnnouncement | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Load + pick ──────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    fetch(`${BACKEND}/api/announcements`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!alive || !json?.data?.announcements) return;
        const all: LiveAnnouncement[] = json.data.announcements;
        const modalOnes = all.filter((a) => a.showAsModal);
        if (modalOnes.length === 0) return;

        const dismissed = new Set(readList(DISMISS_KEY));
        // Honour dismissals, but let a re-published post come back: if this id
        // was never *seen* before, the owner clearly wants it in front of people.
        const seen = new Set(readList(SEEN_KEY));
        const next =
          modalOnes.find((a) => !dismissed.has(a.id)) ||
          modalOnes.find((a) => !seen.has(a.id));
        if (!next) return;

        setCurrent(next);
        writeList(SEEN_KEY, [...readList(SEEN_KEY), next.id]);
        // Impression counter — best effort, never blocks the popup.
        fetch(`${BACKEND}/api/announcements/${next.id}/view`, { method: "POST" }).catch(() => {});
      })
      .catch(() => {
        /* popup is non-critical — stay silent if the API is down */
      });
    return () => {
      alive = false;
    };
  }, []);

  const close = useCallback(() => {
    if (!current) return;
    if (current.dismissible) {
      writeList(DISMISS_KEY, [...readList(DISMISS_KEY), current.id]);
    }
    setCurrent(null);
  }, [current]);

  // ── Esc to dismiss + scroll lock ────────────────────────────────
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && current.dismissible) close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [current, close]);

  // ── CTA ─────────────────────────────────────────────────────────
  const goCta = () => {
    if (!current) return;
    const url = current.ctaUrl || "";
    if (current.dismissible) writeList(DISMISS_KEY, [...readList(DISMISS_KEY), current.id]);
    setCurrent(null);
    if (!url) return;
    if (/^https?:\/\//i.test(url)) {
      window.location.href = url;
    } else {
      window.history.pushState({}, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const theme = THEMES[(current?.theme as Theme) || "blue"] || THEMES.blue;
  const hasCta = !!current?.ctaLabel || !!current?.ctaUrl;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={() => current.dismissible && close()}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(8, 14, 20, 0.72)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
            initial={{ opacity: 0, y: 26, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="announce-split"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 880,
              maxHeight: "min(88vh, 720px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "#131C23",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 22,
              boxShadow: "0 30px 80px -18px rgba(0,0,0,0.7)",
            }}
          >
            {/* ══ Split: art panel (left) ══════════════════════════ */}
            <div
              style={{
                position: "relative",
                minHeight: 168,
                background: theme.bg,
                overflow: "hidden",
              }}
            >
              {/* flat decorative shapes — brand's tilted-square motif */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12, duration: 0.5 }}
                style={{
                  position: "absolute", top: -46, left: -34, width: 150, height: 150,
                  borderRadius: "50%", background: "rgba(255,255,255,0.10)",
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18, duration: 0.5 }}
                style={{
                  position: "absolute", bottom: -30, right: -18, width: 116, height: 116,
                  borderRadius: "50%", background: "rgba(255,255,255,0.08)",
                }}
              />
              <motion.div
                initial={{ opacity: 0, rotate: 4, scale: 0.9 }}
                animate={{ opacity: 1, rotate: 12, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                style={{
                  position: "absolute", top: "50%", left: "50%",
                  width: 150, height: 150, marginLeft: -75, marginTop: -75,
                  transform: "rotate(12deg)",
                  borderRadius: 26,
                  border: "2px solid rgba(255,255,255,0.22)",
                }}
              />

              {current.imageUrl && (
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  src={current.imageUrl}
                  alt=""
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}

              {/* Badge sits on the art panel so it reads instantly */}
              <div style={{ position: "absolute", top: 18, left: 18, display: "flex", gap: 8, alignItems: "center" }}>
                <motion.span
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "#ffffff", color: theme.bg,
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.14em",
                    textTransform: "uppercase", padding: "6px 10px", borderRadius: 6,
                  }}
                >
                  <Megaphone size={11} />
                  {current.badge || "RBstars"}
                </motion.span>
              </div>

              <div
                style={{
                  position: "absolute", bottom: 16, left: 18,
                  color: "rgba(255,255,255,0.72)", fontSize: 10, letterSpacing: "0.12em",
                  textTransform: "uppercase", fontWeight: 700,
                }}
              >
                rbstars.gg
              </div>
            </div>

            {/* ══ Split: content panel (right) ═════════════════════ */}
            <div
              style={{
                minWidth: 0,
                padding: "26px 26px 22px",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              {current.dismissible && (
                <button
                  onClick={close}
                  aria-label="Close"
                  style={{
                    position: "absolute", top: 14, right: 14,
                    width: 30, height: 30, borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.7)", cursor: "pointer",
                  }}
                >
                  <X size={15} />
                </button>
              )}

              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                style={{
                  margin: 0,
                  paddingRight: current.dismissible ? 34 : 0,
                  color: "#F4F8FB",
                  fontSize: "clamp(20px, 3.1vw, 27px)",
                  lineHeight: 1.18,
                  fontWeight: 800,
                  letterSpacing: "-0.015em",
                }}
              >
                {current.title}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.4 }}
                style={{
                  marginTop: 12,
                  color: "#9BAEBB",
                  fontSize: 14,
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                }}
              >
                {current.body}
              </motion.div>

              {/* Promo code */}
              {current.promoCode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                  style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
                >
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(current.promoCode || "");
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1800);
                    }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: theme.soft, color: theme.onSoft,
                      border: `1px dashed ${theme.bg}`,
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      fontWeight: 800, fontSize: 15, letterSpacing: "0.1em",
                      padding: "9px 14px", borderRadius: 9, cursor: "pointer",
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {current.promoCode}
                  </button>
                  <span style={{ color: "#637784", fontSize: 11 }}>
                    {copied ? "Copied — use it at checkout" : "Tap to copy code at checkout"}
                  </span>
                </motion.div>
              )}

              {/* Actions pinned to the bottom */}
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 20,
                  display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                }}
              >
                {hasCta && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38 }}
                    onClick={goCta}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: theme.bg, color: "#ffffff",
                      border: "none", borderRadius: 10,
                      fontSize: 14, fontWeight: 800,
                      padding: "12px 20px", cursor: "pointer",
                    }}
                  >
                    {current.ctaLabel || "Take a look"}
                    <ArrowRight size={15} />
                  </motion.button>
                )}
                {current.dismissible && (
                  <button
                    onClick={close}
                    style={{
                      background: "transparent", color: "#9BAEBB",
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: 10, fontSize: 13, fontWeight: 600,
                      padding: "12px 18px", cursor: "pointer",
                    }}
                  >
                    Got it
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}