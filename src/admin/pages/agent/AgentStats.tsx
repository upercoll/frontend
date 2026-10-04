import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  CheckCircle, Clock, XCircle, Star, Activity, TrendingUp,
  UserCheck, TimerOff, MessageSquare,
} from "lucide-react";
import { adminApi } from "../../api";
import {
  PageHeader, Card, CardHeader, MetricTile, Badge, MetricSkeleton,
  EmptyState, RowSkeleton,
} from "../../components/kit";

function msToTime(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

const CLAIM_TONE: Record<string, "success" | "action" | "warning" | "neutral"> = {
  claimed: "success",
  active: "action",
  ended: "neutral",
  pending: "warning",
};

export default function AgentStats() {
  const reduce = useReducedMotion();
  const { data, isLoading } = useQuery({
    queryKey: ["agent-my-stats-detail"],
    queryFn: adminApi.agentStats.getMe,
    refetchInterval: 60000,
  });

  const stats = data?.data.stats;
  const recentSessions = data?.data.recentSessions || [];
  const completionRate = data?.data.completionRate || 0;

  const monthlyData = stats?.monthlyStats?.slice(-6).map((m: any) => ({
    month: `${m.month} ${m.year}`,
    claims: m.claims,
    completed: m.completed,
  })) || [];

  return (
    <div className="p-6 space-y-5 max-w-[1100px] mx-auto">
      <PageHeader
        title="My statistics"
        description="How you're tracking across every claim you've handled."
        eyebrow="Performance"
      />

      {isLoading ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            <MetricSkeleton count={8} />
          </div>
          <Card><RowSkeleton count={4} /></Card>
        </>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            <MetricTile label="Claims completed" value={stats?.completedClaims || 0} icon={CheckCircle} />
            <MetricTile label="Total claims" value={stats?.totalClaims || 0} icon={Activity} />
            <MetricTile label="Completion rate" value={`${completionRate}%`} icon={TrendingUp}
                        hint={completionRate >= 90 ? "strong" : completionRate >= 70 ? "solid" : "needs attention"} />
            <MetricTile label="Declined" value={stats?.declinedClaims || 0} icon={XCircle} />
            <MetricTile label="Avg. response" value={msToTime(stats?.avgResponseTimeMs || 0)} icon={Clock} />
            <MetricTile label="Online time" value={msToTime(stats?.totalOnlineMs || 0)} icon={UserCheck} />
            <MetricTile label="Rating"
                        value={stats?.rating?.count ? `${stats.rating.average.toFixed(1)}★` : "—"}
                        hint={stats?.rating?.count ? `${stats.rating.count} ratings` : "no ratings yet"}
                        icon={Star} />
            <MetricTile label="Timed out" value={stats?.timedOutClaims || 0} icon={TimerOff} />
          </div>

          {/* ── Monthly performance ── */}
          {monthlyData.length > 0 && (
            <Card>
              <CardHeader title="Monthly performance" subtitle="Last 6 months" icon={TrendingUp} />
              <div className="pn-cardbody">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--pn-divider)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "var(--pn-text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--pn-text-3)", fontSize: 11 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "var(--pn-surface-3)" }}
                      contentStyle={{
                        background: "var(--pn-surface)",
                        border: "1px solid var(--pn-border)",
                        borderRadius: 8,
                        color: "var(--pn-text)",
                        fontSize: 12,
                        boxShadow: "var(--pn-shadow-pop)",
                      }}
                      labelStyle={{ color: "var(--pn-text-2)", fontWeight: 600 }}
                      itemStyle={{ color: "var(--pn-text)" }}
                    />
                    <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 11.5, color: "var(--pn-text-2)" }} />
                    <Bar dataKey="claims" name="Total claims" fill="var(--pn-action)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="var(--pn-success-fg)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* ── Recent sessions ── */}
          <Card>
            <CardHeader title="Recent sessions" subtitle="Latest claims you've handled" icon={MessageSquare} />
            {recentSessions.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No sessions yet" body="Claim something from the queue to get started." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Game</th>
                      <th>Status</th>
                      <th className="hidden sm:table-cell">Opened</th>
                      <th className="hidden md:table-cell text-right">Handle time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((session: import("../../types").ClaimSession) => (
                      <tr key={session._id}>
                        <td>
                          <span className="text-[13px] font-medium" style={{ color: "var(--pn-text)" }}>
                            {session.robloxUsername}
                          </span>
                        </td>
                        <td>
                          {session.game
                            ? <Badge tone="action">{session.game}</Badge>
                            : <span style={{ color: "var(--pn-text-3)" }}>—</span>}
                        </td>
                        <td>
                          <Badge tone={CLAIM_TONE[session.status] || "neutral"} dot>{session.status}</Badge>
                        </td>
                        <td className="hidden sm:table-cell">
                          <span className="text-xs" style={{ color: "var(--pn-text-3)" }}>
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="hidden md:table-cell text-right">
                          {session.resolvedAt ? (
                            <span className="text-xs inline-flex items-center gap-1 justify-end" style={{ color: "var(--pn-text-2)" }}>
                              <Clock className="w-3 h-3" />
                              {msToTime(new Date(session.resolvedAt).getTime() - new Date(session.createdAt).getTime())}
                            </span>
                          ) : (
                            <span style={{ color: "var(--pn-text-3)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
