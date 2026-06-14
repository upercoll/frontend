import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle, Clock, XCircle, Star, MessageSquare, Gamepad2, Activity } from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "../../api";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminSocket } from "../../context/AdminSocketContext";
import StatCard from "../../components/StatCard";

function msToTime(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export default function AgentDashboard() {
  const { user, profile } = useAdminAuth();
  const { connected } = useAdminSocket();

  const { data, isLoading } = useQuery({
    queryKey: ["agent-my-stats"],
    queryFn: adminApi.agentStats.me,
    refetchInterval: 30000,
  });

  const stats = data?.data.stats;
  const recentSessions = data?.data.recentSessions || [];
  const completionRate = data?.data.completionRate || 0;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-400/10 text-yellow-400",
    active: "bg-blue-400/10 text-blue-400",
    claimed: "bg-emerald-400/10 text-emerald-400",
    ended: "bg-slate-400/10 text-slate-400",
  };

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          {profile?.profilePicture ? (
            <img src={profile.profilePicture} className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/30" alt="" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 text-xl font-bold">
                {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-white font-bold text-xl">Welcome back, {profile?.displayName || user?.email?.split("@")[0]}!</h2>
            <div className="flex items-center gap-3 mt-1">
              <div className={`flex items-center gap-1.5 text-xs ${connected ? "text-emerald-400" : "text-slate-500"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-slate-500"}`} />
                {connected ? "Online & ready for claims" : "Connecting..."}
              </div>
              {user?.claimGames && user.claimGames.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Gamepad2 className="w-3 h-3" />
                  {user.claimGames.join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-[#0d1f3c] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Claims Completed" value={stats?.completedClaims || 0} icon={CheckCircle} iconColor="text-emerald-400" delay={0} />
          <StatCard title="Completion Rate" value={`${completionRate}%`} icon={Activity} iconColor="text-blue-400" delay={0.05} />
          <StatCard title="Avg Response" value={msToTime(stats?.avgResponseTimeMs || 0)} icon={Clock} iconColor="text-yellow-400" delay={0.1} />
          <StatCard title="Rating" value={stats?.rating?.count ? `${stats.rating.average.toFixed(1)} ★` : "—"} icon={Star} iconColor="text-yellow-400" delay={0.15} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/panel/queue">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 cursor-pointer shadow-lg shadow-blue-500/20">
            <MessageSquare className="w-8 h-8 text-white mb-3" />
            <p className="text-white font-bold text-lg">Claim Queue</p>
            <p className="text-blue-200 text-sm mt-0.5">Answer incoming claim requests</p>
          </motion.div>
        </Link>
        <Link href="/panel/stats">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="bg-[#0d1f3c] border border-white/5 rounded-xl p-5 cursor-pointer hover:border-white/10 transition-colors">
            <Activity className="w-8 h-8 text-blue-400 mb-3" />
            <p className="text-white font-bold text-lg">My Statistics</p>
            <p className="text-slate-400 text-sm mt-0.5">View detailed performance metrics</p>
          </motion.div>
        </Link>
        <Link href="/panel/profile">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="bg-[#0d1f3c] border border-white/5 rounded-xl p-5 cursor-pointer hover:border-white/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
              <span className="text-blue-400 font-bold">{(profile?.displayName || "?")[0].toUpperCase()}</span>
            </div>
            <p className="text-white font-bold text-lg">My Profile</p>
            <p className="text-slate-400 text-sm mt-0.5">Update your info and settings</p>
          </motion.div>
        </Link>
      </div>

      {recentSessions.length > 0 && (
        <div className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-white font-semibold">Recent Claims</h3>
          </div>
          <div className="divide-y divide-white/3">
            {recentSessions.slice(0, 6).map((session: import("../../types").ClaimSession, i: number) => (
              <motion.div key={session._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{session.robloxUsername}</p>
                  <p className="text-slate-500 text-xs">{session.game || "Unknown game"}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[session.status] || "bg-white/5 text-slate-400"}`}>
                    {session.status}
                  </span>
                  <span className="text-slate-600 text-xs hidden sm:block">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
