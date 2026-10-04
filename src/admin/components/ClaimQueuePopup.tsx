import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Clock, Package, User, X } from "lucide-react";

interface ClaimPopup {
  roomId: string;
  robloxUsername: string;
  contactEmail: string;
  game?: string;
  items: { name: string; quantity: number }[];
  orderRef?: string;
  createdAt: string;
}

interface Props {
  popup: ClaimPopup;
  onAnswer: () => void;
  onDecline: () => void;
  ownerMode?: boolean;
}

export default function ClaimQueuePopup({ popup, onAnswer, onDecline, ownerMode = false }: Props) {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (ownerMode) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [popup.roomId, ownerMode]);

  const progress = (timeLeft / 30) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="fixed bottom-6 right-6 z-50 w-80 bg-[var(--pn-surface)] border border-[var(--pn-action-border)] rounded-xl overflow-hidden"
    >
      <div className="h-1 bg-[var(--pn-surface-2)]">
        <motion.div
          className={`h-full transition-all duration-1000 ${timeLeft > 15 ? "bg-[var(--pn-action)]" : timeLeft > 5 ? "bg-[var(--pn-warning-bg)]0" : "bg-[var(--pn-critical)]"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--pn-action-tint)] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[var(--pn-action)]" />
            </div>
            <div>
              <p className="text-[var(--pn-text)] text-sm font-semibold">New Claim Request</p>
              {popup.game && <p className="text-[var(--pn-action)] text-xs">{popup.game}</p>}
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${timeLeft > 15 ? "text-[var(--pn-action)] bg-[var(--pn-action-tint)]" : timeLeft > 5 ? "text-[var(--pn-warning-fg)] bg-[var(--pn-warning-bg)]" : "text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)]"}`}>
            <Clock className="w-3 h-3" />
            {timeLeft}s
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-[var(--pn-text-3)]">
            <User className="w-3 h-3 text-[var(--pn-text-2)]" />
            <span className="text-[var(--pn-text)] font-medium">{popup.robloxUsername}</span>
            <span>•</span>
            <span>{popup.contactEmail}</span>
          </div>
          {popup.items?.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-[var(--pn-text-3)]">
              <Package className="w-3 h-3 text-[var(--pn-text-2)] mt-0.5 flex-shrink-0" />
              <span>{popup.items.map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(", ")}</span>
            </div>
          )}
          {popup.orderRef && (
            <div className="text-xs text-[var(--pn-text-2)]">Order: {popup.orderRef}</div>
          )}
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAnswer}
            className="flex-1 bg-[var(--pn-primary)] hover:bg-[var(--pn-primary-hover)] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            {ownerMode ? "View Monitor" : "Answer"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDecline}
            className="flex-1 bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            Dismiss
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
