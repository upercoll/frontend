import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Star, User, ShoppingCart, LogOut, Edit3, ChevronDown, ShieldCheck, Gamepad2, ArrowRight } from "lucide-react";
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

/* ── Desktop nav link ───────────────────────────────────── */
function DesktopNavLink({
  label, onClick, lightMode,
}: { label: string; onClick: () => void; lightMode: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200"
      style={{
        color: lightMode ? "#312E80" : "rgba(255,255,255,0.85)",
        background: "transparent",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = lightMode
          ? "rgba(49,46,128,0.08)"
          : "rgba(255,255,255,0.1)";
      }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      {label}
    </motion.button>
  );
}

export default function Navbar({ dark = false }: NavbarProps) {
  const [scrolled,      setScrolled]      = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [, navigate]                      = useLocation();
  const { totalItems,   openCart }        = useCart();
  const { user, logout, openAuthModal }   = useAuth();
  const [cartBounce,    setCartBounce]    = useState(false);
  const [tappedGame,    setTappedGame]    = useState<string | null>(null);
  const [games,         setGames]         = useState<NavGame[]>([]);
  const [gamesLoading,  setGamesLoading]  = useState(false);
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

  /* Smooth scroll helpers for desktop nav links */
  function scrollToShop() {
    const el = document.getElementById("shop-games");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/");
      window.dispatchEvent(new Event("rbstars:open-shop"));
    }
  }

  function scrollToHowItWorks() {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/");
    }
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
        {/* Promo banner */}
        <div
          className="relative overflow-hidden text-center py-2 px-4"
          style={{ background: "linear-gradient(90deg,#1e1b4b,#4f46e5,#7c3aed,#4f46e5,#1e1b4b)", backgroundSize: "200% 100%" }}
        >
          <motion.div
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)", backgroundSize: "200% 100%" }}
          />
          <p className="relative text-[11px] sm:text-xs font-bold text-white tracking-wide">
            🎉 USE CODE{" "}
            <span className="font-black text-yellow-300 bg-yellow-300/10 px-1.5 py-0.5 rounded-md mx-0.5">
              RBSTARS10
            </span>{" "}
            FOR 10% OFF ON YOUR PURCHASES!
          </p>
        </div>

        {/* Main nav bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* ── Left group: hamburger (mobile) + logo + desktop nav ── */}
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <motion.button
                data-testid="button-hamburger"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setMenuOpen(true)}
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-200"
                style={lightMode
                  ? { borderColor: "rgba(49,46,128,0.25)", color: "#312E80", background: "rgba(49,46,128,0.04)" }
                  : { borderColor: "rgba(255,255,255,0.3)", color: "white" }
                }
              >
                <Menu size={20} />
              </motion.button>

              {/* Logo */}
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

              {/* Desktop nav links */}
              <nav className="hidden md:flex items-center gap-0.5 ml-4">
                <DesktopNavLink label="Shop" onClick={scrollToShop} lightMode={lightMode} />
                <DesktopNavLink label="How It Works" onClick={scrollToHowItWorks} lightMode={lightMode} />
              </nav>
            </div>

            {/* ── Right group: cart + profile + desktop CTA ── */}
            <div className="flex items-center gap-2">

              {/* Cart */}
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

              {/* Profile / Login */}
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
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#312E80,#1E1B4B)" }}>
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
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-2xl p-2 z-50"
                        style={{ background: "#1a1730", border: "1.5px solid rgba(165,180,252,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
                      >
                        <div className="px-3 py-2.5 mb-1">
                          <p className="text-sm font-extrabold text-white truncate">{user.displayName}</p>
                          <p className="text-[11px]" style={{ color: "#A5B4FC" }}>@{user.robloxUsername}</p>
                        </div>
                        <div className="h-px mb-1" style={{ background: "rgba(165,180,252,0.1)" }} />
                        <ProfileDropdownItem icon={<Edit3 size={14} />} label="Edit Profile"
                          onClick={() => { setProfileOpen(false); navigate("/profile"); }} />
                        {user.isAdmin && (
                          <ProfileDropdownItem icon={<ShieldCheck size={14} />} label="Admin Panel"
                            onClick={() => { setProfileOpen(false); navigate("/admin"); }} />
                        )}
                        <div className="h-px my-1" style={{ background: "rgba(165,180,252,0.1)" }} />
                        <ProfileDropdownItem icon={<LogOut size={14} />} label="Sign Out"
                          onClick={() => { logout(); setProfileOpen(false); }} danger />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  data-testid="button-login"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openAuthModal("login")}
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
                  style={lightMode
                    ? { background: "rgba(49,46,128,0.08)", border: "1.5px solid rgba(49,46,128,0.22)", color: "#312E80" }
                    : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", color: "white" }
                  }
                >
                  <User size={14} /> Log In
                </motion.button>
              )}

              {/* Desktop Shop Now CTA */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 8px 28px rgba(79,70,229,0.5)" }}
                whileTap={{ scale: 0.96 }}
                onClick={scrollToShop}
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#4F46E5 0%,#312E80 100%)" }}
              >
                <ShoppingCart size={14} /> Shop Now
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="drawer"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
            style={{ background: "#0F0C2E" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-6 flex-shrink-0">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#312E80" }}>
                    <Star size={16} fill="white" color="white" />
                  </div>
                  <span className="text-xl font-bold text-white">
                    RB<span style={{ color: "#A5B4FC" }}>stars</span>
                  </span>
                </div>
              </Link>
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <X size={18} color="white" />
              </motion.button>
            </div>

            {/* Quick action buttons */}
            <div className="px-5 mb-6 flex flex-col gap-3 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setMenuOpen(false);
                  setTimeout(() => {
                    const el = document.getElementById("shop-games");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 350);
                }}
                className="w-full py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#4F46E5 0%,#312E80 100%)" }}
              >
                <ShoppingCart size={16} /> Browse Shop
              </motion.button>
            </div>

            {/* Section label */}
            <div className="px-5 mb-3 flex-shrink-0">
              <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "rgba(165,180,252,0.5)" }}>
                Games
              </p>
            </div>

            {/* Games list */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {gamesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-6 h-6 rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "rgba(165,180,252,0.3)", borderTopColor: "#A5B4FC" }} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {games.map((game, i) => {
                    const c1 = game.gradient?.from || "#6d28d9";
                    const c2 = game.gradient?.to   || "#4c1d95";
                    const tapped = tappedGame === game.slug;
                    return (
                      <motion.button
                        key={game._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => goToGame(game.slug)}
                        className="relative flex flex-col rounded-2xl overflow-hidden"
                        style={{
                          border: tapped ? `2px solid ${c1}` : "1.5px solid rgba(165,180,252,0.12)",
                          aspectRatio: "1 / 1",
                          transition: "border-color 0.2s ease",
                        }}
                      >
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${c1} 0%,${c2} 100%)` }} />
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
                        {game.imageUrl && <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-75" />}
                        <div className="absolute inset-x-0 bottom-0 h-2/3" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)" }} />
                        <span className="absolute bottom-2 left-2 right-2 text-white font-bold text-xs leading-tight text-left" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                          {game.name}
                        </span>
                        {tapped && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center rounded-2xl"
                            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                              className="w-6 h-6 rounded-full border-2 border-t-transparent"
                              style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "white" }} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auth section */}
            <div className="px-5 pb-8 flex-shrink-0 border-t" style={{ borderColor: "rgba(165,180,252,0.1)", paddingTop: 16 }}>
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#312E80,#1E1B4B)" }}>
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
