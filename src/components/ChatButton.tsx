import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

export default function ChatButton() {
  return (
    <motion.button
      data-testid="button-chat"
      aria-label="Live chat"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.12, boxShadow: "0 0 28px rgba(124,58,237,0.7)" }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
      style={{
        background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)",
        boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
      }}
    >
      {}
      <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#7c3aed]" />
      <MessageSquare size={22} color="white" strokeWidth={2} />
    </motion.button>
  );
}
