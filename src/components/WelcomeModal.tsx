import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "rbstars_welcome_seen";

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const { openAuthModal } = useAuth();

  useEffect(() => {
    // Show every time the page loads (session-based: once per tab session)
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  function handleSignUp() {
    dismiss();
    openAuthModal("register");
  }

  function handleShop() {
    dismiss();
    // If we're already on the homepage, scroll to the shop grid
    const shopEl = document.getElementById("shop-games");
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: "smooth" });
    } else {
      // Navigate to homepage shop section
      window.location.href = "/#shop-games";
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(10,8,30,0.78)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        >
          <motion.div
            key="welcome-card"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(160deg, #1e1b4b 0%, #0f0c2e 100%)",
              border: "1.5px solid rgba(165,180,252,0.18)",
            }}
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 active:scale-95"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(165,180,252,0.2)" }}
            >
              <X size={15} color="#A5B4FC" />
            </button>

            {/* Wooden sign image */}
            <div className="flex justify-center pt-6 px-6">
              <img
                src="/welcome-sign.png"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                alt="Welcome to RBstars"
                className="w-56 drop-shadow-2xl select-none pointer-events-none"
              />
            </div>

            {/* Text content */}
            <div className="px-7 pt-4 pb-2 text-center">
              <h2
                className="font-display text-2xl font-bold mb-1"
                style={{ color: "#fff" }}
              >
                Welcome to{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, #818CF8, #C4B5FD)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  RBstars
                </span>
              </h2>
              <p className="text-sm mb-1" style={{ color: "#A5B4FC" }}>
                How would you like to proceed?
              </p>
            </div>

            {/* Divider */}
            <div className="mx-7 my-2" style={{ height: "1px", background: "rgba(165,180,252,0.12)" }} />

            {/* Action buttons */}
            <div className="flex flex-col gap-3 px-7 pb-7 pt-3">
              {/* Sign Up button */}
              <motion.button
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.975 }}
                onClick={handleSignUp}
                className="flex items-center gap-3 w-full rounded-2xl px-5 py-4 text-left font-semibold text-sm transition-shadow"
                style={{
                  background: "linear-gradient(90deg, #4F46E5, #7C3AED)",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(79,70,229,0.35)",
                }}
              >
                <span
                  className="flex items-center justify-center rounded-xl p-2 shrink-0"
                  style={{ background: "rgba(255,255,255,0.18)" }}
                >
                  <UserPlus size={16} />
                </span>
                <span>
                  <span className="block text-[15px] font-bold leading-tight">Sign Up</span>
                  <span className="block text-xs font-normal mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Purchase items &amp; receive live alerts
                  </span>
                </span>
              </motion.button>

              {/* Shop button */}
              <motion.button
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.975 }}
                onClick={handleShop}
                className="flex items-center gap-3 w-full rounded-2xl px-5 py-4 text-left font-semibold text-sm transition-shadow"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1.5px solid rgba(165,180,252,0.22)",
                  color: "#fff",
                }}
              >
                <span
                  className="flex items-center justify-center rounded-xl p-2 shrink-0"
                  style={{ background: "rgba(165,180,252,0.12)" }}
                >
                  <ShoppingBag size={16} color="#A5B4FC" />
                </span>
                <span>
                  <span className="block text-[15px] font-bold leading-tight">View Live Stock</span>
                  <span className="block text-xs font-normal mt-0.5" style={{ color: "rgba(165,180,252,0.75)" }}>
                    Browse all products &amp; see how it works
                  </span>
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
