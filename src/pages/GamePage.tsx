import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Sword, Target, Heart, PawPrint, Package, Leaf, Sprout, Wrench,
  Apple, Gem, Star, SlidersHorizontal, ArrowLeft, Tag, ChevronDown,
  ChevronLeft, ChevronRight, ShoppingCart, ExternalLink, Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";

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
interface FAQItem { q: string; a: string; }
interface SEOItem { q: string; a: string; }

interface ApiCategory { _id: string; name: string; slug: string; icon?: string; game: string; }
interface ApiGame { _id: string; name: string; gradient: { from: string; to: string }; imageUrl?: string; slug: string; }

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

const sharedFAQ: FAQItem[] = [
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

function ParticleField({ count = 18, light = false }: { count?: number; light?: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: 5 + (i * 4.3 + (i % 3) * 7.1) % 90,
      top:  3 + (i * 7.7 + (i % 5) * 11.3) % 94,
      size: 2 + (i % 4) * 0.9,
      dur:  6 + (i % 7) * 1.4,
      delay: -(i * 0.65),
      op: light ? 0.18 + (i % 4) * 0.08 : 0.10 + (i % 4) * 0.05,
    })), [count]
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="rb-particle"
          style={{
            left: `${p.left}%`,
            top:  `${p.top}%`,
            width:  `${p.size}px`,
            height: `${p.size}px`,
            background: light
              ? `rgba(49,46,128,${p.op})`
              : `rgba(165,180,252,${p.op})`,
            animationDuration: `${p.dur}s`,
            animationDelay:    `${p.delay}s`,
            ["--p-op" as string]: p.op,
          }}
        />
      ))}
    </div>
  );
}

const cardPop = {
  rest:  { y: 0,  scale: 1,     boxShadow: "0 2px 10px rgba(49,46,128,0.07)" },
  hover: { y: -3, scale: 1.015, boxShadow: "0 12px 32px rgba(49,46,128,0.16)", transition: { duration: 0.22, ease: "easeOut" } },
  tap:   { y: 1,  scale: 0.975, transition: { duration: 0.1 } },
};

