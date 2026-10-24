import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket, Trophy, Clock, Zap, Plus, Trash2, Loader2,
  Check, Settings2, RefreshCw, UserPlus, X, Ban,
} from "lucide-react";
import { adminApi } from "../api";
import { PageHeader, EmptyState } from "../components/kit";

/* ── Raffles — weekly / monthly draws on an auto schedule ─────────────────────────────
   One tab per cadence. Each cadence owns its full configuration: the prize
   ladder (= winner count, capped at $100 per prize), the auto-schedule day
   + hour (UTC) it closes and draws at, and an auto-draw switch (off = entries
   close on schedule but the owner presses "End & draw now"). Global: ticket
   rate + about text.
   Everything the owner asked for lives here too: run "End & draw now" to close a
   period early, hand-pick any entrant as a winner (or add one by email),
   undo an unclaimed pick, void a whole raffle, and edit prize amounts —
   new tiers reprice OPEN draws instantly; finished results are never
   rewritten and claimed prizes can't be touched. */

type RaffleType = "weekly" | "monthly";

const TABS: { type: RaffleType; label: string }[] = [
  { type: "weekly", label: "Weekly Raffle" },
  { type: "monthly", label: "Monthly Raffle" },
];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface RaffleDoc {
  _id: string;
  type: RaffleType;
  number: number;
  status: "active" | "drawing" | "drawn";
  startsAt: string;
  endsAt: string;
  drawnAt: string | null;
  ticketRate: number;
  prizeTiers: number[];
  prizePool: number;
  totalEntrants: number;
  totalTickets: number;
  winners?: {
    position: number; name: string; email: string; tickets: number;
    prize: number; claimed: boolean; promoCode: string | null;
  }[];
}

/** One cadence of the auto schedule (per raffle type). */
interface CadenceSettings {
  enabled: boolean;
  day: number;        // weekly: 0–6 (0 = Sun) · monthly: 1–31
  hour: number;       // 0–23 UTC
  autoDraw: boolean;  // false = the owner draws manually
  tiers: number[];    // prize by position; length = winner count
}

interface RaffleSettings {
  schedule: Record<RaffleType, CadenceSettings>;
  ticketRate: number;
  about: string;
}

interface BoardRow { name: string; email: string; tickets: number; spent: number; }

