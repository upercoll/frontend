import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import {
  ShoppingCart, Star, Gamepad2, MessageCircle, Gift,
  Zap, Lock, Headphones, LayoutGrid,
  ChevronDown, ChevronLeft, ChevronRight, Search, ArrowRight, Package, Check, Tag,
} from "lucide-react";
import GameSelectModal from "@/components/GameSelectModal";
import AnimatedGrid from "@/components/AnimatedGrid";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15 + 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardPop = {
  rest:  { y: 0,  scale: 1,     boxShadow: "0 2px 10px rgba(49,46,128,0.07)" },
  hover: { y: -4, scale: 1.012, boxShadow: "0 14px 36px rgba(49,46,128,0.16)", transition: { duration: 0.22, ease: "easeOut" } },
  tap:   { y: 1,  scale: 0.977, boxShadow: "0 2px 8px rgba(49,46,128,0.09)",  transition: { duration: 0.1 } },
};

const steps = [
  { icon: Gamepad2,      number: "01", title: "Choose your game",    description: "Select the game you want, browse the matching collection, and pick the item you need." },
  { icon: MessageCircle, number: "02", title: "Reach out",           description: "Select the chat icon in the bottom-right corner and choose 'How To Claim Items.' Provide your Roblox username and order number, then wait for claim times to open." },
  { icon: Gift,          number: "03", title: "Receive your items",  description: "Our team will add you on Roblox to complete the trade or gift your purchased items instantly." },
];

type ShopGame = {
  _id: string;
  name: string;
  slug: string;
  gradient: { from: string; to: string };
  imageUrl?: string;
  active?: boolean;
  productCount?: number;
};

type MiniProduct = {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  stock?: number;
  gradient: { from: string; to: string };
};

const FALLBACK_GAMES: ShopGame[] = [
  { _id: "1", name: "Murder Mystery 2",         slug: "murder-mystery-2",         gradient: { from: "#6d28d9", to: "#4c1d95" } },
  { _id: "2", name: "Blade Ball",               slug: "blade-ball",               gradient: { from: "#4c1d95", to: "#2e1065" } },
  { _id: "3", name: "Grow A Garden",            slug: "grow-a-garden",            gradient: { from: "#16a34a", to: "#4ade80" } },
  { _id: "4", name: "Steal A Brainrot",         slug: "steal-a-brainrot",         gradient: { from: "#ea580c", to: "#f97316" } },
  { _id: "5", name: "Blox Fruits",              slug: "blox-fruits",              gradient: { from: "#d97706", to: "#fbbf24" } },
  { _id: "6", name: "Garden Tower Defense",     slug: "garden-tower-defense",     gradient: { from: "#15803d", to: "#84cc16" } },
  { _id: "7", name: "99 Nights In The Forest",  slug: "99-nights-in-the-forest",  gradient: { from: "#1e3a5f", to: "#374151" } },
  { _id: "8", name: "Dress To Impress",         slug: "dress-to-impress",         gradient: { from: "#be185d", to: "#ec4899" } },
  { _id: "9", name: "Pet Simulator 99",         slug: "pet-simulator-99",         gradient: { from: "#ec4899", to: "#f43f5e" } },
];

const features = [
  { icon: Zap,        title: "Fast and Reliable",   desc: "Our Claim Support Team ensures your items are delivered almost instantly.",                                                        accent: "#312E80", iconBg: "rgba(49,46,128,0.1)"  },
  { icon: Lock,       title: "Secure Transactions", desc: "We use trusted payment systems to keep your data safe and secure.",                                                                accent: "#4338CA", iconBg: "rgba(67,56,202,0.1)"   },
  { icon: Headphones, title: "Unmatched Support",   desc: "Our friendly live chat support team is available around the clock to assist you with any questions.",                              accent: "#312E80", iconBg: "rgba(49,46,128,0.1)"  },
  { icon: LayoutGrid, title: "Wide Variety",        desc: "From Jailbreak to Grow A Garden we have everything you need to enhance your gaming experience.",                                  accent: "#4338CA", iconBg: "rgba(67,56,202,0.1)"   },
];

