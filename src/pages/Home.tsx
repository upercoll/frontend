import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ShoppingCart, Star, Gamepad2, MessageCircle, Gift,
  Zap, Lock, Headphones, LayoutGrid,
  ChevronDown, ChevronLeft, ChevronRight, Search, ArrowRight, Package, Check, Tag, Youtube,
} from "lucide-react";
import {
  IconShield, IconBolt, IconHeadphones as SIHeadphones, IconRefund, IconCart, IconCreditCard,
  IconRocket, IconSearch, IconFilter, IconStar, IconFlame, IconClose, IconArrowRight, IconCheck,
  IconChevronDown, IconGift, IconPackage,
} from "@/components/SiteIcons";
import { CATEGORY_ICONS } from "@/components/SiteIcons";
import AnimatedGrid from "@/components/AnimatedGrid";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const HC = {
  bg: "#131C23", bgSecondary: "#18242D", card: "#1C2A34", elevated: "#22333F",
  border: "#2C414E", accent: "#3BA7FF", accentHover: "#5CB8FF", premium: "#7C5CFF",
  success: "#35D07F", textPrimary: "#F4F8FB", textSecondary: "#9BAEBB", textMuted: "#637784",
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15 + 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardPop = {
  rest:  { y: 0,  scale: 1,     boxShadow: "0 2px 10px rgba(28,42,52,0.07)" },
  hover: { y: -4, scale: 1.012, boxShadow: "0 14px 36px rgba(28,42,52,0.16)", transition: { duration: 0.22, ease: "easeOut" } },
  tap:   { y: 1,  scale: 0.977, boxShadow: "0 2px 8px rgba(28,42,52,0.09)",  transition: { duration: 0.1 } },
};

const steps = [
  { icon: IconCart,      number: "01", title: "Choose your items",    description: "Select the game you want, browse the matching collection, and pick the item you need.", image: "/step-choose.png" },
  { icon: IconCreditCard, number: "02", title: "Secure Checkout",     description: "Complete your purchase through our secure checkout — we accept all major cards and PayPal with 256-bit SSL encryption.", image: "/step-checkout.png" },
  { icon: IconRocket,    number: "03", title: "Fast Delivery",       description: "Our team delivers your items in minutes — just provide your Roblox username after checkout and we'll trade or gift them to you instantly.", image: "/step-delivery.png" },
];

type ShopGame = {
  _id: string;
  name: string;
  slug: string;
  gradient: { from: string; to: string };
  imageUrl?: string;
  bgImageUrl?: string;
  active?: boolean;
  productCount?: number;
};

type FeaturedYouTuber = { _id: string; name: string; username: string; subscribers: number; avatarUrl?: string; channelUrl: string };

function subscriberLabel(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M` : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}K` : n.toLocaleString(); }

/* ── Hero sub-components ──────────────────────────────────── */

function HeroSparkle({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <motion.svg
      className="absolute pointer-events-none"
      style={{ left: x, top: y, width: size, height: size }}
      viewBox="0 0 24 24"
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180] }}
      transition={{ duration: 2.4, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41Z" fill={color} />
    </motion.svg>
  );
}

function HeroBadge({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 rounded-xl"
      style={{ background: HC.card, border: "1px solid " + HC.border }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: HC.bgSecondary, border: "1px solid " + HC.border }}>
        {icon}
      </div>
      <div>
        <p className="text-base font-bold" style={{ color: HC.textPrimary }}>{title}</p>
        <p className="text-sm" style={{ color: HC.textSecondary }}>{subtitle}</p>
      </div>
    </div>
  );
}

