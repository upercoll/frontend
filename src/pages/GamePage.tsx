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
  const c1 = product.gradient[0] || "#E2231A";

  return (
    <motion.div
      onClick={onSelect}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, boxShadow: "6px 7px 0 #131313" }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col rounded-2xl overflow-hidden cursor-pointer relative h-full bg-white group"
      style={{
        border: selected ? "3px solid #E2231A" : "2px solid #131313",
        boxShadow: selected ? "6px 7px 0 #E2231A" : "none",
        transition: "border .2s ease, box-shadow .2s ease",
      }}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: "80%" }}>
        {gameBgImageUrl ? (
          <div className="absolute inset-0">
            <img src={gameBgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(19,19,19,.22)" }} />
          </div>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: c1 }} />
            <div className="absolute inset-0 pattern-dots-light opacity-60" />
          </>
        )}

        {product.imageUrl && (
          gameBgImageUrl ? (
            <img src={product.imageUrl} alt={product.name}
              className="absolute object-contain pointer-events-none"
              style={{ inset: "8% 10%", width: "80%", height: "84%", filter: "drop-shadow(0 5px 12px rgba(0,0,0,.55))" }} />
          ) : (
            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          )
        )}

        {product.outOfStock ? (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider bg-white"
            style={{ border: "1.5px solid #131313", color: "#131313" }}>
            Out of Stock
          </div>
        ) : savings ? (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold text-white -rotate-3"
            style={{ background: "#E2231A", border: "1.5px solid #131313" }}>
            <Tag size={8} /> Save {savings}%
          </div>
        ) : null}

        {!product.outOfStock && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="absolute bottom-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors"
            style={{
              background: justAdded ? "#00B06F" : "#E2231A",
              borderColor: "#131313",
              color: "#fff",
              boxShadow: "2px 2px 0 rgba(19,19,19,.9)",
            }}>
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.span key="check" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                  <Check size={14} strokeWidth={3} />
                </motion.span>
              ) : (
                <motion.span key="cart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                  <ShoppingCart size={14} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="font-display text-lg leading-none">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-[11px] line-through" style={{ color: "#8a8375" }}>${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <p className="text-[11px] md:text-xs font-medium leading-tight line-clamp-2" style={{ color: "#55503F" }}>
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
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b-[2.5px] border-[#131313]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 -rotate-3 rounded-xl flex items-center justify-center flex-shrink-0 border-2 bg-white"
            style={{ borderColor: "#131313", boxShadow: "3px 3px 0 #131313" }}>
            <Icon size={17} strokeWidth={2.2} />
          </div>
          <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wide">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
              onClick={() => scrollRow("left")}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white hover:bg-[#131313] hover:text-white transition-colors"
              style={{ borderColor: "#131313" }}>
              <ChevronLeft size={14} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
              onClick={() => scrollRow("right")}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white hover:bg-[#131313] hover:text-white transition-colors"
              style={{ borderColor: "#131313" }}>
              <ChevronRight size={14} />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
            onClick={onViewAll}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white border-2"
            style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "2px 2px 0 #131313" }}>
            View All →
          </motion.button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {products.map((product, i) => (
          <div key={product.id} className="flex-shrink-0 w-[150px] md:w-[200px] lg:w-[220px]">
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

/* ── Stars ────────────────────────────────────────────────── */
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.floor(rating) ? "#FFC800" : i - rating < 1 ? "url(#halfStar)" : "none"}
          stroke="#131313" strokeWidth="1.5">
          {i - rating < 1 && i > Math.floor(rating) && (
            <defs>
              <linearGradient id="halfStar" x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor="#FFC800" /><stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          )}
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ── Testimonials ─────────────────────────────────────────── */
function TestimonialsSection({ reviews }: { reviews: Review[] }) {
  const [idx, setIdx] = useState(0);
  const review = reviews[idx];
  const avatarColors = ["#E2231A","#00B06F","#0A84FF","#FFC800"];

  return (
    <div className="relative rounded-3xl overflow-hidden mb-8 bg-white"
      style={{ border: "2px solid #131313", boxShadow: "6px 6px 0 #131313" }}>

      <div className="p-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.18em] mb-4 bg-white"
          style={{ border: "2px solid #131313", color: "#131313" }}>
          <span className="tilt-sq !w-2 !h-2" /> Customer Testimonials
        </div>

        <h2 className="font-display text-xl sm:text-2xl mb-4 leading-snug uppercase">
          Trusted by{" "}
          <span className="text-outline">2k+ Happy Customers</span>
        </h2>

        <div className="p-4 rounded-2xl mb-3" style={{ background: "#F7F4EC", border: "2px solid #131313" }}>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display text-lg">Excellent 4.7</span>
            <span className="font-mono text-xs" style={{ color: "#6B655C" }}>out of 5.0</span>
          </div>
          <div className="mb-1"><StarRating rating={4.7} size={15} /></div>
          <p className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "#6B655C" }}>Based on 1300+ reviews</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider -rotate-2"
            style={{ background: "#FFC800", border: "1.5px solid #131313", color: "#131313" }}>
            ★ Verified Reviews
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}>
            <div className="p-4 rounded-2xl mb-3" style={{ background: "#F7F4EC", border: "2px solid #131313" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white border-2"
                    style={{ background: avatarColors[idx % avatarColors.length], borderColor: "#131313" }}>
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{review.name}</p>
                    <p className="font-mono text-[10px]" style={{ color: "#6B655C" }}>{review.country}</p>
                  </div>
                </div>
                <span className="font-mono text-[10px]" style={{ color: "#8a8375" }}>{review.daysAgo}d ago</span>
              </div>
              <div className="mb-2"><StarRating rating={review.stars} size={13} /></div>
              <p className="text-sm leading-relaxed" style={{ color: "#44403C".length ? "#55503F" : "#55503F" }}>
                {review.text.slice(0, 160)}{review.text.length > 160 ? "..." : ""}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {[{ dir: -1, icon: <ChevronLeft size={14} /> }, { dir: 1, icon: <ChevronRight size={14} /> }].map(({ dir, icon }) => (
            <motion.button key={dir} whileHover={{ scale: 1.1, backgroundColor: "#131313", color: "#fff" }} whileTap={{ scale: 0.9 }}
              onClick={() => setIdx((idx + dir + reviews.length) % reviews.length)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 transition-colors"
              style={{ borderColor: "#131313", color: "#131313" }}>
              {icon}
            </motion.button>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            {reviews.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Review ${i + 1}`}
                className="rounded-full transition-all duration-300 rotate-[-4deg]"
                style={{
                  width: i === idx ? 20 : 7, height: 7,
                  background: i === idx ? "#E2231A" : "rgba(19,19,19,.25)",
                  border: i === idx ? "1.5px solid #131313" : "none",
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
    <div className="relative rounded-3xl overflow-hidden mb-8 bg-white p-5"
      style={{ border: "2px solid #131313", boxShadow: "6px 6px 0 #131313" }}>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.18em] mb-3"
        style={{ border: "2px solid #131313", color: "#131313" }}>
        <span className="tilt-sq !w-2 !h-2" /> FAQ
      </div>
      <h2 className="font-display text-xl sm:text-2xl mb-4 uppercase">
        Common <span className="text-outline">Questions</span>
      </h2>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: "2px solid #131313", background: open === i ? "#F7F4EC" : "#fff" }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left gap-3">
              <span className="text-sm font-bold leading-snug">{item.q}</span>
              <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.22 }}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: open === i ? "#E2231A" : "#F2EEE5", border: "1.5px solid #131313" }}>
                <span className="relative block w-2.5 h-[2px]" style={{ background: open === i ? "#fff" : "#131313" }}>
                  <span className="absolute inset-0 rotate-90" style={{ background: "#131313", opacity: open === i ? 0 : 1 }} />
                </span>
              </motion.div>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }} className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "#6B655C" }}>{item.a}</p>
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
          <h3 className="text-sm font-extrabold mb-2 leading-snug">{item.q}</h3>
          <p className="text-xs leading-relaxed" style={{ color: "#6B655C" }}>{item.a}</p>
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
            gradient: { from: "#E2231A", to: "#131313" },
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
            (p.gradient as { from: string; to: string })?.from || "#E2231A",
            (p.gradient as { from: string; to: string })?.to || "#131313",
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
  const gameAccent = gameInfo?.gradient.from || "#E2231A";
  const gameName = gameInfo?.name || (slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Game");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dot-grid" style={{ background: "#F2EEE5" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full border-[3px]"
            style={{ borderColor: "#131313", borderTopColor: "transparent" }}
          />
          <p className="font-mono text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "#6B655C" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col dot-grid" style={{ background: "#F2EEE5" }}>

      <div className="h-[104px] flex-shrink-0" />

      {/* ── Toolbar: back / search / filter ── */}
      <div className="relative px-4 pt-2 pb-1 flex-shrink-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <motion.button whileHover={{scale:1.06}} whileTap={{scale:0.92}} onClick={() => navigate("/")}
            aria-label="Back"
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border-2 bg-white hover:bg-[#131313] hover:text-white transition-colors"
            style={{ borderColor: "#131313" }}>
            <ArrowLeft size={16} />
          </motion.button>
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-full bg-white"
            style={{ border: "2px solid #131313" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B655C" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={`SEARCH ${gameName.toUpperCase()}…`}
              className="flex-1 bg-transparent outline-none font-mono text-xs font-medium placeholder:text-[#8a8375] min-w-0" />
          </div>
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.92}}
            onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider flex-shrink-0 border-2 transition-colors"
            style={{
              background: filterOpen || inStockOnly || sortBy !== "featured" ? "#E2231A" : "#fff",
              color: filterOpen || inStockOnly || sortBy !== "featured" ? "#fff" : "#131313",
              borderColor: "#131313",
              boxShadow: filterOpen || inStockOnly || sortBy !== "featured" ? "3px 3px 0 #131313" : "none",
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
              <div className="rounded-2xl p-4 bg-white" style={{ border: "2px solid #131313", boxShadow: "4px 4px 0 #131313" }}>
                <div className="mb-3">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "#6B655C" }}>Sort by</p>
                  <div className="flex flex-wrap gap-2">
                    {([ ["featured","Featured"] , ["price-asc","Price ↑"] , ["price-desc","Price ↓"] , ["name","Name A-Z"] ] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setPendingSortBy(val)}
                        className="px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider border-2 transition-all"
                        style={{
                          background: pendingSortBy === val ? "#131313" : "#fff",
                          color: pendingSortBy === val ? "#F2EEE5" : "#131313",
                          borderColor: "#131313",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider">In Stock Only</p>
                  <button onClick={() => setPendingInStockOnly(v => !v)}
                    aria-label="Toggle in-stock only"
                    className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 border-2"
                    style={{ background: pendingInStockOnly ? "#E2231A" : "#fff", borderColor: "#131313" }}>
                    <motion.div
                      animate={{ x: pendingInStockOnly ? 21 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-[2px] w-[16px] h-[16px] rounded-full"
                      style={{ background: pendingInStockOnly ? "#fff" : "#131313" }}
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
                    className="flex-1 py-2.5 rounded-full font-mono text-xs font-semibold uppercase tracking-wider text-white border-2"
                    style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "3px 3px 0 #131313" }}>
                    Apply Filters
                  </motion.button>
                  {(pendingInStockOnly || pendingSortBy !== "featured") && (
                    <button onClick={() => { setPendingSortBy("featured"); setPendingInStockOnly(false); }}
                      className="px-4 py-2.5 rounded-full font-mono text-xs font-semibold uppercase tracking-wider border-2"
                      style={{ background: "#fff", color: "#E2231A", borderColor: "#E2231A" }}>
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
      <div className="relative px-4 pt-3 pb-4 flex-shrink-0 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
            style={{ background: gameAccent, border: "3px solid #131313", boxShadow: "7px 8px 0 #131313" }}
          >
            <div className="absolute inset-0 pattern-dots-light pointer-events-none opacity-70" />
            <div className="relative flex items-center gap-4">
              <div className="relative overflow-hidden w-14 h-14 sm:w-16 sm:h-16 -rotate-3 rounded-2xl flex-shrink-0 border-2"
                style={{ borderColor: "#131313", background: "rgba(255,255,255,.15)" }}>
                {gameInfo?.imageUrl ? (
                  <img src={gameInfo.imageUrl} alt={gameName} className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-90" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><Gamepad2 size={24} color="#fff" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] mb-1 text-white/80">Now Shopping</p>
                <h1 className="font-display text-2xl sm:text-4xl uppercase leading-none text-white truncate">{gameName}</h1>
              </div>
              <motion.span
                animate={{ scale: [1, 1.15, 1], opacity: [0.75, 1, 0.75] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-[#131313]"
                style={{ background: "#00B06F" }}
              />
            </div>
          </motion.div>

          {/* Desktop category chips */}
          <div className="hidden md:flex items-center gap-2 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <motion.button key={tab.id} whileTap={{ scale: 0.94 }}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap border-2 transition-colors"
                  style={{
                    background: active ? "#131313" : "#fff",
                    color: active ? "#F2EEE5" : "#131313",
                    borderColor: "#131313",
                  }}>
                  <Icon size={13} /> {tab.label}
                </motion.button>
              );
            })}
          </div>
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
                      style={{ border: "2px dashed rgba(19,19,19,.35)" }}>
                      <Package size={48} className="mb-4 opacity-25" />
                      <p className="text-base font-bold mb-2">No products yet</p>
                      <p className="text-sm" style={{ color: "#6B655C" }}>Products for {gameName} will appear here once added.</p>
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

                  <div className="my-8 h-[3px] bg-[#131313] rounded-full opacity-15" />

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
                    className="flex items-center gap-3 mb-5"
                  >
                    <div className="w-10 h-10 -rotate-3 rounded-xl flex items-center justify-center bg-white border-2"
                      style={{ borderColor: "#131313", boxShadow: "3px 3px 0 #131313" }}>
                      <currentTab.icon size={16} />
                    </div>
                    <h2 className="font-display text-2xl uppercase">{currentTab.label}</h2>
                    <span className="font-mono text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider bg-white"
                      style={{ border: "1.5px solid #131313" }}>
                      {filteredProducts.length} items
                    </span>
                  </motion.div>

                  {loadError && (
                    <div className="mb-5 rounded-2xl p-3.5 flex items-center justify-between gap-3 bg-white"
                      style={{ border: "2px solid #FFC800", boxShadow: "3px 3px 0 #FFC800" }}>
                      <p className="text-xs font-medium" style={{ color: "#131313" }}>
                        <AlertTriangle size={13} className="inline mr-1.5" style={{ color: "#B45309" }} />{loadError}
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="font-mono text-[11px] font-bold px-3.5 py-1.5 rounded-full flex-shrink-0 text-white border-2"
                        style={{ background: "#E2231A", borderColor: "#131313" }}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 rounded-3xl bg-white" style={{ border: "2px dashed rgba(19,19,19,.35)", color: "#6B655C" }}>
                      <Package size={40} className="mx-auto mb-3 opacity-25" />
                      <p className="text-sm font-medium">{searchQuery ? `No items found for "${searchQuery}"` : "No items in this category yet."}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
              onClick={openCart}
              className="flex items-center gap-2 px-5 py-3 rounded-full font-mono text-xs font-bold uppercase tracking-wider text-white border-[3px]"
              style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}>
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
        style={{ background: "#F2EEE5", borderTop: "3px solid #131313" }}>
        <div className="flex items-center justify-around max-w-lg mx-auto relative overflow-x-auto"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <motion.button key={tab.id} whileTap={{scale:0.88}}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl min-w-0 flex-shrink-0"
                style={{ color: active ? "#131313" : "rgba(19,19,19,.4)" }}>
                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ duration: 0.22, ease: [0.22,1,0.36,1] }}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </motion.div>
                <AnimatePresence>
                  {active && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, y: 4, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.8 }}
                      transition={{ duration: 0.18 }}
                      className="font-mono text-[8px] font-bold uppercase tracking-wider leading-none truncate max-w-[56px]">
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="w-2 h-2 rounded-[2px] rotate-12"
                    style={{ background: "#E2231A" }}
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