const faqs = [
  { q: "Is RBstars a trusted place to buy game items?",       a: "Yes! RBstars is a trusted and secure platform with thousands of successful transactions. Our safe payment methods, instant delivery, and dedicated support team ensure a smooth and risk-free shopping experience." },
  { q: "What is your refund policy?",                          a: "We offer refunds on purchases where delivery was not completed. Please contact our support team within 24 hours of your purchase to initiate a refund request." },
  { q: "Can I get free items?",                                a: "RBstars occasionally runs promotions and giveaways on our social media channels. Join our Discord for free gifts." },
  { q: "How do I receive my purchased items?",                 a: "After purchasing, click the chat icon in the bottom-right corner and select 'How To Claim Items.' Provide your Roblox username and order number. Our team will then add you on Roblox to complete the trade." },
  { q: "Can I trade my in-game items for items on RBstars?",  a: "Currently we do not accept in-game items as payment. All purchases must be made through our supported payment methods." },
  { q: "What if I don't receive my items after purchasing?",   a: "If you haven't received your items within the expected timeframe, contact our support team immediately via the chat widget. We monitor all orders and will resolve any delivery issues promptly." },
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
          background: light ? `rgba(49,46,128,${p.op})` : `rgba(165,180,252,${p.op})`,
          animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
          ["--p-op" as string]: p.op,
        }} />
      ))}
    </div>
  );
}

