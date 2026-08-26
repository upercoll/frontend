import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Package, MessageSquare, ArrowLeft, Star, Bot, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";

const NAVY = "#0E1A3C";
const ROYAL = "#2B50F6";
const GOLD = "#FFC53D";

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
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 py-12" style={{ background: "#F6F8FE" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-[28px] p-7 sm:p-9 overflow-hidden"
        style={{ background: "#fff", border: "1px solid rgba(14,26,60,.08)", boxShadow: "var(--shadow-soft-lg)" }}
      >
        <div className="pattern-dots absolute inset-0 pointer-events-none opacity-50" />
        <motion.div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(43,80,246,.1), transparent 70%)" }}
        />

        <div className="relative">
          {/* Status badge */}
          <div className="flex items-center justify-center mb-8">
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2.5 + i * 0.6, opacity: 0 }}
                transition={{ duration: 1.4, delay: 0.2 + i * 0.18, repeat: Infinity, repeatDelay: 1.5 }}
                className="absolute w-20 h-20 rounded-full border-2"
                style={{ borderColor: i === 0 ? ROYAL : i === 1 ? GOLD : "#7FA5FF" }}
              />
            ))}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: verifying ? GOLD : "#0E9F6E",
                boxShadow: verifying ? "0 16px 36px -8px rgba(255,197,61,.5)" : "0 16px 36px -8px rgba(14,159,110,.5)",
              }}
            >
              {verifying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-9 h-9 rounded-full border-4"
                  style={{ borderColor: NAVY, borderTopColor: "transparent" }}
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
            <h1 className="font-display text-3xl tracking-tight mb-2 leading-tight" style={{ color: NAVY }}>
              {verifying ? <>Confirming payment…</> : <>Order <span className="font-serif-italic" style={{ color: ROYAL }}>confirmed!</span></>}
            </h1>
            {order?.email && (
              <p className="text-sm font-medium" style={{ color: MUTED }}>
                Confirmation sent to <span style={{ color: NAVY }}>{order.email}</span>
              </p>
            )}
            {order?.orderRef && (
              <p className="inline-block font-mono text-[11px] mt-3 px-3 py-1 rounded-full bg-white" style={{ color: MUTED, border: "1px solid rgba(14,26,60,.1)" }}>
                REF · <span style={{ color: ROYAL }}>{order.orderRef}</span>
              </p>
            )}
          </motion.div>

          {/* Items */}
          {order?.items?.length ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-2xl overflow-hidden mb-5"
              style={{ background: "#F6F8FE", border: "1px solid rgba(14,26,60,.08)" }}
            >
              <div className="px-4 py-2.5 flex items-center gap-1.5" style={{ borderBottom: "1px solid rgba(14,26,60,.07)" }}>
                <Package size={13} color={ROYAL} />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: MUTED }}>Your Items</p>
              </div>
              <div className="px-4 py-3 space-y-2.5 max-h-44 overflow-y-auto">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex-shrink-0 relative overflow-hidden"
                      style={{
                        background: item.gradient
                          ? `linear-gradient(135deg,${item.gradient[0]},${item.gradient[1]})`
                          : `linear-gradient(135deg,${ROYAL},${NAVY})`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: NAVY }}>{item.name}</p>
                      {item.quantity > 1 && (
                        <p className="font-mono text-[10px]" style={{ color: "#9AA3B8" }}>Qty: {item.quantity}</p>
                      )}
                    </div>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 text-white"
                      style={{ background: "#0E9F6E" }}>
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
              className="rounded-2xl p-4 mb-5 flex items-center gap-3"
              style={{ background: "#E7F8F1", border: "1px solid rgba(14,159,110,.35)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white">
                <Check size={18} color="#0E9F6E" strokeWidth={3} />
              </div>
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: NAVY }}>Items Delivered ✓</p>
                <p className="text-[11px]" style={{ color: "#0E9F6E" }}>
                  Your items have been delivered. Check your Roblox inventory!
                </p>
              </div>
            </motion.div>
          ) : !isAutoOnlyGame ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="rounded-2xl p-4 mb-5 relative overflow-hidden"
              style={{ background: "rgba(43,80,246,.06)", border: "1px solid rgba(43,80,246,.3)" }}
            >
              <div className="relative flex items-start gap-3">
                <motion.div
                  animate={{ rotate: [-6, 4, -6] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#fff", boxShadow: "var(--shadow-soft-sm)" }}
                >
                  <Package size={18} color={ROYAL} />
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-bold mb-0.5" style={{ color: NAVY }}>Ready to Receive Your Items?</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
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
              whileHover={{ scale: 1.02, y: -1, boxShadow: "0 16px 36px -8px rgba(14,159,110,.55)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auto-delivery")}
              className="w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2.5 text-base"
              style={{ background: "#0E9F6E", boxShadow: "0 10px 26px -8px rgba(14,159,110,.5)" }}
            >
              <Bot size={18} />
              Auto Delivery (Bot)
              <Zap size={14} />
            </motion.button>
            )}
            {!isAutoOnlyGame && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1, boxShadow: "0 16px 36px -8px rgba(43,80,246,.6)" }}
              whileTap={{ scale: 0.97 }}
              onClick={openClaimChat}
              className="w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2.5 text-base"
              style={{ background: "linear-gradient(180deg,#3D63FF 0%,#2B50F6 100%)", boxShadow: "0 10px 26px -8px rgba(43,80,246,.55)" }}
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
                className="py-3 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 bg-white hover:bg-[#EEF3FB] transition-colors"
                style={{ color: NAVY, border: "1px solid rgba(14,26,60,.14)" }}
              >
                <ArrowLeft size={14} />Back to Store
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/game/murder-mystery-2")}
                className="py-3 rounded-full font-bold text-sm bg-white hover:bg-[#EEF3FB] transition-colors"
                style={{ color: NAVY, border: "1px solid rgba(14,26,60,.14)" }}
              >
                Browse More
              </motion.button>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-5 mt-7 pt-5"
            style={{ borderTop: "1px dashed rgba(14,26,60,.15)" }}
          >
            {[
              { icon: <Star size={11} fill={GOLD} color={GOLD} />, label: "5★ Rated" },
              { icon: <Package size={11} color={ROYAL} />, label: "Instant Delivery" },
              { icon: <Check size={11} color="#0E9F6E" strokeWidth={3} />, label: "100% Guaranteed" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {b.icon}
                <span className="text-[10px] font-semibold" style={{ color: MUTED }}>{b.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
