import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "wouter";

export default function CartDrawer() {
  const { items, removeItem, updateQty, totalItems, totalPrice, isOpen, closeCart } = useCart();
  const [, navigate] = useLocation();
  const [checking, setChecking] = useState(false);

  function handleCheckout() {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      closeCart();
      navigate("/checkout");
    }, 400);
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="cart-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70]"
              style={{ background: "rgba(0,0,0,0.6)" }}
              onClick={closeCart}
            />

            {/* Side panel */}
            <motion.div
              key="cart-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[80] flex flex-col w-full max-w-[420px] overflow-hidden"
              style={{ background: "#131C23", borderLeft: "1px solid #2C414E" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid #2C414E" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#1C2A34" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="#3BA7FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="20" r="1.5" fill="#3BA7FF"/>
                      <circle cx="17" cy="20" r="1.5" fill="#3BA7FF"/>
                      <circle cx="10" cy="8.5" r="1" fill="#3BA7FF"/>
                      <circle cx="14.5" cy="8.5" r="1" fill="#3BA7FF"/>
                      <path d="M10 11c.8.8 3.2.8 4 0" stroke="#3BA7FF" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#F4F8FB" }}>Cart</h2>
                    {totalItems > 0 && (
                      <p className="text-xs" style={{ color: "#637784" }}>{totalItems} {totalItems === 1 ? "item" : "items"}</p>
                    )}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeCart}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#1C2A34", border: "1px solid #2C414E" }}
                >
                  <X size={16} color="#9BAEBB" />
                </motion.button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <img src="/empty-cart.png" alt="" className="w-64 h-64 object-contain" />
                    <div className="text-center space-y-1.5">
                      <p className="text-sm font-semibold" style={{ color: "#F4F8FB" }}>Your cart is empty</p>
                      <p className="text-xs" style={{ color: "#637784" }}>Browse games and add items to get started.</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { closeCart(); navigate("/browse"); }}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: "#3BA7FF", boxShadow: "0 3px 0 0 #2980b9, 0 4px 12px rgba(0,0,0,0.3)" }}
                    >
                      Browse Games
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <AnimatePresence initial={false}>
                      {items.map(item => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="relative py-4" style={{ borderBottom: "1px solid #1C2A34" }}>
                            {/* Delete cross */}
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => removeItem(item.id)}
                              className="absolute top-3 right-0 w-6 h-6 flex items-center justify-center z-10"
                              style={{ color: "#637784" }}
                            >
                              <X size={15} strokeWidth={2.5} />
                            </motion.button>

                            <div className="flex gap-4">
                              {/* Image container */}
                              {item.image && (
                                <div className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                                  style={{ background: "#1C2A34", border: "2px solid #F4F8FB" }}>
                                  <img src={item.image} alt={item.name} className="w-16 h-16 object-contain" />
                                </div>
                              )}

                              {/* Right side info */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                  <p className="text-sm font-bold truncate pr-5" style={{ color: "#F4F8FB" }}>{item.name}</p>
                                  <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-sm font-extrabold" style={{ color: "#22C55E" }}>${item.price.toFixed(2)}</span>
                                    {item.originalPrice && (
                                      <span className="text-xs line-through" style={{ color: "#637784" }}>${item.originalPrice.toFixed(2)}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Bottom row: qty selector + total */}
                                <div className="flex items-center justify-between mt-2.5">
                                  <div className="flex items-center rounded-lg overflow-hidden"
                                  style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
                                    <motion.button whileTap={{ scale: 0.85 }}
                                      onClick={() => updateQty(item.id, item.quantity - 1)}
                                      className="w-8 h-7 flex items-center justify-center" style={{ color: "#637784" }}>
                                      <Minus size={12} strokeWidth={2.5} />
                                    </motion.button>
                                    <span className="text-xs font-extrabold w-5 text-center" style={{ color: "#9BAEBB" }}>{item.quantity}</span>
                                    <motion.button whileTap={{ scale: 0.85 }}
                                      onClick={() => updateQty(item.id, item.quantity + 1)}
                                      className="w-8 h-7 flex items-center justify-center rounded-r-lg ml-1.5"
                                      style={{ background: "#3BA7FF", color: "white", boxShadow: "0 3px 0 0 #2980b9" }}>
                                      <Plus size={12} strokeWidth={2.5} />
                                    </motion.button>
                                  </div>
                                  <span className="text-sm font-extrabold" style={{ color: "#F4F8FB" }}>
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="flex-shrink-0 px-5 pb-6 pt-4 space-y-3" style={{ borderTop: "1px solid #2C414E" }}>
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "#9BAEBB" }}>Total</span>
                    <span className="text-xl font-extrabold" style={{ color: "#F4F8FB" }}>${totalPrice.toFixed(2)}</span>
                  </div>

                  {/* Checkout */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCheckout}
                    disabled={checking}
                    className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 text-sm"
                    style={{
                      background: checking ? "#22333F" : "#3BA7FF",
                      boxShadow: checking ? "none" : "0 4px 0 0 #2980b9, 0 6px 16px rgba(0,0,0,0.35)",
                      opacity: checking ? 0.7 : 1,
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="20" r="1.5" fill="white"/>
                      <circle cx="17" cy="20" r="1.5" fill="white"/>
                      <circle cx="10" cy="8.5" r="1" fill="white"/>
                      <circle cx="14.5" cy="8.5" r="1" fill="white"/>
                      <path d="M10 11c.8.8 3.2.8 4 0" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    {checking ? "Processing…" : "Checkout"}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
