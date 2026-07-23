import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Truck, Plus, ChevronRight, CheckCircle, Clock, Mail, DollarSign,
  X, Loader2, AlertCircle, Settings, Users, Gamepad2,
} from "lucide-react";
import { adminApi } from "../../api";

function fmt(n: number) { return `$${Number(n || 0).toFixed(2)}`; }

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    active:   { bg: "rgba(74,222,128,0.1)",  text: "#4ade80",  label: "Active" },
    invited:  { bg: "rgba(251,191,36,0.1)",  text: "#fbbf24",  label: "Invited" },
    disabled: { bg: "rgba(239,68,68,0.1)",   text: "#f87171",  label: "Disabled" },
  };
  const c = cfg[status] || cfg.disabled;
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [commission, setCommission] = useState(20);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [error, setError] = useState("");

  const { data: gamesData } = useQuery({
    queryKey: ["games-list-invite"],
    queryFn: adminApi.games.list,
  });
  const games: any[] = gamesData?.data?.games || [];

  const { mutate, isPending } = useMutation({
    mutationFn: () => adminApi.delivery.invite({ email, name, commissionRate: commission, games: selectedGames }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["delivery-team"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  function toggleGame(slug: string) {
    setSelectedGames(prev =>
      prev.includes(slug) ? prev.filter(g => g !== slug) : [...prev, slug]
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#0d1525", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-base">Invite Deliverer</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-white/50">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-white/50">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-white/50">Commission Rate (%)</label>
            <input type="number" min={0} max={100} value={commission} onChange={e => setCommission(Number(e.target.value))}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
          </div>
          {/* Game Assignment */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-white/50 flex items-center gap-1.5">
              <Gamepad2 className="w-3 h-3" /> Assigned Games <span className="text-white/25 font-normal">(empty = all games)</span>
            </label>
            {games.length === 0 ? (
              <p className="text-white/25 text-xs">No games found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {games.map((g: any) => {
                  const active = selectedGames.includes(g.slug);
                  return (
                    <button key={g.slug} type="button" onClick={() => toggleGame(g.slug)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={active
                        ? { background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.4)", color: "#7dd3fc" }
                        : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                      {g.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancel
            </button>
            <button onClick={() => mutate()} disabled={isPending || !email}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Send Invite
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DeliveryTeam() {
  const [showInvite, setShowInvite] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["delivery-team"],
    queryFn: adminApi.delivery.list,
  });

  const deliverers: any[] = data?.data?.deliverers || [];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <AnimatePresence>{showInvite && <InviteModal onClose={() => setShowInvite(false)} />}</AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-400" />
            Delivery Team
          </h2>
          <p className="text-sm mt-0.5 text-white/40">Manage your delivery agents and their commissions</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}>
          <Plus className="w-4 h-4" /> Invite Deliverer
        </motion.button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Members", value: deliverers.filter(d => d.status === "active").length, icon: Users },
          { label: "Unpaid Revenue", value: `$${deliverers.reduce((s, d) => s + (d.totalRevenue || 0), 0).toFixed(2)}`, icon: DollarSign },
          { label: "Total Deliveries", value: deliverers.reduce((s, d) => s + (d.deliveryCount || 0), 0), icon: CheckCircle },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <s.icon className="w-5 h-5 text-sky-400 flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-lg">{s.value}</p>
              <p className="text-white/35 text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Member list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold text-sm">Team Members ({deliverers.length})</h3>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : deliverers.length === 0 ? (
          <div className="py-16 text-center text-white/25">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No team members yet</p>
            <button onClick={() => setShowInvite(true)} className="mt-3 text-sky-400 text-xs hover:underline">Send your first invite</button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {deliverers.map((d: any, i: number) => (
              <Link key={d._id} href={`/admin/delivery-team/${d._id}`}>
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer group transition-colors hover:bg-white/3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "#fff" }}>
                    {(d.name || d.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">{d.name || d.email}</p>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-white/35 text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{d.email}</span>
                      <span className="text-white/35 text-xs">{d.commissionRate}% commission</span>
                      {d.games?.length > 0 && (
                        <span className="text-sky-400/60 text-xs flex items-center gap-1">
                          <Gamepad2 className="w-3 h-3" />{d.games.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    <p className="text-emerald-400 text-sm font-bold">{fmt(d.totalCommission)}</p>
                    <p className="text-white/25 text-[10px]">unpaid commission</p>
                    <p className="text-white/20 text-[10px]">{d.deliveryCount ?? 0} deliveries</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
