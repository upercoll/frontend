import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Sword, Target, Heart, PawPrint, Package, Leaf, Sprout, Wrench,
  Apple, Gem, Star, ArrowLeft, Tag, ChevronDown, Search,
  ShoppingCart, Check, AlertTriangle, SlidersHorizontal, Minus, Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Footer from "@/components/Footer";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

interface Product {
  id: string; name: string; price: number; originalPrice?: number;
  outOfStock?: boolean; stock?: number; gradient: [string, string]; imageUrl?: string;
  categoryId?: string; featured?: boolean; bestSeller?: boolean;
}
interface Tab { id: string; label: string; icon: LucideIcon; }
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

const CATEGORY_COLORS = ["#3BA7FF", "#F97316", "#22C55E", "#EC4899", "#EAB308", "#8B5CF6", "#06B6D4", "#EF4444"];

const FALLBACK_CATEGORIES: ApiCategory[] = [
  { _id: "cat-seeds", name: "Seeds", slug: "seeds", icon: "leaf", game: "" },
  { _id: "cat-gears", name: "Gears", slug: "gears", icon: "wrench", game: "" },
  { _id: "cat-pets", name: "Pets", slug: "pets", icon: "pawprint", game: "" },
  { _id: "cat-decor", name: "Decor", slug: "decor", icon: "star", game: "" },
];

const FALLBACK_PRODUCTS: Product[] = [
  { id: "fp1", name: "Carrot Seed", price: 4.99, originalPrice: 7.99, gradient: ["#15803D", "#22C55E"], categoryId: "cat-seeds", featured: true, bestSeller: true, imageUrl: "/65.avif" },
  { id: "fp2", name: "Tomato Seed", price: 3.49, originalPrice: 5.49, gradient: ["#DC2626", "#F87171"], categoryId: "cat-seeds" },
  { id: "fp3", name: "Corn Seed", price: 6.99, originalPrice: 9.99, gradient: ["#EAB308", "#FDE047"], categoryId: "cat-seeds", featured: true },
  { id: "fp4", name: "Blueberry Seed", price: 12.99, originalPrice: 17.99, gradient: ["#2563EB", "#60A5FA"], categoryId: "cat-seeds", bestSeller: true },
  { id: "fp5", name: "Strawberry Seed", price: 8.49, originalPrice: 11.99, gradient: ["#E11D48", "#FB7185"], categoryId: "cat-seeds" },
  { id: "fp6", name: "Golden Watering Can", price: 24.99, originalPrice: 34.99, gradient: ["#D97706", "#FBBF24"], categoryId: "cat-gears", featured: true, bestSeller: true },
  { id: "fp7", name: "Basic Watering Can", price: 2.99, originalPrice: 4.99, gradient: ["#64748B", "#94A3B8"], categoryId: "cat-gears" },
  { id: "fp8", name: "Advanced Sprinkler", price: 19.99, originalPrice: 27.99, gradient: ["#0EA5E9", "#38BDF8"], categoryId: "cat-gears", featured: true },
  { id: "fp9", name: "Super Sprinkler", price: 39.99, originalPrice: 54.99, gradient: ["#7C3AED", "#A78BFA"], categoryId: "cat-gears", bestSeller: true },
  { id: "fp10", name: "Bunny", price: 14.99, originalPrice: 19.99, gradient: ["#EC4899", "#F9A8D4"], categoryId: "cat-pets", featured: true },
  { id: "fp11", name: "Cat", price: 9.99, originalPrice: 14.99, gradient: ["#F97316", "#FDBA74"], categoryId: "cat-pets" },
  { id: "fp12", name: "Dog", price: 11.99, originalPrice: 16.99, gradient: ["#92400E", "#D97706"], categoryId: "cat-pets", bestSeller: true },
  { id: "fp13", name: "Raccoon", price: 29.99, originalPrice: 42.99, gradient: ["#6B7280", "#9CA3AF"], categoryId: "cat-pets" },
  { id: "fp14", name: "Fairy Lantern", price: 7.49, gradient: ["#A855F7", "#C084FC"], categoryId: "cat-decor" },
  { id: "fp15", name: "Garden Gnome", price: 5.99, originalPrice: 8.99, gradient: ["#16A34A", "#4ADE80"], categoryId: "cat-decor" },
  { id: "fp16", name: "Hedge Fence", price: 3.99, gradient: ["#166534", "#22C55E"], categoryId: "cat-decor" },
  { id: "fp17", name: "Mushroom Lamp", price: 15.99, originalPrice: 21.99, gradient: ["#DC2626", "#FCA5A5"], categoryId: "cat-decor", featured: true },
  { id: "fp18", name: "Fruit Notifier", price: 49.99, originalPrice: 69.99, gradient: ["#EA580C", "#FB923C"], categoryId: "cat-gears", featured: true, bestSeller: true },
  { id: "fp19", name: "Lavender Seed", price: 22.99, originalPrice: 32.99, gradient: ["#7C3AED", "#C4B5FD"], categoryId: "cat-seeds" },
  { id: "fp20", name: "Watermelon Seed", price: 16.99, originalPrice: 22.99, gradient: ["#16A34A", "#86EFAC"], categoryId: "cat-seeds", outOfStock: true },
];

