import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Mail, RefreshCw, UserX, X, Loader2, Activity,
  Trash2, ChevronDown,
} from "lucide-react";
import { adminApi } from "../api";
import type { TeamMember, AdminRole } from "../types";
import { useAdminAuth } from "../context/AdminAuthContext";
import { PageHeader } from "../components/kit";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active:   { bg: "var(--pn-success-bg)", text: "var(--pn-success-fg)" },
  invited:  { bg: "var(--pn-warning-bg)", text: "var(--pn-warning-fg)" },
  disabled: { bg: "var(--pn-surface-2)", text: "var(--pn-text-2)" },
};

export default function Team() {
  const qc = useQueryClient();
  const { isOwner } = useAdminAuth();
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panel-team"] });
      setShowInvite(false);
      setInviteEmail(""); setInviteRole(""); setInviteGames([]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const removeMut = useMutation({
    mutationFn: adminApi.team.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-team"] }),
  });

  const hardDeleteMut = useMutation({
    mutationFn: adminApi.team.hardDelete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-team"] }),
    onError: (err: Error) => alert(err.message),
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

  const toggleGame = (slug: string) =>
    setInviteGames((prev) => prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug]);

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <PageHeader title="Team Members" description="Manage your team and their access permissions">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
            style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowInvite(true); setError(""); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "var(--pn-primary)" }}
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </motion.button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16" style={{ background: "white", border: "1px solid var(--pn-border)", borderRadius: "0.75rem" }}>
          <UserPlus className="w-12 h-12 mx-auto mb-3 text-[var(--pn-text-3)]" />
          <p className="text-[var(--pn-text-3)]">No team members yet. Invite someone to get started.</p>
        </div>
      ) : (
        <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)" }}>
          {members.map((member: TeamMember, i: number) => {
            const st = STATUS_STYLES[member.status] || STATUS_STYLES.disabled;
            return (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-4 transition-colors group"
                style={{ borderBottom: i < members.length - 1 ? "1px solid var(--pn-border)" : "none" }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    {member.profile?.profilePicture ? (
                      <img src={member.profile.profilePicture} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "var(--pn-action)" }}>
                        <span className="text-white text-sm font-bold">
                          {(member.profile?.displayName || member.email)[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    {member.stats?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--pn-success-fg)] rounded-full border-2 border-[var(--pn-border)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm" style={{ color: "var(--pn-text)" }}>
                        {member.profile?.displayName || member.email.split("@")[0]}
                      </p>
                      {member.profile?.username && (
                        <span className="text-xs text-[var(--pn-text-3)]">@{member.profile.username}</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: st.bg, color: st.text }}>
                        {member.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--pn-text-3)] mt-0.5 truncate">{member.email}</p>
                  </div>

                  <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                    {member.role && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                        style={{ color: member.role.color, background: `color-mix(in srgb, ${member.role.color} 14%, transparent)`, borderColor: `color-mix(in srgb, ${member.role.color} 28%, transparent)` }}>
                        {member.role.name}
                      </span>
                    )}
                    {member.claimGames?.length > 0 && (
                      <span className="text-xs text-[var(--pn-text-2)] px-2.5 py-1 rounded-full" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
                        {member.claimGames.length} game{member.claimGames.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {member.stats && (
                      <div className="text-xs text-[var(--pn-text-3)] hidden lg:flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {member.stats.completedClaims} claims
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(member.status === "invited" || member.status === "disabled") && (
                      <button
                        onClick={() => resendMut.mutate(member._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                      >
                        <RefreshCw className="w-3 h-3" />
                        {member.status === "disabled" ? "Re-invite" : "Resend"}
                      </button>
                    )}
                    {member.status === "active" && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Disable ${member.profile?.displayName || member.email}? They will lose access immediately.`)) {
                            removeMut.mutate(member._id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: "var(--pn-critical-bg)", color: "var(--pn-critical-text)" }}
                        title="Disable member"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => {
                          const name = member.profile?.displayName || member.email;
                          const msg = member.status === "active"
                            ? `PERMANENTLY DELETE ${name}? They are currently active and will lose all access. This cannot be undone.`
                            : `PERMANENTLY DELETE ${name}? This cannot be undone.`;
                          if (window.confirm(msg)) {
                            hardDeleteMut.mutate(member._id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: "var(--pn-critical-bg)", color: "var(--pn-critical-text)" }}
                        title="Permanently delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="pn-modal w-full max-w-md overflow-hidden"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                <h3 className="font-bold text-lg" style={{ color: "var(--pn-text)" }}>Invite Team Member</h3>
                <button
                  onClick={() => setShowInvite(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "var(--pn-surface-2)", color: "var(--pn-text-2)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pn-text-3)]" />
                    <input
                      type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required
                      placeholder="team@example.com"
                      className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>Role *</label>
                  <select
                    value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} required
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                  >
                    <option value="">Select a role</option>
                    {roles.map((r: AdminRole) => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>

                {games.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold block mb-2" style={{ color: "var(--pn-text)" }}>Claim Games</label>
                    <div className="flex flex-wrap gap-2">
                      {games.map((g: import("../types").Game) => (
                        <button
                          key={g.slug} type="button" onClick={() => toggleGame(g.slug)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                          style={inviteGames.includes(g.slug)
                            ? { background: "var(--pn-action-tint)", borderColor: "var(--pn-action-border)", color: "var(--pn-action)" }
                            : { background: "var(--pn-surface-2)", borderColor: "var(--pn-border)", color: "var(--pn-text-2)" }}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-sm rounded-xl px-4 py-3" style={{ background: "var(--pn-critical-bg)", border: "1px solid var(--pn-critical-line)", color: "var(--pn-critical-text)" }}>
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button" onClick={() => setShowInvite(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit" disabled={inviteMut.isPending}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "var(--pn-primary)" }}
                  >
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
