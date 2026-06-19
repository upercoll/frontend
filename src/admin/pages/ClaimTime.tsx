import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, Loader2, Gamepad2, Save, CheckCircle2, XCircle } from "lucide-react";
import { adminApi } from "../api";
import type { Game } from "../types";

function getGmt3Hhmm() {
  const gmt3 = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return `${String(gmt3.getUTCHours()).padStart(2, "0")}:${String(gmt3.getUTCMinutes()).padStart(2, "0")}`;
}

function isInWindow(from: string, to: string): boolean {
  if (!from || !to) return false;
  const hhmm = getGmt3Hhmm();
  return from <= to
    ? hhmm >= from && hhmm <= to
    : hhmm >= from || hhmm <= to;
}

function fmtCountdown(toHhmm: string) {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const [toH, toM] = toHhmm.split(":").map(Number);
  const end = new Date(now);
  end.setUTCHours(toH, toM, 0, 0);
  if (end <= now) end.setUTCDate(end.getUTCDate() + 1);
  const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function GameClaimCard({ game, idx }: { game: Game; idx: number }) {
  const qc = useQueryClient();

  const existingSlot = game.claimSchedule?.[0];
  const [from, setFrom] = useState<string>(existingSlot?.from ?? "");
  const [to, setTo]   = useState<string>(existingSlot?.to ?? "");
  const [dirty, setDirty] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const active = from && to ? isInWindow(from, to) : false;

  const saveMut = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("name", game.name);
      form.append("slug", game.slug);
      form.append("claimTime", "0");
      if (from && to) {
        form.append("claimSchedule", JSON.stringify([{ from, to, minutes: 1, label: "Claim Window" }]));
      } else {
        form.append("claimSchedule", JSON.stringify([]));
      }
      return adminApi.games.update(game.slug, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-games"] });
      setDirty(false);
    },
  });

  function change(field: "from" | "to", val: string) {
    if (field === "from") setFrom(val);
    else setTo(val);
    setDirty(true);
  }

  function clear() {
    setFrom("");
    setTo("");
    setDirty(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="bg-[#0d1f3c] border border-white/5 rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            alt=""
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${game.gradient?.from ?? "#6366f1"}, ${game.gradient?.to ?? "#8b5cf6"})` }}
          >
            <Gamepad2 className="w-5 h-5 text-white/50" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{game.name}</p>
          <div className="mt-0.5">
            {!from && !to ? (
              <span className="text-[11px] text-slate-600">No claim window set — always closed</span>
            ) : active ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}
              >
                <CheckCircle2 className="w-3 h-3" />
                OPEN · closes in {fmtCountdown(to)}
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
              >
                <XCircle className="w-3 h-3" />
                CLOSED · opens at {from} GMT+3 in {fmtCountdown(from)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[110px]">
          <label className="text-slate-400 text-[11px] font-medium block mb-1">Open from (GMT+3)</label>
          <input
            type="time"
            value={from}
            onChange={e => change("from", e.target.value)}
            className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex-1 min-w-[110px]">
          <label className="text-slate-400 text-[11px] font-medium block mb-1">Until (GMT+3)</label>
          <input
            type="time"
            value={to}
            onChange={e => change("to", e.target.value)}
            className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2 pb-0.5">
          {(from || to) && !dirty && (
            <button
              onClick={clear}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 transition-colors border border-white/5"
            >
              Clear
            </button>
          )}
          {dirty && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </motion.button>
          )}
        </div>
      </div>

      {saveMut.isError && (
        <p className="text-red-400 text-xs mt-2">Failed to save. Please try again.</p>
      )}
    </motion.div>
  );
}

export default function ClaimTime() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-games"],
    queryFn: () => adminApi.games.list(),
  });

  const games: Game[] = data?.data?.games ?? [];
  const activeGames = games.filter(g => g.active !== false);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          Claim Time
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Set the daily window when claim time is open for each game (GMT+3). Outside these hours it will show as closed.
        </p>
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "#a5b4fc" }}
      >
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Current GMT+3 time: <span className="font-mono font-semibold">{getGmt3Hhmm()}</span></span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : activeGames.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No games found. Add games in Games &amp; Categories first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGames.map((game, i) => (
            <GameClaimCard key={game._id} game={game} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}
