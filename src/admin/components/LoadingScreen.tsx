import { motion } from "framer-motion";

export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[var(--pn-surface-2)] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-[var(--pn-action)] flex items-center justify-center">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="block w-5 h-5 border-2 border-[var(--pn-border)] border-t-white rounded-full"
          />
        </div>
        <p className="text-[var(--pn-text-3)] text-sm">{message}</p>
      </motion.div>
    </div>
  );
}
