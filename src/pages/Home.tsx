import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import {
  ShoppingCart, Star, Gamepad2, MessageCircle, Gift,
  Zap, Lock, Headphones, LayoutGrid,
  ChevronLeft, ChevronRight, Search, ArrowRight, Package, Check, Tag, Youtube,
} from "lucide-react";
import GameSelectModal from "@/components/GameSelectModal";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12 + 0.35, duration: 0.65, ease: EASE_OUT },
  }),
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
  bgImageUrl?: string;
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
type FeaturedYouTuber = { _id: string; name: string; username: string; subscribers: number; avatarUrl?: string; channelUrl: string };

function subscriberLabel(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M` : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}K` : n.toLocaleString(); }

const features = [
  { icon: Zap,        title: "Fast and Reliable",   desc: "Our Claim Support Team ensures your items are delivered almost instantly.", accent: "#E2231A" },
  { icon: Lock,       title: "Secure Transactions", desc: "We use trusted payment systems to keep your data safe and secure.",         accent: "#0A84FF" },
  { icon: Headphones, title: "Unmatched Support",   desc: "Our friendly live chat support team is available around the clock to assist you with any questions.", accent: "#00B06F" },
  { icon: LayoutGrid, title: "Wide Variety",        desc: "From Jailbreak to Grow A Garden we have everything you need to enhance your gaming experience.", accent: "#FFC800" },
];

const faqs = [
  { q: "Is RBstars a trusted place to buy game items?",       a: "Yes! RBstars is a trusted and secure platform with thousands of successful transactions. Our safe payment methods, instant delivery, and dedicated support team ensure a smooth and risk-free shopping experience." },
  { q: "What is your refund policy?",                          a: "We offer refunds on purchases where delivery was not completed. Please contact our support team within 24 hours of your purchase to initiate a refund request." },
  { q: "Can I get free items?",                                a: "RBstars occasionally runs promotions and giveaways on our social media channels. Join our Discord for free gifts." },
  { q: "How do I receive my purchased items?",                 a: "After purchasing, click the chat icon in the bottom-right corner and select 'How To Claim Items.' Provide your Roblox username and order number. Our team will then add you on Roblox to complete the trade." },
  { q: "Can I trade my in-game items for items on RBstars?",  a: "Currently we do not accept in-game items as payment. All purchases must be made through our supported payment methods." },
  { q: "What if I don't receive my items after purchasing?",   a: "If you haven't received your items within the expected timeframe, contact our support team immediately via the chat widget. We monitor all orders and will resolve any delivery issues promptly." },
];

const TICKER_ITEMS = [
  "Instant Delivery", "Secure Payments", "10+ Games Supported",
  "4.9 Rating", "2,000+ Orders Delivered", "24/7 Live Support",
  "New Stock Added Daily", "Verified Sellers", "Fast & Trusted",
];

const fallbackReviews = [
  { initials: "D", name: "Dawn Hughes", country: "United States", days: "76 days ago", stars: 5, text: "Cheap: the prices were much cheaper than other adopt me stores. Easy: it's idiot proof, all you do is join and it gives you your items instantly. Good service: every time I had an issue they responded really quickly." },
  { initials: "M", name: "Max Rivera",  country: "United Kingdom", days: "14 days ago", stars: 5, text: "Super fast delivery! Got my Blade Ball items within minutes. The support team was also really helpful when I had questions about my order." },
  { initials: "S", name: "Sara K",      country: "Canada",         days: "31 days ago", stars: 5, text: "Best place to buy Roblox items hands down. Trusted sellers, fair prices, and the whole process was smooth from start to finish." },
];
const avatarColors = ["#E2231A", "#00B06F", "#0A84FF"];