function PriceSlider({ min, max, value, onChange }: { min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const getPercent = useCallback((val: number) => ((val - min) / (max - min)) * 100, [min, max]);

  const valFromX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return min;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return min + pct * (max - min);
  }, [min, max]);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: PointerEvent) {
      const v = valFromX(e.clientX);
      if (dragging === "min") onChange([Math.min(v, value[1] - 0.01), value[1]]);
      else onChange([value[0], Math.max(v, value[0] + 0.01)]);
    }
    function onUp() { setDragging(null); }
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [dragging, valFromX, value, onChange]);

  const leftPct = getPercent(value[0]);
  const rightPct = getPercent(value[1]);

  return (
    <div ref={trackRef} className="relative h-6 px-1">
      <div className="absolute top-1/2 -translate-y-1/2 left-1 right-1 h-1.5 rounded-full" style={{ background: "#2C414E" }} />
      <div className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full"
        style={{ background: "#3BA7FF", left: `calc(${leftPct}% - 10px)`, right: `calc(${100 - rightPct}% - 10px)` }} />
      <div onPointerDown={e => { e.preventDefault(); setDragging("min"); }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10 touch-none"
        style={{ left: `calc(${leftPct}% - 1px)`, background: "white", border: "3px solid #3BA7FF", boxShadow: "0 0 6px rgba(59,167,255,0.4)", cursor: "grab" }} />
      <div onPointerDown={e => { e.preventDefault(); setDragging("max"); }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10 touch-none"
        style={{ left: `calc(${rightPct}% + 1px)`, background: "white", border: "3px solid #3BA7FF", boxShadow: "0 0 6px rgba(59,167,255,0.4)", cursor: "grab" }} />
    </div>
  );
}

function ProductCard({ product, index, gameInfo, navigate, onAdd, qty }: {
  product: Product; index: number; gameInfo: ApiGame | null;
  navigate: (url: string) => void; onAdd: (p: Product) => void; qty: number;
}) {
  const { updateQty, removeItem } = useCart();
  const maxStock = product.stock ?? 99;
  const atMax = qty >= maxStock;
  const savings = product.originalPrice && !product.outOfStock
    ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) : null;

  function handleMinus(e: React.MouseEvent) {
    e.stopPropagation();
    if (qty <= 1) removeItem(product.id);
    else updateQty(product.id, qty - 1);
  }
  function handlePlus(e: React.MouseEvent) {
    e.stopPropagation();
    if (qty < maxStock) updateQty(product.id, qty + 1);
  }
  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (qty < maxStock) onAdd(product);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }}
      onClick={() => navigate(`/product/${product.id}`)}
      className="rounded-xl overflow-hidden cursor-pointer flex flex-col"
      style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
      <div className="flex justify-center pt-2">
        <div className="w-8 h-[3px] rounded-full" style={{ background: "#364152" }} />
      </div>
      <div className="relative h-[140px] sm:h-[160px] flex items-center justify-center overflow-hidden px-4 pb-2">
        {gameInfo?.bgImageUrl ? (
          <>
            <img src={gameInfo.bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="relative z-10 w-[70%] h-[80%] object-contain drop-shadow-lg" />
            ) : <Package size={36} color="#637784" />}
          </>
        ) : product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4" />
        ) : <Package size={36} color="#637784" />}
        {product.outOfStock ? (
          <div className="absolute top-2 left-2 z-10 text-[9px] font-bold px-2 py-0.5 rounded-md"
            style={{ background: "rgba(0,0,0,0.6)", color: "#9BAEBB", border: "1px solid rgba(255,255,255,0.1)" }}>Out of Stock</div>
        ) : savings ? (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-md"
            style={{ background: "#DC2626", color: "white" }}><Tag size={8} />-{savings}%</div>
        ) : null}
      </div>
      <div className="p-3 pt-0 flex flex-col items-center text-center">
        <p className="text-sm font-bold leading-tight line-clamp-2 mb-2" style={{ color: "#F4F8FB" }}>{product.name}</p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-sm font-extrabold" style={{ color: "#22C55E" }}>${product.price.toFixed(2)}</span>
          {product.originalPrice && <span className="text-[11px] line-through" style={{ color: "#637784" }}>${product.originalPrice.toFixed(2)}</span>}
        </div>
        {!product.outOfStock ? (
          qty > 0 ? (
            <div className="w-full">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex items-center rounded-lg overflow-hidden w-full"
                style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
                <motion.button whileTap={{ scale: 0.85 }} onClick={handleMinus}
                  className="w-10 h-9 flex items-center justify-center flex-shrink-0" style={{ color: "#637784" }}>
                  <Minus size={15} strokeWidth={2.5} />
                </motion.button>
                <div className="flex-1 flex items-center justify-center">
                  <motion.span key={qty} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-sm font-extrabold" style={{ color: "#9BAEBB" }}>{qty}</motion.span>
                </div>
                <motion.button whileTap={atMax ? {} : { scale: 0.85 }} onClick={handlePlus}
                  className="h-9 w-10 flex items-center justify-center flex-shrink-0 rounded-r-lg"
                  style={{ background: atMax ? "#2C414E" : "#3BA7FF", color: "white", boxShadow: atMax ? "none" : "0 3px 0 0 #2980b9", cursor: atMax ? "not-allowed" : "pointer" }}>
                  <Plus size={15} strokeWidth={2.5} />
                </motion.button>
              </motion.div>
              <p className="text-center mt-1.5 text-[9px] font-medium" style={{ color: atMax ? "#F97316" : "#637784" }}>
                {atMax ? "Max stock" : `${maxStock - qty} left`}
              </p>
            </div>
          ) : (
            <motion.button whileTap={{ scale: 0.92 }} onClick={handleAdd}
              className="w-full py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5"
              style={{ background: "rgba(59,167,255,0.12)", color: "#3BA7FF", border: "1px solid rgba(59,167,255,0.25)" }}>
              <ShoppingCart size={12} /> Add to Cart
            </motion.button>
          )
        ) : (
          <div className="w-full py-2 rounded-lg text-[11px] font-bold text-center"
            style={{ background: "rgba(255,255,255,0.04)", color: "#637784", border: "1px solid #2C414E" }}>Out of Stock</div>
        )}
      </div>
    </motion.div>
  );
}

