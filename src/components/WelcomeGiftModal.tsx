import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Check } from "lucide-react";

const GIFT_EVENT = "rbstars:welcome-gift";
export const GIFT_CARD_KEY = "rbstars_gift_card";

export function claimGiftCard() {
  localStorage.setItem(GIFT_CARD_KEY, JSON.stringify({
    code: "WELCOME10",
    type: "percent",
    value: 10,
    label: "10% OFF — Welcome Gift",
    claimed: true,
    used: false,
  }));
}

export function getGiftCard() {
  try {
    const raw = localStorage.getItem(GIFT_CARD_KEY);
    if (!raw) return null;
    const card = JSON.parse(raw);
    if (card.used) return null;
    return card;
  } catch { return null; }
}

export function useGiftCard() {
  const [card, setCard] = useState(() => getGiftCard());
  return [card, setCard] as const;
}

export default function WelcomeGiftModal() {
  const [open, setOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setClaimed(false);
    };
    window.addEventListener(GIFT_EVENT, handler);
    return () => window.removeEventListener(GIFT_EVENT, handler);
  }, []);

  function dismiss() { setOpen(false); }

  function handleClaim() {
    claimGiftCard();
    setClaimed(true);
  }

  const alreadyClaimed = !!getGiftCard();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="gift-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(10,8,30,0.85)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && claimed) dismiss(); }}
        >
          <motion.div
            key="gift-card"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col sm:flex-row"
            style={{ background: "#131C23", border: "1.5px solid rgba(59,167,255,0.2)" }}
          >
            {/* Left hero panel — AutoDelivery style */}
            <div className="hidden sm:flex w-[320px] flex-shrink-0 relative flex-col items-center justify-center text-center p-8 overflow-hidden"
              style={{ background: "#0D1520" }}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.4 }} />
                <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
                <div className="absolute top-[45%] left-[10%] w-1 h-1 rounded-full" style={{ background: "#5CB8FF", opacity: 0.25 }} />
                <div className="absolute top-[60%] right-[12%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.35 }} />
                <div className="absolute top-[80%] left-[25%] w-1.5 h-1.5 rounded-full" style={{ background: "#5CB8FF", opacity: 0.2 }} />
                <div className="absolute top-[15%] left-[50%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
                <div className="absolute top-[70%] right-[35%] w-1 h-1 rounded-full" style={{ background: "#5CB8FF", opacity: 0.25 }} />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(59,167,255,0.15), transparent 70%)" }} />
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }} className="relative z-10 mb-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 8px 24px rgba(59,167,255,0.3)" }}>
                  <Star size={36} fill="white" color="white" />
                </div>
              </motion.div>
              <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }} className="relative z-10">
                <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: "#F4F8FB" }}>
                  RB<span style={{ color: "#3BA7FF" }}>stars</span>
                </h1>
                <p className="text-sm leading-relaxed max-w-[220px] mx-auto" style={{ color: "#637784" }}>
                  A welcome gift just for you — enjoy 10% off your first purchase!
                </p>
              </motion.div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3BA7FF" }} />
            </div>

            {/* Right content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 text-center">
              {!claimed ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#3BA7FF" }}>
                    Welcome to the team
                  </p>
                  <h2 className="text-2xl font-extrabold mb-4" style={{ color: "#F4F8FB" }}>
                    You received a gift!
                  </h2>
                  <img src="/IMG_0750.png" alt="10% OFF" className="w-52 h-auto object-contain mx-auto mb-5" />
                  <p className="text-sm mb-6 max-w-[320px]" style={{ color: "#637784" }}>
                    As a thank you for joining RBstars, here&apos;s <span className="font-bold" style={{ color: "#22C55E" }}>10% OFF</span> your next purchase.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }}
                    onClick={handleClaim}
                    className="w-full max-w-xs py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                    style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9" }}>
                    Claim Gift
                  </motion.button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                    style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22C55E" }}>
                    <Check size={28} color="#22C55E" />
                  </div>
                  <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#F4F8FB" }}>
                    Gift Claimed!
                  </h2>
                  <p className="text-sm mb-3" style={{ color: "#637784" }}>
                    Your <span className="font-bold" style={{ color: "#22C55E" }}>10% OFF</span> gift card is ready.
                  </p>
                  <p className="text-xs mb-6 max-w-[300px]" style={{ color: "#637784" }}>
                    It will appear in checkout — select it to apply the discount.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }}
                    onClick={dismiss}
                    className="w-full max-w-xs py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                    style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9" }}>
                    Continue
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
