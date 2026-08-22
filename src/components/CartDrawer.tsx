import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "wouter";
import GameSelectModal from "@/components/GameSelectModal";

const BURST_COLORS = ["#E2231A", "#FFC800", "#0A84FF", "#00B06F", "#131313"];

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
                initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  rotate: 160,
                  x: Math.cos((angle * Math.PI) / 180) * 64,
                  y: Math.sin((angle * Math.PI) / 180) * 64,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.02 }}
                className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-[2px] pointer-events-none"
                style={{
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
        whileHover={!burst ? { translateX: -2, translateY: -2, boxShadow: "7px 7px 0 #131313" } : {}}
        whileTap={!burst ? { translateX: 2, translateY: 2, boxShadow: "2px 2px 0 #131313" } : {}}
        onClick={handleClick}
        className="w-full py-4 rounded-2xl font-mono font-semibold uppercase tracking-[0.16em] text-white text-base flex items-center justify-center gap-2 relative overflow-hidden border-[3px] border-[#131313]"
        style={{ background: "#E2231A", boxShadow: "5px 5px 0 #131313", transition: "box-shadow .18s ease" }}
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
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
              onClick={closeCart}
            />

            <motion.div
              key="cart-drawer"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[80] flex flex-col rounded-t-3xl overflow-hidden"
              style={{
                background: "#F7F4EC",
                maxHeight: "88vh",
                borderTop: "3px solid #131313",
              }}
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-12 h-1.5 rounded-full" style={{ background: "rgba(19,19,19,.25)" }} />
              </div>

              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl uppercase tracking-wide">Cart</h2>
                  {totalItems > 0 && (
                    <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold text-white rotate-6 inline-block"
                      style={{ background: "#E2231A", border: "2px solid #131313" }}>
                      {totalItems}
                    </span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={closeCart}
                  className="w-9 h-9 rounded-full flex items-center justify-center border-2 hover:bg-[#E2231A] hover:text-white transition-colors"
                  style={{ borderColor: "#131313", background: "#fff" }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-4 relative overflow-hidden rounded-2xl border-2 border-dashed"
                    style={{ borderColor: "rgba(19,19,19,.3)" }}>
                    <div className="pattern-dots absolute inset-0 pointer-events-none" />
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative border-2 rotate-[-6deg]"
                      style={{ background: "#fff", borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}>
                      <ShoppingCart size={26} />
                    </div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] relative" style={{ color: "#6B655C" }}>
                      Your cart is empty
                    </p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { closeCart(); setGameSelectOpen(true); }}
                      className="relative px-6 py-2.5 rounded-full font-mono text-sm font-semibold uppercase tracking-[0.14em] text-white border-2"
                      style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "3px 3px 0 #131313" }}>
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
                          className="flex items-center gap-3 p-3 rounded-2xl bg-white"
                          style={{ border: "2px solid #131313" }}
                        >
                          <div
                            className="rounded-xl flex-shrink-0 overflow-hidden relative border-2"
                            style={{ width: 52, height: 52, background: item.gradient?.[0] || "#E2231A", borderColor: "#131313" }}
                          >
                            <div className="absolute inset-0 pattern-dots-light opacity-60" />
                            {item.image && (
                              <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-contain p-0.5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{item.name}</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-sm font-bold">${item.price.toFixed(2)}</span>
                              {item.originalPrice && (
                                <span className="text-xs line-through" style={{ color: "#8a8375" }}>${item.originalPrice.toFixed(2)}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                              style={{
                                background: item.quantity === 1 ? "#FBE9E7" : "#fff",
                                borderColor: item.quantity === 1 ? "#E2231A" : "#131313",
                                color: item.quantity === 1 ? "#E2231A" : "#131313",
                              }}>
                              {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                            </motion.button>
                            <span className="font-mono text-sm font-bold w-5 text-center">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 hover:bg-[#131313] hover:text-white transition-colors"
                              style={{ background: "#fff", borderColor: "#131313" }}>
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
                  style={{ borderTop: "2.5px solid #131313" }}>

                  <div className="flex items-end justify-between px-1">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "#6B655C" }}>Total</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#8a8375" }}>Free delivery included</p>
                    </div>
                    <span className="font-display text-3xl leading-none">${totalPrice.toFixed(2)}</span>
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
