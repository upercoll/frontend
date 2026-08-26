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
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "rgba(255,255,255,.94)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderTop: "1px solid rgba(14,26,60,.1)",
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
                {isCart && totalItems > 0 && (
                  <AnimatePresence>
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="absolute top-1.5 right-1/2 translate-x-4 -translate-y-0.5 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold z-10 text-white ring-2 ring-white"
                      style={{ background: "#2B50F6" }}
                    >
                      {totalItems > 99 ? "99+" : totalItems}
                    </motion.span>
                  </AnimatePresence>
                )}

                <motion.div
                  animate={{ color: isActive ? "#2B50F6" : "rgba(14,26,60,.45)" }}
                  transition={{ duration: 0.18 }}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                </motion.div>

                <motion.span
                  animate={{ color: isActive ? "#2B50F6" : "rgba(14,26,60,.42)" }}
                  transition={{ duration: 0.18 }}
                  className="text-[10px] font-semibold leading-none"
                >
                  {label}
                </motion.span>

                {isActive && (
                  <motion.div
                    layoutId="nav-active-dot"
                    className="absolute top-1 w-1.5 h-1.5 rounded-full"
                    style={{ background: "#FFC53D", boxShadow: "0 0 6px rgba(255,197,61,.8)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      <div className="h-[64px] md:hidden" />

      <GameSelectModal open={shopOpen} onClose={() => setShopOpen(false)} zBase={60} />
    </>
  );
}