/* ── Editorial section header ─────────────────────────────── */
function SectionHead({ idx, title, accentWord, note }: { idx: string; title: React.ReactNode; accentWord?: React.ReactNode; note?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-end justify-between gap-6 mb-10"
    >
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] mb-3" style={{ color: "#E2231A" }}>{idx}</p>
        <h2 className="font-display text-4xl sm:text-5xl uppercase leading-[0.95]" style={{ color: "#131313" }}>
          {title}{accentWord != null && <>{" "}<span className="text-outline">{accentWord}</span></>}
        </h2>
      </div>
      {note && (
        <p className="hidden sm:block font-mono text-[11px] uppercase tracking-[0.14em] leading-relaxed text-right max-w-[240px] opacity-60">
          {note}
        </p>
      )}
    </motion.div>
  );
}

/* ── FAQ accordion ────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden bg-white cursor-pointer transition-shadow"
      style={{ border: "2px solid #131313", boxShadow: open ? "5px 5px 0 #131313" : "none" }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-bold text-sm leading-snug" style={{ color: "#131313" }}>{q}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: open ? "#E2231A" : "#F2EEE5", border: "2px solid #131313" }}
        >
          <span className="relative block w-3 h-[2.5px]" style={{ background: open ? "#fff" : "#131313" }}>
            <span className="absolute inset-0 rotate-90" style={{ background: open ? "transparent" : "#131313", opacity: open ? 0 : 1 }} />
          </span>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="c"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-5 pt-1 pb-5 text-sm leading-relaxed" style={{ color: "#6B655C" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Mini product card (Top Picks dark rows) ──────────────── */
