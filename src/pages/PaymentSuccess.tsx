import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Package, MessageSquare, ArrowLeft, Star, Bot, Zap, Shield, Truck, Gift } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { usePublicStats, formatCount } from "@/hooks/usePublicStats";
import { P } from "@/lib/storefront";
import { RBstar, MailboxGlyph } from "@/components/Art";
import { TopNav, SiteFooter } from "./Home";

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
  const stats = usePublicStats();
  const [order, setOrder] = useState<LastOrder | null>(() => loadOrder());
  const [claimOpened, setClaimOpened] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
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
      if (redirectStatus === "failed") {
        // The redirect came back with a failed payment — the page used to
        // still render the congratulatory "order placed" UI.
        setPaymentFailed(true);
      } else if (redirectStatus === "succeeded") {
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
    <main className="rglow" style={{ minHeight: "100vh" }}>
      <TopNav onHome={() => navigate("/")} />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div className="relative max-w-xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
              className="relative z-10 w-32 h-32 rounded-3xl flex items-center justify-center"
              style={paymentFailed
                ? { background: P.badTint, border: "1px solid rgba(255,90,77,0.45)" }
                : verifying
                  ? { background: P.accentTint, border: `1px solid ${P.border}` }
                  : { background: P.goodTint, border: "1px solid rgba(95,224,142,0.35)" }}
            >
              {verifying ? (
                <div className="flex flex-col items-center gap-2">
                  {/* Brand mark instead of a generic ring — "confirming the payment" */}
                  <motion.div animate={{ scale: [1, 1.16, 1] }}
                    transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}>
                    <RBstar size={34} color={P.accent} />
                  </motion.div>
                  <span className="text-[10px] font-black whitespace-nowrap" style={{ color: P.muted }}>Confirming payment…</span>
                </div>
              ) : paymentFailed ? (
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: P.card, border: "1px solid rgba(255,90,77,0.45)" }}>
                  <span style={{ fontSize: 34, lineHeight: 1, color: P.bad }}>✕</span>
                </div>
              ) : (
                /* Your item is on its way — the mailbox with the flag up. */
                <MailboxGlyph size={40} />
              )}
            </motion.div>
          </div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl font-black mb-3" style={{ color: P.text }}>
            Thank You For<br />
            <span style={{ color: paymentFailed ? P.bad : P.good }}>Your Order!</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="text-base mb-4" style={{ color: P.muted }}>
            {paymentFailed
              ? "Your payment could not be completed. No charge was made — please try again."
              : "Your payment was successful and your order is being processed."}
          </motion.p>

          {order?.orderRef && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: P.band, border: `1px solid ${P.border}` }}>
              <span className="text-xs" style={{ color: P.faint }}>Order Ref</span>
              <span className="text-xs font-extrabold" style={{ color: P.muted }}>{order.orderRef}</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* ITEMS SECTION */}
      {order?.items?.length ? (
        <section className="px-4 pb-12">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={16} color={P.accentDeep} />
              <h2 className="text-lg font-black" style={{ color: P.text }}>Order Summary</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: P.band, color: P.muted }}>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}>
              <div className="px-5 py-4 space-y-3">
                {order.items.map((item, i) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.06 }}
                    className="flex items-center gap-3.5">
                    {item.image ? (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ background: P.stage, border: `1px solid ${P.border}` }}>
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0"
                        style={{ background: item.gradient?.[0] || P.border }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: P.text }}>{item.name}</p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] mt-0.5" style={{ color: P.faint }}>Qty: {item.quantity}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.price && (
                        <span className="text-sm font-extrabold" style={{ color: P.text }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      )}
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: P.goodTint, color: P.good }}>PAID</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {order.total && (
                <div className="px-5 py-3.5 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${P.border}`, background: P.band }}>
                  <span className="text-xs font-bold" style={{ color: P.muted }}>Total Paid</span>
                  <span className="text-base font-extrabold" style={{ color: P.text }}>${order.total.toFixed(2)}</span>
                </div>
              )}

              {order.email && (
                <div className="px-5 py-2.5 flex items-center gap-2" style={{ borderTop: `1px solid ${P.border}` }}>
                  <span className="text-[11px]" style={{ color: P.faint }}>Confirmation sent to</span>
                  <span className="text-[11px] font-bold" style={{ color: P.muted }}>{order.email}</span>
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
            <Star size={16} fill={P.star} color={P.star} />
            <h2 className="text-lg font-black" style={{ color: P.text }}>What's Next?</h2>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {delivered ? (
                <motion.div key="delivered"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl p-5 flex items-center gap-4"
                  style={{ background: P.card, border: `2px solid ${P.good}`, boxShadow: P.shadow }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: P.goodTint, border: "1px solid rgba(95,224,142,0.4)" }}>
                    <Check size={22} strokeWidth={3} color={P.good} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold mb-0.5" style={{ color: P.text }}>Items Delivered</p>
                    <p className="text-xs" style={{ color: P.good }}>Your items have been delivered to your Roblox inventory!</p>
                  </div>
                </motion.div>
              ) : !isAutoOnlyGame ? (
                <motion.div key="claim"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl p-5"
                  style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: P.accentTint, border: "1px solid rgba(47,140,255,0.3)" }}>
                      <Package size={20} color={P.accentDeep} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold mb-1" style={{ color: P.text }}>Ready to Receive Your Items?</p>
                      <p className="text-xs leading-relaxed" style={{ color: P.muted }}>
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
                  className="w-full py-5 rounded-2xl font-black text-white flex items-center justify-center gap-3 text-base"
                  style={{ background: P.accentDeep, boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}>
                  Auto Delivery
                </motion.button>
              ) : (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={openClaimChat}
                  className="w-full py-5 rounded-2xl font-black text-white flex items-center justify-center gap-3 text-base"
                  style={{ background: P.accentDeep, boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}>
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
                style={{ background: P.card, border: `1px solid ${P.borderStrong}`, color: P.muted, boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }}>
                <ArrowLeft size={14} /> Back to Store
              </motion.button>
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/browse")}
                className="py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: P.accentDeep, border: `1px solid ${P.accentDeep}`, color: "#fff", boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}>
                Browse Games
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST + FOOTER */}
      <section className="px-4 pb-16">
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl p-5" style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                {
                  icon: <Star size={18} fill={P.star} color={P.star} />,
                  // Real rating from real reviews — never claim a score we don't have.
                  label: stats && stats.rating > 0 ? `${stats.rating}★ Rated` : "Top Rated",
                  sub: stats && stats.reviews > 0
                    ? `${formatCount(stats.reviews)} reviews`
                    : "Verified reviews",
                },
                { icon: <Truck size={18} color={P.good} />, label: "In-Game Delivery", sub: "To your mailbox" },
                { icon: <Shield size={18} color={P.accentDeep} />, label: "100% Safe", sub: "Secure payments" },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: P.accentTint, border: `1px solid ${P.border}` }}>
                    {b.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: P.text }}>{b.label}</p>
                    <p className="text-[10px]" style={{ color: P.faint }}>{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-5">
            <img src="/payment-icons.png" alt="Visa, Mastercard, Amex, Discover, PayPal, Apple Pay, Google Pay"
              className="h-6 rounded-md object-contain" />
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
