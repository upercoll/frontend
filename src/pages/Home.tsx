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

const NAVY = "#0E1A3C";
const NAVY_DEEP = "#0B1437";
const ROYAL = "#2B50F6";
const GOLD = "#FFC53D";
const MUTED = "#5A6478";

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
  { icon: Zap,        title: "Fast and Reliable",   desc: "Our Claim Support Team ensures your items are delivered almost instantly.", accent: ROYAL },
  { icon: Lock,       title: "Secure Transactions", desc: "We use trusted payment systems to keep your data safe and secure.",         accent: "#0E9F6E" },
  { icon: Headphones, title: "Unmatched Support",   desc: "Our friendly live chat support team is available around the clock to assist you with any questions.", accent: "#8B5CF6" },
  { icon: LayoutGrid, title: "Wide Variety",        desc: "From Jailbreak to Grow A Garden we have everything you need to enhance your gaming experience.", accent: GOLD },
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

function StarGlyph({ size = 12, color = GOLD, stroke }: { size?: number; color?: string; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={stroke || "none"} strokeWidth={stroke ? 1.5 : 0} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* ── Editorial section header ─────────────────────────────── */
function SectionHead({ idx, title, accentWord, note, tone = "light" }: {
  idx: string; title: React.ReactNode; accentWord?: React.ReactNode; note?: string; tone?: "light" | "dark";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
      className="flex items-end justify-between gap-6 mb-10"
    >
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] mb-3 flex items-center gap-2"
          style={{ color: tone === "dark" ? GOLD : ROYAL }}>
          <StarGlyph size={10} color={tone === "dark" ? GOLD : ROYAL} />{idx}
        </p>
        <h2 className="font-display text-4xl sm:text-[52px] leading-[1.02] tracking-tight" style={{ color: tone === "dark" ? "#fff" : NAVY }}>
          {title}{accentWord != null && <>{" "}<span className="font-serif-italic" style={{ color: tone === "dark" ? GOLD : ROYAL }}>{accentWord}</span></>}
        </h2>
      </div>
      {note && (
        <p className="hidden sm:block text-sm text-right max-w-[250px] leading-relaxed"
          style={{ color: tone === "dark" ? "rgba(220,228,255,.55)" : MUTED }}>
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
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="rounded-2xl overflow-hidden cursor-pointer transition-shadow"
      style={{
        background: open ? "#fff" : "#F6F8FE",
        border: `1px solid ${open ? ROYAL : "rgba(14,26,60,.08)"}`,
        boxShadow: open ? "var(--shadow-soft-sm)" : "none",
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-bold text-sm leading-snug" style={{ color: NAVY }}>{q}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: open ? ROYAL : "#EEF3FB" }}
        >
          <span className="relative block w-3 h-[2px]" style={{ background: open ? "#fff" : NAVY }}>
            {!open && <span className="absolute inset-0 rotate-90" style={{ background: NAVY }} />}
          </span>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="c"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <p className="px-5 pt-1 pb-5 text-sm leading-relaxed" style={{ color: MUTED }}>{a}</p>
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
      transition={{ delay: index * 0.08, duration: 0.5, ease: EASE_OUT }}
      onClick={() => navigate(`/product/${product._id}`)}
      whileHover={{ y: -6, boxShadow: "0 24px 48px -16px rgba(0,0,0,.6)" }}
      className="flex flex-col rounded-2xl overflow-hidden relative group cursor-pointer"
      style={{
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.12)",
        backdropFilter: "blur(8px)",
        transition: "box-shadow .25s ease, border-color .25s ease",
      }}
    >
      {/* Art */}
      <div className="relative overflow-hidden" style={{ paddingTop: "82%" }}>
        {game.bgImageUrl ? (
          <div className="absolute inset-0">
            <img src={game.bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(11,20,55,.35)" }} />
          </div>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${product.gradient.from},${product.gradient.to})` }} />
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)", backgroundSize: "16px 16px" }} />
          </>
        )}
        {product.imageUrl && (
          game.bgImageUrl ? (
            <img src={product.imageUrl} alt={product.name}
              className="absolute object-contain pointer-events-none"
              style={{ inset: "8% 10%", width: "80%", height: "84%", filter: "drop-shadow(0 6px 14px rgba(0,0,0,.5))" }} />
          ) : (
            <img src={product.imageUrl} alt={product.name}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          )
        )}

        {savings && !outOfStock && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold"
            style={{ background: GOLD, color: NAVY }}>
            <Tag size={8} /> Save ${savings}
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(11,20,55,.66)", backdropFilter: "blur(2px)" }}>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white">Out of Stock</span>
          </div>
        )}

        {!outOfStock && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleAdd}
            aria-label="Add to cart"
            className="absolute bottom-2 right-2 z-20 h-8 px-3 rounded-full flex items-center gap-1.5 font-semibold text-xs text-white transition-colors"
            style={{
              background: justAdded ? "#0E9F6E" : ROYAL,
              boxShadow: "0 6px 16px -4px rgba(43,80,246,.55)",
            }}
          >
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.span key="c" className="flex items-center gap-1" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                  <Check size={13} strokeWidth={3} /> Added!
                </motion.span>
              ) : (
                <motion.span key="s" className="flex items-center gap-1" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.14 }}>
                  <ShoppingCart size={13} /> Add
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-lg tracking-tight text-white">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-[10px] line-through" style={{ color: "rgba(220,228,255,.45)" }}>${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <p className="text-[11px] font-medium leading-tight line-clamp-2" style={{ color: "rgba(220,228,255,.75)" }}>{product.name}</p>
      </div>
    </motion.div>
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
          gradient: (p.gradient as { from: string; to: string }) || { from: ROYAL, to: NAVY_DEEP },
        }));
        setProducts(raw);
      })
      .catch(() => {});
  }, [isInView, loaded, game.slug]);

  const c1 = game.gradient?.from || ROYAL;

  return (
    <div ref={rowRef} className="mb-12">
      {/* Row banner */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${c1},${NAVY_DEEP})`, boxShadow: `0 6px 18px -6px ${c1}88` }}>
            {game.imageUrl ? (
              <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"><Gamepad2 size={18} color="#fff" /></div>
            )}
          </div>
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.28em] mb-0.5" style={{ color: "rgba(220,228,255,.45)" }}>Top Picks</p>
            <h3 className="font-display text-lg tracking-tight text-white">{game.name}</h3>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,.12)" }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onNavigate(game.slug)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white border"
          style={{ borderColor: "rgba(255,255,255,.22)", background: "rgba(255,255,255,.04)" }}
        >
          View All <ArrowRight size={11} />
        </motion.button>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3.5">
        {products.length > 0
          ? products.map((p, i) => <MiniProductCard key={p._id} product={p} game={game} index={i} />)
          : [0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl animate-pulse"
                style={{ paddingTop: "calc(82% + 58px)", background: "rgba(255,255,255,.03)", border: "1px dashed rgba(255,255,255,.1)" }} />
            ))
        }
      </div>
    </div>
  );
}

/* ── Red→Navy marquee band ─────────────────────────────────── */
function MarqueeTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <section className="relative py-10 overflow-hidden" aria-hidden="true">
      <div className="band-navy mx-[-2vw] w-[104vw] rounded-none" style={{ boxShadow: "0 20px 50px -20px rgba(14,26,60,.5)" }}>
        <div className="marquee-track flex items-center">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-7 pr-7 py-4 whitespace-nowrap">
              <span className={`text-xl sm:text-2xl tracking-tight ${i % 2 === 0 ? "font-display font-bold" : "font-serif-italic text-[#BFD0FF]"}`}>{item}</span>
              <StarGlyph size={11} />
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
    <section className="py-14" style={{ background: "#fff" }}>
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.3em] mb-7" style={{ color: MUTED }}>
          Trusted by top creators
        </p>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
          {creators.map((creator, index) => (
            <a key={`${creator._id}-${index}`} href={creator.channelUrl} target="_blank" rel="noreferrer"
              className="group flex flex-col items-center justify-center gap-1.5 w-[124px] shrink-0 rounded-3xl px-2 py-5 text-center transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft-md)]"
              style={{ background: "#fff", border: "1px solid rgba(14,26,60,.08)" }}>
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-[#EEF3FB]" />
              ) : (
                <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "#FF0000" }}>
                  <Youtube size={18} color="#fff" fill="#fff" />
                </div>
              )}
              <p className="w-full truncate font-bold text-[12px]" style={{ color: NAVY }}>{creator.name || creator.username}</p>
              <p className="flex items-center gap-1 font-mono text-[10px]" style={{ color: MUTED }}>
                <Youtube size={10} color="#dc2626" fill="#dc2626" /> {subscriberLabel(creator.subscribers)}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const fallbackReviews = [
  { initials: "D", name: "Dawn Hughes", country: "United States", days: "76 days ago", stars: 5, text: "Cheap: the prices were much cheaper than other adopt me stores. Easy: it's idiot proof, all you do is join and it gives you your items instantly. Good service: every time I had an issue they responded really quickly." },
  { initials: "M", name: "Max Rivera",  country: "United Kingdom", days: "14 days ago", stars: 5, text: "Super fast delivery! Got my Blade Ball items within minutes. The support team was also really helpful when I had questions about my order." },
  { initials: "S", name: "Sara K",      country: "Canada",         days: "31 days ago", stars: 5, text: "Best place to buy Roblox items hands down. Trusted sellers, fair prices, and the whole process was smooth from start to finish." },
];
const avatarColors = ["#2B50F6", "#0E9F6E", "#8B5CF6"];

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
    <main style={{ background: "#fff" }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden dot-grid">
        {/* ambient glows */}
        <motion.div
          className="absolute top-[-15%] right-[-8%] w-[560px] h-[560px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(43,80,246,.1), transparent 65%)" }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-10%] w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,197,61,.12), transparent 65%)" }}
        />

        {/* Floating card collage (right) */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[46%] hidden lg:block" aria-hidden="true">
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 8 }}
            animate={{ opacity: 1, y: [0, -14, 0], rotate: [8, 6, 8] }}
            transition={{
              opacity: { delay: 0.7, duration: 0.8 },
              y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 6, ease: "easeInOut" },
            }}
            className="absolute right-[16%] top-[14%] w-52 rounded-3xl p-4"
            style={{ background: "#fff", border: "1px solid rgba(14,26,60,.08)", boxShadow: "var(--shadow-soft-lg)" }}
          >
            <div className="rounded-xl mb-3 relative overflow-hidden" style={{ paddingTop: "70%", background: "linear-gradient(135deg,#7C5CFF,#2B50F6)" }}>
              <div className="pattern-stars-light absolute inset-0" />
            </div>
            <div className="h-2.5 rounded-full w-3/4 mb-2" style={{ background: "#EEF3FB" }} />
            <div className="flex items-center justify-between">
              <div className="h-2.5 rounded-full w-1/3" style={{ background: "#EEF3FB" }} />
              <StarGlyph size={14} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60, rotate: -6 }}
            animate={{ opacity: 1, y: [0, 10, 0], rotate: [-6, -4, -6] }}
            transition={{
              opacity: { delay: 0.9, duration: 0.8 },
              y: { repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 },
              rotate: { repeat: Infinity, duration: 7, ease: "easeInOut" },
            }}
            className="absolute right-[42%] top-[42%] w-44 rounded-3xl p-4"
            style={{ background: NAVY, boxShadow: "0 32px 64px -16px rgba(14,26,60,.5)" }}
          >
            <div className="rounded-xl mb-3 relative overflow-hidden" style={{ paddingTop: "70%", background: "linear-gradient(135deg,#FFD84D,#FFAB2E)" }}>
              <div className="pattern-stars-light absolute inset-0" />
            </div>
            <div className="h-2.5 rounded-full w-2/3 mb-2" style={{ background: "rgba(255,255,255,.14)" }} />
            <div className="h-2.5 rounded-full w-1/3" style={{ background: "rgba(255,197,61,.5)" }} />
          </motion.div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
            className="absolute right-[8%] bottom-[10%] w-28 h-28"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <circle cx="50" cy="50" r="49" fill="#fff" stroke="rgba(14,26,60,.08)" />
              <text fontSize="9.5" fontWeight="700" letterSpacing="2.5" fill={ROYAL} fontFamily="'JetBrains Mono',monospace">
                <textPath href="#circ">INSTANT DELIVERY ★ TRUSTED ★ SINCE DAY ONE ★</textPath>
              </text>
              <path d="M50 36 l3.4 7.2 7.9 1 -5.8 5.6 1.4 7.9 -6.9 -3.9 -6.9 3.9 1.4 -7.9 -5.8 -5.6 7.9 -1z" fill={GOLD} transform="translate(-4,-4) scale(1.08)" />
            </svg>
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0], rotate: [12, 8, 12] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute right-[30%] top-[12%] w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "#fff", border: "1px solid rgba(14,26,60,.08)", boxShadow: "var(--shadow-soft-md)" }}
          >
            <Zap size={22} color={GOLD} fill={GOLD} />
          </motion.div>
        </div>

        <div className="relative max-w-6xl mx-auto w-full px-4 pt-36 pb-24 lg:w-[58%] lg:px-0">
          {/* Trust badge */}
          <motion.div
            custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 bg-white"
            style={{ border: "1px solid rgba(14,26,60,.1)", boxShadow: "var(--shadow-soft-xs)" }}
          >
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => <StarGlyph key={i} size={12} />)}
            </div>
            <span className="text-xs font-semibold" style={{ color: NAVY }}>
              {rating} · Loved by 2k+ players
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="leading-[0.98] tracking-tight text-[clamp(48px,7.5vw,104px)]">
            <span className="block overflow-hidden pb-1">
              <motion.span
                className="block font-display font-extrabold"
                initial={{ y: "112%" }} animate={{ y: 0 }}
                transition={{ delay: 0.35, duration: 0.95, ease: EASE_OUT }}
                style={{ color: NAVY }}
              >
                Own the
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-3">
              <motion.span
                className="block"
                initial={{ y: "115%" }} animate={{ y: 0 }}
                transition={{ delay: 0.47, duration: 0.95, ease: EASE_OUT }}
              >
                <span className="font-serif-italic" style={{ color: ROYAL }}>whole game.</span>
              </motion.span>
            </span>
          </h1>

          {/* Sub copy */}
          <motion.p
            custom={2} initial="hidden" animate="visible" variants={fadeUp}
            className="mt-6 text-lg max-w-lg leading-relaxed font-medium"
            style={{ color: MUTED }}
          >
            Skip the grind — buy your favourite Roblox items instantly from the most trusted dealers, delivered in minutes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={3} initial="hidden" animate="visible" variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <motion.button
              data-testid="button-shop-now"
              onClick={() => setShopOpen(true)}
              whileHover={{ scale: 1.04, y: -2, boxShadow: "0 20px 40px -10px rgba(43,80,246,.6)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 px-9 py-4 rounded-full text-white font-bold text-base"
              style={{ background: "linear-gradient(180deg,#3D63FF 0%,#2B50F6 100%)", boxShadow: "0 10px 26px -8px rgba(43,80,246,.55)" }}
            >
              <ShoppingCart size={20} /> Shop Now
            </motion.button>
            <motion.button
              onClick={() => shopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base bg-white"
              style={{ color: NAVY, border: "1.5px solid rgba(14,26,60,.16)" }}
            >
              Browse Games <ArrowRight size={16} />
            </motion.button>
          </motion.div>

          {/* Stat chips */}
          <motion.div
            custom={4} initial="hidden" animate="visible" variants={fadeUp}
            className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3"
          >
            {["Instant Delivery", "Secure Payments", "10+ Games", "24/7 Support"].map(s => (
              <span key={s} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#3D4560" }}>
                <StarGlyph size={10} />{s}
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
        style={{ background: "#F6F8FE" }}
      >
        <div className="max-w-6xl mx-auto">

          <SectionHead
            idx="(01) — Browse & Buy"
            title={<>Shop by</>}
            accentWord="game."
            note="Pick your game, find what you need, get it delivered in minutes."
          />

          {/* Search */}
          <div className="relative max-w-md mb-10">
            <Search size={15} className="absolute left-4.5 left-[18px] top-1/2 -translate-y-1/2 pointer-events-none" color={MUTED} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search games…"
              className="w-full pl-11 pr-5 py-4 rounded-full text-sm font-medium bg-white outline-none placeholder:text-[#9AA3B8] transition-shadow"
              style={{ border: "1px solid rgba(14,26,60,.12)", color: NAVY }}
              onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(43,80,246,.15), var(--shadow-soft-sm)")}
              onBlur={e  => (e.currentTarget.style.boxShadow = "none")}
            />
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            {gamesLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-3xl animate-pulse" style={{ aspectRatio: "4/5", background: "rgba(14,26,60,.05)" }} />
                ))}
              </motion.div>
            ) : filteredGames.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-16 rounded-3xl bg-white" style={{ border: "1px dashed rgba(14,26,60,.2)" }}>
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold" style={{ color: NAVY }}>{searchQuery ? `No games found for "${searchQuery}"` : "No games available yet"}</p>
                {searchQuery && <button onClick={() => setSearchQuery("")} className="mt-3 text-sm font-bold" style={{ color: ROYAL }}>Clear search</button>}
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredGames.map((game, i) => {
                  const c1 = game.gradient?.from || ROYAL;
                  const c2 = game.gradient?.to || NAVY_DEEP;
                  return (
                    <motion.button
                      key={game._id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.38, ease: EASE_OUT }}
                      whileHover={{ y: -8, boxShadow: "var(--shadow-soft-lg)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/game/${game.slug}`)}
                      className="relative flex flex-col rounded-3xl overflow-hidden text-left"
                      style={{ aspectRatio: "4 / 5", background: `linear-gradient(135deg,${c1},${c2})`, transition: "box-shadow .25s ease" }}
                    >
                      {game.imageUrl && <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-85" />}
                      <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(to top,rgba(11,20,55,.92),transparent)" }} />

                      {game.productCount !== undefined && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold backdrop-blur-md"
                          style={{ background: "rgba(11,20,55,.55)", color: "rgba(255,255,255,.92)", border: "1px solid rgba(255,255,255,.18)" }}>
                          {game.productCount} items
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-3.5 flex items-end justify-between gap-2">
                        <span className="text-white font-bold text-[15px] leading-tight" style={{ textShadow: "0 1px 3px rgba(0,0,0,.7)" }}>
                          {game.name}
                        </span>
                        <motion.span
                          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white transition-colors"
                          whileHover={{ backgroundColor: GOLD }}
                        >
                          <ArrowRight size={14} color={NAVY} />
                        </motion.span>
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
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-white"
                style={{ background: NAVY, boxShadow: "0 12px 30px -10px rgba(14,26,60,.5)" }}
              >
                <ShoppingCart size={16} /> View All Games
              </motion.button>
            </div>
          )}
        </div>
      </section>

      <YouTuberTrustBar creators={featuredYouTubers} />

      {/* ══════════ TOP PICKS (navy) ══════════ */}
      <section className="relative py-24 px-4 pattern-grid-light overflow-hidden" style={{ backgroundColor: NAVY_DEEP }}>
        <motion.div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(43,80,246,.18), transparent 65%)" }}
        />
        <div className="max-w-6xl mx-auto relative">
          <SectionHead
            idx="(02) — Live Stock"
            title="Top picks,"
            accentWord="every game."
            note="Our hottest recommended items — add them straight to your cart."
            tone="dark"
          />

          {games.slice(0, 6).map(game => (
            <GameProductRow key={game._id} game={game} onNavigate={slug => navigate(`/game/${slug}`)} />
          ))}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mt-2"
          >
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShopOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-[#0E1A3C]"
              style={{ background: GOLD, boxShadow: "0 12px 30px -8px rgba(255,197,61,.45)" }}
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
        className="relative py-24 px-4 scroll-mt-24"
        style={{ background: "#fff" }}
      >
        <div className="max-w-3xl mx-auto">
          <SectionHead
            idx="(03) — Simple Process"
            title={<>How it</>}
            accentWord="works."
            note="Three easy steps and your items are on their way."
          />

          <div className="relative">
            {/* Animated progress line */}
            <div className="absolute left-[27px] top-10 bottom-10 w-[3px] rounded-full" style={{ background: "rgba(14,26,60,.08)" }}>
              <motion.div className="w-full rounded-full" style={{ height: lineH, background: ROYAL }} />
            </div>

            <div className="flex flex-col gap-10">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div key={step.number}
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.55, delay: i * 0.12, ease: EASE_OUT }}
                    className="flex items-start gap-5"
                  >
                    <div className="relative z-10 flex-shrink-0 w-[56px] h-[56px] rounded-2xl flex items-center justify-center"
                      style={{ background: "#fff", border: "1px solid rgba(14,26,60,.1)", boxShadow: "var(--shadow-soft-sm)" }}>
                      <Icon size={22} color={ROYAL} strokeWidth={2} />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-[#0E1A3C]"
                        style={{ background: GOLD }}>
                        {i + 1}
                      </span>
                    </div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex-1 p-6 rounded-3xl"
                      style={{ background: "#F6F8FE", border: "1px solid rgba(14,26,60,.06)", transition: "background .2s ease" }}
                    >
                      <span className="font-mono text-xs font-bold tracking-[0.2em]" style={{ color: ROYAL }}>{step.number}</span>
                      <h3 className="font-display text-lg mt-1.5 mb-1.5 tracking-tight" style={{ color: NAVY }}>{step.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{step.description}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ WHY CHOOSE ══════════ */}
      <section className="relative py-24 px-4 dot-grid" style={{ background: "#F6F8FE" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHead
            idx="(04) — Why Us"
            title={<>Why choose</>}
            accentWord="RBstars?"
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
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE_OUT }}
                  whileHover={{ y: -6, boxShadow: "var(--shadow-soft-md)" }}
                  data-testid={`card-feature-${i + 1}`}
                  className="p-7 rounded-3xl relative overflow-hidden bg-white"
                  style={{ border: "1px solid rgba(14,26,60,.08)", transition: "box-shadow .25s ease" }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `${f.accent}18` }}>
                    <Icon size={22} color={f.accent === GOLD ? "#D99A00" : f.accent} strokeWidth={2.2} />
                  </div>
                  <h3 className="font-display text-lg mb-2 tracking-tight" style={{ color: NAVY }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{f.desc}</p>
                  <StarGlyph size={13} color={`${f.accent}`} />
                  <span className="absolute bottom-5 right-6"><StarGlyph size={13} /></span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="relative py-24 px-4 pattern-stars-light overflow-hidden" style={{ background: NAVY_DEEP }}>
        <motion.div
          className="absolute bottom-[-25%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(43,80,246,.2), transparent 65%)" }}
        />
        <div className="max-w-3xl mx-auto relative">
          <SectionHead
            idx="(05) — Reviews"
            title={<>Trusted by</>}
            accentWord="thousands."
            note=""
            tone="dark"
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewIndex}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.38, ease: EASE_OUT }}
              className="rounded-3xl p-7"
              style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)", backdropFilter: "blur(8px)" }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(reviews[reviewIndex]?.stars ?? 5)].map((_, i) => <StarGlyph key={i} size={15} />)}
              </div>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: "rgba(235,240,255,.88)" }}>
                "{reviews[reviewIndex]?.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: avatarColors[reviewIndex % avatarColors.length] }}>
                  {reviews[reviewIndex]?.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{reviews[reviewIndex]?.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(220,228,255,.5)" }}>{reviews[reviewIndex]?.country} · {reviews[reviewIndex]?.days}</p>
                </div>
                <StarGlyph size={16} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-6">
            <motion.button
              data-testid="button-prev-review"
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
              onClick={() => setReviewIndex(p => (p - 1 + reviews.length) % reviews.length)}
              aria-label="Previous review"
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,.25)", color: "#fff" }}
            >
              <ChevronLeft size={16} />
            </motion.button>
            <motion.button
              data-testid="button-next-review"
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
              onClick={() => setReviewIndex(p => (p + 1) % reviews.length)}
              aria-label="Next review"
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,.25)", color: "#fff" }}
            >
              <ChevronRight size={16} />
            </motion.button>
            <div className="flex items-center gap-1.5 ml-2">
              {reviews.map((_, i) => (
                <button key={i} onClick={() => setReviewIndex(i)} aria-label={`Go to review ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{ width: i === reviewIndex ? 22 : 7, height: 7, background: i === reviewIndex ? GOLD : "rgba(255,255,255,.25)" }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="relative py-24 px-4" style={{ background: "#fff" }}>
        <div className="max-w-3xl mx-auto">
          <SectionHead
            idx="(06) — FAQ"
            title={<>Questions &</>}
            accentWord="answers."
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
