import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Package } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen dot-grid w-full flex items-center justify-center px-4" style={{ background: "#F2EEE5" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-md"
      >
        <div className="relative inline-block mb-6">
          <span className="font-display text-[clamp(96px,20vw,180px)] leading-none text-outline block">404</span>
          <div className="absolute -right-8 -top-4 w-14 h-14 rounded-2xl border-2 rotate-12 flex items-center justify-center bg-white"
            style={{ borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}>
            <Package size={22} />
          </div>
        </div>
        <h1 className="font-display text-2xl uppercase mb-2">Page not found</h1>
        <p className="text-sm mb-7" style={{ color: "#6B655C" }}>
          This page fell out of the server. Let's get you back to the shop.
        </p>
        <Link href="/">
          <motion.button
            whileHover={{ translateX: -2, translateY: -2, boxShadow: "6px 6px 0 #131313" }}
            whileTap={{ translateX: 2, translateY: 2, boxShadow: "1px 1px 0 #131313" }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-mono text-xs font-semibold uppercase tracking-wider text-white border-[3px]"
            style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "4px 4px 0 #131313" }}
          >
            <ArrowLeft size={15} /> Back to Store
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
