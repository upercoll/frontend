import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket, Trophy, Clock, Users, Copy, Check, X, Sparkles,
  RefreshCw, LogIn, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TopNav, SiteFooter } from "./Home";
import { P } from "@/lib/storefront";
import { RBstar } from "@/components/Art";

/* ── Weekly / Monthly Raffle ──────────────────────────────────────────────
   Every $1 of real spend is a ticket. Each cadence runs on the owner's auto
   schedule (day + hour UTC, drawn automatically when the period closes).
   Winners are picked server side with a crypto weighted draw, and a prize
   claims into a real single-use store credit code the checkout redeems. */

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

type RaffleType = "weekly" | "monthly";

const TABS: { type: RaffleType; label: string; Icon: typeof Ticket }[] = [
  { type: "weekly",  label: "Weekly Raffle",  Icon: Ticket },
  { type: "monthly", label: "Monthly Raffle", Icon: Trophy },
];

const TYPE_LABEL: Record<RaffleType, string> = {
  weekly: "Weekly Raffle",
  monthly: "Monthly Raffle",
};

type RafflePayload = {
  raffle: {
    id: string; type: RaffleType; number: number; status: string;
    startsAt: string; endsAt: string; prizePool: number;
    topPrize: number; winnerCount: number;
  } | null;
  disabled?: boolean;
  settings?: {
    ticketRate: number; about: string;
    schedule?: { day: number; hour: number; autoDraw: boolean };
  };
  entrants?: number;
  totalTickets?: number;
  me?: { name: string; tickets: number; rank: number | null } | null;
  recentWinners?: { position: number; name: string; tickets: number; prize: number; claimed: boolean }[];
  lastDraw?: { number: number; drawnAt: string; entrants: number } | null;
};

type MyWin = {
  raffleId: string; type: RaffleType; number: number; position: number;
  prize: number; tickets: number; drawnAt: string;
  claimed: boolean; promoCode: string | null;
};

/* ── The little faces ────────────────────────────────────────────────────
   Winner rows get a friendly avatar derived from the username — the same
   charm as the reference, in the site's own colors. Position 1 wears gold. */
const FACE_COLORS = ["#2f8cff", "#FFC53D", "#5fe08e", "#ff5a4d", "#a78bfa", "#f97316", "#06b6d4", "#ec4899"];

function faceColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return FACE_COLORS[h % FACE_COLORS.length];
}

