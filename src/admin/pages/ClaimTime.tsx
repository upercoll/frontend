import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, X, Loader2, Gamepad2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { adminApi } from "../api";
import type { Game } from "../types";

function getGmt3Hhmm() {
  const gmt3 = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return `${String(gmt3.getUTCHours()).padStart(2, "0")}:${String(gmt3.getUTCMinutes()).padStart(2, "0")}`;
}

function findActiveSlot(game: Game): { label: string; minutes: number; endsAt: string | null } | null {
  const hhmm = getGmt3Hhmm();
  if (game.claimSchedule?.length) {
    const slot = game.claimSchedule.find(s => {
      if (!s.from || !s.to || !s.minutes) return false;
      return s.from <= s.to ? (hhmm >= s.from && hhmm <= s.to) : (hhmm >= s.from || hhmm <= s.to);
    });
    if (slot) return { label: slot.label || "Scheduled Slot", minutes: slot.minutes, endsAt: slot.to };
  }
  if ((game.claimTime || 0) > 0) return { label: "Default", minutes: game.claimTime!, endsAt: null };
  return null;
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

type ScheduleSlot = { label?: string; from: string; to: string; minutes: number };

function GameClaimCard({ game }: { game: Game }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [claimTime, setClaimTime] = useState(game.claimTime ?? 0);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(game.claimSchedule ?? []);
  const [dirty, setDirty] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const saveMut = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("name", game.name);
      form.append("slug", game.slug);
      form.append("claimTime", String(claimTime));
      form.append("claimSchedule", JSON.stringify(schedule));
      return adminApi.games.update(game.slug, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-games"] });
      setDirty(false);
    },
  });

  const active = findActiveSlot({ ...game, claimTime, claimSchedule: schedule });
  const hhmm = getGmt3Hhmm();
  const nextSlot = !active && schedule.length
    ? schedule.filter(s => s.from > hhmm).sort((a, b) => a.from.localeCompare(b.from))[0]
    : null;

  function updateClaimTime(v: number) { setClaimTime(v); setDirty(true); }
  function addSlot() { setSchedule(p => [...p, { label: "", from: "09:00", to: "18:00", minutes: 5 }]); setDirty(true); }
  function removeSlot(i: number) { setSchedule(p => p.filter((_, idx) => idx !== i)); setDirty(true); }
  function updateSlot(i: number, patch: Partial<ScheduleSlot>) {
    setSchedule(p => p.map((s, idx) => idx === i ? { ...s, ...patch } : s));
    setDirty(true);
  }

  return (
    <div className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {game.imageUrl ? (
          <img src={game.imageUrl} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt=""
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${game.gradient?.from ?? "#6366f1"}, ${game.gradient?.to ?? "#8b5cf6"})` }}>
            <Gamepad2 className="w-5 h-5 text-white/50" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{game.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {active ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}>
                <Clock className="w-2.5 h-2.5" />
                {active.label} · {active.minutes}m
                {active.endsAt && <span className="opacity-60 font-normal">ends {fmtCountdown(active.endsAt)}</span>}
              </span>
            ) : nextSlot ? (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
                <Clock className="w-2.5 h-2.5" />
                Closed · opens {nextSlot.from} GMT+3 in {fmtCountdown(nextSlot.from)}
              </span>
            ) : (claimTime === 0 && schedule.length === 0) ? (
              <span className="text-[10px] text-slate-600">No claim time set</span>
            ) : (
              <span className="text-[10px] text-slate-500">Outside claim hours</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {dirty && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              {saveMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </motion.button>
          )}
          <button onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">

              <div>
                <label className="text-slate-300 text-xs font-medium block mb-1.5">
                  Default Claim Time <span className="text-slate-500 font-normal">(minutes, 0 = disabled)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="120" value={claimTime}
                    onChange={e => updateClaimTime(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-28 bg-[#0a1628] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                  <span className="text-slate-500 text-xs">Used when no schedule slot is active</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-xs font-medium">
                    Schedule Slots <span className="text-slate-500 font-normal">(override by time of day, GMT+3)</span>
                  </label>
                  <button onClick={addSlot}
                    className="text-[11px] px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Slot
                  </button>
                </div>

                {schedule.length === 0 && (
                  <p className="text-slate-600 text-xs py-2">No schedule slots — default claim time applies all day.</p>
                )}

                <div className="space-y-2">
                  {schedule.map((slot, idx) => {
                    const hh = getGmt3Hhmm();
                    const isNow = slot.from && slot.to
                      ? (slot.from <= slot.to ? (hh >= slot.from && hh <= slot.to) : (hh >= slot.from || hh <= slot.to))
                      : false;
                    return (
                      <div key={idx}
                        className="bg-[#0a1628] border rounded-xl p-3 space-y-2"
                        style={{ borderColor: isNow ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center gap-2">
                          {isNow && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                              style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>ACTIVE</span>
                          )}
                          <input
                            value={slot.label ?? ""}
                            onChange={e => updateSlot(idx, { label: e.target.value })}
                            placeholder="Label (e.g. Peak Hours)"
                            className="flex-1 bg-transparent border-b border-white/10 text-white placeholder-slate-600 text-xs pb-1 focus:outline-none focus:border-blue-500/40"
                          />
                          <button onClick={() => removeSlot(idx)}
                            className="w-6 h-6 rounded flex items-center justify-center text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-slate-500 text-[10px] mb-1">From (GMT+3)</p>
                            <input type="time" value={slot.from}
                              onChange={e => updateSlot(idx, { from: e.target.value })}
                              className="w-full bg-transparent border border-white/10 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500/40" />
                          </div>
                          <div>
                            <p className="text-slate-500 text-[10px] mb-1">To (GMT+3)</p>
                            <input type="time" value={slot.to}
                              onChange={e => updateSlot(idx, { to: e.target.value })}
                              className="w-full bg-transparent border border-white/10 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500/40" />
                          </div>
                          <div>
                            <p className="text-slate-500 text-[10px] mb-1">Minutes</p>
                            <input type="number" min="1" max="120" value={slot.minutes}
                              onChange={e => updateSlot(idx, { minutes: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-full bg-transparent border border-white/10 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500/40" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {saveMut.isError && (
                <p className="text-red-400 text-xs">Failed to save. Please try again.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ClaimTime() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-games"],
    queryFn: () => adminApi.games.list(),
  });

  const games: Game[] = data?.data?.games ?? [];
  const activeGames = games.filter(g => g.active !== false);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          Claim Time Management
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Set how long customers wait per game. Schedule slots override the default by time of day (GMT+3). Saves immediately per game.
        </p>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Current GMT+3 time: <span className="font-mono font-semibold">{getGmt3Hhmm()}</span></span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : activeGames.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No games found. Add games in Games & Categories first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGames.map((game, i) => (
            <motion.div key={game._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GameClaimCard game={game} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
