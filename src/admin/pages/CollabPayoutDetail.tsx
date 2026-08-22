import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ChevronLeft, DollarSign } from "lucide-react";
import { adminApi } from "../api";

function fmt(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CollabPayoutDetail() {
  const [, params] = useRoute("/admin/collaboration/payouts/:id/detail/:payoutId");
  const id = params?.id || "";
  const payoutId = params?.payoutId || "";

  const { data, isLoading } = useQuery({
    queryKey: ["collab-payout-detail", payoutId],
    queryFn: () => adminApi.collab.getPayoutDetail(id, payoutId),
    enabled: !!payoutId,
  });

  const payout = (data as any)?.data?.payout;
  const sales: any[] = payout?.sales || [];

  const orderTotal = sales.reduce((s: number, i: any) => s + (i.orderTotal || 0), 0);
  const payoutTotal = payout?.amount || 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-3 max-w-[1000px] mx-auto">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />)}
      </div>
    );
  }

  if (!payout) return <div className="p-6 text-slate-400">Payout not found.</div>;

  return (
    <div className="p-6 space-y-5 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/admin/collaboration/payouts/${id}`}>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Payout Detail</h2>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
              style={{ background: "#D1FAE5", color: "#065F46", borderColor: "#6EE7B7" }}>
              Manually Paid
            </span>
          </div>
          <p className="text-sm text-slate-500">Paid at {fmt(payout.paidAt)} · To: {payout.collaborator?.name} ({payout.collaborator?.email})</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payout Total</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#1e1b4b" }}>${payoutTotal.toFixed(2)} USD</p>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Order Total</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#1e1b4b" }}>${orderTotal.toFixed(2)} USD</p>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Expenses Total</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#1e1b4b" }}>$0.00 USD</p>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {sales.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No sales in this payout.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Order Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Item</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{fmt(s.orderDate)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium" style={{ color: "#4f46e5" }}>#{s.orderNumber?.replace("RB-", "")}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "#1e1b4b" }}>{s.productName}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{s.sku || "-"}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "#1e1b4b" }}>${s.earnings?.toFixed(2)} USD</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
