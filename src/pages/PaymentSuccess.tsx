import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Package, MessageSquare, ArrowLeft, Star } from "lucide-react";
import { useLocation } from "wouter";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  gradient?: [string, string];
}

interface LastOrder {
  orderRef: string;
  email: string;
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
  const [order] = useState<LastOrder | null>(() => loadOrder());
  const [claimOpened, setClaimOpened] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function openClaimChat() {
    setClaimOpened(true);
    window.dispatchEvent(new CustomEvent("rbstars:open-claim"));
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(160deg,#0C0B2E 0%,#0F0C2E 50%,#0C0B2E 100%)" }}
    >
      {}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle,#4F46E5,transparent)", filter: "blur(80px)" }}
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle,#dc2626,transparent)", filter: "blur(80px)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {}
        <div className="flex items-center justify-center mb-7">
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2.5 + i * 0.6, opacity: 0 }}
              transition={{ duration: 1.4, delay: 0.2 + i * 0.18, repeat: Infinity, repeatDelay: 1.5 }}
              className="absolute w-20 h-20 rounded-full border-2"
              style={{ borderColor: i === 0 ? "#4F46E5" : i === 1 ? "#ec4899" : "#dc2626" }}
            />
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
            className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 0 40px rgba(22,163,74,0.5)" }}
          >
            <Check size={38} color="white" strokeWidth={3} />
          </motion.div>
        </div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-extrabold text-white mb-1">Order Confirmed!</h1>
          {order?.email && (
            <p className="text-sm" style={{ color: "#818CF8" }}>
              Confirmation sent to <span className="text-white font-bold">{order.email}</span>
            </p>
          )}
          {order?.orderRef && (
            <p className="text-[11px] mt-1" style={{ color: "#64748B" }}>
              Order ref: <span style={{ color: "#818CF8" }}>{order.orderRef}</span>
            </p>
          )}
        </motion.div>

        {}
        {order?.items?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl overflow-hidden mb-4"
            style={{ background: "rgba(255,255,255,0.035)", border: "1.5px solid rgba(165,180,252,0.13)" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(165,180,252,0.08)" }}>
              <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Package size={13} color="#A5B4FC" />
                Your Items
              </p>
            </div>
            <div className="px-4 py-3 space-y-2 max-h-44 overflow-y-auto">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex-shrink-0"
                    style={{
                      background: item.gradient
                        ? `linear-gradient(135deg,${item.gradient[0]},${item.gradient[1]})`
                        : "linear-gradient(135deg,#4F46E5,#3730A3)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                    {item.quantity > 1 && (
                      <p className="text-[10px]" style={{ color: "#64748B" }}>Qty: {item.quantity}</p>
                    )}
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
                    Paid
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}

        {}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl p-4 mb-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,rgba(220,38,38,0.15),rgba(159,18,57,0.1))", border: "1.5px solid rgba(220,38,38,0.3)" }}
        >
          <motion.div
            animate={{ x: ["-120%", "220%"] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "linear", repeatDelay: 2 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)", width: "40%" }}
          />
          <div className="relative flex items-start gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(220,38,38,0)", "0 0 16px rgba(220,38,38,0.6)", "0 0 0px rgba(220,38,38,0)"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(220,38,38,0.4),rgba(159,18,57,0.3))", border: "1px solid rgba(220,38,38,0.4)" }}
            >
              <Package size={18} color="#fca5a5" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-white mb-0.5">Ready to Receive Your Items?</p>
              <p className="text-[11px] leading-relaxed" style={{ color: "#cd8fa5" }}>
                Open the Claim Chat below to connect with our delivery team. Have your Roblox account ready!
              </p>
            </div>
          </div>
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(220,38,38,0.4)" }}
            whileTap={{ scale: 0.97 }}
            onClick={openClaimChat}
            className="w-full py-4 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2.5 text-base relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#dc2626,#9f1239)" }}
          >
            <motion.div
              animate={{ x: ["-100%", "220%"] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "linear", repeatDelay: 0.8 }}
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)", width: "40%" }}
            />
            <MessageSquare size={18} />
            {claimOpened ? "Chat Opened ↘" : "Claim Your Items Now"}
            {claimOpened && <Check size={16} className="ml-1" />}
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
              style={{ background: "rgba(79,70,229,0.15)", border: "1.5px solid rgba(165,180,252,0.2)", color: "#A5B4FC" }}
            >
              <ArrowLeft size={14} />Back to Store
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/game/murder-mystery-2")}
              className="py-3 rounded-xl font-bold text-sm"
              style={{ background: "rgba(79,70,229,0.15)", border: "1.5px solid rgba(165,180,252,0.2)", color: "#A5B4FC" }}
            >
              Browse More
            </motion.button>
          </div>
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-4 mt-6"
        >
          {[
            { icon: <Star size={11} fill="#A5B4FC" color="#A5B4FC" />, label: "5★ Rated" },
            { icon: <Package size={11} color="#A5B4FC" />, label: "Instant Delivery" },
            { icon: <Check size={11} color="#4ade80" />, label: "100% Guaranteed" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {b.icon}
              <span className="text-[10px] font-semibold" style={{ color: "#64748B" }}>{b.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
