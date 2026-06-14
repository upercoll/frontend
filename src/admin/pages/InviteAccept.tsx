import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Key, User, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { adminApi } from "../api";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { AdminRole } from "../types";

type Step = "loading" | "info" | "verify" | "setup" | "done" | "error";

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { login } = useAdminAuth();

  const [step, setStep] = useState<Step>("loading");
  const [inviteData, setInviteData] = useState<{ email: string; role: AdminRole } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!token) { setStep("error"); return; }
    adminApi.auth.validateInvite(token)
      .then((res) => {
        setInviteData({ email: res.data.email, role: res.data.role });
        setStep("info");
      })
      .catch(() => setStep("error"));
  }, [token]);

  const sendCode = async () => {
    setLoading(true);
    setError("");
    try {
      await adminApi.auth.sendVerificationCode(token!);
      setCodeSent(true);
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPass) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.auth.verifyAndActivate(token!, { code, password, displayName, username });
      login(res.token, res.data.user, res.data.profile);
      setStep("done");
      setTimeout(() => navigate("/panel/dashboard"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join RBstars Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Accept your invitation to get started</p>
        </div>

        <div className="bg-[#0d1f3c] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <AnimatePresence mode="wait">
            {step === "loading" && (
              <motion.div key="loading" className="p-8 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-slate-400 text-sm">Validating invite...</p>
              </motion.div>
            )}

            {step === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Invalid or Expired Invite</p>
                <p className="text-slate-400 text-sm">This invite link is no longer valid. Contact the site owner for a new one.</p>
              </motion.div>
            )}

            {step === "info" && inviteData && (
              <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-5">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Invitation Details</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3">
                      <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400 text-xs">Email</p>
                        <p className="text-white text-sm font-medium">{inviteData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: inviteData.role?.color || "#6366f1" }} />
                      <div>
                        <p className="text-slate-400 text-xs">Role</p>
                        <p className="text-white text-sm font-medium">{inviteData.role?.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">A 6-digit verification code will be sent to <strong className="text-white">{inviteData.email}</strong> to verify your identity.</p>
                {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={sendCode}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Verification Code
                </motion.button>
              </motion.div>
            )}

            {step === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={verifyAndSetup} className="p-6 space-y-4">
                  <p className="text-slate-300 text-sm">Enter the 6-digit code sent to <strong className="text-white">{inviteData?.email}</strong> and set up your account.</p>

                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Verification Code</label>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="w-full bg-[#0a1628] border border-white/10 text-white text-center text-2xl tracking-[0.5em] placeholder-slate-700 rounded-xl py-3 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Set Up Your Account</p>
                    <div className="space-y-3">
                      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display Name" required
                        className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                      <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="username"
                        className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                      <div className="relative">
                        <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 chars)" required minLength={8}
                          className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 pr-11 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Confirm Password" required
                        className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                    </div>
                  </div>

                  {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

                  <motion.button type="submit" disabled={loading || code.length !== 6}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Verify & Activate Account
                  </motion.button>

                  <button type="button" onClick={sendCode} className="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors">
                    Resend code
                  </button>
                </form>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
                <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                <p className="text-white font-bold text-lg mb-1">Account Activated!</p>
                <p className="text-slate-400 text-sm">Redirecting to your panel...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
