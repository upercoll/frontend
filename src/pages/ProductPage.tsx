import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ShoppingCart, Zap, Star,
  ChevronLeft, ChevronRight, Package, Loader2, ArrowRight,
  Flame, Check, Minus, Plus, Tag,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import Footer from "@/components/Footer";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const NAVY = "#0E1A3C";
const ROYAL = "#2B50F6";
const GOLD = "#FFC53D";
const MUTED = "#5A6478";

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

interface FAQItemT { q: string; a: string; }

const sharedFAQ: FAQItemT[] = [
  { q: "Is RBstars legit?", a: "Yes — RBstars is a trusted, independent marketplace for Roblox game items. We have thousands of satisfied customers and use secure payment systems to protect every transaction." },
  { q: "What is your refund policy?", a: "We offer refunds within 24 hours if your item was not delivered. Contact our live chat support and we'll resolve it immediately." },
  { q: "Can I get free items?", a: "Occasionally we run promotions and giveaways on our Discord and social media. Follow us to stay updated. You can also use discount codes for 10% off your purchase." },
  { q: "How do I claim my items?", a: "After checkout, enter your in-game username. Click the chat icon in the bottom-right corner and select 'How To Claim Items.' Provide your username and order number — our team will trade you the items." },
  { q: "What if I don't receive my item?", a: "If delivery takes longer than 15 minutes, open our live chat. We have 24/7 support and will either resend your items or issue a full refund immediately — no questions asked." },
];

function FAQSection({ items }: { items: FAQItemT[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="relative rounded-3xl overflow-hidden bg-white mt-8"
      style={{ border: "1px solid rgba(14,26,60,.09)", boxShadow: "var(--shadow-soft-sm)" }}>
      <div className="p-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.18em] mb-3"
          style={{ background: "#EEF3FB", color: ROYAL }}>
          FAQ
        </div>
        <h3 className="font-display text-lg tracking-tight mb-4" style={{ color: NAVY }}>
          Common <span className="font-serif-italic" style={{ color: ROYAL }}>questions.</span>
        </h3>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden transition-colors"
              style={{ border: `1px solid ${open === i ? ROYAL : "rgba(14,26,60,.08)"}`, background: open === i ? "#F6F8FE" : "#fff" }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left gap-3">
                <span className="text-xs font-bold leading-snug" style={{ color: NAVY }}>{item.q}</span>
                <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.22 }}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: open === i ? ROYAL : "#EEF3FB" }}>
                  <span className="relative block w-2.5 h-[2px]" style={{ background: open === i ? "#fff" : NAVY }}>
                    {open !== i && <span className="absolute inset-0 rotate-90" style={{ background: NAVY }} />}
                  </span>
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                    <p className="px-4 pb-3.5 text-xs leading-relaxed" style={{ color: MUTED }}>{item.a}</p>
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

