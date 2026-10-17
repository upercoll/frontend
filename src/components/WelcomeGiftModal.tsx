import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Check } from "lucide-react";
import { P } from "@/lib/storefront";
import { RBstar } from "@/components/Art";

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
          /* The overlay scrolls rather than the page: on a landscape phone the
             stacked card is taller than the viewport, and a `fixed` overlay
             can't scroll its own content unless it opts in. `my-auto` keeps
             the card centred when it fits and pinned to the top (reachable)
             when it doesn't. */
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget && claimed) dismiss(); }}
        >
          <motion.div
            key="gift-card"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative my-auto w-full max-w-2xl max-h-[92dvh] rounded-2xl overflow-hidden flex flex-col sm:flex-row"
            style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}
          >
            {/* Left hero panel — AutoDelivery style */}
            <div className="hidden sm:flex w-[320px] flex-shrink-0 relative flex-col items-center justify-center text-center p-8 overflow-hidden"
              style={{ background: P.band }}>
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }} className="relative z-10 mb-2">
                <img src="/rb-logo.png" alt="RBstars" className="block mx-auto w-24 h-24 object-contain" />
              </motion.div>
              <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }} className="relative z-10">
                <p className="text-sm leading-relaxed max-w-[220px] mx-auto" style={{ color: P.muted }}>
                  A welcome gift just for you — enjoy 10% off your first purchase!
                </p>
              </motion.div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: P.accent }} />
            </div>

            {/* Right content — scrolls inside the card so the Claim button
                stays reachable on short/landscape viewports */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 text-center overflow-y-auto">
              {!claimed ? (
                <>
                  <div className="mb-3 flex items-center justify-center">
                    <RBstar size={52} color={P.star} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: P.accentDeep }}>
                    Welcome to the team
                  </p>
                  <h2 className="text-2xl font-extrabold mb-4" style={{ color: P.text }}>
                    You received a gift!
                  </h2>
                  <img src="/IMG_0750.png" alt="10% OFF" className="w-52 h-auto object-contain mx-auto mb-5" />
                  <p className="text-sm mb-6 max-w-[320px]" style={{ color: P.muted }}>
                    As a thank you for joining RBstars, here&apos;s <span className="font-bold" style={{ color: P.good }}>10% OFF</span> your next purchase.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }}
                    onClick={handleClaim}
                    className="w-full max-w-xs py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(180deg,#0a84ff,#0a50d6)", color: "#fff", boxShadow: "0 8px 22px rgba(10,110,255,.4)" }}>
                    Claim Gift
                  </motion.button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                    style={{ background: P.goodTint, border: `2px solid ${P.good}` }}>
                    <Check size={28} color={P.good} />
                  </div>
                  <h2 className="text-2xl font-extrabold mb-2" style={{ color: P.text }}>
                    Gift Claimed!
                  </h2>
                  <p className="text-sm mb-3" style={{ color: P.muted }}>
                    Your <span className="font-bold" style={{ color: P.good }}>10% OFF</span> gift card is ready.
                  </p>
                  <p className="text-xs mb-6 max-w-[300px]" style={{ color: P.muted }}>
                    It will appear in checkout — select it to apply the discount.
                  </p>
                  {/* Sole exit from the claimed state: P.faint on P.band is
                      only 2.8:1, so this button needs P.muted (5.1:1). */}
                  <motion.button
                    whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }}
                    onClick={dismiss}
                    className="w-full max-w-xs py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2"
                    style={{ background: P.band, color: P.muted, border: `1px solid ${P.borderStrong}` }}>
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
