import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Star, User, ShoppingCart, LogOut, Edit3, ChevronDown, ShieldCheck, Gamepad2, ArrowRight, Headphones, MessageSquare, Gift } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { P } from "@/lib/storefront";
import { RBstar } from "@/components/Art";
import CurrencyMenu from "@/components/CurrencyMenu";
import UserAvatar from "@/components/UserAvatar";

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
  label, onClick,
}: { label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200"
      style={{
        color: P.text,
        background: "transparent",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = P.accentTint;
      }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      {label}
    </motion.button>
  );
}

/* `dark` is still passed by App.tsx but is no longer read anywhere — the
   storefront is permanently light. Keep the prop accepted. */
export default function Navbar({ dark = false }: NavbarProps) {
  const [scrolled,      setScrolled]      = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [gamesOpen,     setGamesOpen]     = useState(false);
  const [supportOpen,   setSupportOpen]   = useState(false);
  const [gameSearch,    setGameSearch]    = useState("");
  const [location, navigate]              = useLocation();
  const { totalItems,   openCart }        = useCart();
  const { user, logout, openAuthModal }   = useAuth();
  const [cartBounce,    setCartBounce]    = useState(false);
  const [tappedGame,    setTappedGame]    = useState<string | null>(null);
  const [games,         setGames]         = useState<NavGame[]>([]);
  const [gamesLoading,  setGamesLoading]  = useState(false);
  const prevTotalRef = useState(totalItems);
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const gamesDropdownRef = useRef<HTMLDivElement>(null);
  const supportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = prevTotalRef[0];
    if (totalItems > prev) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 600);
      prevTotalRef[0] = totalItems;
      return () => clearTimeout(t);
    }
    // Always advance the baseline — otherwise a decrease after an increase
    // compared against a stale count and bounced the cart on item removal.
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
      if (gamesDropdownRef.current && !gamesDropdownRef.current.contains(e.target as Node)) {
        setGamesOpen(false);
        setGameSearch("");
      }
      if (supportDropdownRef.current && !supportDropdownRef.current.contains(e.target as Node)) {
        setSupportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Games are pulled by BOTH the desktop "Games" dropdown (gamesOpen) and the
  // mobile drawer (menuOpen) — the drawer renders `games` directly, so it must
  // trigger the fetch too or the mobile Games grid renders empty.
  useEffect(() => {
    if ((!gamesOpen && !menuOpen) || games.length > 0) return;
    setGamesLoading(true);
    fetch(`${BACKEND}/api/games?active=true`)
      .then(r => r.json())
      .then(d => setGames(d.data?.games || []))
      .catch(() => {})
      .finally(() => setGamesLoading(false));
  }, [gamesOpen, menuOpen]);

  function goToGame(slug: string) {
    setTappedGame(slug);
    setTimeout(() => {
      setTappedGame(null);
      setMenuOpen(false);
      navigate(`/game/${slug}`);
    }, 480);
  }

  /* Shop Now goes straight to the shop page. It used to look for a
     #shop-games anchor that exists nowhere and then fire an event into a ref
     that was never attached, so the button did literally nothing. */
  function goToShop() {
    setMenuOpen(false);
    navigate("/browse");
  }

  function scrollToHowItWorks() {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/");
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{ background: "rgba(27,39,69,0.86)", borderBottom: `1px solid ${P.border}` }}
      >
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
                style={{ borderColor: "rgba(47,140,255,0.25)", color: P.accentDeep, background: P.accentTint }}
              >
                <Menu size={20} />
              </motion.button>

              {/* Logo */}
              <Link href="/" data-testid="link-logo">
                <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-2 cursor-pointer select-none">
                  <img src="/rb-logo.png" alt="RBstars" className="w-11 h-11 object-contain" />
                </motion.div>
              </Link>

              {/* Desktop nav links */}
              <nav className="hidden md:flex items-center gap-0.5 ml-4">
                <DesktopNavLink label="How It Works" onClick={scrollToHowItWorks} />
                <DesktopNavLink label="Rewards" onClick={() => navigate("/profile")} />

                {/* Games dropdown */}
                <div ref={gamesDropdownRef} className="relative">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setGamesOpen(o => !o); setGameSearch(""); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                    style={{
                      background: location.startsWith("/game/")
                        ? P.accentTint
                        : P.band,
                      border: location.startsWith("/game/")
                        ? "1px solid rgba(47,140,255,0.3)"
                        : `1px solid ${P.border}`,
                      color: location.startsWith("/game/") ? P.accentDeep : P.text,
                    }}
                  >
                    {/* Current game's art instead of a static "?" — swaps as you
                        move between /game/:slug pages. Falls back to the game's
                        initial on its brand colour when it has no image. */}
                    {(() => {
                      const slug = location.replace("/game/", "");
                      const current = location.startsWith("/game/") ? games.find(g => g.slug === slug) : undefined;
                      return (
                        <>
                          <span
                            className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                            style={{
                              background: current ? current.gradient?.from : P.band,
                              border: current ? "1px solid rgba(47,140,255,0.3)" : `1px solid ${P.border}`,
                            }}
                          >
                            {current?.imageUrl ? (
                              <img src={current.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-black" style={{ color: current ? "#fff" : P.faint }}>
                                {current ? current.name.charAt(0) : "?"}
                              </span>
                            )}
                          </span>
                          {current ? current.name : "Select Game"}
                        </>
                      );
                    })()}
                    <motion.div animate={{ rotate: gamesOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {gamesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 top-full mt-2 w-72 rounded-2xl p-2 z-50"
                        style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}
                      >
                        {/* Search inside dropdown */}
                        <div className="relative px-2 pt-1 pb-2">
                          <input
                            type="text"
                            value={gameSearch}
                            onChange={e => setGameSearch(e.target.value)}
                            placeholder="Search games..."
                            autoFocus
                            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm font-medium outline-none"
                            style={{ background: P.band, border: `1px solid ${P.borderStrong}`, color: P.text }}
                          />
                          <svg className="absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.faint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                          </svg>
                        </div>
                        {/* Game list */}
                        <div className="max-h-64 overflow-y-auto">
                          {gamesLoading ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-8">
                              {/* Brand mark instead of a ring spinner — §5 loading state */}
                              <motion.div animate={{ scale: [1, 1.16, 1] }}
                                transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}>
                                <RBstar size={34} color={P.accent} />
                              </motion.div>
                              <p className="text-xs font-bold" style={{ color: P.muted }}>Loading games…</p>
                            </div>
                          ) : (
                            (() => {
                              const filtered = gameSearch.trim()
                                ? games.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
                                : games;
                              if (filtered.length === 0) {
                                return <p className="text-center text-xs py-6" style={{ color: P.faint }}>No games found</p>;
                              }
                              return filtered.map(game => (
                                <motion.button
                                  key={game._id}
                                  whileHover={{ backgroundColor: P.accentTint }}
                                  onClick={() => { setGamesOpen(false); setGameSearch(""); navigate("/game/" + game.slug); }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                                    style={{ background: game.gradient?.from || P.accent }}>
                                    {game.imageUrl && <img src={game.imageUrl} alt="" className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate" style={{ color: P.text }}>{game.name}</p>
                                    <p className="text-[10px] font-medium" style={{ color: P.faint }}>Browse items</p>
                                  </div>
                                  <ArrowRight size={12} color={P.faint} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100" />
                                </motion.button>
                              ));
                            })()
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              {/* Support dropdown */}
              <div ref={supportDropdownRef} className="relative hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSupportOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: supportOpen ? P.accentDeep : P.text,
                  }}
                >
                  <MessageSquare size={15} />
                  Support
                  <motion.div animate={{ rotate: supportOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={13} />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {supportOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 z-50"
                      style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}
                    >
                      <motion.button
                        whileHover={{ backgroundColor: P.accentTint }}
                        onClick={() => {
                          setSupportOpen(false);
                          navigate("/claim-chat");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                      >
                        <div className="flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img src="/chat-icon.png" alt="" className="w-6 h-6 object-contain" />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: P.text }}>Claim Chat</p>
                          <p className="text-[10px]" style={{ color: P.faint }}>Deliver your order items</p>
                        </div>
                      </motion.button>
                      <div className="h-px my-1" style={{ background: P.border }} />
                      <motion.button
                        whileHover={{ backgroundColor: P.accentTint }}
                        onClick={() => {
                          setSupportOpen(false);
                          navigate("/tickets");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                      >
                        <div className="flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img src="/IMG_0732.png" alt="" className="w-6 h-6 object-contain" />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: P.text }}>Tickets</p>
                          <p className="text-[10px]" style={{ color: P.faint }}>Get help with any issue</p>
                        </div>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Right group: profile + desktop CTA + cart ── */}
            <div className="flex items-center gap-2">

              {/* Profile / Login */}
              {user ? (
                <div ref={dropdownRef} className="relative">
                  <motion.button
                    data-testid="button-profile"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setProfileOpen(o => !o)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200"
                    style={{ background: P.accentTint, border: "1.5px solid rgba(47,140,255,0.22)" }}
                  >
                    <UserAvatar name={user.displayName} src={user.robloxAvatarUrl} size={28} ring={false} />
                    <span className="text-[13px] font-bold max-w-[90px] truncate" style={{ color: P.text }}>
                      {user.displayName}
                    </span>
                    <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} color={P.text} />
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
                        style={{ background: P.card, border: `1.5px solid ${P.border}`, boxShadow: P.shadow }}
                      >
                        <div className="px-3 py-2.5 mb-1">
                          <p className="text-sm font-extrabold truncate" style={{ color: P.text }}>{user.displayName}</p>
                          <p className="text-[11px]" style={{ color: P.accentDeep }}>@{user.robloxUsername}</p>
                        </div>
                        <div className="h-px mb-1" style={{ background: P.border }} />
                        <ProfileDropdownItem icon={<Edit3 size={14} />} label="Edit Profile"
                          onClick={() => { setProfileOpen(false); navigate("/profile"); }} />
                        {/* Customers never have an admin panel — the old
                            user.isAdmin check referenced a field that doesn't
                            exist on CustomerUser, so this was dead code. */}
                        <div className="h-px my-1" style={{ background: P.border }} />
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
                  style={{ background: P.accentTint, border: "1.5px solid rgba(47,140,255,0.22)", color: P.text }}
                >
                  <User size={14} /> Log In
                </motion.button>
              )}

              {/* Display currency — the same control the footer uses, driven
                  by one context, so both always agree. Display only: the
                  card is charged in USD. */}
              <div className="hidden md:block">
                <CurrencyMenu variant="nav" direction="down" />
              </div>

              {/* Desktop Shop Now CTA */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: P.shadow }}
                whileTap={{ scale: 0.96 }}
                onClick={goToShop}
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white"
                style={{ background: P.accentDeep }}
              >
                <ShoppingCart size={14} /> Shop Now
              </motion.button>

              {/* Cart */}
              <motion.button
                data-testid="button-cart"
                animate={cartBounce ? { scale: [1, 1.35, 0.88, 1.12, 1] } : {}}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={openCart}
                className="relative w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ background: P.accentTint, border: "1.5px solid rgba(47,140,255,0.18)" }}
              >
                {/* one small bounce each time something lands in the cart */}
                <span key={totalItems} className={totalItems > 0 ? "pk-bump" : ""}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke={P.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="20" r="1.5" fill={P.accent}/>
                    <circle cx="17" cy="20" r="1.5" fill={P.accent}/>
                    <circle cx="10" cy="8.5" r="1" fill={P.text}/>
                    <circle cx="14.5" cy="8.5" r="1" fill={P.text}/>
                    <path d="M10 11c.8.8 3.2.8 4 0" stroke={P.text} strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white"
                      style={{ background: P.accentDeep, boxShadow: P.shadow }}
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
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
            /* Scrollable: on a landscape phone the drawer's stacked sections
               (~620px) exceed the viewport, and an `overflow-hidden` drawer
               clips the auth block — including the only Log Out button —
               somewhere the user can never reach. */
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto overscroll-contain"
            style={{ background: P.card }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-6 flex-shrink-0">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <img src="/rb-logo.png" alt="RBstars" className="w-11 h-11 object-contain" />
                </div>
              </Link>
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: P.band, border: `1px solid ${P.border}` }}
              >
                <X size={18} color={P.text} />
              </motion.button>
            </div>

            {/* Quick action buttons */}
            <div className="px-5 mb-6 flex flex-col gap-3 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={goToShop}
                className="w-full py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2"
                style={{ background: P.accentDeep }}
              >
                <ShoppingCart size={16} /> Browse Shop
              </motion.button>
            </div>

            {/* Section label */}
            <div className="px-5 mb-3 flex-shrink-0">
              <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: P.accentDeep }}>
                Rewards
              </p>
            </div>

            {/* Rewards — daily spin wheel (replaces the old in-drawer Games grid;
                games are still one tap away via "Browse Shop" above) */}
            <div className="px-5 mb-6 flex flex-col gap-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                className="w-full py-3.5 rounded-xl font-bold flex items-center gap-3 text-left"
                style={{ background: P.accentTint, border: "1px solid rgba(47,140,255,0.3)", color: P.text }}
              >
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: P.accentDeep }}>
                  <Gift size={15} color="white" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold">Rewards</span>
                  <span className="block text-[10px] font-medium" style={{ color: P.muted }}>Spin the wheel — win up to 30% OFF</span>
                </span>
                <ArrowRight size={15} color={P.accentDeep} />
              </motion.button>
            </div>

            {/* Support section */}
            <div className="px-5 mb-3 flex-shrink-0">
              <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: P.accentDeep }}>
                Support
              </p>
            </div>
            <div className="px-5 mb-6 flex flex-col gap-2 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/claim-chat");
                }}
                className="w-full py-3 rounded-xl font-bold flex items-center gap-3 text-left"
                style={{ background: P.accentTint, border: "1px solid rgba(47,140,255,0.2)", color: P.text }}
              >
                <img src="/chat-icon.png" alt="" className="w-6 h-6 object-contain" />
                <div>
                  <p className="text-sm font-bold">Claim Chat</p>
                  <p className="text-[10px]" style={{ color: P.faint }}>Deliver your order items</p>
                </div>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/tickets");
                }}
                className="w-full py-3 rounded-xl font-bold flex items-center gap-3 text-left"
                style={{ background: "rgba(255,197,61,0.08)", border: "1px solid rgba(255,197,61,0.2)", color: P.text }}
              >
                <img src="/IMG_0732.png" alt="" className="w-6 h-6 object-contain" />
                <div>
                  <p className="text-sm font-bold">Tickets</p>
                  <p className="text-[10px]" style={{ color: P.faint }}>Get help with any issue</p>
                </div>
              </motion.button>
            </div>

            {/* Currency — display only; the card is always charged in USD */}
            <div className="px-5 mb-3 flex-shrink-0">
              <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: P.accentDeep }}>
                Currency
              </p>
            </div>
            <div className="px-5 mb-6 flex-shrink-0">
              <CurrencyMenu />
            </div>

            {/* Auth section */}
            <div className="px-5 pb-8 flex-shrink-0 border-t" style={{ borderColor: P.border, paddingTop: 16 }}>
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-2xl" style={{ background: P.band }}>
                    <UserAvatar name={user.displayName} src={user.robloxAvatarUrl} size={36} ring={false} />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold truncate" style={{ color: P.text }}>{user.displayName}</p>
                      <p className="text-[11px]" style={{ color: P.accentDeep }}>@{user.robloxUsername}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: P.badTint, border: "1.5px solid rgba(248,113,113,0.2)", color: P.bad }}
                  >
                    <LogOut size={14} /> Sign Out
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  data-testid="button-menu-login"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setMenuOpen(false); openAuthModal("login"); }}
                  className="w-full py-3.5 rounded-full font-bold flex items-center justify-center gap-2"
                  style={{ background: P.accentTint, border: "1.5px solid rgba(47,140,255,0.3)", color: P.accentDeep }}
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
      whileHover={{ backgroundColor: danger ? P.badTint : P.accentTint }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left"
      style={{ color: danger ? P.bad : P.accentDeep }}
    >
      {icon}{label}
    </motion.button>
  );
}
