import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Sword, Target, Heart, PawPrint, Package, Leaf, Sprout, Wrench,
  Apple, Gem, Star, SlidersHorizontal, ArrowLeft, Tag,
  ChevronLeft, ChevronRight, ShoppingCart, Check, AlertTriangle, Gamepad2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Footer from "@/components/Footer";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const NAVY = "#0E1A3C";
const ROYAL = "#2B50F6";
const GOLD = "#FFC53D";
const MUTED = "#5A6478";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  outOfStock?: boolean;
  gradient: [string, string];
  imageUrl?: string;
  categoryId?: string;
  featured?: boolean;
  bestSeller?: boolean;
}

interface Tab { id: string; label: string; icon: LucideIcon; }
interface Review { id: string; name: string; country: string; daysAgo: number; stars: number; text: string; }
interface FAQItemT { q: string; a: string; }
interface SEOItem { q: string; a: string; }

interface ApiCategory { _id: string; name: string; slug: string; icon?: string; game: string; }
interface ApiGame { _id: string; name: string; gradient: { from: string; to: string }; imageUrl?: string; bgImageUrl?: string; slug: string; }

const iconMap: Record<string, LucideIcon> = {
  flame: Flame, sword: Sword, target: Target, heart: Heart,
  pawprint: PawPrint, package: Package, leaf: Leaf, sprout: Sprout,
  wrench: Wrench, apple: Apple, gem: Gem, star: Star,
};
function getIcon(name?: string): LucideIcon {
  return (name && iconMap[name.toLowerCase()]) || Package;
}

const sharedReviews: Review[] = [
  { id:"r1", name:"slay", country:"United States", daysAgo:120, stars:5, text:"Now, I know you're wondering why I put this as a 5 — I won't keep you waiting. The options for items are very convenient, yet sometimes out of stock. Delivery is always fast and the support team actually replies. 100% legit." },
  { id:"r2", name:"alex_trader", country:"United Kingdom", daysAgo:45, stars:5, text:"Honestly one of the most reliable sites I've used. Bought 3 godly items and received all of them within 5 minutes. Prices are fair and the checkout is super easy." },
  { id:"r3", name:"pro_collector", country:"Australia", daysAgo:15, stars:5, text:"Was skeptical at first but RBstars is completely legit. Support helped me when I had a question about my order and it was resolved within minutes. Will definitely buy again." },
  { id:"r4", name:"rare_hunter", country:"Canada", daysAgo:78, stars:4, text:"Great selection of items and prices are competitive. Shipping a bit slower than expected but still received everything. Would recommend to anyone looking to buy items quickly." },
];

const sharedFAQ: FAQItemT[] = [
  { q:"Is RBstars legit?", a:"Yes — RBstars is a trusted, independent marketplace for Roblox game items. We have thousands of satisfied customers and use secure payment systems to protect every transaction." },
  { q:"What is your refund policy?", a:"We offer refunds within 24 hours if your item was not delivered. Contact our live chat support and we'll resolve it immediately." },
  { q:"Can I get free items?", a:"Occasionally we run promotions and giveaways on our Discord and social media. Follow us to stay updated. You can also use discount codes for 10% off your purchase." },
  { q:"How do I claim my items?", a:"After checkout, enter your in-game username. Click the chat icon in the bottom-right corner and select 'How To Claim Items.' Provide your username and order number — our team will trade you the items." },
  { q:"Can I trade my items on RBstars?", a:"Currently RBstars operates as a direct purchase platform. We do not facilitate player-to-player trades." },
  { q:"What if I don't receive my item?", a:"If delivery takes longer than 15 minutes, open our live chat. We have 24/7 support and will either resend your items or issue a full refund immediately — no questions asked." },
];

const genericSEO: SEOItem[] = [
  { q:"Is RBstars a trusted Roblox item marketplace?", a:"Yes — RBstars is an independent, trusted marketplace for Roblox game items. We serve thousands of satisfied customers and are known for instant delivery, competitive pricing, and 24/7 live chat support." },
];

