import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, Check, Mail } from "lucide-react";
import StaffInviteLayout from "@/components/StaffInviteLayout";

const BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

async function stockerReq(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}/api/stocker${path}`, {
    method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

type Step = "loading" | "send_code" | "verify" | "setup" | "error" | "done";

export default function StockerInviteAccept() {
  const [, params] = useRoute("/stocker/invite/:token");
  const [, navigate] = useLocation();
  const token = params?.token || "";

  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!token) return;
    stockerReq("GET", `/auth/invite/${token}`)
      .then(res => { setEmail(res.data.email); setStep("send_code"); })
      .catch(e => { setError(e.message || "Invalid or expired invite link"); setStep("error"); });
  }, [token]);

  const handleSendCode = async () => {
    setIsLoading(true); setError("");
    try { await stockerReq("POST", `/auth/invite/${token}/send-code`); setCodeSent(true); setStep("verify"); }
    catch (e: any) { setError(e.message || "Failed to send code"); }
    finally { setIsLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) { setError("Enter the verification code"); return; }
    setStep("setup"); setError("");
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setIsLoading(true); setError("");
    try {
      const res = await stockerReq("POST", `/auth/invite/${token}/verify`, {
        code, password, displayName: displayName || email.split("@")[0],
      });
      localStorage.setItem("stocker_token", res.token);
      setStep("done");
      setTimeout(() => navigate("/stocker/dashboard"), 1500);
    } catch (e: any) { setError(e.message || "Setup failed"); setIsLoading(false); }
  };

  const stepLabel =
    step === "loading" ? "Validating your invitation..." :
    step === "error" ? "Something went wrong" :
    step === "send_code" ? "Accept your stocker invitation" :
    step === "verify" ? "Enter the code sent to your email" :
    step === "setup" ? "Set up your account" :
    "Account activated!";

  return (
    <StaffInviteLayout portalName="Stocker Invitation" description="You've been invited to manage inventory with RBstars." step={stepLabel}>
      {step === "loading" && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#3BA7FF" }} />
        </div>
      )}

      {step === "error" && (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)", border: "2px solid #ef4444" }}>
            <span className="text-xl">✕</span>
          </div>
          <p className="font-semibold mb-1" style={{ color: "#F4F8FB" }}>Invalid Invite</p>
          <p className="text-sm" style={{ color: "#9BAEBB" }}>{error}</p>
          <p className="text-xs mt-2" style={{ color: "#637784" }}>Contact your admin for a new invite link.</p>
        </div>
      )}

      {step === "send_code" && (
        <div className="space-y-4">
          <div className="rounded-xl p-3" style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#3BA7FF" }}>Email</p>
            <p className="text-sm font-medium" style={{ color: "#F4F8FB" }}>{email}</p>
          </div>
          <p className="text-sm" style={{ color: "#9BAEBB" }}>A 6-digit verification code will be sent to verify your identity.</p>
          {error && <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSendCode} disabled={isLoading || codeSent}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {codeSent ? "Code Sent" : "Send Verification Code"}
          </motion.button>
        </div>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm" style={{ color: "#9BAEBB" }}>Enter the code sent to <strong style={{ color: "#F4F8FB" }}>{email}</strong></p>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Verification Code</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000" maxLength={6}
              className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none"
              style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
          </div>
          {error && <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>}
          <motion.button type="submit"
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
            Verify Code
          </motion.button>
        </form>
      )}

      {step === "setup" && (
        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={email.split("@")[0]}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
              style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters"
                className="w-full rounded-xl px-4 pr-11 py-3 text-sm focus:outline-none font-medium"
                style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#637784" }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Confirm Password</label>
            <input type={showPw ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
              style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
          </div>
          {error && <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>}
          <motion.button type="submit" disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Complete Setup
          </motion.button>
        </form>
      )}

      {step === "done" && (
        <motion.div className="text-center py-4">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22C55E" }}>
            <Check className="w-6 h-6" style={{ color: "#22C55E" }} />
          </div>
          <p className="font-bold text-lg mb-1" style={{ color: "#F4F8FB" }}>Account Activated!</p>
          <p className="text-sm" style={{ color: "#9BAEBB" }}>Redirecting to your dashboard...</p>
        </motion.div>
      )}
    </StaffInviteLayout>
  );
}
