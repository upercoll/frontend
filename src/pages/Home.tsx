import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Store, PackageSearch, ShoppingBag, UserPlus, LogIn,
  ChevronRight, Star, Plus, Minus, Box, Wallet, Users, Zap,
  ShoppingCart, ShieldCheck, Instagram, Twitter, Youtube, Music2, MessageCircle, Play,
  Menu, X, LifeBuoy, ChevronDown, Gamepad2, Gift, MessageSquare,
} from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { RBstar } from "@/components/Art";
import ProductCard, { ProductCardSkeleton, type CardProduct } from "@/components/ProductCard";
import { fetchLiveStats, fetchActivity, groupNum, type LiveStats, type StoreActivity, type ActivityGame } from "@/lib/liveStats";
import { usePublicStats, formatCount } from "@/hooks/usePublicStats";
import { usePublicReviews, timeAgo, type PublicReview } from "@/hooks/usePublicReviews";

/* ══════════════════════════════════════════════════════════════════════════
   HOME — ported from the RoGoat reference layout (dark navy marketplace).
   Structure, spacing, type scale and components follow the reference;
   branding, copy and data are RBstars. Real products, games, buyer reviews
   and storefront counters all come from the API — nothing numeric or
   testimonial on this page is invented. Only the FAQ wording is design copy.
   ══════════════════════════════════════════════════════════════════════════ */

export const C = {
  bg: "#121a2e",
  card: "#1c2e4f",
  card2: "#1a2848",
  border: "#2b3c66",
  borderSoft: "#2d3a62",
  text: "#ffffff",
  muted: "#a9b3d3",
  faint: "#8794b8",
  blue: "#0a84ff",
  blueDeep: "#0a50d6",
  green: "#5fe08e",
  greenBright: "#6cf29b",
  starOn: "#22c55e",
  starOff: "#4b5878",
  orange: "#f2792e",
  footerBg: "#0e1527",
};

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";
const A = "/rogoat/";

/* ── Types ─────────────────────────────────────────────────────────────── */

type ShopGame = {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  gradient?: { from: string; to: string };
};

type ApiProduct = {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  salesCount?: number;
  imageUrl?: string;
  images?: string[];
  gradient?: { from: string; to: string };
  game: string;
  stock?: number;
  bestSeller?: boolean;
  outOfStock?: boolean;
};

/* ── Fetch with backoff — Render sleeps and can take ~30s to wake ──────── */

async function fetchJSON(url: string, rounds = 3): Promise<any | null> {
  for (let round = 1; round <= rounds; round++) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data) return data;
    } catch { /* retry */ }
    if (round < rounds) await new Promise(r => setTimeout(r, 700 * round));
  }
  return null;
}

const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;

/* ── Design content from the reference (FAQ) ─────────────────────────── */
/* Only the FAQ wording is reference copy — it makes no numeric claim.
   The marquee below the reviews heading is NOT here: it renders the store's
   real buyer reviews (GET /api/claims/public-reviews), never filler. */

const FAQS = [
  {
    q: "Is RBstars a trusted place to buy game items?",
    a: "Yes! RBstars is a trusted and secure platform with thousands of successful transactions. Our safe payment methods, reliable order fulfilment, and dedicated support team ensure a smooth and risk-free shopping experience. Players worldwide rely on RBstars for fast, reliable and guaranteed game item purchases.",
  },
  {
    q: "What is your refund policy?",
    a: "Since all items are digital goods, we do not offer refunds once an order has been delivered. However, if there is an issue—such as an item not being received due to an error on our end—our support team is available 24/7 to assist. If a refund is necessary, it will be processed according to our policy.",
  },
  {
    q: "Can I get free items?",
    a: "We run regular promotions, bonus events and giveaways for our community. Keep an eye on our announcements and social media channels to catch free item events and discount codes.",
  },
  {
    q: "How do I receive my purchased items?",
    a: "After checkout, simply confirm your Roblox username. Our delivery bot then sends your items straight to your in-game mailbox, and you can follow the status of your order from your profile.",
  },
  {
    q: "What if I don't receive my items after purchasing?",
    a: "Contact our support team 24/7 via live chat or a support ticket with your order reference. We investigate every case and make sure you receive your items or get a resolution.",
  },
];

const SEO_BLOCKS = [
  {
    h: "What is RBstars and why is the best place to buy game items?",
    p: "RBstars is the leading online marketplace for in-game items, offering unbeatable prices and a secure shopping experience. Players trust RBstars for rare weapons, exclusive skins, and premium in-game items across multiple popular titles. Whether you're looking for Jailbreak weapons or other rare items, RBstars provides a fast, secure, and affordable way to upgrade your inventory.",
  },
  {
    h: "What types of game items can I buy on RBstars?",
    p: "From powerful weapons and knives to rare cosmetics and limited items, RBstars stocks a huge range of in-game items across the games we support. Every item is sourced and delivered through our secure system, so you can shop with confidence knowing your purchase is protected from start to finish.",
  },
  {
    h: "How does RBstars deliver game items?",
    p: "Confirm your Roblox username at checkout and our delivery system sends your items straight to your in-game mailbox. You can follow the status of every order from your profile, and our support team is available 24/7 if anything needs checking.",
  },
];

/* ── Reveal helper — respects reduced motion ───────────────────────────── */

export function Reveal({ children, delay = 0, className, style }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      {...(reduce ? {} : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay },
      })}
    >
      {children}
    </motion.div>
  );
}

/* ── Top navigation (reference chrome, RBstars branding) ────────────────── */

/* One row inside a category dropdown. Icon, label, and a one-line note —
   used by Shop and Support so both read identically. */
function MenuItem({
  icon, title, note, onClick,
}: { icon: React.ReactNode; title: string; note: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#22335c]"
    >
      <span className="w-6 h-6 shrink-0 grid place-items-center">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold" style={{ color: C.text }}>{title}</span>
        <span className="block text-[10px]" style={{ color: C.faint }}>{note}</span>
      </span>
    </button>
  );
}