/* Related card */
function RelatedCardBase({ product, onNavigate, gameBgImageUrl, wide }: {
  product: ApiProduct; onNavigate: (id: string) => void; gameBgImageUrl?: string; wide?: boolean;
}) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const savings = product.originalPrice && !product.outOfStock
    ? (product.originalPrice - product.price).toFixed(2) : null;
  const c1 = product.gradient?.from || ROYAL;
  const c2 = product.gradient?.to || NAVY;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (product.outOfStock) return;
    addItem({
      id: product._id, name: product.name, price: product.price, originalPrice: product.originalPrice,
      gradient: [product.gradient.from, product.gradient.to], image: product.imageUrl, game: product.game, bgImageUrl: gameBgImageUrl,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1300);
  }

  return (
    <motion.div
      onClick={() => onNavigate(product._id)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "var(--shadow-soft-md)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col rounded-3xl overflow-hidden cursor-pointer relative h-full bg-white ${wide ? "" : "flex-shrink-0 w-[152px]"}`}
      style={{ border: "1px solid rgba(14,26,60,.09)", boxShadow: "var(--shadow-soft-xs)", transition: "box-shadow .25s ease" }}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: "80%" }}>
        {gameBgImageUrl ? (
          <div className="absolute inset-0">
            <img src={gameBgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(11,20,55,.25)" }} />
          </div>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${c1},${c2})` }} />
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "16px 16px" }} />
          </>
        )}
        {product.imageUrl && (
          gameBgImageUrl ? (
            <img src={product.imageUrl} alt={product.name}
              className="absolute object-contain pointer-events-none"
              style={{ inset: "8% 10%", width: "80%", height: "84%", filter: "drop-shadow(0 6px 12px rgba(0,0,0,.45))" }} />
          ) : (
            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          )
        )}
        {product.outOfStock ? (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-md"
            style={{ background: "rgba(11,20,55,.65)", color: "#fff" }}>
            Out of Stock
          </div>
        ) : savings ? (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold"
            style={{ background: GOLD, color: NAVY }}>
            <Tag size={8} /> Save ${savings}
          </div>
        ) : null}
        {!product.outOfStock && (
          <motion.button whileTap={{ scale: 0.85 }} onClick={handleAdd} aria-label="Add to cart"
            className="absolute bottom-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{
              background: justAdded ? "#0E9F6E" : ROYAL,
              boxShadow: "0 8px 20px -4px rgba(43,80,246,.55)",
            }}>
            {justAdded ? <Check size={14} strokeWidth={3} /> : <ShoppingCart size={14} />}
          </motion.button>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="font-display text-lg tracking-tight" style={{ color: NAVY }}>${product.price.toFixed(2)}</span>
          {product.originalPrice && <span className="text-[11px] line-through" style={{ color: "#9AA3B8" }}>${product.originalPrice.toFixed(2)}</span>}
        </div>
        <p className="text-[11px] font-medium leading-tight line-clamp-2" style={{ color: MUTED }}>{product.name}</p>
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
        if (data.data.gameBgImageUrl) setGameBgImageUrl(data.data.gameBgImageUrl);
        fetch(`${BACKEND}/api/products/${data.data._id}/related?limit=20`)
          .then(r => r.json())
          .then(rd => setRelated(rd.data || []))
          .catch(() => {});
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

  const categoryName = product && typeof product.category === "object" ? product.category.name : undefined;
  const maxQty = product?.onHand ?? product?.stock ?? 1;
  const artC1 = product?.gradient?.from || ROYAL;
  const artC2 = product?.gradient?.to || NAVY;

  function handleAddToCart() {
    if (!product || product.outOfStock) return;
    addItem({
      id: product._id, name: product.name, price: product.price, originalPrice: product.originalPrice,
      gradient: [product.gradient.from, product.gradient.to], image: product.imageUrl, game: product.game, bgImageUrl: gameBgImageUrl,
    });
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
      gradient: [product.gradient.from, product.gradient.to], image: product.imageUrl, game: product.game, bgImageUrl: gameBgImageUrl,
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
      <div className="min-h-screen dot-grid flex items-center justify-center" style={{ background: "#fff" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full border-[3px]" style={{ borderColor: "rgba(14,26,60,.15)", borderTopColor: ROYAL }} />
          <p className="text-sm font-medium" style={{ color: MUTED }}>Loading product…</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen dot-grid flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#fff" }}>
        <Package size={44} className="opacity-25" />
        <h1 className="font-display text-2xl tracking-tight">Product not found</h1>
        <p className="text-sm" style={{ color: MUTED }}>This item may have been removed or is no longer available.</p>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/")}
          className="mt-2 px-7 py-3 rounded-full text-sm font-bold text-white"
          style={{ background: ROYAL, boxShadow: "0 10px 26px -8px rgba(43,80,246,.5)" }}>
          Back to Shop
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff" }}>

      <div className="h-[104px] flex-shrink-0" />

      {/* Back + breadcrumb */}
      <div className="relative px-4 pb-2 flex-shrink-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={goBack}
            aria-label="Go back"
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border bg-white hover:bg-[#EEF3FB] transition-colors"
            style={{ borderColor: "rgba(14,26,60,.12)", color: NAVY }}>
            <ArrowLeft size={16} />
          </motion.button>
          <div className="flex items-center gap-2 text-xs font-medium overflow-hidden" style={{ color: MUTED }}>
            <button onClick={() => navigate(`/game/${product.game}`)} className="truncate hover:text-[#2B50F6] transition-colors capitalize">
              {product.game.split("-").join(" ")}
            </button>
            {categoryName && <><span>/</span><span className="truncate" style={{ color: ROYAL }}>{categoryName}</span></>}
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 px-4 pb-40 md:pb-10">
        <div className="md:grid md:grid-cols-2 md:gap-12 md:max-w-6xl md:mx-auto">

          {/* Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[28px] mb-3"
              style={{ paddingTop: "90%", border: "1px solid rgba(14,26,60,.08)", boxShadow: "var(--shadow-soft-md)" }}
            >
              {gameBgImageUrl ? (
                <div className="absolute inset-0">
                  <img src={gameBgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "rgba(11,20,55,.25)" }} />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${artC1},${artC2})` }} />
                  <div className="absolute inset-0 opacity-[0.08]"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
                </>
              )}
              <AnimatePresence mode="wait">
                {gallery[activeImage] && (
                  gameBgImageUrl ? (
                    <motion.img
                      key={gallery[activeImage]}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                      src={gallery[activeImage]} alt={product.name}
                      className="absolute object-contain"
                      style={{ inset: "8% 10%", width: "80%", height: "84%", filter: "drop-shadow(0 6px 14px rgba(0,0,0,.45))" }}
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
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
                  style={{ background: "rgba(11,20,55,.7)", color: "#fff" }}>
                  Out of Stock
                </div>
              ) : savings ? (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold rotate-[-3deg]"
                  style={{ background: GOLD, color: NAVY }}>
                  <Tag size={11} /> Save ${savings}
                </div>
              ) : null}

              {(product.featured || product.bestSeller) && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rotate-6 bg-white"
                  style={{ border: "2px solid #0E1A3C", borderRadius: 999, boxShadow: "0 3px 0 #0E1A3C" }}>
                  <Flame size={12} color="#FF7A1A" fill="#FFC53D" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#0E1A3C" }}>Best Seller</span>
                </div>
              )}

              {gallery.length > 1 && (
                <>
                  <button onClick={() => setActiveImage(i => (i - 1 + gallery.length) % gallery.length)} aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white hover:bg-[#EEF3FB] transition-colors shadow-lg"
                    style={{ border: "1px solid rgba(14,26,60,.1)" }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setActiveImage(i => (i + 1) % gallery.length)} aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white hover:bg-[#EEF3FB] transition-colors shadow-lg"
                    style={{ border: "1px solid rgba(14,26,60,.1)" }}>
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </motion.div>

            {gallery.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 mb-2" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                {gallery.map((img, i) => (
                  <button key={img + i} onClick={() => setActiveImage(i)} aria-label={`Image ${i + 1}`}
                    className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative transition-all hover:-translate-y-0.5"
                    style={{
                      border: activeImage === i ? `2px solid ${ROYAL}` : "1px solid rgba(14,26,60,.12)",
                      boxShadow: activeImage === i ? "0 6px 16px -4px rgba(43,80,246,.35)" : "none",
                    }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={product.outOfStock
                    ? { background: "#FDEEEC", color: "#D92D20", border: "1px solid rgba(217,45,32,.35)" }
                    : { background: "#E7F8F1", color: "#0E9F6E", border: "1px solid rgba(14,159,110,.3)" }}>
                  <span className="tilt-sq" style={{ background: product.outOfStock ? "#D92D20" : "#0E9F6E", transform: "rotate(45deg)", borderRadius: "50%" }} />
                  {product.outOfStock ? "Out of Stock" : "In Stock — Ready to Deliver"}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl leading-[1.02] tracking-tight mb-4" style={{ color: NAVY }}>
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 mb-5 pb-6" style={{ borderBottom: "1px solid rgba(14,26,60,.09)" }}>
                <span className="font-display text-4xl tracking-tight" style={{ color: NAVY }}>${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-base line-through" style={{ color: "#9AA3B8" }}>${product.originalPrice.toFixed(2)}</span>
                )}
                {savings && (
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full -rotate-2"
                    style={{ background: GOLD, color: NAVY }}>
                    Save ${savings}
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-[15px] leading-relaxed mb-5" style={{ color: MUTED }}>{product.description}</p>
              )}

              {product.features && product.features.length > 0 && (
                <div className="mb-5 space-y-2.5">
                  {product.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "#E7F8F1", border: "1px solid rgba(14,159,110,.3)" }}>
                        <Check size={11} color="#0E9F6E" strokeWidth={3.5} />
                      </div>
                      <span className="text-sm font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {product.tags.map(t => (
                    <span key={t} className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: "#F6F8FE", border: "1px solid rgba(14,26,60,.1)", color: MUTED }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Quantity */}
              {!product.outOfStock && (
                <div className="mb-6">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: MUTED }}>Quantity</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full overflow-hidden bg-white" style={{ border: "1.5px solid rgba(14,26,60,.15)" }}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        aria-label="Decrease quantity"
                        className="w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-30"
                        disabled={quantity <= 1}
                      >
                        <Minus size={15} strokeWidth={2.5} />
                      </motion.button>
                      <div className="w-12 text-center">
                        <span className="font-display text-xl">{quantity}</span>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                        aria-label="Increase quantity"
                        className="w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-30"
                        disabled={quantity >= maxQty}
                      >
                        <Plus size={15} strokeWidth={2.5} />
                      </motion.button>
                    </div>
                    <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "#0E9F6E" }}>
                      ● In stock — ready to deliver
                    </span>
                  </div>
                </div>
              )}

              {/* Desktop CTAs */}
              <div className="hidden md:flex gap-3 mb-4">
                <motion.button
                  whileHover={!product.outOfStock ? { y: -2, boxShadow: "var(--shadow-soft-md)" } : {}}
                  whileTap={!product.outOfStock ? { scale: 0.97 } : {}}
                  onClick={handleAddToCart} disabled={product.outOfStock}
                  className="flex-1 py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 bg-white border-[1.5px]"
                  style={{ borderColor: "rgba(14,26,60,.18)", color: NAVY }}>
                  {justAdded ? <Check size={16} strokeWidth={3} /> : <ShoppingCart size={16} />}
                  {justAdded ? "Added to Cart" : "Add to Cart"}
                </motion.button>
                <motion.button
                  whileHover={!product.outOfStock ? { y: -2, boxShadow: "0 18px 36px -10px rgba(43,80,246,.6)" } : {}}
                  whileTap={!product.outOfStock ? { scale: 0.97 } : {}}
                  onClick={handleBuyNow} disabled={product.outOfStock || buying}
                  className="relative flex-1 py-4 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "linear-gradient(180deg,#3D63FF 0%,#2B50F6 100%)", boxShadow: "0 10px 26px -8px rgba(43,80,246,.55)" }}>
                  {buying ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="#fff" />}
                  {product.outOfStock ? "Out of Stock" : "Buy Now"}
                </motion.button>
              </div>

              <FAQSection items={sharedFAQ} />
            </motion.div>
          </div>
        </div>

        {/* You might also like */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 md:max-w-6xl md:mx-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#FFF6DC" }}>
                  <Star size={16} fill="#D99A00" color="#D99A00" />
                </div>
                <h2 className="font-display text-2xl tracking-tight" style={{ color: NAVY }}>
                  You might also <span className="font-serif-italic" style={{ color: ROYAL }}>like.</span>
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                onClick={() => setShowAllRelated(v => !v)}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold text-white flex-shrink-0"
                style={{ background: NAVY }}>
                {showAllRelated ? "Show Less" : <>View All <ArrowRight size={11} /></>}
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
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {related.map(p => (
                    <RelatedCardBase key={p._id} product={p} wide onNavigate={(id) => navigate(`/product/${id}`)} gameBgImageUrl={gameBgImageUrl} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="scroll"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-4 overflow-x-auto pb-2"
                  style={{ scrollbarWidth: "none" } as React.CSSProperties}
                >
                  {related.map(p => (
                    <RelatedCardBase key={p._id} product={p} onNavigate={(id) => navigate(`/product/${id}`)} gameBgImageUrl={gameBgImageUrl} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Footer />

      {/* Mobile sticky CTA bar */}
      <div className="fixed bottom-[64px] left-0 right-0 z-40 px-3 py-2.5 md:hidden"
        style={{ background: "rgba(255,255,255,.95)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(14,26,60,.1)" }}>
        <div className="flex gap-2">
          <motion.button whileTap={!product.outOfStock ? { scale: 0.95 } : {}} onClick={handleAddToCart} disabled={product.outOfStock}
            aria-label="Add to cart"
            className="w-14 rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0 bg-white"
            style={{ border: "1.5px solid rgba(14,26,60,.16)" }}>
            {justAdded
              ? <Check size={18} color="#0E9F6E" strokeWidth={3} />
              : <ShoppingCart size={18} />}
          </motion.button>
          <motion.button whileTap={!product.outOfStock ? { scale: 0.96 } : {}} onClick={handleBuyNow} disabled={product.outOfStock || buying}
            className="flex-1 py-3.5 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: "linear-gradient(180deg,#3D63FF 0%,#2B50F6 100%)", boxShadow: "0 10px 24px -8px rgba(43,80,246,.6)" }}>
            {buying ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="#fff" />}
            {product.outOfStock ? "Out of Stock" : `Buy Now${quantity > 1 ? ` (×${quantity})` : ""}`}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
