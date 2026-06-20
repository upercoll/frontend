import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { Product } from "../../types";
import { Package, Plus, Minus, Loader2, Check, X, Search, Tag, TrendingUp, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";

interface CartItem {
  product: Product;
  quantity: number;
  customPrice: number;
}

function PriceDiffBadge({ storePrice, customPrice }: { storePrice: number; customPrice: number }) {
  const diff = customPrice - storePrice;
  const pct = storePrice > 0 ? ((diff / storePrice) * 100).toFixed(0) : "0";
  if (Math.abs(diff) < 0.001) return null;
  const up = diff > 0;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{ background: up ? "#ECFDF5" : "#FEF2F2", color: up ? "#059669" : "#DC2626" }}>
      {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

export default function StockerRequestForm() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [selectedGame, setSelectedGame] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [success, setSuccess] = useState(false);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["stocker-products", selectedGame],
    queryFn: () => adminApi.stockerPanel.getProducts(selectedGame || undefined),
  });

  const submitMut = useMutation({
    mutationFn: (data: { game: string; items: { productId: string; quantity: number; customPrice?: number }[] }) =>
      adminApi.stockerPanel.submitRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stocker-my-stats"] });
      qc.invalidateQueries({ queryKey: ["stocker-requests"] });
      setSuccess(true);
      setCart([]);
    },
    onError: (e: Error) => alert(e.message),
  });

  const products = (productsData?.data.products || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );
  const games = [...new Set((productsData?.data.products || []).map(p => p.game))].filter(Boolean);
  const getCartItem = (productId: string) => cart.find(c => c.product._id === productId);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product._id === product._id);
      if (existing) return prev.map(c => c.product._id === product._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1, customPrice: product.price }];
    });
    if (!selectedGame) setSelectedGame(product.game);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.product._id === productId);
      if (existing && existing.quantity > 1) return prev.map(c => c.product._id === productId ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => c.product._id !== productId);
    });
  };

  const setCustomPrice = (productId: string, price: number) => {
    setCart(prev => prev.map(c => c.product._id === productId ? { ...c, customPrice: price } : c));
  };

  const storeTotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const customTotal = cart.reduce((s, c) => s + c.customPrice * c.quantity, 0);
  const totalDiff = customTotal - storeTotal;
  const hasCustomPrices = cart.some(c => Math.abs(c.customPrice - c.product.price) > 0.001);
  const cartGame = cart.length > 0 ? cart[0].product.game : selectedGame;

  const handleSubmit = () => {
    if (cart.length === 0) { alert("Add at least one item to your request"); return; }
    submitMut.mutate({
      game: cartGame,
      items: cart.map(c => ({
        productId: c.product._id,
        quantity: c.quantity,
        customPrice: Math.abs(c.customPrice - c.product.price) > 0.001 ? c.customPrice : undefined,
      })),
    });
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(74,222,128,0.12)", border: "2px solid rgba(74,222,128,0.3)" }}>
          <Check className="w-8 h-8" style={{ color: "#4ade80" }} />
        </div>
        <h2 className="text-xl font-bold text-white">Request Submitted!</h2>
        <p className="text-sm text-center max-w-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Your stock request has been submitted and is pending admin approval.
        </p>
        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSuccess(false)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "rgba(99,102,241,0.8)", border: "1px solid rgba(99,102,241,0.4)" }}>
            Submit Another
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/stocker/history")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            View My Requests
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">New Stock Request</h2>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Pick products, set your prices, and submit for admin approval
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
              />
            </div>
            <select value={selectedGame} onChange={e => setSelectedGame(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
              <option value="">All Games</option>
              {games.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Package className="w-10 h-10 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map(product => {
                const cartItem = getCartItem(product._id);
                const inCart = !!cartItem;
                const gradient = product.gradient;
                return (
                  <motion.div key={product._id} whileHover={{ y: -2 }}
                    className="rounded-xl overflow-hidden cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: inCart ? "1.5px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: inCart ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
                    }}
                    onClick={() => addToCart(product)}>
                    <div className="h-20 flex items-center justify-center"
                      style={{
                        background: gradient
                          ? `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
                          : product.imageUrl ? "transparent" : "rgba(255,255,255,0.05)"
                      }}>
                      {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        : <Package className="w-8 h-8 text-white/30" />}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold truncate text-white">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold" style={{ color: "#4ade80" }}>${product.price.toFixed(2)}</span>
                        {inCart ? (
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button onClick={e => { e.stopPropagation(); removeFromCart(product._id); }}
                              className="w-5 h-5 rounded flex items-center justify-center"
                              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-bold min-w-[16px] text-center" style={{ color: "#a5b4fc" }}>{cartItem.quantity}</span>
                            <button onClick={e => { e.stopPropagation(); addToCart(product); }}
                              className="w-5 h-5 rounded flex items-center justify-center"
                              style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(99,102,241,0.15)" }}>
                            <Plus className="w-2.5 h-2.5" style={{ color: "#a5b4fc" }} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 pt-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex-1 text-center">
                          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>In Stock</p>
                          <p className="text-[11px] font-bold" style={{ color: (product as any).stock <= 0 ? "#f87171" : "#60a5fa" }}>
                            {(product as any).stock < 0 ? "∞" : (product as any).stock}
                          </p>
                        </div>
                        <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.08)" }} />
                        <div className="flex-1 text-center">
                          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>On Hand</p>
                          <p className="text-[11px] font-bold" style={{ color: "#4ade80" }}>
                            {(product as any).stock < 0 ? "∞" : ((product as any).onHand ?? (product as any).stock)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl p-4 sticky top-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 className="font-semibold text-sm mb-3 text-white">
              Request Summary
              {cart.length > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
                  {cart.length} item{cart.length !== 1 ? "s" : ""}
                </span>
              )}
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Click products to add them</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-[420px] overflow-y-auto pr-0.5">
                  <AnimatePresence>
                    {cart.map(c => {
                      const diff = c.customPrice - c.product.price;
                      const hasCustom = Math.abs(diff) > 0.001;
                      return (
                        <motion.div key={c.product._id}
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                          className="rounded-xl p-2.5 space-y-2"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                              style={{ background: c.product.gradient ? `linear-gradient(135deg,${c.product.gradient.from},${c.product.gradient.to})` : "rgba(255,255,255,0.08)" }}>
                              {c.product.imageUrl && <img src={c.product.imageUrl} alt={c.product.name} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate text-white">{c.product.name}</p>
                              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                Store: ${c.product.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => removeFromCart(c.product._id)}
                                className="w-5 h-5 rounded flex items-center justify-center"
                                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-xs font-bold min-w-[16px] text-center text-white">{c.quantity}</span>
                              <button onClick={() => addToCart(c.product)}
                                className="w-5 h-5 rounded flex items-center justify-center"
                                style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 flex-1 rounded-lg px-2 py-1.5"
                              style={{
                                background: hasCustom ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.05)",
                                border: `1px solid ${hasCustom ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`,
                              }}>
                              <Tag className="w-3 h-3 flex-shrink-0" style={{ color: hasCustom ? "#a5b4fc" : "rgba(255,255,255,0.3)" }} />
                              <span className="text-[10px] font-medium flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>Your price</span>
                              <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>$</span>
                              <input
                                type="number" min="0" step="0.01"
                                value={c.customPrice}
                                onChange={e => setCustomPrice(c.product._id, parseFloat(e.target.value) || 0)}
                                onClick={e => e.stopPropagation()}
                                className="flex-1 w-0 min-w-0 bg-transparent text-xs font-bold focus:outline-none"
                                style={{ color: hasCustom ? "#a5b4fc" : "white" }}
                              />
                            </div>
                            <PriceDiffBadge storePrice={c.product.price} customPrice={c.customPrice} />
                          </div>

                          <div className="flex justify-between text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                            <span>Total ({c.quantity}×)</span>
                            <span className="font-semibold" style={{ color: hasCustom ? "#a5b4fc" : "#4ade80" }}>
                              ${(c.customPrice * c.quantity).toFixed(2)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <div className="space-y-2 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  {hasCustomPrices && (
                    <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      <span>Store total</span>
                      <span className="font-medium line-through">${storeTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      {hasCustomPrices ? "Your total" : "Projected value"}
                    </span>
                    <span className="font-bold" style={{ color: "#4ade80" }}>${customTotal.toFixed(2)}</span>
                  </div>
                  {hasCustomPrices && (
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Difference</span>
                      <span className="font-bold" style={{ color: totalDiff >= 0 ? "#4ade80" : "#f87171" }}>
                        {totalDiff >= 0 ? "+" : ""}${totalDiff.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Total units</span>
                    <span className="font-semibold text-white">{cart.reduce((s, c) => s + c.quantity, 0)}</span>
                  </div>
                  {cartGame && (
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Game</span>
                      <span className="font-semibold text-white">{cartGame}</span>
                    </div>
                  )}
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit} disabled={submitMut.isPending}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  {submitMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Submit Request
                </motion.button>
                <button onClick={() => setCart([])}
                  className="w-full py-2 mt-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"}>
                  <X className="w-3 h-3" /> Clear cart
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
