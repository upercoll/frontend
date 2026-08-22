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
    <div className="relative rounded-2xl overflow-hidden bg-white mt-8"
      style={{ border: "2px solid #131313", boxShadow: "5px 5px 0 #131313" }}>
      <div className="p-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.18em] mb-3"
          style={{ border: "2px solid #131313", color: "#131313" }}>
          <span className="tilt-sq !w-2 !h-2" /> FAQ
        </div>
        <h3 className="font-display text-lg uppercase mb-3">
          Common <span className="text-outline">Questions</span>
        </h3>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden"
              style={{ border: "2px solid #131313", background: open === i ? "#F7F4EC" : "#fff" }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-3.5 py-3 text-left gap-3">
                <span className="text-xs font-bold leading-snug">{item.q}</span>
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
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                    <p className="px-3.5 pb-3 text-xs leading-relaxed" style={{ color: "#6B655C" }}>{item.a}</p>
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

/* Shared related-card renderer */
function RelatedCardBase({ product, onNavigate, gameBgImageUrl, wide }: {
  product: ApiProduct; onNavigate: (id: string) => void; gameBgImageUrl?: string; wide?: boolean;
}) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const savings = product.originalPrice && !product.outOfStock
    ? (product.originalPrice - product.price).toFixed(2) : null;
  const c1 = product.gradient?.from || "#E2231A";

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
      whileHover={{ y: -5, boxShadow: "5px 6px 0 #131313" }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col rounded-2xl overflow-hidden cursor-pointer relative h-full bg-white ${wide ? "" : "flex-shrink-0 w-[150px]"}`}
      style={{ border: "2px solid #131313", transition: "box-shadow .2s ease" }}
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
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider bg-white"
            style={{ border: "1.5px solid #131313", color: "#131313" }}>
            Out of Stock
          </div>
        ) : savings ? (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold text-white -rotate-3"
            style={{ background: "#E2231A", border: "1.5px solid #131313" }}>
            <Tag size={8} /> Save ${savings}
          </div>
        ) : null}
        {!product.outOfStock && (
          <motion.button whileTap={{ scale: 0.85 }} onClick={handleAdd} aria-label="Add to cart"
            className="absolute bottom-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors"
            style={{
              background: justAdded ? "#00B06F" : "#E2231A",
              borderColor: "#131313",
              color: "#fff",
              boxShadow: "2px 2px 0 rgba(19,19,19,.9)",
            }}>
            {justAdded ? <Check size={14} strokeWidth={3} /> : <ShoppingCart size={14} />}
          </motion.button>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="font-display text-lg leading-none">${product.price.toFixed(2)}</span>
          {product.originalPrice && <span className="text-[11px] line-through" style={{ color: "#8a8375" }}>${product.originalPrice.toFixed(2)}</span>}
        </div>
        <p className="text-[11px] font-medium leading-tight line-clamp-2" style={{ color: "#55503F" }}>{product.name}</p>
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
  const artColor = product?.gradient?.from || "#E2231A";

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
      <div className="min-h-screen flex items-center justify-center dot-grid" style={{ background: "#F2EEE5" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full border-[3px]" style={{ borderColor: "#131313", borderTopColor: "transparent" }} />
          <p className="font-mono text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "#6B655C" }}>Loading product…</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen dot-grid flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#F2EEE5" }}>
        <Package size={44} className="opacity-25" />
        <h1 className="font-display text-2xl uppercase">Product not found</h1>
        <p className="text-sm" style={{ color: "#6B655C" }}>This item may have been removed or is no longer available.</p>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/")}
          className="mt-2 px-6 py-3 rounded-full font-mono text-xs font-semibold uppercase tracking-wider text-white border-2"
          style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}>
          Back to Shop
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col dot-grid" style={{ background: "#F2EEE5" }}>

      <div className="h-[104px] flex-shrink-0" />

      {/* Back + breadcrumb */}
      <div className="relative px-4 pb-2 flex-shrink-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={goBack}
            aria-label="Go back"
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border-2 bg-white hover:bg-[#131313] hover:text-white transition-colors"
            style={{ borderColor: "#131313" }}>
            <ArrowLeft size={16} />
          </motion.button>
          <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider overflow-hidden" style={{ color: "#6B655C" }}>
            <button onClick={() => navigate(`/game/${product.game}`)} className="truncate hover:text-[#E2231A] transition-colors capitalize">
              {product.game.split("-").join(" ")}
            </button>
            {categoryName && <><span className="tilt-sq !w-1.5 !h-1.5 mx-1" /><span className="truncate">{categoryName}</span></>}
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 px-4 pb-40 md:pb-10">
        <div className="md:grid md:grid-cols-2 md:gap-10 md:max-w-6xl md:mx-auto">

          {/* Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-3xl mb-3"
              style={{ paddingTop: "90%", border: "3px solid #131313", boxShadow: "7px 8px 0 #131313" }}
            >
              {gameBgImageUrl ? (
                <div className="absolute inset-0">
                  <img src={gameBgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "rgba(19,19,19,.22)" }} />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0" style={{ background: artColor }} />
                  <div className="absolute inset-0 pattern-dots-light opacity-60" />
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
                      style={{ inset: "8% 10%", width: "80%", height: "84%", filter: "drop-shadow(0 5px 12px rgba(0,0,0,.55))" }}
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
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider bg-white"
                  style={{ border: "2px solid #131313" }}>
                  Out of Stock
                </div>
              ) : savings ? (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold text-white -rotate-3"
                  style={{ background: "#E2231A", border: "2px solid #131313" }}>
                  <Tag size={11} /> Save ${savings}
                </div>
              ) : null}

              {(product.featured || product.bestSeller) && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider rotate-3"
                  style={{ background: "#FFC800", border: "2px solid #131313", color: "#131313" }}>
                  <Flame size={11} /> Best Seller
                </div>
              )}

              {gallery.length > 1 && (
                <>
                  <button onClick={() => setActiveImage(i => (i - 1 + gallery.length) % gallery.length)} aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white hover:bg-[#131313] hover:text-white transition-colors"
                    style={{ border: "2px solid #131313" }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setActiveImage(i => (i + 1) % gallery.length)} aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white hover:bg-[#131313] hover:text-white transition-colors"
                    style={{ border: "2px solid #131313" }}>
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </motion.div>

            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mb-2" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                {gallery.map((img, i) => (
                  <button key={img + i} onClick={() => setActiveImage(i)} aria-label={`Image ${i + 1}`}
                    className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative transition-transform hover:-translate-y-0.5"
                    style={{
                      border: activeImage === i ? "3px solid #E2231A" : "2px solid #131313",
                      boxShadow: activeImage === i ? "3px 3px 0 #E2231A" : "none",
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
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${product.outOfStock ? "-rotate-2" : "rotate-2"}`}
                  style={{
                    background: product.outOfStock ? "#fff" : "#00B06F",
                    color: product.outOfStock ? "#E2231A" : "#fff",
                    border: "2px solid #131313",
                  }}>
                  <span className="tilt-sq !w-1.5 !h-1.5" style={{ background: product.outOfStock ? "#E2231A" : "#fff" }} />
                  {product.outOfStock ? "Out of Stock" : "In Stock — Ready to Deliver"}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl uppercase leading-[0.95] mb-4">{product.name}</h1>

              <div className="flex items-baseline gap-2.5 mb-5 pb-5 border-b-[2.5px] border-[#131313]">
                <span className="font-display text-4xl">${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-base line-through" style={{ color: "#8a8375" }}>${product.originalPrice.toFixed(2)}</span>
                )}
                {savings && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md -rotate-2 text-white"
                    style={{ background: "#E2231A", border: "1.5px solid #131313" }}>
                    Save ${savings}
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#55503F" }}>{product.description}</p>
              )}

              {product.features && product.features.length > 0 && (
                <div className="mb-5 space-y-2.5">
                  {product.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border-2"
                        style={{ background: "#00B06F", borderColor: "#131313" }}>
                        <Check size={11} color="#fff" strokeWidth={3.5} />
                      </div>
                      <span className="text-sm font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {product.tags.map(t => (
                    <span key={t} className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: "#fff", border: "1.5px solid #131313", color: "#55503F" }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Quantity selector */}
              {!product.outOfStock && (
                <div className="mb-6">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#6B655C" }}>Quantity</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full overflow-hidden bg-white" style={{ border: "2.5px solid #131313" }}>
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
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#00875A" }}>
                      <span className="tilt-sq !w-1.5 !h-1.5" style={{ background: "#00B06F" }} /> In stock
                    </span>
                  </div>
                </div>
              )}

              {/* Desktop CTAs */}
              <div className="hidden md:flex gap-3 mb-4">
                <motion.button
                  whileHover={!product.outOfStock ? { translateX: -1, translateY: -1 } : {}}
                  whileTap={!product.outOfStock ? { translateX: 1, translateY: 1 } : {}}
                  onClick={handleAddToCart} disabled={product.outOfStock}
                  className="flex-1 py-4 rounded-full font-mono text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 bg-white border-[3px]"
                  style={{ borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}>
                  {justAdded ? <Check size={16} strokeWidth={3} /> : <ShoppingCart size={16} />}
                  {justAdded ? "Added to Cart" : "Add to Cart"}
                </motion.button>
                <motion.button
                  whileHover={!product.outOfStock ? { translateX: -2, translateY: -2, boxShadow: "7px 7px 0 #131313" } : {}}
                  whileTap={!product.outOfStock ? { translateX: 2, translateY: 2, boxShadow: "1px 1px 0 #131313" } : {}}
                  onClick={handleBuyNow} disabled={product.outOfStock || buying}
                  className="relative flex-1 py-4 rounded-full font-mono text-sm font-semibold uppercase tracking-wider text-white flex items-center justify-center gap-2 disabled:opacity-40 border-[3px]"
                  style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}>
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
            className="mt-14 md:max-w-6xl md:mx-auto"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b-[2.5px] border-[#131313]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 -rotate-3 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border-2"
                  style={{ borderColor: "#131313", boxShadow: "3px 3px 0 #131313" }}>
                  <Star size={15} fill="#FFC800" stroke="#131313" strokeWidth={1.5} />
                </div>
                <h2 className="font-display text-xl sm:text-2xl uppercase">You Might Also <span className="text-outline">Like</span></h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                onClick={() => setShowAllRelated(v => !v)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-wider text-white flex-shrink-0 border-2"
                style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "2px 2px 0 #131313" }}>
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
                  className="flex gap-3 overflow-x-auto pb-2"
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
        style={{ background: "#F2EEE5", borderTop: "3px solid #131313" }}>
        <div className="flex gap-2">
          <motion.button whileTap={!product.outOfStock ? { scale: 0.95 } : {}} onClick={handleAddToCart} disabled={product.outOfStock}
            aria-label="Add to cart"
            className="w-14 rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0 bg-white"
            style={{ border: "2.5px solid #131313" }}>
            {justAdded
              ? <Check size={18} style={{ color: "#00B06F" }} strokeWidth={3} />
              : <ShoppingCart size={18} />}
          </motion.button>
          <motion.button whileTap={!product.outOfStock ? { scale: 0.96 } : {}} onClick={handleBuyNow} disabled={product.outOfStock || buying}
            className="flex-1 py-3.5 rounded-full font-mono text-sm font-semibold uppercase tracking-wider text-white flex items-center justify-center gap-2 disabled:opacity-40 border-[3px]"
            style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}>
            {buying ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="#fff" />}
            {product.outOfStock ? "Out of Stock" : `Buy Now${quantity > 1 ? ` (×${quantity})` : ""}`}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
