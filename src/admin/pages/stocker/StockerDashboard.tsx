import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useReducedMotion, motion } from "framer-motion";
import {
  Wallet, CircleCheck, Percent, Package, Receipt, ChevronDown,
  ChevronUp, WalletCards, RefreshCw,
} from "lucide-react";
import {
  PageHeader, Card, CardHeader, MetricTile, Badge,
  EmptyState, MetricSkeleton, Skeleton, RowSkeleton,
} from "../../components/kit";

const BASE = import.meta.env.VITE_API_URL || "";
function getToken() { return localStorage.getItem("stocker_token") || ""; }
async function apiGet(path: string) {
  const res = await fetch(`${BASE}/api/stocker${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function fmtDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function StockerDashboard() {
  const [, navigate] = useLocation();
  const reduce = useReducedMotion();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeliveries, setShowDeliveries] = useState(false);

  const load = () => {
    const token = getToken();
    if (!token) { navigate("/stocker/login"); return; }
    setLoading(true);
    setError("");
    Promise.all([apiGet("/auth/me"), apiGet("/payouts")])
      .then(([meRes, payoutsRes]) => {
        setData({ stocker: meRes.data?.stocker || meRes.data?.user, ...payoutsRes.data });
      })
      .catch(err => {
        if (err.message.includes("401") || err.message.toLowerCase().includes("invalid")) {
          localStorage.removeItem("stocker_token"); navigate("/stocker/login");
        } else { setError(err.message); }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const stocker = data?.stocker;
  const unpaidAmount: number = data?.unpaidAmount || 0;
  const totalPaid: number = data?.totalPaid || 0;
  const unpaidDeliveries: any[] = data?.unpaidDeliveries || [];
  const payouts: any[] = data?.payouts || [];

  const rise = reduce ? {} : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: 0.05 },
  };

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-[1100px] mx-auto">
        <PageHeader title="Stocker" description="Loading your account…" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"><MetricSkeleton count={4} /></div>
        <Card><RowSkeleton count={4} /></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-[1100px] mx-auto">
        <Card>
          <EmptyState
            icon={RefreshCw}
            title="Couldn't load your dashboard"
            body={error}
            action={<button className="pn-btn pn-btn--secondary" onClick={load}>Try again</button>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1100px] mx-auto">

      <PageHeader
        title={`Welcome back, ${stocker?.name?.split(" ")[0] || "Stocker"}`}
        description="Track your commission earnings and delivery history."
      >
        <Link href="/stocker/request">
          <span className="pn-btn pn-btn--secondary">New request</span>
        </Link>
      </PageHeader>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricTile label="Pending payout" value={`$${unpaidAmount.toFixed(2)}`} hint="awaiting payment" icon={Wallet} />
        <MetricTile label="Total paid out" value={`$${totalPaid.toFixed(2)}`} hint="all time" icon={CircleCheck} />
        <MetricTile label="Commission rate" value={`${stocker?.commissionRate || 0}%`} hint="per delivery" icon={Percent} />
        <MetricTile label="Deliveries pending" value={unpaidDeliveries.length} hint="in current period" icon={Package} />
      </div>

      {stocker?.cryptoAddress && (
        <motion.div {...rise} className="pn-card flex items-center gap-3 px-5 py-3.5"
                    style={{ background: "var(--pn-action-tint)", borderColor: "var(--pn-action-border)" }}>
          <WalletCards className="w-4 h-4 flex-shrink-0" style={{ color: "var(--pn-action)" }} />
          <p className="text-[13px] flex flex-wrap items-center gap-x-1" style={{ color: "var(--pn-text-2)" }}>
            Payout address:
            <span className="font-mono font-semibold" style={{ color: "var(--pn-text)" }}>{stocker.cryptoAddress}</span>
            {stocker.cryptoNetwork && <Badge tone="neutral">{stocker.cryptoNetwork}</Badge>}
          </p>
        </motion.div>
      )}

      {/* ── Current period ── */}
      <motion.div {...rise}>
        <Card>
          <button className="w-full text-left" onClick={() => setShowDeliveries(v => !v)}>
            <div className="pn-cardhead" style={{ borderBottom: showDeliveries ? "1px solid var(--pn-border)" : "none" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-action)" }}>
                <Receipt className="w-3.5 h-3.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3>Current period — {unpaidDeliveries.length} deliveries</h3>
                <p className="truncate">
                  {unpaidAmount > 0
                    ? `$${unpaidAmount.toFixed(2)} commission pending — admin marks as paid when processed`
                    : "No pending deliveries in this period"}
                </p>
              </div>
              <span style={{ color: "var(--pn-text-3)" }}>
                {showDeliveries ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>
          </button>

          {showDeliveries && (
            unpaidDeliveries.length === 0 ? (
              <EmptyState icon={Package} title="Nothing pending" body="Deliveries logged this period will show up here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Date</th><th>Player</th><th>Game</th>
                      <th>Items</th><th className="text-right">Revenue</th><th className="text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidDeliveries.map((d: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: "var(--pn-text-2)" }}>{fmtDate(d.deliveredAt)}</td>
                        <td className="font-medium" style={{ color: "var(--pn-text)" }}>{d.robloxUsername}</td>
                        <td><Badge tone="action">{d.game || "—"}</Badge></td>
                        <td className="text-xs" style={{ color: "var(--pn-text-2)" }}>
                          {(d.items || []).map((it: any) =>
                            `${it.name || "Item"} ×${Number.isFinite(it.quantity) && it.quantity > 0 ? it.quantity : 1}`
                          ).join(", ")}
                        </td>
                        <td className="text-right font-semibold" style={{ color: "var(--pn-text)" }}>
                          ${(d.revenue || 0).toFixed(2)}
                        </td>
                        <td className="text-right font-semibold" style={{ color: "var(--pn-success-fg)" }}>
                          ${(d.commission || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </Card>
      </motion.div>

      {/* ── Payout history ── */}
      <motion.div {...rise} style={{ transitionDelay: reduce ? "0s" : "0.1s" }}>
        <Card>
          <CardHeader
            title="Payout history"
            subtitle={`${payouts.length} payout${payouts.length === 1 ? "" : "s"}`}
            icon={Wallet}
          />
          {payouts.length === 0 ? (
            <EmptyState icon={Wallet} title="No payouts yet" body="Keep delivering — settled periods will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Paid on</th><th>Period</th>
                    <th className="text-right">Deliveries</th><th className="text-right">Amount</th>
                    <th className="text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p: any, i: number) => (
                    <tr key={i}>
                      <td style={{ color: "var(--pn-text-2)" }}>{fmtDate(p.createdAt)}</td>
                      <td className="text-xs" style={{ color: "var(--pn-text-3)" }}>
                        {fmtDate(p.periodStart)} → {fmtDate(p.periodEnd)}
                      </td>
                      <td className="text-right" style={{ color: "var(--pn-text)" }}>{p.deliveryCount}</td>
                      <td className="text-right font-semibold" style={{ color: "var(--pn-success-fg)" }}>
                        ${(p.amount ?? 0).toFixed(2)}
                      </td>
                      <td className="text-right" style={{ color: "var(--pn-text-2)" }}>{p.commissionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

    </div>
  );
}
