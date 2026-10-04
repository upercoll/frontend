import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DollarSign, Eye } from "lucide-react";
import { adminApi } from "../api";

function fmt(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
import { PageHeader } from "../components/kit";

export default function CollabPayoutsAll() {
  const { data, isLoading } = useQuery({
    queryKey: ["collab-all-payouts"],
    queryFn: () => adminApi.collab.listAllPayouts(),
  });

  const payouts: any[] = (data as any)?.data?.payouts || [];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <PageHeader title="All Payouts" description={`${payouts.length} total payouts`} icon={DollarSign} />

      <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "var(--pn-surface-2)" }} />)}
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-16 text-center text-[var(--pn-text-3)]">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No payouts recorded yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Collaborator</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Period End</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Paid At</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Sales</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Amount</th>
                <th className="px-5 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any) => (
                <tr key={p._id} style={{ borderBottom: "1px solid var(--pn-border)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>{p.collaborator?.name}</p>
                    <p className="text-xs text-[var(--pn-text-3)]">{p.collaborator?.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                      style={{ background: "var(--pn-success-bg)", color: "var(--pn-success-fg)", borderColor: "var(--pn-success-line)" }}>
                      Paid
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--pn-text-2)]">{fmt(p.periodEnd)}</td>
                  <td className="px-5 py-4 text-sm text-[var(--pn-text-2)]">{fmt(p.paidAt)}</td>
                  <td className="px-5 py-4 text-sm text-[var(--pn-text-2)]">{p.sales?.length || 0}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold" style={{ color: "var(--pn-text)" }}>${p.amount?.toFixed(2)} USD</span>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/collaboration/payouts/${p.collaborator?._id}/detail/${p._id}`}>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
