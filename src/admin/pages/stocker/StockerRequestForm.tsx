import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import type { Product } from "../../types";
import { Package, Plus, Minus, Loader2, Check, X, Search } from "lucide-react";
import { useLocation } from "wouter";

interface CartItem {
  product: Product;
  quantity: number;
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
    mutationFn: (data: { game: string; items: { productId: string; quantity: number }[] }) =>
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
      return [...prev, { product, quantity: 1 }];
    });
    if (!selectedGame) setSelectedGame(product.game);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.product._id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.product._id === productId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.product._id !== productId);
    });
  };

  const totalValue = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  const cartGame = cart.length > 0 ? cart[0].product.game : selectedGame;

  const handleSubmit = () => {
    if (cart.length === 0) { alert("Add at least one item to your request"); return; }
    submitMut.mutate({
      game: cartGame,
      items: cart.map(c => ({ productId: c.product._id, quantity: c.quantity })),
    });
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "#ECFDF5" }}>
          <Check className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Request Submitted!</h2>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          Your stock request has been submitted and is pending admin approval. You'll be notified once it's reviewed.
        </p>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSuccess(false)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#1e1b4b" }}
          >
            Submit Another
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/stocker/history")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}
          >
            View My Requests
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <div className="mb-5">
        <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>New Stock Request</h2>
        <p className="text-sm text-slate-500 mt-0.5">Select products you want to stock and submit for admin approval</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: "white", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
              />
            </div>
            <select
              value={selectedGame} onChange={e => setSelectedGame(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "white", border: "1px solid #E9EBF5", color: "#374151" }}
            >
              <option value="">All Games</option>
              {games.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl" style={{ border: "1px solid #E9EBF5" }}>
              <Package className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <p className="text-sm text-slate-400">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map(product => {
                const cartItem = getCartItem(product._id);
                const inCart = !!cartItem;
                const gradient = product.gradient;
                return (
                  <motion.div
                    key={product._id}
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-xl overflow-hidden cursor-pointer"
                    style={{ border: inCart ? "1.5px solid #6366f1" : "1px solid #E9EBF5" }}
                    onClick={() => addToCart(product)}
                  >
                    <div className="h-20 flex items-center justify-center"
                      style={{
                        background: gradient
                          ? `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
                          : product.imageUrl ? "transparent" : "#E9EBF5"
                      }}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-white/50" />
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold truncate" style={{ color: "#1e1b4b" }}>{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-emerald-600">${product.price.toFixed(2)}</span>
                        {inCart && (
                          <div className="flex items-center gap-1.5"
                            onClick={e => { e.stopPropagation(); }}>
                            <button
                              onClick={e => { e.stopPropagation(); removeFromCart(product._id); }}
                              className="w-5 h-5 rounded flex items-center justify-center"
                              style={{ background: "#FEF2F2", color: "#EF4444" }}
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-bold text-indigo-600 min-w-[16px] text-center">{cartItem.quantity}</span>
                            <button
                              onClick={e => { e.stopPropagation(); addToCart(product); }}
                              className="w-5 h-5 rounded flex items-center justify-center"
                              style={{ background: "#EEF2FF", color: "#6366f1" }}
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                        {!inCart && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: "#EEF2FF" }}>
                            <Plus className="w-2.5 h-2.5 text-indigo-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 sticky top-4" style={{ border: "1px solid #E9EBF5" }}>
            <h3 className="font-semibold text-sm mb-3" style={{ color: "#1e1b4b" }}>
              Request Summary
              {cart.length > 0 && <span className="ml-1 text-indigo-500">({cart.length} item{cart.length !== 1 ? "s" : ""})</span>}
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-xs text-slate-400">Click products to add them to your request</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  <AnimatePresence>
                    {cart.map(c => (
                      <motion.div
                        key={c.product._id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2.5 p-2 rounded-xl"
                        style={{ background: "#F7F8FC" }}
                      >
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                          style={{
                            background: c.product.gradient
                              ? `linear-gradient(135deg, ${c.product.gradient.from}, ${c.product.gradient.to})`
                              : "#E9EBF5"
                          }}>
                          {c.product.imageUrl && (
                            <img src={c.product.imageUrl} alt={c.product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: "#1e1b4b" }}>{c.product.name}</p>
                          <p className="text-[10px] text-emerald-600">${(c.product.price * c.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => removeFromCart(c.product._id)}
                            className="w-5 h-5 rounded flex items-center justify-center"
                            style={{ background: "#FEF2F2", color: "#EF4444" }}>
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold min-w-[16px] text-center" style={{ color: "#1e1b4b" }}>{c.quantity}</span>
                          <button onClick={() => addToCart(c.product)}
                            className="w-5 h-5 rounded flex items-center justify-center"
                            style={{ background: "#EEF2FF", color: "#6366f1" }}>
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="space-y-2 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Projected Sale Value</span>
                    <span className="font-bold text-emerald-600">${totalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total Items</span>
                    <span className="font-semibold" style={{ color: "#1e1b4b" }}>
                      {cart.reduce((s, c) => s + c.quantity, 0)}
                    </span>
                  </div>
                  {cartGame && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Game</span>
                      <span className="font-semibold" style={{ color: "#1e1b4b" }}>{cartGame}</span>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={submitMut.isPending}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "#1e1b4b" }}
                >
                  {submitMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Submit Request
                </motion.button>
                <button
                  onClick={() => setCart([])}
                  className="w-full py-2 mt-2 rounded-xl text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear cart
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
