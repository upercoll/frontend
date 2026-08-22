import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "";

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}/api/collab${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

  const [step, setStep] = useState<"loading" | "verify" | "setup" | "done" | "error">("loading");
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
      .then(res => {
        setInviteInfo({ email: res.data.email, name: res.data.name });
        setStep("verify");
      })
      .catch(err => { setStep("error"); setErrorMsg(err.message); });
  }, [token]);

  const sendCode = async () => {
    setLoading(true);
    try {
      await apiPost(`/invite/${token}/send-code`, {});
      setCodeSent(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
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
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #060a1a 0%, #0c1445 45%, #060a1a 100%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 24px rgba(124,58,237,0.4)" }}>
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white">RBstars</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Collaborator Invitation</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
          {step === "loading" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#a78bfa" }} />
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-4">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "#f87171" }} />
              <p className="text-white font-semibold mb-2">Invalid Invite</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{errorMsg}</p>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "#4ade80" }} />
              <p className="text-white font-semibold mb-2">Account Activated!</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Redirecting to your dashboard...</p>
            </div>
          )}

          {step === "verify" && (
            <form onSubmit={handleActivate} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white">Welcome, {inviteInfo?.name}!</h2>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  You've been invited as a collaborator. Set up your account to get started.
                </p>
              </div>

              <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Email</p>
                <p className="text-white text-sm font-medium">{inviteInfo?.email}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Verification Code</label>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="6-digit code"
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", focusRingColor: "rgba(167,139,250,0.5)" }}
                  />
                  <button type="button" onClick={sendCode} disabled={loading || codeSent}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
                    style={{ background: codeSent ? "rgba(74,222,128,0.15)" : "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.4)", color: codeSent ? "#4ade80" : "#c4b5fd" }}>
                    {codeSent ? "Sent ✓" : loading ? "..." : "Send"}
                  </button>
                </div>
                {codeSent && <p className="text-xs mt-1" style={{ color: "#4ade80" }}>Code sent to {inviteInfo?.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Confirm Password</label>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Activate Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
