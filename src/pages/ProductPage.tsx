import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ShoppingCart, Zap, ShieldCheck, Tag, Check, Package,
  Minus, Plus, Star, X, ChevronRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import Footer from "@/components/Footer";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

interface ApiCategory { _id: string; name: string; slug: string; icon?: string }
interface ApiProduct {
  _id: string; name: string; slug: string; description?: string; game: string;
  category?: ApiCategory | string; price: number; originalPrice?: number;
  gradient: { from: string; to: string }; imageUrl?: string; images?: string[];
  features?: string[]; stock: number; onHand?: number; outOfStock?: boolean;
  featured?: boolean; bestSeller?: boolean; tags?: string[];
}

const FALLBACK_PRODUCTS: Record<string, ApiProduct> = {
  "fp1": { _id: "fp1", name: "Carrot Seed", slug: "carrot-seed", price: 4.99, originalPrice: 7.99, game: "grow-a-garden-2", gradient: { from: "#15803D", to: "#22C55E" }, imageUrl: "/65.avif", stock: 10, category: { _id: "cat-seeds", name: "Seeds", slug: "seeds", icon: "leaf" }, featured: true, bestSeller: true },
  "fp2": { _id: "fp2", name: "Tomato Seed", slug: "tomato-seed", price: 3.49, originalPrice: 5.49, game: "grow-a-garden-2", gradient: { from: "#DC2626", to: "#F87171" }, stock: 15, category: { _id: "cat-seeds", name: "Seeds", slug: "seeds", icon: "leaf" } },
  "fp3": { _id: "fp3", name: "Corn Seed", slug: "corn-seed", price: 6.99, originalPrice: 9.99, game: "grow-a-garden-2", gradient: { from: "#EAB308", to: "#FDE047" }, stock: 8, category: { _id: "cat-seeds", name: "Seeds", slug: "seeds", icon: "leaf" }, featured: true },
  "fp4": { _id: "fp4", name: "Blueberry Seed", slug: "blueberry-seed", price: 12.99, originalPrice: 17.99, game: "grow-a-garden-2", gradient: { from: "#2563EB", to: "#60A5FA" }, stock: 5, category: { _id: "cat-seeds", name: "Seeds", slug: "seeds", icon: "leaf" }, bestSeller: true },
  "fp5": { _id: "fp5", name: "Strawberry Seed", slug: "strawberry-seed", price: 8.49, originalPrice: 11.99, game: "grow-a-garden-2", gradient: { from: "#E11D48", to: "#FB7185" }, stock: 12, category: { _id: "cat-seeds", name: "Seeds", slug: "seeds", icon: "leaf" } },
  "fp6": { _id: "fp6", name: "Golden Watering Can", slug: "golden-watering-can", price: 24.99, originalPrice: 34.99, game: "grow-a-garden-2", gradient: { from: "#D97706", to: "#FBBF24" }, stock: 3, category: { _id: "cat-gears", name: "Gears", slug: "gears", icon: "wrench" }, featured: true, bestSeller: true },
  "fp7": { _id: "fp7", name: "Basic Watering Can", slug: "basic-watering-can", price: 2.99, originalPrice: 4.99, game: "grow-a-garden-2", gradient: { from: "#64748B", to: "#94A3B8" }, stock: 20, category: { _id: "cat-gears", name: "Gears", slug: "gears", icon: "wrench" } },
  "fp8": { _id: "fp8", name: "Advanced Sprinkler", slug: "advanced-sprinkler", price: 19.99, originalPrice: 27.99, game: "grow-a-garden-2", gradient: { from: "#0EA5E9", to: "#38BDF8" }, stock: 6, category: { _id: "cat-gears", name: "Gears", slug: "gears", icon: "wrench" }, featured: true },
  "fp9": { _id: "fp9", name: "Super Sprinkler", slug: "super-sprinkler", price: 39.99, originalPrice: 54.99, game: "grow-a-garden-2", gradient: { from: "#7C3AED", to: "#A78BFA" }, stock: 2, category: { _id: "cat-gears", name: "Gears", slug: "gears", icon: "wrench" }, bestSeller: true },
  "fp10": { _id: "fp10", name: "Bunny", slug: "bunny", price: 14.99, originalPrice: 19.99, game: "grow-a-garden-2", gradient: { from: "#EC4899", to: "#F9A8D4" }, stock: 7, category: { _id: "cat-pets", name: "Pets", slug: "pets", icon: "pawprint" }, featured: true },
  "fp11": { _id: "fp11", name: "Cat", slug: "cat", price: 9.99, originalPrice: 14.99, game: "grow-a-garden-2", gradient: { from: "#F97316", to: "#FDBA74" }, stock: 10, category: { _id: "cat-pets", name: "Pets", slug: "pets", icon: "pawprint" } },
  "fp12": { _id: "fp12", name: "Dog", slug: "dog", price: 11.99, originalPrice: 16.99, game: "grow-a-garden-2", gradient: { from: "#92400E", to: "#D97706" }, stock: 9, category: { _id: "cat-pets", name: "Pets", slug: "pets", icon: "pawprint" }, bestSeller: true },
  "fp13": { _id: "fp13", name: "Raccoon", slug: "raccoon", price: 29.99, originalPrice: 42.99, game: "grow-a-garden-2", gradient: { from: "#6B7280", to: "#9CA3AF" }, stock: 4, category: { _id: "cat-pets", name: "Pets", slug: "pets", icon: "pawprint" } },
  "fp14": { _id: "fp14", name: "Fairy Lantern", slug: "fairy-lantern", price: 7.49, game: "grow-a-garden-2", gradient: { from: "#A855F7", to: "#C084FC" }, stock: 11, category: { _id: "cat-decor", name: "Decor", slug: "decor", icon: "star" } },
  "fp15": { _id: "fp15", name: "Garden Gnome", slug: "garden-gnome", price: 5.99, originalPrice: 8.99, game: "grow-a-garden-2", gradient: { from: "#16A34A", to: "#4ADE80" }, stock: 14, category: { _id: "cat-decor", name: "Decor", slug: "decor", icon: "star" } },
  "fp16": { _id: "fp16", name: "Hedge Fence", slug: "hedge-fence", price: 3.99, game: "grow-a-garden-2", gradient: { from: "#166534", to: "#22C55E" }, stock: 18, category: { _id: "cat-decor", name: "Decor", slug: "decor", icon: "star" } },
  "fp17": { _id: "fp17", name: "Mushroom Lamp", slug: "mushroom-lamp", price: 15.99, originalPrice: 21.99, game: "grow-a-garden-2", gradient: { from: "#DC2626", to: "#FCA5A5" }, stock: 5, category: { _id: "cat-decor", name: "Decor", slug: "decor", icon: "star" }, featured: true },
  "fp18": { _id: "fp18", name: "Fruit Notifier", slug: "fruit-notifier", price: 49.99, originalPrice: 69.99, game: "grow-a-garden-2", gradient: { from: "#EA580C", to: "#FB923C" }, stock: 1, category: { _id: "cat-gears", name: "Gears", slug: "gears", icon: "wrench" }, featured: true, bestSeller: true },
  "fp19": { _id: "fp19", name: "Lavender Seed", slug: "lavender-seed", price: 22.99, originalPrice: 32.99, game: "grow-a-garden-2", gradient: { from: "#7C3AED", to: "#C4B5FD" }, stock: 3, category: { _id: "cat-seeds", name: "Seeds", slug: "seeds", icon: "leaf" } },
  "fp20": { _id: "fp20", name: "Watermelon Seed", slug: "watermelon-seed", price: 16.99, originalPrice: 22.99, game: "grow-a-garden-2", gradient: { from: "#16A34A", to: "#86EFAC" }, stock: 0, category: { _id: "cat-seeds", name: "Seeds", slug: "seeds", icon: "leaf" } },
};

