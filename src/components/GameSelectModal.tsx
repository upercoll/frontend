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
            className="fixed inset-x-4 bottom-4 top-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:w-full sm:max-w-[520px] sm:max-h-[85vh] flex flex-col rounded-3xl overflow-hidden"
            style={{ zIndex: zBase, background: "#0F0C2E", border: "1.5px solid rgba(165,180,252,0.15)" }}>

            <div className="line-grid-dark" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.65, borderRadius: "inherit" }} />
            <div className="rb-particle" style={{ width: 7, height: 7, background: "#A5B4FC", left: "8%",  top: "15%", animationDuration: "8.4s",  animationDelay: "0s",    "--p-op": 0.20 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 5, height: 5, background: "#818CF8", left: "82%", top: "8%",  animationDuration: "7.1s",  animationDelay: "-2.3s", "--p-op": 0.15 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 9, height: 9, background: "#6366F1", left: "50%", top: "25%", animationDuration: "10.2s", animationDelay: "-5.1s", "--p-op": 0.12 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 4, height: 4, background: "#C7D2FE", left: "25%", top: "65%", animationDuration: "6.9s",  animationDelay: "-1.8s", "--p-op": 0.18 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 6, height: 6, background: "#818CF8", left: "72%", top: "58%", animationDuration: "9.0s",  animationDelay: "-3.4s", "--p-op": 0.14 } as React.CSSProperties} />

            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ position: "relative" }}>
              <h2 className="text-xl font-extrabold" style={{
                background: "linear-gradient(135deg,#A5B4FC 0%,#4F46E5 60%,#818CF8 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>Select a Game</h2>
              <motion.button data-testid="button-close-game-modal" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(165,180,252,0.15)", color: "#A5B4FC" }}>
                <X size={17} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ position: "relative" }}>
              {loading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ background: "rgba(165,180,252,0.07)", border: "1.5px solid rgba(165,180,252,0.1)" }} />
                  ))}
                </div>
              ) : games.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Gamepad2 size={40} color="rgba(165,180,252,0.3)" className="mb-3" />
                  <p className="text-sm font-medium" style={{ color: "rgba(165,180,252,0.5)" }}>No games available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {games.map((game, i) => {
                    const c1 = game.gradient?.from || "#4F46E5";
                    const c2 = game.gradient?.to || "#1E1B4B";
                    return (
                      <motion.button key={game._id}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        whileHover="hover"
                        whileTap={{ scale: 0.93 }}
                        data-testid={`button-game-${i + 1}`}
                        onClick={() => handleSelect(game.slug)}
                        className="relative flex flex-col rounded-2xl overflow-hidden aspect-square"
                        style={{ border: "1.5px solid rgba(165,180,252,0.12)", transition: "border-color 0.2s ease, box-shadow 0.2s ease" }}
                        variants={{
                          hover: {
                            scale: 1.06,
                            boxShadow: `0 0 0 2px ${c1}cc, 0 0 22px 6px ${c1}55`,
                            transition: { duration: 0.22, ease: "easeOut" },
                          },
                        }}
                      >
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${c1} 0%,${c2} 100%)` }} />
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
                        {game.imageUrl ? (
                          <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        ) : null}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: "rgba(255,255,255,0)" }}
                          variants={{ hover: { background: "rgba(255,255,255,0.08)", transition: { duration: 0.2 } } }}
                        />
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.28) 50%,transparent 65%)", x: "-100%" }}
                          variants={{ hover: { x: "100%", transition: { duration: 0.55, ease: "easeInOut" } } }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-2/3" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.78) 0%,transparent 100%)" }} />
                        <motion.div
                          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full pointer-events-none"
                          style={{ background: "rgba(255,255,255,0.5)", boxShadow: "0 0 0 0 rgba(255,255,255,0)" }}
                          variants={{ hover: { boxShadow: "0 0 6px 3px rgba(255,255,255,0.35)", transition: { duration: 0.2 } } }}
                        />
                        <span className="absolute bottom-2 left-2 right-2 text-white font-bold text-xs leading-tight text-left" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{game.name}</span>
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
