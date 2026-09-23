import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Edit3, Camera, Save, X, Lock, RotateCw, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
  { level: 1, label: "5% OFF Coupon", icon: "🏷️" },
  { level: 3, label: "Free Shipping", icon: "🚚" },
  { level: 5, label: "10% OFF Coupon", icon: "🎁" },
  { level: 7, label: "Early Access", icon: "⚡" },
  { level: 10, label: "Daily Spin", icon: "🎰" },
  { level: 15, label: "15% OFF Coupon", icon: "💎" },
  { level: 20, label: "VIP Badge", icon: "👑" },
  { level: 25, label: "20% OFF Coupon", icon: "🔥" },
  { level: 30, label: "Mystery Box", icon: "📦" },
  { level: 35, label: "25% OFF Coupon", icon: "💫" },
  { level: 40, label: "Free Item", icon: "🎮" },
  { level: 45, label: "30% OFF Coupon", icon: "🏆" },
  { level: 50, label: "Legendary Box", icon: "👑" },
];

const SPIN_PRIZES = [
  { label: "5% OFF", color: "#3BA7FF" },
  { label: "10% OFF", color: "#22C55E" },
  { label: "Free Item", color: "#FFC53D" },
  { label: "15% OFF", color: "#EF4444" },
  { label: "2x SPEND", color: "#A855F7" },
  { label: "20% OFF", color: "#3BA7FF" },
  { label: "5% OFF", color: "#22C55E" },
  { label: "Free Ship", color: "#FFC53D" },
];