function GlareCard({ children, className, style, delayClass = "" }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; delayClass?: string;
}) {
  return (
    <motion.div
      initial="rest" whileHover="hover" whileTap="tap" variants={cardPop}
      className={`relative overflow-hidden cursor-pointer ${className ?? ""}`}
      style={style}
    >
      {children}
      <div className={`rb-glare-indigo ${delayClass}`} />
    </motion.div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial="rest" whileHover="hover" whileTap="tap" variants={cardPop}
      className="rounded-2xl overflow-hidden cursor-pointer bg-white"
      style={{ border: "1.5px solid rgba(49,46,128,0.1)" }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        style={{ background: open ? "rgba(49,46,128,0.06)" : "transparent" }}
      >
        <span className="font-semibold text-sm leading-snug" style={{ color: "#1E1B4B" }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex-shrink-0">
          <ChevronDown size={18} color="#312E80" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="c"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-5 pt-1 pb-4 text-sm leading-relaxed" style={{ color: "#5B5EA8" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Mini product card (used in Top Picks section) ─────────── */
function MiniProductCard({ product, game, index }: { product: MiniProduct; game: ShopGame; index: number }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (product.stock === 0) return;
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      gradient: [product.gradient.from, product.gradient.to],
      image: product.imageUrl,
      game: game.slug,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  }

  const savings = product.originalPrice
    ? (product.originalPrice - product.price).toFixed(2)
    : null;
  const outOfStock = product.stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.88 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: 0.1 + index * 0.14, duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col rounded-2xl overflow-hidden relative group"
      style={{
        background: "rgba(255,255,255,0.055)",
        border: "1.5px solid rgba(165,180,252,0.13)",
        boxShadow: "0 2px 16px rgba(10,8,40,0.18)",
      }}
      whileHover={{
        y: -6,
        boxShadow: `0 22px 48px ${game.gradient.from}38, 0 2px 16px rgba(10,8,40,0.24)`,
        borderColor: "rgba(165,180,252,0.32)",
      }}
    >
      {/* Image / gradient area — image is outside the animated div so it never floats */}
      <div className="relative overflow-hidden" style={{ paddingTop: "82%" }}>
        {/* Static gradient bg */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${product.gradient.from} 0%, ${product.gradient.to} 100%)` }}
        >
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "16px 16px" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 55% at 50% 0%,rgba(255,255,255,0.22) 0%,transparent 70%)" }} />
        </div>
        {/* Shimmer on hover — purely decorative overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.18) 50%,transparent 70%)", x: "-110%" }}
          variants={{ hover: { x: "110%", transition: { duration: 0.52, ease: "easeInOut" } } }}
        />
        {/* Product image — stationary, never animates y */}
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ pointerEvents: "none" }}
          />
        )}
        {/* Badges */}
        {savings && !outOfStock && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: "#dc2626", color: "white" }}>
            <Tag size={8} /> Save ${savings}
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(10,8,30,0.62)", backdropFilter: "blur(2px)" }}>
            <span className="text-xs font-bold" style={{ color: "#818CF8" }}>Out of Stock</span>
          </div>
        )}
        {/* Add-to-cart button */}
        {!outOfStock && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="absolute bottom-2 right-2 z-20 h-8 px-3 rounded-full flex items-center gap-1.5 shadow-lg text-white text-xs font-semibold"
            style={{
              background: justAdded ? "rgba(16,185,129,0.95)" : "rgba(79,70,229,0.92)",
              border: "1.5px solid rgba(255,255,255,0.28)",
              transition: "background 0.22s ease",
            }}
          >
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.span key="c" className="flex items-center gap-1.5" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                  <Check size={13} color="white" strokeWidth={3} />
                  Added!
                </motion.span>
              ) : (
                <motion.span key="s" className="flex items-center gap-1.5" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  transition={{ duration: 0.14 }}>
                  <ShoppingCart size={13} color="white" />
                  Add to Cart
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {/* Info row */}
      <div className="p-3 flex flex-col gap-1">
        <p className="text-[11px] font-semibold leading-tight text-white line-clamp-2">{product.name}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-extrabold" style={{ color: "#A5B4FC" }}>${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-[10px] line-through" style={{ color: "#475569" }}>${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GameProductRow({ game, onNavigate }: { game: ShopGame; onNavigate: (slug: string) => void }) {
  const [products, setProducts] = useState<MiniProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView || loaded) return;
    setLoaded(true);
    fetch(`${BACKEND}/api/products/game/${game.slug}?limit=3`)
      .then(r => r.json())
      .then(data => {
        const raw: MiniProduct[] = (data.data || [])
          .filter((p: Record<string, unknown>) => (p.stock as number) !== 0)
          .slice(0, 3)
          .map((p: Record<string, unknown>) => ({
          _id: p._id as string,
          name: p.name as string,
          price: p.price as number,
          originalPrice: p.originalPrice as number | undefined,
          imageUrl: p.imageUrl as string | undefined,
          stock: p.stock as number | undefined,
          gradient: (p.gradient as { from: string; to: string }) || { from: game.gradient?.from || "#4F46E5", to: game.gradient?.to || "#1E1B4B" },
        }));
        setProducts(raw);
      })
      .catch(() => {});
  }, [isInView, loaded, game.slug]);

  const c1 = game.gradient?.from || "#4F46E5";
  const c2 = game.gradient?.to   || "#1E1B4B";

  return (
    <div ref={rowRef} className="mb-10">
      {/* Game banner */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          {/* Game icon */}
          <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`, boxShadow: `0 4px 14px ${c1}55` }}>
            {game.imageUrl ? (
              <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Gamepad2 size={18} color="rgba(255,255,255,0.9)" />
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(165,180,252,0.55)" }}>Top Picks</p>
            <h3 className="text-[15px] font-extrabold text-white leading-tight">{game.name}</h3>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.06, background: "rgba(255,255,255,0.12)" }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onNavigate(game.slug)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold"
          style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(165,180,252,0.2)", color: "#A5B4FC", transition: "background 0.18s" }}
        >
          View All <ArrowRight size={11} />
        </motion.button>
      </motion.div>

      {/* Product cards grid */}
      <div className="grid grid-cols-3 gap-3">
        {products.length > 0
          ? products.map((p, i) => <MiniProductCard key={p._id} product={p} game={game} index={i} />)
          : [0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl animate-pulse"
                style={{ paddingTop: "calc(82% + 64px)", background: "rgba(255,255,255,0.035)", border: "1.5px dashed rgba(165,180,252,0.08)" }} />
            ))
        }
      </div>
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
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden py-3" style={{ background: "linear-gradient(90deg,#1E1B4B 0%,#312E80 50%,#1E1B4B 100%)", borderTop: "1px solid rgba(165,180,252,0.15)", borderBottom: "1px solid rgba(165,180,252,0.15)" }}>
      {/* Left/right fade masks */}
      <div className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to right,#1E1B4B,transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to left,#1E1B4B,transparent)" }} />
      <motion.div
        className="flex items-center gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
        style={{ width: "max-content" }}
      >
        {items.map((item, i) => (
          <span key={i} className="text-xs font-semibold flex items-center gap-2" style={{ color: "rgba(165,180,252,0.85)" }}>
            {item}
            <span className="w-1 h-1 rounded-full inline-block ml-2" style={{ background: "rgba(165,180,252,0.3)" }} />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const fallbackReviews = [
  { initials: "D", name: "Dawn Hughes", country: "United States", days: "76 days ago", stars: 5, text: "Cheap: the prices were much cheaper than other adopt me stores. Easy: it's idiot proof, all you do is join and it gives you your items instantly. Good service: every time I had an issue they responded really quickly." },
  { initials: "M", name: "Max Rivera",  country: "United Kingdom", days: "14 days ago", stars: 5, text: "Super fast delivery! Got my Blade Ball items within minutes. The support team was also really helpful when I had questions about my order." },
  { initials: "S", name: "Sara K",      country: "Canada",         days: "31 days ago", stars: 5, text: "Best place to buy Roblox items hands down. Trusted sellers, fair prices, and the whole process was smooth from start to finish." },
];
const avatarColors = ["#ea580c", "#16a34a", "#2563eb"];

/* ── Home Page ────────────────────────────────────────────── */

export default function Home() {
  const [shopOpen,     setShopOpen]     = useState(false);
  const [reviewIndex,  setReviewIndex]  = useState(0);
  const [reviews,      setReviews]      = useState(fallbackReviews);
  const [avgRating,    setAvgRating]    = useState<number | null>(null);
  const [games,        setGames]        = useState<ShopGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [, navigate] = useLocation();

  const shopRef = useRef<HTMLElement>(null);
  const howRef  = useRef<HTMLElement>(null);

  /* fetch games for shop grid */
  useEffect(() => {
    fetch(`${BACKEND}/api/games?active=true`)
      .then(r => r.json())
      .then(d => { const fetched: ShopGame[] = d.data?.games || []; if (fetched.length > 0) setGames(fetched); })
      .catch(() => {})
      .finally(() => setGamesLoading(false));
  }, []);

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

  /* listen for navbar Shop link event */
  useEffect(() => {
    const handler = () => shopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.addEventListener("rbstars:open-shop", handler);
    return () => window.removeEventListener("rbstars:open-shop", handler);
  }, []);

  /* how-it-works progress line */
  const { scrollYProgress: howProg } = useScroll({ target: howRef, offset: ["start 0.85", "end 0.5"] });
  const rawLineH = useTransform(howProg, [0, 1], ["0%", "100%"]);
  const lineH    = useSpring(rawLineH, { stiffness: 90, damping: 26 });

  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? games.filter(g => g.name.toLowerCase().includes(q)) : games;
  }, [games, searchQuery]);

  const rating = avgRating ?? 4.9;

  return (
    <main>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden line-grid-dark">
        <div className="absolute inset-0"><AnimatedGrid /></div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(10,8,40,.55) 0%,rgba(15,12,50,.60) 50%,rgba(10,8,40,.75) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%,rgba(49,46,128,.22) 0%,transparent 70%)" }} />
        <ParticleField count={28} light={false} />

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-4 pt-24 pb-16">

          {/* Trust badge */}
          <motion.div
            custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 overflow-hidden"
            style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(165,180,252,.4)", backdropFilter: "blur(10px)" }}
          >
            <div className="rb-glare rb-glare-d1" />
            <div className="flex items-center gap-0.5 relative z-10">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <span className="text-white text-sm font-bold relative z-10">2k+</span>
            <span className="text-[#A5B4FC] text-sm relative z-10">Happy Customers</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl mx-auto"
            style={{ letterSpacing: "-0.025em" }}
          >
            Instantly buy your favourite{" "}
            <span className="gradient-text">Roblox Game Item</span>{" "}
            from the most trusted dealers!
          </motion.h1>

          {/* Sub-copy */}
          <motion.p
            custom={2} initial="hidden" animate="visible" variants={fadeUp}
            className="mt-5 text-base sm:text-lg max-w-xl mx-auto"
            style={{ color: "rgba(165,180,252,0.85)" }}
          >
            Skip the grind. Get your items delivered in minutes — safely and securely.
          </motion.p>

          {/* Dual CTAs */}
          <motion.div
            custom={3} initial="hidden" animate="visible" variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              data-testid="button-shop-now"
              onClick={() => setShopOpen(true)}
              whileHover={{ scale: 1.07, boxShadow: "0 0 40px rgba(79,70,229,0.65), 0 0 80px rgba(49,46,128,0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-white text-lg font-bold shadow-xl"
              style={{ background: "linear-gradient(135deg,#4F46E5 0%,#312E80 100%)" }}
            >
              <ShoppingCart size={20} /> Shop Now
            </motion.button>
            <motion.button
              onClick={() => shopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.14)" }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white text-base font-semibold"
              style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(165,180,252,0.35)", backdropFilter: "blur(8px)" }}
            >
              Browse Games <ArrowRight size={16} />
            </motion.button>
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          MARQUEE TICKER
      ══════════════════════════════════════════ */}
      <MarqueeTicker />

      {/* ══════════════════════════════════════════
          SHOP BY GAME  (replaces Tutorials)
      ══════════════════════════════════════════ */}
      <section
        id="shop-games"
        ref={shopRef}
        className="relative py-20 px-4 overflow-hidden"
        style={{ backgroundColor: "#F7FAFF" }}
      >
        <div className="absolute inset-0 dot-grid pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%,rgba(49,46,128,.07) 0%,transparent 70%)" }} />
        <ParticleField count={16} light={true} />

        <div className="max-w-5xl mx-auto relative z-10">

          {/* Section header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(49,46,128,.08)", border: "1px solid rgba(49,46,128,.15)" }}>
              <Gamepad2 size={13} color="#312E80" />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#312E80" }}>Browse &amp; Buy Instantly</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: "#1E1B4B", letterSpacing: "-0.025em" }}>
              Shop by{" "}
              <span className="gradient-text-purple">Game</span>
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#5B5EA8" }}>
              Pick your game, find what you need, and get it delivered in minutes.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto mb-10">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="#5B5EA8" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search games…"
              className="w-full pl-10 pr-4 py-3 rounded-full text-sm font-medium bg-white outline-none transition-all"
              style={{ border: "1.5px solid rgba(49,46,128,0.15)", color: "#1E1B4B", boxShadow: "0 2px 8px rgba(49,46,128,0.06)" }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(79,70,229,0.55)", e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)")}
              onBlur={e  => (e.currentTarget.style.borderColor = "rgba(49,46,128,0.15)", e.currentTarget.style.boxShadow = "0 2px 8px rgba(49,46,128,0.06)")}
            />
          </div>

          {/* Game grid */}
          <AnimatePresence mode="wait">
            {gamesLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse" style={{ aspectRatio: "4/5", background: "rgba(49,46,128,0.08)", border: "1.5px solid rgba(49,46,128,0.1)" }} />
                ))}
              </motion.div>
            ) : filteredGames.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-16" style={{ color: "#5B5EA8" }}>
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">{searchQuery ? `No games found for "${searchQuery}"` : "No games available yet"}</p>
                {searchQuery && <button onClick={() => setSearchQuery("")} className="mt-3 text-sm font-bold" style={{ color: "#4F46E5" }}>Clear search</button>}
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredGames.map((game, i) => {
                  const c1 = game.gradient?.from || "#6d28d9";
                  const c2 = game.gradient?.to   || "#4c1d95";
                  return (
                    <motion.button
                      key={game._id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                      whileHover="hover"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate(`/game/${game.slug}`)}
                      className="relative flex flex-col rounded-2xl overflow-hidden text-left"
                      style={{ border: "1.5px solid rgba(49,46,128,0.12)", aspectRatio: "4 / 5" }}
                      variants={{
                        hover: { scale: 1.04, boxShadow: `0 0 0 2px ${c1}cc, 0 18px 44px ${c1}44`, transition: { duration: 0.22 } },
                      }}
                    >
                      {/* Gradient bg */}
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${c1} 0%,${c2} 100%)` }} />
                      {/* Grid texture */}
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
                      {/* Game image */}
                      {game.imageUrl && <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-75" />}
                      {/* Shimmer on hover */}
                      <motion.div className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.22) 50%,transparent 65%)", x: "-100%" }}
                        variants={{ hover: { x: "100%", transition: { duration: 0.5, ease: "easeInOut" } } }}
                      />
                      {/* Bottom gradient */}
                      <div className="absolute inset-x-0 bottom-0 h-3/5" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.88) 0%,transparent 100%)" }} />
                      {/* Item count badge */}
                      {game.productCount !== undefined && (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(6px)" }}>
                          {game.productCount} items
                        </div>
                      )}
                      {/* Name + CTA */}
                      <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2">
                        <span className="text-white font-bold text-sm leading-tight" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                          {game.name}
                        </span>
                        <motion.div
                          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                          style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(6px)" }}
                          variants={{ hover: { background: "rgba(255,255,255,0.95)", color: c1, transition: { duration: 0.18 } } }}
                        >
                          Shop <ArrowRight size={10} />
                        </motion.div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* View all CTA */}
          {!searchQuery && (
            <div className="text-center mt-12">
              <motion.button
                onClick={() => setShopOpen(true)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-white"
                style={{ background: "linear-gradient(135deg,#4F46E5 0%,#312E80 100%)", boxShadow: "0 8px 28px rgba(49,46,128,0.38)" }}
              >
                <ShoppingCart size={16} /> View All Games
              </motion.button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TOP PICKS BY GAME (scroll-reveal products)
      ══════════════════════════════════════════ */}
      <section className="relative py-20 px-4 overflow-hidden line-grid-dark" style={{ backgroundColor: "#0F0C2E" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(79,70,229,.13) 0%,transparent 65%)" }} />
        <ParticleField count={20} light={false} />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Section header */}
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(165,180,252,.1)", border: "1px solid rgba(165,180,252,.22)" }}
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
              />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A5B4FC" }}>Live Stock</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-3xl sm:text-4xl font-extrabold text-white"
              style={{ letterSpacing: "-0.025em" }}
            >
              Top Picks,{" "}
              <span style={{ background: "linear-gradient(90deg,#818CF8,#C4B5FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Every Game
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-3 text-sm max-w-md mx-auto"
              style={{ color: "rgba(165,180,252,0.7)" }}
            >
              Scroll to reveal our hottest recommended items — add them straight to your cart.
            </motion.p>
          </div>

          {/* Game rows */}
          {games.slice(0, 6).map(game => (
            <GameProductRow key={game._id} game={game} onNavigate={slug => navigate(`/game/${slug}`)} />
          ))}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 36px rgba(79,70,229,0.55)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShopOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-white"
              style={{ background: "linear-gradient(135deg,#4F46E5 0%,#312E80 100%)", boxShadow: "0 8px 28px rgba(49,46,128,0.45)" }}
            >
              <ShoppingCart size={16} /> Browse All Games
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section
        id="how-it-works"
        ref={howRef}
        className="relative py-20 px-4 overflow-hidden dot-grid"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(49,46,128,.06) 0%,transparent 70%)", transform: "translate(30%,-30%)" }} />
        <ParticleField count={14} light={true} />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(49,46,128,.08)", border: "1px solid rgba(49,46,128,.15)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#312E80" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#312E80" }}>Simple Process</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: "#1E1B4B", letterSpacing: "-0.025em" }}>
              How It{" "}
              <span className="gradient-text-purple">Works</span>
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#5B5EA8" }}>Three easy steps and your items are on their way.</p>
          </div>

          <div className="relative">
            {/* Animated progress line */}
            <div className="absolute left-[28px] top-8 bottom-8 w-px" style={{ background: "rgba(49,46,128,0.1)" }}>
              <motion.div className="w-full rounded-full" style={{ height: lineH, background: "linear-gradient(to bottom,#4F46E5,#312E80)" }} />
            </div>

            <div className="flex flex-col gap-10">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div key={step.number}
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-5"
                  >
                    {/* Step icon */}
                    <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                      style={{ background: "linear-gradient(135deg,#4F46E5 0%,#312E80 100%)" }}>
                      <Icon size={22} color="white" strokeWidth={2} />
                    </div>
                    <GlareCard className="flex-1 p-5 rounded-2xl bg-white" style={{ border: "1.5px solid rgba(49,46,128,0.1)" }}>
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#A5B4FC" }}>{step.number}</span>
                        <h3 className="font-display font-bold text-base mt-1 mb-2" style={{ color: "#1E1B4B" }}>{step.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: "#5B5EA8" }}>{step.description}</p>
                      </div>
                    </GlareCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY CHOOSE
      ══════════════════════════════════════════ */}
      <section className="relative py-20 px-4 overflow-hidden dot-grid" style={{ backgroundColor: "#F7FAFF" }}>
        <ParticleField count={20} light={true} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 80% 50%,rgba(49,46,128,.06) 0%,transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 20% 50%,rgba(67,56,202,.05) 0%,transparent 60%)" }} />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(49,46,128,.08)", border: "1px solid rgba(49,46,128,.15)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#312E80" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#312E80" }}>Why Us</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: "#1E1B4B", letterSpacing: "-0.025em" }}>
              Why Choose{" "}
              <span className="gradient-text-purple">RBstars?</span>
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              const delayClasses = ["rb-glare-d1", "rb-glare-d2", "rb-glare-d3", "rb-glare-d4"];
              return (
                <motion.div key={f.title}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.58, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <GlareCard delayClass={delayClasses[i % delayClasses.length]}
                    className="p-6 rounded-2xl bg-white" style={{ border: "1.5px solid rgba(49,46,128,0.1)" }}>
                    <div data-testid={`card-feature-${i + 1}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.iconBg }}>
                        <Icon size={20} color={f.accent} strokeWidth={2} />
                      </div>
                      <h3 className="font-display font-bold text-base mb-2" style={{ color: "#1E1B4B" }}>{f.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#5B5EA8" }}>{f.desc}</p>
                    </div>
                  </GlareCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="relative py-20 px-4 overflow-hidden line-grid-dark" style={{ backgroundColor: "#0F0C2E" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%,rgba(79,70,229,.12) 0%,transparent 70%)" }} />
        <ParticleField count={18} light={false} />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(165,180,252,.1)", border: "1px solid rgba(165,180,252,.2)" }}>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A5B4FC" }}>Reviews</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: "white", letterSpacing: "-0.025em" }}>
              Trusted by{" "}
              <span style={{ background: "linear-gradient(135deg,#A5B4FC 0%,#6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Thousands
              </span>
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewIndex}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(165,180,252,0.12)" }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(reviews[reviewIndex]?.stars ?? 5)].map((_, i) => <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.85)" }}>
                "{reviews[reviewIndex]?.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: avatarColors[reviewIndex % avatarColors.length] }}>
                  {reviews[reviewIndex]?.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{reviews[reviewIndex]?.name}</p>
                  <p className="text-xs" style={{ color: "#A5B4FC" }}>{reviews[reviewIndex]?.country} · {reviews[reviewIndex]?.days}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-6">
            <motion.button
              data-testid="button-prev-review"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setReviewIndex(p => (p - 1 + reviews.length) % reviews.length)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white"
              style={{ border: "1.5px solid rgba(49,46,128,0.2)" }}
            >
              <ChevronLeft size={16} color="#312E80" />
            </motion.button>
            <motion.button
              data-testid="button-next-review"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setReviewIndex(p => (p + 1) % reviews.length)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white"
              style={{ border: "1.5px solid rgba(49,46,128,0.2)" }}
            >
              <ChevronRight size={16} color="#312E80" />
            </motion.button>
            <div className="flex items-center gap-1.5 ml-2">
              {reviews.map((_, i) => (
                <button key={i} onClick={() => setReviewIndex(i)}
                  className="rounded-full transition-all duration-200"
                  style={{ width: i === reviewIndex ? 20 : 7, height: 7, background: i === reviewIndex ? "#4F46E5" : "rgba(165,180,252,0.25)" }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section className="relative py-20 px-4 overflow-hidden dot-grid" style={{ backgroundColor: "#F7FAFF" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(49,46,128,.25),transparent)" }} />
        <ParticleField count={10} light={true} />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-2" style={{ color: "#1E1B4B", letterSpacing: "-0.025em" }}>
              Frequently Asked{" "}
              <span className="gradient-text-purple">Questions</span>
            </h2>
            <p style={{ color: "#5B5EA8" }}>Got questions? We've got answers.</p>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      <GameSelectModal open={shopOpen} onClose={() => setShopOpen(false)} />
    </main>
  );
}
