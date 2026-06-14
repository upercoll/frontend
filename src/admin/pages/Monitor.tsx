import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Users, CheckCircle, XCircle, Clock, Star, Wifi, WifiOff } from "lucide-react";
import { adminApi } from "../api";
import type { Game } from "../types";
import { cn } from "@/lib/utils";

interface AgentRow {
  member: import("../types").TeamMember;
  profile: import("../types").AdminProfile;
  stats: import("../types").AgentStatsSummary;
}

function msToTime(ms: number): string {
  if (!ms) return "—";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function msToResponseTime(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.round(s / 60)}m`;
}

export default function Monitor() {
  const [gameFilter, setGameFilter] = useState("");
  const [onlineFilter, setOnlineFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["panel-agent-stats", gameFilter, onlineFilter],
    queryFn: () => adminApi.agentStats.all({ ...(gameFilter ? { game: gameFilter } : {}), ...(onlineFilter ? { online: onlineFilter } : {}) }),
    refetchInterval: 15000,
  });

  const { data: gamesData } = useQuery({ queryKey: ["panel-games"], queryFn: () => adminApi.games.list() });
  const games = gamesData?.data.games || [];
  const agents: AgentRow[] = data?.data.agents || [];

  const onlineCount = agents.filter((a) => a.stats?.isOnline).length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-semibold text-lg">Agent Monitor</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {onlineCount} online · {agents.length} total agents · Updates every 15s
          </p>
        </div>
        <div className="flex gap-3">
          <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}
            className="bg-[#0d1f3c] border border-white/10 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Games</option>
            {games.map((g: Game) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
          </select>
          <select value={onlineFilter} onChange={(e) => setOnlineFilter(e.target.value)}
            className="bg-[#0d1f3c] border border-white/10 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Agents</option>
            <option value="true">Online Only</option>
            <option value="false">Offline Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: agents.length, icon: Users, color: "text-blue-400" },
          { label: "Online Now", value: onlineCount, icon: Wifi, color: "text-emerald-400" },
          { label: "Total Claims", value: agents.reduce((s, a) => s + (a.stats?.totalClaims || 0), 0), icon: Activity, color: "text-purple-400" },
          { label: "Completed", value: agents.reduce((s, a) => s + (a.stats?.completedClaims || 0), 0), icon: CheckCircle, color: "text-emerald-400" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[#0d1f3c] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-slate-400 text-xs">{item.label}</p>
                <p className="text-white text-xl font-bold">{item.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />)}</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No agents found</p>
        </div>
      ) : (
        <div className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-white/5">
                  <th className="text-left px-5 py-3 font-medium">Agent</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Games</th>
                  <th className="text-left px-5 py-3 font-medium">Claims</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Rate</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Avg Response</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Online Time</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Rating</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent, i) => (
                  <motion.tr key={agent.member._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          {agent.profile?.profilePicture ? (
                            <img src={agent.profile.profilePicture} className="w-9 h-9 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/10 flex items-center justify-center">
                              <span className="text-blue-400 text-xs font-bold">
                                {(agent.profile?.displayName || agent.member.email)[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          {agent.stats?.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d1f3c]" />
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{agent.profile?.displayName || agent.member.email.split("@")[0]}</p>
                          <p className="text-slate-500 text-xs">{agent.member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={cn("flex items-center gap-1.5 text-xs font-medium", agent.stats?.isOnline ? "text-emerald-400" : "text-slate-500")}>
                        {agent.stats?.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {agent.stats?.isOnline ? "Online" : agent.stats?.lastSeen ? `Last: ${new Date(agent.stats.lastSeen).toLocaleDateString()}` : "Offline"}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {agent.member.claimGames?.slice(0, 3).map((g) => (
                          <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{g}</span>
                        ))}
                        {(agent.member.claimGames?.length || 0) > 3 && (
                          <span className="text-[10px] text-slate-500">+{agent.member.claimGames!.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{agent.stats?.completedClaims || 0}</span>
                        <span className="text-slate-600 text-xs">/ {agent.stats?.totalClaims || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className={cn("text-sm font-medium",
                        (agent.stats?.completionRate || 0) >= 80 ? "text-emerald-400" :
                        (agent.stats?.completionRate || 0) >= 60 ? "text-yellow-400" : "text-red-400")}>
                        {agent.stats?.completionRate || 0}%
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <Clock className="w-3 h-3" />
                        {msToResponseTime(agent.stats?.avgResponseTimeMs || 0)}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-slate-400 text-sm">{msToTime(agent.stats?.totalOnlineMs || 0)}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {agent.stats?.rating && agent.stats.rating.count > 0 ? (
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Star className="w-3 h-3 fill-current" />
                          {agent.stats.rating.average.toFixed(1)}
                          <span className="text-slate-600 text-xs">({agent.stats.rating.count})</span>
                        </div>
                      ) : <span className="text-slate-600 text-xs">No ratings</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
