import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import { useAdminAuth } from "../../context/AdminAuthContext";
import type { AdminUser, AdminProfile } from "../../types";
import { Archive, Mail, Lock, User, Loader2, ChevronRight, Check } from "lucide-react";

type Step = "loading" | "send_code" | "verify" | "setup" | "error";

export default function StockerInviteAccept() {
  const [, params] = useRoute("/stocker/invite/:token");
  const [, navigate] = useLocation();
  const token = params?.token || "";
  const { login } = useAdminAuth();

  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!token) return;
    adminApi.stockerPanel.validateInvite(token)
      .then(res => {
        setEmail(res.data.email);
        setStep("send_code");
      })
      .catch(e => {
        setError(e.message || "Invalid or expired invite link");
        setStep("error");
      });
  }, [token]);

  const handleSendCode = async () => {
    setIsLoading(true);
    setError("");
    try {
      await adminApi.stockerPanel.sendCode(token);
      setCodeSent(true);
      setStep("verify");
    } catch (e: any) {
      setError(e.message || "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) { setError("Enter the verification code"); return; }
    setStep("setup");
    setError("");
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await adminApi.stockerPanel.verifyAndActivate(token, {
        code,
        password,
        displayName: displayName || email.split("@")[0],
      });
      login(res.token, res.data.user as AdminUser, res.data.profile as AdminProfile);
      navigate("/stocker/dashboard");
    } catch (e: any) {
      setError(e.message || "Setup failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #060a1a 0%, #0c1445 45%, #060a1a 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 32px rgba(99,102,241,0.4)" }}>
            <Archive className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Stocker Invitation</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(165,180,252,0.7)" }}>
            You've been invited to join as a stocker
          </p>
        </div>

        <div className="rounded-2xl p-6 space-y-5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>

          {step === "loading" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🔗</div>
              <p className="text-white font-semibold mb-1">Invalid Invite</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{error}</p>
              <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                Contact your admin for a new invite link.
              </p>
            </div>
          )}

          {step === "send_code" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <Mail className="w-3 h-3" />
                  {email}
                </div>
              </div>
              <div className="text-center text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                We'll send a 6-digit verification code to your email to verify your identity.
              </div>
              {error && (
                <div className="text-sm rounded-xl px-4 py-3 text-center"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                  {error}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send Verification Code
              </motion.button>
            </div>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                A 6-digit code was sent to <span style={{ color: "#a5b4fc" }}>{email}</span>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Verification Code</label>
                <input
                  type="text" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  autoFocus
                />
              </div>
              {error && (
                <div className="text-sm rounded-xl px-4 py-3 text-center"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                  {error}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={code.length !== 6}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                <ChevronRight className="w-4 h-4" />
                Verify Code
              </motion.button>
              <button type="button" onClick={handleSendCode} disabled={isLoading}
                className="w-full text-center text-xs disabled:opacity-50"
                style={{ color: "rgba(165,180,252,0.6)" }}>
                Didn't receive it? Resend
              </button>
            </form>
          )}

          {step === "setup" && (
            <form onSubmit={handleSetup} className="space-y-4">
              <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.6)" }}>Set up your stocker account</p>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder={email.split("@")[0]}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    placeholder="Repeat password"
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  />
                </div>
              </div>
              {error && (
                <div className="text-sm rounded-xl px-4 py-3"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                  {error}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Activate Account
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
