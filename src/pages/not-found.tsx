import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#131C23" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[20%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.4 }} />
        <div className="absolute top-[30%] right-[15%] w-1.5 h-1.5 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
        <div className="absolute top-[55%] left-[10%] w-1 h-1 rounded-full" style={{ background: "#5CB8FF", opacity: 0.25 }} />
        <div className="absolute top-[70%] right-[25%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.35 }} />
        <div className="absolute top-[85%] left-[40%] w-1.5 h-1.5 rounded-full" style={{ background: "#5CB8FF", opacity: 0.2 }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,167,255,0.1), transparent 70%)" }} />

      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center relative z-10">

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-6">
          <img src="/void-knight.webp" alt="" className="w-40 h-40 mx-auto object-contain" style={{ filter: "drop-shadow(0 4px 24px rgba(59,167,255,0.3))" }} />
        </motion.div>

        <h1 className="text-6xl font-black mb-2" style={{ color: "#F4F8FB" }}>
          4<span style={{ color: "#3BA7FF" }}>0</span>4
        </h1>
        <p className="text-lg font-bold mb-2" style={{ color: "#F4F8FB" }}>Page Not Found</p>
        <p className="text-sm mb-8" style={{ color: "#637784" }}>This page doesn't exist or has been moved.</p>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/")}
          className="px-8 py-3.5 rounded-xl text-sm font-bold text-white inline-flex items-center gap-2"
          style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
}
