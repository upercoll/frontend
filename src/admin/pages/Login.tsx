import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen dot-grid flex items-center justify-center p-4" style={{ background: "#F2EEE5" }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: -6 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border-[3px]"
            style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "6px 6px 0 #131313" }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="font-display text-3xl uppercase tracking-wide">
            RB<span style={{ color: "#E2231A" }}>STARS</span> Panel
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] mt-2" style={{ color: "#8a8375" }}>
            Sign in to your admin panel
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-full p-1 mb-6 bg-white" style={{ border: "2px solid #131313", boxShadow: "3px 3px 0 #131313" }}>
          {(["owner", "member"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                mode === m ? "text-white" : "hover:bg-[#F2EEE5]"
              }`}
              style={mode === m ? { background: "#131313", color: "#F2EEE5" } : { color: "#6B655C" }}
            >
              {m === "owner" ? "Owner" : "Team Member"}
            </button>
          ))}
        </div>

        <div className="rounded-3xl p-7 bg-white" style={{ border: "3px solid #131313", boxShadow: "7px 8px 0 #131313" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: "#6B655C" }}>Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8a8375" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="w-full bg-white border-2 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-shadow"
                  style={{ borderColor: "#131313", color: "#131313" }}
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: "#6B655C" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8a8375" }} />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white border-2 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none"
                  style={{ borderColor: "#131313", color: "#131313" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-[#E2231A] transition-colors"
                  style={{ color: "#8a8375" }}
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
                style={{ background: "#FDEEEC", border: "2px solid #E2231A", color: "#C53011" }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { translateX: -2, translateY: -2, boxShadow: "7px 7px 0 #131313" } : {}}
              whileTap={!loading ? { translateX: 2, translateY: 2, boxShadow: "1px 1px 0 #131313" } : {}}
              className="w-full font-mono font-semibold uppercase tracking-[0.14em] text-sm text-white py-3.5 rounded-full flex items-center justify-center gap-2 border-[3px] disabled:opacity-60"
              style={{ background: "#E2231A", borderColor: "#131313", boxShadow: "5px 5px 0 #131313" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </motion.button>
          </form>
        </div>

        <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] mt-6 flex items-center justify-center gap-2" style={{ color: "#8a8375" }}>
          <span className="tilt-sq !w-1.5 !h-1.5 opacity-60" />
          Authorized access only
          <span className="tilt-sq !w-1.5 !h-1.5 opacity-60" />
        </p>
      </motion.div>
    </div>
  );
}
