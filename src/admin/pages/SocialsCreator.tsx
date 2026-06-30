import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { adminApi } from "../api";
import { Users, Loader2, ChevronRight, DollarSign, Video } from "lucide-react";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SocialsCreators() {
  const { data, isLoading } = useQuery({
    queryKey: ["socials-creators"],
    queryFn: () => adminApi.socials.listCreators(),
  });

  const creators: any[] = (data as any)?.data?.creators || [];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Social Creators</h2>
        <p className="text-sm text-slate-500 mt-0.5">{creators.length} active creators</p>
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
            <p className="font-medium">No active creators found.</p>
            <p className="text-sm mt-1">Invite collaborators first — once they accept, they appear here.</p>
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
