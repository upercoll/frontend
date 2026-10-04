import { useEffect, useState } from "react";
import { useReducedMotion, motion } from "framer-motion";
import {
  Banknote, TrendingUp, Package, Gamepad2, ChevronRight,
  Receipt, Truck, CircleCheck, Send,
} from "lucide-react";
import { Link } from "wouter";
import { delivererGet } from "@/pages/DelivererLayout";
import {
  PageHeader, Card, CardHeader, MetricTile, Badge,
  EmptyState, MetricSkeleton, ListRow, Skeleton,
} from "../../components/kit";

function fmt(n: number) { return `$${n.toFixed(2)}`; }

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DelivererDashboard() {
  const reduce = useReducedMotion();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payoutsData, setPayoutsData] = useState<any>(null);

  useEffect(() => {
    delivererGet("/stats")
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    delivererGet("/payouts")
      .then(res => setPayoutsData(res.data))
      .catch(console.error);
  }, []);

  const d = data?.deliverer;
  const records: any[] = data?.recentDeliveries || [];
  const payouts: any[] = payoutsData?.payouts || [];
  const assignments: { game: string; commissionRate: number }[] = d?.assignments?.length
    ? d.assignments
    : (d?.games || []).map((game: string) => ({ game, commissionRate: d?.commissionRate ?? 20 }));

  const paidTotal = payouts.reduce((s, p) => s + (p.amount || 0), 0);
  const avgCommission = records.length
    ? records.reduce((s, r) => s + (r.commission || 0), 0) / records.length
    : null;

  const rise = reduce ? {} : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: 0.05 },
  };

  return (
    <div className="p-6 space-y-5 max-w-[1100px] mx-auto">

      <PageHeader
        title={`Welcome back, ${d?.name || "Deliverer"}`}
        description="Your delivery summary, updated live."
      >
        <Link href="/deliverer/queue">
          <span className="pn-btn pn-btn--primary">
            <Send className="w-3.5 h-3.5" strokeWidth={2.2} />
            Open queue
          </span>
        </Link>
      </PageHeader>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {loading ? (
          <MetricSkeleton count={3} />
        ) : (
          <>
            <MetricTile label="Unpaid revenue" value={fmt(d?.totalRevenue ?? 0)} hint="earned, not yet settled" icon={Banknote} />
            <MetricTile label="Unpaid commission" value={fmt(d?.totalCommission ?? 0)} hint="yours to be paid" icon={TrendingUp} />
            <MetricTile label="Total delivered" value={(d?.totalDelivered ?? 0).toLocaleString()} hint="all time" icon={Package} />
          </>
        )}
      </div>

      {/* ── Secondary strip ── */}
      <Card>
        <CardHeader title="Snapshot" subtitle="Lifetime + recent performance" icon={CircleCheck} />
        <div>
          <ListRow icon={TrendingUp} title="Lifetime revenue" value={fmt(d?.lifetimeRevenue ?? 0)} />
          <ListRow icon={Banknote} title="Lifetime commission" value={fmt(d?.lifetimeCommission ?? 0)} />
          <ListRow
            icon={Receipt}
            title="Last payout"
            value={d?.lastPayoutAt ? new Date(d.lastPayoutAt).toLocaleDateString() : "Never"}
          />
          {avgCommission !== null && (
            <ListRow icon={TrendingUp} title="Avg. commission per delivery" value={fmt(avgCommission)} />
          )}
        </div>
      </Card>

      {/* ── Assigned games ── */}
      <Card>
        <CardHeader
          title="Assigned games & rates"
          subtitle="Commission paid on each title"
          icon={Gamepad2}
        />
        <div className="pn-cardbody">
          {assignments.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--pn-text-3)" }}>
              No specific game assignments — you're set to handle all games at {d?.commissionRate ?? 20}% commission.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignments.map(a => (
                <Badge key={a.game} tone="warning">{a.game} · {a.commissionRate}%</Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Recent deliveries ── */}
        <Card>
          <CardHeader
            title="Recent deliveries"
            subtitle={`${records.length} most recent`}
            icon={Truck}
            action={
              <Link href="/deliverer/history">
                <span className="pn-btn pn-btn--plain">View all <ChevronRight className="w-3.5 h-3.5" /></span>
              </Link>
            }
          />
          {loading ? (
            <div className="pn-cardbody space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
          ) : records.length === 0 ? (
            <EmptyState icon={Truck} title="No deliveries yet" body="Completed deliveries will appear here with their commission." />
          ) : (
            <div>
              {records.slice(0, 8).map((r, i) => (
                <motion.div key={i} {...(reduce ? {} : rise)}>
                  <ListRow
                    icon={Truck}
                    tone="var(--pn-action)"
                    title={r.robloxUsername || "Unknown"}
                    meta={`${r.game || "—"} · ${r.items?.length ?? 0} item${r.items?.length !== 1 ? "s" : ""} · ${r.commissionRate}% of ${fmt(r.orderTotal || 0)}`}
                    value={<span style={{ color: "var(--pn-success-fg)" }}>{fmt(r.commission)}</span>}
                    right={
                      <span className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge tone={r.paidOut ? "success" : "info"}>{r.paidOut ? "Paid" : "Unpaid"}</Badge>
                        <span className="pn-row__meta">{timeAgo(r.deliveredAt)}</span>
                      </span>
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Payout history ── */}
        <Card>
          <CardHeader
            title="Payout history"
            subtitle={payouts.length ? `Total paid ${fmt(paidTotal)}` : "None yet"}
            icon={Receipt}
          />
          {loading ? (
            <div className="pn-cardbody space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
          ) : payouts.length === 0 ? (
            <EmptyState icon={Receipt} title="No payouts yet" body="Payouts show up here once the admin settles a period." />
          ) : (
            <div>
              {payouts.slice(0, 6).map((p, i) => (
                <ListRow
                  key={i}
                  icon={Receipt}
                  tone="var(--pn-success-fg)"
                  title={fmt(p.amount)}
                  meta={`${p.deliveryCount} deliver${p.deliveryCount === 1 ? "y" : "ies"} covered`}
                  value={<span className="pn-row__meta">{new Date(p.createdAt).toLocaleDateString()}</span>}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Link href="/deliverer/queue">
        <div className="pn-card flex items-center justify-between px-5 py-4 cursor-pointer transition-colors"
             style={{ borderColor: "var(--pn-action-border)", background: "var(--pn-action-tint)" }}>
          <div className="flex items-center gap-3">
            <span className="pn-row__icon" style={{ background: "var(--pn-surface)", borderColor: "var(--pn-action-border)", color: "var(--pn-action)" }}>
              <Package className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--pn-text)" }}>Go to claim queue</p>
              <p className="text-xs" style={{ color: "var(--pn-text-2)" }}>Pick up and deliver pending chats</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: "var(--pn-action)" }} />
        </div>
      </Link>

    </div>
  );
}
