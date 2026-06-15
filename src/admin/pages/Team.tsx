import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, UserPlus, Mail, RefreshCw, UserX, X, Loader2, Activity, Clock } from "lucide-react";
import { adminApi } from "../api";
import type { TeamMember, AdminRole } from "../types";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-400/10 text-emerald-400",
  invited: "bg-yellow-400/10 text-yellow-400",
  disabled: "bg-slate-400/10 text-slate-400",
};

export default function Team() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteGames, setInviteGames] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: membersData, isLoading } = useQuery({
    queryKey: ["panel-team", statusFilter],
    queryFn: () => adminApi.team.list(statusFilter ? { status: statusFilter } : undefined),
  });

  const { data: rolesData } = useQuery({
    queryKey: ["panel-roles"],
    queryFn: adminApi.roles.list,
  });

  const { data: gamesData } = useQuery({
    queryKey: ["panel-games"],
    queryFn: () => adminApi.games.list(),
  });

  const inviteMut = useMutation({
    mutationFn: adminApi.team.invite,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["panel-team"] }); setShowInvite(false); setInviteEmail(""); setInviteRole(""); setInviteGames([]); },
    onError: (err: Error) => setError(err.message),
  });

  const removeMut = useMutation({
    mutationFn: adminApi.team.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-team"] }),
  });

  const resendMut = useMutation({
    mutationFn: adminApi.team.resendInvite,
    onSuccess: () => alert("Invite resent!"),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRole) { setError("Email and role are required"); return; }
    inviteMut.mutate({ email: inviteEmail, roleId: inviteRole, claimGames: inviteGames });
  };

  const members = membersData?.data.members || [];
  const roles = rolesData?.data.roles || [];
  const games = gamesData?.data.games || [];

  const toggleGame = (slug: string) => {
    setInviteGames((prev) => prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug]);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-semibold text-lg">Team Members</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage your team and their access permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0d1f3c] border border-white/10 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowInvite(true); setError(""); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <UserPlus className="w-4 h-4" />
            Invite Member
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No team members yet. Invite someone to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member: TeamMember, i: number) => (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#0d1f3c] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {member.profile?.profilePicture ? (
                    <img src={member.profile.profilePicture} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/10 flex items-center justify-center">
                      <span className="text-blue-400 text-sm font-bold">
                        {(member.profile?.displayName || member.email)[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {member.stats?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d1f3c]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">{member.profile?.displayName || member.email.split("@")[0]}</p>
                    {member.profile?.username && <span className="text-slate-500 text-xs">@{member.profile.username}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[member.status]}`}>
                      {member.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{member.email}</p>
                </div>

                <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                  {member.role && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium border"
                      style={{ color: member.role.color, background: `${member.role.color}15`, borderColor: `${member.role.color}30` }}>
                      {member.role.name}
                    </span>
                  )}
                  {member.claimGames?.length > 0 && (
                    <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full">
                      {member.claimGames.length} game{member.claimGames.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {member.stats && (
                    <div className="text-xs text-slate-500 hidden lg:flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {member.stats.completedClaims} claims
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {member.status === "invited" && (
                    <button onClick={() => resendMut.mutate(member._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-xs transition-colors">
                      <RefreshCw className="w-3 h-3" /> Resend
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${member.profile?.displayName || member.email} from the team? This cannot be undone.`)) {
                        removeMut.mutate(member._id);
                      }
                    }}
                    className="w-7 h-7 rounded-lg bg-red-500/5 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                    title="Remove member"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInvite(false)}>
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">Invite Team Member</h3>
                <button onClick={() => setShowInvite(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="team@example.com"
                      className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Role *</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} required
                    className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="">Select a role</option>
                    {roles.map((r: AdminRole) => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>

                {games.length > 0 && (
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-2">Claim Games (for claim agents)</label>
                    <div className="flex flex-wrap gap-2">
                      {games.map((g: import("../types").Game) => (
                        <button key={g.slug} type="button" onClick={() => toggleGame(g.slug)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                            inviteGames.includes(g.slug)
                              ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                              : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20")}>
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowInvite(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={inviteMut.isPending}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                    {inviteMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send Invitation
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
