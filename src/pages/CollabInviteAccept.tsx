import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, Check, Mail } from "lucide-react";
import StaffInviteLayout from "@/components/StaffInviteLayout";

const BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}/api/collab${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function apiGet(path: string) {
  const res = await fetch(`${BASE}/api/collab${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export default function CollabInviteAccept() {
  const [, params] = useRoute("/collab/invite/:token");
  const token = params?.token || "";
  const [, navigate] = useLocation();

  const [step, setStep] = useState<"loading" | "verify" | "done" | "error">("loading");
  const [inviteInfo, setInviteInfo] = useState<{ email: string; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setStep("error"); setErrorMsg("Invalid invite link."); return; }
    apiGet(`/invite/${token}`)
      .then(res => { setInviteInfo({ email: res.data.email, name: res.data.name }); setStep("verify"); })
      .catch(err => { setStep("error"); setErrorMsg(err.message); });
  }, [token]);

  const sendCode = async () => {
    setLoading(true);
    try { await apiPost(`/invite/${token}/send-code`, {}); setCodeSent(true); }
    catch (err: any) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setErrorMsg("Passwords don't match"); return; }
    if (password.length < 8) { setErrorMsg("Password must be at least 8 characters"); return; }
    if (!code) { setErrorMsg("Enter the verification code"); return; }
    setLoading(true); setErrorMsg("");
    try {
      const res = await apiPost(`/invite/${token}/verify`, { code, password });
      localStorage.setItem("collab_token", res.token);
      setStep("done");
      setTimeout(() => navigate("/collab/dashboard"), 1500);
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  const stepLabel =
    step === "loading" ? "Validating your invitation..." :
    step === "error" ? "Something went wrong" :
    step === "verify" ? `Welcome, ${inviteInfo?.name}!` :
    "Account activated!";

  return (
    <StaffInviteLayout portalName="Collaborator Invitation" description="You've been invited to collaborate with the RBstars team." step={stepLabel}>
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
          <p className="text-sm" style={{ color: "#9BAEBB" }}>{errorMsg}</p>
        </div>
      )}

      {step === "done" && (
        <motion.div key="done" className="text-center py-4">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22C55E" }}>
            <Check className="w-6 h-6" style={{ color: "#22C55E" }} />
          </div>
          <p className="font-bold text-lg mb-1" style={{ color: "#F4F8FB" }}>Account Activated!</p>
          <p className="text-sm" style={{ color: "#9BAEBB" }}>Redirecting to your dashboard...</p>
        </motion.div>
      )}

      {step === "verify" && (
        <form onSubmit={handleActivate} className="space-y-4">
          <div className="rounded-xl p-3" style={{ background: "#0C141B", border: "1px solid #2C414E" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#3BA7FF" }}>Email</p>
            <p className="text-sm font-medium" style={{ color: "#F4F8FB" }}>{inviteInfo?.email}</p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "#F4F8FB" }}>Verification Code</label>
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code"
                className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none font-medium"
                style={{ background: "#0C141B", border: "1.5px solid #2C414E", color: "#F4F8FB" }} />
              <button type="button" onClick={sendCode} disabled={loading || codeSent}
                className="px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all whitespace-nowrap"
                style={{ background: codeSent ? "rgba(34,197,94,0.15)" : "rgba(59,167,255,0.15)", border: `1px solid ${codeSent ? "#22C55E" : "#3BA7FF"}`, color: codeSent ? "#22C55E" : "#3BA7FF" }}>
                {codeSent ? "Sent ✓" : loading ? "..." : "Send Code"}
              </button>
            </div>
            {codeSent && <p className="text-xs mt-1" style={{ color: "#22C55E" }}>Code sent to {inviteInfo?.email}</p>}
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

          {errorMsg && <p className="text-sm text-center" style={{ color: "#ef4444" }}>{errorMsg}</p>}

          <motion.button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#3BA7FF", boxShadow: "0 4px 0 #1a6bbf, 0 6px 16px rgba(59,167,255,0.3)" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Activate Account
          </motion.button>
        </form>
      )}
    </StaffInviteLayout>
  );
}
