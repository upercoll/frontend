import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, LogOut, Edit3, ChevronDown, ShieldCheck, User } from "lucide-react";
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

/* ── Brand mark: tilted Roblox-style block ── */
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="14" y="14" width="36" height="36" rx="7" transform="rotate(12 32 32)" fill="#E2231A" />
      <rect x="26.5" y="26.5" width="11" height="11" rx="2.5" transform="rotate(12 32 32)" fill="#F2EEE5" />
    </svg>
  );
}

function Wordmark({ tone }: { tone: "ink" | "paper" }) {
  const base = tone === "ink" ? "#131313" : "#F2EEE5";
  return (
    <span className="font-display text-xl leading-none tracking-wide select-none" style={{ color: base }}>
      RB<span style={{ color: "#E2231A" }}>STARS</span>
    </span>
  );
}

/* ── Desktop nav link ───────────────────────────────────── */
function DesktopNavLink({
  label, onClick, lightMode,
}: { label: string; onClick: () => void; lightMode: boolean }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="group relative px-3 py-1.5 font-mono text-[12px] font-medium uppercase tracking-[0.16em] transition-colors duration-200"
      style={{ color: lightMode ? "#131313" : "#F2EEE5" }}
    >
      {label}
      <span
        className="absolute inset-x-3 bottom-0.5 h-[2.5px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: "#E2231A" }}
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

  /* Storefront pages are all light now — paper chrome once scrolled */
  void dark;
  const lightMode = scrolled;

  const circleBtn = (active: boolean) =>
    active
      ? { borderColor: "rgba(19,19,19,.75)", color: "#131313", background: "transparent" }
      : { borderColor: "rgba(19,19,19,.55)", color: "#131313", background: "rgba(255,255,255,.35)" };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          lightMode
            ? "bg-[#F2EEE5]/95 backdrop-blur-md"
            : "bg-transparent"
        }`}
        style={lightMode ? { borderBottom: "2.5px solid #131313" } : {}}
      >
        {/* Promo banner */}
        <div
          className="relative overflow-hidden text-center py-2 px-4"
          style={{ background: "#E2231A", borderBottom: lightMode ? "none" : "2.5px solid #131313" }}
        >
          <p className="relative font-mono text-[11px] sm:text-xs font-medium uppercase tracking-[0.18em] text-white">
            <span className="tilt-sq mr-2 !bg-[#FFC800]" />
            Use code{" "}
            <span className="inline-block bg-[#FFC800] px-1.5 py-0.5 mx-0.5 rounded border-2 border-[#131313] font-bold normal-case tracking-normal" style={{ color: "#131313" }}>
              RBSTARS10
            </span>{" "}
            for 10% off your order
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
                style={circleBtn(lightMode)}
              >
                <Menu size={20} />
              </motion.button>

              {/* Logo */}
              <Link href="/" data-testid="link-logo">
                <motion.div whileHover={{ scale: 1.04, rotate: -1 }} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <LogoMark size={30} />
                  <Wordmark tone="ink" />
                </motion.div>
              </Link>

              {/* Desktop nav links */}
              <nav className="hidden md:flex items-center gap-2 ml-5">
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
                whileHover={{ scale: 1.06, rotate: -3 }}
                whileTap={{ scale: 0.92 }}
                onClick={openCart}
                className="relative w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-200"
                style={lightMode ? circleBtn(true) : { ...circleBtn(false), borderColor: "#131313" }}
              >
                <ShoppingCart size={18} />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#131313]"
                      style={{ background: "#E2231A" }}
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
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border-2 transition-all duration-200"
                    style={{
                      borderColor: "#131313",
                      background: "#FFFFFF",
                      boxShadow: profileOpen ? "3px 3px 0 #131313" : "none",
                    }}
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#131313]" style={{ background: "#E7E1D2" }}>
                      {user.robloxAvatarUrl
                        ? <img src={user.robloxAvatarUrl} alt="" className="w-full h-full object-cover" />
                        : <User size={13} color="#131313" />
                      }
                    </div>
                    <span className="text-[13px] font-bold max-w-[90px] truncate" style={{ color: "#131313" }}>
                      {user.displayName}
                    </span>
                    <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} color="#131313" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-full mt-3 w-56 rounded-2xl p-2 z-50 bg-white"
                        style={{ border: "2px solid #131313", boxShadow: "6px 6px 0 #131313" }}
                      >
                        <div className="px-3 py-2.5 mb-1 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: "#131313" }}>{user.displayName}</p>
                            <p className="text-[11px] font-mono" style={{ color: "#6B655C" }}>@{user.robloxUsername}</p>
                          </div>
                          <span className="tilt-sq" />
                        </div>
                        <div className="h-[2px] mb-1" style={{ background: "#131313" }} />
                        <ProfileDropdownItem icon={<Edit3 size={14} />} label="Edit Profile"
                          onClick={() => { setProfileOpen(false); navigate("/profile"); }} />
                        {user.isAdmin && (
                          <ProfileDropdownItem icon={<ShieldCheck size={14} />} label="Admin Panel"
                            onClick={() => { setProfileOpen(false); navigate("/admin"); }} />
                        )}
                        <div className="h-[2px] my-1" style={{ background: "#131313" }} />
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
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all"
                  style={{ borderColor: "#131313", color: "#131313", background: "#FFFFFF" }}
                >
                  <User size={14} /> Log In
                </motion.button>
              )}

              {/* Desktop Shop Now CTA */}
              <motion.button
                whileHover={{ scale: 1.05, translateX: -1, translateY: -1, boxShadow: "5px 5px 0 #131313" }}
                whileTap={{ scale: 0.96, translateX: 2, translateY: 2, boxShadow: "1px 1px 0 #131313" }}
                onClick={scrollToShop}
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white border-2"
                style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "3px 3px 0 #131313" }}
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
            style={{ background: "#131313" }}
          >
            <div className="absolute inset-0 pattern-dots-light pointer-events-none opacity-60" />

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
                className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: "rgba(242,238,229,.4)", color: "#F2EEE5" }}
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Quick action buttons */}
            <div className="px-5 mb-6 flex flex-col gap-3 flex-shrink-0 relative">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setMenuOpen(false);
                  setTimeout(() => {
                    const el = document.getElementById("shop-games");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 350);
                }}
                className="w-full py-3.5 rounded-full font-mono font-semibold uppercase tracking-[0.14em] text-sm text-white flex items-center justify-center gap-2 border-2"
                style={{ background: "#E2231A", borderColor: "#F2EEE5", boxShadow: "4px 4px 0 rgba(242,238,229,.9)" }}
              >
                <ShoppingCart size={16} /> Browse Shop
              </motion.button>
            </div>

            {/* Section label */}
            <div className="px-5 mb-3 flex-shrink-0 relative">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(242,238,229,.45)" }}>
                Games
              </p>
            </div>

            {/* Games list */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 relative">
              {gamesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-6 h-6 rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "rgba(242,238,229,.3)", borderTopColor: "#F2EEE5" }} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {games.map((game, i) => {
                    const c1 = game.gradient?.from || "#E2231A";
                    const tapped = tappedGame === game.slug;
                    return (
                      <motion.button
                        key={game._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => goToGame(game.slug)}
                        className="relative flex flex-col rounded-xl overflow-hidden"
                        style={{
                          border: tapped ? "3px solid #E2231A" : "2px solid rgba(242,238,229,.18)",
                          aspectRatio: "1 / 1",
                          background: c1,
                          transition: "border-color 0.2s ease",
                        }}
                      >
                        <div className="absolute inset-0 pattern-dots-light opacity-70" />
                        {game.imageUrl && <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-70" />}
                        <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(to top,rgba(19,19,19,.85),transparent)" }} />
                        <span className="absolute bottom-2 left-2 right-2 text-[#F2EEE5] font-bold text-xs leading-tight text-left" style={{ textShadow: "0 1px 3px rgba(0,0,0,.9)" }}>
                          {game.name}
                        </span>
                        {tapped && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center rounded-xl"
                            style={{ background: "rgba(19,19,19,.5)", backdropFilter: "blur(2px)" }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                              className="w-6 h-6 rounded-full border-2 border-t-transparent"
                              style={{ borderColor: "rgba(242,238,229,.4)", borderTopColor: "#F2EEE5" }} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auth section */}
            <div className="px-5 pb-8 flex-shrink-0 relative" style={{ borderTop: "2px solid rgba(242,238,229,.12)", paddingTop: 16 }}>
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl border-2" style={{ borderColor: "rgba(242,238,229,.15)" }}>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "#E2231A" }}>
                      {user.robloxAvatarUrl
                        ? <img src={user.robloxAvatarUrl} alt="" className="w-full h-full object-cover" />
                        : <User size={16} color="#fff" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#F2EEE5" }}>{user.displayName}</p>
                      <p className="text-[11px] font-mono" style={{ color: "rgba(242,238,229,.55)" }}>@{user.robloxUsername}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full py-3 rounded-full font-mono font-semibold uppercase tracking-[0.14em] text-sm flex items-center justify-center gap-2 border-2"
                    style={{ background: "rgba(226,35,26,.12)", borderColor: "#E2231A", color: "#ff8a82" }}
                  >
                    <LogOut size={14} /> Sign Out
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  data-testid="button-menu-login"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setMenuOpen(false); openAuthModal("login"); }}
                  className="w-full py-3.5 rounded-full font-mono font-semibold uppercase tracking-[0.14em] text-sm text-white flex items-center justify-center gap-2 border-2"
                  style={{ background: "transparent", borderColor: "#F2EEE5" }}
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
      style={{
        color: danger ? "#E2231A" : "#131313",
        background: "transparent",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#F2EEE5")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {icon}{label}
    </motion.button>
  );
}