const ALL_PRODUCTS = Object.values(FALLBACK_PRODUCTS);

const RV_KEY = "rbstars_recently_viewed";
function getRecentlyViewed(): string[] {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || "[]"); } catch { return []; }
}
function pushRecentlyViewed(id: string) {
  const ids = getRecentlyViewed().filter(i => i !== id);
  ids.unshift(id);
  localStorage.setItem(RV_KEY, JSON.stringify(ids.slice(0, 20)));
}

export default function ProductPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { addItem, items, updateQty, openCart } = useCart();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [gameBgImageUrl, setGameBgImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setNotFound(false);
    setQuantity(1);
    window.scrollTo(0, 0);
    setGameBgImageUrl(undefined);

    fetch(`${BACKEND}/api/products/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.data) {
          const fb = FALLBACK_PRODUCTS[params.id!];
          if (fb) { setProduct(fb); pushRecentlyViewed(params.id!); }
          else { setNotFound(true); }
        } else {
          setProduct(data.data);
          pushRecentlyViewed(data.data._id);
          if (data.data.gameBgImageUrl) setGameBgImageUrl(data.data.gameBgImageUrl);
        }
      })
      .catch(() => {
        const fb = FALLBACK_PRODUCTS[params.id!];
        if (fb) { setProduct(fb); pushRecentlyViewed(params.id!); }
        else { setNotFound(true); }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const categoryId = product && typeof product.category === "object" ? product.category._id : (product?.category as string | undefined);
  const categoryName = product && typeof product.category === "object" ? product.category.name : undefined;

  const similarProducts = useMemo(() => {
    if (!categoryId) return [];
    return ALL_PRODUCTS.filter(p => {
      const catId = typeof p.category === "object" ? p.category._id : p.category;
      return catId === categoryId && p._id !== product?._id && !p.outOfStock;
    }).slice(0, 8);
  }, [categoryId, product]);

  const recentlyViewedProducts = useMemo(() => {
    const ids = getRecentlyViewed().filter(id => id !== product?._id);
    return ids.slice(0, 3).map(id => ALL_PRODUCTS.find(p => p._id === id)).filter(Boolean) as ApiProduct[];
  }, [product]);

  useEffect(() => {
    if (product) pushRecentlyViewed(product._id);
  }, [product?._id]);

  const savings = product?.originalPrice && !product.outOfStock
    ? (product.originalPrice - product.price).toFixed(2) : null;

  function handleAddToCart() {
    if (!product || product.outOfStock) return;
    addItem({
      id: product._id, name: product.name, price: product.price, originalPrice: product.originalPrice,
      gradient: [product.gradient.from, product.gradient.to], image: product.imageUrl, game: product.game, bgImageUrl: gameBgImageUrl,
    });
    const existingQty = items.find(i => i.id === product._id)?.quantity ?? 0;
    if (quantity > 1) updateQty(product._id, existingQty + quantity);
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
    if (quantity > 1) updateQty(product._id, existingQty + quantity);
    navigate("/checkout");
  }

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#131C23", paddingTop: "100px" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-t-transparent" style={{ borderColor: "#3BA7FF", borderTopColor: "transparent" }} />
          <p className="text-sm font-medium" style={{ color: "#3BA7FF" }}>Loading product...</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#131C23" }}>
        <Package size={44} color="#637784" />
        <h1 className="text-lg font-bold" style={{ color: "#F4F8FB" }}>Product not found</h1>
        <p className="text-sm" style={{ color: "#637784" }}>This item may have been removed or is no longer available.</p>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/browse")}
          className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9" }}>
          Browse Games
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#131C23" }}>
      <div style={{ height: "100px" }} />

      {/* Back + breadcrumb */}
      <div className="px-4 py-2 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={goBack}
            className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <ArrowLeft size={20} color="#9BAEBB" />
          </motion.button>
          <div className="flex items-center gap-1.5 text-xs font-medium overflow-hidden" style={{ color: "#637784" }}>
            <button onClick={() => navigate("/browse")} className="hover:text-[#3BA7FF] transition-colors">Browse</button>
            <ChevronRight size={12} />
            <button onClick={() => navigate(`/game/${product.game}`)} className="hover:text-[#3BA7FF] transition-colors capitalize">
              {product.game.split("-").join(" ")}
            </button>
            {categoryName && <><ChevronRight size={12} /><span className="hover:text-[#3BA7FF] transition-colors cursor-pointer" onClick={() => navigate(`/game/${product.game}`)}>{categoryName}</span></>}
            <ChevronRight size={12} />
            <span style={{ color: "#F4F8FB" }}>{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 pb-12">
        <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-8">

          {/* Image */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl overflow-hidden mb-6 md:mb-0 flex items-center justify-center relative"
            style={{ background: "#1C2A34", border: "1px solid #2C414E", aspectRatio: "1 / 1" }}>
            <div className="absolute inset-0 pointer-events-none z-0 rounded-2xl"
              style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(59,167,255,0.7) 0%, rgba(59,167,255,0.3) 35%, rgba(59,167,255,0.08) 60%, transparent 80%)" }} />
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-[75%] h-[75%] object-contain relative z-10" />
            ) : (
              <div className="flex items-center justify-center">
                <Package size={60} color="#364152" />
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: product.outOfStock ? "#EF4444" : "#22C55E" }} />
              <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: product.outOfStock ? "#EF4444" : "#22C55E" }}>
                {product.outOfStock ? "Out of Stock" : "In Stock"}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight mb-3" style={{ color: "#F4F8FB" }}>{product.name}</h1>

            <div className="flex items-baseline gap-2.5 mb-4">
              <span className="text-3xl font-extrabold" style={{ color: "#22C55E" }}>${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-base line-through" style={{ color: "#637784" }}>${product.originalPrice.toFixed(2)}</span>
              )}
              {savings && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(220,38,38,0.15)", color: "#EF4444" }}>
                  Save ${savings}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#9BAEBB" }}>{product.description}</p>
            )}

            {/* Quantity selector */}
            {!product.outOfStock && (
              <div className="mb-5">
                <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#637784" }}>Quantity</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg overflow-hidden"
                    style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-12 h-10 flex items-center justify-center" style={{ color: quantity <= 1 ? "#364152" : "#637784" }}
                      disabled={quantity <= 1}>
                      <Minus size={15} strokeWidth={2.5} />
                    </motion.button>
                    <div className="w-14 h-10 flex items-center justify-center">
                      <span className="text-sm font-extrabold" style={{ color: "#9BAEBB" }}>{quantity}</span>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(q => Math.min(product.onHand ?? product.stock, q + 1))}
                      className="w-12 h-10 flex items-center justify-center rounded-r-lg ml-1"
                      disabled={quantity >= (product.onHand ?? product.stock)}
                      style={{ background: quantity >= (product.onHand ?? product.stock) ? "#2C414E" : "#3BA7FF", color: "white",
                        boxShadow: quantity >= (product.onHand ?? product.stock) ? "none" : "0 3px 0 0 #2980b9",
                        cursor: quantity >= (product.onHand ?? product.stock) ? "not-allowed" : "pointer" }}>
                      <Plus size={15} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#637784" }}>
                    {product.onHand ?? product.stock} available
                  </span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mb-5">
              <motion.button whileTap={!product.outOfStock ? { scale: 0.97 } : {}} onClick={handleAddToCart} disabled={product.outOfStock}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 6px 16px rgba(0,0,0,0.3)", color: "white" }}>
                <AnimatePresence mode="wait">
                  {justAdded ? (
                    <motion.span key="added" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                      <Check size={16} strokeWidth={3} /> Added
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                      <ShoppingCart size={16} /> Add to Cart
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.button whileTap={!product.outOfStock ? { scale: 0.97 } : {}} onClick={handleBuyNow}
                disabled={product.outOfStock || buying}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "#22C55E", boxShadow: "0 4px 0 0 #15803a, 0 6px 16px rgba(0,0,0,0.3)" }}>
                <span>{product.outOfStock ? "Out of Stock" : "Buy Now"}</span>
              </motion.button>
            </div>

            {/* Trust */}
            <div className="flex flex-col items-center gap-3 mb-2 mt-1 px-5 py-4 rounded-xl"
              style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
              <img src="/payment-icons.png" alt="Visa, Mastercard, Amex, Discover, PayPal, Apple Pay, Google Pay" className="h-8 rounded-lg object-contain" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.3))" }} />
              <span className="text-[11px] font-medium" style={{ color: "#637784" }}>Secure checkout with 256-bit encryption</span>
            </div>
          </motion.div>
        </div>

        {/* Similar Items */}
        {similarProducts.length > 0 && (
          <div className="max-w-5xl mx-auto mt-12">
            <div className="flex items-center gap-2.5 mb-4">
              <Star size={18} color="#F4F8FB" />
              <h2 className="text-base font-bold" style={{ color: "#F4F8FB" }}>Similar Items</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "#9BAEBB" }}>{similarProducts.length}</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
              {similarProducts.map((p, i) => (
                <motion.div key={p._id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="flex-shrink-0 rounded-xl overflow-hidden flex flex-col cursor-pointer"
                  style={{ background: "#1C2A34", border: "1px solid #2C414E", width: 180 }}>
                  <div className="flex justify-center pt-2">
                    <div className="w-8 h-[3px] rounded-full" style={{ background: "#364152" }} />
                  </div>
                  <div onClick={() => navigate(`/product/${p._id}`)} className="h-[130px] flex items-center justify-center px-4 pb-2 cursor-pointer">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-[70%] h-[80%] object-contain" />
                    ) : (
                      <div className="w-full h-full rounded-lg" style={{ background: p.gradient.from }} />
                    )}
                  </div>
                  <div className="px-3 pt-0 pb-3 text-center flex flex-col items-center">
                    <p onClick={() => navigate(`/product/${p._id}`)} className="text-sm font-bold truncate mb-1 cursor-pointer" style={{ color: "#F4F8FB" }}>{p.name}</p>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="text-sm font-extrabold" style={{ color: "#22C55E" }}>${p.price.toFixed(2)}</span>
                      {p.originalPrice && <span className="text-[11px] line-through" style={{ color: "#637784" }}>${p.originalPrice.toFixed(2)}</span>}
                    </div>
                    {!p.outOfStock && (
                      <motion.button whileTap={{ scale: 0.92 }}
                        onClick={(e) => { e.stopPropagation(); addItem({ id: p._id, name: p.name, price: p.price, originalPrice: p.originalPrice, gradient: [p.gradient.from, p.gradient.to], image: p.imageUrl, game: p.game }); openCart(); }}
                        className="w-full py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5"
                        style={{ background: "rgba(59,167,255,0.12)", color: "#3BA7FF", border: "1px solid rgba(59,167,255,0.25)" }}>
                        <ShoppingCart size={11} /> Add to Cart
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recentlyViewedProducts.length > 0 && (
          <div className="max-w-5xl mx-auto mt-12">
            <div className="flex items-center gap-2.5 mb-4">
              <Package size={18} color="#F4F8FB" />
              <h2 className="text-base font-bold" style={{ color: "#F4F8FB" }}>Recently Viewed</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
              {recentlyViewedProducts.map((p, i) => (
                <motion.div key={p._id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="flex-shrink-0 rounded-xl overflow-hidden flex flex-col cursor-pointer"
                  style={{ background: "#1C2A34", border: "1px solid #2C414E", width: 180 }}>
                  <div className="flex justify-center pt-2">
                    <div className="w-8 h-[3px] rounded-full" style={{ background: "#364152" }} />
                  </div>
                  <div onClick={() => navigate(`/product/${p._id}`)} className="h-[130px] flex items-center justify-center px-4 pb-2 cursor-pointer">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-[70%] h-[80%] object-contain" />
                    ) : (
                      <div className="w-full h-full rounded-lg" style={{ background: p.gradient.from }} />
                    )}
                  </div>
                  <div className="px-3 pt-0 pb-3 text-center flex flex-col items-center">
                    <p onClick={() => navigate(`/product/${p._id}`)} className="text-sm font-bold truncate mb-1 cursor-pointer" style={{ color: "#F4F8FB" }}>{p.name}</p>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="text-sm font-extrabold" style={{ color: "#22C55E" }}>${p.price.toFixed(2)}</span>
                      {p.originalPrice && <span className="text-[11px] line-through" style={{ color: "#637784" }}>${p.originalPrice.toFixed(2)}</span>}
                    </div>
                    {!p.outOfStock && (
                      <motion.button whileTap={{ scale: 0.92 }}
                        onClick={(e) => { e.stopPropagation(); addItem({ id: p._id, name: p.name, price: p.price, originalPrice: p.originalPrice, gradient: [p.gradient.from, p.gradient.to], image: p.imageUrl, game: p.game }); openCart(); }}
                        className="w-full py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5"
                        style={{ background: "rgba(59,167,255,0.12)", color: "#3BA7FF", border: "1px solid rgba(59,167,255,0.25)" }}>
                        <ShoppingCart size={11} /> Add to Cart
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Mobile sticky CTA */}
      {!product.outOfStock && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-3 py-2.5 md:hidden"
          style={{ background: "#131C23", borderTop: "1px solid #2C414E" }}>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleAddToCart}
              className="w-14 rounded-xl flex items-center justify-center"
              style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
              {justAdded ? <Check size={18} color="#22C55E" strokeWidth={3} /> : <ShoppingCart size={18} color="#3BA7FF" />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleBuyNow}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9" }}>
              <Zap size={16} fill="white" />
              <span>{`Buy Now${quantity > 1 ? ` (×${quantity})` : ""}`}</span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
