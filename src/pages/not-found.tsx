import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Character } from "@/components/Mascot";

export default function NotFound() {
  return (
    <div className="min-h-screen dot-grid w-full flex items-center justify-center px-4" style={{ background: "#F6F8FE" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-md"
      >
        <div className="relative inline-block mb-6">
          <span className="font-display text-[clamp(100px,20vw,180px)] leading-none tracking-tight block" style={{ color: "#0E1A3C" }}>
            4<span className="font-serif-italic" style={{ color: "#2B50F6" }}>0</span>4
          </span>
        </div>
        <div className="mx-auto mb-6 w-32 floaty">
          <Character cfg={{ skin:"#FFD23F", shirt:"#2B50F6", pants:"#16204D", hat:"top", hatColor:"#FFC53D", face:"shock" }} size="100%" />
        </div>
        <h1 className="font-display text-3xl tracking-tight mb-2" style={{ color: "#0E1A3C" }}>
          Page not found
        </h1>
        <p className="text-sm mb-8 font-medium" style={{ color: "#5A6478" }}>
          This page drifted off into another server. Let's get you back.
        </p>
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.04, y: -2, boxShadow: "0 18px 40px -10px rgba(43,80,246,.55)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white"
            style={{ background: "linear-gradient(180deg,#3D63FF 0%,#2B50F6 100%)", boxShadow: "0 10px 26px -8px rgba(43,80,246,.5)" }}
          >
            <ArrowLeft size={15} /> Back to Store
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
