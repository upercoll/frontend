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
          background: "rgba(10,8,40,0.92)",
          backdropFilter: "blur(18px)",
          borderTop: "1px solid rgba(165,180,252,0.13)",
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
                className="relative flex flex-col items-center justify-center gap-0.5 py-3 px-4 min-w-0 flex-1"
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
                      className="absolute top-2 right-1/2 translate-x-3 -translate-y-0.5 min-w-[17px] h-[17px] rounded-full flex items-center justify-center text-[10px] font-extrabold z-10"
                      style={{ background: "#4F46E5", color: "white", border: "2px solid rgba(10,8,40,0.92)" }}
                    >
                      {totalItems > 99 ? "99+" : totalItems}
                    </motion.span>
                  </AnimatePresence>
                )}

                <motion.div
                  animate={{ color: isActive ? "#818CF8" : "rgba(165,180,252,0.5)" }}
                  transition={{ duration: 0.18 }}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                </motion.div>

                <motion.span
                  animate={{ color: isActive ? "#818CF8" : "rgba(165,180,252,0.45)" }}
                  transition={{ duration: 0.18 }}
                  className="text-[10px] font-semibold leading-none"
                >
                  {label}
                </motion.span>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-dot"
                    className="absolute top-1.5 w-1 h-1 rounded-full"
                    style={{ background: "#818CF8", boxShadow: "0 0 6px #818CF8" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Extra spacer so page content doesn't hide behind the nav */}
      <div className="h-[68px] md:hidden" />

      <GameSelectModal open={shopOpen} onClose={() => setShopOpen(false)} zBase={60} />
    </>
  );
}
