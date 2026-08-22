import { motion } from "framer-motion";

export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen dot-grid flex items-center justify-center" style={{ background: "#F2EEE5" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center border-[3px]"
          style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
          />
        </motion.div>
        <p className="font-mono text-xs uppercase tracking-[0.22em]" style={{ color: "#6B655C" }}>{message}</p>
      </motion.div>
    </div>
  );
}
