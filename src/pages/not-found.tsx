import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { P } from "@/lib/storefront";
import { EmptyMailbox } from "@/components/Art";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 rglow">
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center relative z-10 flex flex-col items-center">

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-6">
          <EmptyMailbox className="w-full max-w-[260px] h-auto" />
        </motion.div>

        <h1 className="text-6xl font-black mb-2" style={{ color: P.text }}>
          4<span style={{ color: P.accentDeep }}>0</span>4
        </h1>
        <p className="text-lg font-bold mb-2" style={{ color: P.text }}>Page Not Found</p>
        <p className="text-sm mb-8" style={{ color: P.muted }}>This page doesn't exist or has been moved.</p>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/")}
          className="px-8 py-3.5 rounded-xl text-sm font-black inline-flex items-center gap-2"
          style={{ background: P.accentDeep, color: "#fff", boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}>
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
}
