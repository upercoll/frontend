import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Minus, Plus, Trash2, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "wouter";
import GameSelectModal from "@/components/GameSelectModal";

function CheckoutBurstButton({ onClick }: { onClick: () => void }) {
  const [burst, setBurst] = useState(false);

  function handleClick() {
    setBurst(true);
    setTimeout(() => {
      setBurst(false);
      onClick();
    }, 520);
  }

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {burst && (
          <>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <motion.div
                key={angle}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: Math.cos((angle * Math.PI) / 180) * 60,
                  y: Math.sin((angle * Math.PI) / 180) * 60,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.02 }}
                className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
                style={{
                  background: i % 2 === 0 ? "#dc2626" : "#f97316",
                  marginLeft: -5,
                  marginTop: -5,
                  zIndex: 100,
                }}
              />
            ))}
            <motion.div
              initial={{ opacity: 0.8, scale: 0.8 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(220,38,38,0.5) 0%, transparent 70%)", zIndex: 99 }}
            />
          </>
        )}
      </AnimatePresence>

      <motion.button
        animate={burst ? { scale: [1, 1.06, 0.97, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        whileHover={!burst ? { scale: 1.02, boxShadow: "0 0 30px rgba(220,38,38,0.5)" } : {}}
        whileTap={!burst ? { scale: 0.97 } : {}}
        onClick={handleClick}
        className="w-full py-4 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2 text-base relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#dc2626 0%,#9f1239 100%)" }}
      >
        <motion.div
          animate={burst ? { x: ["0%", "100%"] } : { x: "0%" }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 opacity-0"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)" }}
        />
        <ShoppingCart size={20} />
        {burst ? "Processing…" : "Checkout"}
      </motion.button>
    </div>
  );
}

export default function CartDrawer() {
  const { items, removeItem, updateQty, totalItems, totalPrice, isOpen, closeCart } = useCart();
  const [, navigate] = useLocation();
  const [gameSelectOpen, setGameSelectOpen] = useState(false);
  const discountedTotal = totalPrice * 0.9;

  function handleCheckout() {
    closeCart();
    navigate("/checkout");
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="cart-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
              onClick={closeCart}
            />

            <motion.div
              key="cart-drawer"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[80] flex flex-col rounded-t-3xl overflow-hidden"
              style={{ background: "#0C0B2E", maxHeight: "88vh", border: "1.5px solid rgba(165,180,252,0.15)", borderBottom: "none" }}
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-12 h-1.5 rounded-full" style={{ background: "rgba(165,180,252,0.25)" }} />
              </div>

              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white">Cart</h2>
                  {totalItems > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "rgba(79,70,229,0.25)", color: "#A5B4FC" }}>
                      {totalItems}
                    </span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={closeCart}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(236,72,153,0.15)" }}
                >
                  <X size={18} color="#ec4899" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 relative overflow-hidden rounded-2xl">
                    {}
                    <div className="line-grid-dark" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.55 }} />
                    <div className="rb-particle" style={{ width: 7, height: 7, background: "#A5B4FC", left: "10%", top: "20%", animationDuration: "8.0s", animationDelay: "0s",    "--p-op": 0.20 } as React.CSSProperties} />
                    <div className="rb-particle" style={{ width: 5, height: 5, background: "#818CF8", left: "80%", top: "15%", animationDuration: "7.3s", animationDelay: "-2.5s", "--p-op": 0.15 } as React.CSSProperties} />
                    <div className="rb-particle" style={{ width: 6, height: 6, background: "#6366F1", left: "60%", top: "70%", animationDuration: "9.6s", animationDelay: "-4.0s", "--p-op": 0.18 } as React.CSSProperties} />
                    <div className="rb-particle" style={{ width: 4, height: 4, background: "#C7D2FE", left: "25%", top: "75%", animationDuration: "6.7s", animationDelay: "-1.2s", "--p-op": 0.13 } as React.CSSProperties} />
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ position: "relative", background: "rgba(79,70,229,0.12)", border: "1.5px solid rgba(165,180,252,0.12)" }}>
                      <ShoppingCart size={28} color="#4F46E5" />
                    </div>
                    <p className="text-sm font-medium" style={{ position: "relative", color: "#64748B" }}>Your cart is empty</p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { closeCart(); setGameSelectOpen(true); }}
                      className="px-6 py-2.5 rounded-full text-sm font-bold text-white"
                      style={{ position: "relative", background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
                      Browse Items
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-2">
                    <AnimatePresence initial={false}>
                      {items.map(item => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0, padding: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="flex items-center gap-3 p-3 rounded-2xl"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(165,180,252,0.1)" }}
                        >
                          <div className="w-13 h-13 rounded-xl flex-shrink-0 overflow-hidden relative"
                            style={{ width: 52, height: 52, background: `linear-gradient(135deg,${item.gradient[0]} 0%,${item.gradient[1]} 100%)` }}>
                            <div className="absolute inset-0 opacity-10"
                              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "8px 8px" }} />
                            {item.image && (
                              <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-sm font-extrabold" style={{ color: "#A5B4FC" }}>${item.price.toFixed(2)}</span>
                              {item.originalPrice && (
                                <span className="text-xs line-through" style={{ color: "#475569" }}>${item.originalPrice.toFixed(2)}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: item.quantity === 1 ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(165,180,252,0.15)" }}>
                              {item.quantity === 1 ? <Trash2 size={11} color="#ec4899" /> : <Minus size={11} color="#A5B4FC" />}
                            </motion.button>
                            <span className="text-sm font-bold text-white w-5 text-center">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: "rgba(79,70,229,0.3)", border: "1px solid rgba(79,70,229,0.4)" }}>
                              <Plus size={11} color="#A5B4FC" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="flex-shrink-0 px-4 pb-8 pt-3 space-y-3"
                  style={{ borderTop: "1px solid rgba(165,180,252,0.08)" }}>

                  <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
                    style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#3730A3 55%,#4F46E5 100%)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.18)" }}>
                        <Star size={16} fill="white" color="white" />
                      </div>
                      <div>
                        <p className="text-white font-extrabold text-[11px] tracking-widest uppercase">RBstars Members</p>
                        <motion.button
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          className="mt-1 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold"
                          style={{ background: "rgba(255,255,255,0.22)", color: "white" }}>
                          ✦ GET 10% OFF
                        </motion.button>
                      </div>
                    </div>
                    <span className="text-white font-extrabold text-sm">10% OFF</span>
                  </div>

                  <div className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(165,180,252,0.12)" }}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-white">${discountedTotal.toFixed(2)}</span>
                      <span className="text-sm line-through" style={{ color: "#64748B" }}>${totalPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Discounts Applied at Checkout</p>
                  </div>

                  <CheckoutBurstButton onClick={handleCheckout} />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {}
      <GameSelectModal open={gameSelectOpen} onClose={() => setGameSelectOpen(false)} zBase={210} />
    </>
  );
}