function loadProfile() { try { const r = localStorage.getItem("rbstars_profile"); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveProfile(d: any) { localStorage.setItem("rbstars_profile", JSON.stringify(d)); }
function getLevel(spent: number) { for (let i = SPEND_LEVELS.length - 1; i >= 0; i--) { if (spent >= SPEND_LEVELS[i]) return i + 1; } return 1; }
function getSpendInLevel(spent: number) { const lvl = getLevel(spent); if (lvl >= SPEND_LEVELS.length) return { current: SPEND_LEVELS[lvl - 1], needed: SPEND_LEVELS[lvl - 1], percent: 100 }; const current = SPEND_LEVELS[lvl - 1]; const needed = SPEND_LEVELS[lvl]; return { current: spent - current, needed: needed - current, percent: ((spent - current) / (needed - current)) * 100 }; }

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };

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
  const { user, updateUser } = useAuth();
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

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  function handleSave() {
    setSaving(true);
    const data = { displayName, robloxUsername, email, avatar };
    saveProfile(data);
    updateUser({ displayName, robloxUsername } as any);
    setTimeout(() => { setSaving(false); setEditing(false); }, 600);
  }

  function handleSpin() {
    if (spinning || lastSpin === new Date().toDateString()) return;
    setSpinning(true);
    setSpinResult(null);
    const idx = Math.floor(Math.random() * SPIN_PRIZES.length);
    const targetAngle = 360 * 6 + (360 - idx * 45 - 22.5);
    setSpinAngle(prev => prev + targetAngle);
    setTimeout(() => {
      setSpinning(false);
      setSpinResult(SPIN_PRIZES[idx].label);
      localStorage.setItem("rbstars_last_spin", new Date().toDateString());
      setLastSpin(new Date().toDateString());
    }, 4200);
  }

  const totalSpent = user?.totalSpent || 0;
  const level = getLevel(totalSpent);
  const spendInfo = getSpendInLevel(totalSpent);
  const canSpin = level >= 10 && lastSpin !== new Date().toDateString();

  const SHADOW = "0 8px 0 0 #1452a0, 0 12px 32px rgba(59,167,255,0.35)";

  return (
    <div className="min-h-screen" style={{ background: HC.bg }}>

      {/* Topbar */}
      <div className="w-full relative overflow-hidden sm:h-[73px] h-[60px]" style={{ borderBottom: "1px solid #2C414E", background: "#0F1920" }}>
        <img src="/item-star.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-gem.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-crystals.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, right: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-controller.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "2%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-sword.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "14%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <img src="/item-heart.png" alt="" className="absolute hidden sm:block" style={{ width: 80, height: 80, left: "26%", top: -4, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" }} />
        <button onClick={() => navigate("/")} className="absolute flex items-center gap-2 sm:gap-3 select-none z-10" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ background: "#3BA7FF", boxShadow: "0 2px 10px rgba(59,167,255,0.4)" }}>
            <Star size={18} fill="white" color="white" />
          </div>
          <span className="font-extrabold tracking-tight text-white" style={{ fontSize: 22, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            RB<span style={{ color: "#3BA7FF" }}>stars</span>
          </span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row min-h-[calc(100vh-73px)]">

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
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }} className="relative z-10 mb-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 8px 24px rgba(59,167,255,0.3)" }}>
              <Star size={36} fill="white" color="white" />
            </div>
          </motion.div>
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }} className="relative z-10 text-center">
            <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: "#F4F8FB" }}>
              RB<span style={{ color: "#3BA7FF" }}>stars</span>
            </h1>
            <p className="text-sm leading-relaxed max-w-[220px] mx-auto" style={{ color: "#637784" }}>
              Manage your profile, track your level, and unlock exclusive rewards.
            </p>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3BA7FF" }} />
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 py-10">
          <div className="w-full max-w-2xl mx-auto space-y-10">

            {/* Back to Store */}
            <button onClick={() => navigate("/")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-white text-sm w-fit"
              style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 6px 16px rgba(59,167,255,0.3)" }}>
              <ArrowLeft size={16} color="white" />
              <span>Back to Store</span>
            </button>

            {/* Welcome Card */}
            <div>
              <div className="rounded-t-2xl overflow-hidden" style={{ background: "#3BA7FF", borderBottom: "2px solid #1a6bbf", boxShadow: SHADOW }}>
                <div className="py-4 pl-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>Dashboard</p>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">Your Profile</h2>
                </div>
              </div>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="rounded-b-2xl rounded-t-none px-6 py-4 flex items-center gap-4"
                style={{ background: "#1C2A34", border: "1.5px solid #2C414E", borderTop: "none" }}>
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ background: HC.accent }}>
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">{(displayName || "R")[0].toUpperCase()}</span>}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: HC.bg, border: `2px solid ${HC.card}` }}>
                    <span className="text-[10px] font-bold text-white">{level}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white mb-2">Welcome, {displayName || "User"}</p>
                  <div className="w-full h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: "#2C414E" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${spendInfo.percent}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #3BA7FF, #5CB8FF)" }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider" style={{ color: "#8b8d98" }}>LEVEL {level}</span>
                    <span className="text-[11px] font-semibold" style={{ color: "#8b8d98" }}>{spendInfo.percent.toFixed(0)}%</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Edit Profile */}
            <div>
              <div className="rounded-t-2xl overflow-hidden" style={{ background: "#3BA7FF", borderBottom: "2px solid #1a6bbf", boxShadow: SHADOW }}>
                <div className="py-4 px-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>Settings</p>
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">Edit Profile</h2>
                  </div>
                  <button onClick={() => editing ? setEditing(false) : setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: "#1C2A34", color: editing ? "#EF4444" : "white", border: `1px solid ${editing ? "#EF4444" : "#2C414E"}`, boxShadow: "0 3px 0 0 #131C23" }}>
                    {editing ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="rounded-b-2xl rounded-t-none px-6 py-6 space-y-5"
                style={{ background: "#1C2A34", border: "1.5px solid #2C414E", borderTop: "none" }}>

                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                      style={{ background: HC.accent, border: "2px solid #2C414E" }}>
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
                    <p className="text-sm font-bold text-white">{displayName || "User"}</p>
                    <p className="text-xs font-bold" style={{ color: "#637784" }}>{editing ? "Hover avatar to change" : "Press edit to edit the profile"}</p>
                  </div>
                </div>

                <ProfileField label="Display Name" value={displayName} onChange={setDisplayName} disabled={!editing} />
                <ProfileField label="Roblox Username" value={robloxUsername} onChange={setRobloxUsername} disabled={!editing} />
                <ProfileField label="Email" value={email} onChange={setEmail} disabled={!editing} type="email" />
                {editing && (
                  <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleSave} disabled={saving}
                    className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 text-sm"
                    style={{ background: saving ? "#2C414E" : HC.accent, boxShadow: "0 4px 0 0 #2980b9" }}>
                    {saving ? <><RotateCw size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save Changes</>}
                  </motion.button>
                )}
              </motion.div>
            </div>

            {/* Level Rewards */}
            <div>
              <div className="rounded-t-2xl overflow-hidden" style={{ background: "#3BA7FF", borderBottom: "2px solid #1a6bbf", boxShadow: SHADOW }}>
                <div className="py-4 pl-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>Progression</p>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">Level Rewards</h2>
                </div>
              </div>
              <div className="rounded-b-2xl rounded-t-none px-6 py-8" style={{ background: "#1C2A34", border: "1.5px solid #2C414E", borderTop: "none" }}>

                {/* Scrollable track */}
                <div className="overflow-x-auto pb-4 -mx-2 px-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#2C414E transparent" }}>
                  <div className="flex items-start" style={{ minWidth: "max-content" }}>

                    {LEVEL_REWARDS.map((reward, i) => {
                      const unlocked = level >= reward.level;
                      const isNext = !unlocked && reward.level === LEVEL_REWARDS.find(r => level < r.level)?.level;
                      return (
                        <div key={reward.level} className="flex flex-col items-center relative" style={{ width: 110 }}>

                          {/* Connecting line to next */}
                          {i < LEVEL_REWARDS.length - 1 && (
                            <div className="absolute top-6 left-[calc(50%+28px)] h-1" style={{
                              width: "calc(100% - 56px)",
                              backgroundImage: `repeating-linear-gradient(90deg, ${unlocked ? HC.accent : "#2C414E"} 0 8px, transparent 8px 16px)`,
                            }} />
                          )}

                          {/* Circle stop */}
                          <div className="relative z-10 overflow-visible">
                            {/* Popping item shadow for locked */}
                            {!unlocked && (
                              <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ filter: "blur(1px)", opacity: 0.35 }}>
                                <span className="text-2xl">{reward.icon}</span>
                              </div>
                            )}
                            <div className="w-12 h-12 rounded-full flex items-center justify-center relative"
                              style={{
                                background: unlocked ? "rgba(59,167,255,0.15)" : "#0C141B",
                                border: `2.5px solid ${unlocked ? HC.accent : isNext ? "rgba(59,167,255,0.4)" : "#2C414E"}`,
                                boxShadow: unlocked
                                  ? "0 4px 0 0 #1a6bbf, 0 0 14px rgba(59,167,255,0.25)"
                                  : "0 4px 0 0 #0a0f14",
                              }}>
                              {unlocked ? (
                                <span className="text-xl">{reward.icon}</span>
                              ) : (
                                <img src="/lock-3d-icon.png" alt="" className="w-5 h-5 object-contain opacity-60" />
                              )}
                            </div>
                            {/* Check badge for unlocked */}
                            {unlocked && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center z-20"
                                style={{ background: "#22C55E", boxShadow: "0 2px 6px rgba(34,197,94,0.4)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" style={{ marginLeft: 1, marginTop: -1 }}>
                                  <polyline points="4 12 9 17 20 6" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Labels */}
                          <div className="mt-3 text-center">
                            <p className="text-[10px] font-bold tracking-wider mb-0.5" style={{ color: unlocked ? HC.accent : isNext ? "#8b8d98" : "#475569" }}>
                              LVL {reward.level}
                            </p>
                            <p className="text-[10px] font-bold leading-tight" style={{ color: unlocked ? "#F4F8FB" : "#475569" }}>
                              {reward.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>

              </div>
            </div>

            {/* Daily Spin */}
            <div>
              <div className="rounded-t-2xl overflow-hidden" style={{ background: "#3BA7FF", borderBottom: "2px solid #1a6bbf", boxShadow: SHADOW }}>
                <div className="py-4 pl-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{level < 10 ? "Unlocks at Level 10" : "Daily Bonus"}</p>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">Daily Spin</h2>
                </div>
              </div>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="rounded-b-2xl rounded-t-none px-6 py-8 flex flex-col items-center"
                style={{ background: "#1C2A34", border: "1.5px solid #2C414E", borderTop: "none" }}>

                {level < 10 ? (
                  <div className="text-center py-8">
                    <Lock size={32} className="mx-auto mb-3" style={{ color: "#637784" }} />
                    <p className="text-sm font-bold mb-1" style={{ color: "#9BAEBB" }}>Level 10 Required</p>
                    <p className="text-xs" style={{ color: "#637784" }}>Keep earning XP to unlock the daily spin wheel!</p>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-8">
                      {/* Pointer */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0" style={{ borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "14px solid #EF4444" }} />
                      <svg width="240" height="240" viewBox="0 0 240 240">
                        <g style={{ transform: `rotate(${spinAngle}deg)`, transformOrigin: "center", transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none" }}>
                          {SPIN_PRIZES.map((prize, i) => {
                            const angle = (360 / SPIN_PRIZES.length) * i;
                            const rad = (angle - 90) * (Math.PI / 180);
                            const x = 120 + 100 * Math.cos(rad);
                            const y = 120 + 100 * Math.sin(rad);
                            const midAngle = ((angle + 360 / SPIN_PRIZES.length / 2 - 90) * Math.PI) / 180;
                            const tx = 120 + 62 * Math.cos(midAngle);
                            const ty = 120 + 62 * Math.sin(midAngle);
                            return (
                              <g key={i}>
                                <path d={`M120,120 L${x},${y} A100,100 0 0,1 ${120 + 100 * Math.cos(((angle + 360 / SPIN_PRIZES.length) - 90) * Math.PI / 180)},${120 + 100 * Math.sin(((angle + 360 / SPIN_PRIZES.length) - 90) * Math.PI / 180)} Z`}
                                  fill={prize.color} opacity={0.85} stroke="#0D1520" strokeWidth="1.5" />
                                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9" fontWeight="bold" style={{ pointerEvents: "none" }}>
                                  {prize.label}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                        <circle cx="120" cy="120" r="28" fill="#0D1520" stroke="#2C414E" strokeWidth="2" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <RotateCw size={18} style={{ color: "#637784" }} />
                      </div>
                    </div>

                    <button onClick={handleSpin} disabled={!canSpin || spinning}
                      className="px-8 py-3.5 rounded-xl font-extrabold text-white text-sm flex items-center gap-2 transition-all"
                      style={{
                        background: !canSpin || spinning ? "#2C414E" : HC.accent,
                        boxShadow: canSpin && !spinning ? "0 4px 0 0 #2980b9" : "none",
                        cursor: canSpin && !spinning ? "pointer" : "not-allowed",
                      }}>
                      {spinning ? <><RotateCw size={15} className="animate-spin" /> Spinning...</>
                        : lastSpin === new Date().toDateString() ? "Come Back Tomorrow!"
                          : <><Star size={15} /> Spin Now!</>}
                    </button>

                    <AnimatePresence>
                      {spinResult && (
                        <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="mt-6 px-6 py-3 rounded-xl text-center"
                          style={{ background: "rgba(59,167,255,0.1)", border: `1px solid ${HC.accent}` }}>
                          <p className="text-sm font-extrabold" style={{ color: HC.accent }}>You won: {spinResult}!</p>
                          <p className="text-[11px] mt-1" style={{ color: "#637784" }}>+10 XP added to your account</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      {/* Level Up Popup */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-8 text-center" style={{ background: "#1C2A34", border: "1.5px solid #2C414E" }}>
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(59,167,255,0.15)", border: "2px solid #3BA7FF" }}>
                <Star size={32} fill="#3BA7FF" color="#3BA7FF" />
              </motion.div>
              <h3 className="text-2xl font-black mb-2" style={{ color: "#F4F8FB" }}>Level Up!</h3>
              <p className="text-lg font-bold mb-4" style={{ color: "#3BA7FF" }}>You reached Level {newLevel}</p>
              <p className="text-sm mb-6" style={{ color: "#637784" }}>
                {LEVEL_REWARDS.find(r => r.level === newLevel)
                  ? `You unlocked: ${LEVEL_REWARDS.find(r => r.level === newLevel)!.label}`
                  : "Keep going to unlock more rewards!"}
              </p>
              <button onClick={() => setShowLevelUp(false)}
                className="px-8 py-3 rounded-xl font-extrabold text-white text-sm"
                style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9" }}>
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
