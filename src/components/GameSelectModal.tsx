import { motion, AnimatePresence } from "framer-motion";
import { X, Gamepad2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

interface ApiGame {
  _id: string;
  name: string;
  slug: string;
  gradient: { from: string; to: string };
  imageUrl?: string;
  active: boolean;
  productCount?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  zBase?: number;
}

export default function GameSelectModal({ open, onClose, zBase = 80 }: Props) {
  const [, navigate] = useLocation();
  const [games, setGames] = useState<ApiGame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${BACKEND}/api/games?active=true`)
      .then((r) => r.json())
      .then((d) => setGames(d.data?.games || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleSelect(slug: string) {
    onClose();
    navigate(`/game/${slug}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-[#0E1A3C]/70 backdrop-blur-sm" style={{ zIndex: zBase - 10 }} onClick={onClose} />

          <motion.div key="sheet"
            initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 bottom-4 top-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:w-full sm:max-w-[540px] sm:max-h-[85vh] flex flex-col rounded-3xl overflow-hidden"
            style={{
              zIndex: zBase,
              background: "#fff",
              boxShadow: "var(--shadow-soft-lg)",
            }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(14,26,60,.08)" }}>
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] mb-1" style={{ color: "#2B50F6" }}>
                  Step inside
                </p>
                <h2 className="font-display text-2xl tracking-tight" style={{ color: "#0E1A3C" }}>
                  Select a game
                </h2>
              </div>
              <motion.button data-testid="button-close-game-modal" whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors hover:bg-[#EEF3FB]"
                style={{ borderColor: "rgba(14,26,60,.14)", color: "#0E1A3C", background: "#fff" }}>
                <X size={17} />
              </motion.button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {loading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ background: "rgba(14,26,60,.05)" }} />
                  ))}
                </div>
              ) : games.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Gamepad2 size={40} className="mb-3 opacity-25" />
                  <p className="text-sm font-medium" style={{ color: "#5A6478" }}>No games available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3.5">
                  {games.map((game, i) => {
                    const c1 = game.gradient?.from || "#2B50F6";
                    const c2 = game.gradient?.to || "#0E1A3C";
                    return (
                      <motion.button key={game._id}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -6, boxShadow: "var(--shadow-soft-md)" }}
                        whileTap={{ scale: 0.94 }}
                        data-testid={`button-game-${i + 1}`}
                        onClick={() => handleSelect(game.slug)}
                        className="relative flex flex-col rounded-2xl overflow-hidden aspect-square"
                        style={{ background: `linear-gradient(135deg,${c1},${c2})`, transition: "box-shadow .25s ease" }}
                      >
                        {game.imageUrl ? (
                          <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-85" />
                        ) : null}
                        <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(to top,rgba(11,20,55,.92),transparent)" }} />
                        <span className="absolute bottom-2.5 left-2.5 right-2.5 text-white font-bold text-xs leading-tight text-left" style={{ textShadow: "0 1px 4px rgba(0,0,0,.7)" }}>{game.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
