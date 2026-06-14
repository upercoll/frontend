import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Star, User, ShoppingCart, LogOut, Edit3, ChevronDown, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

interface NavGame {
  _id: string;
  name: string;
  slug: string;
  gradient: { from: string; to: string };
  imageUrl?: string;
}

interface NavbarProps {
  dark?: boolean;
}

export default function Navbar({ dark = false }: NavbarProps) {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [, navigate]              = useLocation();
  const { totalItems, openCart }  = useCart();
  const { user, logout, openAuthModal } = useAuth();
  const [cartBounce, setCartBounce] = useState(false);
  const [tappedGame, setTappedGame] = useState<string | null>(null);
  const [games, setGames]         = useState<NavGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const prevTotalRef = useState(totalItems);
  const dropdownRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = prevTotalRef[0];
    if (totalItems > prev) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 600);
      return () => clearTimeout(t);
    }
    prevTotalRef[0] = totalItems;
  }, [totalItems]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!menuOpen || games.length > 0) return;
    setGamesLoading(true);
    fetch(`${BACKEND}/api/games?active=true`)
      .then(r => r.json())
      .then(d => setGames(d.data?.games || []))
      .catch(() => {})
      .finally(() => setGamesLoading(false));
  }, [menuOpen]);

  function goToGame(slug: string) {
    setTappedGame(slug);
    setTimeout(() => {
      setTappedGame(null);
      setMenuOpen(false);
      navigate(`/game/${slug}`);
    }, 480);
  }

  const lightMode = !dark && scrolled;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          lightMode
            ? "bg-white/96 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
        style={lightMode ? { borderBottom: "1px solid rgba(49,46,128,0.1)" } : {}}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            <motion.button
              data-testid="button-hamburger"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen(true)}
              className="flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-200"
              style={lightMode
                ? { borderColor: "rgba(49,46,128,0.25)", color: "#312E80", background: "rgba(49,46,128,0.04)" }
                : { borderColor: "rgba(255,255,255,0.3)", color: "white" }
              }
            >
              <Menu size={20} />
            </motion.button>

            <Link href="/" data-testid="link-logo">
              <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-2 cursor-pointer select-none">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#312E80" }}>
                  <Star size={16} fill="white" color="white" />
                </div>
                <span className="text-xl font-bold tracking-tight transition-colors duration-300" style={{ color: lightMode ? "#1E1B4B" : "white" }}>
                  RB<span style={{ color: lightMode ? "#312E80" : "#A5B4FC" }}>stars</span>
                </span>
              </motion.div>
            </Link>

            <div className="flex items-center gap-2">
              <motion.button
                data-testid="button-cart"
                animate={cartBounce ? { scale: [1, 1.35, 0.88, 1.12, 1] } : {}}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={openCart}
                className="relative w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200"
                style={lightMode
                  ? { background: "rgba(49,46,128,0.07)", border: "1.5px solid rgba(49,46,128,0.18)" }
                  : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)" }
                }
              >
                <ShoppingCart size={18} color={lightMode ? "#312E80" : "white"} />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white"
                      style={{ background: "#dc2626", boxShadow: "0 0 8px rgba(220,38,38,0.6)" }}
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {user ? (
                <div ref={dropdownRef} className="relative">
                  <motion.button
                    data-testid="button-profile"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setProfileOpen(o => !o)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200"
                    style={lightMode
                      ? { background: "rgba(49,46,128,0.08)", border: "1.5px solid rgba(49,46,128,0.22)" }
                      : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.18)" }
                    }
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#312E80,#1E1B4B)" }}>
                      {user.robloxAvatarUrl
                        ? <img src={user.robloxAvatarUrl} alt="" className="w-full h-full object-cover" />
                        : <User size={13} color="white" />
                      }
                    </div>
                    <span className="text-[13px] font-bold max-w-[90px] truncate" style={{ color: lightMode ? "#1E1B4B" : "white" }}>
                      {user.displayName}
                    </span>
                    <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} color={lightMode ? "#312E80" : "rgba(255,255,255,0.6)"} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -8 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl overflow-hidden"
                        style={{ background: "#0F0C2E", border: "1.5px solid rgba(49,46,128,0.35)", boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(165,180,252,0.05)" }}
                      >
                        <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(165,180,252,0.08)" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#312E80,#1E1B4B)" }}>
                              {user.robloxAvatarUrl
                                ? <img src={user.robloxAvatarUrl} alt="" className="w-full h-full object-cover" />
                                : <User size={20} color="white" />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-white truncate">{user.displayName}</p>
                              <p className="text-[11px] truncate" style={{ color: "#A5B4FC" }}>@{user.robloxUsername}</p>
                              {!user.emailVerified && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                                  Email unverified
                                </span>
                              )}
                              {user.emailVerified && (
                                <span className="text-[10px] font-bold flex items-center gap-0.5 mt-0.5" style={{ color: "#4ade80" }}>
                                  <ShieldCheck size={9} />Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="py-2 px-2">
                          <ProfileDropdownItem icon={<Edit3 size={14} />} label="Edit Profile" onClick={() => { setProfileOpen(false); openAuthModal("login"); }} />
                          <div className="my-1.5 mx-2" style={{ height: "1px", background: "rgba(165,180,252,0.08)" }} />
                          <ProfileDropdownItem icon={<LogOut size={14} />} label="Sign Out" danger onClick={() => { logout(); setProfileOpen(false); }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  data-testid="button-login"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(49,46,128,0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openAuthModal("login")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg transition-colors duration-200"
                  style={{ background: "#1E1B4B" }}
                >
                  <User size={15} /> Log In
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="fullmenu"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex flex-col"
            style={{ background: "#0F0C2E" }}
          >
            {}
            <div className="line-grid-dark" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.7 }} />
            <div className="rb-particle" style={{ width: 6,  height: 6,  background: "#A5B4FC", left: "12%", top: "18%", animationDuration: "7.2s",  animationDelay: "0s",    "--p-op": 0.22 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 9,  height: 9,  background: "#818CF8", left: "78%", top: "10%", animationDuration: "9.5s",  animationDelay: "-2.1s", "--p-op": 0.16 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 5,  height: 5,  background: "#C7D2FE", left: "55%", top: "35%", animationDuration: "8.1s",  animationDelay: "-4.3s", "--p-op": 0.14 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 7,  height: 7,  background: "#6366F1", left: "30%", top: "60%", animationDuration: "10.3s", animationDelay: "-1.5s", "--p-op": 0.18 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 4,  height: 4,  background: "#A5B4FC", left: "88%", top: "55%", animationDuration: "6.8s",  animationDelay: "-3.7s", "--p-op": 0.12 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 8,  height: 8,  background: "#818CF8", left: "20%", top: "80%", animationDuration: "11.0s", animationDelay: "-6.2s", "--p-op": 0.15 } as React.CSSProperties} />
            <div className="rb-particle" style={{ width: 5,  height: 5,  background: "#C7D2FE", left: "65%", top: "72%", animationDuration: "7.6s",  animationDelay: "-0.9s", "--p-op": 0.13 } as React.CSSProperties} />

            <div className="flex items-center justify-between px-5 h-16 flex-shrink-0" style={{ borderBottom: "1px solid rgba(165,180,252,0.08)", position: "relative" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#312E80" }}>
                  <Star size={15} fill="white" color="white" />
                </div>
                <span className="text-xl font-bold text-white">RB<span style={{ color: "#A5B4FC" }}>stars</span></span>
              </div>
              <motion.button
                data-testid="button-close-menu"
                whileHover={{ scale: 1.1, backgroundColor: "rgba(49,46,128,0.3)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
                style={{ border: "1.5px solid rgba(165,180,252,0.15)" }}
              >
                <X size={20} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4" style={{ position: "relative" }}>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3 px-0.5" style={{ color: "rgba(165,180,252,0.45)" }}>
                Games
              </p>
              {gamesLoading ? (
                <div className="grid grid-cols-2 gap-2.5 pb-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl animate-pulse" style={{ aspectRatio: "3/2", background: "rgba(165,180,252,0.07)", border: "1px solid rgba(165,180,252,0.1)" }} />
                  ))}
                </div>
              ) : games.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm" style={{ color: "rgba(165,180,252,0.4)" }}>No games yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 pb-4">
                  {games.map((game, i) => {
                    const tapped = tappedGame === game.slug;
                    const c1 = game.gradient?.from || "#4F46E5";
                    const c2 = game.gradient?.to || "#1E1B4B";
                    return (
                      <motion.button
                        key={game._id}
                        initial={{ opacity: 0, scale: 0.88, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.04 + 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={!tapped ? { scale: 1.03 } : {}}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => goToGame(game.slug)}
                        data-testid={`link-menu-game-${i + 1}`}
                        className="relative flex flex-col overflow-hidden rounded-2xl text-left"
                        style={{
                          aspectRatio: "3/2",
                          background: "rgba(255,255,255,0.055)",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          border: tapped
                            ? "2px solid rgba(99,102,241,0.9)"
                            : "1px solid rgba(255,255,255,0.10)",
                          boxShadow: tapped
                            ? "0 0 0 4px rgba(79,70,229,0.2), 0 0 24px rgba(79,70,229,0.4)"
                            : "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)",
                          transition: "border 0.18s ease, box-shadow 0.22s ease",
                        }}
                      >
                        <AnimatePresence>
                          {tapped && (
                            <motion.div
                              className="absolute inset-0 rounded-2xl pointer-events-none"
                              style={{ border: "2px solid rgba(99,102,241,0.55)", zIndex: 20 }}
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 0.65, ease: "easeInOut" }}
                            />
                          )}
                        </AnimatePresence>

                        <div className="relative flex-1 overflow-hidden">
                          {game.imageUrl ? (
                            <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <>
                              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }} />
                              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "14px 14px" }} />
                              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,255,255,0.18) 0%, transparent 70%)" }} />
                            </>
                          )}
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${c1}, ${c2})`, pointerEvents: "none" }} />
                          <div style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: `linear-gradient(135deg, ${c1}, ${c2})`, boxShadow: `0 0 7px ${c1}dd`, pointerEvents: "none" }} />
                        </div>

                        <div className="flex-shrink-0 px-2.5 py-2" style={{ background: "rgba(0,0,0,0.32)", backdropFilter: "blur(8px)" }}>
                          <span className="text-white font-bold text-[12px] leading-tight block truncate" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
                            {game.name}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-5 flex-shrink-0" style={{ borderTop: "1px solid rgba(165,180,252,0.08)", position: "relative" }}>
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(49,46,128,0.15)", border: "1.5px solid rgba(49,46,128,0.3)" }}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#312E80,#1E1B4B)" }}>
                      {user.robloxAvatarUrl
                        ? <img src={user.robloxAvatarUrl} alt="" className="w-full h-full object-cover" />
                        : <User size={16} color="white" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-white truncate">{user.displayName}</p>
                      <p className="text-[11px]" style={{ color: "#A5B4FC" }}>@{user.robloxUsername}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: "rgba(248,113,113,0.1)", border: "1.5px solid rgba(248,113,113,0.2)", color: "#fca5a5" }}
                  >
                    <LogOut size={14} /> Sign Out
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  data-testid="button-menu-login"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setMenuOpen(false); openAuthModal("login"); }}
                  className="w-full py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#312E80 0%,#1E1B4B 100%)" }}
                >
                  <User size={16} /> Log In
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ProfileDropdownItem({
  icon, label, onClick, danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <motion.button
      whileHover={{ backgroundColor: danger ? "rgba(248,113,113,0.08)" : "rgba(49,46,128,0.15)" }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left"
      style={{ color: danger ? "#fca5a5" : "#A5B4FC" }}
    >
      {icon}{label}
    </motion.button>
  );
}
