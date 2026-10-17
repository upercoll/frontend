import { motion, AnimatePresence } from "framer-motion";
import { X, Gamepad2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { P } from "@/lib/storefront";
import { ItemTileGlyph } from "@/components/Art";

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
            className="fixed inset-x-4 bottom-4 top-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:w-full sm:max-w-[520px] sm:max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
            style={{ zIndex: zBase, background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}>

            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ position: "relative", borderBottom: `1px solid ${P.border}` }}>
              <h2 className="text-xl font-extrabold tracking-tight" style={{ color: P.text }}>Select a Game</h2>
              <motion.button data-testid="button-close-game-modal" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: P.band, border: `1px solid ${P.border}`, color: P.faint }}>
                <X size={17} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ position: "relative" }}>
              {loading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl animate-pulse"
                      style={{ background: P.stage, border: `1px solid ${P.border}`, animationDelay: `${i * 70}ms` }} />
                  ))}
                </div>
              ) : games.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ItemTileGlyph className="w-12 h-12 mb-4" />
                  <p className="text-base font-bold" style={{ color: P.text }}>No games available yet</p>
                  <p className="text-sm mt-1" style={{ color: P.muted }}>New catalogs are added regularly — check back soon.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {games.map((game, i) => {
                    const c1 = game.gradient?.from || P.accent;
                    return (
                      <motion.button key={game._id}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        whileHover="hover"
                        whileTap={{ scale: 0.96, boxShadow: `0 0 0 3px ${P.accentTint}, 0 0 0 4px ${P.accentDeep}` }}
                        data-testid={`button-game-${i + 1}`}
                        onClick={() => handleSelect(game.slug)}
                        className="group relative flex flex-col rounded-2xl overflow-hidden aspect-square cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2f8cff]/45"
                        style={{ background: c1, border: `1px solid ${P.border}`, boxShadow: P.shadow, transition: "border-color 0.2s ease" }}
                        variants={{
                          hover: {
                            y: -4,
                            boxShadow: P.shadow,
                            transition: { duration: 0.22, ease: "easeOut" },
                          },
                        }}
                      >
                        <div className="absolute inset-0" style={{ background: c1 }} />
                        {game.imageUrl ? (
                          <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white select-none">
                            {game.name.charAt(0)}
                          </span>
                        )}
                        {/* Scrim — legibility, not decoration: the name and the
                            action stay readable on any artwork that arrives. */}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 32%, transparent 52%, rgba(0,0,0,0.7) 100%)" }} />
                        {/* Name top-left over the dark end of the scrim, action
                            pinned to the bottom — the same split BrowseGames
                            uses, so a cover reads identically in both places. */}
                        <div className="absolute inset-x-3 top-3">
                          <span className="block text-xs font-black leading-tight text-white drop-shadow-md">{game.name}</span>
                        </div>
                        <div className="absolute inset-x-2 bottom-2">
                          <div className="py-1.5 rounded-lg text-[10px] font-extrabold text-center text-white transition-transform duration-300 group-hover:-translate-y-0.5"
                            style={{ background: P.accentDeep, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                            Shop Now
                          </div>
                        </div>
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