function RaffleFace({ name, size = 32, gold = false }: { name: string; size?: number; gold?: boolean }) {
  const c = gold ? "#FFC53D" : faceColor(name || "?");
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className="shrink-0" aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill={c} />
      <circle cx="10" cy="12" r="1.6" fill="#0e1728" />
      <circle cx="18" cy="12" r="1.6" fill="#0e1728" />
      <path d="M10.5 17q3.5 2.4 7 0" stroke="#0e1728" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ── Countdown — the ticket's heartbeat ────────────────────────────────── */
function useCountdown(endsAt: string | undefined) {
  const [left, setLeft] = useState(() => (endsAt ? new Date(endsAt).getTime() - Date.now() : 0));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      setLeft(ms);
      setNow(Date.now());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const s = Math.max(0, Math.floor(left / 1000));
  const parts = {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
  const pad = (n: number) => String(n).padStart(2, "0");
  const text = `${parts.d}d ${pad(parts.h)}h ${pad(parts.m)}m ${pad(parts.s)}s`;
  return { text, done: left <= 0, at: now };
}

/* The reference's perforated ticket strip — the strip has its OWN darker
   background, and the notch circles are painted in the CARD color so they
   read as bites out of both edges (invisible otherwise: card-colored
   circles over a card-colored gap). Inner bordered box holds the content. */
const ticketNotch = {
  backgroundColor: "#131c31",
  backgroundImage:
    `radial-gradient(circle at 0 50%, ${P.card} 6px, transparent 6.5px),` +
    `radial-gradient(circle at 100% 50%, ${P.card} 6px, transparent 6.5px)`,
  backgroundSize: "12px 16px",
  backgroundRepeat: "repeat-y",
  backgroundPosition: "left top, right top",
};

function money(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

export default function RafflePage() {
  const [, navigate] = useLocation();
  const { token, openAuthModal } = useAuth();

  const [tab, setTab] = useState<RaffleType>("weekly");
  const [data, setData] = useState<RafflePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [myWins, setMyWins] = useState<MyWin[]>([]);
  const [showCase, setShowCase] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimedCode, setClaimedCode] = useState<{ code: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const caseRef = useRef(false);

  const load = useCallback(async (t: RaffleType) => {
    setLoading(true);
    setLoadError("");
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const [cur, me] = await Promise.all([
        fetch(`${BACKEND}/api/raffles/current?type=${t}`, { headers }).then(r => r.json()),
        token
          ? fetch(`${BACKEND}/api/raffles/me`, { headers }).then(r => r.json()).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (!cur.success) throw new Error(cur.message || "Could not load the raffle");
      setData(cur.data);
      if (me?.success) setMyWins(me.data.wins || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load the raffle");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(tab); }, [tab, load]);

  /* Pull the trophy case once per open (fresh claim states live there) */
  useEffect(() => {
    if (!showCase || !token || caseRef.current) return;
    caseRef.current = true;
    fetch(`${BACKEND}/api/raffles/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { if (j.success) setMyWins(j.data.wins || []); })
      .catch(() => {});
  }, [showCase, token]);

  const raffle = data?.raffle || null;
  const countdown = useCountdown(raffle?.endsAt);
  const rate = data?.settings?.ticketRate ?? 1;

  /* My unclaimed win in the tab I'm looking at — the hero's claim moment */
  const pending = myWins.find(w => w.type === tab && !w.claimed);
  const claimedHere = myWins.find(w => w.type === tab && w.claimed);

  const claim = async () => {
    if (!token) return openAuthModal("login");
    if (!pending) return;
    setClaiming(true);
    try {
      const res = await fetch(`${BACKEND}/api/raffles/${pending.raffleId}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Could not claim");
      setClaimedCode({ code: j.data.code, amount: j.data.amount });
      setMyWins(prev => prev.map(w =>
        w.raffleId === pending.raffleId ? { ...w, claimed: true, promoCode: j.data.code } : w
      ));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not claim");
    } finally {
      setClaiming(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const winners = data?.recentWinners || [];
  const me = data?.me;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: P.bg }}>
      <TopNav onHome={() => navigate("/")} />

      <main className="flex-1 w-full max-w-[1010px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 rounded-2xl p-1.5" style={{ background: P.band, border: `1px solid ${P.border}` }}>
          {TABS.map(({ type, label, Icon }) => (
            <button
              key={type}
              onClick={() => setTab(type)}
              className="flex items-center justify-center gap-2 rounded-xl h-12 sm:h-14 text-[13px] sm:text-[15px] font-bold transition-colors"
              style={{
                background: tab === type ? P.card : "transparent",
                color: tab === type ? P.text : P.muted,
                border: tab === type ? `1px solid ${P.borderStrong}` : "1px solid transparent",
              }}
            >
              <Icon size={17} color={tab === type ? P.star : "#8ea0cf"} /> {label}
            </button>
          ))}
        </div>

        {/* ── Hero: the ticket ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl mt-4 p-4 sm:p-6"
          style={{ background: P.card, border: `1px solid ${P.border}` }}
        >
          {loadError && !raffle && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <RBstar size={44} color={P.accent} />
              <p className="text-sm font-semibold" style={{ color: P.muted }}>{loadError}</p>
              <button onClick={() => load(tab)} className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl" style={{ background: P.accentTint, color: P.accent }}>
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          )}

          {!loadError && !loading && !raffle && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <RBstar size={44} color={P.accent} />
              <p className="text-sm font-semibold" style={{ color: P.muted }}>
                {data?.disabled ? "This raffle is on pause — check back soon." : "No raffle is running right now."}
              </p>
            </div>
          )}

          {(loading || raffle) && (
            <>
              <div className="px-2.5 sm:px-4 py-2 sm:py-3 rounded-lg" style={ticketNotch}>
                <div className="rounded-xl px-4 sm:px-6 py-7 sm:py-8 text-center" style={{ background: "#0e1728", border: `1px solid ${P.border}` }}>
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <span className="hidden sm:block flex-1 h-px max-w-[136px]" style={{ background: P.border }} />
                    <h1 className="font-mont text-[21px] sm:text-[30px] font-bold whitespace-nowrap" style={{ color: P.text }}>
                      {loading ? "Loading…" : `${TYPE_LABEL[tab]} #${raffle!.number}`}
                      {raffle && <span style={{ color: P.star }}> {money(raffle.prizePool)}</span>}
                    </h1>
                    <span className="hidden sm:block flex-1 h-px max-w-[136px]" style={{ background: P.border }} />
                  </div>

                  <div className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-bold"
                    style={{ background: P.band, border: `1px solid ${P.border}`, color: countdown.done ? P.star : P.text }}>
                    <Clock size={15} color={countdown.done ? P.star : "#8ea0cf"} />
                    {loading ? "…" : countdown.done
                      ? (data?.settings?.schedule?.autoDraw === false ? "Draw pending" : "Drawing winners…")
                      : `Draws in ${countdown.text}`}
                  </div>

                  {(data?.entrants ?? 0) > 0 && (
                    <p className="mt-3 text-[12px] font-semibold" style={{ color: P.faint }}>
                      <Users size={12} className="inline -mt-0.5 mr-1" />
                      {data!.entrants!.toLocaleString()} players · {data!.totalTickets!.toLocaleString()} tickets in play
                    </p>
                  )}
                </div>
              </div>

              {/* You vs the field — the reference's user row */}
              <div className="mt-4 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "#0e1728", border: `1px solid ${P.border}` }}>
                {me ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <RaffleFace name={me.name} size={32} />
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold truncate" style={{ color: P.text }}>{me.name}</p>
                      <p className="text-[11px] font-semibold" style={{ color: P.faint }}>
                        {me.tickets > 0
                          ? me.rank ? `You're #${me.rank} in this draw` : "Tickets in this draw"
                          : `Order anything — every $1 = ${rate} ticket${rate === 1 ? "" : "s"}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid w-8 h-8 rounded-full place-items-center shrink-0" style={{ background: P.band, border: `1px solid ${P.border}` }}>
                      <LogIn size={15} color="#8ea0cf" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold" style={{ color: P.text }}>Sign in to track tickets</p>
                      <p className="text-[11px] font-semibold" style={{ color: P.faint }}>Every $1 you spend = {rate} ticket{rate === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                )}

                <div className="text-right sm:text-center">
                  <p className="font-mont text-[22px] sm:text-[24px] font-bold leading-none" style={{ color: me && me.tickets > 0 ? P.star : P.text }}>
                    {me ? me.tickets.toLocaleString() : "—"}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] mt-1" style={{ color: P.faint }}>Tickets</p>
                </div>

                <button
                  onClick={() => (token ? setShowCase(true) : openAuthModal("login"))}
                  className="hidden sm:flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold justify-self-end transition-colors"
                  style={{ background: P.band, border: `1px solid ${P.borderStrong}`, color: P.text }}
                >
                  <Trophy size={15} color={P.star} /> Trophy Case
                </button>
              </div>

              {/* Claim moment — a won prize waiting for its winner */}
              <AnimatePresence>
                {(pending || claimedCode) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="mt-4 rounded-xl px-4 py-3.5 flex flex-wrap items-center gap-3"
                    style={{ background: "rgba(255,197,61,0.08)", border: "1px solid rgba(255,197,61,0.4)" }}
                  >
                    <Sparkles size={18} color={P.star} />
                    {claimedCode ? (
                      <p className="flex-1 text-[13px] font-bold" style={{ color: P.text }}>
                        You won {money(claimedCode.amount)}! Your credit code:{" "}
                        <span className="font-mono" style={{ color: P.star }}>{claimedCode.code}</span>{" "}
                        <span className="font-semibold" style={{ color: P.faint }}>— applied at checkout, or copy it below.</span>
                      </p>
                    ) : (
                      <p className="flex-1 text-[13px] font-bold" style={{ color: P.text }}>
                        You won {money(pending!.prize)} in {TYPE_LABEL[pending!.type]} #{pending!.number}! Claim it as store credit.
                      </p>
                    )}
                    {claimedCode ? (
                      <button onClick={() => copyCode(claimedCode.code)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-bold"
                        style={{ background: P.star, color: "#0e1728" }}>
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy code"}
                      </button>
                    ) : (
                      <button onClick={claim} disabled={claiming} className="h-9 px-5 rounded-xl text-[13px] font-bold disabled:opacity-60"
                        style={{ background: P.star, color: "#0e1728" }}>
                        {claiming ? "Claiming…" : "Claim prize"}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.section>

        {/* ── About + banners ──────────────────────────────────────────── */}
        <section className="rounded-2xl mt-4 p-5 sm:p-7" style={{ background: P.card, border: `1px solid ${P.border}` }}>
          <div className="grid md:grid-cols-[1fr_1.5fr] gap-4 md:gap-10">
            <h2 className="font-mont text-[19px] font-bold" style={{ color: P.text }}>About the {TYPE_LABEL[tab]}</h2>
            <p className="text-[14px] leading-6 font-medium" style={{ color: P.muted }}>
              {data?.settings?.about || "Every dollar you spend is a ticket. Winners are drawn at random — if it's your lucky day, one click collects your prize."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {/* Banner 1 — flying tickets */}
            <div className="relative rounded-xl h-[115px] overflow-hidden flex items-center" style={{ background: "#0e1728", border: `1px solid ${P.border}` }}>
              <svg viewBox="0 0 160 115" preserveAspectRatio="xMinYMid slice" width="160" className="h-full shrink-0" aria-hidden="true">
                <defs>
                  <linearGradient id="rf-gold" x1="0" x2="1">
                    <stop offset="0" stopColor="#FFD75E" /><stop offset="1" stopColor="#FFB300" />
                  </linearGradient>
                  <g id="rf-tk">
                    <rect x="-44" y="-26" width="88" height="52" rx="6" fill="url(#rf-gold)" />
                    <rect x="-38" y="-20" width="76" height="40" rx="4" fill="none" stroke="#e8920f" strokeWidth="2" />
                    <circle cx="-44" cy="0" r="7" fill="#0e1728" /><circle cx="44" cy="0" r="7" fill="#0e1728" />
                    <text x="0" y="5" textAnchor="middle" fontWeight="800" fontSize="13" fill="#d98400" letterSpacing="1">RAFFLE TICKET</text>
                  </g>
                </defs>
                <g stroke={P.border} strokeWidth="2"><path d="M160 20L40 50M160 60L40 60M160 100L40 80" /></g>
                <g transform="translate(18 28) rotate(-52)"><use href="#rf-tk" /></g>
                <g transform="translate(40 90) rotate(-52)"><use href="#rf-tk" /></g>
                <g transform="translate(-5 70) rotate(-52)"><use href="#rf-tk" /></g>
              </svg>
              <span className="text-[15px] sm:text-[17px] leading-6 font-bold pl-2 pr-4" style={{ color: P.text }}>
                Order now for<br />a chance to win!
              </span>
            </div>

            {/* Banner 2 — the ticking clock */}
            <div className="relative rounded-xl h-[115px] overflow-hidden flex items-center" style={{ background: "#0e1728", border: `1px solid ${P.border}` }}>
              <svg viewBox="0 0 190 115" width="190" className="h-full shrink-0" aria-hidden="true">
                <g fill={P.borderStrong}>
                  <path d="M8 66l22-6-8 10 14-1-22 14 6-12z" /><path d="M144 56l24-12-8 14 20-6-30 18 4-10z" /><path d="M146 96l14-10-4 10 12-2-18 12z" />
                </g>
                <circle cx="78" cy="30" r="12" fill={P.accentDeep} /><circle cx="118" cy="32" r="12" fill={P.accentDeep} />
                <path d="M70 34a24 24 0 0150-4" stroke={P.accent} strokeWidth="3" fill="none" />
                <path d="M62 90L52 112h10l8-14zM108 94l8 18h10l-8-20z" fill={P.accentDeep} />
                <circle cx="92" cy="66" r="47" fill={P.accentDeep} />
                <circle cx="92" cy="66" r="39" fill="#e7f1fb" stroke={P.accent} strokeWidth="3" />
                <g stroke="#3a4a5c" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M92 32v6M92 94v6M58 66h6M120 66h6M68 42l3 4M116 42l-3 4M68 90l3-4M116 90l-3-4" />
                </g>
                <path d="M92 66L76 76" stroke="#d62f2f" strokeWidth="2" />
                <path d="M92 66V44M92 66l16 14" stroke="#1c2733" strokeWidth="3" strokeLinecap="round" />
                <circle cx="92" cy="66" r="3.5" fill="#d62f2f" />
              </svg>
              <span className="text-[15px] sm:text-[17px] leading-6 font-bold pl-1 pr-4" style={{ color: P.text }}>
                Time is running out —<br />don't miss your chance!
              </span>
            </div>
          </div>
        </section>

        {/* ── Winners ──────────────────────────────────────────────────── */}
        <section className="rounded-2xl mt-4 overflow-hidden" style={{ background: P.card, border: `1px solid ${P.border}` }}>
          <div className="grid grid-cols-[36px_1fr_90px_100px] sm:grid-cols-[48px_1fr_1fr_1fr] items-center px-4 sm:px-5 h-16 border-b" style={{ borderColor: P.border }}>
            <span className="text-[13px] font-bold" style={{ color: P.faint }}>#</span>
            <span className="text-[13px] sm:text-[14px] font-bold" style={{ color: P.text }}>
              {data?.lastDraw ? `${TYPE_LABEL[tab]} #${data.lastDraw.number} Winners` : "Winners"}
            </span>
            <span className="text-[13px] font-bold" style={{ color: P.faint }}>Tickets</span>
            <span className="text-[13px] font-bold text-right" style={{ color: P.faint }}>Reward</span>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: P.stage }} />)}
            </div>
          ) : winners.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <RBstar size={38} color={P.accent} />
              <p className="text-sm font-semibold" style={{ color: P.muted }}>No draws yet — the last winners will land here.</p>
            </div>
          ) : (
            <div>
              {winners.map(w => (
                <div key={w.position} className="grid grid-cols-[36px_1fr_90px_100px] sm:grid-cols-[48px_1fr_1fr_1fr] items-center px-4 sm:px-5 h-[62px] border-b last:border-b-0" style={{ borderColor: P.border }}>
                  <span className="text-[13px] font-bold" style={{ color: P.faint }}>{w.position}</span>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <RaffleFace name={w.name} size={26} gold={w.position === 1} />
                    <span className="text-[13px] sm:text-[14px] font-bold truncate" style={{ color: P.text }}>{w.name}</span>
                  </span>
                  <span className="text-[13px] font-bold" style={{ color: P.muted }}>{w.tickets.toLocaleString()}</span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-right" style={{ color: P.good }}>{money(w.prize)}</span>
                </div>
              ))}
            </div>
          )}

          {(claimedHere || (token && myWins.length > 0)) && (
            <button onClick={() => setShowCase(true)} className="w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-bold border-t transition-colors"
              style={{ borderColor: P.border, color: P.accent }}>
              <Trophy size={14} /> Open my Trophy Case <ChevronRight size={13} />
            </button>
          )}
        </section>
      </main>

      {/* ── Trophy Case ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: "rgba(7,12,24,0.72)" }}
            onClick={() => setShowCase(false)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: P.card, border: `1px solid ${P.borderStrong}` }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: P.border }}>
                <h3 className="flex items-center gap-2 font-mont text-[16px] font-bold" style={{ color: P.text }}>
                  <Trophy size={17} color={P.star} /> Trophy Case
                </h3>
                <button onClick={() => setShowCase(false)} className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: P.band, color: P.muted }}>
                  <X size={15} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {!token ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center px-6">
                    <RBstar size={38} color={P.accent} />
                    <p className="text-sm font-semibold" style={{ color: P.muted }}>Sign in to see your winnings.</p>
                    <button onClick={() => { setShowCase(false); openAuthModal("login"); }} className="h-10 px-5 rounded-xl text-[13px] font-bold" style={{ background: P.accentDeep, color: "#fff" }}>
                      Sign in
                    </button>
                  </div>
                ) : myWins.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center px-6">
                    <RBstar size={38} color={P.accent} />
                    <p className="text-sm font-semibold" style={{ color: P.muted }}>No trophies yet — every order is another ticket.</p>
                    <button onClick={() => { setShowCase(false); navigate("/browse"); }} className="h-10 px-5 rounded-xl text-[13px] font-bold" style={{ background: P.accentDeep, color: "#fff" }}>
                      Browse items
                    </button>
                  </div>
                ) : (
                  myWins.map(w => (
                    <div key={w.raffleId} className="flex items-center gap-3 px-5 py-3.5 border-b last:border-b-0" style={{ borderColor: P.border }}>
                      <RaffleFace name={w.type + w.number} size={30} gold={w.position === 1} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold" style={{ color: P.text }}>
                          {TYPE_LABEL[w.type]} #{w.number} · <span style={{ color: P.good }}>{money(w.prize)}</span>
                        </p>
                        <p className="text-[11px] font-semibold" style={{ color: P.faint }}>
                          #{w.position} of the draw · {w.tickets.toLocaleString()} tickets
                        </p>
                      </div>
                      {w.claimed && w.promoCode ? (
                        <button onClick={() => copyCode(w.promoCode!)} className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-bold font-mono shrink-0"
                          style={{ background: P.band, border: `1px solid ${P.borderStrong}`, color: P.star }}>
                          {copied ? <Check size={13} /> : <Copy size={13} />} {w.promoCode}
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0" style={{ background: "rgba(255,197,61,0.12)", color: P.star }}>
                          Unclaimed
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SiteFooter />
    </div>
  );
}