function HeroShowcase({ children, style, accent, standColor }: { children: React.ReactNode; style?: React.CSSProperties; accent: string; standColor?: string }) {
  const stand = standColor || accent;
  return (
    <div className="relative flex flex-col items-center" style={style}>

      {/* Outer dispersed glow */}
      <div className="absolute pointer-events-none"
        style={{
          top: "-20%", left: "-25%", width: "150%", height: "160%",
          background: "radial-gradient(ellipse 52% 48% at 50% 40%, " + accent + "44 0%, " + accent + "20 40%, " + accent + "08 65%, transparent 82%)",
          filter: "blur(14px)",
        }} />
      <div className="absolute pointer-events-none"
        style={{
          top: "-35%", left: "-35%", width: "170%", height: "170%",
          background: "radial-gradient(ellipse 50% 55% at 50% 38%, " + accent + "18 0%, " + accent + "08 45%, transparent 75%)",
          filter: "blur(28px)",
        }} />
      <div className="absolute pointer-events-none"
        style={{
          top: "-50%", left: "-50%", width: "200%", height: "220%",
          background: "radial-gradient(ellipse at 50% 42%, " + accent + "0d 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />

      {/* Glass case — arched */}
      <div className="relative overflow-hidden w-full flex-1"
        style={{
          borderRadius: "46% 46% 8px 8px / 14% 14% 8px 8px",
          background: "rgba(18,26,33,0.75)",
          border: "1.5px solid " + accent + "40",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 40px " + accent + "18, 0 0 80px " + accent + "10, inset 0 1px 0 " + accent + "30, inset 0 -1px 0 rgba(255,255,255,0.03)",
        }}>
        {/* Inner top glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, " + accent + "22 0%, " + accent + "0c 50%, transparent 80%)",
          }} />
        {/* Inner side glow left */}
        <div className="absolute top-[5%] bottom-[10%] left-0 w-[40%] pointer-events-none"
          style={{
            background: "linear-gradient(90deg, " + accent + "14 0%, transparent 100%)",
          }} />
        {/* Inner side glow right */}
        <div className="absolute top-[5%] bottom-[10%] right-0 w-[40%] pointer-events-none"
          style={{
            background: "linear-gradient(270deg, " + accent + "14 0%, transparent 100%)",
          }} />
        {/* Top arch highlight */}
        <div className="absolute top-0 left-[8%] right-[8%] h-[1px] pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, " + accent + "aa, transparent)", boxShadow: "0 0 6px " + accent + "55" }} />
        {/* Inner glass reflection */}
        <div className="absolute top-[2%] left-[12%] right-[12%] h-[35%] pointer-events-none rounded-b-[50%]"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 55%, transparent 100%)" }} />
        {/* Side edges */}
        <div className="absolute top-[8%] bottom-[5%] left-0 w-[1px] pointer-events-none"
          style={{ background: "linear-gradient(180deg, " + accent + "55, transparent 25%, " + accent + "15)" }} />
        <div className="absolute top-[8%] bottom-[5%] right-0 w-[1px] pointer-events-none"
          style={{ background: "linear-gradient(180deg, " + accent + "45, transparent 25%, " + accent + "12)" }} />
        {/* Bottom edge */}
        <div className="absolute bottom-0 left-[5%] right-[5%] h-[1px] pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, " + accent + "30, transparent)" }} />
        {/* Content */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {children}
        </div>
      </div>

      {/* Ring connector */}
      <div className="relative w-3.5 h-3.5 rounded-full -mt-1.5 z-10"
        style={{
          border: "1.5px solid " + accent,
          background: "rgba(18,26,33,0.95)",
          boxShadow: "0 0 10px 3px " + accent + "77, 0 0 20px 6px " + accent + "44, 0 0 40px 10px " + accent + "1a",
        }} />

      {/* Stand */}
      <div className="w-[3px] h-5 z-10"
        style={{ background: "linear-gradient(180deg, " + stand + "66, " + stand + "30)" }} />
      <div className="relative w-[110%] h-3 rounded-b-xl rounded-t-sm z-10"
        style={{
          background: "linear-gradient(180deg, " + stand + "50, " + stand + "25)",
          boxShadow: "0 4px 16px " + stand + "33, 0 2px 40px " + stand + "18",
          border: "1px solid " + stand + "35",
          borderTop: "1px solid " + stand + "55",
        }} />
      {/* Ground glow */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[160%] h-8 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 55% 100% at center, " + accent + "55 0%, " + accent + "22 40%, transparent 70%)",
          filter: "blur(8px)",
        }} />
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[200%] h-12 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center, " + accent + "1a 0%, transparent 60%)",
          filter: "blur(16px)",
        }} />
    </div>
  );
}

/* ── MarqueeStrip ──────────────────────────────────────────── */

