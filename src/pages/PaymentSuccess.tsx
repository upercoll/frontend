import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Package, MessageSquare, ArrowLeft, Star, Bot, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  gradient?: [string, string];
}

interface LastOrder {
  orderRef: string;
  email: string;
  game?: string | null;
  items: OrderItem[];
}

function loadOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem("rbstars_last_order");
    if (!raw) return null;
    return JSON.parse(raw) as LastOrder;
  } catch {
    return null;
  }
}

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<LastOrder | null>(() => loadOrder());
  const [claimOpened, setClaimOpened] = useState(false);
  const [verifying, setVerifying] = useState(false);
  // Grow A Garden 2 is fully automated — no manual claim chat for it.
  const isAutoOnlyGame = order?.game === "grow-a-garden-2";
  // Hide the claim button once items are confirmed delivered
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
      // Hide if the event is for this order (or a broadcast with no ref)
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
            } else {
              console.error("[PaymentSuccess] confirmPayment failed:", data);
            }
          })
          .catch(err => {
            console.error("[PaymentSuccess] confirmPayment network error:", err);
          })
          .finally(() => setVerifying(false));
      }
      window.history.replaceState({}, "", "/order-success");
    }
  }, []);

  function openClaimChat() {
    setClaimOpened(true);
    window.dispatchEvent(new CustomEvent("rbstars:open-claim"));
  }

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 py-12" style={{ background: "#F2EEE5" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 overflow-hidden"
        style={{ background: "#FFFFFF", border: "3px solid #131313", boxShadow: "9px 10px 0 #131313" }}
      >
        <div className="pattern-dots absolute inset-0 pointer-events-none opacity-50" />
        <span className="tilt-sq absolute top-5 right-5 opacity-30" />

        <div className="relative">
          {/* Status badge */}
          <div className="flex items-center justify-center mb-7">
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2.5 + i * 0.6, opacity: 0 }}
                transition={{ duration: 1.4, delay: 0.2 + i * 0.18, repeat: Infinity, repeatDelay: 1.5 }}
                className="absolute w-20 h-20 rounded-full border-2"
                style={{ borderColor: i === 0 ? "#E2231A" : i === 1 ? "#FFC800" : "#0A84FF" }}
              />
            ))}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center border-[3px]"
              style={{
                background: verifying ? "#FFC800" : "#00B06F",
                borderColor: "#131313",
                boxShadow: "5px 5px 0 rgba(19,19,19,.85)",
                transform: verifying ? "rotate(-4deg)" : "none",
              }}
            >
              {verifying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-9 h-9 rounded-full border-4 border-[#131313] border-t-transparent"
                />
              ) : (
                <Check size={38} color="#fff" strokeWidth={3} />
              )}
            </motion.div>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <h1 className="font-display text-3xl uppercase leading-none mb-2">
              {verifying ? "Confirming Payment…" : <>Order <span className="text-outline">Confirmed!</span></>}
            </h1>
            {order?.email && (
              <p className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "#6B655C" }}>
                Confirmation sent to <span style={{ color: "#131313" }}>{order.email}</span>
              </p>
            )}
            {order?.orderRef && (
              <p className="font-mono text-[11px] mt-1.5 inline-block px-2 py-0.5 rounded bg-[#F2EEE5]" style={{ color: "#8a8375" }}>
                REF: <span style={{ color: "#131313" }}>{order.orderRef}</span>
              </p>
            )}
          </motion.div>

          {/* Items */}
          {order?.items?.length ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-2xl overflow-hidden mb-4"
              style={{ background: "#F7F4EC", border: "2px solid #131313" }}
            >
              <div className="px-4 py-2.5 flex items-center gap-1.5" style={{ borderBottom: "2px solid #131313" }}>
                <Package size={13} />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">Your Items</p>
              </div>
              <div className="px-4 py-3 space-y-2 max-h-44 overflow-y-auto">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex-shrink-0 relative overflow-hidden"
                      style={{
                        background: item.gradient ? item.gradient[0] : "#E2231A",
                        border: "2px solid #131313",
                      }}
                    >
                      <div className="absolute inset-0 pattern-dots-light opacity-60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      {item.quantity > 1 && (
                        <p className="font-mono text-[10px]" style={{ color: "#8a8375" }}>Qty: {item.quantity}</p>
                      )}
                    </div>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 -rotate-2 text-white"
                      style={{ background: "#00B06F", border: "1.5px solid #131313" }}>
                      PAID
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {/* Delivered / claim prompt */}
          {delivered ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="rounded-2xl p-4 mb-4 flex items-center gap-3"
              style={{ background: "#E9F8EF", border: "2px solid #00B06F" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 rotate-[-4deg] bg-white"
                style={{ borderColor: "#00B06F" }}>
                <Check size={18} color="#00875A" strokeWidth={3} />
              </div>
              <div>
                <p className="text-sm font-bold mb-0.5">Items Delivered ✓</p>
                <p className="text-[11px]" style={{ color: "#00875A" }}>
                  Your items have been delivered. Check your Roblox inventory!
                </p>
              </div>
            </motion.div>
          ) : !isAutoOnlyGame ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="rounded-2xl p-4 mb-4 relative overflow-hidden"
              style={{ background: "#FDEEEC", border: "2px solid #E2231A" }}
            >
              <div className="relative flex items-start gap-3">
                <motion.div
                  animate={{ rotate: [-6, 4, -6] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 bg-white"
                  style={{ borderColor: "#E2231A" }}
                >
                  <Package size={18} color="#E2231A" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-bold mb-0.5">Ready to Receive Your Items?</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#B45309" }}>
                    Open the Claim Chat below to connect with our delivery team. Have your Roblox account ready!
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="space-y-3"
          >
            {!delivered && (
            <>
            {isAutoOnlyGame && (
            <motion.button
              whileHover={{ translateX: -2, translateY: -2, boxShadow: "7px 7px 0 #131313" }}
              whileTap={{ translateX: 2, translateY: 2, boxShadow: "2px 2px 0 #131313" }}
              onClick={() => navigate("/auto-delivery")}
              className="w-full py-4 rounded-full font-mono font-semibold uppercase tracking-[0.12em] text-white flex items-center justify-center gap-2.5 text-base border-[3px]"
              style={{ background: "#00B06F", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}
            >
              <Bot size={18} />
              Auto Delivery (Bot)
              <Zap size={14} />
            </motion.button>
            )}
            {!isAutoOnlyGame && (
            <motion.button
              whileHover={{ translateX: -2, translateY: -2, boxShadow: "7px 7px 0 #131313" }}
              whileTap={{ translateX: 2, translateY: 2, boxShadow: "2px 2px 0 #131313" }}
              onClick={openClaimChat}
              className="w-full py-4 rounded-full font-mono font-semibold uppercase tracking-[0.12em] text-white flex items-center justify-center gap-2.5 text-base border-[3px]"
              style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}
            >
              <MessageSquare size={18} />
              {claimOpened ? "Chat Opened ↘" : "Claim Chat With Agent"}
              {claimOpened && <Check size={16} className="ml-1" />}
            </motion.button>
            )}
            </>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <motion.button
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/")}
                className="py-3 rounded-full font-mono text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-white border-2 hover:bg-[#131313] hover:text-white transition-colors"
                style={{ borderColor: "#131313" }}
              >
                <ArrowLeft size={14} />Back to Store
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/game/murder-mystery-2")}
                className="py-3 rounded-full font-mono text-xs font-semibold uppercase tracking-wider bg-white border-2 hover:bg-[#131313] hover:text-white transition-colors"
                style={{ borderColor: "#131313" }}
              >
                Browse More
              </motion.button>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-4 mt-6 pt-5"
            style={{ borderTop: "2px dashed rgba(19,19,19,.25)" }}
          >
            {[
              { icon: <Star size={11} fill="#FFC800" stroke="#131313" strokeWidth={1.5} />, label: "5★ Rated" },
              { icon: <Package size={11} />, label: "Instant Delivery" },
              { icon: <Check size={11} style={{ color: "#00875A" }} strokeWidth={3} />, label: "100% Guaranteed" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {b.icon}
                <span className="font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ color: "#6B655C" }}>{b.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
