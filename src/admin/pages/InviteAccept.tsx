import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Check } from "lucide-react";
import { adminApi } from "../api";
import { useAdminAuth } from "../context/AdminAuthContext";
import StaffInviteLayout from "@/components/StaffInviteLayout";
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
    setLoading(true); setError("");
    try {
      await adminApi.auth.sendVerificationCode(token!);
      setCodeSent(true);
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally { setLoading(false); }
  };

  const verifyAndSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPass) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await adminApi.auth.verifyAndActivate(token!, { code, password, displayName, username });
      login(res.token, {
        ...res.data.user,
        isOwner: false,
        permissions: res.data.permissions || [],
        claimGames: (res.data.user as any).claimGames || [],
      }, res.data.profile);
      setStep("done");
      setTimeout(() => navigate("/panel/dashboard"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally { setLoading(false); }
  };

  const stepLabel =
    step === "loading" ? "Validating your invitation..." :
    step === "error" ? "Something went wrong" :
    step === "info" ? "Accept your invitation to get started" :
    step === "verify" ? "Enter the code sent to your email" :
    step === "setup" ? "Set up your account credentials" :
    "Account activated!";

  return (
    <StaffInviteLayout portalName="Team Invitation" description="Accept your invitation to join the RBstars admin team." step={stepLabel}>
      {step === "loading" && (
        <motion.div key="loading" className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#3BA7FF" }} />
          <p className="text-sm" style={{ color: "#9BAEBB" }}>Validating invite...</p>
        </motion.div>
      )}

      {step === "error" && (
        <motion.div key="error" className="text-center py-4">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)", border: "2px solid #ef4444" }}>
            <span className="text-xl">✕</span>
          </div>
          <p className="font-semibold mb-1" style={{ color: "#F4F8FB" }}>Invalid or Expired Invite</p>
          <p className="text-sm" style={{ color: "#9BAEBB" }}>Contact the site owner for a new one.</p>
        </motion.div>
      )}

      {step === "info" && inviteData && (
        <motion.div key="info" className="space-y-4">
          <div className="rounded-xl p-3" style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#3BA7FF" }}>Email</p>
            <p className="text-sm font-medium" style={{ color: "#F4F8FB" }}>{inviteData.email}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#3BA7FF" }}>Role</p>
            <p className="text-sm font-medium" style={{ color: "#F4F8FB" }}>{inviteData.role?.name}</p>
          </div>
          <p className="text-sm" style={{ color: "#9BAEBB" }}>A 6-digit code will be sent to verify your identity.</p>
          {error && <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={sendCode} disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Verification Code
          </motion.button>
        </motion.div>
      )}

      {step === "verify" && (
        <motion.div key="verify">
          <form onSubmit={(e) => { e.preventDefault(); setStep("setup"); }} className="space-y-4">
            <p className="text-sm" style={{ color: "#9BAEBB" }}>Enter the 6-digit code sent to <strong style={{ color: "#F4F8FB" }}>{inviteData?.email}</strong></p>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Verification Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" maxLength={6} required
                className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none"
                style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
            </div>
            {error && <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>}
            <motion.button type="submit" disabled={code.length !== 6}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
              Continue
            </motion.button>
            <button type="button" onClick={sendCode} className="w-full text-sm text-center" style={{ color: "#637784" }}>
              Resend code
            </button>
          </form>
        </motion.div>
      )}

      {step === "setup" && (
        <motion.div key="setup">
          <form onSubmit={verifyAndSetup} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
                style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="username"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
                style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8}
                  className="w-full rounded-xl px-4 pr-11 py-3 text-sm focus:outline-none font-medium"
                  style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#637784" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Confirm Password</label>
              <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Repeat password" required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
                style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
            </div>
            {error && <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>}
            <motion.button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Verify & Activate Account
            </motion.button>
          </form>
        </motion.div>
      )}

      {step === "done" && (
        <motion.div key="done" className="text-center py-4">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22C55E" }}>
            <Check className="w-6 h-6" style={{ color: "#22C55E" }} />
          </div>
          <p className="font-bold text-lg mb-1" style={{ color: "#F4F8FB" }}>Account Activated!</p>
          <p className="text-sm" style={{ color: "#9BAEBB" }}>Redirecting to your panel...</p>
        </motion.div>
      )}
    </StaffInviteLayout>
  );
}
