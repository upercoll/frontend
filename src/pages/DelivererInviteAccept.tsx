import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Truck } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "";

async function apiGet(path: string) {
  const res = await fetch(`${BASE}/api/deliverer${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}/api/deliverer${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    try {
      await apiPost(`/auth/invite/${token}/send-code`, {});
      setStep("code");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const verifyAndSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !password || password.length < 8) {
      setError("Enter the verification code and a password (min 8 chars)"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await apiPost(`/auth/invite/${token}/verify`, { code, password, displayName });
      localStorage.setItem("deliverer_token", res.token);
      setStep("done");
      setTimeout(() => navigate("/deliverer/dashboard"), 1500);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg,#060a1a 0%,#0c1445 45%,#060a1a 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)", boxShadow: "0 0 24px rgba(14,165,233,0.4)" }}>
            <Truck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">RBstars</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Delivery Team Invite</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {step === "loading" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-4">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === "verify" && (
            <div className="text-center">
              <p className="text-white text-sm mb-2">You've been invited as a Delivery Team member</p>
              <p className="text-sky-400 text-sm font-semibold mb-6">{email}</p>
              {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
              <button onClick={sendCode} disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Verification Code
              </button>
            </div>
          )}

          {(step === "code" || step === "setup") && (
            <form onSubmit={verifyAndSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-white/50">Verification Code</label>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" required
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none tracking-widest"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-white/50">Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-white/50">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Activate Account
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Account activated!</p>
              <p className="text-white/40 text-sm mt-1">Redirecting to dashboard…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
