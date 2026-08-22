import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import GameSelectModal from "@/components/GameSelectModal";

const tabs = [
  { id: "home",    label: "Home",    Icon: Home },
  { id: "shop",    label: "Shop",    Icon: ShoppingBag },
  { id: "cart",    label: "Cart",    Icon: ShoppingCart },
  { id: "account", label: "Account", Icon: User },
] as const;

export default function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const { totalItems, openCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const [shopOpen, setShopOpen] = useState(false);

  const activeId =
    location === "/"           ? "home"
    : location.startsWith("/game/") ? "shop"
    : null;

  function handleTab(id: (typeof tabs)[number]["id"]) {
    if (id === "home")    { navigate("/"); }
    if (id === "shop")    { setShopOpen(true); }
    if (id === "cart")    { openCart(); }
    if (id === "account") {
      if (user) openAuthModal("edit");
      else openAuthModal("login");
    }
  }

  return (
    <>
      {/* Bottom nav — mobile only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "#F2EEE5",
          borderTop: "2.5px solid #131313",
        }}
      >
        <div className="flex items-center justify-around px-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 4px)" }}>
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeId === id;
            const isCart   = id === "cart";

            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.88 }}
                onClick={() => handleTab(id)}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 px-4 min-w-0 flex-1"
              >
                {/* Cart badge */}
                {isCart && totalItems > 0 && (
                  <AnimatePresence>
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="absolute top-1.5 right-1/2 translate-x-4 -translate-y-0.5 min-w-[17px] h-[17px] rounded-full flex items-center justify-center text-[10px] font-bold z-10 text-white border-2"
                      style={{ background: "#E2231A", borderColor: "#F2EEE5" }}
                    >
                      {totalItems > 99 ? "99+" : totalItems}
                    </motion.span>
                  </AnimatePresence>
                )}

                <motion.div
                  animate={{ color: isActive ? "#131313" : "rgba(19,19,19,.45)" }}
                  transition={{ duration: 0.18 }}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                </motion.div>

                <motion.span
                  animate={{ color: isActive ? "#131313" : "rgba(19,19,19,.42)" }}
                  transition={{ duration: 0.18 }}
                  className="font-mono text-[9px] font-medium uppercase tracking-[0.12em] leading-none"
                >
                  {label}
                </motion.span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-dot"
                    className="absolute top-1 w-2 h-2 rounded-[2px]"
                    style={{ background: "#E2231A", transform: "rotate(12deg)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Extra spacer so page content doesn't hide behind the nav */}
      <div className="h-[64px] md:hidden" />

      <GameSelectModal open={shopOpen} onClose={() => setShopOpen(false)} zBase={60} />
    </>
  );
}
