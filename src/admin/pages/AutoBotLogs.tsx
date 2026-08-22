import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bot, Search, RefreshCw, Package, CheckCircle2, Truck, AlertTriangle } from "lucide-react";
import { adminApi } from "../api";
import { cn } from "@/lib/utils";

interface AutoBotLogItem {
  name?: string;
  quantity?: number;
  category?: string;
  delivered?: number;
}

interface AutoBotLog {
  _id: string;
  roomId?: string;
  orderRef?: string;
  robloxUsername?: string;
  game?: string;
  account?: string;
  action: "claim" | "deliver" | "complete" | "error" | "info";
  status?: string;
  message?: string;
  items?: AutoBotLogItem[];
  createdAt: string;
}

const ACTION_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  claim: { label: "CLAIMED", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  deliver: { label: "DELIVERED", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  complete: { label: "COMPLETE", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  error: { label: "ERROR", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  info: { label: "INFO", color: "#FF7A72", bg: "rgba(167,139,250,0.12)" },
};

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
}

export default function AutoBotLogs() {
  const [roomFilter, setRoomFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const params: Record<string, string> = { limit: "150" };
  if (roomFilter.trim()) params.roomId = roomFilter.trim();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["auto-bot-logs", params],
    queryFn: () => adminApi.autoBotLogs.list(params),
  });

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => refetch(), 10000);
    return () => clearInterval(id);
  }, [autoRefresh, refetch]);

  const logs: AutoBotLog[] = data?.data?.logs || [];

  return (
    <div className="p-6 space-y-5 max-w-[1300px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            Auto Bot Logs
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {logs.length} recent events from the automated delivery bot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#1B1B1B] border border-white/10 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              value={roomFilter}
              onChange={e => setRoomFilter(e.target.value)}
              placeholder="Filter by room id"
              className="bg-transparent outline-none text-sm text-slate-300 placeholder:text-slate-600 w-44"
            />
          </div>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-colors",
              autoRefresh
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-[#1B1B1B] border-white/10 text-slate-400")}
          >
            AUTO REFRESH {autoRefresh ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => refetch()}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#1B1B1B] border border-white/10 text-slate-300 hover:border-white/20 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#1B1B1B] rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Bot className="w-14 h-14 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-400">No bot activity yet</p>
          <p className="text-sm mt-1">Events appear here as soon as the bot picks up orders</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => {
            const st = ACTION_STYLE[log.action] || ACTION_STYLE.info;
            const isError = log.action === "error" || log.status === "error";
            return (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 15) * 0.02 }}
                className={cn("rounded-xl border p-3.5 flex flex-col md:flex-row md:items-center gap-3",
                  isError ? "bg-red-500/5 border-red-500/20" : "bg-[#1B1B1B] border-white/5")}
              >
                <div className="flex items-center gap-3 md:w-64 shrink-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: st.bg, border: `1px solid ${st.color}33` }}>
                    {log.action === "complete" ? <CheckCircle2 size={16} color={st.color} />
                      : log.action === "deliver" ? <Truck size={16} color={st.color} />
                      : isError ? <AlertTriangle size={16} color={st.color} />
                      : <Bot size={16} color={st.color} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold" style={{ color: st.color }}>{st.label}</p>
                    <p className="text-[10px] text-slate-500">{fmtTime(log.createdAt)}</p>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">
                    <span className="font-bold text-white">{log.roomId || "?"}</span>
                    {log.orderRef && <span className="text-slate-500"> · {log.orderRef}</span>}
                    {log.robloxUsername && <span className="text-slate-500"> → </span>}
                    {log.robloxUsername && <span className="text-sky-300">{log.robloxUsername}</span>}
                  </p>
                  {log.items && log.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {log.items.map((it, idx) => (
                        <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.05)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <Package className="inline w-3 h-3 mr-1" style={{ color: st.color }} />
                          {it.name} ×{it.quantity || 0}
                          {it.category ? ` [${it.category}]` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  {log.message && (
                    <p className="text-[11px] mt-1 text-slate-400 truncate">{log.message}</p>
                  )}
                </div>

                <div className="md:w-40 shrink-0 text-left md:text-right">
                  <p className="text-[11px] font-bold text-slate-300">{log.account || "AUTO BOT"}</p>
                  {log.game && <p className="text-[10px] text-slate-500">{log.game}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}