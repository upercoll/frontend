import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminApi } from "../api";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"owner" | "member">("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let res;
      if (mode === "owner") {
        res = await adminApi.auth.ownerLogin(email, password);
        login(res.token, res.data.user, res.data.profile);
        navigate(res.data.profileComplete ? "/admin/dashboard" : "/admin/profile-setup");
      } else {
        res = await adminApi.auth.memberLogin(email, password);
        login(res.token, res.data.user, res.data.profile);
        navigate(res.data.profile?.profileComplete ? "/panel/dashboard" : "/panel/profile-setup");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#131C23" }}>
      <div className="flex flex-col sm:flex-row min-h-screen">
        {/* Hero panel — desktop */}
        <div className="hidden sm:flex w-[380px] flex-shrink-0 relative flex-col items-center justify-center text-center p-8 overflow-hidden" style={{ background: "#0D1520" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.4 }} />
            <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
            <div className="absolute top-[45%] left-[10%] w-1 h-1 rounded-full" style={{ background: "#5CB8FF", opacity: 0.25 }} />
            <div className="absolute top-[60%] right-[12%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.35 }} />
            <div className="absolute top-[80%] left-[25%] w-1.5 h-1.5 rounded-full" style={{ background: "#5CB8FF", opacity: 0.2 }} />
            <div className="absolute top-[15%] left-[50%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
            <div className="absolute top-[35%] left-[35%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.4 }} />
            <div className="absolute top-[55%] right-[45%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.3 }} />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(59,167,255,0.15), transparent 70%)" }} />
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }} className="relative z-10 mb-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 8px 24px rgba(59,167,255,0.3)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
            </div>
          </motion.div>
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }} className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: "#F4F8FB" }}>
              RB<span style={{ color: "#3BA7FF" }}>stars</span>
            </h1>
            <p className="text-sm leading-relaxed max-w-[220px] mx-auto" style={{ color: "#637784" }}>
              Manage your store, orders, and team from the admin dashboard.
            </p>
          </motion.div>
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3BA7FF" }} />
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md mx-auto">

            {/* Mobile logo */}
            <div className="sm:hidden flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#3BA7FF" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
              </div>
              <span className="text-lg font-black" style={{ color: "#F4F8FB" }}>RB<span style={{ color: "#3BA7FF" }}>stars</span></span>
            </div>

            {/* Header */}
            <div className="mb-6 text-center sm:text-left">
              <img src="/staff-avatar.webp" alt="" className="w-16 h-16 mx-auto sm:mx-0 mb-4 object-contain" style={{ filter: "drop-shadow(0 4px 20px rgba(59,167,255,0.3))" }} />
              <h2 className="text-2xl font-extrabold mb-1" style={{ color: "#F4F8FB" }}>Admin Panel</h2>
              <p className="text-sm" style={{ color: "#637784" }}>Sign in to manage your store and team</p>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl p-1 mb-5" style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
              {(["owner", "member"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(""); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: mode === m ? "#3BA7FF" : "transparent",
                    color: mode === m ? "white" : "#637784",
                    boxShadow: mode === m ? "0 3px 0 #1a6bbf" : "none",
                  }}>
                  {m === "owner" ? "Owner" : "Team Member"}
                </button>
              ))}
            </div>

            {/* Form card */}
            <div className="rounded-2xl p-6" style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#3BA7FF" }} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      placeholder="your@email.com"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none font-medium"
                      style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#3BA7FF" }} />
                    <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none font-medium"
                      style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#637784" }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                    {error}
                  </motion.div>
                )}

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Signing in..." : "Sign In"}
                </motion.button>
              </form>
            </div>

            <p className="text-center text-xs mt-6" style={{ color: "#475569" }}>
              RBstars Admin — Authorized access only
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
