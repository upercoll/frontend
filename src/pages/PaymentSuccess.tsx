import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Package, MessageSquare, ArrowLeft, Star, Bot, Zap, Shield, Truck, Gift } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  image?: string;
  gradient?: [string, string];
}

interface LastOrder {
  orderRef: string;
  email: string;
  game?: string;
  items: OrderItem[];
  total?: number;
  recipient?: string;
}

function loadOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem("rbstars_last_order");
    if (!raw) return null;
    return JSON.parse(raw) as LastOrder;
  } catch { return null; }
}

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<LastOrder | null>(() => loadOrder());
  const [claimOpened, setClaimOpened] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const isAutoOnlyGame = order?.game === "grow-a-garden-2";
  const [delivered, setDelivered] = useState<boolean>(() => {
    try {
      const o = loadOrder();
      if (!o?.orderRef) return false;
      return localStorage.getItem("rbstars_delivered_" + o.orderRef) === "1";
    } catch { return false; }
  });

  useEffect(() => {
    function onDelivered(e: Event) {
      const detail = (e as CustomEvent<{ orderRef?: string | null }>).detail;
      if (!detail?.orderRef || detail.orderRef === order?.orderRef) {
        setDelivered(true);
        setClaimOpened(false);
      }
    }
    window.addEventListener("rbstars:claim-delivered", onDelivered);
    return () => window.removeEventListener("rbstars:claim-delivered", onDelivered);
  }, [order?.orderRef]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");
    if (paymentIntentId) {
      if (redirectStatus === "succeeded") {
        setVerifying(true);
        fetch(`${BACKEND_URL}/api/payments/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              clearCart();
              const saved = loadOrder();
              if (saved) setOrder(saved);
            }
          })
          .catch(() => {})
          .finally(() => setVerifying(false));
      }
      window.history.replaceState({}, "", "/order-success");
    }
  }, []);

  function openClaimChat() {
    setClaimOpened(true);
    navigate("/claim-chat");
  }

  return (
    <main style={{ background: "#131C23", minHeight: "100vh" }}>

      {/* TOPBAR */}
      <div className="w-full relative overflow-hidden sm:h-[73px] h-[60px]" style={{ borderBottom: "1px solid #2C414E", background: "#0F1920" }}>
        <img src="/item-star.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-gem.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-crystals.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-controller.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-sword.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-heart.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <button onClick={() => navigate("/")} className="absolute flex items-center gap-2 sm:gap-3 select-none z-10" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ background: "#3BA7FF", boxShadow: "0 2px 10px rgba(59,167,255,0.4)" }}>
            <Star size={18} fill="white" color="white" />
          </div>
          <span className="font-extrabold tracking-tight text-white" style={{ fontSize: 22, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            RB<span style={{ color: "#3BA7FF" }}>stars</span>
          </span>
        </button>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(18)].map((_, i) => (
            <motion.div key={i}
              initial={{ y: -20, opacity: 0, x: `${5 + (i * 5.5)}%` }}
              animate={{ y: "100vh", opacity: [0, 1, 0], rotate: [0, 360] }}
              transition={{ duration: 3.5 + (i % 4), delay: i * 0.25, repeat: Infinity, repeatDelay: 2 }}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{ background: ["#3BA7FF", "#22C55E", "#F4F8FB", "#ec4899", "#f59e0b", "#8b5cf6"][i % 6] }}
            />
          ))}
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)" }} />
        </div>

        <div className="relative max-w-xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 3 + i * 0.8, opacity: 0 }}
                transition={{ duration: 1.6, delay: 0.3 + i * 0.2, repeat: Infinity, repeatDelay: 2.5 }}
                className="absolute w-16 h-16 rounded-full border-2"
                style={{ borderColor: i === 0 ? "#22C55E" : i === 1 ? "#3BA7FF" : "rgba(244,248,251,0.3)" }}
              />
            ))}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
              className="relative z-10 w-48 h-48 flex items-center justify-center"
            >
              {verifying ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-10 h-10 rounded-full border-4 border-white border-t-transparent" />
              ) : (
                <img src="/success-check.png" alt="" className="w-full h-full object-cover" style={{ filter: "drop-shadow(0 4px 20px rgba(34,197,94,0.4))" }} />
              )}
            </motion.div>
          </div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl font-extrabold mb-3" style={{ color: "#F4F8FB" }}>
            Thank You For<br />
            <span style={{ color: "#3BA7FF" }}>Your Order!</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="text-base mb-4" style={{ color: "#9BAEBB" }}>
            Your payment was successful and your order is being processed.
          </motion.p>

          {order?.orderRef && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
              <span className="text-xs" style={{ color: "#637784" }}>Order Ref</span>
              <span className="text-xs font-extrabold" style={{ color: "#3BA7FF" }}>{order.orderRef}</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* ITEMS SECTION */}
      {order?.items?.length ? (
        <section className="px-4 pb-12">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={16} color="#F4F8FB" />
              <h2 className="text-lg font-extrabold" style={{ color: "#F4F8FB" }}>Order Summary</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "#9BAEBB" }}>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
              <div className="px-5 py-4 space-y-3">
                {order.items.map((item, i) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.06 }}
                    className="flex items-center gap-3.5">
                    {item.image ? (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ background: "#0C141B", border: "2px solid #F4F8FB" }}>
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0"
                        style={{ background: item.gradient?.[0] || "#2C414E" }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#F4F8FB" }}>{item.name}</p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] mt-0.5" style={{ color: "#637784" }}>Qty: {item.quantity}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.price && (
                        <span className="text-sm font-extrabold" style={{ color: "#F4F8FB" }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      )}
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>PAID</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {order.total && (
                <div className="px-5 py-3.5 flex items-center justify-between"
                  style={{ borderTop: "1px solid #2C414E", background: "#18242D" }}>
                  <span className="text-xs font-bold" style={{ color: "#9BAEBB" }}>Total Paid</span>
                  <span className="text-base font-extrabold" style={{ color: "#22C55E" }}>${order.total.toFixed(2)}</span>
                </div>
              )}

              {order.email && (
                <div className="px-5 py-2.5 flex items-center gap-2" style={{ borderTop: "1px solid #2C414E" }}>
                  <span className="text-[11px]" style={{ color: "#637784" }}>Confirmation sent to</span>
                  <span className="text-[11px] font-bold" style={{ color: "#F4F8FB" }}>{order.email}</span>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* WHAT'S NEXT */}
      <section className="px-4 pb-12">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <Star size={16} fill="#F4F8FB" color="#F4F8FB" />
            <h2 className="text-lg font-extrabold" style={{ color: "#F4F8FB" }}>What's Next?</h2>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {delivered ? (
                <motion.div key="delivered"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl p-5 flex items-center gap-4"
                  style={{ background: "#1C2A34", border: "2px solid #22C55E", boxShadow: "0 0 30px rgba(34,197,94,0.12)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid #22C55E" }}>
                    <Check size={22} color="#22C55E" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold mb-0.5" style={{ color: "#F4F8FB" }}>Items Delivered</p>
                    <p className="text-xs" style={{ color: "#22C55E" }}>Your items have been delivered to your Roblox inventory!</p>
                  </div>
                </motion.div>
              ) : !isAutoOnlyGame ? (
                <motion.div key="claim"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl p-5"
                  style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(59,167,255,0.15)", border: "1px solid #3BA7FF" }}>
                      <Package size={20} color="#3BA7FF" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold mb-1" style={{ color: "#F4F8FB" }}>Ready to Receive Your Items?</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#9BAEBB" }}>
                        Open the Claim Chat to connect with our delivery team. Have your Roblox account ready.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {!delivered && (
              isAutoOnlyGame ? (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/auto-delivery")}
                  className="w-full py-5 rounded-2xl font-extrabold text-white flex items-center justify-center gap-3 text-base"
                  style={{ background: "#22C55E", boxShadow: "0 5px 0 0 #15803d" }}>
                  Auto Delivery
                </motion.button>
              ) : (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={openClaimChat}
                  className="w-full py-5 rounded-2xl font-extrabold text-white flex items-center justify-center gap-3 text-base"
                  style={{ background: "#3BA7FF", boxShadow: "0 5px 0 0 #2980b9" }}>
                  <MessageSquare size={20} />
                  {claimOpened ? "Chat Opened" : "Claim Chat With Agent"}
                  {claimOpened && <Check size={16} className="ml-1" />}
                </motion.button>
              )
            )}

            <div className="grid grid-cols-2 gap-3">
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/")}
                className="py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "#1C2A34", border: "1px solid #2C414E", color: "#9BAEBB", boxShadow: "0 3px 0 0 #0C141B" }}>
                <ArrowLeft size={14} /> Back to Store
              </motion.button>
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/browse")}
                className="py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "#3BA7FF", border: "1px solid #3BA7FF", color: "white", boxShadow: "0 3px 0 0 #2980b9" }}>
                Browse Games
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST + FOOTER */}
      <section className="px-4 pb-16">
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl p-5" style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { icon: <Star size={18} fill="#3BA7FF" color="#3BA7FF" />, label: "5-Star Rated", sub: "Trusted by 10K+ buyers" },
                { icon: <Truck size={18} color="#22C55E" />, label: "Instant Delivery", sub: "Items in minutes" },
                { icon: <Shield size={18} color="#3BA7FF" />, label: "100% Safe", sub: "Secure payments" },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(59,167,255,0.1)", border: "1px solid #2C414E" }}>
                    {b.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: "#F4F8FB" }}>{b.label}</p>
                    <p className="text-[10px]" style={{ color: "#637784" }}>{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-5">
            <img src="/payment-icons.png" alt="Visa, Mastercard, Amex, Discover, PayPal, Apple Pay, Google Pay"
              className="h-6 rounded-md object-contain opacity-40" />
          </div>
        </div>
      </section>
    </main>
  );
}
