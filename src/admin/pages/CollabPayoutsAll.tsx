import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DollarSign, Eye } from "lucide-react";
import { adminApi } from "../api";

function fmt(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CollabPayoutsAll() {
  const { data, isLoading } = useQuery({
    queryKey: ["collab-all-payouts"],
    queryFn: () => adminApi.collab.listAllPayouts(),
  });

  const payouts: any[] = (data as any)?.data?.payouts || [];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>All Payouts</h2>
        <p className="text-sm text-slate-500 mt-0.5">{payouts.length} total payouts</p>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />)}
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No payouts recorded yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Collaborator</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Period End</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Paid At</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Sales</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Amount</th>
                <th className="px-5 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any) => (
                <tr key={p._id} style={{ borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{p.collaborator?.name}</p>
                    <p className="text-xs text-slate-400">{p.collaborator?.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                      style={{ background: "#D1FAE5", color: "#065F46", borderColor: "#6EE7B7" }}>
                      Paid
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{fmt(p.periodEnd)}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{fmt(p.paidAt)}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{p.sales?.length || 0}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold" style={{ color: "#1e1b4b" }}>${p.amount?.toFixed(2)} USD</span>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/collaboration/payouts/${p.collaborator?._id}/detail/${p._id}`}>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#EEF2FF", color: "#4f46e5" }}>
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
