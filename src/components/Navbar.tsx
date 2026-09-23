import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Star, User, ShoppingCart, LogOut, Edit3, ChevronDown, ShieldCheck, Gamepad2, ArrowRight, Headphones, MessageSquare } from "lucide-react";
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
        color: lightMode ? "#1C2A34" : "rgba(255,255,255,0.85)",
        background: "transparent",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = lightMode
          ? "rgba(59,167,255,0.08)"
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

  useEffect(() => {
    if (!gamesOpen || games.length > 0) return;
    setGamesLoading(true);
    fetch(`${BACKEND}/api/games?active=true`)
      .then(r => r.json())
      .then(d => setGames(d.data?.games || []))
      .catch(() => {})
      .finally(() => setGamesLoading(false));
  }, [gamesOpen]);

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

  const lightMode = false;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{ background: "#131C23", borderBottom: "1px solid #2C414E" }}
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
                style={lightMode
                  ? { borderColor: "rgba(59,167,255,0.25)", color: "#3BA7FF", background: "rgba(59,167,255,0.04)" }
                  : { borderColor: "rgba(255,255,255,0.3)", color: "white" }
                }
              >
                <Menu size={20} />
              </motion.button>

              {/* Logo */}
              <Link href="/" data-testid="link-logo">
                <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
                    <Star size={16} fill="#3BA7FF" color="#3BA7FF" />
                  </div>
                  <span className="text-xl font-bold tracking-tight transition-colors duration-300" style={{ color: lightMode ? "#131C23" : "white" }}>
                    RB<span style={{ color: lightMode ? "#3BA7FF" : "#3BA7FF" }}>stars</span>
                  </span>
                </motion.div>
              </Link>

              {/* Desktop nav links */}
              <nav className="hidden md:flex items-center gap-0.5 ml-4">
                <DesktopNavLink label="How It Works" onClick={scrollToHowItWorks} lightMode={lightMode} />

                {/* Games dropdown */}
                <div ref={gamesDropdownRef} className="relative">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setGamesOpen(o => !o); setGameSearch(""); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                    style={{
                      background: location.startsWith("/game/")
                        ? "rgba(59,167,255,0.15)"
                        : "rgba(255,255,255,0.07)",
                      border: location.startsWith("/game/")
                        ? "1px solid rgba(59,167,255,0.3)"
                        : "1px solid rgba(255,255,255,0.12)",
                      color: location.startsWith("/game/") ? "#3BA7FF" : "rgba(255,255,255,0.85)",
                    }}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>?</span>
                    {(() => {
                      const slug = location.replace("/game/", "");
                      const current = games.find(g => g.slug === slug);
                      return current ? current.name : "Select Game";
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
                        style={{ background: "#131C23", border: "1px solid #2C414E", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
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
                            style={{ background: "#1C2A34", border: "1px solid #2C414E", color: "#F4F8FB" }}
                          />
                          <svg className="absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#637784" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                          </svg>
                        </div>
                        {/* Game list */}
                        <div className="max-h-64 overflow-y-auto">
                          {gamesLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2C414E", borderTopColor: "#3BA7FF" }} />
                            </div>
                          ) : (
                            (() => {
                              const filtered = gameSearch.trim()
                                ? games.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
                                : games;
                              if (filtered.length === 0) {
                                return <p className="text-center text-xs py-6" style={{ color: "#637784" }}>No games found</p>;
                              }
                              return filtered.map(game => (
                                <motion.button
                                  key={game._id}
                                  whileHover={{ backgroundColor: "rgba(59,167,255,0.1)" }}
                                  onClick={() => { setGamesOpen(false); setGameSearch(""); navigate("/game/" + game.slug); }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                                    style={{ background: game.gradient?.from || "#3BA7FF" }}>
                                    {game.imageUrl && <img src={game.imageUrl} alt="" className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate" style={{ color: "#F4F8FB" }}>{game.name}</p>
                                    <p className="text-[10px] font-medium" style={{ color: "#637784" }}>Browse items</p>
                                  </div>
                                  <ArrowRight size={12} color="#637784" className="ml-auto shrink-0 opacity-0 group-hover:opacity-100" />
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
                    color: supportOpen ? "#3BA7FF" : "rgba(255,255,255,0.85)",
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
                      style={{ background: "#131C23", border: "1px solid #2C414E", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
                    >
                      <motion.button
                        whileHover={{ backgroundColor: "rgba(59,167,255,0.1)" }}
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
                          <p className="text-sm font-bold" style={{ color: "#F4F8FB" }}>Claim Chat</p>
                          <p className="text-[10px]" style={{ color: "#637784" }}>Deliver your order items</p>
                        </div>
                      </motion.button>
                      <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <motion.button
                        whileHover={{ backgroundColor: "rgba(59,167,255,0.1)" }}
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
                          <p className="text-sm font-bold" style={{ color: "#F4F8FB" }}>Tickets</p>
                          <p className="text-[10px]" style={{ color: "#637784" }}>Get help with any issue</p>
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
                    style={lightMode
                      ? { background: "rgba(59,167,255,0.08)", border: "1.5px solid rgba(59,167,255,0.22)" }
                      : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.18)" }
                    }
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: "#1C2A34" }}>
                      {user.robloxAvatarUrl
                        ? <img src={user.robloxAvatarUrl} alt="" className="w-full h-full object-cover" />
                        : <User size={13} color="white" />
                      }
                    </div>
                    <span className="text-[13px] font-bold max-w-[90px] truncate" style={{ color: lightMode ? "#131C23" : "white" }}>
                      {user.displayName}
                    </span>
                    <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} color={lightMode ? "#1C2A34" : "rgba(255,255,255,0.6)"} />
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
                        style={{ background: "#1a1730", border: "1.5px solid rgba(59,167,255,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
                      >
                        <div className="px-3 py-2.5 mb-1">
                          <p className="text-sm font-extrabold text-white truncate">{user.displayName}</p>
                          <p className="text-[11px]" style={{ color: "#3BA7FF" }}>@{user.robloxUsername}</p>
                        </div>
                        <div className="h-px mb-1" style={{ background: "rgba(59,167,255,0.1)" }} />
                        <ProfileDropdownItem icon={<Edit3 size={14} />} label="Edit Profile"
                          onClick={() => { setProfileOpen(false); navigate("/profile"); }} />
                        {user.isAdmin && (
                          <ProfileDropdownItem icon={<ShieldCheck size={14} />} label="Admin Panel"
                            onClick={() => { setProfileOpen(false); navigate("/admin"); }} />
                        )}
                        <div className="h-px my-1" style={{ background: "rgba(59,167,255,0.1)" }} />
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
                    ? { background: "rgba(59,167,255,0.08)", border: "1.5px solid rgba(59,167,255,0.22)", color: "#1C2A34" }
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
                style={{ background: "#3BA7FF" }}
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
                style={lightMode
                  ? { background: "rgba(59,167,255,0.07)", border: "1.5px solid rgba(59,167,255,0.18)" }
                  : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)" }
                }
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke={lightMode ? "#1C2A34" : "white"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="20" r="1.5" fill="#3BA7FF"/>
                  <circle cx="17" cy="20" r="1.5" fill="#3BA7FF"/>
                  <circle cx="10" cy="8.5" r="1" fill={lightMode ? "#1C2A34" : "white"}/>
                  <circle cx="14.5" cy="8.5" r="1" fill={lightMode ? "#1C2A34" : "white"}/>
                  <path d="M10 11c.8.8 3.2.8 4 0" stroke={lightMode ? "#1C2A34" : "white"} strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
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
            style={{ background: "#131C23" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-6 flex-shrink-0">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#1C2A34" }}>
                    <Star size={16} fill="white" color="white" />
                  </div>
                  <span className="text-xl font-bold text-white">
                    RB<span style={{ color: "#3BA7FF" }}>stars</span>
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
                style={{ background: "#3BA7FF" }}
              >
                <ShoppingCart size={16} /> Browse Shop
              </motion.button>
            </div>

            {/* Section label */}
            <div className="px-5 mb-3 flex-shrink-0">
              <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "rgba(59,167,255,0.5)" }}>
                Games
              </p>
            </div>

            {/* Games list */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {gamesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-6 h-6 rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "rgba(59,167,255,0.3)", borderTopColor: "#3BA7FF" }} />
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
                          border: tapped ? `2px solid ${c1}` : "1.5px solid rgba(59,167,255,0.12)",
                          aspectRatio: "1 / 1",
                          transition: "border-color 0.2s ease",
                        }}
                      >
                        <div className="absolute inset-0" style={{ background: c1 }} />
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

            {/* Support section */}
            <div className="px-5 mb-3 flex-shrink-0">
              <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "rgba(59,167,255,0.5)" }}>
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
                className="w-full py-3 rounded-xl font-bold text-white flex items-center gap-3 text-left"
                style={{ background: "rgba(59,167,255,0.1)", border: "1px solid rgba(59,167,255,0.2)" }}
              >
                <img src="/chat-icon.png" alt="" className="w-6 h-6 object-contain" />
                <div>
                  <p className="text-sm font-bold">Claim Chat</p>
                  <p className="text-[10px]" style={{ color: "#637784" }}>Deliver your order items</p>
                </div>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/tickets");
                }}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center gap-3 text-left"
                style={{ background: "rgba(255,197,61,0.08)", border: "1px solid rgba(255,197,61,0.2)" }}
              >
                <img src="/IMG_0732.png" alt="" className="w-6 h-6 object-contain" />
                <div>
                  <p className="text-sm font-bold">Tickets</p>
                  <p className="text-[10px]" style={{ color: "#637784" }}>Get help with any issue</p>
                </div>
              </motion.button>
            </div>

            {/* Auth section */}
            <div className="px-5 pb-8 flex-shrink-0 border-t" style={{ borderColor: "rgba(59,167,255,0.1)", paddingTop: 16 }}>
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: "#1C2A34" }}>
                      {user.robloxAvatarUrl
                        ? <img src={user.robloxAvatarUrl} alt="" className="w-full h-full object-cover" />
                        : <User size={16} color="white" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-white truncate">{user.displayName}</p>
                      <p className="text-[11px]" style={{ color: "#3BA7FF" }}>@{user.robloxUsername}</p>
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
                  style={{ background: "#1C2A34" }}
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
      whileHover={{ backgroundColor: danger ? "rgba(248,113,113,0.08)" : "rgba(59,167,255,0.15)" }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left"
      style={{ color: danger ? "#fca5a5" : "#3BA7FF" }}
    >
      {icon}{label}
    </motion.button>
  );
}