function GlareCard({ children, className, style, delayClass = "" }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delayClass?: string;
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

function ProductCard({
  product, index, compact = false, selected = false, onSelect,
}: {
  product: Product; index: number; compact?: boolean; selected?: boolean; onSelect?: () => void;
}) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [bounce, setBounce] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    if (product.outOfStock) return;
    addItem({ id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, gradient: product.gradient, image: product.imageUrl });
    setJustAdded(true);
    setBounce(true);
    setTimeout(() => setJustAdded(false), 1400);
    setTimeout(() => setBounce(false), 600);
  }

  const savings = product.originalPrice && !product.outOfStock
    ? (product.originalPrice - product.price).toFixed(2) : null;

  const glareDelay = index % 4 === 0 ? "rb-glare-d1" : index % 4 === 1 ? "rb-glare-d2" : index % 4 === 2 ? "rb-glare-d3" : "rb-glare-d4";

  return (
    <motion.div
      onClick={onSelect}
      initial={{ opacity: 0, y: 18 }}
      animate={bounce
        ? { opacity: 1, y: 0, scale: [1, 1.07, 0.95, 1.03, 1] }
        : { opacity: 1, y: 0, scale: 1 }
      }
      transition={bounce
        ? { duration: 0.5, ease: "easeInOut" }
        : { delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      }
      whileHover={!selected ? { scale: 1.025 } : {}}
      className="flex flex-col rounded-xl overflow-hidden cursor-pointer relative"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: selected
          ? "2px solid rgba(99,102,241,0.9)"
          : "1.5px solid rgba(165,180,252,0.14)",
        boxShadow: selected
          ? "0 0 0 4px rgba(79,70,229,0.2), 0 0 24px rgba(79,70,229,0.35)"
          : "none",
        transition: "border 0.2s ease, box-shadow 0.25s ease",
      }}
    >
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none z-20"
          style={{ border: "2px solid rgba(99,102,241,0.5)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        />
      )}

      <div className={`rb-glare ${glareDelay}`} style={{ opacity: 0.4 }} />

      <div className="relative overflow-hidden" style={{ paddingTop: "75%" }}>
        <motion.div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg,${product.gradient[0]} 0%,${product.gradient[1]} 100%)` }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3.5 + (index % 5) * 0.4, ease: "easeInOut", delay: index * 0.22 }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(255,255,255,0.18) 0%, transparent 70%)" }} />
        </motion.div>

        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
        )}

        {product.outOfStock ? (
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
            style={{ background: "rgba(15,12,46,0.85)", color: "#818CF8", border: "1px solid rgba(165,180,252,0.2)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#6b5c8a]" /> Out of Stock
          </div>
        ) : savings ? (
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: "#dc2626", color: "white" }}>
            <Tag size={8} /> Save ${savings}
          </div>
        ) : null}

        {!product.outOfStock && (
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={handleAddToCart}
            className="absolute bottom-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: justAdded ? "rgba(16,185,129,0.95)" : "rgba(79,70,229,0.92)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              transition: "background 0.25s ease",
            }}>
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.span key="check"
                  initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                  <Check size={12} color="white" strokeWidth={3} />
                </motion.span>
              ) : (
                <motion.span key="cart"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  transition={{ duration: 0.15 }}>
                  <ShoppingCart size={12} color="white" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      <div className="p-2">
        <div className="flex items-baseline gap-1 mb-0.5">
          <span className="text-xs font-extrabold"
            style={{ color: selected ? "#818CF8" : "#A5B4FC", transition: "color 0.2s" }}>
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-[10px] line-through" style={{ color: "#64748B" }}>${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <p className="text-[10px] font-medium leading-tight"
          style={{ color: selected ? "#C7D2FE" : "white", transition: "color 0.2s" }}>
          {product.name}
        </p>
      </div>
    </motion.div>
  );
}

const DESKTOP_PER_PAGE = 6;

function SectionBlock({
  title, icon: Icon, products, onViewAll, selectedId, onSelect,
}: {
  title: string; icon: LucideIcon; products: Product[]; onViewAll: () => void;
  selectedId?: string; onSelect?: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(products.length / DESKTOP_PER_PAGE);
  const desktopSlice = products.slice(page * DESKTOP_PER_PAGE, (page + 1) * DESKTOP_PER_PAGE);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(79,70,229,0.2)", border: "1px solid rgba(165,180,252,0.2)" }}>
            <Icon size={16} color="#A5B4FC" strokeWidth={2} />
          </div>
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="hidden md:flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={!canPrev}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: canPrev ? "rgba(79,70,229,0.2)" : "rgba(255,255,255,0.04)",
                  border: "1.5px solid rgba(165,180,252,0.2)",
                  color: canPrev ? "#A5B4FC" : "rgba(165,180,252,0.25)",
                  cursor: canPrev ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}>
                <ChevronLeft size={13} />
              </motion.button>
              <span className="text-[10px] font-semibold tabular-nums px-1" style={{ color: "rgba(165,180,252,0.5)" }}>
                {page + 1}/{totalPages}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={!canNext}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: canNext ? "rgba(79,70,229,0.2)" : "rgba(255,255,255,0.04)",
                  border: "1.5px solid rgba(165,180,252,0.2)",
                  color: canNext ? "#A5B4FC" : "rgba(165,180,252,0.25)",
                  cursor: canNext ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}>
                <ChevronRight size={13} />
              </motion.button>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.06, boxShadow: "0 0 18px rgba(79,70,229,0.4)" }}
            whileTap={{ scale: 0.94 }}
            onClick={onViewAll}
            className="relative overflow-hidden flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, rgba(79,70,229,0.22) 0%, rgba(55,48,163,0.22) 100%)",
              border: "1.5px solid rgba(165,180,252,0.25)",
              color: "#A5B4FC",
            }}>
            <div className="rb-glare rb-glare-d2" style={{ opacity: 0.6 }} />
            <span className="relative z-10">View All →</span>
          </motion.button>
        </div>
      </div>

      <div
        className="md:hidden flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {products.map((product, i) => (
          <div key={product.id} className="flex-shrink-0" style={{ width: 148 }}>
            <ProductCard
              product={product} index={i}
              selected={selectedId === product.id}
              onSelect={() => onSelect?.(product.id)}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:grid grid-cols-6 gap-3"
        >
          {desktopSlice.map((product, i) => (
            <ProductCard
              key={product.id} product={product} index={i} compact
              selected={selectedId === product.id}
              onSelect={() => onSelect?.(product.id)}
            />
          ))}
          {Array.from({ length: DESKTOP_PER_PAGE - desktopSlice.length }).map((_, i) => (
            <div key={`ghost-${i}`} className="rounded-xl" style={{ background: "rgba(255,255,255,0.015)", border: "1.5px dashed rgba(165,180,252,0.06)" }} />
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.floor(rating) ? "#4F46E5" : i - rating < 1 ? "url(#half)" : "none"}
          stroke="#4F46E5" strokeWidth="1.5">
          {i - rating < 1 && i > Math.floor(rating) && (
            <defs>
              <linearGradient id="half" x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor="#4F46E5" /><stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          )}
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialsSection({ reviews }: { reviews: Review[] }) {
  const [idx, setIdx] = useState(0);
  const review = reviews[idx];
  const avatarColors = ["#ea580c","#16a34a","#2563eb","#9333ea"];

  return (
    <div className="relative rounded-3xl overflow-hidden mb-8"
      style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(165,180,252,0.12)", backdropFilter: "blur(8px)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(79,70,229,0.1) 0%, transparent 60%)" }} />

      <div className="relative z-10 p-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: "rgba(79,70,229,0.15)", color: "#A5B4FC", border: "1px solid rgba(165,180,252,0.2)" }}>
          <Star size={11} fill="#A5B4FC" color="#A5B4FC" /> Customer Testimonials
        </div>

        <h2 className="text-xl font-extrabold mb-4 leading-snug text-white">
          Trusted by{" "}
          <span style={{ background: "linear-gradient(135deg,#818CF8,#A5B4FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            2k+
          </span>{" "}
          Happy Customers
        </h2>

        <div className="p-4 rounded-2xl mb-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(165,180,252,0.1)" }}>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-extrabold text-white">Excellent 4.7</span>
            <span className="text-sm" style={{ color: "#818CF8" }}>out of 5.0</span>
          </div>
          <div className="mb-1"><StarRating rating={4.7} size={15} /></div>
          <p className="text-xs mb-2" style={{ color: "#64748B" }}>Based on 1300+ reviews</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(79,70,229,0.15)", color: "#A5B4FC", border: "1px solid rgba(165,180,252,0.2)" }}>
            ★ Verified Reviews
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}>
            <div className="p-4 rounded-2xl mb-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(165,180,252,0.1)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                    style={{ background: avatarColors[idx % avatarColors.length] }}>
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{review.name}</p>
                    <p className="text-xs" style={{ color: "#64748B" }}>{review.country}</p>
                  </div>
                </div>
                <span className="text-xs" style={{ color: "#475569" }}>{review.daysAgo} days ago</span>
              </div>
              <div className="mb-2"><StarRating rating={review.stars} size={13} /></div>
              <p className="text-sm leading-relaxed" style={{ color: "#C7D2FE" }}>
                {review.text.slice(0, 160)}{review.text.length > 160 ? "..." : ""}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2 mb-4">
          {[{ dir: -1, icon: <ChevronLeft size={14} /> }, { dir: 1, icon: <ChevronRight size={14} /> }].map(({ dir, icon }) => (
            <motion.button key={dir} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setIdx((idx + dir + reviews.length) % reviews.length)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(79,70,229,0.15)", border: "1.5px solid rgba(165,180,252,0.2)", color: "#A5B4FC" }}>
              {icon}
            </motion.button>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            {reviews.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className="rounded-full transition-all duration-300"
                style={{ width: i === idx ? 18 : 6, height: 6, background: i === idx ? "#818CF8" : "rgba(165,180,252,0.2)" }} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function FAQSection({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="relative rounded-3xl overflow-hidden mb-8"
      style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(165,180,252,0.12)", backdropFilter: "blur(8px)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 40% at 80% 100%, rgba(79,70,229,0.08) 0%, transparent 65%)" }} />

      <div className="relative z-10 p-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
          style={{ background: "rgba(79,70,229,0.15)", color: "#A5B4FC", border: "1px solid rgba(165,180,252,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" /> FAQ
        </div>
        <h2 className="text-xl font-extrabold mb-4 text-white">
          Common{" "}
          <span style={{ color: "#A5B4FC" }}>Questions</span>
        </h2>

        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(165,180,252,0.1)" }}
            >
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
                style={{ background: open === i ? "rgba(79,70,229,0.1)" : "transparent" }}>
                <span className="text-sm font-semibold leading-snug text-white">{item.q}</span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.22 }} className="flex-shrink-0">
                  <ChevronDown size={16} color="#818CF8" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }} className="overflow-hidden">
                    <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "#94A3B8" }}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SEOSection({ items }: { items: SEOItem[] }) {
  return (
    <div className="mb-8 px-1">
      {items.map((item, i) => (
        <div key={i} className="mb-5">
          <h3 className="text-sm font-extrabold text-white mb-2 leading-snug">{item.q}</h3>
          <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{item.a}</p>
        </div>
      ))}
    </div>
  );
}

function GamePageFooter() {
  return (
    <div className="pt-6 pb-4" style={{ borderTop: "1px solid rgba(165,180,252,0.12)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center">
          <Star size={14} fill="white" color="white" />
        </div>
        <span className="text-xl font-extrabold text-white">RB<span style={{ color: "#A5B4FC" }}>stars</span></span>
      </div>
      <p className="text-xs leading-relaxed mb-4" style={{ color: "#475569" }}>
        The ultimate marketplace for Roblox game items. Instant delivery, secure payments, and 24/7 support.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
        {["Terms Of Service","Privacy Policy","Contact","Help Center"].map(link => (
          <button key={link} className="text-xs font-medium" style={{ color: "#94A3B8" }}>{link}</button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-5">
        {[
          <svg key="x" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.736-8.855L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
          <svg key="yt" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
          <svg key="tt" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.58a8.27 8.27 0 0 0 4.84 1.54V7.66a4.85 4.85 0 0 1-1.07-.97z"/></svg>,
          <svg key="dc" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>,
        ].map((icon, i) => (
          <motion.button key={i} whileHover={{scale:1.1}} whileTap={{scale:0.9}}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(165,180,252,0.12)", color:"#94A3B8" }}>
            {icon}
          </motion.button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5"
        style={{ background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(165,180,252,0.12)" }}>
        <span className="text-lg">🇬🇧</span>
        <span className="text-sm text-white font-medium flex-1">English</span>
        <ChevronDown size={14} color="#64748B" />
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {[["#1A1F71","#FFFFFF","VISA"],["#EB001B","#F79E1B","MC"],["#006FCF","#FFFFFF","AMEX"],["#FF6600","#FFFFFF","DISC"],["#003087","#009CDE","PP"]].map(([c1,c2,label]) => (
          <div key={label} className="h-7 px-2.5 rounded flex items-center justify-center text-[10px] font-extrabold tracking-tight"
            style={{ background:`linear-gradient(135deg,${c1} 60%,${c2} 100%)`, color: c2, border:"1px solid rgba(255,255,255,0.1)", minWidth:36 }}>
            {label}
          </div>
        ))}
      </div>
      <p className="text-[10px]" style={{ color: "#334155" }}>© 2026 RBstars — Your trusted Roblox items marketplace.</p>
    </div>
  );
}

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

  function handleSelect(id: string) {
    setSelectedProductId(prev => prev === id ? null : id);
  }

  useEffect(() => {
    if (!slug) return;
    setActiveTab("best-sellers");
    setSearchQuery("");
    setSelectedProductId(null);
    setLoading(true);

    Promise.all([
      fetch(`${BACKEND}/api/games/${slug}`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${BACKEND}/api/categories/game/${slug}`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${BACKEND}/api/products/game/${slug}?limit=200`).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([gameRes, catsRes, prodsRes]) => {
      if (gameRes.success && gameRes.data?.game) {
        setGameInfo(gameRes.data.game);
      } else {
        setGameInfo({
          _id: slug,
          name: slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          gradient: { from: "#4F46E5", to: "#1E1B4B" },
          slug,
        });
      }

      setCategories(catsRes.data || []);

      const rawProducts: Product[] = (prodsRes.data || []).map((p: Record<string, unknown>) => ({
        id: p._id as string,
        name: p.name as string,
        price: p.price as number,
        originalPrice: p.originalPrice as number | undefined,
        outOfStock: (p.stock as number) === 0,
        gradient: [
          (p.gradient as { from: string; to: string })?.from || "#4F46E5",
          (p.gradient as { from: string; to: string })?.to || "#1E1B4B",
        ] as [string, string],
        imageUrl: p.imageUrl as string | undefined,
        categoryId: typeof p.category === "object" && p.category !== null
          ? (p.category as { _id: string })._id
          : p.category as string,
        featured: p.featured as boolean,
        bestSeller: p.bestSeller as boolean,
      }));
      setProducts(rawProducts);
    }).finally(() => setLoading(false));
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

  const filteredProducts = searchQuery
    ? tabProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : tabProducts;

  const isMainView = activeTab === "best-sellers";
  const gameGradient: [string, string] = [gameInfo?.gradient.from || "#4F46E5", gameInfo?.gradient.to || "#1E1B4B"];
  const gameName = gameInfo?.name || (slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Game");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0C2E" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-t-transparent"
            style={{ borderColor: "#4F46E5", borderTopColor: "transparent" }}
          />
          <p className="text-sm font-medium" style={{ color: "#818CF8" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F0C2E" }}>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 line-grid-dark" />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(79,70,229,0.13) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-1/3 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)", transform: "translateX(-40%)" }} />
        <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(49,46,128,0.09) 0%, transparent 70%)", transform: "translateX(40%)" }} />
      </div>

      <div className="fixed inset-0 pointer-events-none z-0">
        <ParticleField count={22} light={false} />
      </div>

      <div className="h-16 flex-shrink-0" />

      {}
      <div className="relative px-4 pt-3 pb-1 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <motion.button whileHover={{scale:1.08}} whileTap={{scale:0.92}} onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(165,180,252,0.18)" }}>
            <ArrowLeft size={15} color="#A5B4FC" />
          </motion.button>
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(165,180,252,0.14)", backdropFilter: "blur(6px)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${gameName}...`}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6b5c8a]" />
          </div>
          <motion.button whileHover={{scale:1.08}} whileTap={{scale:0.92}}
            className="relative overflow-hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0"
            style={{ background:"rgba(79,70,229,0.15)", border:"1.5px solid rgba(165,180,252,0.18)", color:"#A5B4FC" }}>
            <div className="rb-glare rb-glare-d3" style={{ opacity: 0.5 }} />
            <SlidersHorizontal size={13} className="relative z-10" />
            <span className="relative z-10">Filter</span>
          </motion.button>
        </div>
      </div>

      {}
      <div className="relative px-4 pt-3 pb-2 flex-shrink-0 z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 p-3.5 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${gameGradient[0]}22 0%, ${gameGradient[1]}22 100%)`,
            border: `1.5px solid ${gameGradient[0]}44`,
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="relative overflow-hidden w-12 h-12 rounded-xl flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${gameGradient[0]} 0%, ${gameGradient[1]} 100%)` }}>
            <div className="rb-glare rb-glare-d1" style={{ opacity: 0.6 }} />
            {gameInfo?.imageUrl ? (
              <img src={gameInfo.imageUrl} alt={gameName} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame size={22} color="rgba(255,255,255,0.9)" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-0.5" style={{ color: gameGradient[0] }}>Now Shopping</p>
            <h1 className="text-base font-extrabold text-white leading-tight truncate">{gameName}</h1>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: "#22c55e", boxShadow: "0 0 8px #22c55e" }}
          />
        </motion.div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-32 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab + searchQuery}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>

            {isMainView && !searchQuery ? (
              <>
                {products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Package size={48} color="rgba(165,180,252,0.2)" className="mb-4" />
                    <p className="text-base font-bold text-white mb-2">No products yet</p>
                    <p className="text-sm" style={{ color: "#64748B" }}>Products for {gameName} will appear here once added.</p>
                  </div>
                ) : (
                  <>
                    {}
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
                    />

                    {}
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
                        />
                      );
                    })}
                  </>
                )}

                <div className="relative my-6">
                  <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(165,180,252,0.3),transparent)" }} />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(79,70,229,0.08) 0%, transparent 70%)" }} />
                </div>

                <div className="mt-2">
                  <TestimonialsSection reviews={sharedReviews} />
                </div>
                <FAQSection items={sharedFAQ} />
                <SEOSection items={genericSEO} />
                <GamePageFooter />
              </>
            ) : (
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center gap-2.5 mb-5"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(79,70,229,0.2)", border: "1px solid rgba(165,180,252,0.2)" }}>
                    <currentTab.icon size={16} color="#A5B4FC" />
                  </div>
                  <h2 className="text-base font-bold text-white">{currentTab.label}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background:"rgba(79,70,229,0.2)", color:"#A5B4FC", border: "1px solid rgba(165,180,252,0.15)" }}>
                    {filteredProducts.length} items
                  </span>
                </motion.div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16" style={{ color:"#64748B" }}>
                    <Package size={40} color="rgba(165,180,252,0.2)" className="mx-auto mb-3" />
                    <p className="text-sm">{searchQuery ? `No items found for "${searchQuery}"` : "No items in this category yet."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {filteredProducts.map((pr, i) => (
                      <ProductCard
                        key={pr.id} product={pr} index={i} compact
                        selected={selectedProductId === pr.id}
                        onSelect={() => handleSelect(pr.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-[72px] left-4 z-40">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 36px rgba(79,70,229,0.75)" }}
              whileTap={{ scale: 0.96 }}
              onClick={openCart}
              className="relative overflow-hidden flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold shadow-xl"
              style={{ background:"linear-gradient(135deg,#4F46E5 0%,#3730A3 100%)", color:"white", boxShadow:"0 4px 24px rgba(79,70,229,0.55)" }}>
              <div className="rb-glare rb-glare-d1" style={{ opacity: 0.6 }} />
              <ShoppingCart size={16} className="relative z-10" />
              <motion.span
                key={totalItems}
                initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="relative z-10">
                {totalItems} {totalItems === 1 ? "item" : "items"} in cart
              </motion.span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-2 py-2"
        style={{ background:"rgba(15,12,46,0.97)", backdropFilter:"blur(14px)", borderTop:"1px solid rgba(165,180,252,0.12)" }}>
        <div className="absolute inset-0 pointer-events-none line-grid-dark" />
        <div className="flex items-center justify-around max-w-lg mx-auto relative overflow-x-auto"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <motion.button key={tab.id} whileTap={{scale:0.88}}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl min-w-0 flex-shrink-0"
                style={{ color: active ? "#A5B4FC" : "#475569" }}>
                <motion.div
                  animate={{ scale: active ? 1.18 : 1 }}
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
                      className="text-[9px] font-bold leading-none truncate max-w-[56px]"
                      style={{ color: "#A5B4FC" }}>
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="w-1 h-1 rounded-full"
                    style={{ background: "#818CF8" }}
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
