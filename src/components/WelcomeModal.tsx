import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, UserPlus, ShoppingBag, Check, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "rbstars_welcome_seen";

// Flat dot texture — pattern instead of a gradient wash.
const DOT_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'%3E%3Ccircle cx='2' cy='2' r='1.4' fill='rgba(255,255,255,0.32)'/%3E%3C/svg%3E\")";

const PERKS = [
  { icon: <Check size={13} strokeWidth={3.5} />, text: "Instant auto-delivery" },
  { icon: <Check size={13} strokeWidth={3.5} />, text: "Live order alerts" },
  { icon: <Check size={13} strokeWidth={3.5} />, text: "Secure checkout" },
];

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { openAuthModal } = useAuth();
  const reduce = useReducedMotion();

  useEffect(() => {
    // Show once per tab session.
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  function handleSignUp() {
    dismiss();
    openAuthModal("register");
  }

  function handleSignIn() {
    dismiss();
    openAuthModal("login");
  }

  function handleShop() {
    dismiss();
    navigate("/browse");
  }

  // Motion helpers — everything collapses to instant when reduced motion is on.
  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 300, damping: 26 };
  const rise = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.5, ease: [0.19, 1, 0.22, 1] as const },
        };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.22 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(8,12,18,0.82)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to RBstars"
        >
          <motion.div
            key="welcome-card"
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={spring}
            className="relative w-full max-w-[720px] rounded-[26px] overflow-hidden shadow-2xl flex flex-col sm:flex-row"
            style={{ background: "#131C23", border: "1.5px solid #2C414E" }}
          >
            {/* ── Close ── */}
            <button
              onClick={dismiss}
              aria-label="Close welcome dialog"
              className="absolute top-3.5 right-3.5 z-30 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 hover:rotate-90"
              style={{ background: "#1C2A34", border: "1px solid #2C414E", color: "#9BAEBB" }}
            >
              <X size={15} />
            </button>

            {/* ── LEFT: flat blue art panel ── */}
            <div
              className="hidden sm:flex w-[44%] flex-shrink-0 flex-col justify-between p-7 relative overflow-hidden"
              style={{ background: "#3BA7FF" }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: DOT_PATTERN }}
              />

              {/* Logo chip — logo stands alone, no wordmark beside it */}
              <motion.div
                {...rise(0.05)}
                className="relative z-10 w-[74px] h-[74px] rounded-[20px] flex items-center justify-center"
                style={{ background: "#131C23", transform: "rotate(-7deg)" }}
              >
                <img src="/rb-logo.png" alt="RBstars" className="w-12 h-12 object-contain" />
              </motion.div>

              <div className="relative z-10">
                <motion.h3
                  {...rise(0.12)}
                  className="font-display text-[42px] leading-[0.92] font-extrabold tracking-tight"
                  style={{ color: "#FFFFFF" }}
                >
                  Welcome
                  <br />
                  <span
                    style={{
                      color: "transparent",
                      WebkitTextStroke: "2px #FFFFFF",
                    }}
                  >
                    aboard.
                  </span>
                </motion.h3>

                <div className="mt-5 flex flex-col gap-2">
                  {PERKS.map((p, i) => (
                    <motion.div
                      key={p.text}
                      {...rise(0.2 + i * 0.07)}
                      className="flex items-center gap-2 w-fit rounded-full pl-1.5 pr-3.5 py-1.5"
                      style={{ background: "rgba(19,28,35,0.18)" }}
                    >
                      <span
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "#131C23", color: "#3BA7FF" }}
                      >
                        {p.icon}
                      </span>
                      <span className="text-[12px] font-bold" style={{ color: "#FFFFFF" }}>
                        {p.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Flat ink bar — anchoring edge, no glow */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: "#131C23" }} />
            </div>

            {/* ── RIGHT: content + actions ── */}
            <div className="flex-1 p-7 sm:p-8 flex flex-col justify-center">
              {/* Mobile logo */}
              <motion.div {...rise(0.05)} className="sm:hidden mb-4">
                <div
                  className="w-14 h-14 rounded-[16px] flex items-center justify-center"
                  style={{ background: "#3BA7FF" }}
                >
                  <img src="/rb-logo.png" alt="RBstars" className="w-9 h-9 object-contain" />
                </div>
              </motion.div>

              <motion.p
                {...rise(0.1)}
                className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2"
                style={{ color: "#3BA7FF" }}
              >
                New here?
              </motion.p>

              <motion.h2
                {...rise(0.15)}
                className="font-display text-[28px] sm:text-[32px] leading-[1.05] font-extrabold mb-2"
                style={{ color: "#F4F8FB" }}
              >
                Welcome to RBstars
              </motion.h2>

              <motion.p {...rise(0.2)} className="text-sm leading-relaxed mb-6" style={{ color: "#9BAEBB" }}>
                Create an account to track orders and get live delivery alerts — or
                jump straight into the catalog.
              </motion.p>

              <div className="flex flex-col gap-3">
                <motion.button
                  {...rise(0.26)}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={handleSignUp}
                  className="group flex items-center justify-between w-full rounded-2xl px-5 py-4 font-bold text-sm"
                  style={{ background: "#3BA7FF", color: "#fff", boxShadow: "0 4px 0 0 #2980b9" }}
                >
                  <span className="flex items-center gap-2.5">
                    <UserPlus size={17} />
                    Create account
                  </span>
                  <span className="text-xs font-semibold opacity-80 group-hover:translate-x-0.5 transition-transform">
                    Free
                  </span>
                </motion.button>

                <motion.button
                  {...rise(0.32)}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={handleShop}
                  className="group flex items-center justify-between w-full rounded-2xl px-5 py-4 font-bold text-sm"
                  style={{ background: "#1C2A34", border: "1.5px solid #2C414E", color: "#F4F8FB" }}
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag size={17} color="#3BA7FF" />
                    Browse the shop
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "#637784" }}>
                    No account
                  </span>
                </motion.button>
              </div>

              <motion.button
                {...rise(0.38)}
                onClick={handleSignIn}
                className="mt-4 mx-auto flex items-center gap-1.5 text-xs font-semibold transition-colors"
                style={{ color: "#637784" }}
              >
                <LogIn size={13} />
                Already have an account? Sign in
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
