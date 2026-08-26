import { motion } from "framer-motion";

export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen pattern-grid-light flex items-center justify-center" style={{ background: "#0B1437" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "#131F4D", border: "1px solid rgba(255,255,255,.1)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 l2.4 5 5.6 .7 -4.1 3.9 1 5.6 -4.9 -2.7 -4.9 2.7 1 -5.6 -4.1 -3.9 5.6 -.7z" fill="#FFC53D" />
            </svg>
          </motion.div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
            className="absolute -inset-2 rounded-full border-2 border-transparent"
            style={{ borderTopColor: "#2B50F6", borderRightColor: "rgba(43,80,246,.25)" }}
          />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: "rgba(185,198,255,.6)" }}>{message}</p>
      </motion.div>
    </div>
  );
}
