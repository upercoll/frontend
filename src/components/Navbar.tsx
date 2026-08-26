import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, LogOut, Edit3, ChevronDown, ShieldCheck, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const NAVY = "#0E1A3C";
const ROYAL = "#2B50F6";

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

/* ── Brand mark: navy block with gold star ── */
function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="12" y="12" width="40" height="40" rx="11" transform="rotate(8 32 32)" fill="#0E1A3C" />
      <path d="M32 20 l3.4 7.2 7.9 1 -5.8 5.6 1.4 7.9 -6.9 -3.9 -6.9 3.9 1.4 -7.9 -5.8 -5.6 7.9 -1z" fill="#FFC53D" />
    </svg>
  );
}

function Wordmark({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  return (
    <span
      className="font-display text-xl leading-none tracking-tight select-none"
      style={{ color: tone === "ink" ? "#0E1A3C" : "#FFFFFF" }}
    >
      RB<span style={{ color: tone === "ink" ? "#2B50F6" : "#FFC53D" }}>stars</span>
    </span>
  );
}

function StarIcon({ size = 12, fill = "#FFC53D", stroke = "none" }: { size?: number; fill?: string; stroke?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* ── Desktop nav link ───────────────────────────────────── */
function DesktopNavLink({
  label, onClick,
}: { label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="group relative px-3 py-1.5 text-sm font-semibold transition-colors duration-200"
      style={{ color: "#0E1A3C" }}
    >
      {label}
      <span
        className="absolute inset-x-3 bottom-0.5 h-[2.5px] origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: "#2B50F6" }}
      />
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

  void dark;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/92 backdrop-blur-xl shadow-[0_1px_0_rgba(14,26,60,.08),0_12px_32px_-16px_rgba(14,26,60,.18)]"
            : "bg-transparent"
        }`}
      >
        {/* Promo banner */}
        <div
          className="relative overflow-hidden text-center py-2 px-4"
          style={{
            background: "linear-gradient(90deg,#0E1A3C 0%,#16265C 50%,#0E1A3C 100%)",
            borderBottom: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <p className="relative flex items-center justify-center gap-2 text-[11px] sm:text-xs font-semibold tracking-wide text-white">
            <StarIcon size={11} />
            Use code{" "}
            <span className="inline-flex items-center gap-1 bg-[#FFC53D] px-1.5 py-0.5 mx-0.5 rounded-md font-bold text-[#0E1A3C]">
              RBSTARS10
            </span>{" "}
            for 10% off your order
            <StarIcon size={11} />
          </p>
        </div>

        {/* Main nav bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* ── Left group ── */}
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <motion.button
                data-testid="button-hamburger"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setMenuOpen(true)}
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-full border transition-colors"
                style={{ borderColor: "rgba(14,26,60,.15)", color: "#0E1A3C", background: "rgba(255,255,255,.7)" }}
              >
                <Menu size={20} />
              </motion.button>

              {/* Logo */}
              <Link href="/" data-testid="link-logo">
                <motion.div whileHover={{ scale: 1.04 }} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <LogoMark size={32} />
                  <Wordmark tone="ink" />
                </motion.div>
              </Link>

              {/* Desktop nav links */}
              <nav className="hidden md:flex items-center gap-1 ml-4">
                <DesktopNavLink label="Shop" onClick={scrollToShop} />
                <DesktopNavLink label="How It Works" onClick={scrollToHowItWorks} />
              </nav>
            </div>

            {/* ── Right group ── */}
            <div className="flex items-center gap-2">

              {/* Cart */}
              <motion.button
                data-testid="button-cart"
                animate={cartBounce ? { scale: [1, 1.35, 0.88, 1.12, 1] } : {}}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={openCart}
                className="relative w-11 h-11 rounded-full flex items-center justify-center border transition-colors"
                style={{ borderColor: "rgba(14,26,60,.15)", color: "#0E1A3C", background: "rgba(255,255,255,.75)" }}
              >
                <ShoppingCart size={18} />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white"
                      style={{ background: "#2B50F6" }}
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
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setProfileOpen(o => !o)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border bg-white transition-shadow"
                    style={{
                      borderColor: "rgba(14,26,60,.14)",
                      boxShadow: profileOpen ? "var(--shadow-soft-sm)" : "none",
                    }}
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "#EEF3FB" }}>
                      {user.robloxAvatarUrl
                        ? <img src={user.robloxAvatarUrl} alt="" className="w-full h-full object-cover" />
                        : <User size={13} color="#0E1A3C" />
                      }
                    </div>
                    <span className="text-[13px] font-bold max-w-[90px] truncate" style={{ color: "#0E1A3C" }}>
                      {user.displayName}
                    </span>
                    <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} color="#5A6478" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-full mt-3 w-56 rounded-2xl p-2 z-50 bg-white overflow-hidden"
                        style={{ border: "1px solid rgba(14,26,60,.1)", boxShadow: "var(--shadow-soft-lg)" }}
                      >
                        <div className="px-3 py-2.5 mb-1 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: "#0E1A3C" }}>{user.displayName}</p>
                            <p className="text-[11px] font-medium" style={{ color: "#5A6478" }}>@{user.robloxUsername}</p>
                          </div>
                          <StarIcon size={14} />
                        </div>
                        <div className="h-px mb-1" style={{ background: "rgba(14,26,60,.08)" }} />
                        <ProfileDropdownItem icon={<Edit3 size={14} />} label="Edit Profile"
                          onClick={() => { setProfileOpen(false); navigate("/profile"); }} />
                        {user.isAdmin && (
                          <ProfileDropdownItem icon={<ShieldCheck size={14} />} label="Admin Panel"
                            onClick={() => { setProfileOpen(false); navigate("/admin"); }} />
                        )}
                        <div className="h-px my-1" style={{ background: "rgba(14,26,60,.08)" }} />
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
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border bg-white/70 transition-colors hover:bg-white"
                  style={{ borderColor: "rgba(14,26,60,.18)", color: "#0E1A3C" }}
                >
                  <User size={14} /> Log In
                </motion.button>
              )}

              {/* Desktop Shop Now CTA */}
              <motion.button
                whileHover={{ scale: 1.04, y: -1, boxShadow: "0 12px 28px -8px rgba(43,80,246,.55)" }}
                whileTap={{ scale: 0.96 }}
                onClick={scrollToShop}
                className="btn3d hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm text-white"
                style={{ background: ROYAL }}
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
            style={{ background: "#0E1A3C" }}
          >
            <div className="absolute inset-0 pattern-grid-light pointer-events-none" />
            <motion.div
              className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(43,80,246,.25), transparent 70%)" }}
            />

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-6 flex-shrink-0 relative">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center gap-2.5 cursor-pointer">
                  <LogoMark size={30} />
                  <Wordmark tone="paper" />
                </div>
              </Link>
              <motion.button
                whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.92 }}
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center border"
                style={{ borderColor: "rgba(255,255,255,.25)", color: "#fff" }}
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Quick action */}
            <div className="px-5 mb-6 flex-shrink-0 relative">
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
                style={{ background: "#2B50F6", boxShadow: "0 10px 30px -8px rgba(43,80,246,.6)" }}
              >
                <ShoppingCart size={16} /> Browse Shop
              </motion.button>
            </div>

            {/* Section label */}
            <div className="px-5 mb-3 flex-shrink-0 relative">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: "rgba(255,255,255,.45)" }}>
                Games
              </p>
            </div>

            {/* Games list */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 relative">
              {gamesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-6 h-6 rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {games.map((game, i) => {
                    const c1 = game.gradient?.from || "#2B50F6";
                    const c2 = game.gradient?.to || "#0E1A3C";
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
                          border: tapped ? "2px solid #FFC53D" : "1px solid rgba(255,255,255,.16)",
                          aspectRatio: "1 / 1",
                          background: `linear-gradient(135deg,${c1},${c2})`,
                          transition: "border-color 0.2s ease",
                        }}
                      >
                        {game.imageUrl && <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />}
                        <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(to top,rgba(11,20,55,.9),transparent)" }} />
                        <span className="absolute bottom-2 left-2 right-2 text-white font-bold text-xs leading-tight text-left" style={{ textShadow: "0 1px 4px rgba(0,0,0,.7)" }}>
                          {game.name}
                        </span>
                        {tapped && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center rounded-2xl"
                            style={{ background: "rgba(11,20,55,.55)", backdropFilter: "blur(2px)" }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                              className="w-6 h-6 rounded-full border-2 border-t-transparent"
                              style={{ borderColor: "rgba(255,255,255,.4)", borderTopColor: "#fff" }} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auth section */}
            <div className="px-5 pb-8 flex-shrink-0 relative" style={{ borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 16 }}>
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)" }}>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "#2B50F6" }}>
                      {user.robloxAvatarUrl
                        ? <img src={user.robloxAvatarUrl} alt="" className="w-full h-full object-cover" />
                        : <User size={16} color="#fff" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-white">{user.displayName}</p>
                      <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,.55)" }}>@{user.robloxUsername}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 border"
                    style={{ background: "rgba(255,77,109,.1)", borderColor: "rgba(255,77,109,.35)", color: "#FF9DB0" }}
                  >
                    <LogOut size={14} /> Sign Out
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  data-testid="button-menu-login"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setMenuOpen(false); openAuthModal("login"); }}
                  className="w-full py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2 border"
                  style={{ background: "transparent", borderColor: "rgba(255,255,255,.4)" }}
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
      whileHover={{ x: 3 }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left"
      style={{ color: danger ? "#E23A63" : "#0E1A3C" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#EEF3FB")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {icon}{label}
    </motion.button>
  );
}
