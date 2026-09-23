import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { Loader2, Check, Eye, EyeOff, Mail } from "lucide-react";
import StaffInviteLayout from "@/components/StaffInviteLayout";

const BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

async function apiGet(path: string) {
  const res = await fetch(`${BASE}/api/deliverer${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}/api/deliverer${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

type Step = "loading" | "verify" | "code" | "setup" | "done" | "error";

export default function DelivererInviteAccept() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet(`/auth/invite/${token}`)
      .then(res => { setEmail(res.data.email); setStep("verify"); })
      .catch(err => { setError(err.message); setStep("error"); });
  }, [token]);

  const sendCode = async () => {
    setLoading(true); setError("");
    try { await apiPost(`/auth/invite/${token}/send-code`, {}); setStep("code"); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const verifyAndSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !password || password.length < 8) { setError("Enter the verification code and a password (min 8 chars)"); return; }
    setLoading(true); setError("");
    try {
      const res = await apiPost(`/auth/invite/${token}/verify`, { code, password, displayName });
      localStorage.setItem("deliverer_token", res.token);
      setStep("done");
      setTimeout(() => navigate("/deliverer/dashboard"), 1500);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const stepLabel =
    step === "loading" ? "Validating your invitation..." :
    step === "error" ? "Something went wrong" :
    step === "verify" ? "Accept your delivery team invitation" :
    step === "code" || step === "setup" ? "Set up your account" :
    "Account activated!";

  return (
    <StaffInviteLayout portalName="Delivery Team Invitation" description="You've been invited to join the RBstars delivery team." step={stepLabel}>
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
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <div className="rounded-xl p-3" style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#3BA7FF" }}>Email</p>
            <p className="text-sm font-medium" style={{ color: "#F4F8FB" }}>{email}</p>
          </div>
          <p className="text-sm" style={{ color: "#9BAEBB" }}>A verification code will be sent to your email.</p>
          {error && <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>}
          <motion.button onClick={sendCode} disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Verification Code
          </motion.button>
        </div>
      )}

      {(step === "code" || step === "setup") && (
        <form onSubmit={verifyAndSetup} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Verification Code</label>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" required
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none font-medium tracking-widest"
              style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
              style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full rounded-xl px-4 pr-11 py-3 text-sm focus:outline-none font-medium"
                style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#637784" }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>}
          <motion.button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Activate Account
          </motion.button>
        </form>
      )}

      {step === "done" && (
        <motion.div key="done" className="text-center py-4">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22C55E" }}>
            <Check className="w-6 h-6" style={{ color: "#22C55E" }} />
          </div>
          <p className="font-bold text-lg mb-1" style={{ color: "#F4F8FB" }}>Account Activated!</p>
          <p className="text-sm" style={{ color: "#9BAEBB" }}>Redirecting to dashboard...</p>
        </motion.div>
      )}
    </StaffInviteLayout>
  );
}