function MarqueeStrip({ games }: { games: ShopGame[] }) {
  if (!games.length) return null;
  const items = [...games, ...games, ...games, ...games];
  return (
    <div className="relative overflow-hidden py-3" style={{ background: HC.bg, borderTop: `1px solid ${HC.border}`, borderBottom: `1px solid ${HC.border}` }}>
      <div className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none" style={{ background: `linear-gradient(to right,${HC.bg},transparent)` }} />
      <div className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none" style={{ background: `linear-gradient(to left,${HC.bg},transparent)` }} />
      <div className="flex items-center gap-8 whitespace-nowrap" style={{ width: "max-content", animation: "rbTicker 40s linear infinite" }}>
        {items.map((game, i) => (
          <span key={`${game._id}-${i}`} className="text-xs font-semibold flex items-center gap-2" style={{ color: HC.textSecondary }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: game.gradient?.from || HC.accent }} />
            {game.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Marketplace ──────────────────────────────────────────── */


function AllGamesSection({ games }: { games: ShopGame[] }) {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter(g => g.name.toLowerCase().includes(q));
  }, [games, search]);

  return (
    <section className="relative py-20 overflow-hidden" style={{ background: HC.bg }}>
      <div className="relative z-10 px-6 sm:px-10 lg:px-16">
        {/* Header row — left aligned */}
        <div className="flex items-center gap-5 mb-3">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold shrink-0" style={{ color: HC.textPrimary, letterSpacing: "-0.025em" }}>
            Pick Your{" "}
            <span style={{ color: HC.accent }}>Game</span>
          </h2>
          {/* Search bar — matches heading size */}
          <div className="relative max-w-xs w-full">
            <IconSearch size={16} color={HC.textMuted} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search games..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-base font-semibold outline-none transition-all"
              style={{ background: HC.card, border: "1px solid " + HC.border, color: HC.textPrimary }}
              onFocus={e => (e.currentTarget.style.borderColor = HC.accent + "88")}
              onBlur={e => (e.currentTarget.style.borderColor = HC.border)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <IconClose size={16} color={HC.textMuted} />
              </button>
            )}
          </div>
          {/* View All Games — right side */}
          <button
            onClick={() => navigate("/browse")}
            className="ml-auto shrink-0 group/val relative"
          >
            <span className="text-sm font-bold" style={{ color: HC.textSecondary }}>View All Games</span>
            <span className="block h-0.5 rounded-full mt-1 transition-all duration-300 group-hover/val:w-full"
              style={{ background: HC.accent, width: "60%" }} />
          </button>
        </div>
        <p className="text-sm mb-8" style={{ color: HC.textSecondary }}>
          Choose a game to browse available items and make a purchase.
        </p>

        {/* Games grid — 5 per row on large */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {filtered.map((game, i) => (
            <motion.div
              key={game._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: 0.04 + i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }}
              className="relative rounded-2xl overflow-hidden group cursor-pointer"
              style={{ background: HC.card, border: "1px solid " + HC.border, aspectRatio: "1 / 1" }}
            >
              {/* Game image / gradient */}
              <div className="relative w-full h-full overflow-hidden">
                {game.imageUrl ? (
                  <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    style={{ background: game.gradient?.from || HC.accent }} />
                )}
                {/* Overlay */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
                {/* Game name — top left */}
                <div className="absolute top-4 left-4 right-4">
                  <p className="text-xl font-black leading-tight drop-shadow-lg" style={{ color: "white" }}>{game.name}</p>
                  {game.productCount != null && (
                    <p className="text-sm font-bold mt-1.5 drop-shadow-md" style={{ color: "rgba(255,255,255,0.75)" }}>{game.productCount} items</p>
                  )}
                </div>
                {/* Shop Now button — bottom center */}
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/game/" + game.slug); }}
                  className="absolute bottom-4 left-4 right-4 py-3 rounded-xl text-sm font-extrabold text-white transition-all duration-300"
                  style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                >
                  Shop Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── YouTuber trust bar ────────────────────────────────────── */

function YouTuberTrustBar({ creators }: { creators: FeaturedYouTuber[] }) {
  if (!creators.length) return null;
  const items = [...creators, ...creators];
  return <section className="relative px-4 py-12 overflow-hidden" style={{ background: HC.bg }}>
    <div className="max-w-6xl mx-auto relative">
      <div className="text-center mb-4"><span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: HC.accent }}>Trusted by top creators</span></div>
      <div className="relative overflow-hidden rounded-2xl p-3" style={{ background: HC.card, border: `1px solid ${HC.border}`, boxShadow: `0 12px 34px rgba(0,0,0,.2)` }}>
        <div className="flex gap-2.5 w-max" style={{ animation: "yt-trust-marquee 32s linear infinite" }}>
          {items.map((creator, index) => <a key={`${creator._id}-${index}`} href={creator.channelUrl} target="_blank" rel="noreferrer" className="group flex flex-col items-center justify-center gap-1.5 w-[104px] h-[112px] shrink-0 rounded-xl px-2 text-center transition-transform hover:-translate-y-1" style={{ background: HC.bgSecondary, border: `1px solid ${HC.border}`, boxShadow: "0 2px 6px rgba(0,0,0,.15)" }}>
            {creator.avatarUrl ? <img src={creator.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" style={{ border: `2px solid ${HC.border}` }} /> : <div className="h-11 w-11 rounded-full flex items-center justify-center" style={{ background: HC.accent }}><Youtube size={20} fill="white" color="white" /></div>}
            <p className="w-full truncate font-extrabold text-[11px]" style={{ color: HC.textPrimary }}>{creator.name || creator.username}</p>
            <p className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: HC.textSecondary }}><Youtube size={10} color="#dc2626" fill="#dc2626" /> {subscriberLabel(creator.subscribers)}</p>
          </a>)}
        </div>
      </div>
    </div>
  </section>;
}

const FALLBACK_GAMES: ShopGame[] = [
  { _id: "1", name: "Murder Mystery 2",         slug: "murder-mystery-2",         gradient: { from: "#1C2A34", to: "#22333F" } },
  { _id: "2", name: "Blade Ball",               slug: "blade-ball",               gradient: { from: "#22333F", to: "#2C414E" } },
  { _id: "3", name: "Grow A Garden 2",          slug: "grow-a-garden-2",          gradient: { from: "#15803D", to: "#22C55E" } },
  { _id: "4", name: "Steal A Brainrot",         slug: "steal-a-brainrot",         gradient: { from: "#EA580C", to: "#F97316" } },
  { _id: "5", name: "Blox Fruits",              slug: "blox-fruits",              gradient: { from: "#D97706", to: "#FBBF24" } },
  { _id: "6", name: "Garden Tower Defense",     slug: "garden-tower-defense",     gradient: { from: "#15803D", to: "#84CC16" } },
  { _id: "7", name: "99 Nights In The Forest",  slug: "99-nights-in-the-forest",  gradient: { from: "#1E3A5F", to: "#374151" } },
  { _id: "8", name: "Dress To Impress",         slug: "dress-to-impress",         gradient: { from: "#BE185D", to: "#EC4899" } },
  { _id: "9", name: "Pet Simulator 99",         slug: "pet-simulator-99",         gradient: { from: "#EC4899", to: "#F43F5E" } },
];


/* ── Helpers ──────────────────────────────────────────────── */

function ParticleField({ count = 22, light = false }: { count?: number; light?: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left:  5  + (i * 4.3 + (i % 3) * 7.1)  % 90,
      top:   3  + (i * 7.7 + (i % 5) * 11.3) % 94,
      size:  2  + (i % 4) * 0.9,
      dur:   6  + (i % 7) * 1.4,
      delay: -(i * 0.65),
      op: light ? 0.18 + (i % 4) * 0.08 : 0.12 + (i % 4) * 0.06,
    })), [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="rb-particle" style={{
          left: `${p.left}%`, top: `${p.top}%`,
          width: `${p.size}px`, height: `${p.size}px`,
          background: light ? `rgba(59,167,255,${p.op})` : `rgba(59,167,255,${p.op})`,
          animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
          ["--p-op" as string]: p.op,
        }} />
      ))}
    </div>
  );
}


/* ── Marquee ticker ─────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Instant Delivery", "Secure Payments", "10+ Games Supported",
  "4.9 Rating", "2,000+ Orders Delivered", "24/7 Live Support",
  "New Stock Added Daily", "Verified Sellers", "Fast & Trusted",
];

function MarqueeTicker() {
  // 4 copies so the -25% scroll = exactly one full set → seamless infinite loop
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden py-3" style={{ background: HC.bg, borderTop: `1px solid ${HC.border}`, borderBottom: `1px solid ${HC.border}` }}>
      <div className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none" style={{ background: `linear-gradient(to right,${HC.bg},transparent)` }} />
      <div className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none" style={{ background: `linear-gradient(to left,${HC.bg},transparent)` }} />
      <div
        className="flex items-center gap-8 whitespace-nowrap"
        style={{
          width: "max-content",
          animation: "rbTicker 32s linear infinite",
        }}
      >
        {items.map((item, i) => (
          <span key={i} className="text-xs font-semibold flex items-center gap-2" style={{ color: HC.textSecondary }}>
            {item}
            <span className="w-1 h-1 rounded-full inline-block ml-2" style={{ background: HC.border }} />
          </span>
        ))}
      </div>
    </div>
  );
}

const fallbackReviews = [
  { initials: "D", name: "Dawn Hughes", country: "United States", days: "76 days ago", stars: 5, text: "Cheap: the prices were much cheaper than other adopt me stores. Easy: it's idiot proof, all you do is join and it gives you your items instantly. Good service: every time I had an issue they responded really quickly." },
  { initials: "M", name: "Max Rivera",  country: "United Kingdom", days: "14 days ago", stars: 5, text: "Super fast delivery! Got my Blade Ball items within minutes. The support team was also really helpful when I had questions about my order." },
  { initials: "S", name: "Sara K",      country: "Canada",         days: "31 days ago", stars: 5, text: "Best place to buy Roblox items hands down. Trusted sellers, fair prices, and the whole process was smooth from start to finish." },
];
const avatarColors = ["#EA580C", "#15803D", "#2563EB"];

/* ── Home Page ────────────────────────────────────────────── */

export default function Home() {
  const [reviewIndex,  setReviewIndex]  = useState(0);
  const [reviews,      setReviews]      = useState(fallbackReviews);
  const [avgRating,    setAvgRating]    = useState<number | null>(null);
  const [games,        setGames]        = useState<ShopGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [featuredYouTubers, setFeaturedYouTubers] = useState<FeaturedYouTuber[]>([]);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [, navigate] = useLocation();

  const shopRef = useRef<HTMLElement>(null);
  /* section animation */

  /* fetch games for shop grid (retry — the backend can be slow to wake up) */
  useEffect(() => {
    async function attempt(round: number) {
      try {
        const res = await fetch(`${BACKEND}/api/games?active=true`);
        const d = await res.json();
        const fetched: ShopGame[] = d.data?.games || [];
        if (fetched.length > 0) {
          setGames(fetched);
          setGamesLoading(false);
          return;
        }
        if (round < 3) setTimeout(() => attempt(round + 1), 800 * round);
        else setGamesLoading(false);
      } catch {
        if (round < 3) setTimeout(() => attempt(round + 1), 800 * round);
        else setGamesLoading(false);
      }
    }
    attempt(1);
  }, []);

  useEffect(() => { fetch(`${BACKEND}/api/socials/featured-youtubers`).then(r => r.json()).then(d => setFeaturedYouTubers(d.data?.creators || [])).catch(() => {}); }, []);

  /* fetch reviews */
  useEffect(() => {
    fetch(`${BACKEND}/api/claims/public-reviews?limit=20`)
      .then(r => r.json())
      .then(data => {
        if (data?.data?.reviews?.length >= 3) {
          setReviews(data.data.reviews.map((r: { name: string; rating: number; comment: string; submittedAt: string }) => ({
            initials: r.name.charAt(0).toUpperCase(),
            name: r.name,
            country: "Verified",
            days: r.submittedAt ? `${Math.floor((Date.now() - new Date(r.submittedAt).getTime()) / 86400000)} days ago` : "Recently",
            stars: r.rating,
            text: r.comment,
          })));
        }
        if (data?.data?.averageRating) setAvgRating(data.data.averageRating);
      })
      .catch(() => {});
  }, []);

  /* auto-rotate reviews */
  useEffect(() => {
    const id = setInterval(() => setReviewIndex(p => (p + 1) % reviews.length), 3500);
    return () => clearInterval(id);
  }, [reviews.length]);

  /* listen for navbar Shop link event */
  useEffect(() => {
    const handler = () => shopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.addEventListener("rbstars:open-shop", handler);
    return () => window.removeEventListener("rbstars:open-shop", handler);
  }, []);

  /* section animation */

  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? games.filter(g => g.name.toLowerCase().includes(q)) : games;
  }, [games, searchQuery]);

  const rating = avgRating ?? 4.9;

  return (
    <main style={{ background: HC.bg, overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative flex flex-col overflow-hidden" style={{ background: HC.bg, minHeight: "70vh" }}>
        {/* Grid background — only behind showcase area */}
        <div className="absolute pointer-events-none" style={{ top: 0, right: 0, width: "55%", height: "100%", backgroundImage: "linear-gradient(to right, " + HC.accent + "12 1px, transparent 1px), linear-gradient(to bottom, " + HC.accent + "12 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse 70% 80% at 70% 50%, black 20%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 70% 50%, black 20%, transparent 70%)", opacity: 0.6 }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 60% at 65% 50%,rgba(59,167,255,0.06) 0%,transparent 70%)" }} />
        <ParticleField count={18} light={false} />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between flex-1 px-10 sm:px-20 pt-32 pb-10 gap-8 lg:gap-4 mx-auto w-full">

          {/* Left content */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Heading */}
            <motion.h1
              custom={1} initial="hidden" animate="visible" variants={fadeUp}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight max-w-xl"
              style={{ color: HC.textPrimary, letterSpacing: "-0.025em" }}
            >
              GET YOUR FAVOURITE{" "}
              <span style={{ color: HC.accent }}>IN-GAME ITEMS</span>
            </motion.h1>

            {/* Sub-copy */}
            <motion.p
              custom={2} initial="hidden" animate="visible" variants={fadeUp}
              className="mt-5 text-base sm:text-lg max-w-md"
              style={{ color: HC.textSecondary }}
            >
              Skip the grind. Get your items delivered in minutes — safely and securely.
            </motion.p>

            {/* Badges */}
            <motion.div
              custom={3} initial="hidden" animate="visible" variants={fadeUp}
              className="mt-8 flex flex-row flex-wrap gap-2.5"
            >
              <HeroBadge icon={<IconShield size={16} color={HC.accent} />} title="100%" subtitle="Secure" />
              <HeroBadge icon={<IconBolt size={16} color={HC.accent} />} title="Instant" subtitle="Delivery" />
              <HeroBadge icon={<SIHeadphones size={16} color={HC.accent} />} title="24/7" subtitle="Support" />
            </motion.div>

            {/* CTA */}
            <motion.div
              custom={4} initial="hidden" animate="visible" variants={fadeUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <motion.button
                data-testid="button-shop-now"
                onClick={() => navigate("/browse")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-gloss inline-flex items-center gap-3 px-10 py-4 rounded-full text-white text-lg font-bold"
                style={{ background: HC.accent, boxShadow: "0 6px 0 0 #2980b9, 0 8px 20px rgba(0,0,0,0.4), 0 0 30px " + HC.accent + "33, inset 0 1px 0 rgba(255,255,255,0.2)" }}
              >
                <IconCart size={20} color="white" /> Browse Games
              </motion.button>
            </motion.div>
          </div>

          {/* Right — glass display cases on stands */}
          <div className="flex items-end justify-center gap-8 sm:gap-12 lg:gap-14 relative min-h-[380px] sm:min-h-[440px]">
            {/* Shared ambient glow behind both cases */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 65% 55% at 38% 50%, " + HC.accent + "14 0%, transparent 60%), radial-gradient(ellipse 65% 55% at 62% 50%, #FF6B9D14 0%, transparent 60%), radial-gradient(ellipse 80% 70% at 50% 55%, rgba(255,255,255,0.02) 0%, transparent 50%)",
              }} />
            {/* Sparkles — scattered around both cases */}
            <HeroSparkle x="3%" y="5%" size={18} color={HC.accent} delay={0} />
            <HeroSparkle x="30%" y="0%" size={14} color="#FF6B9D" delay={0.6} />
            <HeroSparkle x="70%" y="3%" size={16} color={HC.accent} delay={1.2} />
            <HeroSparkle x="95%" y="8%" size={14} color="#FF6B9D" delay={1.8} />
            <HeroSparkle x="0%" y="55%" size={12} color="#FF6B9D" delay={2.4} />
            <HeroSparkle x="48%" y="15%" size={20} color={HC.accent} delay={0.3} />
            <HeroSparkle x="88%" y="50%" size={16} color={HC.accent} delay={1.0} />
            <HeroSparkle x="15%" y="80%" size={10} color="#FF6B9D" delay={2.8} />
            <HeroSparkle x="60%" y="85%" size={12} color={HC.accent} delay={1.5} />

            {/* ── Floating icon plaques ── */}

            {/* Left plaque — blue, to the left of the blue case */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.8, rotate: -6 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: -6 }}
              transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-20"
              style={{ left: "-12%", bottom: "42%", transform: "rotate(-6deg)" }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(18,26,33,0.85)",
                  border: "1.5px solid " + HC.accent + "55",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 20px " + HC.accent + "33, 0 0 40px " + HC.accent + "18, inset 0 1px 0 " + HC.accent + "25",
                }}
              >
                <img src="/hero-yamini.png" alt="" className="w-11 h-11 object-contain" />
              </motion.div>
              <div className="absolute -inset-4 pointer-events-none rounded-3xl"
                style={{
                  background: "radial-gradient(ellipse at center, " + HC.accent + "18 0%, transparent 70%)",
                  filter: "blur(8px)",
                }} />
            </motion.div>

            {/* Right plaque — pink, to the right of the pink case */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.8, rotate: 8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 8 }}
              transition={{ delay: 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-20"
              style={{ right: "-12%", bottom: "45%", transform: "rotate(8deg)" }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="relative flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(18,26,33,0.85)",
                  border: "1.5px solid #FF6B9D55",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 20px #FF6B9D33, 0 0 40px #FF6B9D18, inset 0 1px 0 #FF6B9D25",
                }}
              >
                <img src="/hero-yamini.png" alt="" className="w-10 h-10 object-contain" />
              </motion.div>
              <div className="absolute -inset-4 pointer-events-none rounded-3xl"
                style={{
                  background: "radial-gradient(ellipse at center, #FF6B9D18 0%, transparent 70%)",
                  filter: "blur(8px)",
                }} />
            </motion.div>

            {/* Center plaque — between the two cases */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.7, rotate: 14 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 14 }}
              transition={{ delay: 1.0, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-20"
              style={{ left: "50%", bottom: "60%", marginLeft: "-28px", transform: "rotate(14deg)" }}
            >
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [14, 10, 14] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(18,26,33,0.85)",
                  border: "1.5px solid " + HC.accent + "44",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 16px " + HC.accent + "28, 0 0 32px #FF6B9D14, inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <img src="/hero-molten.png" alt="" className="w-10 h-10 object-contain" />
              </motion.div>
              <div className="absolute -inset-4 pointer-events-none rounded-3xl"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)",
                  filter: "blur(8px)",
                }} />
            </motion.div>

            {/* Left case — blue glow */}
            <motion.div
              custom={2} initial="hidden" animate="visible"
              variants={{
                hidden: { opacity: 0, y: 50, scale: 0.85 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="flex-1 max-w-[240px] h-[260px] sm:h-[320px] relative"
            >
              <HeroShowcase accent={HC.accent} style={{ width: "100%", height: "100%" }}>
                <img src="/hero-left.webp" alt="Premium item" className="w-full h-full object-contain p-4" />
              </HeroShowcase>
            </motion.div>

            {/* Right case — pink/purple glow */}
            <motion.div
              custom={3} initial="hidden" animate="visible"
              variants={{
                hidden: { opacity: 0, y: 50, scale: 0.85 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { delay: 0.75, duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="flex-1 max-w-[240px] h-[240px] sm:h-[300px] relative"
            >
              <HeroShowcase accent="#FF6B9D" style={{ width: "100%", height: "100%" }}>
                <img src="/hero-right.webp" alt="Rare item" className="w-full h-full object-contain p-4" />
              </HeroShowcase>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MARKETPLACE
      ══════════════════════════════════════════ */}
      <AllGamesSection games={games.length > 0 ? games : FALLBACK_GAMES} />

      {/* ══════════════════════════════════════════
          HOW IT WORKS (3 step cards)
      ══════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="relative py-20 overflow-hidden"
        style={{ background: HC.bg }}
      >
        <div className="relative z-10 px-6 sm:px-10 lg:px-16">
          {/* Header — left aligned */}
          <div className="mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: HC.textPrimary, letterSpacing: "-0.025em" }}>
              How It{" "}
              <span style={{ color: HC.accent }}>Works</span>
            </h2>
            <p className="mt-2 text-sm" style={{ color: HC.textSecondary }}>Three easy steps and your items are on their way.</p>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: 0.05 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-2xl overflow-hidden group"
                  style={{ background: HC.card, border: "1px solid " + HC.border }}
                >
                  {/* Image or icon */}
                  {(step as { image?: string }).image ? (
                    <div className="relative w-full overflow-hidden flex items-center justify-center p-5">
                      <img src={(step as { image: string }).image} alt={step.title} className="w-full h-auto max-h-48 object-contain" />
                    </div>
                  ) : (
                    <div className="relative p-6">
                      {/* Step number watermark */}
                      <span className="absolute top-4 right-5 text-[64px] font-black leading-none select-none pointer-events-none"
                        style={{ color: "rgba(59,167,255,0.06)" }}>{step.number}</span>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: HC.accent, boxShadow: "0 4px 14px " + HC.accent + "44" }}>
                        <StepIcon size={20} color="white" />
                      </div>
                    </div>
                  )}
                  {/* Text content */}
                  <div className="p-6 pt-0">
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: HC.accent }}>{step.number}</span>
                    <h3 className="font-display font-bold text-lg mt-1 mb-2" style={{ color: HC.textPrimary }}>{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: HC.textSecondary }}>{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CUSTOMER REVIEWS
      ══════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden dot-grid" style={{ background: HC.bg }}>
        {/* Subtle grain texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "180px 180px", mixBlendMode: "multiply" }} />
        <div className="relative z-10 px-6 sm:px-10 lg:px-16">
          <div className="mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: HC.textPrimary, letterSpacing: "-0.025em" }}>
              Trusted By{" "}
              <span style={{ color: HC.accent }}>2,000+</span>{" "}
              Customers
            </h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center gap-8 sm:gap-10"
          >
            {/* Left — mascot */}
            <div className="flex-shrink-0 flex flex-col items-center text-center">
              <div className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
                <img src="/review-mascot.png" alt="" className="w-full h-full object-contain" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-extrabold mt-3" style={{ color: HC.textPrimary, letterSpacing: "-0.02em" }}>
                Real Players,{" "}
                <span style={{ color: HC.accent }}>Real Reviews</span>
              </h3>
              <p className="text-xs mt-1.5 max-w-[200px]" style={{ color: HC.textSecondary }}>
                Thousands of happy customers trust RBstars.
              </p>
            </div>

            {/* Right — rotating review */}
            <div className="flex-1 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={reviewIndex}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-xl p-6"
                  style={{ background: HC.bgSecondary, border: `1px solid ${HC.border}` }}
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(reviews[reviewIndex]?.stars ?? 5)].map((_, i) => <IconStar key={i} size={14} color="#FBBF24" />)}
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: HC.textPrimary }}>
                    "{reviews[reviewIndex]?.text}"
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                      style={{ background: avatarColors[reviewIndex % avatarColors.length] }}>
                      {reviews[reviewIndex]?.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: HC.textPrimary }}>{reviews[reviewIndex]?.name}</p>
                      <p className="text-xs" style={{ color: HC.textSecondary }}>{reviews[reviewIndex]?.country}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              {/* Dots */}
              <div className="flex items-center gap-1.5 mt-4">
                {reviews.map((_, i) => (
                  <button key={i} onClick={() => setReviewIndex(i)}
                    className="rounded-full transition-all duration-300"
                    style={{ width: i === reviewIndex ? 20 : 7, height: 7, background: i === reviewIndex ? HC.accent : HC.border }}
                  />
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </section>
    </main>
  );
}