function MiniProductCard({ product, game, index }: { product: MiniProduct; game: ShopGame; index: number }) {
  const { addItem } = useCart();
  const [, navigate] = useLocation();
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
      bgImageUrl: game.bgImageUrl,
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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/product/${product._id}`)}
      whileHover={{ y: -5, boxShadow: "5px 6px 0 rgba(242,238,229,.92)" }}
      className="flex flex-col rounded-2xl overflow-hidden relative group cursor-pointer"
      style={{
        background: "#1B1B1B",
        border: "2px solid rgba(242,238,229,.2)",
        transition: "box-shadow .2s ease",
      }}
    >
      {/* Art */}
      <div className="relative overflow-hidden" style={{ paddingTop: "82%" }}>
        {game.bgImageUrl ? (
          <div className="absolute inset-0">
            <img src={game.bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(19,19,19,.25)" }} />
          </div>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: product.gradient.from }} />
            <div className="absolute inset-0 pattern-dots-light opacity-60" />
          </>
        )}
        {product.imageUrl && (
          game.bgImageUrl ? (
            <img src={product.imageUrl} alt={product.name}
              className="absolute object-contain pointer-events-none"
              style={{ inset: "8% 10%", width: "80%", height: "84%", filter: "drop-shadow(0 5px 12px rgba(0,0,0,.55))" }} />
          ) : (
            <img src={product.imageUrl} alt={product.name}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          )
        )}

        {savings && !outOfStock && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold text-white -rotate-3"
            style={{ background: "#E2231A", border: "1.5px solid #131313" }}>
            <Tag size={8} /> Save ${savings}
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(19,19,19,.62)", backdropFilter: "blur(2px)" }}>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#F2EEE5" }}>Out of Stock</span>
          </div>
        )}

        {!outOfStock && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleAdd}
            aria-label="Add to cart"
            className="absolute bottom-2 right-2 z-20 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors"
            style={{
              background: justAdded ? "#00B06F" : "#E2231A",
              borderColor: "#131313",
              color: "#fff",
              boxShadow: "2px 2px 0 rgba(19,19,19,.9)",
            }}
          >
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.span key="c" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                  <Check size={14} strokeWidth={3} />
                </motion.span>
              ) : (
                <motion.span key="s" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.14 }}>
                  <ShoppingCart size={14} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-lg leading-none" style={{ color: "#F2EEE5" }}>${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-[10px] line-through" style={{ color: "rgba(242,238,229,.4)" }}>${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <p className="text-[11px] font-medium leading-tight line-clamp-2" style={{ color: "rgba(242,238,229,.78)" }}>{product.name}</p>
      </div>
    </motion.div>
  );
}

function GameProductRow({ game, onNavigate }: { game: ShopGame; onNavigate: (slug: string) => void }) {
  const [products, setProducts] = useState<MiniProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInViewOnce(rowRef);

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
          gradient: (p.gradient as { from: string; to: string }) || { from: game.gradient?.from || "#E2231A", to: game.gradient?.to || "#131313" },
        }));
        setProducts(raw);
      })
      .catch(() => {});
  }, [isInView, loaded, game.slug]);

  const c1 = game.gradient?.from || "#E2231A";

  return (
    <div ref={rowRef} className="mb-10">
      {/* Row banner */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border-2"
            style={{ background: c1, borderColor: "rgba(242,238,229,.35)" }}>
            <div className="absolute inset-0 pattern-dots-light opacity-60" />
            {game.imageUrl ? (
              <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-80" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"><Gamepad2 size={18} color="#fff" /></div>
            )}
          </div>
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.28em] mb-0.5" style={{ color: "rgba(242,238,229,.45)" }}>Top Picks</p>
            <h3 className="font-display text-lg text-[#F2EEE5] leading-none tracking-wide">{game.name}</h3>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "#E2231A", borderColor: "#E2231A" }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onNavigate(game.slug)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.14em] border-2 transition-colors"
          style={{ borderColor: "rgba(242,238,229,.35)", color: "#F2EEE5" }}
        >
          View All <ArrowRight size={11} />
        </motion.button>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {products.length > 0
          ? products.map((p, i) => <MiniProductCard key={p._id} product={p} game={game} index={i} />)
          : [0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl animate-pulse"
                style={{ paddingTop: "calc(82% + 58px)", background: "rgba(242,238,229,.05)", border: "2px dashed rgba(242,238,229,.12)" }} />
            ))
        }
      </div>
    </div>
  );
}

function useInViewOnce(ref: React.RefObject<HTMLDivElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      entries => entries.forEach(en => { if (en.isIntersecting) { setInView(true); obs.disconnect(); } }),
      { rootMargin: "-80px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, inView]);
  return inView;
}

/* ── Red marquee band ─────────────────────────────────────── */
function MarqueeTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <section className="relative py-8 overflow-hidden" aria-hidden="true">
      <div className="band-red mx-[-2vw] w-[104vw]">
        <div className="marquee-track flex items-center">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-6 pr-6 py-3.5 whitespace-nowrap">
              <span className="font-display text-xl sm:text-2xl uppercase tracking-wide">{item}</span>
              <span className="tilt-sq !bg-white" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Featured YouTubers ───────────────────────────────────── */
function YouTuberTrustBar({ creators }: { creators: FeaturedYouTuber[] }) {
  if (!creators.length) return null;
  return (
    <section className="py-12 border-y-[3px] border-[#131313]" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.3em] mb-6" style={{ color: "#6B655C" }}>
          Trusted by top creators
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
          {creators.map((creator, index) => (
            <a key={`${creator._id}-${index}`} href={creator.channelUrl} target="_blank" rel="noreferrer"
              className="group flex flex-col items-center justify-center gap-1.5 w-[116px] shrink-0 rounded-2xl px-2 py-4 text-center bg-white transition-transform hover:-translate-y-1"
              style={{ border: "2px solid #131313", boxShadow: "4px 4px 0 #131313" }}>
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover border-2" style={{ borderColor: "#131313" }} />
              ) : (
                <div className="h-11 w-11 rounded-full flex items-center justify-center border-2" style={{ background: "#E2231A", borderColor: "#131313" }}>
                  <Youtube size={18} color="#fff" fill="#fff" />
                </div>
              )}
              <p className="w-full truncate font-bold text-[11px]">{creator.name || creator.username}</p>
              <p className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "#6B655C" }}>
                <Youtube size={10} color="#dc2626" fill="#dc2626" /> {subscriberLabel(creator.subscribers)}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   HOME PAGE
════════════════════════════════════════════════════════════ */
export default function Home() {
  const [shopOpen,     setShopOpen]     = useState(false);
  const [reviewIndex,  setReviewIndex]  = useState(0);
  const [reviews,      setReviews]      = useState(fallbackReviews);
  const [avgRating,    setAvgRating]    = useState<number | null>(null);
  const [games,        setGames]        = useState<ShopGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [featuredYouTubers, setFeaturedYouTubers] = useState<FeaturedYouTuber[]>([]);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [, navigate] = useLocation();

  const shopRef = useRef<HTMLElement>(null);
  const howRef  = useRef<HTMLElement>(null);

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
    <main style={{ background: "#F2EEE5" }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden dot-grid">
        {/* deco tiles */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
          <motion.div
            animate={{ rotate: [12, 22, 12], y: [0, -14, 0] }}
            transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
            className="absolute right-[8%] top-[16%] w-44 h-44 rounded-3xl border-[3px]"
            style={{ borderColor: "rgba(19,19,19,.16)" }}
          />
          <motion.div
            animate={{ rotate: [-8, 4, -8], y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 11, ease: "easeInOut" }}
            className="absolute right-[24%] top-[52%] w-16 h-16 rounded-2xl flex items-center justify-center border-2"
            style={{ background: "#FFC800", borderColor: "#131313", boxShadow: "5px 5px 0 rgba(19,19,19,.9)" }}
          >
            <Star size={26} fill="#131313" color="#131313" />
          </motion.div>
          <motion.div
            animate={{ rotate: [14, 2, 14], y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute right-[10%] bottom-[14%] w-20 h-20 rounded-2xl flex items-center justify-center border-2"
            style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "6px 6px 0 rgba(19,19,19,.9)" }}
          >
            <Zap size={30} color="#fff" fill="#fff" />
          </motion.div>
          <motion.div
            animate={{ rotate: [-14, -4, -14], y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            className="absolute right-[32%] top-[22%] w-12 h-12 rounded-xl flex items-center justify-center border-2"
            style={{ background: "#0A84FF", borderColor: "#131313", boxShadow: "4px 4px 0 rgba(19,19,19,.9)" }}
          >
            <Gamepad2 size={20} color="#fff" />
          </motion.div>
          <div className="absolute right-[6%] bottom-[38%] w-64 h-64 rounded-full border-[3px] border-dashed opacity-20" style={{ borderColor: "#131313" }} />
        </div>

        <div className="relative max-w-6xl mx-auto w-full px-4 pt-32 pb-20 text-center">
          {/* Trust badge */}
          <motion.div
            custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 bg-white"
            style={{ border: "2px solid #131313", boxShadow: "3px 3px 0 #131313" }}
          >
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#FFC800" color="#131313" strokeWidth={1.5} />)}
            </div>
            <span className="font-mono text-xs font-semibold" style={{ color: "#131313" }}>
              {rating} · 2k+ Happy Customers
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display uppercase leading-[0.94] text-[clamp(52px,9vw,128px)]">
            <span className="block overflow-hidden pb-1">
              <motion.span
                className="block"
                initial={{ y: "115%" }} animate={{ y: 0 }}
                transition={{ delay: 0.35, duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
                style={{ color: "#131313" }}
              >
                Skip the grind<span style={{ color: "#E2231A" }}>.</span>
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-2">
              <motion.span
                className="block"
                initial={{ y: "115%" }} animate={{ y: 0 }}
                transition={{ delay: 0.48, duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
              >
                <span className="text-outline">Own the game</span><span style={{ color: "#E2231A", WebkitTextStroke: "0" }}>.</span>
              </motion.span>
            </span>
          </h1>

          {/* Sub copy */}
          <motion.p
            custom={2} initial="hidden" animate="visible" variants={fadeUp}
            className="mt-6 text-base sm:text-lg max-w-xl mx-auto font-medium"
            style={{ color: "#55503F" }}
          >
            Instantly buy your favourite Roblox game items from the most trusted dealers — delivered in minutes, safely and securely.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={3} initial="hidden" animate="visible" variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              data-testid="button-shop-now"
              onClick={() => setShopOpen(true)}
              whileHover={{ translateX: -2, translateY: -2, boxShadow: "8px 8px 0 #131313" }}
              whileTap={{ translateX: 2, translateY: 2, boxShadow: "2px 2px 0 #131313" }}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-white font-mono font-semibold uppercase tracking-[0.14em] text-base border-[3px]"
              style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}
            >
              <ShoppingCart size={20} /> Shop Now
            </motion.button>
            <motion.button
              onClick={() => shopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              whileHover={{ scale: 1.04, y: -2, boxShadow: "6px 6px 0 #131313" }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-mono font-semibold uppercase tracking-[0.14em] text-sm bg-white border-[3px]"
              style={{ color: "#131313", borderColor: "#131313" }}
            >
              Browse Games <ArrowRight size={16} />
            </motion.button>
          </motion.div>

          {/* Stat chips */}
          <motion.div
            custom={4} initial="hidden" animate="visible" variants={fadeUp}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {["Instant Delivery", "Secure Payments", "10+ Games", "24/7 Support"].map(s => (
              <span key={s} className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#55503F" }}>
                <span className="tilt-sq !w-2 !h-2" />{s}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ MARQUEE BAND ══════════ */}
      <MarqueeTicker />

      {/* ══════════ SHOP BY GAME ══════════ */}
      <section
        id="shop-games"
        ref={shopRef}
        className="relative py-24 px-4 scroll-mt-24"
      >
        <div className="max-w-6xl mx-auto">

          <SectionHead
            idx="(01) — Browse & Buy Instantly"
            title={<>Shop by <span className="text-outline">Game</span></>}
            note="Pick your game, find what you need, get it delivered in minutes."
          />

          {/* Search bar */}
          <div className="relative max-w-md mb-10">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" color="#6B655C" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="SEARCH GAMES…"
              className="w-full pl-10 pr-4 py-3.5 rounded-full font-mono text-xs font-medium uppercase tracking-[0.14em] bg-white outline-none placeholder:text-[#8a8375] transition-shadow"
              style={{ border: "2px solid #131313" }}
              onFocus={e => (e.currentTarget.style.boxShadow = "4px 4px 0 #131313")}
              onBlur={e  => (e.currentTarget.style.boxShadow = "none")}
            />
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            {gamesLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse" style={{ aspectRatio: "4/5", background: "rgba(19,19,19,.06)", border: "2px solid rgba(19,19,19,.15)" }} />
                ))}
              </motion.div>
            ) : filteredGames.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-16 rounded-3xl bg-white" style={{ border: "2px dashed rgba(19,19,19,.35)" }}>
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold">{searchQuery ? `No games found for "${searchQuery}"` : "No games available yet"}</p>
                {searchQuery && <button onClick={() => setSearchQuery("")} className="mt-3 font-mono text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "#E2231A" }}>Clear search</button>}
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredGames.map((game, i) => {
                  const c1 = game.gradient?.from || "#E2231A";
                  return (
                    <motion.button
                      key={game._id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -6, boxShadow: "7px 8px 0 #131313" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/game/${game.slug}`)}
                      className="relative flex flex-col rounded-2xl overflow-hidden text-left"
                      style={{ border: "2.5px solid #131313", aspectRatio: "4 / 5", background: c1, transition: "box-shadow .2s ease" }}
                    >
                      <div className="absolute inset-0 pattern-dots-light opacity-60" />
                      {game.imageUrl && <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-75" />}
                      <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(to top,rgba(19,19,19,.72),transparent)" }} />

                      {game.productCount !== undefined && (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider bg-white"
                          style={{ border: "1.5px solid #131313", color: "#131313" }}>
                          {game.productCount} items
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2">
                        <span className="text-white font-bold text-sm leading-tight" style={{ textShadow: "0 1px 3px rgba(0,0,0,.9)" }}>
                          {game.name}
                        </span>
                        <motion.div
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white transition-colors"
                          style={{ border: "2px solid #131313", color: "#131313" }}
                          whileHover={{ rotate: -45, backgroundColor: "#E2231A", color: "#fff" }}
                        >
                          <ArrowRight size={13} />
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
                whileHover={{ translateX: -2, translateY: -2, boxShadow: "7px 7px 0 #131313" }}
                whileTap={{ translateX: 2, translateY: 2, boxShadow: "2px 2px 0 #131313" }}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-mono font-semibold uppercase tracking-[0.14em] text-sm text-white border-[3px]"
                style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}
              >
                <ShoppingCart size={16} /> View All Games
              </motion.button>
            </div>
          )}
        </div>
      </section>

      <YouTuberTrustBar creators={featuredYouTubers} />

      {/* ══════════ TOP PICKS (dark) ══════════ */}
      <section className="relative py-24 px-4 pattern-stripe-light" style={{ backgroundColor: "#131313" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-end justify-between gap-6 mb-12"
          >
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] mb-3 flex items-center gap-2" style={{ color: "rgba(242,238,229,.5)" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "#00B06F", boxShadow: "0 0 8px #00B06F" }} />
                (02) — Live Stock
              </p>
              <h2 className="font-display text-4xl sm:text-5xl uppercase leading-[0.95] text-[#F2EEE5]">
                Top Picks,{" "}<span className="text-outline-paper">Every Game</span>
              </h2>
            </div>
            <p className="hidden sm:block font-mono text-[11px] uppercase tracking-[0.14em] leading-relaxed text-right max-w-[240px]" style={{ color: "rgba(242,238,229,.45)" }}>
              Hottest recommended items — add them straight to your cart.
            </p>
          </motion.div>

          {games.slice(0, 6).map(game => (
            <GameProductRow key={game._id} game={game} onNavigate={slug => navigate(`/game/${slug}`)} />
          ))}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mt-4"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShopOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-mono font-semibold uppercase tracking-[0.14em] text-sm text-[#131313] border-[3px]"
              style={{ background: "#FFC800", borderColor: "#F2EEE5", boxShadow: "4px 4px 0 rgba(242,238,229,.9)" }}
            >
              <ShoppingCart size={16} /> Browse All Games
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section
        id="how-it-works"
        ref={howRef}
        className="relative py-24 px-4 pattern-check scroll-mt-24"
      >
        <div className="max-w-3xl mx-auto">
          <SectionHead
            idx="(03) — Simple Process"
            title={<>How It <span className="text-outline">Works</span></>}
            note="Three easy steps and your items are on their way."
          />

          <div className="relative">
            {/* Animated progress line */}
            <div className="absolute left-[26px] top-10 bottom-10 w-[3px] rounded-full" style={{ background: "rgba(19,19,19,.12)" }}>
              <motion.div className="w-full rounded-full" style={{ height: lineH, background: "#E2231A" }} />
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
                    <div className="relative z-10 flex-shrink-0 w-[54px] h-[54px] -rotate-3 rounded-2xl flex items-center justify-center bg-white"
                      style={{ border: "2.5px solid #131313", boxShadow: "3px 3px 0 #131313" }}>
                      <Icon size={22} strokeWidth={2.2} />
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex-1 p-5 rounded-2xl bg-white"
                      style={{ border: "2px solid #131313", boxShadow: "4px 4px 0 #131313" }}
                    >
                      <span className="font-display text-2xl leading-none" style={{ color: "#E2231A" }}>{step.number}</span>
                      <h3 className="font-bold text-base mt-1.5 mb-1.5">{step.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#6B655C" }}>{step.description}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ WHY CHOOSE ══════════ */}
      <section className="relative py-24 px-4" style={{ borderTop: "3px solid #131313", borderBottom: "3px solid #131313", background: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHead
            idx="(04) — Why Us"
            title={<>Why Choose <span className="text-outline">RBstars?</span></>}
            note="Built by gamers, for gamers."
          />

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, boxShadow: "6px 6px 0 #131313" }}
                  data-testid={`card-feature-${i + 1}`}
                  className="p-6 rounded-2xl relative"
                  style={{ border: "2px solid #131313", background: "#F7F4EC", boxShadow: "3px 3px 0 #131313", transition: "box-shadow .2s ease, transform .2s ease" }}
                >
                  <div className="w-11 h-11 -rotate-3 rounded-xl flex items-center justify-center mb-4 border-2"
                    style={{ background: f.accent, borderColor: "#131313" }}>
                    <Icon size={20} color="#fff" strokeWidth={2.2} />
                  </div>
                  <h3 className="font-bold text-base mb-1.5">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B655C" }}>{f.desc}</p>
                  <span className="tilt-sq absolute top-5 right-5 opacity-40" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="relative py-24 px-4 pattern-dots-light" style={{ background: "#131313" }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] mb-3 flex items-center gap-2" style={{ color: "rgba(242,238,229,.5)" }}>
              <Star size={12} fill="#FFC800" color="#FFC800" /> (05) — Reviews
            </p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase leading-[0.95] text-[#F2EEE5]">
              Trusted by <span className="text-outline-paper">Thousands</span>
            </h2>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewIndex}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-6"
              style={{ background: "#1B1B1B", border: "2px solid rgba(242,238,229,.2)" }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(reviews[reviewIndex]?.stars ?? 5)].map((_, i) => <Star key={i} size={15} fill="#FFC800" color="#131313" strokeWidth={1.5} />)}
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(242,238,229,.88)" }}>
                "{reviews[reviewIndex]?.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 border-2"
                  style={{ background: avatarColors[reviewIndex % avatarColors.length], borderColor: "#F2EEE5" }}>
                  {reviews[reviewIndex]?.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F2EEE5]">{reviews[reviewIndex]?.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(242,238,229,.5)" }}>{reviews[reviewIndex]?.country} · {reviews[reviewIndex]?.days}</p>
                </div>
                <span className="tilt-sq ml-auto opacity-50" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-6">
            <motion.button
              data-testid="button-prev-review"
              whileHover={{ scale: 1.1, backgroundColor: "#E2231A", borderColor: "#E2231A" }} whileTap={{ scale: 0.9 }}
              onClick={() => setReviewIndex(p => (p - 1 + reviews.length) % reviews.length)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent border-2 transition-colors"
              style={{ borderColor: "rgba(242,238,229,.35)", color: "#F2EEE5" }}
            >
              <ChevronLeft size={16} />
            </motion.button>
            <motion.button
              data-testid="button-next-review"
              whileHover={{ scale: 1.1, backgroundColor: "#E2231A", borderColor: "#E2231A" }} whileTap={{ scale: 0.9 }}
              onClick={() => setReviewIndex(p => (p + 1) % reviews.length)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent border-2 transition-colors"
              style={{ borderColor: "rgba(242,238,229,.35)", color: "#F2EEE5" }}
            >
              <ChevronRight size={16} />
            </motion.button>
            <div className="flex items-center gap-1.5 ml-2">
              {reviews.map((_, i) => (
                <button key={i} onClick={() => setReviewIndex(i)} aria-label={`Go to review ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === reviewIndex ? 22 : 8,
                    height: 8,
                    background: i === reviewIndex ? "#E2231A" : "rgba(242,238,229,.25)",
                    transform: i === reviewIndex ? "rotate(-4deg)" : "none",
                    border: i === reviewIndex ? "1.5px solid #F2EEE5" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="relative py-24 px-4 pattern-dots">
        <div className="max-w-3xl mx-auto">
          <SectionHead
            idx="(06) — FAQ"
            title={<>Questions & <span className="text-outline">Answers</span></>}
            note="Got questions? We've got answers."
          />
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      <GameSelectModal open={shopOpen} onClose={() => setShopOpen(false)} />
    </main>
  );
}
