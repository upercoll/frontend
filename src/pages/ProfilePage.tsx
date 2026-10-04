import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Star, Edit3, Camera, Save, X, Lock, RotateCw, Check, Copy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SpinWheel from "@/components/SpinWheel";

const HC = {
  bg: "#131C23", bgSecondary: "#18242D", card: "#1C2A34", elevated: "#22333F",
  border: "#2C414E", accent: "#3BA7FF", textPrimary: "#F4F8FB", textSecondary: "#9BAEBB", textMuted: "#637784",
};

const SPEND_LEVELS = [
  0, 3.13, 6.25, 9.38, 12.50, 20, 27.50, 35, 42.50, 50,
  60, 70, 80, 90, 100, 110, 120, 130, 140, 150,
  160, 170, 180, 190, 200, 210, 220, 230, 240, 250,
  300, 350, 400, 450, 500, 550, 600, 650, 700, 750,
  925, 1100, 1275, 1450, 1625, 1800, 1975, 2150, 2325, 2500,
];

const LEVEL_REWARDS = [
  { level: 1, label: "5% OFF", img: "/rewards/IMG_1040.png" },
  { level: 3, label: "7% OFF", img: "/rewards/IMG_1041.png" },
  { level: 5, label: "10% OFF", img: "/rewards/IMG_0750.png" },
  { level: 7, label: "12% OFF", img: "/rewards/IMG_1042.png" },
  { level: 10, label: "14% OFF", img: "/rewards/IMG_1043.png" },
  { level: 15, label: "15% OFF", img: "/rewards/IMG_1044.png" },
  { level: 20, label: "18% OFF", img: "/rewards/IMG_1045.png" },
  { level: 25, label: "20% OFF", img: "/rewards/IMG_1046.png" },
  { level: 30, label: "22% OFF", img: "/rewards/IMG_1047.png" },
  { level: 35, label: "25% OFF", img: "/rewards/IMG_1048.png" },
  { level: 40, label: "27% OFF", img: "/rewards/IMG_1049.png" },
  { level: 45, label: "30% OFF", img: "/rewards/IMG_1050.png" },
  { level: 50, label: "35% OFF", img: "/rewards/IMG_1051.png" },
];

const SPIN_PRIZES = [
  { label: "5% OFF", color: "#3BA7FF" },
  { label: "10% OFF", color: "#22C55E" },
  { label: "15% OFF", color: "#FFC53D" },
  { label: "20% OFF", color: "#EF4444" },
  { label: "25% OFF", color: "#A855F7" },
  { label: "30% OFF", color: "#3BA7FF" },
  { label: "10% OFF", color: "#22C55E" },
  { label: "5% OFF", color: "#FFC53D" },
];

// Coupon ticket art per spin prize % (same files as the level cards)
const SPIN_VOUCHER: Record<number, string> = {
  5: "/rewards/IMG_1040.png",
  10: "/rewards/IMG_0750.png",
  15: "/rewards/IMG_1044.png",
  20: "/rewards/IMG_1046.png",
  25: "/rewards/IMG_1048.png",
  30: "/rewards/IMG_1050.png",
};

// Probability ladder — weights out of 1,000,000 (MUST match backend
// rewardController.js). Discounts above 20% are literally one-in-a-million
// each: 5% → 45%, 10% → 32%, 15% → 15%, 20% → 8%, 25% → 1e-6, 30% → 1e-6.
const SPIN_WEIGHTS: Record<number, number> = {
  5: 450000, 10: 320000, 15: 150000, 20: 79998, 25: 1, 30: 1,
};

function pickSpinIdx(): number {
  let roll = Math.floor(Math.random() * 1000000);
  let value = 5;
  const ladder = [5, 10, 15, 20, 25, 30];
  for (const v of ladder) {
    roll -= SPIN_WEIGHTS[v];
    if (roll < 0) { value = v; break; }
  }
  const matches: number[] = [];
  SPIN_PRIZES.forEach((p, i) => { if (parseInt(p.label, 10) === value) matches.push(i); });
  return matches[Math.floor(Math.random() * matches.length)] ?? 0;
}

