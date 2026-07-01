import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { adminApi } from "../api";
import { Users, Loader2, ChevronRight, DollarSign, Video, UserPlus, X, AlertCircle, CheckCircle } from "lucide-react";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      await adminApi.socials.inviteCreator(name.trim(), email.trim());
      setSuccess(`Invite sent to ${email}`);
      setName(""); setEmail("");
      qc.invalidateQueries({ queryKey: ["socials-creators"] });
    } catch (err: any) {
      setError(err.message || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" style={{ border: "1px solid #E9EBF5" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base" style={{ color: "#1e1b4b" }}>Invite Social Creator</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600"
            style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          They'll receive an email with a link to set up their account on the Creator Portal.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Smith"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@example.com"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }} />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#4f46e5" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SocialsCreators() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["socials-creators"],
    queryFn: () => adminApi.socials.listCreators(),
  });

  const creators: any[] = (data as any)?.data?.creators || [];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Social Creators</h2>
          <p className="text-sm text-slate-500 mt-0.5">{creators.length} active creator{creators.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#4f46e5" }}>
          <UserPlus className="w-4 h-4" /> Invite Creator
        </button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No active creators yet.</p>
            <p className="text-sm mt-1">Use the "Invite Creator" button above to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Creator</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Submissions</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">In Review</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Accepted</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Pending Payout</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Total Paid</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Last Payout</th>
                <th className="px-5 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c: any) => {
                const s = c.socialStats || {};
                const hasPending = (s.pendingPayout || 0) > 0;
                return (
                  <tr key={c._id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{c.name}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{s.total ?? 0}</span>
                        {s.paid > 0 && <span className="text-xs text-slate-400">({s.paid} paid)</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{s.inReview ?? 0}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{s.accepted ?? 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      {hasPending ? (
                        <span className="text-sm font-bold" style={{ color: "#059669" }}>
                          ${(s.pendingPayout || 0).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {s.totalPaid > 0
                        ? <span className="text-sm font-semibold text-slate-700">${(s.totalPaid).toFixed(2)}</span>
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{fmtDate(c.lastSocialPayoutAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/socials/creators/${c._id}`}>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: "#EEF2FF", color: "#4f46e5" }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#E0E7FF"}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"}>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
