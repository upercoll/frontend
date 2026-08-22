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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: zBase - 10 }} onClick={onClose} />

          <motion.div key="sheet"
            initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 bottom-4 top-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:w-full sm:max-w-[540px] sm:max-h-[85vh] flex flex-col rounded-3xl overflow-hidden"
            style={{
              zIndex: zBase,
              background: "#F7F4EC",
              border: "3px solid #131313",
              boxShadow: "10px 10px 0 #131313",
            }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b-[2.5px] border-[#131313]"
              style={{ background: "#F2EEE5" }}>
              <div className="flex items-center gap-3">
                <span className="tilt-sq !w-3 !h-3" />
                <h2 className="font-display text-xl uppercase tracking-wide" style={{ color: "#131313" }}>
                  Select a <span className="text-outline">Game</span>
                </h2>
              </div>
              <motion.button data-testid="button-close-game-modal" whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors hover:bg-[#E2231A] hover:text-white"
                style={{ borderColor: "#131313", color: "#131313", background: "#fff" }}>
                <X size={17} />
              </motion.button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ background: "rgba(19,19,19,.06)", border: "2px solid rgba(19,19,19,.12)" }} />
                  ))}
                </div>
              ) : games.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Gamepad2 size={40} className="mb-3 opacity-30" />
                  <p className="font-mono text-xs uppercase tracking-[0.16em] opacity-50">No games available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {games.map((game, i) => {
                    const c1 = game.gradient?.from || "#E2231A";
                    return (
                      <motion.button key={game._id}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -5, boxShadow: "5px 6px 0 #131313" }}
                        whileTap={{ scale: 0.94 }}
                        data-testid={`button-game-${i + 1}`}
                        onClick={() => handleSelect(game.slug)}
                        className="relative flex flex-col rounded-2xl overflow-hidden aspect-square border-2 border-[#131313]"
                        style={{ background: c1, transition: "box-shadow .2s ease" }}
                      >
                        <div className="absolute inset-0 pattern-dots-light opacity-70" />
                        {game.imageUrl ? (
                          <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-75" />
                        ) : null}
                        <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(to top,rgba(19,19,19,.85),transparent)" }} />
                        <span className="absolute bottom-2 left-2 right-2 text-[#F2EEE5] font-bold text-xs leading-tight text-left" style={{ textShadow: "0 1px 3px rgba(0,0,0,.9)" }}>{game.name}</span>
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
