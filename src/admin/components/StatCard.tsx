import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  delay?: number;
}

export default function StatCard({ title, value, subtitle, change, icon: Icon, iconColor = "text-blue-400", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-[#0d1f3c] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center", iconColor.replace("text-", "text-"))}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            change > 0 ? "text-emerald-400 bg-emerald-400/10" : change < 0 ? "text-red-400 bg-red-400/10" : "text-slate-400 bg-white/5"
          )}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-xs mb-1">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
