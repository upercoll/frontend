import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Truck, DollarSign, CheckCircle, Clock, Package,
  Loader2, AlertCircle, Settings, X, ChevronLeft, Gamepad2,
} from "lucide-react";
import { adminApi } from "../../api";

function fmt(n: number) { return `$${Number(n || 0).toFixed(2)}`; }
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ManageAssignmentsModal({ deliverer, onClose }: { deliverer: any; onClose: () => void }) {
  const qc = useQueryClient();
  const existingAssignments = deliverer.assignments?.length
    ? deliverer.assignments
    : (deliverer.games || []).map((game: string) => ({ game, commissionRate: deliverer.commissionRate ?? 20 }));
  const [selectedGames, setSelectedGames] = useState<string[]>(
    existingAssignments.map((assignment: { game: string }) => assignment.game)
  );
  const [ratesByGame, setRatesByGame] = useState<Record<string, string>>(
    Object.fromEntries(existingAssignments.map((assignment: { game: string; commissionRate: number }) => [
      assignment.game,
      String(assignment.commissionRate ?? deliverer.commissionRate ?? 20),
    ]))
  );
  const [error, setError] = useState("");

  const { data: gamesData } = useQuery({
    queryKey: ["games-list-edit"],
    queryFn: adminApi.games.list,
  });
  const games: any[] = gamesData?.data?.games || [];

  const { mutate, isPending } = useMutation({
    // Send the legacy game list too: other delivery endpoints still consume it,
    // while assignments preserves the per-game commission rates.
    mutationFn: () => {
      const assignments = selectedGames.map((game) => ({
        game,
        commissionRate: Number(ratesByGame[game]),
      }));
      return adminApi.delivery.update(deliverer._id, {
        assignments,
        games: selectedGames,
        assignmentRates: Object.fromEntries(assignments.map((assignment) => [assignment.game, assignment.commissionRate])),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery-member", deliverer._id] });
      qc.invalidateQueries({ queryKey: ["delivery-team"] });
      onClose();
    },
    onError: (err: any) => setError(err.message),
  });

  function toggleGame(slug: string) {
    setSelectedGames((current) => {
      if (current.includes(slug)) return current.filter((game) => game !== slug);
      setRatesByGame((rates) => ({
        ...rates,
        [slug]: rates[slug] ?? String(deliverer.commissionRate ?? 20),
      }));
      return [...current, slug];
    });
  }

  function changeRate(slug: string, commissionRate: string) {
    setRatesByGame((rates) => ({ ...rates, [slug]: commissionRate }));
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "#0d1525", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold">Game Assignments & Commission</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <p className="text-white/40 text-xs">Choose the games this deliverer handles and set the commission rate for each one.</p>
          {games.length === 0 ? (
            <p className="text-white/25 text-xs py-4 text-center">No games found</p>
          ) : (
            <div className="space-y-2">
              {games.map((g: any) => {
                const assigned = selectedGames.includes(g.slug);
                return (
                  <div key={g.slug} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: assigned ? "rgba(14,165,233,0.08)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <button type="button" onClick={() => toggleGame(g.slug)}
                      className="flex-1 text-left text-xs font-medium"
                      style={{ color: assigned ? "#7dd3fc" : "rgba(255,255,255,0.45)" }}>
                      {g.name}
                    </button>
                    {assigned ? (
                      <label className="flex items-center gap-1 text-xs text-white/50">
                        <input type="number" min={0} max={100} step="0.01" value={ratesByGame[g.slug] ?? ""}
                          onChange={(e) => changeRate(g.slug, e.target.value)}
                          className="w-16 rounded-lg px-2 py-1.5 text-right text-sm focus:outline-none"
                          style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }} />
                        %
                      </label>
                    ) : <span className="text-[10px] text-white/25">Not assigned</span>}
                  </div>
                );
              })}
            </div>
          )}
          {selectedGames.length === 0 && (
            <p className="text-amber-400/60 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> No games selected — deliverer will see all pending chats
            </p>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)" }}>Cancel</button>
            <button onClick={() => mutate()} disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Assignments
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DeliveryMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showAssignments, setShowAssignments] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paidMsg, setPaidMsg] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["delivery-member", id],
    queryFn: () => adminApi.delivery.get(id),
  });

  const d = data?.data?.deliverer;
  const records: any[] = data?.data?.records || [];
  const stats = data?.data?.stats;

  const handleMarkPaid = async () => {
    const amount = Number(payoutAmount);
    const unpaidCommission = Number(d?.totalCommission || 0);
    if (!Number.isFinite(amount) || amount <= 0 || amount > unpaidCommission) {
      setPaidMsg(`Enter an amount from $0.01 to ${fmt(unpaidCommission)}`);
      return;
    }
    if (!confirm(`Mark ${fmt(amount)} as paid to ${d?.name || d?.email}?`)) return;
    setMarkingPaid(true); setPaidMsg("");
    try {
      const res = await adminApi.delivery.markPaid(id, { amount });
      setPaidMsg(`Paid ${fmt(res.data?.paidCommission ?? 0)} commission on ${fmt(res.data?.paidRevenue ?? 0)} revenue`);
      qc.invalidateQueries({ queryKey: ["delivery-member", id] });
      qc.invalidateQueries({ queryKey: ["delivery-team"] });
    } catch (err: any) {
      setPaidMsg("Error: " + err.message);
    } finally {
      setMarkingPaid(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-32 rounded-xl bg-white/5" />
        <div className="h-32 rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!d) return <div className="text-white/40 text-sm p-8">Deliverer not found</div>;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <AnimatePresence>
        {showAssignments && <ManageAssignmentsModal deliverer={d} onClose={() => setShowAssignments(false)} />}
      </AnimatePresence>

      <Link href="/admin/delivery-team">
        <button className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Delivery Team
        </button>
      </Link>

      {/* Header card */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-xl"
          style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "#fff" }}>
          {(d.name || d.email)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg">{d.name || d.email}</h2>
          <p className="text-white/40 text-sm">{d.email}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: d.status === "active" ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)", color: d.status === "active" ? "#4ade80" : "#fbbf24" }}>
              {d.status}
            </span>
            <span className="text-white/35 text-xs">{d.assignments?.length ? `${d.assignments.length} game rate${d.assignments.length === 1 ? "" : "s"}` : `${d.commissionRate}% commission`}</span>
            {d.lastLogin && <span className="text-white/25 text-xs">Last login: {fmtDate(d.lastLogin)}</span>}
          </div>
          {/* Assigned games display */}
          {(d.assignments?.length > 0 || d.games?.length > 0) && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Gamepad2 className="w-3 h-3 text-sky-400/60" />
              {(d.assignments?.length ? d.assignments : d.games.map((game: string) => ({ game, commissionRate: d.commissionRate }))).map((assignment: { game: string; commissionRate: number }) => (
                <span key={assignment.game} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(14,165,233,0.1)", color: "#7dd3fc", border: "1px solid rgba(14,165,233,0.15)" }}>
                  {assignment.game} · {assignment.commissionRate}%
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          <button onClick={() => setShowAssignments(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Settings className="w-3.5 h-3.5" /> Assignments
          </button>
          <div className="flex items-center gap-2">
            <input type="number" min="0.01" max={d.totalCommission || 0} step="0.01" value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value)} placeholder={`Pay up to ${fmt(d.totalCommission || 0)}`}
              className="w-32 rounded-xl px-3 py-2 text-xs focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
          <button onClick={handleMarkPaid} disabled={markingPaid || (d.totalCommission || 0) === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-colors"
            style={{ background: "rgba(74,222,128,0.9)", border: "1px solid rgba(74,222,128,0.4)" }}>
            {markingPaid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Pay amount
          </button>
          </div>
        </div>
      </div>

      {paidMsg && (
        <div className="px-4 py-3 rounded-xl text-sm text-emerald-400 flex items-center gap-2"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {paidMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Unpaid Revenue",    value: fmt(stats?.totalRevenue ?? 0),    color: "#4ade80" },
          { label: "Unpaid Commission", value: fmt(stats?.totalCommission ?? 0),  color: "#a78bfa" },
          { label: "Lifetime Revenue",  value: fmt(stats?.lifetimeRevenue ?? 0),  color: "#7dd3fc" },
          { label: "Total Deliveries",  value: stats?.totalDeliveries ?? 0,       color: "#fbbf24" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
            <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Delivery records */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Delivery Records ({records.length})</h3>
          {d.lastPayoutAt && <span className="text-white/30 text-xs">Last paid: {fmtDate(d.lastPayoutAt)}</span>}
        </div>
        {records.length === 0 ? (
          <div className="py-12 text-center text-white/25 text-sm">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-20" /> No deliveries recorded
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {records.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: r.paidOut ? "rgba(74,222,128,0.08)" : "rgba(14,165,233,0.08)" }}>
                  {r.paidOut
                    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                    : <Clock className="w-4 h-4 text-sky-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-semibold">{r.robloxUsername || "Unknown"}</p>
                    {r.paidOut
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>Paid</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(14,165,233,0.1)", color: "#7dd3fc" }}>Unpaid</span>}
                  </div>
                  <p className="text-white/35 text-xs mt-0.5">
                    {r.game || "—"}
                    {r.items?.length > 0 && ` · ${r.items.map((it: any) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(", ")}`}
                  </p>
                  {r.orderNumber && <p className="text-white/20 text-[10px] mt-0.5 font-mono">#{r.orderNumber}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-emerald-400 text-sm font-bold">{fmt(r.commission)}</p>
                  <p className="text-white/25 text-[10px]">{r.commissionRate}% of {fmt(r.orderTotal)}</p>
                  <p className="text-white/20 text-[10px] mt-0.5">{fmtDate(r.deliveredAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
