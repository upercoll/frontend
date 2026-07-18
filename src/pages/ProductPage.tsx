import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ShoppingCart, Zap, KeyRound, ShieldCheck, MessageCircle,
  Star, Tag, Check, ChevronLeft, ChevronRight, Package, Loader2,
  Flame, ArrowRight, ChevronDown, Minus, Plus,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import Footer from "@/components/Footer";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

interface ApiCategory { _id: string; name: string; slug: string; icon?: string }

interface ApiProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  game: string;
  category?: ApiCategory | string;
  price: number;
  originalPrice?: number;
  gradient: { from: string; to: string };
  imageUrl?: string;
  images?: string[];
  features?: string[];
  stock: number;
  onHand?: number;
  outOfStock?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  tags?: string[];
}

interface FAQItem { q: string; a: string; }

const sharedFAQ: FAQItem[] = [
  { q: "Is RBstars legit?", a: "Yes — RBstars is a trusted, independent marketplace for Roblox game items. We have thousands of satisfied customers and use secure payment systems to protect every transaction." },
  { q: "What is your refund policy?", a: "We offer refunds within 24 hours if your item was not delivered. Contact our live chat support and we'll resolve it immediately." },
  { q: "Can I get free items?", a: "Occasionally we run promotions and giveaways on our Discord and social media. Follow us to stay updated. You can also use discount codes for 10% off your purchase." },
  { q: "How do I claim my items?", a: "After checkout, enter your in-game username. Click the chat icon in the bottom-right corner and select 'How To Claim Items.' Provide your username and order number — our team will trade you the items." },
  { q: "What if I don't receive my item?", a: "If delivery takes longer than 15 minutes, open our live chat. We have 24/7 support and will either resend your items or issue a full refund immediately — no questions asked." },
];

function ParticleField({ count = 16 }: { count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: 5 + (i * 4.3 + (i % 3) * 7.1) % 90,
      top: 3 + (i * 7.7 + (i % 5) * 11.3) % 94,
      size: 2 + (i % 4) * 0.9,
      dur: 6 + (i % 7) * 1.4,
      delay: -(i * 0.65),
      op: 0.1 + (i % 4) * 0.05,
    })), [count]
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="rb-particle" style={{
          left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}px`, height: `${p.size}px`,
          background: `rgba(165,180,252,${p.op})`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
          ["--p-op" as string]: p.op,
        }} />
      ))}
    </div>
  );
}

function FAQSection({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(165,180,252,0.12)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 40% at 80% 100%, rgba(79,70,229,0.08) 0%, transparent 65%)" }} />
      <div className="relative z-10 p-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3"
          style={{ background: "rgba(79,70,229,0.15)", color: "#A5B4FC", border: "1px solid rgba(165,180,252,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" /> FAQ
        </div>
        <h3 className="font-display text-base font-extrabold mb-3 text-white">
          Common <span style={{ color: "#A5B4FC" }}>Questions</span>
        </h3>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(165,180,252,0.1)" }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-3.5 py-3 text-left gap-3"
                style={{ background: open === i ? "rgba(79,70,229,0.1)" : "transparent" }}>
                <span className="text-xs font-semibold leading-snug text-white">{item.q}</span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.22 }} className="flex-shrink-0">
                  <ChevronDown size={14} color="#818CF8" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                    <p className="px-3.5 pb-3 text-xs leading-relaxed" style={{ color: "#94A3B8" }}>{item.a}</p>
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

/* Large product card matching GamePage grid style */
function LargeRelatedCard({ product, index, onNavigate }: { product: ApiProduct; index: number; onNavigate: (id: string) => void }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const savings = product.originalPrice && !product.outOfStock
    ? (product.originalPrice - product.price).toFixed(2) : null;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (product.outOfStock) return;
    addItem({
      id: product._id, name: product.name, price: product.price, originalPrice: product.originalPrice,
      gradient: [product.gradient.from, product.gradient.to], image: product.imageUrl, game: product.game,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1300);
  }

  return (
    <motion.div
      onClick={() => onNavigate(product._id)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col rounded-xl overflow-hidden cursor-pointer relative h-full"
      style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(165,180,252,0.14)" }}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: "80%" }}>
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(135deg,${product.gradient.from} 0%,${product.gradient.to} 100%)` }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
        </div>
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" style={{ pointerEvents: "none" }} />
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
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 h-7 px-2.5 rounded-full flex items-center gap-1.5 shadow-lg text-white text-[11px] font-semibold whitespace-nowrap"
            style={{
              background: justAdded ? "rgba(16,185,129,0.95)" : "rgba(79,70,229,0.92)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              transition: "background 0.25s ease",
            }}>
            {justAdded ? (<><Check size={11} color="white" strokeWidth={3} /> Added!</>) : (<><ShoppingCart size={11} color="white" /> Add to Cart</>)}
          </motion.button>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-sm font-extrabold font-display" style={{ color: "#A5B4FC" }}>${product.price.toFixed(2)}</span>
          {product.originalPrice && <span className="text-[11px] line-through" style={{ color: "#64748B" }}>${product.originalPrice.toFixed(2)}</span>}
        </div>
        <p className="text-[11px] font-medium leading-tight line-clamp-2" style={{ color: "rgba(255,255,255,0.88)" }}>{product.name}</p>
      </div>
    </motion.div>
  );
}

