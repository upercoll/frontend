import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "wouter";
import GameSelectModal from "@/components/GameSelectModal";

const BURST_COLORS = ["#2B50F6", "#FFC53D", "#0E1A3C", "#7FA5FF", "#FFD84D"];

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
                  x: Math.cos((angle * Math.PI) / 180) * 64,
                  y: Math.sin((angle * Math.PI) / 180) * 64,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.02 }}
                className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                style={{
                  width: i % 2 === 0 ? 10 : 7,
                  height: i % 2 === 0 ? 10 : 7,
                  background: BURST_COLORS[i % BURST_COLORS.length],
                  marginLeft: -5,
                  marginTop: -5,
                  zIndex: 100,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.button
        animate={burst ? { scale: [1, 1.06, 0.97, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        whileHover={!burst ? { y: -2, boxShadow: "0 16px 36px -8px rgba(43,80,246,.6)" } : {}}
        whileTap={!burst ? { scale: 0.97 } : {}}
        onClick={handleClick}
        className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 relative transition-shadow"
        style={{ background: "linear-gradient(180deg,#3D63FF 0%,#2B50F6 100%)", boxShadow: "0 8px 22px -6px rgba(43,80,246,.55)" }}
      >
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
              className="fixed inset-0 z-[70] bg-[#0E1A3C]/60 backdrop-blur-sm"
              onClick={closeCart}
            />

            <motion.div
              key="cart-drawer"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[80] flex flex-col rounded-t-[28px] overflow-hidden"
              style={{
                background: "#fff",
                maxHeight: "88vh",
                boxShadow: "0 -20px 60px rgba(14,26,60,.25)",
              }}
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-12 h-1.5 rounded-full" style={{ background: "rgba(14,26,60,.15)" }} />
              </div>

              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display text-2xl tracking-tight" style={{ color: "#0E1A3C" }}>Cart</h2>
                  {totalItems > 0 && (
                    <span className="px-2 py-0.5 rounded-full font-mono text-xs font-bold text-white"
                      style={{ background: "#2B50F6" }}>
                      {totalItems}
                    </span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={closeCart}
                  aria-label="Close cart"
                  className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors hover:bg-[#EEF3FB]"
                  style={{ borderColor: "rgba(14,26,60,.12)" }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 relative overflow-hidden rounded-3xl"
                    style={{ background: "#F6F8FE" }}>
                    <div className="pattern-dots absolute inset-0 pointer-events-none opacity-70" />
                    <div className="w-16 h-16 rounded-full flex items-center justify-center relative bg-white"
                      style={{ boxShadow: "var(--shadow-soft-md)" }}>
                      <ShoppingCart size={26} color="#2B50F6" />
                    </div>
                    <p className="text-sm font-medium relative" style={{ color: "#5A6478" }}>Your cart is empty</p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { closeCart(); setGameSelectOpen(true); }}
                      className="relative px-6 py-2.5 rounded-full text-sm font-bold text-white"
                      style={{ background: "#2B50F6", boxShadow: "0 8px 20px -6px rgba(43,80,246,.5)" }}>
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
                          style={{ border: "1px solid rgba(14,26,60,.09)", background: "#fff" }}
                        >
                          <div
                            className="rounded-xl flex-shrink-0 overflow-hidden relative"
                            style={{ width: 52, height: 52, background: `linear-gradient(135deg,${item.gradient[0]},${item.gradient[1]})` }}
                          >
                            {item.image && (
                              <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-contain p-0.5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{item.name}</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-sm font-bold" style={{ color: "#2B50F6" }}>${item.price.toFixed(2)}</span>
                              {item.originalPrice && (
                                <span className="text-xs line-through" style={{ color: "#9AA3B8" }}>${item.originalPrice.toFixed(2)}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors"
                              style={{
                                borderColor: item.quantity === 1 ? "rgba(226,58,99,.4)" : "rgba(14,26,60,.15)",
                                color: item.quantity === 1 ? "#E23A63" : "#0E1A3C",
                                background: item.quantity === 1 ? "rgba(255,77,109,.06)" : "#fff",
                              }}>
                              {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                            </motion.button>
                            <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors hover:bg-[#EEF3FB]"
                              style={{ borderColor: "rgba(14,26,60,.15)" }}>
                              <Plus size={11} />
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
                  style={{ borderTop: "1px solid rgba(14,26,60,.08)", background: "#F9FBFF" }}>

                  <div className="flex items-end justify-between px-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "#5A6478" }}>Total</p>
                    <span className="font-display text-3xl tracking-tight" style={{ color: "#0E1A3C" }}>${totalPrice.toFixed(2)}</span>
                  </div>

                  <CheckoutBurstButton onClick={handleCheckout} />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <GameSelectModal open={gameSelectOpen} onClose={() => setGameSelectOpen(false)} zBase={210} />
    </>
  );
}
