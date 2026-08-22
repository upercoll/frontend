import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle, Clock, XCircle, Star, Activity, TrendingUp } from "lucide-react";
import { adminApi } from "../../api";
import StatCard from "../../components/StatCard";

function msToTime(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export default function AgentStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-my-stats-detail"],
    queryFn: adminApi.agentStats.me,
    refetchInterval: 60000,
  });

  const stats = data?.data.stats;
  const recentSessions = data?.data.recentSessions || [];
  const completionRate = data?.data.completionRate || 0;

  const monthlyData = stats?.monthlyStats?.slice(-6).map((m) => ({
    month: `${m.month} ${m.year}`,
    claims: m.claims,
    completed: m.completed,
  })) || [];

  const statusColors: Record<string, string> = {
    claimed: "text-emerald-400",
    active: "text-blue-400",
    ended: "text-slate-400",
    pending: "text-yellow-400",
  };

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <h2 className="text-white font-semibold text-lg">My Statistics</h2>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-[#0d1f3c] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard title="Claims Completed" value={stats?.completedClaims || 0} icon={CheckCircle} iconColor="text-emerald-400" delay={0} />
            <StatCard title="Total Claims" value={stats?.totalClaims || 0} icon={Activity} iconColor="text-blue-400" delay={0.05} />
            <StatCard title="Completion Rate" value={`${completionRate}%`} icon={TrendingUp} iconColor="text-purple-400" delay={0.1} />
            <StatCard title="Declined" value={stats?.declinedClaims || 0} icon={XCircle} iconColor="text-red-400" delay={0.15} />
            <StatCard title="Avg Response" value={msToTime(stats?.avgResponseTimeMs || 0)} icon={Clock} iconColor="text-yellow-400" delay={0.2} />
            <StatCard title="Online Time" value={msToTime(stats?.totalOnlineMs || 0)} icon={Clock} iconColor="text-cyan-400" delay={0.25} />
            <StatCard title="Rating" value={stats?.rating?.count ? `${stats.rating.average.toFixed(1)} ★` : "No ratings"} icon={Star} iconColor="text-yellow-400" delay={0.3} />
            <StatCard title="Timed Out" value={stats?.timedOutClaims || 0} icon={Clock} iconColor="text-orange-400" delay={0.35} />
          </div>

          {monthlyData.length > 0 && (
            <div className="bg-[#0d1f3c] border border-white/5 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Monthly Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0" }} />
                  <Bar dataKey="claims" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {recentSessions.length > 0 && (
            <div className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">Recent Sessions</h3>
              </div>
              <div className="divide-y divide-white/3">
                {recentSessions.map((session: import("../../types").ClaimSession, i: number) => (
                  <motion.div key={session._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">{session.robloxUsername}</p>
                        {session.game && <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">{session.game}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${statusColors[session.status] || "text-slate-400"}`}>
                        {session.status}
                      </span>
                      <span className="text-slate-600 text-xs hidden sm:block">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      {session.resolvedAt && (
                        <span className="text-slate-600 text-xs hidden md:flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {msToTime(new Date(session.resolvedAt).getTime() - new Date(session.createdAt).getTime())}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
