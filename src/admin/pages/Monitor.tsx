import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Users, CheckCircle, Clock, Star, Wifi, WifiOff, MessageSquare, User, Gamepad2 } from "lucide-react";
import { adminApi } from "../api";
import type { Game } from "../types";
import { useAdminSocket } from "../context/AdminSocketContext";
import { cn } from "@/lib/utils";
import { PageHeader, EmptyState } from "../components/kit";

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
  const { activeClaims } = useAdminSocket();

  const { data, isLoading } = useQuery({
    queryKey: ["panel-agent-stats", gameFilter, onlineFilter],
    queryFn: () => adminApi.agentStats.getAll({ ...(gameFilter ? { game: gameFilter } : {}), ...(onlineFilter ? { online: onlineFilter } : {}) }),
    refetchInterval: 15000,
  });

  const { data: gamesData } = useQuery({ queryKey: ["panel-games"], queryFn: () => adminApi.games.list() });
  const games = gamesData?.data.games || [];
  const agents: AgentRow[] = data?.data.agents || [];

  const onlineCount = agents.filter((a) => a.stats?.isOnline).length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <PageHeader title="Agent Monitor" description={`${onlineCount} online · ${agents.length} total agents · Updates every 15s`}>
        <div className="flex gap-3">
          <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}
            className="bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text-3)] rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Games</option>
            {games.map((g: Game) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
          </select>
          <select value={onlineFilter} onChange={(e) => setOnlineFilter(e.target.value)}
            className="bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text-3)] rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Agents</option>
            <option value="true">Online Only</option>
            <option value="false">Offline Only</option>
          </select>
        </div>
      </PageHeader>

      {activeClaims.length > 0 && (
        <div className="bg-[var(--pn-surface)] border border-[var(--pn-action-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--pn-border)] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--pn-action)] animate-pulse" />
            <p className="text-[var(--pn-text)] text-sm font-semibold">Active Claim Chats</p>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--pn-action-tint)] text-[var(--pn-action)]">
              {activeClaims.length} live
            </span>
          </div>
          <div className="divide-y divide-[var(--pn-divider)]">
            {activeClaims.map((claim) => (
              <motion.div
                key={claim.roomId}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-5 py-3 flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--pn-action-tint)] border border-[var(--pn-action-border)] flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-[var(--pn-action)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-[var(--pn-text-2)]" />
                    <p className="text-[var(--pn-text)] text-sm font-medium">{claim.robloxUsername}</p>
                  </div>
                  {claim.game && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Gamepad2 className="w-3 h-3 text-[var(--pn-text-2)]" />
                      <p className="text-[var(--pn-text-2)] text-xs">{claim.game}</p>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    claim.status === "active" ? "bg-[var(--pn-success-bg)] text-[var(--pn-success-fg)]" :
                    claim.status === "pending" ? "bg-[var(--pn-warning-bg)] text-[var(--pn-warning-fg)]" :
                    "bg-[var(--pn-surface-2)] text-[var(--pn-text-2)]"
                  )}>
                    {claim.status === "active" ? `● Active${claim.agentName ? ` — ${claim.agentName}` : ""}` :
                     claim.status === "pending" ? "● Waiting" : claim.status}
                  </span>
                  <p className="text-[var(--pn-text-2)] text-[10px] mt-0.5">
                    {new Date(claim.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: agents.length, icon: Users, color: "text-[var(--pn-action)]" },
          { label: "Online Now", value: onlineCount, icon: Wifi, color: "text-[var(--pn-success-fg)]" },
          { label: "Total Claims", value: agents.reduce((s, a) => s + (a.stats?.totalClaims || 0), 0), icon: Activity, color: "text-[var(--pn-action)]" },
          { label: "Completed", value: agents.reduce((s, a) => s + (a.stats?.completedClaims || 0), 0), icon: CheckCircle, color: "text-[var(--pn-success-fg)]" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--pn-surface-2)] flex items-center justify-center flex-shrink-0">
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-[var(--pn-text-3)] text-xs">{item.label}</p>
                <p className="text-[var(--pn-text)] text-xl font-bold">{item.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-[var(--pn-surface)] rounded-xl border border-[var(--pn-border)] animate-pulse" />)}</div>
      ) : agents.length === 0 ? (
        <EmptyState icon={Users} title="No agents found" />
      ) : (
        <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[var(--pn-text-2)] text-xs border-b border-[var(--pn-border)]">
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
                    className="border-b border-[var(--pn-border)] hover:bg-[var(--pn-surface-2)] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          {agent.profile?.profilePicture ? (
                            <img src={agent.profile.profilePicture} className="w-9 h-9 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[var(--pn-action)] border border-[var(--pn-action-border)] flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {(agent.profile?.displayName || agent.member.email)[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          {agent.stats?.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--pn-success-fg)] rounded-full border-2 border-[var(--pn-surface)]" />
                          )}
                        </div>
                        <div>
                          <p className="text-[var(--pn-text)] text-sm font-medium">{agent.profile?.displayName || agent.member.email.split("@")[0]}</p>
                          <p className="text-[var(--pn-text-2)] text-xs">{agent.member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={cn("flex items-center gap-1.5 text-xs font-medium", agent.stats?.isOnline ? "text-[var(--pn-success-fg)]" : "text-[var(--pn-text-2)]")}>
                        {agent.stats?.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {agent.stats?.isOnline ? "Online" : agent.stats?.lastSeen ? `Last: ${new Date(agent.stats.lastSeen).toLocaleDateString()}` : "Offline"}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {agent.member.claimGames?.slice(0, 3).map((g) => (
                          <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pn-action-tint)] text-[var(--pn-action)]">{g}</span>
                        ))}
                        {(agent.member.claimGames?.length || 0) > 3 && (
                          <span className="text-[10px] text-[var(--pn-text-2)]">+{agent.member.claimGames!.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--pn-text)] text-sm font-medium">{agent.stats?.completedClaims || 0}</span>
                        <span className="text-[var(--pn-text-2)] text-xs">/ {agent.stats?.totalClaims || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className={cn("text-sm font-medium",
                        (agent.stats?.completionRate || 0) >= 80 ? "text-[var(--pn-success-fg)]" :
                        (agent.stats?.completionRate || 0) >= 60 ? "text-[var(--pn-warning-fg)]" : "text-[var(--pn-critical-text)]")}>
                        {agent.stats?.completionRate || 0}%
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-[var(--pn-text-3)] text-sm">
                        <Clock className="w-3 h-3" />
                        {msToResponseTime(agent.stats?.avgResponseTimeMs || 0)}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-[var(--pn-text-3)] text-sm">{msToTime(agent.stats?.totalOnlineMs || 0)}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {agent.stats?.rating && agent.stats.rating.count > 0 ? (
                        <div className="flex items-center gap-1 text-[var(--pn-warning-fg)] text-sm">
                          <Star className="w-3 h-3 fill-current" />
                          {agent.stats.rating.average.toFixed(1)}
                          <span className="text-[var(--pn-text-2)] text-xs">({agent.stats.rating.count})</span>
                        </div>
                      ) : <span className="text-[var(--pn-text-2)] text-xs">No ratings</span>}
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