// A real, issued reward code (spin win or claimed level milestone)
type RewardCode = {
  kind: "spin" | "level";
  level: number | null;
  label: string;
  code: string;
  expiresAt: string;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

// One spin per UTC day — the backend uses the same key, we mirror it so the
// button locks instantly even when the claims request is still in flight.
const todayKey = () => new Date().toISOString().slice(0, 10);

function authHeaders(token: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Stash the latest win so Checkout can auto-apply it (validated server-side
// through /api/promo/validate before it ever touches a price).
function saveWonPromo(code: string, value: number) {
  try {
    localStorage.setItem(
      "rbstars_won_promo",
      JSON.stringify({ code, type: "percent", value, wonAt: Date.now() })
    );
  } catch {}
}

function loadProfile() { try { const r = localStorage.getItem("rbstars_profile"); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveProfile(d: any) { localStorage.setItem("rbstars_profile", JSON.stringify(d)); }
function getLevel(spent: number) { for (let i = SPEND_LEVELS.length - 1; i >= 0; i--) { if (spent >= SPEND_LEVELS[i]) return i + 1; } return 1; }
function getSpendInLevel(spent: number) { const lvl = getLevel(spent); if (lvl >= SPEND_LEVELS.length) return { current: SPEND_LEVELS[lvl - 1], needed: SPEND_LEVELS[lvl - 1], percent: 100 }; const current = SPEND_LEVELS[lvl - 1]; const needed = SPEND_LEVELS[lvl]; return { current: spent - current, needed: needed - current, percent: ((spent - current) / (needed - current)) * 100 }; }

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };

function SectionHeader({ eyebrow, title, accent, subtitle, right }: {
  eyebrow?: string; title: string; accent?: string; subtitle?: string; right?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: HC.accent }}>{eyebrow}</span>
        )}
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: HC.textPrimary, letterSpacing: "-0.025em" }}>
          {title}{accent && <> <span style={{ color: HC.accent }}>{accent}</span></>}
        </h2>
        {subtitle && <p className="mt-2 text-sm" style={{ color: HC.textSecondary }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function ProfileField({ label, value, onChange, disabled, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; disabled: boolean; type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block text-white">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full bg-transparent outline-none text-sm px-4 py-3 rounded-xl transition-all text-white"
        style={{ background: "#0C141B", border: `1.5px solid ${disabled ? HC.border : HC.accent}`, cursor: disabled ? "default" : "text" }} />
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser, token, openAuthModal } = useAuth();
  const [, navigate] = useLocation();
  const profile = loadProfile();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || "");
  const [robloxUsername, setRobloxUsername] = useState(profile?.robloxUsername || user?.robloxUsername || "");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "");
  const [saving, setSaving] = useState(false);

  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [spinAngle, setSpinAngle] = useState(0);
  const [lastSpin, setLastSpin] = useState(() => { try { return localStorage.getItem("rbstars_last_spin") || null; } catch { return null; } });
  const [spinCode, setSpinCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [landedIdx, setLandedIdx] = useState<number | null>(null);
  const pendingWinRef = useRef<{ idx: number; label: string; code: string | null; expiresAt: string | null } | null>(null);
  const settledRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const [spinErr, setSpinErr] = useState<string | null>(null);
  const [rewardCodes, setRewardCodes] = useState<RewardCode[]>([]);
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null);
  const [levelErr, setLevelErr] = useState<string | null>(null);

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Pull our issued reward codes + the server's spin state (source of truth
  // for "come back tomorrow" — localStorage is only a cache). Silently skips
  // when logged out, offline, or before the rewards API is deployed.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${BACKEND_URL}/api/rewards/claims`, { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (cancelled || !res?.success) return;
        const d = res.data;
        setRewardCodes(d.claims || []);
        try {
          if (d.lastSpin) {
            setLastSpin(d.lastSpin);
            localStorage.setItem("rbstars_last_spin", d.lastSpin);
          } else {
            setLastSpin(null);
            localStorage.removeItem("rbstars_last_spin");
          }
        } catch {}
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  async function handleSave() {
    setSaving(true);
    const data = { displayName, robloxUsername, email, avatar };
    saveProfile(data);
    try {
      // Actually persist to the server — the old code only wrote localStorage,
      // so "Save Changes" looked successful and silently reverted on reload.
      const res = await fetch(`${BACKEND_URL}/api/customer-auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ displayName: displayName.trim(), robloxUsername: robloxUsername.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Failed to save your profile. Please try again.");
        return;
      }
      updateUser((json?.customer || { displayName, robloxUsername }) as any);
      setEditing(false);
    } catch {
      alert("Network error — your changes were only saved locally.");
    } finally {
      setSaving(false);
    }
  }

  // The wheel has physically stopped → reveal the golden wedge, then the popup.
  function settleSpin() {
    if (settledRef.current) return;
    settledRef.current = true;
    setSpinning(false);
    const w = pendingWinRef.current;
    if (!w) return;
    setLandedIdx(w.idx); // golden glow blooms on the landed wedge
    window.setTimeout(() => {
      setSpinResult(w.label);
      setSpinCode(w.code && w.expiresAt ? { code: w.code, expiresAt: w.expiresAt } : null);
    }, 520);
  }

  function handleSpin() {
    if (spinning || lastSpin === todayKey() || wheelLocked) return;
    setSpinning(true);
    setSpinErr(null);
    setSpinResult(null);
    setSpinCode(null);
    setLandedIdx(null);

    const ctrl = new AbortController();
    const abortTimer = setTimeout(() => ctrl.abort(), 9000);

    const finish = (data: { idx: number; label: string; code: string | null; expiresAt: string | null; lastSpin?: string }) => {
      clearTimeout(abortTimer);
      // Land the wheel on the chosen wedge — absolute target, never drifts
      const targetAngle = 360 * 7 + (360 - data.idx * 45 - 22.5);
      setSpinAngle((prev) => prev - (prev % 360) + targetAngle);
      const key = data.lastSpin || todayKey();
      setLastSpin(key);
      try { localStorage.setItem("rbstars_last_spin", key); } catch {}
      if (data.code && data.expiresAt) {
        const value = parseInt(data.label, 10) || 0;
        saveWonPromo(data.code, value);
        setRewardCodes((prev) => [
          { kind: "spin", level: null, label: data.label, code: data.code!, expiresAt: data.expiresAt! },
          ...prev.filter((c) => !(c.kind === "spin" && c.code === data.code)),
        ]);
      }
      // Reveal when the wheel actually settles (transitionend), with a safety
      // window for reduced-motion / missed events.
      pendingWinRef.current = data;
      settledRef.current = false;
      window.setTimeout(() => settleSpin(), reducedMotion ? 500 : 6600);
    };

    fetch(`${BACKEND_URL}/api/rewards/spin`, {
      method: "POST",
      headers: authHeaders(token),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (r.status === 409) {
          const e: any = new Error(body?.message || "You already spun today — come back tomorrow");
          e.alreadySpun = true;
          e.lastSpin = body?.lastSpin;
          throw e;
        }
        if (!r.ok) throw new Error(body?.message || "Spin failed — try again");
        finish(body.data);
      })
      .catch((err: unknown) => {
        clearTimeout(abortTimer);
        if (err && typeof err === "object" && (err as any).alreadySpun) {
          setSpinning(false);
          const key = (err as any).lastSpin || todayKey();
          setLastSpin(key);
          try { localStorage.setItem("rbstars_last_spin", key); } catch {}
          setSpinErr((err as Error).message);
        } else {
          setSpinning(false);
          if (err instanceof DOMException && err.name === "AbortError") {
            setSpinErr("Server took too long — try again");
          } else {
            setSpinErr(err instanceof Error ? err.message : "Spin failed — try again");
          }
        }
      });
  }

  // Exchange an unlocked level milestone for a real one-time promo code.
  async function claimLevelReward(rewardLevel: number) {
    if (claimingLevel) return;
    if (!token) { openAuthModal("login"); return; }
    setClaimingLevel(rewardLevel);
    setLevelErr(null);
    try {
      const r = await fetch(`${BACKEND_URL}/api/rewards/claim-level`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ level: rewardLevel }),
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error(body?.message || "Claim failed — try again");
      const d = body.data;
      setRewardCodes((prev) => [
        { kind: "level", level: d.level, label: d.label, code: d.code, expiresAt: d.expiresAt },
        ...prev.filter((c) => !(c.kind === "level" && c.level === d.level)),
      ]);
    } catch (err) {
      setLevelErr(err instanceof Error ? err.message : "Claim failed — try again");
    } finally {
      setClaimingLevel(null);
    }
  }

  const totalSpent = user?.totalSpent || 0;
  const level = getLevel(totalSpent);
  const spendInfo = getSpendInLevel(totalSpent);
  const totalXP = Math.round(totalSpent * 10);
  const levelXP = { current: Math.round(spendInfo.current * 10), needed: Math.round(spendInfo.needed * 10) };
  const canSpin = level >= 10 && lastSpin !== todayKey();
  const wheelLocked = level < 10;

  // Level-up celebration: milestone levels only, once per level per browser.
  useEffect(() => {
    if (!user) return;
    const seen = Number(localStorage.getItem("rbstars_level_seen") || 0);
    if (seen === 0) { try { localStorage.setItem("rbstars_level_seen", String(level)); } catch {} return; }
    if (level > seen) {
      try { localStorage.setItem("rbstars_level_seen", String(level)); } catch {}
      if (LEVEL_REWARDS.some((r) => r.level === level)) {
        setNewLevel(level);
        setShowLevelUp(true);
      }
    }
  }, [user, level]);

  const cardStyle = { background: HC.card, border: `1px solid ${HC.border}` };

  return (
    <div className="min-h-screen" style={{ background: HC.bg }}>

      {/* Topbar */}
      <div className="w-full sticky top-0 z-30 overflow-hidden sm:h-[73px] h-[60px]" style={{ borderBottom: "1px solid #2C414E", background: "#0F1920" }}>
        <img src="/item-star.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-gem.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-crystals.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-controller.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-sword.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-heart.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <button onClick={() => navigate("/")} className="absolute flex items-center gap-2 sm:gap-3 select-none z-10" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
          <img src="/rb-logo.png" alt="RBstars" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row">

        {/* LEFT PANEL */}
        <div className="hidden sm:flex w-[380px] flex-shrink-0 flex-col items-center justify-center p-8 relative overflow-hidden" style={{ background: "#0D1520", height: "calc(100vh - 73px)", position: "sticky", top: 73 }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.4 }} />
            <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
            <div className="absolute top-[45%] left-[10%] w-1 h-1 rounded-full" style={{ background: "#5CB8FF", opacity: 0.25 }} />
            <div className="absolute top-[60%] right-[12%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.35 }} />
            <div className="absolute top-[80%] left-[25%] w-1.5 h-1.5 rounded-full" style={{ background: "#5CB8FF", opacity: 0.2 }} />
            <div className="absolute top-[35%] left-[35%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.4 }} />
            <div className="absolute top-[55%] right-[45%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.3 }} />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(59,167,255,0.15), transparent 70%)" }} />

          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }} className="relative z-10 mb-2">
            <img src="/rb-logo.png" alt="RBstars" className="block mx-auto w-24 h-24 object-contain" />
          </motion.div>
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }} className="relative z-10 text-center">
            <p className="text-sm leading-relaxed max-w-[220px] mx-auto" style={{ color: "#637784" }}>
              Manage your profile, track your level, and unlock exclusive rewards.
            </p>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3BA7FF" }} />
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 relative overflow-hidden px-4 sm:px-10 lg:px-16 pt-14 sm:pt-20 lg:pt-24 pb-14">

          {/* Radial glow at top — full-width, fades exactly at the edges (no clipping) */}
          <div className="absolute top-0 inset-x-0 h-[700px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse 50% 100% at 50% 0%, rgba(59,167,255,0.15) 0%, rgba(59,167,255,0.07) 55%, transparent 100%)" }} />

          <div className="w-full max-w-3xl mx-auto relative z-10">

            {/* Hero — same treatment as BROWSE OUR GAMES */}
            <div className="text-center mb-12 sm:mb-16">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-[32px] sm:text-[42px] lg:text-[50px] font-extrabold leading-[1.05] tracking-tight"
                style={{ color: HC.textPrimary }}
              >
                PERSONEL <span style={{ color: HC.accent }}>PROFILE</span>
              </motion.h1>
            </div>

            {/* ══════════ WELCOME CARD ══════════ */}
            <section className="relative mb-16 overflow-hidden">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
                className="rounded-2xl px-6 py-5 flex items-center gap-4"
                style={cardStyle}>
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden">
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-lg" style={{ color: HC.textSecondary }}>{(displayName || "R")[0].toUpperCase()}</span>}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: HC.bg, border: `2px solid ${HC.card}` }}>
                    <span className="text-[10px] font-bold text-white">{level}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold" style={{ color: HC.textPrimary }}>Welcome, {displayName || "User"}</p>
                    <span className="text-[11px] font-bold tracking-wider" style={{ color: HC.accent }}>LEVEL {level}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden mb-1.5" style={{ background: HC.border }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${spendInfo.percent}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: HC.accent }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold" style={{ color: HC.textSecondary }}>{totalXP.toLocaleString()} XP earned</span>
                    <span className="text-[11px] font-semibold" style={{ color: HC.textSecondary }}>
                      {levelXP.current.toLocaleString()} / {levelXP.needed.toLocaleString()} XP to next level
                    </span>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* ══════════ SECTION: EDIT PROFILE ══════════ */}
            <section className="relative mb-16 overflow-hidden">
              <SectionHeader
                eyebrow="Settings"
                title="Edit"
                accent="Profile"
                subtitle="Update your personal details and avatar."
                right={
                  <button onClick={() => editing ? setEditing(false) : setEditing(true)}
                    className="shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: HC.elevated, color: editing ? "#EF4444" : "white", border: `1px solid ${editing ? "#EF4444" : HC.border}`, boxShadow: "0 3px 0 0 #0C141B" }}>
                    {editing ? "Cancel" : "Edit"}
                  </button>
                }
              />
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
                className="rounded-2xl px-6 py-6 space-y-5"
                style={cardStyle}>

                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden">
                      {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xl font-bold text-white">{(displayName || "R")[0].toUpperCase()}</span>}
                    </div>
                    {editing && (
                      <label className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.6)" }}>
                        <Camera size={18} color="white" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setAvatar(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: HC.textPrimary }}>{displayName || "User"}</p>
                    <p className="text-xs font-bold" style={{ color: HC.textMuted }}>{editing ? "Hover avatar to change" : "Press edit to edit the profile"}</p>
                  </div>
                </div>

                <ProfileField label="Display Name" value={displayName} onChange={setDisplayName} disabled={!editing} />
                <ProfileField label="Roblox Username" value={robloxUsername} onChange={setRobloxUsername} disabled={!editing} />
                <ProfileField label="Email" value={email} onChange={setEmail} disabled={!editing} type="email" />
                {editing && (
                  <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleSave} disabled={saving}
                    className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 text-sm"
                    style={{ background: saving ? HC.border : HC.accent, boxShadow: "0 4px 0 0 #2980b9" }}>
                    {saving ? <><RotateCw size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save Changes</>}
                  </motion.button>
                )}
              </motion.div>
            </section>

            {/* ══════════ SECTION: LEVEL REWARDS ══════════ */}
            <section className="relative mb-16">
              <div className="relative z-10">
                <SectionHeader
                  eyebrow="Progression"
                  title="Level"
                  accent="Rewards"
                  subtitle="Earn 10 XP for every $1 you spend — climb levels and unlock bigger discounts, up to 35% OFF."
                />
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}>

                  {/* Card-pack track */}
                  <div style={{
                    overflowX: "auto",
                    paddingBottom: 12,
                    WebkitMaskImage: "linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
                    maskImage: "linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
                    scrollbarWidth: "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                      {LEVEL_REWARDS.map((reward, i) => {
                        const unlocked = level >= reward.level;
                        const isNext = !unlocked && reward.level === LEVEL_REWARDS.find(r => level < r.level)?.level;
                        const status: "completed" | "next" | "locked" = unlocked ? "completed" : isNext ? "next" : "locked";
                        const claim = rewardCodes.find((c) => c.kind === "level" && c.level === reward.level);
                        return (
                          <div key={reward.level} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                            <RewardCard
                              level={reward.level}
                              reward={reward.label}
                              tier={EMBLEM_TIERS[Math.min(i, EMBLEM_TIERS.length - 1)]}
                              status={status}
                              img={reward.img}
                              code={claim?.code || null}
                              claiming={claimingLevel === reward.level}
                              onClaim={() => claimLevelReward(reward.level)}
                            />
                            {i < LEVEL_REWARDS.length - 1 && <Connector active={unlocked} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {levelErr && (
                    <p className="mt-3 text-xs font-bold text-center" style={{ color: "#F87171" }}>{levelErr}</p>
                  )}

                </motion.div>
              </div>
            </section>

            {/* ══════════ SECTION: DAILY SPIN ══════════ */}
            <section className="relative mb-6 overflow-hidden">
              <SectionHeader
                eyebrow={wheelLocked ? "Unlocks at Level 10" : "Daily Bonus"}
                title="Daily"
                accent="Spin"
                subtitle={wheelLocked ? "Earn XP by spending to reach level 10 and unlock the daily spin wheel!" : "Spin once a day for a shot at real discounts — up to 30% OFF."}
              />
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
                className="px-6 py-4 flex flex-col items-center">

                <div className="mb-8">
                  <SpinWheel prizes={SPIN_PRIZES} angle={spinAngle} spinning={spinning} locked={wheelLocked}
                    highlight={landedIdx} onSettle={settleSpin} />
                </div>

                <button onClick={handleSpin} disabled={wheelLocked || !canSpin || spinning}
                  className="px-8 py-3.5 rounded-xl font-extrabold text-white text-sm flex items-center gap-2 transition-all"
                  style={{
                    background: wheelLocked || !canSpin || spinning ? HC.border : HC.accent,
                    boxShadow: !wheelLocked && canSpin && !spinning ? "0 4px 0 0 #2980b9" : "none",
                    cursor: !wheelLocked && canSpin && !spinning ? "pointer" : "not-allowed",
                  }}>
                  {wheelLocked ? <><Lock size={15} /> Level 10 Required</>
                    : spinning ? <><RotateCw size={15} className="animate-spin" /> Spinning...</>
                      : lastSpin === todayKey() ? "Come Back Tomorrow!"
                        : <><Star size={15} /> Spin Now!</>}
                </button>

                {wheelLocked && (
                  <p className="text-xs font-bold mt-4 text-center" style={{ color: HC.textMuted }}>
                    You're Level {level} — spend more to reach Level 10 and start spinning.
                  </p>
                )}

                {spinErr && !spinning && (
                  <p className="mt-4 text-xs font-bold text-center" style={{ color: "#F87171" }}>{spinErr}</p>
                )}
              </motion.div>
            </section>

          </div>
        </div>
      </div>

      {/* Level Up Popup */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-8 text-center" style={cardStyle}>
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(59,167,255,0.15)", border: `2px solid ${HC.accent}` }}>
                <Star size={32} fill={HC.accent} color={HC.accent} />
              </motion.div>
              <h3 className="text-2xl font-black mb-2" style={{ color: HC.textPrimary }}>Level Up!</h3>
              <p className="text-lg font-bold mb-4" style={{ color: HC.accent }}>You reached Level {newLevel}</p>
              <p className="text-sm mb-6" style={{ color: HC.textMuted }}>
                {LEVEL_REWARDS.find(r => r.level === newLevel)
                  ? `You unlocked: ${LEVEL_REWARDS.find(r => r.level === newLevel)!.label} — claim your code on the card below!`
                  : "Keep going to unlock more rewards!"}
              </p>
              <button onClick={() => setShowLevelUp(false)}
                className="px-8 py-3 rounded-xl font-extrabold text-white text-sm"
                style={{ background: HC.accent, boxShadow: "0 4px 0 0 #2980b9" }}>
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spin win popup — voucher reveal */}
      <AnimatePresence>
        {spinResult && (
          <WinModal
            label={spinResult}
            code={spinCode?.code ?? null}
            expiresAt={spinCode?.expiresAt ?? null}
            onClose={() => { setSpinResult(null); setSpinCode(null); }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

/* ── Level Rewards card pack (reference layout, HC palette) ── */
const EMBLEM_TIERS = [
  "chevron1", "chevron2", "chevron3", "wings", "wings", "shield", "shield",
  "shieldLaurel", "shieldLaurel", "goldShield", "goldShield", "goldStars", "goldStars",
] as const;

function Connector({ active }: { active: boolean }) {
  return (
    <div style={{
      width: 56,
      height: 2,
      flexShrink: 0,
      marginTop: 68,
      backgroundImage: `repeating-linear-gradient(to right, ${active ? HC.accent : HC.border} 0 6px, transparent 6px 12px)`,
      opacity: active ? 0.9 : 0.5,
    }} />
  );
}

/* ── Spin win popup: golden voucher reveal, sticker card ── */
function WinModal({ label, code, expiresAt, onClose }: {
  label: string;
  code: string | null;
  expiresAt: string | null;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const pct = parseInt(label, 10) || 0;
  const voucher = SPIN_VOUCHER[pct];
  const fxRef = useRef<HTMLDivElement>(null);

  // confetti burst on open (WAAPI, reduced-motion aware)
  useEffect(() => {
    if (reduced || !fxRef.current) return;
    const host = fxRef.current;
    const cols = ["#FFC53D", "#3BA7FF", "#F4F8FB", "#EF4444"];
    const nodes: HTMLElement[] = [];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement("span");
      const s = 7 + Math.random() * 8;
      el.style.cssText =
        `position:absolute;left:${8 + Math.random() * 84}%;top:${4 + Math.random() * 26}%;` +
        `width:${s}px;height:${s}px;background:${cols[i % 4]};border:1.5px solid #05090D;` +
        `border-radius:3px;pointer-events:none;`;
      host.appendChild(el);
      nodes.push(el);
      const dx = (Math.random() - 0.5) * 360;
      const dy = 160 + Math.random() * 260;
      const rot = (Math.random() - 0.5) * 720;
      el.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: 1300 + Math.random() * 700, delay: Math.random() * 400, easing: "cubic-bezier(.15,.75,.3,1)", fill: "forwards" }
      );
    }
    return () => nodes.forEach((n) => n.remove());
  }, [reduced]);

  // Esc closes
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(5,9,13,0.82)", backdropFilter: "blur(10px)" }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.28, ease: [0.19, 1, 0.22, 1] }}
        className="relative w-full max-w-[430px] rounded-[26px] overflow-hidden"
        style={{ background: "#F4F8FB", border: "4px solid #05090D", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
      >
        {/* ── TOP: flat gold + voucher reveal ── */}
        <div className="relative overflow-hidden" style={{ background: "#FFC53D", borderBottom: "4px solid #05090D", padding: "32px 24px 26px" }}>
          {/* confetti layer */}
          <div ref={fxRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} />

          <div className="relative flex flex-col items-center" style={{ zIndex: 2 }}>
            <div
              className="mb-4 px-5 py-2 rounded-xl"
              style={{
                transform: "rotate(-3deg)",
                background: "#05090D", color: "#FFC53D",
                fontFamily: "inherit", fontWeight: 900, fontSize: 20, letterSpacing: "0.08em",
                textTransform: "uppercase", boxShadow: "5px 5px 0 rgba(5,9,13,0.28)",
              }}
            >
              You Won!
            </div>
            {voucher ? (
              <img
                src={voucher}
                alt={`${label} voucher`}
                style={{ width: 220, transform: "rotate(-4deg)", filter: "drop-shadow(0 16px 20px rgba(5,9,13,0.35))" }}
              />
            ) : (
              <div className="py-6 px-8 rounded-2xl" style={{ background: "#F4F8FB", border: "3px solid #05090D", fontSize: 42, fontWeight: 900, color: "#05090D" }}>
                {label}
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM: split — prize | code ── */}
        <div className="p-5" style={{ background: "#F4F8FB" }}>
          <div className="flex items-stretch gap-4">
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#637784" }}>
                Daily Spin Prize
              </p>
              <p style={{ fontSize: 40, lineHeight: 1, fontWeight: 900, color: "#05090D", marginTop: 4 }}>{label}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#637784", marginTop: 6 }}>
                {code && expiresAt ? `One-time code · expires ${new Date(expiresAt).toLocaleDateString()}` : "Discount voucher unlocked"}
              </p>
            </div>

            <div style={{ width: 0, borderLeft: "2px dashed rgba(5,9,13,0.22)" }} />

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {code ? (
                <>
                  <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#637784" }}>
                    Your Code
                  </p>
                  <div className="flex items-center gap-2" style={{ marginTop: 5 }}>
                    <code style={{
                      padding: "7px 10px", borderRadius: 9, fontSize: 13, fontWeight: 900, letterSpacing: "0.1em",
                      border: "2px dashed #05090D", background: "#FFFFFF", color: "#05090D", whiteSpace: "nowrap",
                    }}>
                      {code}
                    </code>
                    <CopyBtn text={code} compact />
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#637784", marginTop: 6 }}>
                    Auto-applied at checkout
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#637784" }}>
                    Your Code
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#637784", marginTop: 5 }}>
                    Check your rewards list — your discount is ready to use.
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full"
            style={{
              marginTop: 18, padding: "14px 0", borderRadius: 14,
              background: "#3BA7FF", color: "#FFFFFF",
              border: "3px solid #05090D", boxShadow: "0 5px 0 #05090D",
              fontSize: 13, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Collect Reward
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CopyBtn({ text, compact }: { text: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (compact) {
    return (
      <button type="button" onClick={copy} aria-label="Copy reward code"
        style={{
          width: 24, height: 24, borderRadius: 7, padding: 0,
          border: `1px solid ${HC.accent}`,
          background: copied ? "rgba(59,167,255,0.28)" : "rgba(59,167,255,0.12)",
          color: HC.accent, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
        {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
      </button>
    );
  }

  return (
    <button type="button" onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest"
      style={{
        background: copied ? "rgba(59,167,255,0.2)" : HC.accent,
        border: `1px solid ${HC.accent}`,
        color: "#fff",
        cursor: "pointer",
      }}>
      {copied ? <><Check size={12} strokeWidth={3} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

function RewardCard({ level, reward, tier, status, img, code, claiming, onClaim }: {
  level: number; reward: string; tier: string; status: "completed" | "next" | "locked";
  img?: string | null; code?: string | null; claiming?: boolean; onClaim?: () => void;
}) {
  const gradId = `goldGrad-L${level}`;
  const isCompleted = status === "completed";
  const isNext = status === "next";

  const borderColor = isCompleted || isNext ? HC.accent : "#243644";
  const glow = isCompleted
    ? `0 0 0 1px ${HC.accent}55, 0 0 24px -6px ${HC.accent}66`
    : isNext ? `0 0 0 1px ${HC.accent}44` : "none";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "relative",
        width: 132,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{
        position: "relative",
        width: 108,
        height: 148,
        borderRadius: 16,
        border: `1.5px solid ${borderColor}`,
        // IMG_9185 starburst texture, faintly tinted so it sits in the dark theme
        backgroundColor: HC.bgSecondary,
        backgroundImage: `linear-gradient(rgba(10,18,26,0.18), rgba(10,18,26,0.18)), url("/rewards/card-bg.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: glow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        {/* diagonal watermark */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          backgroundImage: `repeating-linear-gradient(45deg, ${HC.textPrimary} 0 1px, transparent 1px 10px)`,
        }} />

        {/* corner rivets */}
        {[{ top: 8, left: 8 }, { top: 8, right: 8 }].map((pos, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: HC.border,
            ...pos,
          } as CSSProperties} />
        ))}

        <div style={{ position: "relative", width: img ? 78 : 56, height: img ? 78 : 56 }}>
          {img ? (
            <>
              {/* vector burst — soft blue glow + rays + sparkles radiating from
                  behind the ticket, so the light coupon reads against the art */}
              <svg
                viewBox="0 0 100 100"
                width="106"
                height="106"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <defs>
                  <radialGradient id={`${gradId}-burst`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.32)" />
                    <stop offset="65%" stopColor="rgba(255,255,255,0.13)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill={`url(#${gradId}-burst)`} />
                {Array.from({ length: 12 }).map((_, i) => (
                  <path
                    key={i}
                    d={i % 2 === 0 ? "M50 50 L46.5 2 L53.5 2 Z" : "M50 50 L47.5 15 L52.5 15 Z"}
                    transform={`rotate(${i * 30} 50 50)`}
                    fill={i % 2 === 0 ? "rgba(255,255,255,0.48)" : "rgba(255,255,255,0.26)"}
                  />
                ))}
                {/* sparkle stars */}
                <path d="M17 11 L18.6 16.4 L24 18 L18.6 19.6 L17 25 L15.4 19.6 L10 18 L15.4 16.4 Z" fill="rgba(255,255,255,0.7)" />
                <path d="M84 74 L85.2 78.2 L89.4 79.4 L85.2 80.6 L84 84.8 L82.8 80.6 L78.6 79.4 L82.8 78.2 Z" fill="rgba(255,255,255,0.8)" />
                <path d="M81 15 L81.9 18.1 L85 19 L81.9 19.9 L81 23 L80.1 19.9 L77 19 L80.1 18.1 Z" fill="rgba(255,255,255,0.5)" />
                <path d="M14 79 L14.8 82 L17.8 82.8 L14.8 83.6 L14 86.6 L13.2 83.6 L10.2 82.8 L13.2 82 Z" fill="rgba(255,255,255,0.6)" />
              </svg>
              <img
                src={img}
                alt=""
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                }}
              />
            </>
          ) : (
            <svg viewBox="0 0 40 40" width="100%" height="100%">
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F0D590" />
                  <stop offset="100%" stopColor="#B8862E" />
                </linearGradient>
              </defs>
              <Emblem tier={tier} fill={`url(#${gradId})`} />
            </svg>
          )}
        </div>

        {/* status badge */}
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          {isCompleted ? (
            <div style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: HC.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Check size={13} color={HC.bg} strokeWidth={3} />
            </div>
          ) : (
            <div style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: HC.bgSecondary,
              border: `1px solid ${borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Lock size={11} color={isNext ? HC.accent : HC.textMuted} />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: isCompleted || isNext ? HC.textPrimary : HC.textSecondary, letterSpacing: "0.04em" }}>
        LEVEL {level}
      </div>
      <div style={{ marginTop: 2, fontSize: 12, color: HC.textMuted, textAlign: "center" }}>{reward}</div>

      {/* reached milestone: show the issued code, or a claim button */}
      {status === "completed" && (
        code ? (
          <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 4 }}>
            <code style={{
              fontSize: 10, fontWeight: 900, letterSpacing: "0.07em",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: HC.accent, background: "rgba(59,167,255,0.12)",
              border: "1px solid rgba(59,167,255,0.45)",
              padding: "3px 7px", borderRadius: 7, whiteSpace: "nowrap",
            }}>{code}</code>
            <CopyBtn text={code} compact />
          </div>
        ) : onClaim ? (
          <button
            type="button"
            onClick={onClaim}
            disabled={claiming}
            style={{
              marginTop: 7, width: 108, height: 27, borderRadius: 9, border: "none",
              background: claiming ? HC.border : HC.accent,
              color: claiming ? HC.textMuted : "#FFFFFF",
              fontSize: 10, fontWeight: 900, letterSpacing: "0.07em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              boxShadow: claiming ? "none" : "0 3px 0 0 #2980b9",
              cursor: claiming ? "default" : "pointer",
            }}>
            {claiming ? <><RotateCw size={11} className="animate-spin" /> CLAIMING…</> : `CLAIM ${reward}`}
          </button>
        ) : null
      )}
    </motion.div>
  );
}

/* escalating insignia — chevrons → wings → shields → gold */
function Emblem({ tier, fill }: { tier: string; fill: string }) {
  switch (tier) {
    case "chevron1":
      return <path d="M10 24 L20 14 L30 24" stroke={fill} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    case "chevron2":
      return (
        <g stroke={fill} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 20 L20 11 L30 20" />
          <path d="M10 29 L20 20 L30 29" />
        </g>
      );
    case "chevron3":
      return (
        <g stroke={fill} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 16 L20 6 L32 16" />
          <path d="M8 24 L20 14 L32 24" />
          <path d="M8 32 L20 22 L32 32" />
        </g>
      );
    case "wings":
      return (
        <g fill={fill}>
          <path d="M20 10 L23 22 L20 32 L17 22 Z" />
          <path d="M18 18 C10 16 5 12 2 6 C8 8 14 10 18 16 Z" />
          <path d="M22 18 C30 16 35 12 38 6 C32 8 26 10 22 16 Z" />
        </g>
      );
    case "shield":
      return (
        <path
          d="M20 4 L34 9 V19 C34 28 28 34 20 37 C12 34 6 28 6 19 V9 Z"
          fill="none"
          stroke={fill}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      );
    case "shieldLaurel":
      return (
        <g>
          <path
            d="M20 6 L31 10 V19 C31 27 26 32 20 34 C14 32 9 27 9 19 V10 Z"
            fill="none"
            stroke={fill}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M9 30 C5 26 4 20 5 14" stroke={fill} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M31 30 C35 26 36 20 35 14" stroke={fill} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "goldShield":
      return (
        <g>
          <path d="M20 5 L32 9.5 V19 C32 27 26.5 33 20 35.5 C13.5 33 8 27 8 19 V9.5 Z" fill={fill} />
          <path d="M20 5 L32 9.5 V19 C32 27 26.5 33 20 35.5" fill="none" stroke={HC.textPrimary} strokeOpacity="0.15" strokeWidth="1" />
        </g>
      );
    case "goldStars":
      return (
        <g>
          <path d="M20 6 L31 10 V19 C31 27 26 32 20 34 C14 32 9 27 9 19 V10 Z" fill={fill} />
          <path d="M9 30 C5 26 4 20 5 14" stroke={fill} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M31 30 C35 26 36 20 35 14" stroke={fill} strokeWidth="2" fill="none" strokeLinecap="round" />
          {[[13, 4], [20, 1], [27, 4]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill={fill} />
          ))}
        </g>
      );
    default:
      return null;
  }
}
