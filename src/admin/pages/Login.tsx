import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminApi } from "../api";
import { useLocation } from "wouter";

const NAVY = "#0E1A3C";
const ROYAL = "#2B50F6";

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
    <div className="min-h-screen dot-grid flex items-center justify-center p-4" style={{ background: "#F6F8FE" }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: -6 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: NAVY, boxShadow: "var(--shadow-soft-md)" }}
          >
            <ShieldCheck className="w-8 h-8" style={{ color: "#FFC53D" }} />
          </motion.div>
          <h1 className="font-display text-3xl tracking-tight" style={{ color: NAVY }}>
            RB<span style={{ color: ROYAL }}>stars</span> Panel
          </h1>
          <p className="text-sm mt-2 font-medium" style={{ color: "#5A6478" }}>Sign in to your admin panel</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-full p-1 mb-6 bg-white" style={{ border: "1px solid rgba(14,26,60,.12)", boxShadow: "var(--shadow-soft-xs)" }}>
          {(["owner", "member"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                mode === m ? "text-white shadow-md" : "hover:bg-[#EEF3FB]"
              }`}
              style={mode === m ? { background: NAVY } : { color: "#5A6478" }}
            >
              {m === "owner" ? "Owner" : "Team Member"}
            </button>
          ))}
        </div>

        <div className="rounded-3xl p-7 bg-white" style={{ border: "1px solid rgba(14,26,60,.08)", boxShadow: "var(--shadow-soft-lg)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: "#5A6478" }}>Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9AA3B8" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-shadow"
                  style={{ border: `1.5px solid ${error ? "#D92D20" : "rgba(14,26,60,.14)"}`, color: NAVY }}
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: "#5A6478" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9AA3B8" }} />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none"
                  style={{ border: `1.5px solid ${error ? "#D92D20" : "rgba(14,26,60,.14)"}`, color: NAVY }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-[#2B50F6] transition-colors"
                  style={{ color: "#9AA3B8" }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm px-4 py-3 rounded-xl font-medium"
                style={{ background: "#FDEEEC", border: "1px solid rgba(217,45,32,.35)", color: "#B42318" }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { y: -2, boxShadow: "0 16px 36px -10px rgba(43,80,246,.6)" } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full font-bold text-white py-3.5 rounded-full flex items-center justify-center gap-2 transition-shadow disabled:opacity-60"
              style={{ background: "linear-gradient(180deg,#3D63FF 0%,#2B50F6 100%)", boxShadow: "0 10px 26px -8px rgba(43,80,246,.55)" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 flex items-center justify-center gap-2 font-medium" style={{ color: "#9AA3B8" }}>
          Authorized access only
        </p>
      </motion.div>
    </div>
  );
}
