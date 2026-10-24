import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Store, PackageSearch, ShoppingBag, UserPlus, LogIn,
  ChevronRight, Star, Plus, Minus, Box, Wallet, Users, Zap,
  ShoppingCart, ShieldCheck, Play,
  Menu, X, LifeBuoy, ChevronDown, Gamepad2, Gift, MessageSquare, Search, Ticket,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { RBstar } from "@/components/Art";
import CurrencyMenu from "@/components/CurrencyMenu";
import UserAvatar from "@/components/UserAvatar";
import { LIVE_SOCIALS } from "@/lib/socialLinks";
import ProductCard, { ProductCardSkeleton, type CardProduct } from "@/components/ProductCard";
import { fetchLiveStats, groupNum, type LiveStats } from "@/lib/liveStats";
import { effectiveStock, isSoldOut } from "@/lib/stock";
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
  /** live physical inventory — the number that decides availability */
  onHand?: number;
  bestSeller?: boolean;
  outOfStock?: boolean;
  /** card media framing — square / vertical / horizontal (lib/storefront.ts) */
  imageShape?: "square" | "vertical" | "horizontal";
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

  /* The game you're standing in right now (inside /game/:slug) — the Games
     trigger wears its icon + name so the header always shows where you are. */
  const hereGame = (() => {
    const m = location.match(/^\/game\/([^/?]+)/);
    return m ? games.find(g => g.slug === decodeURIComponent(m[1])) || null : null;
  })();

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
      {/* The floating item art that used to bleed off both edges here is
          gone on request — the header is the header, the content is the
          content, and at wide widths they now share the same width. */}

      <div className="relative z-10 wide-wrap mx-auto px-4 sm:px-5 py-3 flex items-center gap-2">
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

          {/* GAMES — a switcher, not a link list: search, then jump shops.
              When you're inside a game, the trigger becomes that game (its
              icon + name) so the header always says where you are. */}
          <div className="relative">
            <button
              className={linkCls}
              style={{ color: openMenu === "games" ? C.text : C.muted }}
              onClick={() => toggleMenu("games")}
              aria-expanded={openMenu === "games"}
              aria-haspopup="true"
            >
              {hereGame ? (
                <span className="w-[18px] h-[18px] rounded-md shrink-0 overflow-hidden grid place-items-center" style={{ background: hereGame.gradient?.from || C.blue }}>
                  {hereGame.imageUrl && <img src={hereGame.imageUrl} alt="" className="w-full h-full object-cover" />}
                </span>
              ) : <Gamepad2 size={15} color="#8ea0cf" />}
              {hereGame ? hereGame.name : "Games"}
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
                            <span className="block text-[10px] font-medium" style={{ color: hereGame?._id === game._id ? C.blue : C.faint }}>
                              {hereGame?._id === game._id ? "You're here" : "Browse items"}
                            </span>
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

          {/* RAFFLE — a straight-through link (no dropdown), the one nav
              item that wears the brand gold so it reads as a live event */}
          <button
            onClick={() => navigate("/raffle")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold transition-colors hover:bg-[#241f10]"
            style={{ color: "#FFC53D" }}
            aria-label="Raffles"
          >
            <Ticket size={15} color="#FFC53D" /> Raffle
          </button>

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
                    note="Delivery progress + claim chats"
                    onClick={() => { setOpenMenu(null); navigate("/orders"); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Display currency. Replaces two static flag/currency images that
              404'd and did nothing — this opens a real menu, converts every
              price on the site from live rates, and persists the choice. The
              card is still charged in USD, which the menu states. Phones get
              it from the hamburger drawer + footer instead — the top bar
              would overflow a 320px screen with it inline. */}
          <div className="hidden sm:block">
            <CurrencyMenu variant="nav" direction="down" />
          </div>

          {/* Cart stays reachable even though the global nav is hidden on home */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative w-9 h-9 rounded-full grid place-items-center transition-colors hover:bg-[#1f2b4a]"
            style={{ border: `1px solid ${C.border}`, color: C.muted }}
          >
            {/* one small bounce each time something lands in the cart */}
            <span key={totalItems} className={totalItems > 0 ? "pk-bump" : ""}>
              <ShoppingBag size={16} />
            </span>
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
            /* Logged in: the account control is the buyer's own face in a
               ringed circle, not a generic login glyph — on phones the name
               drops away and the avatar alone still says "you". */
            <button
              onClick={() => navigate("/profile")}
              title={user.displayName ? `${user.displayName} — your account` : "Your account"}
              aria-label="Open your profile"
              className="h-9 pl-1 pr-2 rounded-full inline-flex items-center gap-2 text-[12px] font-semibold transition-colors hover:bg-[#1f2b4a]"
              style={{ color: C.muted }}
            >
              <UserAvatar name={user.displayName} src={user.robloxAvatarUrl} size={28} />
              <span className="hidden sm:inline max-w-[92px] truncate" style={{ color: C.text }}>
                {user.displayName?.split(" ")[0] || "Account"}
              </span>
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
            {/* Who you are — the drawer starts with your own circle so the
                account is never a mystery on a phone, where the top bar has
                room for the avatar but not the name. */}
            {user && (
              <button
                onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-5 py-3.5 text-left transition-colors hover:bg-[#1f2b4a]"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <UserAvatar name={user.displayName} src={user.robloxAvatarUrl} size={36} />
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold truncate" style={{ color: C.text }}>
                    {user.displayName || "Your account"}
                  </span>
                  <span className="block text-[11px] truncate" style={{ color: C.faint }}>
                    {user.robloxUsername ? `@${user.robloxUsername} · View profile` : "View profile"}
                  </span>
                </span>
              </button>
            )}

            {/* The same three categories, stacked — group labels stand in for
                the dropdowns so the structure reads identically on any screen */}
            {[
              {
                label: "Shop",
                items: [
                  { icon: Ticket, label: "Raffle", act: () => navigate("/raffle") },
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
                  { icon: PackageSearch, label: "Track Order", act: () => navigate("/orders") },
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
            {/* Display currency — same control, one shared context */}
            <div>
              <p className="px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: C.faint }}>
                Currency
              </p>
              <div className="px-5 pb-4 pt-1">
                <CurrencyMenu direction="down" />
              </div>
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
      <div className="wide-wrap mx-auto px-5 pt-12 sm:pt-16 pb-14 grid lg:grid-cols-2 gap-10 items-center">
        {/* Left — headline, sticker, description, CTA. On phones this whole
            block centers itself (matching the Browse hero) and the artwork
            below is dropped, so the heading is the first thing on screen. */}
        <div className="text-center sm:text-left">
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
            <p className="mt-5 text-[14.5px] leading-[1.65] max-w-[480px] mx-auto sm:mx-0" style={{ color: C.muted }}>
              Buy your favourite weapons, knives, pets, and more in Jailbreak
              with ease. RBstars delivers your items straight to your in-game
              mailbox once your order is confirmed.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-7 flex items-center gap-5 flex-wrap justify-center sm:justify-start">
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
                  <div className="pk-twinkle flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#aab4d4" }}>
                    <Star size={15} fill={C.starOn} color={C.starOn} />
                    <span style={{ color: C.text }}>{liveRating.rating.toFixed(1)}</span>
                    <span>· Verified reviews</span>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right — hero artwork. Hidden on phones: the heading should be the
            whole first screen there, the way the Browse hero reads. */}
        <Reveal delay={0.15} className="relative hidden sm:block">
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
/* These used to occupy their own band under the hero. They now live in the
   footer — same wordmarks, scaled to sit on the legal row's tier. */

export function PaymentMethods() {
  const methods = ["VISA", "Mastercard", "PayPal", "G Pay", "Apple Pay", "Discover"];
  return (
    <div className="mt-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: C.faint }}>
        Pay with
      </p>
      <div className="flex items-center gap-x-6 gap-y-3 flex-wrap">
        {methods.map((m) => (
          <span key={m} className="font-mont text-[14px] font-bold italic inline-flex items-center gap-1.5" style={{ color: "#aab3cf" }}>
            {m === "Apple Pay" ? (
              <>
                <svg className="h-[16px] w-auto" viewBox="0 0 384 512" fill="currentColor" aria-hidden>
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
    </div>
  );
}

/* ── Popular items — game tabs + product cards (real API data) ─────────── */

/* The card itself now lives in components/ProductCard.tsx so the same design
   can be reused by the shop grid. (The old inline card also referenced an
   undefined `product` variable in its image fallback — a latent crash whenever
   a product arrived without imageUrl.) */

function PopularItems({
  games, loadingGames, onNavigate,
}: {
  games: ShopGame[]; loadingGames: boolean;
  onNavigate: (to: string) => void;
}) {
  const [activeGame, setActiveGame] = useState("");
  /* Name filter for the grid below — sits to the left of the game tabs.
     Searching widens the cap so a real search isn't limited to 5 hits. */
  const [q, setQ] = useState("");
  const { addItem } = useCart();
  const query = q.trim().toLowerCase();
  /* The tab that's actually in effect: the visitor's pick, else the first
     game in the list (that's the one the UI highlights). */
  const gameSlug = activeGame || games[0]?.slug || "";

  /* Products follow the active tab. The list used to be fetched once (global
     best sellers) and only the highlight moved when a game was picked, so
     every tab showed the same first game's items. Each tab now loads its own
     game's best sellers; `alive` drops a late response from a tab the
     visitor already left. */
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  useEffect(() => {
    if (!gameSlug) return;
    let alive = true;
    setLoadingProducts(true);
    (async () => {
      const url = `${BACKEND}/api/products?game=${encodeURIComponent(gameSlug)}&sort=-salesCount&limit=10`;
      for (let round = 1; round <= 3; round++) {
        try {
          const res = await fetch(url);
          const d = await res.json();
          if (d?.success && Array.isArray(d.data)) {
            if (alive) { setProducts(d.data); setLoadingProducts(false); }
            return;
          }
        } catch { /* keep going */ }
        if (round < 3) await new Promise(r => setTimeout(r, 800 * round));
      }
      if (alive) { setProducts([]); setLoadingProducts(false); }
    })();
    return () => { alive = false; };
  }, [gameSlug]);

  const matched = query
    ? products.filter(p => p.name.toLowerCase().includes(query))
    : products;
  const shown = matched.slice(0, query ? 10 : 5);
  const gameName = games.find(g => g.slug === gameSlug)?.name || "items";

  return (
    <section id="popular" className="relative scroll-mt-20">
      <div className="wide-wrap mx-auto px-5 py-16">
        <Reveal>
          <h2 className="font-mont text-[28px] sm:text-[32px] font-bold text-center" style={{ color: C.text }}>
            Popular items
          </h2>
        </Reveal>

        {/* Search + game tabs — the search sits to the left of the game
            buttons and filters the cards underneath by name. */}
        <Reveal delay={0.08}>
          <div className="flex items-center gap-2.5 flex-wrap justify-center mt-5">
            <div className="relative">
              <Search size={14} color={C.faint} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search items..."
                aria-label="Search items"
                className="h-9 w-[180px] pl-8 pr-3 rounded-full text-[12.5px] font-medium outline-none transition-colors focus:border-[#1b86ff]"
                style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
              />
            </div>
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
            <div className="pop-rail grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="rounded-[18px] py-14 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <p className="text-[15px] font-semibold" style={{ color: C.text }}>
                {query ? `Nothing matches “${q.trim()}”.` : `No ${gameName} items listed yet.`}
              </p>
              <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>
                {query
                  ? "Try part of the item's name — seeds, vehicles, tools."
                  : "New stock shows up here as soon as it lands."}
              </p>
            </div>
          ) : (
            <div className="pop-rail grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                      /* the cart caps itself on this — see lib/stock.ts */
                      stock: effectiveStock(p),
                    })
                  }
                  product={{
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    originalPrice: p.originalPrice,
                    imageUrl: p.imageUrl || p.images?.[0],
                    imageShape: p.imageShape,
                    bestSeller: p.bestSeller,
                    stock: p.stock,
                    onHand: p.onHand,
                    /* The old check read `stock`, which drifts away from the
                       real count and marked stocked items as unavailable. */
                    outOfStock: isSoldOut({
                      stock: p.stock ?? null,
                      onHand: p.onHand ?? null,
                      outOfStock: p.outOfStock,
                    }),
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
      <div className="wide-wrap mx-auto px-5 py-16 grid sm:grid-cols-3 gap-10">
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
      <div className="wide-wrap mx-auto px-5 py-16 grid lg:grid-cols-[1fr_640px] gap-12 items-center">
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
      <div className="wide-wrap mx-auto px-5 py-16 grid sm:grid-cols-3 gap-5">
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

export function Testimonials() {
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
      <div className="wide-wrap mx-auto px-5 py-16">
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
      <div className="wide-wrap mx-auto px-5 py-16">
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
      <div className="wide-wrap mx-auto px-5 py-16">
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

/* Link columns, restricted to routes that exist in the router. Anything the
   reference design listed that this app doesn't have was removed rather than
   pointed somewhere approximate. */
const FOOTER_COLUMNS: Array<{ h: string; links: Array<{ label: string; href: string }> }> = [
  {
    h: "SHOP",
    links: [
      { label: "All games", href: "/browse" },
      { label: "Store home", href: "/" },
    ],
  },
  {
    h: "SUPPORT",
    links: [
      { label: "Help Centre", href: "/tickets" },
      { label: "Open a ticket", href: "/tickets/new" },
      { label: "Claim Chat", href: "/claim-chat" },
    ],
  },
  {
    h: "ACCOUNT",
    links: [
      { label: "My profile", href: "/profile" },
      { label: "Checkout", href: "/checkout" },
    ],
  },
  {
    h: "LEGAL",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refunds" },
      { label: "Terms of Use", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  const col = "flex flex-col gap-2.5";
  const h6 = "text-[14px] font-semibold mb-1.5";
  const a = "text-[15px] transition-colors hover:text-white";

  return (
    /* No top margin: the footer used to sit 20px below the page, and that gap
       showed the document background — a light strip between the navy page and
       the navy footer (glaring on /tickets, where the page box ends exactly at
       100vh). The footer's own pt-12 gives it all the breathing room it needs,
       and #0e1527 against the page's #111a2b is boundary enough. */
    <footer className="relative" style={{ background: C.footerBg }}>
      <div className="wide-wrap mx-auto px-5 pt-12 pb-8">
        {/* Brand + columns — 2 + 4 = 6 tracks, so the four link columns land
            on one row at md+ instead of stranding the last one underneath. */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <img src="/rb-logo.png" alt="RBstars" className="w-8 h-8 rounded-full object-cover" />
              <span className="font-mont text-[25px] font-bold" style={{ color: C.text }}>RBstars</span>
            </div>
          </div>

          {/* Every destination here is a real route. The reference layout had
              Blog / Backpack / Deposit / Area Trade / Bonus / Settings, none of
              which exist in this app — those are gone rather than pointed at
              whatever page happened to be nearby. */}
          {FOOTER_COLUMNS.map((c) => (
            <div className={col} key={c.h}>
              <h6 className={h6} style={{ color: C.text }}>{c.h}</h6>
              {c.links.map((l) => (
                <Link key={l.href + l.label} href={l.href} className={a} style={{ color: "#b3bbd2" }}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Currency picker — converts display prices using live rates. The
            card is always charged in USD, which the menu states outright. */}
        <div className="flex items-center gap-3 mt-9">
          <CurrencyMenu />
        </div>

        {/* Socials — rendered only for profiles we actually have a link for,
            so there is nothing on this row that leads nowhere. */}
        {LIVE_SOCIALS.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-7">
            {LIVE_SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[15px] transition-opacity hover:opacity-80"
                style={{ color: s.color || "#aab4d4" }}
              >
                <s.icon size={20} fill={s.color ? "currentColor" : undefined} /> {s.label}
              </a>
            ))}
          </div>
        )}

        {/* Legal — payment wordmarks sit on this tier too, since this is the
            block that talks about how you pay. */}
        <PaymentMethods />
        <div className="mt-7 pt-6 space-y-2.5" style={{ borderTop: "1px solid #1d2744" }}>
          <p className="text-[10.5px] leading-[1.7] max-w-[1100px]" style={{ color: "#9aa8cb" }}>
            RBstars is an independent store selling digital items for Roblox games. We are not affiliated with,
            endorsed by or sponsored by Roblox Corporation or any game developer. Payments are processed
            securely by Stripe; we never see or store full card details.
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
        {/* Payment methods used to sit here as their own band — they live in
            the footer now, which is where people look for them. */}
        <PopularItems
          games={games}
          loadingGames={gamesLoading}
          onNavigate={navigate}
        />
        <Stats />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Faq />
        <SeoText />
        <SiteFooter />
      </div>
    </main>
  );
}