/* ── Stars ────────────────────────────────────────────────── */
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.floor(rating) ? GOLD : i - rating < 1 ? "url(#halfStar)" : "none"}
          stroke={GOLD} strokeWidth="1.5">
          {i - rating < 1 && i > Math.floor(rating) && (
            <defs>
              <linearGradient id="halfStar" x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor={GOLD} /><stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          )}
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ── Product card ─────────────────────────────────────────── */
function ProductCard({
  product, index, selected = false, onSelect, gameBgImageUrl,
}: {
  product: Product; index: number; selected?: boolean; onSelect?: () => void; gameBgImageUrl?: string;
}) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    if (product.outOfStock) return;
    const gameSlug = window.location.pathname.match(/^\/game\/([^/]+)/)?.[1];
    addItem({ id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, gradient: product.gradient, image: product.imageUrl, game: gameSlug, bgImageUrl: gameBgImageUrl });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  }

  const savings = product.originalPrice && !product.outOfStock
    ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) : null;
  const c1 = product.gradient[0] || ROYAL;
  const c2 = product.gradient[1] || NAVY;

  return (
    <motion.div
      onClick={onSelect}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: "var(--shadow-soft-lg)", borderColor: selected ? ROYAL : "rgba(43,80,246,.35)" }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col rounded-3xl overflow-hidden cursor-pointer relative h-full bg-white"
      style={{
        border: selected ? `2px solid ${ROYAL}` : "1px solid rgba(14,26,60,.1)",
        boxShadow: selected ? "0 0 0 3px rgba(43,80,246,.18), var(--shadow-soft-md)" : "var(--shadow-soft-xs)",
        transition: "border-color .2s ease, box-shadow .25s ease",
      }}
    >
      <div className="relative overflow-hidden rounded-t-3xl" style={{ paddingTop: "80%" }}>
        {gameBgImageUrl ? (
          <div className="absolute inset-0">
            <img src={gameBgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(11,20,55,.25)" }} />
          </div>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${c1},${c2})` }} />
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)", backgroundSize: "16px 16px" }} />
          </>
        )}

        {product.imageUrl && (
          gameBgImageUrl ? (
            <img src={product.imageUrl} alt={product.name}
              className="absolute object-contain pointer-events-none"
              style={{ inset: "8% 10%", width: "80%", height: "84%", filter: "drop-shadow(0 6px 14px rgba(0,0,0,.45))" }} />
          ) : (
            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          )
        )}

        {product.outOfStock ? (
          <div className="absolute top-2.5 left-2.5 z-10 px-2 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-md"
            style={{ background: "rgba(11,20,55,.65)", color: "#fff" }}>
            Out of Stock
          </div>
        ) : savings ? (
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold"
            style={{ background: GOLD, color: NAVY }}>
            <Tag size={8} /> Save {savings}%
          </div>
        ) : null}

        {!product.outOfStock && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="absolute bottom-2.5 right-2.5 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
            style={{
              background: justAdded ? "#0E9F6E" : ROYAL,
              boxShadow: "0 8px 20px -4px rgba(43,80,246,.6)",
            }}>
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.span key="check" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                  <Check size={15} strokeWidth={3} />
                </motion.span>
              ) : (
                <motion.span key="cart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                  <ShoppingCart size={15} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="font-display text-xl tracking-tight" style={{ color: NAVY }}>${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-[11px] line-through" style={{ color: "#9AA3B8" }}>${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <p className="text-xs font-medium leading-snug line-clamp-2" style={{ color: MUTED }}>
          {product.name}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Horizontal section row ───────────────────────────────── */
function SectionBlock({
  title, icon: Icon, products, onViewAll, selectedId, onSelect, gameBgImageUrl,
}: {
  title: string; icon: LucideIcon; products: Product[]; onViewAll: () => void;
  selectedId?: string; onSelect?: (id: string) => void; gameBgImageUrl?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  function scrollRow(dir: "left" | "right") {
    if (!rowRef.current) return;
    const amount = window.innerWidth >= 1024 ? 700 : window.innerWidth >= 768 ? 520 : 320;
    rowRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-14"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#EEF3FB", color: ROYAL }}>
            <Icon size={17} strokeWidth={2.2} />
          </div>
          <h2 className="font-display text-2xl tracking-tight" style={{ color: NAVY }}>{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
              onClick={() => scrollRow("left")}
              aria-label="Scroll left"
              className="w-9 h-9 rounded-full flex items-center justify-center border bg-white hover:bg-[#EEF3FB] transition-colors"
              style={{ borderColor: "rgba(14,26,60,.12)", color: NAVY }}>
              <ChevronLeft size={15} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
              onClick={() => scrollRow("right")}
              aria-label="Scroll right"
              className="w-9 h-9 rounded-full flex items-center justify-center border bg-white hover:bg-[#EEF3FB] transition-colors"
              style={{ borderColor: "rgba(14,26,60,.12)", color: NAVY }}>
              <ChevronRight size={15} />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
            onClick={onViewAll}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold text-white"
            style={{ background: ROYAL, boxShadow: "0 6px 16px -4px rgba(43,80,246,.5)" }}>
            View All →
          </motion.button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {products.map((product, i) => (
          <div key={product.id} className="flex-shrink-0 w-[156px] md:w-[205px] lg:w-[225px]">
            <ProductCard
              product={product} index={i}
              selected={selectedId === product.id}
              onSelect={() => onSelect?.(product.id)}
              gameBgImageUrl={gameBgImageUrl}
            />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ── Testimonials ─────────────────────────────────────────── */
function TestimonialsSection({ reviews }: { reviews: Review[] }) {
  const [idx, setIdx] = useState(0);
  const review = reviews[idx];
  const avatarColors = ["#2B50F6","#0E9F6E","#8B5CF6","#D97706"];

  return (
    <div className="relative rounded-[28px] overflow-hidden mb-8 text-white p-6 sm:p-7 pattern-grid-light"
      style={{ background: NAVY }}>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.18em] mb-4"
          style={{ background: "rgba(255,197,61,.12)", color: GOLD }}>
          ★ Customer Testimonials
        </div>

        <h2 className="font-display text-2xl sm:text-3xl mb-5 leading-tight tracking-tight">
          Trusted by <span className="font-serif-italic" style={{ color: GOLD }}>2k+ players.</span>
        </h2>

        <div className="p-5 rounded-2xl mb-4" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)" }}>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display text-xl">Excellent 4.7</span>
            <span className="text-sm font-medium" style={{ color: "rgba(220,228,255,.6)" }}>out of 5.0</span>
          </div>
          <div className="mb-2"><StarRating rating={4.7} size={15} /></div>
          <p className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(220,228,255,.5)" }}>Based on 1300+ reviews</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider -rotate-2"
            style={{ background: GOLD, color: NAVY }}>
            ★ Verified Reviews
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}>
            <div className="p-5 rounded-2xl mb-4" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                    style={{ background: avatarColors[idx % avatarColors.length] }}>
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{review.name}</p>
                    <p className="font-mono text-[10px]" style={{ color: "rgba(220,228,255,.5)" }}>{review.country}</p>
                  </div>
                </div>
                <span className="font-mono text-[10px]" style={{ color: "rgba(220,228,255,.45)" }}>{review.daysAgo}d ago</span>
              </div>
              <div className="mb-2"><StarRating rating={review.stars} size={13} /></div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(235,240,255,.85)" }}>
                {review.text.slice(0, 160)}{review.text.length > 160 ? "..." : ""}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {[{ dir: -1, icon: <ChevronLeft size={14} /> }, { dir: 1, icon: <ChevronRight size={14} /> }].map(({ dir, icon }) => (
            <motion.button key={dir} whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,.12)" }} whileTap={{ scale: 0.9 }}
              onClick={() => setIdx((idx + dir + reviews.length) % reviews.length)}
              className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors"
              style={{ borderColor: "rgba(255,255,255,.25)", color: "#fff" }}>
              {icon}
            </motion.button>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            {reviews.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Review ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === idx ? 20 : 7, height: 7,
                  background: i === idx ? GOLD : "rgba(255,255,255,.25)",
                }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── FAQ ──────────────────────────────────────────────────── */
function FAQSection({ items }: { items: FAQItemT[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="relative rounded-[28px] overflow-hidden mb-8 bg-white p-5 sm:p-6"
      style={{ border: "1px solid rgba(14,26,60,.08)", boxShadow: "var(--shadow-soft-sm)" }}>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.18em] mb-3"
        style={{ background: "#EEF3FB", color: ROYAL }}>
        FAQ
      </div>
      <h2 className="font-display text-2xl mb-4 tracking-tight" style={{ color: NAVY }}>
        Common <span className="font-serif-italic" style={{ color: ROYAL }}>questions.</span>
      </h2>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl overflow-hidden transition-colors"
            style={{ border: `1px solid ${open === i ? ROYAL : "rgba(14,26,60,.09)"}`, background: open === i ? "#F6F8FE" : "#fff" }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3">
              <span className="text-sm font-bold leading-snug" style={{ color: NAVY }}>{item.q}</span>
              <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.22 }}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: open === i ? ROYAL : "#EEF3FB" }}>
                <span className="relative block w-2.5 h-[2px]" style={{ background: open === i ? "#fff" : NAVY }}>
                  {open !== i && <span className="absolute inset-0 rotate-90" style={{ background: NAVY }} />}
                </span>
              </motion.div>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }} className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: MUTED }}>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function SEOSection({ items }: { items: SEOItem[] }) {
  return (
    <div className="mb-8 px-1">
      {items.map((item, i) => (
        <div key={i} className="mb-5">
          <h3 className="text-sm font-extrabold mb-2 leading-snug" style={{ color: NAVY }}>{item.q}</h3>
          <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{item.a}</p>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   GAME PAGE
════════════════════════════════════════════════════════════ */
export default function GamePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("best-sellers");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { totalItems, openCart } = useCart();

  const [gameInfo, setGameInfo] = useState<ApiGame | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>(sharedReviews);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [pendingSortBy, setPendingSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");
  const [pendingInStockOnly, setPendingInStockOnly] = useState(false);

  function handleSelect(id: string) {
    setSelectedProductId(id);
    navigate(`/product/${id}`);
  }

  useEffect(() => {
    if (filterOpen) {
      setPendingSortBy(sortBy);
      setPendingInStockOnly(inStockOnly);
    }
  }, [filterOpen]);

  useEffect(() => {
    fetch(`${BACKEND}/api/claims/public-reviews?limit=20`)
      .then(r => r.json())
      .then(data => {
        if (data?.data?.reviews?.length >= 3) {
          const mapped: Review[] = data.data.reviews.map((r: { name: string; rating: number; comment: string; submittedAt: string }) => ({
            id: r.submittedAt + r.name,
            name: r.name,
            country: "Verified",
            daysAgo: Math.floor((Date.now() - new Date(r.submittedAt).getTime()) / 86400000),
            stars: r.rating,
            text: r.comment,
          }));
          setReviews(mapped);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("category");
    setActiveTab(catParam || "best-sellers");
    setSearchQuery("");
    setSelectedProductId(null);
    setLoading(true);
    setLoadError(null);

    async function attempt(round: number) {
      try {
        const [gameRes, catsRes, prodsRes] = await Promise.all([
          fetch(`${BACKEND}/api/games/${slug}`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${BACKEND}/api/categories/game/${slug}`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`${BACKEND}/api/products/game/${slug}?limit=200`).then(r => r.json()).catch(() => ({ data: [] })),
        ]);
        const ok = gameRes.success && catsRes.success && prodsRes.success;
        if (!ok && round < 3) {
          setTimeout(() => attempt(round + 1), 800 * round);
          return;
        }
        if (gameRes.success && gameRes.data?.game) {
          setGameInfo(gameRes.data.game);
        } else {
          setGameInfo({
            _id: slug,
            name: slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            gradient: { from: ROYAL, to: NAVY },
            slug,
          });
        }

        setCategories(catsRes.data || []);
        setLoadError(ok ? null : "Could not load the store. Showing cached content — pull to refresh or retry.");

        const rawProducts: Product[] = (prodsRes.data || []).map((p: Record<string, unknown>) => ({
          id: p._id as string,
          name: p.name as string,
          price: p.price as number,
          originalPrice: p.originalPrice as number | undefined,
          outOfStock: (p.stock as number) === 0,
          gradient: [
            (p.gradient as { from: string; to: string })?.from || ROYAL,
            (p.gradient as { from: string; to: string })?.to || NAVY,
          ] as [string, string],
          imageUrl: p.imageUrl as string | undefined,
          categoryId: typeof p.category === "object" && p.category !== null
            ? (p.category as { _id: string })._id
            : p.category as string,
          featured: p.featured as boolean,
          bestSeller: p.bestSeller as boolean,
        }));
        setProducts(rawProducts);
      } finally {
        setLoading(false);
      }
    }
    attempt(1);
  }, [slug]);

  const tabs: Tab[] = [
    { id: "best-sellers", label: "Best Sellers", icon: Flame },
    ...categories.map(cat => ({
      id: cat._id,
      label: cat.name,
      icon: getIcon(cat.icon),
    })),
  ];

  const currentTab = tabs.find(t => t.id === activeTab) ?? tabs[0];

  const tabProducts: Product[] = (() => {
    if (activeTab === "best-sellers") {
      const bs = products.filter(p => p.featured || p.bestSeller);
      return bs.length > 0 ? bs : products.slice(0, 12);
    }
    return products.filter(p => p.categoryId === activeTab);
  })();

  const filteredProducts = useMemo(() => {
    let list = searchQuery
      ? tabProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : tabProducts;
    if (inStockOnly) list = list.filter(p => !p.outOfStock);
    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [tabProducts, searchQuery, inStockOnly, sortBy]);

  const isMainView = activeTab === "best-sellers" && !searchQuery && sortBy === "featured" && !inStockOnly;
  const gameName = gameInfo?.name || (slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Game");

  if (loading) {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center" style={{ background: "#fff" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full border-[3px]"
            style={{ borderColor: "rgba(14,26,60,.15)", borderTopColor: ROYAL }}
          />
          <p className="text-sm font-medium" style={{ color: MUTED }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff" }}>

      <div className="h-[104px] flex-shrink-0" />

      {/* ── Toolbar ── */}
      <div className="relative px-4 pt-2 pb-1 flex-shrink-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <motion.button whileHover={{scale:1.06}} whileTap={{scale:0.92}} onClick={() => navigate("/")}
            aria-label="Back"
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border bg-white hover:bg-[#EEF3FB] transition-colors"
            style={{ borderColor: "rgba(14,26,60,.12)", color: NAVY }}>
            <ArrowLeft size={16} />
          </motion.button>
          <div className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-full bg-white"
            style={{ border: "1px solid rgba(14,26,60,.12)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${gameName}…`}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#9AA3B8] min-w-0" />
          </div>
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.92}}
            onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-semibold flex-shrink-0 border transition-colors"
            style={{
              background: filterOpen || inStockOnly || sortBy !== "featured" ? ROYAL : "#fff",
              color: filterOpen || inStockOnly || sortBy !== "featured" ? "#fff" : NAVY,
              borderColor: filterOpen || inStockOnly || sortBy !== "featured" ? ROYAL : "rgba(14,26,60,.12)",
            }}>
            <SlidersHorizontal size={13} />
            <span>Filter{(inStockOnly || sortBy !== "featured") ? " •" : ""}</span>
          </motion.button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            key="filter-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative px-4 overflow-hidden flex-shrink-0 z-10"
          >
            <div className="max-w-6xl mx-auto py-3">
              <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(14,26,60,.1)", boxShadow: "var(--shadow-soft-sm)" }}>
                <div className="mb-4">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: MUTED }}>Sort by</p>
                  <div className="flex flex-wrap gap-2">
                    {([ ["featured","Featured"] , ["price-asc","Price ↑"] , ["price-desc","Price ↓"] , ["name","Name A-Z"] ] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setPendingSortBy(val)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={{
                          background: pendingSortBy === val ? NAVY : "#fff",
                          color: pendingSortBy === val ? "#fff" : NAVY,
                          borderColor: pendingSortBy === val ? NAVY : "rgba(14,26,60,.14)",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold" style={{ color: NAVY }}>In Stock Only</p>
                  <button onClick={() => setPendingInStockOnly(v => !v)}
                    aria-label="Toggle in-stock only"
                    className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                    style={{ background: pendingInStockOnly ? ROYAL : "rgba(14,26,60,.12)" }}>
                    <motion.div
                      animate={{ x: pendingInStockOnly ? 21 : 3 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-[3px] w-[17px] h-[17px] rounded-full bg-white"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,.25)" }}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setSortBy(pendingSortBy);
                      setInStockOnly(pendingInStockOnly);
                      setFilterOpen(false);
                    }}
                    className="flex-1 py-2.5 rounded-full text-xs font-bold text-white"
                    style={{ background: ROYAL }}>
                    Apply Filters
                  </motion.button>
                  {(pendingInStockOnly || pendingSortBy !== "featured") && (
                    <button onClick={() => { setPendingSortBy("featured"); setPendingInStockOnly(false); }}
                      className="px-4 py-2.5 rounded-full text-xs font-semibold border transition-colors hover:bg-[#EEF3FB]"
                      style={{ color: NAVY, borderColor: "rgba(14,26,60,.14)" }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Game hero banner ── */}
      <div className="relative px-4 pt-4 pb-5 flex-shrink-0 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 text-white pattern-stars-light"
            style={{ background: NAVY, boxShadow: "var(--shadow-soft-lg)" }}
          >
            <motion.div
              className="absolute top-[-40%] right-[-10%] w-[420px] h-[420px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(43,80,246,.35), transparent 65%)" }}
            />
            <div className="relative flex items-center gap-4 sm:gap-5">
              <div className="relative overflow-hidden w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0"
                style={{ boxShadow: "0 12px 28px -8px rgba(0,0,0,.5)" }}>
                {gameInfo?.imageUrl ? (
                  <img src={gameInfo.imageUrl} alt={gameName} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: ROYAL }}>
                    <Gamepad2 size={26} color="#fff" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] mb-1" style={{ color: GOLD }}>Now Shopping</p>
                <h1 className="font-display text-3xl sm:text-5xl leading-none truncate">{gameName}</h1>
              </div>
              <motion.span
                animate={{ scale: [1, 1.15, 1], opacity: [0.75, 1, 0.75] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: "#34D399", boxShadow: "0 0 10px rgba(52,211,153,.7)" }}
              />
            </div>

            {/* Desktop category chips */}
            <div className="hidden md:flex items-center gap-2 mt-6 overflow-x-auto pb-1 relative" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <motion.button key={tab.id} whileTap={{ scale: 0.94 }}
                    onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors"
                    style={{
                      background: active ? "#fff" : "rgba(255,255,255,.06)",
                      color: active ? NAVY : "rgba(255,255,255,.85)",
                      borderColor: active ? "#fff" : "rgba(255,255,255,.2)",
                    }}>
                    <Icon size={13} /> {tab.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 pt-2 pb-36 md:pb-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab + searchQuery}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>

              {isMainView && !searchQuery ? (
                <>
                  {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-white"
                      style={{ border: "1px dashed rgba(14,26,60,.2)" }}>
                      <Package size={48} className="mb-4 opacity-25" />
                      <p className="text-base font-bold mb-2" style={{ color: NAVY }}>No products yet</p>
                      <p className="text-sm" style={{ color: MUTED }}>Products for {gameName} will appear here once added.</p>
                    </div>
                  ) : (
                    <>
                      <SectionBlock
                        title="Best Sellers"
                        icon={Flame}
                        products={(() => {
                          const bs = products.filter(p => p.featured || p.bestSeller);
                          return bs.length > 0 ? bs : products.slice(0, 6);
                        })()}
                        onViewAll={() => setActiveTab("best-sellers")}
                        selectedId={selectedProductId ?? undefined}
                        onSelect={handleSelect}
                        gameBgImageUrl={gameInfo?.bgImageUrl}
                      />

                      {categories.map(cat => {
                        const catProducts = products.filter(p => p.categoryId === cat._id);
                        if (catProducts.length === 0) return null;
                        return (
                          <SectionBlock
                            key={cat._id}
                            title={cat.name}
                            icon={getIcon(cat.icon)}
                            products={catProducts}
                            onViewAll={() => setActiveTab(cat._id)}
                            selectedId={selectedProductId ?? undefined}
                            onSelect={handleSelect}
                            gameBgImageUrl={gameInfo?.bgImageUrl}
                          />
                        );
                      })}
                    </>
                  )}

                  <TestimonialsSection reviews={reviews} />
                  <FAQSection items={sharedFAQ} />
                  <SEOSection items={genericSEO} />
                  <Footer />
                </>
              ) : (
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-3 mb-6"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "#EEF3FB", color: ROYAL }}>
                      <currentTab.icon size={16} />
                    </div>
                    <h2 className="font-display text-2xl tracking-tight" style={{ color: NAVY }}>{currentTab.label}</h2>
                    <span className="font-mono text-[10px] px-2.5 py-1 rounded-full font-bold"
                      style={{ background: "#EEF3FB", color: ROYAL }}>
                      {filteredProducts.length} items
                    </span>
                  </motion.div>

                  {loadError && (
                    <div className="mb-5 rounded-2xl p-4 flex items-center justify-between gap-3 bg-white"
                      style={{ border: "1px solid rgba(217,119,6,.4)" }}>
                      <p className="text-xs font-medium" style={{ color: "#92670A" }}>
                        <AlertTriangle size={13} className="inline mr-1.5" />{loadError}
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-[11px] font-bold px-3.5 py-1.5 rounded-full flex-shrink-0 text-white"
                        style={{ background: ROYAL }}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 rounded-3xl bg-white" style={{ border: "1px dashed rgba(14,26,60,.2)", color: MUTED }}>
                      <Package size={40} className="mx-auto mb-3 opacity-25" />
                      <p className="text-sm font-medium">{searchQuery ? `No items found for "${searchQuery}"` : "No items in this category yet."}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                      {filteredProducts.map((pr, i) => (
                        <ProductCard
                          key={pr.id} product={pr} index={i}
                          selected={selectedProductId === pr.id}
                          onSelect={() => handleSelect(pr.id)}
                          gameBgImageUrl={gameInfo?.bgImageUrl}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating cart pill */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-[88px] md:bottom-6 left-4 z-40">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={openCart}
              className="flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-bold text-white"
              style={{ background: ROYAL, boxShadow: "0 14px 32px -8px rgba(43,80,246,.65)" }}>
              <ShoppingCart size={16} />
              <motion.span
                key={totalItems}
                initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                {totalItems} {totalItems === 1 ? "item" : "items"} in cart
              </motion.span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 py-2"
        style={{ background: "rgba(255,255,255,.95)", backdropFilter: "blur(14px)", borderTop: "1px solid rgba(14,26,60,.1)" }}>
        <div className="flex items-center justify-around max-w-lg mx-auto relative overflow-x-auto"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <motion.button key={tab.id} whileTap={{scale:0.88}}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl min-w-0 flex-shrink-0"
                style={{ color: active ? ROYAL : "rgba(14,26,60,.4)" }}>
                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ duration: 0.22, ease: [0.22,1,0.36,1] }}>
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                </motion.div>
                <AnimatePresence>
                  {active && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, y: 4, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.8 }}
                      transition={{ duration: 0.18 }}
                      className="text-[9px] font-bold leading-none truncate max-w-[56px]">
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: GOLD }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