/* Small horizontal scroll card (original compact style) */
function RelatedCard({ product, index, onNavigate }: { product: ApiProduct; index: number; onNavigate: (id: string) => void }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const savings = product.originalPrice && !product.outOfStock
    ? (product.originalPrice - product.price).toFixed(2) : null;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (product.outOfStock) return;
    addItem({
      id: product._id, name: product.name, price: product.price, originalPrice: product.originalPrice,
      gradient: [product.gradient.from, product.gradient.to], image: product.imageUrl, game: product.game,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1300);
  }

  return (
    <motion.div
      onClick={() => onNavigate(product._id)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0 flex flex-col rounded-xl overflow-hidden cursor-pointer relative"
      style={{ width: 148, background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(165,180,252,0.14)" }}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: "80%" }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${product.gradient.from} 0%,${product.gradient.to} 100%)` }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
        </div>
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" style={{ pointerEvents: "none" }} />
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
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 h-7 px-2.5 rounded-full flex items-center gap-1.5 shadow-lg text-white text-[11px] font-semibold whitespace-nowrap"
            style={{ background: justAdded ? "rgba(16,185,129,0.95)" : "rgba(79,70,229,0.92)", border: "1.5px solid rgba(255,255,255,0.25)", transition: "background 0.25s ease" }}>
            {justAdded ? (<><Check size={11} color="white" strokeWidth={3} /> Added!</>) : (<><ShoppingCart size={11} color="white" /> Add to Cart</>)}
          </motion.button>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-sm font-extrabold font-display" style={{ color: "#A5B4FC" }}>${product.price.toFixed(2)}</span>
          {product.originalPrice && <span className="text-[11px] line-through" style={{ color: "#64748B" }}>${product.originalPrice.toFixed(2)}</span>}
        </div>
        <p className="text-[11px] font-medium leading-tight line-clamp-2" style={{ color: "rgba(255,255,255,0.88)" }}>{product.name}</p>
      </div>
    </motion.div>
  );
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { addItem, updateQty, items, openCart } = useCart();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [related, setRelated] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showAllRelated, setShowAllRelated] = useState(false);
  const [gameBgImageUrl, setGameBgImageUrl] = useState<string | undefined>(undefined);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setNotFound(false);
    setActiveImage(0);
    setQuantity(1);
    setShowAllRelated(false);
    window.scrollTo(0, 0);

    setGameBgImageUrl(undefined);
    fetch(`${BACKEND}/api/products/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.data) { setNotFound(true); return; }
        setProduct(data.data);
        fetch(`${BACKEND}/api/products/${data.data._id}/related?limit=20`)
          .then(r => r.json())
          .then(rd => setRelated(rd.data || []))
          .catch(() => {});
        if (data.data.game) {
          fetch(`${BACKEND}/api/games/${data.data.game}`)
            .then(r => r.json())
            .then(gd => { if (gd.data?.game?.bgImageUrl) setGameBgImageUrl(gd.data.game.bgImageUrl); })
            .catch(() => {});
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const imgs = (product.images && product.images.length > 0) ? product.images : (product.imageUrl ? [product.imageUrl] : []);
    return imgs;
  }, [product]);

  const savings = product?.originalPrice && !product.outOfStock
    ? (product.originalPrice - product.price).toFixed(2) : null;

  const categoryId = product && typeof product.category === "object" ? product.category._id : (product?.category as string | undefined);
  const categoryName = product && typeof product.category === "object" ? product.category.name : undefined;

  function handleAddToCart() {
    if (!product || product.outOfStock) return;
    addItem({
      id: product._id, name: product.name, price: product.price, originalPrice: product.originalPrice,
      gradient: [product.gradient.from, product.gradient.to], image: product.imageUrl, game: product.game,
    });
    // Set qty in cart to match selected quantity
    const existingQty = items.find(i => i.id === product._id)?.quantity ?? 0;
    if (quantity > 1) {
      updateQty(product._id, existingQty + quantity);
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    openCart();
  }

  function handleBuyNow() {
    if (!product || product.outOfStock) return;
    setBuying(true);
    addItem({
      id: product._id, name: product.name, price: product.price, originalPrice: product.originalPrice,
      gradient: [product.gradient.from, product.gradient.to], image: product.imageUrl, game: product.game,
    });
    const existingQty = items.find(i => i.id === product._id)?.quantity ?? 0;
    if (quantity > 1) {
      updateQty(product._id, existingQty + quantity);
    }
    navigate("/checkout");
  }

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0C2E" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-t-transparent" style={{ borderColor: "#4F46E5", borderTopColor: "transparent" }} />
          <p className="text-sm font-medium font-display" style={{ color: "#818CF8" }}>Loading product...</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#0F0C2E" }}>
        <Package size={44} color="rgba(165,180,252,0.25)" />
        <h1 className="text-lg font-bold font-display text-white">Product not found</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>This item may have been removed or is no longer available.</p>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/")}
          className="mt-2 px-5 py-2.5 rounded-full text-sm font-bold text-white font-display"
          style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
          Back to Shop
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F0C2E" }}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 line-grid-dark" />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${product.gradient.from}22 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-1/3 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${product.gradient.to}1a 0%, transparent 70%)`, transform: "translateX(-40%)" }} />
      </div>
      <div className="fixed inset-0 pointer-events-none z-0"><ParticleField count={18} /></div>

      <div className="h-20 flex-shrink-0" />

      {/* Back + breadcrumb */}
      <div className="relative px-4 pt-1 pb-2 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={goBack}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(165,180,252,0.18)" }}>
            <ArrowLeft size={15} color="#A5B4FC" />
          </motion.button>
          <div className="flex items-center gap-1.5 text-xs font-medium overflow-hidden" style={{ color: "#64748B" }}>
            <button onClick={() => navigate(`/game/${product.game}`)} className="truncate hover:text-[#A5B4FC] transition-colors capitalize">
              {product.game.split("-").join(" ")}
            </button>
            {categoryName && <><span>/</span><span className="truncate" style={{ color: "#A5B4FC" }}>{categoryName}</span></>}
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 px-4 pb-40 md:pb-10">
        <div className="md:grid md:grid-cols-2 md:gap-8 md:max-w-5xl md:mx-auto">

          {/* Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-2xl mb-2.5"
              style={{ paddingTop: "90%", border: "1.5px solid rgba(165,180,252,0.16)" }}
            >
              {gameBgImageUrl ? (
                <div className="absolute inset-0">
                  <img src={gameBgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ pointerEvents: "none" }} />
                  <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.18)" }} />
                </div>
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${product.gradient.from} 0%,${product.gradient.to} 100%)` }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
                </div>
              )}
              <AnimatePresence mode="wait">
                {gallery[activeImage] && (
                  gameBgImageUrl ? (
                    <motion.img
                      key={gallery[activeImage]}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                      src={gallery[activeImage]} alt={product.name}
                      className="absolute object-contain"
                      style={{ inset: "6% 8%", width: "84%", height: "88%", filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.5))" }}
                    />
                  ) : (
                    <motion.img
                      key={gallery[activeImage]}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                      src={gallery[activeImage]} alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )
                )}
              </AnimatePresence>

              {product.outOfStock ? (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: "rgba(15,12,46,0.88)", color: "#818CF8", border: "1px solid rgba(165,180,252,0.25)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6b5c8a]" /> Out of Stock
                </div>
              ) : savings ? (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: "#dc2626", color: "white" }}>
                  <Tag size={11} /> Save ${savings}
                </div>
              ) : null}

              {(product.featured || product.bestSeller) && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: "rgba(245,158,11,0.92)", color: "#1E1B4B" }}>
                  <Flame size={11} /> Best Seller
                </div>
              )}

              {gallery.length > 1 && (
                <>
                  <button onClick={() => setActiveImage(i => (i - 1 + gallery.length) % gallery.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(15,12,46,0.65)", border: "1px solid rgba(165,180,252,0.25)" }}>
                    <ChevronLeft size={16} color="#A5B4FC" />
                  </button>
                  <button onClick={() => setActiveImage(i => (i + 1) % gallery.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(15,12,46,0.65)", border: "1px solid rgba(165,180,252,0.25)" }}>
                    <ChevronRight size={16} color="#A5B4FC" />
                  </button>
                </>
              )}
            </motion.div>

            {gallery.length > 1 && (
              <div ref={galleryRef} className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                {gallery.map((img, i) => (
                  <button key={img + i} onClick={() => setActiveImage(i)}
                    className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden relative"
                    style={{ border: activeImage === i ? "2px solid #818CF8" : "1.5px solid rgba(165,180,252,0.18)" }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: product.outOfStock ? "#f87171" : "#22c55e", boxShadow: `0 0 8px ${product.outOfStock ? "#f87171" : "#22c55e"}` }}
                />
                <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: product.outOfStock ? "#f87171" : "#4ade80" }}>
                  {product.outOfStock ? "Out of Stock" : "In Stock — Ready to Deliver"}
                </span>
              </div>

              <h1 className="font-display text-2xl font-bold text-white leading-tight mb-3">{product.name}</h1>

              <div className="flex items-baseline gap-2.5 mb-4">
                <span className="font-display text-3xl font-bold" style={{ color: "#A5B4FC" }}>${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-base line-through" style={{ color: "#64748B" }}>${product.originalPrice.toFixed(2)}</span>
                )}
                {savings && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.18)", color: "#f87171" }}>
                    Save ${savings}
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#a8a4c8" }}>{product.description}</p>
              )}

              {product.features && product.features.length > 0 && (
                <div className="mb-4 space-y-2">
                  {product.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(79,70,229,0.25)" }}>
                        <Check size={10} color="#A5B4FC" strokeWidth={3} />
                      </div>
                      <span className="text-sm" style={{ color: "#c7c4e0" }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {product.tags.map(t => (
                    <span key={t} className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                      style={{ background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(165,180,252,0.14)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Quantity selector */}
              {!product.outOfStock && (
                <div className="mb-5">
                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#64748B" }}>Quantity</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-xl overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(165,180,252,0.2)" }}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ color: quantity <= 1 ? "#3d3a5c" : "#A5B4FC" }}
                        disabled={quantity <= 1}
                      >
                        <Minus size={15} strokeWidth={2.5} />
                      </motion.button>
                      <div className="w-12 h-10 flex items-center justify-center">
                        <span className="font-display text-base font-bold text-white">{quantity}</span>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(q => Math.min(99, q + 1))}
                        className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                        style={{ color: "#A5B4FC" }}
                      >
                        <Plus size={15} strokeWidth={2.5} />
                      </motion.button>
                    </div>
                    <span className="text-xs font-medium" style={{ color: "#4ade80" }}>● In stock — ready to deliver</span>
                  </div>
                </div>
              )}

              {/* Desktop CTAs */}
              <div className="hidden md:flex gap-3 mb-6">
                <motion.button whileHover={!product.outOfStock ? { scale: 1.02 } : {}} whileTap={!product.outOfStock ? { scale: 0.97 } : {}}
                  onClick={handleAddToCart} disabled={product.outOfStock}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 font-display"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(165,180,252,0.3)", color: "#A5B4FC" }}>
                  <AnimatePresence mode="wait">
                    {justAdded ? (
                      <motion.span key="added" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                        <Check size={16} strokeWidth={3} /> Added to Cart
                      </motion.span>
                    ) : (
                      <motion.span key="add" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                        <ShoppingCart size={16} /> Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                <motion.button whileHover={!product.outOfStock ? { scale: 1.02, boxShadow: "0 0 30px rgba(79,70,229,0.5)" } : {}}
                  whileTap={!product.outOfStock ? { scale: 0.97 } : {}}
                  onClick={handleBuyNow} disabled={product.outOfStock || buying}
                  className="relative overflow-hidden flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 font-display"
                  style={{ background: "linear-gradient(135deg,#4F46E5 0%,#3730A3 100%)" }}>
                  <div className="rb-glare rb-glare-d1" style={{ opacity: 0.5 }} />
                  {buying ? <Loader2 size={16} className="animate-spin relative z-10" /> : <Zap size={16} className="relative z-10" fill="white" />}
                  <span className="relative z-10">{product.outOfStock ? "Out of Stock" : "Buy Now"}</span>
                </motion.button>
              </div>

              {/* FAQ Section (replaces trust badges) */}
              <FAQSection items={sharedFAQ} />
            </motion.div>
          </div>
        </div>

        {/* You might also like */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 md:max-w-5xl md:mx-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(79,70,229,0.2)", border: "1px solid rgba(165,180,252,0.2)" }}>
                  <Star size={15} color="#A5B4FC" />
                </div>
                <h2 className="font-display text-base font-bold text-white">You Might Also <em style={{ color: "#A5B4FC", fontStyle: "italic" }}>like</em></h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: "0 0 18px rgba(79,70,229,0.4)" }} whileTap={{ scale: 0.94 }}
                onClick={() => setShowAllRelated(v => !v)}
                className="relative overflow-hidden flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0 font-display"
                style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.22) 0%, rgba(55,48,163,0.22) 100%)", border: "1.5px solid rgba(165,180,252,0.25)", color: "#A5B4FC" }}>
                <div className="rb-glare rb-glare-d2" style={{ opacity: 0.6 }} />
                <span className="relative z-10 flex items-center gap-1">
                  {showAllRelated ? "Show Less" : <>View All <ArrowRight size={11} /></>}
                </span>
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {showAllRelated ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {related.map((p, i) => (
                    <LargeRelatedCard key={p._id} product={p} index={i} onNavigate={(id) => navigate(`/product/${id}`)} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="scroll"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-3 overflow-x-auto pb-2"
                  style={{ scrollbarWidth: "none" } as React.CSSProperties}
                >
                  {related.map((p, i) => (
                    <RelatedCard key={p._id} product={p} index={i} onNavigate={(id) => navigate(`/product/${id}`)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Mobile sticky CTA bar */}
      <div className="fixed bottom-[60px] left-0 right-0 z-40 px-3 py-2.5 md:hidden"
        style={{ background: "rgba(10,8,40,0.94)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(165,180,252,0.14)" }}>
        <div className="flex gap-2">
          <motion.button whileTap={!product.outOfStock ? { scale: 0.96 } : {}} onClick={handleAddToCart} disabled={product.outOfStock}
            className="w-14 rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(165,180,252,0.25)" }}>
            <AnimatePresence mode="wait">
              {justAdded
                ? <motion.span key="c" initial={{ scale: 0.6 }} animate={{ scale: 1 }}><Check size={18} color="#4ade80" strokeWidth={3} /></motion.span>
                : <motion.span key="a" initial={{ scale: 0.6 }} animate={{ scale: 1 }}><ShoppingCart size={18} color="#A5B4FC" /></motion.span>}
            </AnimatePresence>
          </motion.button>
          <motion.button whileTap={!product.outOfStock ? { scale: 0.97 } : {}} onClick={handleBuyNow} disabled={product.outOfStock || buying}
            className="relative overflow-hidden flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 font-display"
            style={{ background: "linear-gradient(135deg,#4F46E5 0%,#3730A3 100%)" }}>
            <div className="rb-glare rb-glare-d1" style={{ opacity: 0.5 }} />
            {buying ? <Loader2 size={16} className="animate-spin relative z-10" /> : <Zap size={16} className="relative z-10" fill="white" />}
            <span className="relative z-10">{product.outOfStock ? "Out of Stock" : `Buy Now${quantity > 1 ? ` (×${quantity})` : ""}`}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