function when(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function timeLeft(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "any moment now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  return `${h}h ${m}m left`;
}

export default function Raffles() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<RaffleType>("weekly");

  const { data, isLoading } = useQuery({
    queryKey: ["panel-raffles", tab],
    queryFn: () => adminApi.raffles.summary(tab),
    refetchInterval: 30000,
  });
  const summary = data?.data as
    | { current: RaffleDoc | null; last: RaffleDoc | null; settings: RaffleSettings; leaderboard: BoardRow[] }
    | undefined;

  const current = summary?.current || null;
  const last = summary?.last || null;
  const board = summary?.leaderboard || [];

  /* Settings editing state — per-cadence schedule + global rate/about.
     Tiers are edited as strings (input-friendly), cleaned on save. */
  const [rate, setRate] = useState("1");
  const [about, setAbout] = useState("");
  const [dirty, setDirty] = useState(false);
  const emptyCadence = () => ({ enabled: true, day: 1, hour: 0, autoDraw: true, tiers: [] as string[] });
  const [cadence, setCadence] = useState<Record<RaffleType, ReturnType<typeof emptyCadence>>>({
    weekly: emptyCadence(),
    monthly: emptyCadence(),
  });

  useEffect(() => {
    const s = summary?.settings;
    if (s && !dirty) {
      setRate(String(s.ticketRate));
      setAbout(s.about || "");
      setCadence({
        weekly: {
          enabled: s.schedule?.weekly?.enabled ?? true,
          day: s.schedule?.weekly?.day ?? 1,
          hour: s.schedule?.weekly?.hour ?? 0,
          autoDraw: s.schedule?.weekly?.autoDraw ?? true,
          tiers: (s.schedule?.weekly?.tiers || []).map(t => String(t)),
        },
        monthly: {
          enabled: s.schedule?.monthly?.enabled ?? true,
          day: s.schedule?.monthly?.day ?? 1,
          hour: s.schedule?.monthly?.hour ?? 0,
          autoDraw: s.schedule?.monthly?.autoDraw ?? true,
          tiers: (s.schedule?.monthly?.tiers || []).map(t => String(t)),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.settings]);

  /** Winner-count control: grow pads with the smallest current amount,
      shrink trims the tail. The ladder's length IS the winner count. */
  const setWinnerCount = (t: RaffleType, count: number) => {
    const n = Math.min(100, Math.max(1, Math.floor(count) || 1));
    setCadence(c => {
      const cur = c[t].tiers;
      const pad = cur.length ? cur[cur.length - 1] : "5";
      const next = cur.length >= n ? cur.slice(0, n) : [...cur, ...Array(n - cur.length).fill(pad)];
      return { ...c, [t]: { ...c[t], tiers: next } };
    });
    touch();
  };

  const setTiers = (t: RaffleType, v: string[] | ((prev: string[]) => string[])) => {
    setCadence(c => ({ ...c, [t]: { ...c[t], tiers: typeof v === "function" ? v(c[t].tiers) : v } }));
    touch();
  };

  const saveMut = useMutation({
    mutationFn: () => {
      // Clamp to the $100 ceiling and sort highest-first (the backend
      // rejects anything out of order — do it here so the owner never
      // sees that error for a harmless typo).
      const clean = (list: string[]) =>
        list.map(t => Math.min(100, Math.max(0.01, Number(t) || 0.01))).sort((a, b) => b - a);
      const schedule: Record<string, unknown> = {};
      for (const t of TABS) {
        const c = cadence[t.type];
        const tiers = clean(c.tiers);
        setCadence(prev => ({ ...prev, [t.type]: { ...prev[t.type], tiers: tiers.map(String) } }));
        schedule[t.type] = { day: c.day, hour: c.hour, autoDraw: c.autoDraw, tiers };
      }
      return adminApi.raffles.updateSettings({
        enabled: { weekly: cadence.weekly.enabled, monthly: cadence.monthly.enabled },
        ticketRate: Number(rate),
        about,
        schedule,
      });
    },
    onSuccess: () => {
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["panel-raffles"] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const drawMut = useMutation({
    mutationFn: (id: string) => adminApi.raffles.drawNow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-raffles"] }),
    onError: (err: Error) => alert(err.message),
  });

  /* Hand-picked winners — the owner names a winner directly instead of
     waiting for the random draw. Prize defaults to the next open tier. */
  const pickMut = useMutation({
    mutationFn: ({ id, email, prize }: { id: string; email: string; prize?: number }) =>
      adminApi.raffles.addWinner(id, { email, prize }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-raffles"] }),
    onError: (err: Error) => alert(err.message),
  });
  const unpickMut = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      adminApi.raffles.removeWinner(id, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-raffles"] }),
    onError: (err: Error) => alert(err.message),
  });
  const voidMut = useMutation({
    mutationFn: (id: string) => adminApi.raffles.voidRaffle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-raffles"] }),
    onError: (err: Error) => alert(err.message),
  });

  const nextPrize = (r: RaffleDoc) =>
    r.prizeTiers[(r.winners?.length ?? 0)] ?? r.prizeTiers[r.prizeTiers.length - 1] ?? 10;

  const pickWinner = (r: RaffleDoc, email: string, name?: string) => {
    const def = String(nextPrize(r));
    const raw = prompt(
      `Prize for ${name || email} (max $100):`,
      def
    );
    if (raw === null) return;
    const prize = Number(raw);
    if (!Number.isFinite(prize) || prize <= 0) { alert("Enter a positive amount."); return; }
    pickMut.mutate({ id: r._id, email, prize });
  };

  const addWinnerByEmail = (r: RaffleDoc) => {
    const email = prompt("Winner's account email:")?.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    pickWinner(r, email);
  };

  const poolOf = (t: RaffleType) =>
    cadence[t].tiers.reduce((s, v) => s + (Number(v) || 0), 0);
  const touch = () => setDirty(true);

  const statusChip = (r: RaffleDoc | null) => {
    if (!r) return null;
    if (r.status === "drawn") return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-[var(--pn-success-fg)] bg-[var(--pn-success-bg)]">Drawn</span>;
    if (r.status === "drawing") return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-[var(--pn-warning-fg)] bg-[var(--pn-warning-bg)]">Drawing…</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-[var(--pn-action)] bg-[var(--pn-action-tint)]">Live</span>;
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <PageHeader
        title="Raffles"
        description="Weekly & monthly draws on your auto schedule — every $1 of paid spend is a ticket"
      >
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => qc.invalidateQueries({ queryKey: ["panel-raffles"] })}
            className="flex items-center gap-2 bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text-2)] px-3.5 py-2.5 rounded-xl text-sm font-medium">
            <RefreshCw className="w-4 h-4" /> Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => saveMut.mutate()}
            disabled={!dirty || saveMut.isPending}
            className="flex items-center gap-2 bg-[var(--pn-primary)] hover:bg-[var(--pn-primary-hover)] text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save settings
          </motion.button>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.type}
            onClick={() => setTab(t.type)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
            style={{
              background: tab === t.type ? "var(--pn-action-tint)" : "var(--pn-surface)",
              borderColor: tab === t.type ? "var(--pn-action-border)" : "var(--pn-border)",
              color: tab === t.type ? "var(--pn-action)" : "var(--pn-text-2)",
            }}
          >
            <Ticket className="w-4 h-4" /> {t.label}
            {summary && summary.settings.schedule?.[t.type] && !summary.settings.schedule[t.type].enabled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--pn-surface-2)] text-[var(--pn-text-3)]">off</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[var(--pn-surface)] rounded-xl border border-[var(--pn-border)] animate-pulse" />)}
        </div>
      ) : !current && !last ? (
        <EmptyState
          icon={Ticket}
          title={`No ${tab} raffle yet — enable it in settings and it opens automatically.`}
        />
      ) : (
        <>
          {/* Current draw */}
          {current && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--pn-warning-bg)] border border-[var(--pn-border)] flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-[var(--pn-warning-fg)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[var(--pn-text)] font-bold">
                      {TABS.find(t => t.type === current.type)?.label} #{current.number}
                    </span>
                    {statusChip(current)}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap text-[var(--pn-text-2)] text-xs">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {when(current.startsAt)} → {when(current.endsAt)} ({timeLeft(current.endsAt)})</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> ${current.prizePool.toLocaleString()} pool · {current.prizeTiers.length} winners</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {current.status === "active" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (confirm(`End ${current.type} raffle #${current.number} now and pick winners? Real orders decide the draws.`)) {
                          drawMut.mutate(current._id);
                        }
                      }}
                      disabled={drawMut.isPending}
                      className="flex items-center gap-2 bg-[var(--pn-warning-bg)] text-[var(--pn-warning-fg)] border border-[var(--pn-border)] px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                      {drawMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} End &amp; draw now
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => addWinnerByEmail(current)}
                    disabled={pickMut.isPending}
                    className="flex items-center gap-2 bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text-2)] px-3.5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
                    title="Name a winner by email — works on open and drawn raffles">
                    <UserPlus className="w-4 h-4" /> Pick winner
                  </motion.button>
                  {current.status !== "drawing" && !current.winners?.some(w => w.claimed) && (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (confirm(`Void ${current.type} raffle #${current.number}? Every prize is cancelled and nobody can claim.`)) {
                          voidMut.mutate(current._id);
                        }
                      }}
                      disabled={voidMut.isPending}
                      className="flex items-center gap-2 bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-critical-text)] px-3.5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                    {voidMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Void
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Live leaderboard while the draw is open */}
              {current.status === "active" && (
                <div className="mt-4">
                  <p className="text-[var(--pn-text-3)] text-xs font-semibold uppercase tracking-wider mb-2">
                    Leading tickets {board.length > 0 && `· top ${board.length}`}
                  </p>
                  {board.length === 0 ? (
                    <p className="text-[var(--pn-text-3)] text-sm py-3">No paid orders in this period yet — the first order opens the board.</p>
                  ) : (
                    <div className="rounded-xl border border-[var(--pn-border)] overflow-hidden">
                      <div className="grid grid-cols-[40px_1fr_1fr_90px_90px_80px] px-4 py-2.5 bg-[var(--pn-surface-2)] text-[var(--pn-text-3)] text-xs font-semibold">
                        <span>#</span><span>Roblox user</span><span className="hidden sm:block">Email</span><span>Spent</span><span className="text-right">Tickets</span><span className="text-right">Action</span>
                      </div>
                      {board.map((row, i) => {
                        const picked = current.winners?.some(w => w.email === row.email);
                        return (
                          <div key={row.email} className="grid grid-cols-[40px_1fr_1fr_90px_90px_80px] px-4 py-2.5 border-t border-[var(--pn-border)] text-sm items-center">
                            <span className="text-[var(--pn-text-3)]">{i + 1}</span>
                            <span className="text-[var(--pn-text)] font-medium truncate">{row.name}</span>
                            <span className="text-[var(--pn-text-2)] truncate hidden sm:block">{row.email}</span>
                            <span className="text-[var(--pn-text-2)]">${row.spent.toFixed(2)}</span>
                            <span className="text-right font-bold text-[var(--pn-text)]">{row.tickets.toLocaleString()}</span>
                            <span className="text-right">
                              {picked ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium text-[var(--pn-success-fg)] bg-[var(--pn-success-bg)]">
                                  <Check className="w-3 h-3" /> Winner
                                </span>
                              ) : (
                                <button
                                  onClick={() => pickWinner(current, row.email, row.name)}
                                  disabled={pickMut.isPending}
                                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-[var(--pn-action-border)] text-[var(--pn-action)] bg-[var(--pn-action-tint)] hover:opacity-80 disabled:opacity-50">
                                  Pick
                                </button>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Hand-picked so far — shows on an open draw before the
                      random fill runs; each unclaimed one can be undone. */}
                  {current.winners && current.winners.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[var(--pn-text-3)] text-xs font-semibold uppercase tracking-wider">Picked so far:</span>
                      {current.winners.map(w => (
                        <span key={w.email} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-[var(--pn-action-border)] text-[var(--pn-action)] bg-[var(--pn-action-tint)]">
                          #{w.position} {w.name} · ${w.prize}
                          {!w.claimed && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${w.name} as a winner?`)) unpickMut.mutate({ id: current._id, email: w.email });
                              }}
                              className="hover:text-[var(--pn-critical-text)]"
                              title="Undo this pick">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Last results */}
          {last && (
            <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--pn-border)] flex items-center gap-2 flex-wrap">
                <Trophy className="w-4 h-4 text-[var(--pn-warning-fg)]" />
                <h3 className="text-[var(--pn-text)] font-semibold text-sm">
                  {TABS.find(t => t.type === last.type)?.label} #{last.number} — winners
                </h3>
                <span className="text-[var(--pn-text-3)] text-xs ml-auto">
                  Drawn {when(last.drawnAt)} · {last.totalEntrants.toLocaleString()} entrants · {last.totalTickets.toLocaleString()} tickets
                </span>
                {!last.winners?.some(w => w.claimed) && (
                  <button
                    onClick={() => addWinnerByEmail(last)}
                    disabled={pickMut.isPending}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--pn-border)] text-[var(--pn-text-2)] hover:border-[var(--pn-action-border)] hover:text-[var(--pn-action)] disabled:opacity-50">
                    <UserPlus className="w-3.5 h-3.5" /> Add winner
                  </button>
                )}
              </div>
              {!last.winners || last.winners.length === 0 ? (
                <p className="text-[var(--pn-text-3)] text-sm p-5">Drawn with no entries — nobody ordered inside this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--pn-surface-2)] text-[var(--pn-text-3)] text-xs font-semibold">
                        <th className="text-left px-4 py-2.5 w-14">#</th>
                        <th className="text-left px-4 py-2.5">Winner</th>
                        <th className="text-left px-4 py-2.5 hidden sm:table-cell">Email</th>
                        <th className="text-right px-4 py-2.5">Tickets</th>
                        <th className="text-right px-4 py-2.5">Prize</th>
                        <th className="text-right px-4 py-2.5">Claim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {last.winners.map(w => (
                        <tr key={w.position} className="border-t border-[var(--pn-border)]">
                          <td className="px-4 py-2.5 text-[var(--pn-text-3)]">{w.position}</td>
                          <td className="px-4 py-2.5 text-[var(--pn-text)] font-medium">{w.name}</td>
                          <td className="px-4 py-2.5 text-[var(--pn-text-2)] hidden sm:table-cell">{w.email}</td>
                          <td className="px-4 py-2.5 text-right text-[var(--pn-text-2)]">{w.tickets.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[var(--pn-success-fg)]">${w.prize.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="inline-flex items-center gap-2">
                              {w.claimed ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium text-[var(--pn-success-fg)] bg-[var(--pn-success-bg)]">
                                  <Check className="w-3 h-3" /> {w.promoCode || "Claimed"}
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-[var(--pn-text-3)] bg-[var(--pn-surface-2)]">Waiting</span>
                              )}
                              {!w.claimed && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Remove ${w.name} as a winner of #${last.number}?`)) unpickMut.mutate({ id: last._id, email: w.email });
                                  }}
                                  disabled={unpickMut.isPending}
                                  className="w-6 h-6 rounded grid place-items-center text-[var(--pn-text-3)] hover:text-[var(--pn-critical-text)] disabled:opacity-50"
                                  title="Remove this winner (claimed prizes are locked)">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </>
      )}

      {/* Settings — always visible, even when a cadence is paused, so the
          owner can re-enable it. Global: rate + about. Per cadence: the
          auto-schedule (day + hour UTC, auto-draw switch) and the prize
          ladder whose length sets the winner count. */}
      <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Settings2 className="w-4 h-4 text-[var(--pn-action)]" />
          <h3 className="text-[var(--pn-text)] font-semibold text-sm">Raffle settings</h3>
          <span className="text-[var(--pn-text-3)] text-xs ml-auto">
            New ladders reprice open draws instantly · schedule changes re-time the live draw ·
            max $100 per prize · finished results are never rewritten
          </span>
        </div>

        <div className="grid sm:grid-cols-[180px_1fr] gap-4">
          <div>
            <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Tickets per $1 spent</label>
            <input
              type="number" min="0.01" step="0.01" value={rate}
              onChange={e => { setRate(e.target.value); touch(); }}
              className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
            />
          </div>
          <div>
            <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">About text (shown on the public page)</label>
            <textarea
              value={about} rows={3} maxLength={1200}
              onChange={e => { setAbout(e.target.value); touch(); }}
              className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)] resize-y"
            />
          </div>
        </div>

        {TABS.map(t => {
          const c = cadence[t.type];
          const isWeekly = t.type === "weekly";
          return (
            <div key={t.type} className="bg-[var(--pn-surface-2)] border border-[var(--pn-border)] rounded-xl p-4 space-y-3">
              {/* Cadence header: on/off + label + pool summary */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.enabled}
                    onChange={e => { setCadence(s => ({ ...s, [t.type]: { ...s[t.type], enabled: e.target.checked } })); touch(); }}
                    className="w-4 h-4 accent-[var(--pn-primary)]"
                  />
                  <span className="text-sm font-semibold text-[var(--pn-text)]">{t.label}</span>
                </label>
                <span className="text-xs text-[var(--pn-text-3)]">
                  {c.tiers.length} winner{c.tiers.length === 1 ? "" : "s"} · ${poolOf(t.type).toLocaleString()} pool
                </span>
                {!c.enabled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[var(--pn-surface)] text-[var(--pn-text-3)] border border-[var(--pn-border)]">Paused</span>
                )}
              </div>

              {/* Auto schedule: day + hour (UTC) + auto-draw switch */}
              <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <div>
                  <label className="text-[var(--pn-text-3)] text-xs font-medium block mb-1.5">
                    {isWeekly ? "Draw day (each week)" : "Draw day (each month)"}
                  </label>
                  {isWeekly ? (
                    <select
                      value={c.day}
                      onChange={e => { setCadence(s => ({ ...s, [t.type]: { ...s[t.type], day: Number(e.target.value) } })); touch(); }}
                      className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                    >
                      {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                    </select>
                  ) : (
                    <input
                      type="number" min="1" max="31" value={c.day}
                      onChange={e => { setCadence(s => ({ ...s, [t.type]: { ...s[t.type], day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) } })); touch(); }}
                      className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                    />
                  )}
                </div>
                <div>
                  <label className="text-[var(--pn-text-3)] text-xs font-medium block mb-1.5">Draw time (UTC)</label>
                  <input
                    type="number" min="0" max="23" value={c.hour}
                    onChange={e => { setCadence(s => ({ ...s, [t.type]: { ...s[t.type], hour: Math.min(23, Math.max(0, Number(e.target.value) || 0)) } })); touch(); }}
                    className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                  <input
                    type="checkbox"
                    checked={c.autoDraw}
                    onChange={e => { setCadence(s => ({ ...s, [t.type]: { ...s[t.type], autoDraw: e.target.checked } })); touch(); }}
                    className="w-4 h-4 accent-[var(--pn-primary)]"
                  />
                  <span className="text-sm font-medium text-[var(--pn-text)]">Auto-draw</span>
                  <span className="text-xs text-[var(--pn-text-3)]" title="When off, entries stop at the scheduled time but you press End & draw now yourself">
                    {c.autoDraw
                      ? (isWeekly ? `Draws ${WEEKDAYS[c.day]} ${String(c.hour).padStart(2, "0")}:00 UTC` : `Draws day ${c.day} ${String(c.hour).padStart(2, "0")}:00 UTC`)
                      : "Manual — you press Draw"}
                  </span>
                </label>
              </div>

              {/* Winners count + prize ladder */}
              <div className="grid sm:grid-cols-[130px_1fr] gap-4 items-start">
                <div>
                  <label className="text-[var(--pn-text-3)] text-xs font-medium block mb-1.5">Winners</label>
                  <input
                    type="number" min="1" max="100" value={c.tiers.length}
                    onChange={e => setWinnerCount(t.type, Number(e.target.value))}
                    className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[var(--pn-text-3)] text-xs font-medium">
                      Prize amounts — position 1 is the grand prize (max $100 each)
                    </label>
                    <button
                      onClick={() => setTiers(t.type, v => [...v, "5"])}
                      className="flex items-center gap-1 text-xs font-semibold text-[var(--pn-action)]">
                      <Plus className="w-3.5 h-3.5" /> Add prize
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.tiers.map((v, i) => (
                      <div key={i} className="flex items-center gap-1 bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-lg pl-2 pr-1 py-1">
                        <span className="text-[var(--pn-text-3)] text-xs">$</span>
                        <input
                          type="number" min="0.01" max="100" step="0.01" value={v}
                          onChange={e => setTiers(t.type, arr => { const next = [...arr]; next[i] = e.target.value; return next; })}
                          className="w-16 bg-transparent text-[var(--pn-text)] text-sm focus:outline-none"
                        />
                        <button
                          onClick={() => setTiers(t.type, arr => arr.filter((_, j) => j !== i))}
                          className="w-5 h-5 rounded grid place-items-center text-[var(--pn-text-3)] hover:text-[var(--pn-critical-text)]">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {c.tiers.length === 0 && (
                      <span className="text-[var(--pn-text-3)] text-sm">No prizes — set at least one.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