export function TopNav({ onHome }: { onHome: () => void }) {
  const [location, navigate] = useLocation();
  const { totalItems, openCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  /* The header is three CATEGORIES, not six loose links — each opens a
     dropdown of sub-items. A single `openMenu` keeps them mutually
     exclusive, so clicking Games while Shop is open swaps panels rather
     than stacking two. */
  const [openMenu,     setOpenMenu]     = useState<null | "shop" | "games" | "support">(null);
  const [gameSearch,   setGameSearch]   = useState("");
  const [games,        setGames]        = useState<ShopGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  /* close the mobile menu whenever the route changes */
  useEffect(() => { setMenuOpen(false); }, [location]);

  /* Any click outside the nav closes whichever category is open */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setGameSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Games are pulled on demand — once loaded, never refetched. The desktop
     Games category and the mobile drawer both render them, so both open
     states have to trigger it or the mobile list renders empty. */
  useEffect(() => {
    if (games.length > 0) return;
    if (openMenu !== "games" && !menuOpen) return;
    setGamesLoading(true);
    fetch(`${BACKEND}/api/games?active=true`)
      .then(r => r.json())
      .then(d => setGames(d.data?.games || []))
      .catch(() => {})
      .finally(() => setGamesLoading(false));
  }, [openMenu, menuOpen, games.length]);

  /* Open a category — or close it if it's already the open one */
  function toggleMenu(m: "shop" | "games" | "support") {
    setOpenMenu(prev => (prev === m ? null : m));
    if (m !== "games") setGameSearch("");
  }

  /* "How It Works" is a section, not a page — scroll when we're already on
     home, navigate when we're anywhere else. */
  function scrollToHowItWorks() {
    const el = document.getElementById("how-it-works");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else navigate("/");
  }

  /* Each category trigger is a padded control, not bare text — the padding
     is what makes the three read as separate menus. py-2 (was py-1.5) puts
     the row at ~35px so it clears a comfortable pointer/touch target. */
  const linkCls = "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors hover:text-white";

  /* One shell + one skin for all three categories, so they're the same
     object rather than three near-identical twins */
  const menuShell = "absolute top-full mt-2 rounded-2xl p-2 z-50";
  const menuSkin  = { background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 18px 44px rgba(0,0,0,.5)" };

  return (
    <header
      className="relative z-20 border-b"
      style={{ borderColor: C.border, background: "rgba(15,23,42,0.94)" }}
    >
      {/* The store's own inventory bleeding off both edges behind the nav.
          The WRAPPER does the clipping — the header itself must not, or the
          Games/Support dropdowns below would be cut off. Very wide screens
          only: the six-link nav needs the room. Decorative, not focusable. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <img src="/item-star.png" alt="" className="absolute hidden 2xl:block" style={{ width: 72, height: 72, right: "2%", top: -6, filter: "drop-shadow(0 3px 8px rgba(0,0,0,.4))" }} />
        <img src="/item-gem.png" alt="" className="absolute hidden 2xl:block" style={{ width: 72, height: 72, right: "10%", top: -6, filter: "drop-shadow(0 3px 8px rgba(0,0,0,.4))" }} />
        <img src="/item-crystals.png" alt="" className="absolute hidden 2xl:block" style={{ width: 72, height: 72, right: "18%", top: -6, filter: "drop-shadow(0 3px 8px rgba(0,0,0,.4))" }} />
        <img src="/item-controller.png" alt="" className="absolute hidden 2xl:block" style={{ width: 72, height: 72, left: "2%", top: -6, filter: "drop-shadow(0 3px 8px rgba(0,0,0,.4))" }} />
        <img src="/item-sword.png" alt="" className="absolute hidden 2xl:block" style={{ width: 72, height: 72, left: "10%", top: -6, filter: "drop-shadow(0 3px 8px rgba(0,0,0,.4))" }} />
        <img src="/item-heart.png" alt="" className="absolute hidden 2xl:block" style={{ width: 72, height: 72, left: "18%", top: -6, filter: "drop-shadow(0 3px 8px rgba(0,0,0,.4))" }} />
      </div>

      <div className="relative z-10 max-w-[1096px] mx-auto px-4 sm:px-5 py-3 flex items-center gap-2">
        {/* Brand */}
        <button onClick={onHome} className="flex items-center gap-2 shrink-0 focus:outline-none" aria-label="RBstars home">
          <img src="/rb-logo.png" alt="RBstars" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-mont text-[19px] sm:text-[22px] font-bold" style={{ color: C.text }}>RBstars</span>
        </button>

        {/* Three categories, each opening its own list of sub-items, kept
            apart by rules so they read as three menus rather than one row of
            words. */}
        <nav ref={navRef} className="hidden lg:flex items-center gap-2 mx-auto">
          {/* SHOP */}
          <div className="relative">
            <button
              className={linkCls}
              style={{ color: openMenu === "shop" ? C.text : C.muted }}
              onClick={() => toggleMenu("shop")}
              aria-expanded={openMenu === "shop"}
              aria-haspopup="true"
            >
              <Store size={15} color="#8ea0cf" /> Shop
              <motion.div animate={{ rotate: openMenu === "shop" ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} />
              </motion.div>
            </button>

            <AnimatePresence>
              {openMenu === "shop" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className={`${menuShell} left-1/2 -translate-x-1/2 w-60`}
                  style={menuSkin}
                >
                  <MenuItem
                    icon={<Store size={16} color="#8ea0cf" />}
                    title="Browse Items"
                    note="Every listing, in stock now"
                    onClick={() => { setOpenMenu(null); navigate("/browse"); }}
                  />
                  <MenuItem
                    icon={<Play size={16} color="#8ea0cf" />}
                    title="How It Works"
                    note="Buying and delivery, explained"
                    onClick={() => { setOpenMenu(null); scrollToHowItWorks(); }}
                  />
                  <div className="h-px my-1" style={{ background: C.border }} />
                  <MenuItem
                    icon={<Gift size={16} color="#8ea0cf" />}
                    title="Rewards"
                    note="Spin the wheel — win up to 30% off"
                    onClick={() => { setOpenMenu(null); navigate("/profile"); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="w-px self-stretch my-1.5" style={{ background: C.border }} aria-hidden="true" />

          {/* GAMES — a switcher, not a link list: search, then jump shops */}
          <div className="relative">
            <button
              className={linkCls}
              style={{ color: openMenu === "games" ? C.text : C.muted }}
              onClick={() => toggleMenu("games")}
              aria-expanded={openMenu === "games"}
              aria-haspopup="true"
            >
              <Gamepad2 size={15} color="#8ea0cf" /> Games
              <motion.div animate={{ rotate: openMenu === "games" ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} />
              </motion.div>
            </button>

            <AnimatePresence>
              {openMenu === "games" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className={`${menuShell} left-1/2 -translate-x-1/2 w-72`}
                  style={menuSkin}
                >
                  {/* Search inside the dropdown */}
                  <div className="relative px-2 pt-1 pb-2">
                    <input
                      type="text"
                      value={gameSearch}
                      onChange={e => setGameSearch(e.target.value)}
                      placeholder="Search games..."
                      autoFocus
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-sm font-medium outline-none"
                      style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text }}
                    />
                    <svg className="absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {gamesLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-8">
                        <motion.div animate={{ scale: [1, 1.16, 1] }} transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}>
                          <RBstar size={34} color={C.blue} />
                        </motion.div>
                        <p className="text-xs font-bold" style={{ color: C.muted }}>Loading games…</p>
                      </div>
                    ) : (() => {
                      const filtered = gameSearch.trim()
                        ? games.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
                        : games;
                      if (filtered.length === 0) {
                        return <p className="text-center text-xs py-6" style={{ color: C.faint }}>No games found</p>;
                      }
                      return filtered.map(game => (
                        <button
                          key={game._id}
                          onClick={() => { setOpenMenu(null); setGameSearch(""); navigate("/game/" + game.slug); }}
                          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#22335c]"
                        >
                          <span className="w-8 h-8 rounded-lg shrink-0 overflow-hidden grid place-items-center" style={{ background: game.gradient?.from || C.blue }}>
                            {game.imageUrl && <img src={game.imageUrl} alt="" className="w-full h-full object-cover" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold truncate" style={{ color: C.text }}>{game.name}</span>
                            <span className="block text-[10px] font-medium" style={{ color: C.faint }}>Browse items</span>
                          </span>
                          <ChevronRight size={12} color={C.faint} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100" />
                        </button>
                      ));
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="w-px self-stretch my-1.5" style={{ background: C.border }} aria-hidden="true" />

          {/* SUPPORT — the two ways to reach a human, plus order tracking */}
          <div className="relative">
            <button
              className={linkCls}
              style={{ color: openMenu === "support" ? C.text : C.muted }}
              onClick={() => toggleMenu("support")}
              aria-expanded={openMenu === "support"}
              aria-haspopup="true"
            >
              <LifeBuoy size={15} color="#8ea0cf" /> Support
              <motion.div animate={{ rotate: openMenu === "support" ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} />
              </motion.div>
            </button>

            <AnimatePresence>
              {openMenu === "support" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className={`${menuShell} left-1/2 -translate-x-1/2 w-60`}
                  style={menuSkin}
                >
                  <MenuItem
                    icon={<img src="/chat-icon.png" alt="" className="w-5 h-5 object-contain" />}
                    title="Claim Chat"
                    note="Deliver your order items"
                    onClick={() => { setOpenMenu(null); navigate("/claim-chat"); }}
                  />
                  <MenuItem
                    icon={<img src="/IMG_0732.png" alt="" className="w-5 h-5 object-contain" />}
                    title="Tickets"
                    note="Get help with any issue"
                    onClick={() => { setOpenMenu(null); navigate("/tickets"); }}
                  />
                  <div className="h-px my-1" style={{ background: C.border }} />
                  <MenuItem
                    icon={<PackageSearch size={16} color="#8ea0cf" />}
                    title="Track Order"
                    note="See what's been delivered"
                    onClick={() => { setOpenMenu(null); navigate("/profile"); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 ml-auto">
          <img src={`${A}flag.png`} alt="English" className="hidden sm:block w-7 h-7 rounded-full object-cover" />
          <img src={`${A}usd.png`} alt="USD" className="hidden sm:block w-7 h-7 rounded-full object-cover" />

          {/* Cart stays reachable even though the global nav is hidden on home */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative w-9 h-9 rounded-full grid place-items-center transition-colors hover:bg-[#1f2b4a]"
            style={{ border: `1px solid ${C.border}`, color: C.muted }}
          >
            <ShoppingBag size={16} />
            {totalItems > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full grid place-items-center text-[10px] font-bold text-white"
                style={{ background: C.blue }}
              >
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <button
              onClick={() => navigate("/profile")}
              className="h-9 px-3 rounded-full inline-flex items-center gap-2 text-[12px] font-semibold transition-colors hover:bg-[#1f2b4a]"
              style={{ border: `1px solid ${C.border}`, color: C.muted }}
            >
              <LogIn size={14} />
              <span className="hidden sm:inline">{user.displayName?.split(" ")[0] || "Account"}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => openAuthModal("login")}
                className="h-9 px-3 rounded-full inline-flex items-center gap-2 text-[12px] font-semibold transition-colors hover:bg-[#1f2b4a]"
                style={{ border: `1px solid ${C.border}`, color: C.muted }}
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Login</span>
              </button>
              <button
                onClick={() => openAuthModal("register")}
                className="h-9 px-3 rounded-full inline-flex items-center gap-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{ background: "linear-gradient(90deg,#0a84ff,#0a50d6)", boxShadow: "0 6px 18px rgba(10,110,255,.35)" }}
              >
                <UserPlus size={14} />
                <span className="hidden sm:inline">Register</span>
              </button>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="lg:hidden w-9 h-9 rounded-full grid place-items-center transition-colors hover:bg-[#1f2b4a]"
            style={{ border: `1px solid ${C.border}`, color: C.muted }}
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — slides down, real links, no dead ends */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          className="lg:hidden overflow-y-auto overscroll-contain max-h-[calc(100dvh-56px)] border-t"
          style={{ borderColor: C.border, background: "#0f1527" }}
        >
            {/* The same three categories, stacked — group labels stand in for
                the dropdowns so the structure reads identically on any screen */}
            {[
              {
                label: "Shop",
                items: [
                  { icon: Store, label: "Browse Items", act: () => navigate("/browse") },
                  { icon: Play,  label: "How It Works", act: scrollToHowItWorks },
                  { icon: Gift,  label: "Rewards",      act: () => navigate("/profile") },
                ],
              },
              {
                label: "Support",
                items: [
                  { icon: MessageSquare, label: "Claim Chat",  act: () => navigate("/claim-chat") },
                  { icon: LifeBuoy,      label: "Tickets",     act: () => navigate("/tickets") },
                  { icon: PackageSearch, label: "Track Order", act: () => navigate("/profile") },
                ],
              },
            ].map(group => (
              <div key={group.label}>
                <p className="px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: C.faint }}>
                  {group.label}
                </p>
                {group.items.map(it => (
                  <button
                    key={it.label}
                    onClick={() => { it.act(); setMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-5 py-3.5 text-[14px] font-semibold text-left transition-colors hover:bg-[#1f2b4a]"
                    style={{ color: C.text }}
                  >
                    <it.icon size={17} color="#8ea0cf" /> {it.label}
                  </button>
                ))}
              </div>
            ))}

            {/* Games — its own category, pulled by the same fetch the
                desktop menu uses */}
            <div>
              <p className="px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: C.faint }}>
                Games
              </p>
              {gamesLoading ? (
                <p className="px-5 py-3.5 text-[13px]" style={{ color: C.faint }}>Loading games…</p>
              ) : games.map(game => (
                <button
                  key={game._id}
                  onClick={() => { navigate("/game/" + game.slug); setMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-5 py-3 text-[14px] font-semibold text-left transition-colors hover:bg-[#1f2b4a]"
                  style={{ color: C.text }}
                >
                  <Gamepad2 size={17} color="#8ea0cf" /> {game.name}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  const [, navigate] = useLocation();
  /* live buyer rating — GET /api/settings/public-stats, cached one request */
  const pub = usePublicStats();
  const liveRating = pub && pub.reviews > 0 && pub.rating > 0 ? pub : null;
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-[1096px] mx-auto px-5 pt-12 sm:pt-16 pb-14 grid lg:grid-cols-2 gap-10 items-center">
        {/* Left — headline, sticker, description, CTA */}
        <div>
          <Reveal>
            <h1 className="font-mont text-[40px] leading-[1.1] sm:text-[51px] font-bold" style={{ color: C.text, letterSpacing: "-0.5px" }}>
              Buy Cheapest
            </h1>
          </Reveal>

          <Reveal delay={0.08}>
            <div
              /* px-6/text-[26px] at the smallest widths: px-9 + 30px plus the
                 -2.2deg rotation grew past the ~280px column and clipped */
              className="inline-block mt-3 px-6 sm:px-9 py-3 sm:py-3.5 rounded-[14px] font-mont text-[26px] sm:text-[34px] font-bold text-white select-none"
              style={{
                background: "linear-gradient(180deg,#1c8cff,#0a62e6)",
                boxShadow: "0 7px 0 #0848a8, 0 12px 24px rgba(10,110,255,.35), 0 0 0 3px rgba(255,255,255,.9)",
                transform: "rotate(-2.2deg)",
              }}
            >
              Roblox Items
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-5 text-[14.5px] leading-[1.65] max-w-[480px]" style={{ color: C.muted }}>
              Buy your favourite weapons, knives, pets, and more in Jailbreak
              with ease. RBstars delivers your items straight to your in-game
              mailbox once your order is confirmed.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-7 flex items-center gap-5 flex-wrap">
              <button
                onClick={() => navigate("/browse")}
                className="h-[44px] px-6 rounded-full inline-flex items-center gap-3.5 text-[14.5px] font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: "#ffffff", color: "#0d1530" }}
              >
                <Store size={18} color="#0d1530" /> Shop Now
              </button>
              <div>
                {/* Trust badge — one line, exactly as this layout had it before,
                    but the figure is the store's own live average from
                    GET /api/settings/public-stats (buyers rate their claim
                    session) rather than decorative copy. With no reviews yet
                    nothing is claimed, so the badge is omitted. */}
                {liveRating && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#aab4d4" }}>
                    <Star size={15} fill={C.starOn} color={C.starOn} />
                    <span style={{ color: C.text }}>{liveRating.rating.toFixed(1)}</span>
                    <span>· Verified reviews</span>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right — hero artwork */}
        <Reveal delay={0.15} className="relative">
          <div className="rg-float">
            <img
              src={`${A}IMG_1261.png`}
              alt="Roblox characters on a floating island"
              className="w-full max-w-[520px] mx-auto select-none"
              style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,.25))" }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Payment methods ───────────────────────────────────────────────────── */

function PaymentRow() {
  const methods = ["VISA", "Mastercard", "PayPal", "G Pay", "Apple Pay", "Discover"];
  return (
    <section className="relative">
      <div className="max-w-[1096px] mx-auto px-5 pb-16">
        <Reveal>
          <p className="text-[13px] leading-relaxed" style={{ color: "#e6ebfb" }}>
            Pay with your favourite <span style={{ color: "#62c4f5" }}>payment methods</span> like this below:
          </p>
          <div className="flex items-center gap-7 flex-wrap mt-4">
            {methods.map((m) => (
              <span key={m} className="font-mont text-[17px] font-bold italic inline-flex items-center gap-1.5" style={{ color: "#aab3cf" }}>
                {m === "Apple Pay" ? (
                  <>
                    <svg className="h-[20px] w-auto" viewBox="0 0 384 512" fill="currentColor" aria-hidden>
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                    </svg>
                    Pay
                  </>
                ) : (
                  m
                )}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Popular items — game tabs + product cards (real API data) ─────────── */

/* The card itself now lives in components/ProductCard.tsx so the same design
   can be reused by the shop grid. (The old inline card also referenced an
   undefined `product` variable in its image fallback — a latent crash whenever
   a product arrived without imageUrl.) */

function PopularItems({
  games, loadingGames, products, loadingProducts, onNavigate,
}: {
  games: ShopGame[]; loadingGames: boolean;
  products: ApiProduct[]; loadingProducts: boolean;
  onNavigate: (to: string) => void;
}) {
  const [activeGame, setActiveGame] = useState("");
  const { addItem } = useCart();
  const shown = products.slice(0, 5);
  const gameName = games.find(g => g.slug === activeGame)?.name || games[0]?.name || "items";

  return (
    <section id="popular" className="relative scroll-mt-20">
      <div className="max-w-[1096px] mx-auto px-5 py-16">
        <Reveal>
          <h2 className="font-mont text-[28px] sm:text-[32px] font-bold text-center" style={{ color: C.text }}>
            Popular items
          </h2>
        </Reveal>

        {/* Game tabs */}
        <Reveal delay={0.08}>
          <div className="flex items-center gap-2.5 flex-wrap justify-center mt-5">
            {loadingGames || games.length === 0 ? (
              <span className="h-9 w-[120px] rounded-full" style={{ background: C.card, border: `1px solid ${C.border}` }} />
            ) : (
              games.map(g => {
                const active = activeGame === g.slug || (!activeGame && g.slug === games[0].slug);
                return (
                  <button
                    key={g._id}
                    onClick={() => setActiveGame(g.slug)}
                    className="h-9 px-2.5 rounded-full inline-flex items-center gap-2 text-[12px] font-semibold transition-colors"
                    style={{
                      background: active ? "#0a5ec4" : "#1f2f52",
                      border: `1px solid ${active ? "#1b86ff" : "#2c3d66"}`,
                      color: active ? "#fff" : C.muted,
                    }}
                  >
                    {g.imageUrl && <img src={g.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />}
                    {g.name}
                  </button>
                );
              })
            )}
          </div>
        </Reveal>

        {/* Product cards */}
        <div className="mt-6">
          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="rounded-[18px] py-14 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <p className="text-[15px] font-semibold" style={{ color: C.text }}>No items listed yet.</p>
              <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>New stock shows up here as soon as it lands.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {shown.map((p, i) => (
                <ProductCard
                  key={p._id}
                  index={i}
                  onNavigate={(id) => onNavigate(`/product/${id}`)}
                  onAdd={() =>
                    addItem({
                      id: p._id,
                      name: p.name,
                      price: p.price,
                      originalPrice: p.originalPrice,
                      gradient: p.gradient
                        ? [p.gradient.from, p.gradient.to]
                        : ["#0a84ff", "#121a2e"],
                      image: p.imageUrl || p.images?.[0],
                      game: p.game,
                    })
                  }
                  product={{
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    originalPrice: p.originalPrice,
                    imageUrl: p.imageUrl || p.images?.[0],
                    bestSeller: p.bestSeller,
                    outOfStock: p.outOfStock || (typeof p.stock === "number" && p.stock <= 0),
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* View all */}
        <Reveal delay={0.1}>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onNavigate("/browse")}
              className="h-[44px] px-8 rounded-full inline-flex items-center justify-center gap-2 text-[14px] font-bold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(90deg,#0a84ff,#0a50d6)", boxShadow: "0 6px 18px rgba(10,110,255,.35)" }}
            >
              View all {gameName} items <ChevronRight size={16} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Stats ─────────────────────────────────────────────────────────────── */
/* Live counters summed from real documents by GET /api/stats (see
   lib/liveStats). Nothing here is hardcoded: while loading we show dashes,
   and if the request fails the whole band is hidden rather than showing
   invented numbers. Once the real figures land they count up on first
   scroll-into-view. */

function useLiveStats() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchLiveStats().then((s) => {
      if (!alive) return;
      if (s) setStats(s);
      else setFailed(true);
    });
    return () => { alive = false; };
  }, []);

  return { stats, failed };
}

/* rAF count-up, ease-out-quart, one shot when scrolled into view */
function useCountUp(target: number | null, active: boolean, reduce: boolean) {
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (!active || target === null) return;
    if (reduce) { setShown(target); return; }

    let raf = 0;
    const start = performance.now();
    const DUR = 1300;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - p, 4);   // ease-out-quart
      setShown(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setShown(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, reduce]);

  return shown;
}

function StatTile({ icon: Icon, label, value, index, reduce }: {
  icon: typeof Box; label: string; value: number | null; index: number; reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  const shown = useCountUp(value, seen, reduce);

  return (
    <Reveal delay={index * 0.08} className="text-center">
      <div ref={ref}>
        <Icon size={50} color={C.blue} className="mx-auto" />
        <div className="font-mont text-[34px] sm:text-[40px] font-bold mt-4" style={{ color: C.text }}>
          {shown === null ? "\u2014" : groupNum(shown)}
        </div>
        <div className="text-[13px] mt-1.5" style={{ color: C.muted }}>{label}</div>
      </div>
    </Reveal>
  );
}

function Stats() {
  const reduce = !!useReducedMotion();
  const { stats, failed } = useLiveStats();

  /* real numbers unavailable — hide the band instead of inventing figures */
  if (failed) return null;

  const tiles = [
    { icon: Box, label: "Items in stock", value: stats?.itemsInStock ?? null },
    { icon: Wallet, label: "Items sold", value: stats?.itemsSold ?? null },
    { icon: Users, label: "Customers served", value: stats?.customersServed ?? null },
  ] as const;

  return (
    <section className="relative">
      {/* decorative cutout, reference-style */}
      <img
        src={`${A}axe.png`}
        alt=""
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[340px] opacity-70 select-none pointer-events-none hidden min-[1100px]:block"
        style={{ mixBlendMode: "lighten" }}
      />
      <div className="max-w-[1096px] mx-auto px-5 py-16 grid sm:grid-cols-3 gap-10">
        {tiles.map((s, i) => (
          <StatTile
            key={s.label}
            icon={s.icon}
            label={s.label}
            /* null while loading — the tile shows a dash and animates once
               the real figure arrives, so it never counts up to a fake 0 */
            value={s.value}
            index={i}
            reduce={reduce}
          />
        ))}
      </div>
    </section>
  );
}

/* ── How it works ──────────────────────────────────────────────────────── */

const STEPS = [
  { n: "1", t: "Find your favourite Roblox item", d: "Select your desired item from the Roblox world" },
  { n: "2", t: "Payment method", d: "Check out and pay with your favourite payment method" },
  { n: "3", t: "Successfully", d: "Confirm your username and receive your items in-game" },
];

function HowItWorks() {
  return (
    <section className="relative">
      <div className="max-w-[1096px] mx-auto px-5 py-16 grid lg:grid-cols-[1fr_640px] gap-12 items-center">
        {/* Steps */}
        <div>
          <Reveal>
            <h2 className="font-mont text-[26px] sm:text-[31px] font-bold" style={{ color: C.text }}>
              How does RBstars work?
            </h2>
          </Reveal>

          <div className="relative mt-9 ml-[15px]">
            {/* dashed connector — runs through the center of the numbered circles */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px border-l border-dashed" style={{ borderColor: "#3a4a78" }} />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1} className="relative pl-[45px] mb-8 last:mb-0">
                <span
                  className="absolute left-0 top-[-4px] w-[30px] h-[30px] rounded-full grid place-items-center text-[13px] font-bold text-white"
                  style={{ background: "linear-gradient(180deg,#1c8cff,#0a62e6)", border: "2px solid #fff" }}
                >
                  {s.n}
                </span>
                <div className="text-[17px] font-medium pt-1" style={{ color: C.text }}>{s.t}</div>
                <div className="text-[13px] mt-1.5" style={{ color: C.muted }}>{s.d}</div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Video thumbnail + mascot (mascot sits left of the frame, not on it) */}
        <Reveal delay={0.15} className="flex items-end justify-center gap-5">
          <img
            src={`${A}IMG_1278.png`}
            alt=""
            aria-hidden
            /* hidden on phones: the mascot held 150px of a ~280px row, leaving
               the video ~110px wide — unusable below ~450px */
            className="hidden sm:block w-[180px] shrink-0 select-none"
          />
          <div
            className="relative w-full max-w-[430px] overflow-hidden"
            style={{
              aspectRatio: "510 / 336",
              border: "3px solid #1385ff",
              borderRadius: 28,
              boxShadow: "0 0 40px rgba(19,133,255,.3), 0 24px 44px rgba(0,0,0,.55)",
            }}
          >
            <img
              src={`${A}IMG_1282.jpg`}
              alt="How RBstars delivery works"
              className="absolute inset-[5px] w-[calc(100%-10px)] h-[calc(100%-10px)] object-cover"
              style={{ borderRadius: 22 }}
            />
            {/* black overlay — darkens the image so it reads blackish and blends into the navy */}
            <span className="absolute inset-[5px]" style={{ background: "rgba(0,0,0,.4)", borderRadius: 22 }} />
            <span
              className="absolute inset-0 grid place-items-center"
              aria-hidden
            >
              <span
                className="w-[64px] h-[64px] rounded-full grid place-items-center text-white"
                style={{ background: "rgba(10,132,255,.92)", boxShadow: "0 8px 24px rgba(10,110,255,.5)" }}
              >
                <Play size={26} fill="#fff" />
              </span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Feature cards ─────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Zap, title: "In-Game Delivery",
    d: "Items go straight to your in-game mailbox once your order is confirmed.",
    g: "linear-gradient(135deg,#2f3de0,#4a63ff)", fg: "#15227a",
  },
  {
    icon: ShoppingCart, title: "Cheapest Prices",
    d: "We check the market constantly, so the price you see is the price you get.",
    g: "linear-gradient(135deg,#7b1fd8,#a13cf0)", fg: "#3a0a73",
  },
  {
    icon: ShieldCheck, title: "Secure Payments",
    d: "Checkout is encrypted and processed by trusted payment providers.",
    g: "linear-gradient(135deg,#10b8a8,#27e3b8)", fg: "#0a5a5e",
  },
];

function Features() {
  return (
    <section className="relative">
      <img
        src={`${A}crossbow.png`}
        alt=""
        aria-hidden
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] opacity-70 select-none pointer-events-none hidden min-[1100px]:block"
        style={{ mixBlendMode: "lighten" }}
      />
      <div className="max-w-[1096px] mx-auto px-5 py-16 grid sm:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <div
              className="relative rounded-[30px] px-8 pb-9 text-center"
              style={{
                background: "linear-gradient(180deg,#1b2745,rgba(24,34,60,0))",
                minHeight: 200,
                marginTop: 44,
              }}
            >
              <span
                className="relative z-10 mx-auto -mt-[44px] w-[88px] h-[88px] rounded-full grid place-items-center"
                style={{ background: "#0f1630" }}
              >
                <span
                  className="w-[76px] h-[76px] rounded-full grid place-items-center"
                  style={{ background: f.g, color: f.fg }}
                >
                  <f.icon size={34} />
                </span>
              </span>
              <div className="relative z-10 font-mont text-[20px] font-bold mt-6" style={{ color: C.text }}>
                {f.title}
              </div>
              <div className="relative z-10 text-[13.5px] leading-[1.7] mt-3" style={{ color: C.muted }}>
                {f.d}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Delivery activity ──────────────────────────────────────────────────── */
/* Real completed deliveries: how many orders went out today, plus each game's
   live inventory and lifetime sales from GET /api/stats/activity. No PII, no
   invented counters — if there is nothing real to show, the band hides. */

function useActivity() {
  const [act, setAct] = useState<StoreActivity | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchActivity().then((a) => { if (!alive) return; if (a) setAct(a); else setFailed(true); });
    return () => { alive = false; };
  }, []);
  return { act, failed };
}

function ActivityCard({ g, navigate }: { g: ActivityGame; navigate: (u: string) => void }) {
  const soldPct = g.sold + g.inStock > 0 ? Math.round((g.sold / (g.sold + g.inStock)) * 100) : 0;
  return (
    <button
      type="button"
      onClick={() => navigate(`/game/${g.slug}`)}
      className="group relative shrink-0 w-[218px] h-[146px] rounded-[12px] p-3 mr-4 overflow-hidden text-left transition-transform hover:-translate-y-1"
      style={{ background: "#1e2849", border: `1px solid ${C.borderSoft}`, fontSize: 12 }}
      aria-label={`Open ${g.name}`}
    >
      {g.imageUrl ? (
        <img
          src={g.imageUrl}
          alt=""
          aria-hidden
          className="absolute left-3 top-3 w-[26px] h-[26px] rounded-full object-cover"
          style={{ background: g.gradient ? `linear-gradient(135deg,${g.gradient.from},${g.gradient.to})` : "#0f1730" }}
        />
      ) : (
        <span
          className="absolute left-3 top-3 w-[26px] h-[26px] rounded-full grid place-items-center"
          style={{ background: g.gradient ? `linear-gradient(135deg,${g.gradient.from},${g.gradient.to})` : "#0f1730" }}
        >
          <Gamepad2 size={13} color="#fff" />
        </span>
      )}

      <div className="absolute left-[44px] right-[56px] top-3 text-[11.5px] font-bold text-white leading-tight truncate">{g.name}</div>
      <div className="absolute left-[44px] right-[56px] top-[26px] text-[8.5px] truncate" style={{ color: "#9aa6c8" }}>{g.items} items</div>

      <span
        className="absolute right-2 top-[13px] rounded-full px-2 py-0.5 text-[8.5px]"
        style={{ border: "1px solid #2faa63", background: "#0f3a33", color: C.greenBright }}
      >
        LIVE
      </span>

      <div className="absolute left-3 right-3 top-[44px] flex gap-3">
        <div>
          <div className="text-[17px] font-mont font-bold leading-none" style={{ color: C.greenBright }}>{groupNum(g.inStock)}</div>
          <div className="text-[8.5px] mt-1" style={{ color: "#9aa6c8" }}>in stock</div>
        </div>
        <div>
          <div className="text-[17px] font-mont font-bold leading-none" style={{ color: C.text }}>{groupNum(g.sold)}</div>
          <div className="text-[8.5px] mt-1" style={{ color: "#9aa6c8" }}>sold</div>
        </div>
      </div>

      <div className="absolute left-3 right-3 bottom-3">
        <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "#16203c" }}>
          <div className="h-full rounded-full" style={{ width: `${soldPct}%`, background: C.greenBright }} />
        </div>
        <div className="mt-1.5 text-[8.5px] flex items-center gap-1" style={{ color: "#9aa6c8" }}>
          <PackageSearch size={9} /> Live inventory from the store
        </div>
      </div>
    </button>
  );
}

function DeliveryBand() {
  const { act, failed } = useActivity();
  const [, navigate] = useLocation();

  /* nothing real to show — drop the band rather than inventing a count */
  if (failed || !act) return null;
  const feed = act.games.filter((g) => g.inStock > 0 || g.sold > 0);
  if (feed.length === 0 && act.deliveredAllTime === 0) return null;

  const todayLine = act.ordersToday > 0
    ? `${groupNum(act.ordersToday)} order${act.ordersToday === 1 ? "" : "s"} delivered today`
    : `${groupNum(act.deliveredAllTime)} orders delivered`;

  const itemsLine = act.itemsDeliveredToday > 0
    ? `${groupNum(act.itemsDeliveredToday)} item${act.itemsDeliveredToday === 1 ? "" : "s"}`
    : null;

  return (
    <section id="delivery-activity" className="relative scroll-mt-20">
      <div className="max-w-[1096px] mx-auto px-5 pb-16">
        <Reveal className="text-center">
          <h2 className="font-mont text-[26px] sm:text-[34px] font-bold leading-tight" style={{ color: C.text }}>
            Orders <span style={{ color: C.greenBright }}>Delivered</span>
          </h2>
          <span
            className="inline-block mt-4 h-[26px] px-3.5 rounded-full text-[11.5px] font-semibold"
            style={{ border: "1px solid #2faa63", background: "#0f3a33", color: C.greenBright }}
          >
            {todayLine}{itemsLine ? ` · ${itemsLine}` : ""}
          </span>
        </Reveal>

        {feed.length > 0 && (
          <div className="rg-marquee mt-8">
            <div className="rg-marquee-track py-1">
              {[...feed, ...feed].map((g, i) => (
                <ActivityCard key={`${g.slug}-${i}`} g={g} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        <Reveal delay={0.1}>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate("/browse")}
              className="h-[44px] px-8 rounded-full inline-flex items-center justify-center gap-2.5 text-[14px] font-bold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(90deg,#0a84ff,#0a50d6)", boxShadow: "0 6px 18px rgba(10,110,255,.35)" }}
            >
              <PackageSearch size={17} /> Browse all games <ChevronRight size={16} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Reviews ──────────────────────────────────────────────────────────── */
/* Real buyer reviews from the store's own review system — buyers leave a
   1–5 rating and a comment after their claim session (ClaimSession.feedback),
   and GET /api/claims/public-reviews exposes them. Everything on these cards
   is genuine: the handle, the star count, the words and the date. The old
   version here was invented filler (fake names, countries and quotes). */

function ReviewCard({ r }: { r: PublicReview }) {
  return (
    <div
      className="relative shrink-0 w-[218px] h-[146px] rounded-[12px] p-3 mr-4 overflow-hidden"
      style={{ background: "#1e2849", border: `1px solid ${C.borderSoft}`, fontSize: 12 }}
    >
      {/* handle initial — no stock avatar photos */}
      <span
        className="absolute left-3 top-3 w-[26px] h-[26px] rounded-full grid place-items-center text-[12px] font-bold"
        style={{ background: `linear-gradient(135deg,${C.blue},#0a50d6)`, color: "#fff" }}
        aria-hidden
      >
        {r.name.slice(0, 1).toUpperCase()}
      </span>

      <div className="absolute left-[44px] right-[54px] top-3 text-[11.5px] font-bold text-white leading-tight truncate">{r.name}</div>
      <div className="absolute left-[44px] right-[54px] top-[26px] text-[8.5px] truncate" style={{ color: "#9aa6c8" }}>
        {timeAgo(r.submittedAt) || "Verified buyer"}
      </div>

      {/* the reviewer's own rating */}
      <span
        className="absolute right-2 top-[13px] rounded-full px-2 py-0.5 text-[8.5px]"
        style={{ border: "1px solid #475680", color: "#b4bddb" }}
      >
        {r.rating}.0 ★
      </span>

      <div className="absolute left-3 top-[44px] flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={17} fill={n <= r.rating ? C.starOn : C.starOff} color={n <= r.rating ? C.starOn : C.starOff} />
        ))}
      </div>

      <p className="absolute left-3 right-3 top-[72px] text-[11px] leading-[1.45] line-clamp-4" style={{ color: "#e8ecfa" }}>
        {r.comment || "Verified delivery"}
      </p>
    </div>
  );
}

function Testimonials() {
  /* Canonical storefront figures: GET /api/settings/public-stats (customers,
     rating, review count) and GET /api/claims/public-reviews (the reviews
     themselves). Both are the store's real numbers — a missing value renders
     as copy without a figure, never an invented one. */
  const stats = usePublicStats();
  const revs = usePublicReviews();

  const items = revs?.reviews.filter((r) => r.comment.length > 0) ?? [];
  /* nothing genuine to show — drop the band rather than post fake praise */
  if (items.length === 0) return null;

  const ratingLine = stats && stats.reviews > 0 && stats.rating > 0
    ? `${stats.rating.toFixed(1)} ★ · ${formatCount(stats.reviews)} reviews`
    : null;

  return (
    <section id="reviews" className="relative scroll-mt-20">
      <div className="max-w-[1096px] mx-auto px-5 py-16">
        <Reveal className="text-center">
          <h2 className="font-mont text-[26px] sm:text-[34px] font-bold leading-tight" style={{ color: C.text }}>
            {stats && stats.customers > 0 ? (
              <>
                Trusted by <span style={{ color: C.greenBright }}>{formatCount(stats.customers)}+</span>
                <br />Happy Customers
              </>
            ) : (
              <>Trusted by<br />Roblox Players</>
            )}
          </h2>
          <span
            className="inline-block mt-4 h-[26px] px-3.5 rounded-full text-[11.5px] font-semibold"
            style={{ border: "1px solid #2faa63", background: "#0f3a33", color: C.greenBright }}
          >
            {ratingLine ?? `${items.length}+ verified reviews`}
          </span>
        </Reveal>

        <div className="rg-marquee mt-8">
          <div className="rg-marquee-track py-1">
            {[...items, ...items].map((r, i) => (
              <ReviewCard key={`${r.id}-${i}`} r={r} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────────────────────── */

function Faq() {
  const [open, setOpen] = useState(1);
  return (
    <section className="relative">
      <img
        src={`${A}IMG_1264.png`}
        alt=""
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] opacity-70 select-none pointer-events-none hidden min-[1100px]:block"
        style={{ mixBlendMode: "lighten" }}
      />
      <img
        src={`${A}IMG_1267.png`}
        alt=""
        aria-hidden
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-auto opacity-80 select-none pointer-events-none hidden min-[1100px]:block"
      />
      <div className="max-w-[1096px] mx-auto px-5 py-16">
        <div className="max-w-[627px] mx-auto">
          <Reveal>
            <h2 className="font-mont text-[28px] sm:text-[36px] font-bold text-center" style={{ color: C.text }}>
              Frequently Asked Questions
            </h2>
            <p className="text-center text-[14px] mt-2" style={{ color: C.muted }}>
              Got Questions? We've Got Answers!
            </p>
          </Reveal>

          <div className="mt-7 space-y-2.5">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={f.q} delay={i * 0.05}>
                  <div
                    className="overflow-hidden"
                    style={{
                      background: "#1f2c4f",
                      /* was `1px solid "#2e3d66"` — the quotes made this an
                         invalid value, so the FAQ cards had no border at all */
                      border: "1px solid #2e3d66",
                      borderRadius: isOpen ? 16 : 19,
                    }}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      aria-expanded={isOpen}
                      /* min-h, not h: a long question wraps to two lines under
                         ~370px and the fixed 38px strip clipped the second */
                      className="w-full flex items-start justify-between gap-3 px-[18px] min-h-[38px] py-2.5 text-left text-[14.5px] leading-snug font-medium focus:outline-none"
                      style={{ color: C.text }}
                    >
                      <span className="flex-1">{f.q}</span>
                      <span
                        className="shrink-0 w-6 h-6 rounded-full grid place-items-center text-[18px] leading-none"
                        style={{ background: isOpen ? C.orange : C.blue, color: "#fff" }}
                      >
                        {isOpen ? <Minus size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="px-[18px] pb-4 text-[12.5px] leading-[1.7]" style={{ color: "#9aa8cb" }}>
                        {f.a}
                      </p>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── SEO copy ──────────────────────────────────────────────────────────── */

function SeoText() {
  return (
    <section className="relative">
      <div className="max-w-[1096px] mx-auto px-5 py-16">
        <div className="max-w-[1100px]">
          {SEO_BLOCKS.map((b, i) => (
            <Reveal key={b.h} delay={i * 0.06} className="mb-7 last:mb-0">
              <h3 className="text-[14.5px] font-semibold" style={{ color: C.text }}>{b.h}</h3>
              <p className="text-[13px] leading-[1.7] mt-2.5" style={{ color: "#9aa8cb" }}>{b.p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer (reference footer, RBstars branding) ───────────────────────── */

export function SiteFooter() {
  const col = "flex flex-col gap-2.5";
  const h6 = "text-[14px] font-semibold mb-1.5";
  const a = "text-[15px] transition-colors hover:text-white";

  return (
    <footer className="relative" style={{ background: C.footerBg, marginTop: 20 }}>
      <div className="max-w-[1096px] mx-auto px-5 pt-12 pb-8">
        {/* Brand + columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <img src="/rb-logo.png" alt="RBstars" className="w-8 h-8 rounded-full object-cover" />
              <span className="font-mont text-[25px] font-bold" style={{ color: C.text }}>RBstars</span>
            </div>
          </div>

          <div className={col}>
            <h6 className={h6} style={{ color: C.text }}>ABOUT</h6>
            <button className={a} style={{ color: "#b3bbd2", background: "none", border: 0, cursor: "pointer", textAlign: "left", padding: 0 }} onClick={() => window.location.assign("/tickets/new")}>Blog</button>
            <button className={a} style={{ color: "#b3bbd2", background: "none", border: 0, cursor: "pointer", textAlign: "left", padding: 0 }} onClick={() => window.location.assign("/tickets/new")}>Help Center</button>
            <button className={a} style={{ color: "#b3bbd2", background: "none", border: 0, cursor: "pointer", textAlign: "left", padding: 0 }} onClick={() => window.location.assign("/browse")}>Backpack</button>
            <button className={a} style={{ color: "#b3bbd2", background: "none", border: 0, cursor: "pointer", textAlign: "left", padding: 0 }} onClick={() => window.location.assign("/checkout")}>Deposit</button>
          </div>

          <div className={col}>
            <h6 className={h6} style={{ color: C.text }}>PROFILE</h6>
            <button className={a} style={{ color: "#b3bbd2", background: "none", border: 0, cursor: "pointer", textAlign: "left", padding: 0 }} onClick={() => window.location.assign("/profile")}>Personal</button>
            <button className={a} style={{ color: "#b3bbd2", background: "none", border: 0, cursor: "pointer", textAlign: "left", padding: 0 }} onClick={() => window.location.assign("/profile")}>Area Trade</button>
            <button className={a} style={{ color: "#b3bbd2", background: "none", border: 0, cursor: "pointer", textAlign: "left", padding: 0 }} onClick={() => window.location.assign("/profile")}>History</button>
            <button className={a} style={{ color: "#b3bbd2", background: "none", border: 0, cursor: "pointer", textAlign: "left", padding: 0 }} onClick={() => window.location.assign("/profile")}>Bonus</button>
          </div>

          <div className={col}>
            <h6 className={h6} style={{ color: C.text }}>TERMS</h6>
            <span className={a} style={{ color: "#b3bbd2", cursor: "pointer" }}>Privacy Policy</span>
            <span className={a} style={{ color: "#b3bbd2", cursor: "pointer" }}>Refund Policy</span>
            <span className={a} style={{ color: "#b3bbd2", cursor: "pointer" }}>Tearms of Use</span>
            <span className={a} style={{ color: "#b3bbd2", cursor: "pointer" }}>Settings</span>
          </div>
        </div>

        {/* Language + currency */}
        <div className="flex items-center gap-3 mt-9">
          <span
            className="h-8 pl-2 pr-2.5 rounded-full inline-flex items-center gap-2 text-[13px] font-semibold"
            style={{ background: "#1f2b4a", color: "#aab4d4" }}
          >
            <img src={`${A}flag.png`} alt="" className="w-5 h-5 rounded-full object-cover" /> English
            <ChevronRight size={13} style={{ transform: "rotate(90deg)", color: "#8ea0cf" }} />
          </span>
          <span
            className="h-8 pl-2 pr-2.5 rounded-full inline-flex items-center gap-2 text-[13px] font-semibold"
            style={{ background: "#1f2b4a", color: "#aab4d4" }}
          >
            <img src={`${A}usd.png`} alt="" className="w-5 h-5 rounded-full object-cover" /> USD
            <ChevronRight size={13} style={{ transform: "rotate(90deg)", color: "#8ea0cf" }} />
          </span>
        </div>

        {/* Socials — wraps: five icon+label pairs at 15px need ~500px, which
            overflowed every phone and horizontally scrolled every page that
            renders SiteFooter without its own overflow guard. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-7">
          {[
            { icon: Instagram, label: "Instagram", color: "#aab4d4" },
            { icon: Twitter, label: "x.com", color: "#aab4d4" },
            { icon: Youtube, label: "YouTube", color: "#aab4d4" },
            { icon: MessageCircle, label: "Discord", color: "#2f7dff" },
            { icon: Music2, label: "TikTok", color: "#aab4d4" },
          ].map((s) => (
            <span key={s.label} className="flex items-center gap-2.5 text-[15px] cursor-pointer transition-opacity hover:opacity-80" style={{ color: s.color }}>
              <s.icon size={20} fill={s.label === "Discord" ? "#2f7dff" : undefined} /> {s.label}
            </span>
          ))}
        </div>

        {/* Legal */}
        <div className="mt-8 pt-6 space-y-2.5" style={{ borderTop: "1px solid #1d2744" }}>
          <p className="text-[10.5px] leading-[1.7] max-w-[1100px]" style={{ color: "#9aa8cb" }}>
            RBstars is owned and operated by Virtual Asset Empire Ltd, HE 412509, 13 Kypranoros Str.,
            Evi Building, 1st Floor, Office 102, 1061 Nicosia, Cyprus. Payments and other services may be
            provided by external companies.
            Contact us at support@rbstars.gg or via Live Chat.
          </p>
          <p className="text-[10.5px]" style={{ color: "#9aa8cb" }}>© 2026 RBstars | All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   HOME
   ════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  const [, navigate] = useLocation();

  /* ── games ── */
  const [games, setGames] = useState<ShopGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  const loadGames = useCallback(async () => {
    setGamesLoading(true);
    for (let round = 1; round <= 3; round++) {
      try {
        const res = await fetch(`${BACKEND}/api/games?active=true`);
        const d = await res.json();
        const fetched: ShopGame[] = d?.data?.games || [];
        if (fetched.length > 0) { setGames(fetched); setGamesLoading(false); return; }
      } catch { /* keep going */ }
      if (round < 3) await new Promise(r => setTimeout(r, 800 * round));
    }
    setGamesLoading(false);
  }, []);

  useEffect(() => { loadGames(); }, [loadGames]);

  /* ── popular products — real items from the API ── */
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [popLoading, setPopLoading] = useState(true);

  const loadPopular = useCallback(async () => {
    setPopLoading(true);
    const url = `${BACKEND}/api/products?sort=-salesCount&limit=12`;
    for (let round = 1; round <= 3; round++) {
      try {
        const res = await fetch(url);
        const d = await res.json();
        if (d?.success && Array.isArray(d.data)) { setProducts(d.data); setPopLoading(false); return; }
      } catch { /* keep going */ }
      if (round < 3) await new Promise(r => setTimeout(r, 800 * round));
    }
    setProducts([]);
    setPopLoading(false);
  }, []);

  useEffect(() => { loadPopular(); }, [loadPopular]);

  const scrollToPopular = () => {
    document.getElementById("popular")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="relative min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>
      {/* Reference background: soft radial glows over the navy base */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(900px 700px at 0% 0%,#19284a,transparent 70%)," +
            "radial-gradient(800px 700px at 100% 12%,#1b2c4f,transparent 70%)," +
            "radial-gradient(700px 600px at 100% 40%,#1a2a4d,transparent 70%)," +
            "radial-gradient(600px 700px at 100% 75%,#14203c,transparent 70%)," +
            "#121a2e",
        }}
      />

      <div className="relative z-10">
        <TopNav onHome={scrollToPopular} />
        <Hero />
        <PaymentRow />
        <PopularItems
          games={games}
          loadingGames={gamesLoading}
          products={products}
          loadingProducts={popLoading}
          onNavigate={navigate}
        />
        <Stats />
        <HowItWorks />
        <Features />
        <Testimonials />
        <DeliveryBand />
        <Faq />
        <SeoText />
        <SiteFooter />
      </div>
    </main>
  );
}
