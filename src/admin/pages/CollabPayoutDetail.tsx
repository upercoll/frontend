import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ChevronLeft, DollarSign } from "lucide-react";
import { adminApi } from "../api";

function fmt(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
import { PageHeader } from "../components/kit";

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
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--pn-surface-2)" }} />)}
      </div>
    );
  }

  if (!payout) return <div className="p-6 text-[var(--pn-text-3)]">Payout not found.</div>;

  return (
    <div className="p-6 space-y-5 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/admin/collaboration/payouts/${id}`}>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Link>
        <PageHeader title="Payout Detail" icon={DollarSign}
          description={<>Paid at {fmt(payout.paidAt)} · To: {payout.collaborator?.name} ({payout.collaborator?.email})</>}>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
            style={{ background: "var(--pn-success-bg)", color: "var(--pn-success-fg)", borderColor: "var(--pn-success-line)" }}>
            Manually Paid
          </span>
        </PageHeader>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[var(--pn-text-3)]" />
            <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Payout Total</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--pn-text)" }}>${payoutTotal.toFixed(2)} USD</p>
        </div>
        <div className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[var(--pn-text-3)]" />
            <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Order Total</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--pn-text)" }}>${orderTotal.toFixed(2)} USD</p>
        </div>
        <div className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[var(--pn-text-3)]" />
            <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Expenses Total</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--pn-text)" }}>$0.00 USD</p>
        </div>
      </div>

      <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {sales.length === 0 ? (
          <div className="p-12 text-center text-[var(--pn-text-3)]">No sales in this payout.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Order Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Item</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--pn-border)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-5 py-3.5 text-sm text-[var(--pn-text-2)]">{fmt(s.orderDate)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium" style={{ color: "var(--pn-action)" }}>#{s.orderNumber?.replace("RB-", "")}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--pn-text)" }}>{s.productName}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--pn-text-3)]">{s.sku || "-"}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--pn-text)" }}>${s.earnings?.toFixed(2)} USD</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