export default function GamePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { totalItems, openCart, addItem, items: cartRawItems } = useCart();

  const [gameInfo, setGameInfo] = useState<ApiGame | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);

  const cartItems = useMemo(() => {
    const map: Record<string, number> = {};
    cartRawItems.forEach(item => { map[item.id] = item.quantity; });
    return map;
  }, [cartRawItems]);

  const gameName = gameInfo?.name || (slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Game");
  const gameGradient = gameInfo?.gradient.from || "#3BA7FF";

  useEffect(() => {
    if (!slug) return;
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
        if (!ok && round < 3) { setTimeout(() => attempt(round + 1), 800 * round); return; }
        if (gameRes.success && gameRes.data?.game) setGameInfo(gameRes.data.game);
        else setGameInfo({ _id: slug, name: gameName, gradient: { from: "#3BA7FF", to: "#131C23" }, slug });
        const fetchedCats = catsRes.data || [];
        setCategories(fetchedCats.length > 0 ? fetchedCats : FALLBACK_CATEGORIES);
        setLoadError(ok ? null : "Could not load the store. Showing cached content.");
        const fetchedProducts = (prodsRes.data || []).map((p: Record<string, unknown>) => ({
          id: p._id as string, name: p.name as string, price: p.price as number,
          originalPrice: p.originalPrice as number | undefined,
          stock: p.stock as number | undefined,
          outOfStock: (p.stock as number) === 0,
          gradient: [(p.gradient as { from: string; to: string })?.from || "#3BA7FF", (p.gradient as { from: string; to: string })?.to || "#131C23"] as [string, string],
          imageUrl: p.imageUrl as string | undefined,
          categoryId: typeof p.category === "object" && p.category !== null ? (p.category as { _id: string })._id : p.category as string,
          featured: p.featured as boolean, bestSeller: p.bestSeller as boolean,
        }));
        setProducts(fetchedProducts.length > 0 ? fetchedProducts : FALLBACK_PRODUCTS);
      } finally { setLoading(false); }
    }
    attempt(1);
  }, [slug]);

  const tabs: Tab[] = useMemo(() => [
    { id: "all", label: "All Items", icon: Package },
    { id: "best-sellers", label: "Best Sellers", icon: Flame },
    ...categories.map((cat, i) => ({ id: cat._id, label: cat.name, icon: getIcon(cat.icon) })),
  ], [categories]);

  const tabProducts: Product[] = useMemo(() => {
    if (activeTab === "all") return products;
    if (activeTab === "best-sellers") { const bs = products.filter(p => p.featured || p.bestSeller); return bs.length > 0 ? bs : products.slice(0, 12); }
    return products.filter(p => p.categoryId === activeTab);
  }, [products, activeTab]);

  const filteredProducts = useMemo(() => {
    let list = searchQuery ? tabProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : tabProducts;
    if (inStockOnly) list = list.filter(p => !p.outOfStock);
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [tabProducts, searchQuery, inStockOnly, sortBy, priceRange]);

  const categoryCounts = useMemo(() => {
    let base = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (inStockOnly) base = base.filter(p => !p.outOfStock);
    const counts: Record<string, number> = { all: base.length, "best-sellers": base.filter(p => p.featured || p.bestSeller).length || base.length };
    categories.forEach(c => { counts[c._id] = base.filter(p => p.categoryId === c._id).length; });
    return counts;
  }, [products, categories, priceRange, inStockOnly]);

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];
  const activeTabCount = categoryCounts[activeTab] || 0;

  const priceMin = useMemo(() => products.length > 0 ? Math.min(...products.filter(p => !p.outOfStock).map(p => p.price)) : 0, [products]);
  const priceMax = useMemo(() => products.length > 0 ? Math.max(...products.filter(p => !p.outOfStock).map(p => p.price)) : 0, [products]);

  useEffect(() => {
    if (products.length > 0) setPriceRange([priceMin, priceMax]);
  }, [products, priceMin, priceMax]);

  function handleAddToCart(product: Product) {
    if (product.outOfStock) return;
    addItem({ id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, gradient: product.gradient, image: product.imageUrl, game: slug, bgImageUrl: gameInfo?.bgImageUrl });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#131C23", paddingTop: "100px" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-t-transparent"
            style={{ borderColor: "#3BA7FF", borderTopColor: "transparent" }} />
          <p className="text-sm font-medium" style={{ color: "#3BA7FF" }}>Loading {gameName}...</p>
        </div>
      </div>
    );
  }

  const currentTabLabel = activeTabObj.label;
  const currentTabIcon = activeTabObj.icon;

  return (
    <div className="min-h-screen" style={{ background: "#131C23" }}>
      <div style={{ height: "100px" }} />
      <div className="flex">

        {/* Sidebar — hidden on mobile */}
        <aside className="hidden lg:block w-[260px] flex-shrink-0 overflow-y-auto" style={{ borderRight: "1px solid #2C414E", background: "rgba(19,28,35,0.6)" }}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <SlidersHorizontal size={16} color="#3BA7FF" />
              <span className="text-base font-bold" style={{ color: "#F4F8FB" }}>Filters</span>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{ background: "#3BA7FF", color: "white" }}>
                {products.length}
              </span>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#637784" }}>Categories</p>
              <div className="flex flex-col gap-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  const count = categoryCounts[tab.id] || 0;
                  return (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm transition-all"
                      style={{ color: active ? "#F4F8FB" : "#9BAEBB", fontWeight: active ? 600 : 400 }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: active ? "#3BA7FF" : "transparent", border: active ? "none" : "1.5px solid #364152" }}>
                        {active && <Check size={10} color="white" strokeWidth={3} />}
                      </div>
                      <Icon size={14} strokeWidth={1.6} />
                      <span className="flex-1 truncate">{tab.label}</span>
                      <span className="text-[10px]" style={{ color: "#637784" }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#637784" }}>Availability</p>
              <button onClick={() => setInStockOnly(v => !v)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm w-full text-left"
                style={{ color: inStockOnly ? "#F4F8FB" : "#9BAEBB" }}>
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: inStockOnly ? "#3BA7FF" : "transparent", border: inStockOnly ? "none" : "1.5px solid #364152" }}>
                  {inStockOnly && <Check size={10} color="white" strokeWidth={3} />}
                </div>
                <span>In Stock Only</span>
              </button>
            </div>

            {/* Price range slider */}
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#637784" }}>Price</p>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
                  <span className="block text-[10px] mb-0.5" style={{ color: "#637784" }}>From</span>
                  <span className="text-sm font-bold" style={{ color: "#F4F8FB" }}>${priceRange[0].toFixed(2)}</span>
                </div>
                <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
                  <span className="block text-[10px] mb-0.5" style={{ color: "#637784" }}>To</span>
                  <span className="text-sm font-bold" style={{ color: "#F4F8FB" }}>${priceRange[1].toFixed(2)}</span>
                </div>
              </div>
              {priceMax > priceMin && (
                <PriceSlider min={priceMin} max={priceMax} value={priceRange} onChange={setPriceRange} />
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {/* Tabs row + search + sort */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid #2C414E" }}>
            {/* Mobile category scroll */}
            <div className="flex items-center gap-2 overflow-x-auto lg:hidden flex-1" style={{ scrollbarWidth: "none" }}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                    style={{
                      background: active ? "#3BA7FF" : "#1C2A34",
                      color: active ? "white" : "#9BAEBB",
                      border: `1px solid ${active ? "#3BA7FF" : "#2C414E"}`,
                    }}>
                    <Icon size={12} />
                    {tab.label}
                    <span className="opacity-60">{categoryCounts[tab.id] || 0}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop tabs */}
            <div className="hidden lg:flex items-center gap-2 flex-1">
              {tabs.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: active ? "#3BA7FF" : "#1C2A34",
                      color: active ? "white" : "#9BAEBB",
                      border: `1px solid ${active ? "#3BA7FF" : "#2C414E"}`,
                    }}>
                    {tab.label}
                    <span className="text-[10px] opacity-60">{categoryCounts[tab.id] || 0}</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 h-9 rounded-xl min-w-[180px] flex-shrink-0"
              style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
              <Search size={14} color="#637784" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search items"
                className="flex-1 bg-transparent outline-none text-sm" style={{ color: "#F4F8FB" }} />
            </div>

            {/* Sort dropdown */}
            <div className="relative flex-shrink-0">
              <button onClick={() => setSortOpen(v => !v)}
                className="flex items-center gap-2 px-3.5 h-9 rounded-xl text-sm font-medium"
                style={{ background: "#1C2A34", border: "1px solid #2C414E", color: "#9BAEBB" }}>
                {sortBy === "featured" ? "Default" : sortBy === "price-asc" ? "Price ↑" : sortBy === "price-desc" ? "Price ↓" : "Name A-Z"}
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 z-50 py-1 rounded-xl min-w-[140px]"
                    style={{ background: "#1C2A34", border: "1px solid #2C414E", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
                    {[["featured", "Default"], ["price-asc", "Price ↑"], ["price-desc", "Price ↓"], ["name", "Name A-Z"]].map(([val, label]) => (
                      <button key={val} onClick={() => { setSortBy(val as typeof sortBy); setSortOpen(false); }}
                        className="w-full text-left px-3.5 py-2 text-sm font-medium transition-colors"
                        style={{ color: sortBy === val ? "#3BA7FF" : "#9BAEBB", background: sortBy === val ? "rgba(59,167,255,0.08)" : "transparent" }}>
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Error banner */}
          {loadError && (
            <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-xl p-3 flex items-center justify-between gap-3"
              style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <p className="text-xs" style={{ color: "#fcd34d" }}>
                <AlertTriangle size={12} className="inline mr-1" />{loadError}
              </p>
              <button onClick={() => window.location.reload()}
                className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fcd34d" }}>Retry</button>
            </div>
          )}

          {/* Products grid */}
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={48} color="#2C414E" className="mb-4" />
                <p className="text-base font-bold mb-2" style={{ color: "#F4F8FB" }}>No products found</p>
                <p className="text-sm" style={{ color: "#637784" }}>
                  {searchQuery ? `No items found for "${searchQuery}"` : "Products will appear here once added."}
                </p>
              </div>
            ) : activeTab === "all" && !searchQuery ? (
              /* Grouped by category */
              (() => {
                const bs = filteredProducts.filter(p => p.featured || p.bestSeller);
                return (
                  <>
                    {/* Best Sellers section */}
                    {bs.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center gap-2.5 mb-4">
                          <Flame size={18} color="#F4F8FB" />
                          <h2 className="text-base font-bold" style={{ color: "#F4F8FB" }}>Best Sellers</h2>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(255,255,255,0.06)", color: "#9BAEBB" }}>{bs.length}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {bs.map((product, i) => <ProductCard key={product.id} product={product} index={i} gameInfo={gameInfo} navigate={navigate} onAdd={handleAddToCart} qty={cartItems[product.id] || 0} />)}
                        </div>
                      </div>
                    )}
                    {/* Per category sections */}
                    {categories.map((cat) => {
                      const catProducts = filteredProducts.filter(p => p.categoryId === cat._id);
                      if (catProducts.length === 0) return null;
                      const CatIcon = getIcon(cat.icon);
                      return (
                        <div key={cat._id} className="mb-8">
                          <div className="flex items-center gap-2.5 mb-4">
                            <CatIcon size={18} color="#F4F8FB" />
                            <h2 className="text-base font-bold" style={{ color: "#F4F8FB" }}>{cat.name}</h2>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(255,255,255,0.06)", color: "#9BAEBB" }}>{catProducts.length}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {catProducts.map((product, i) => <ProductCard key={product.id} product={product} index={i} gameInfo={gameInfo} navigate={navigate} onAdd={handleAddToCart} qty={cartItems[product.id] || 0} />)}
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()
            ) : (
              /* Flat grid for specific tab or search */
              <>
                <div className="flex items-center gap-2.5 mb-5">
                  <currentTabIcon size={18} color="#F4F8FB" />
                  <h2 className="text-base font-bold" style={{ color: "#F4F8FB" }}>{currentTabLabel}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#9BAEBB" }}>{filteredProducts.length}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product, i) => <ProductCard key={product.id} product={product} index={i} gameInfo={gameInfo} navigate={navigate} onAdd={handleAddToCart} qty={cartItems[product.id] || 0} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
