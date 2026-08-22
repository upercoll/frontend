import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Archive, Mail, Lock, User, Loader2, ChevronRight, Check } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "";

async function stockerReq(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}/api/stocker${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

type Step = "loading" | "send_code" | "verify" | "setup" | "error";

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
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!token) return;
    stockerReq("GET", `/auth/invite/${token}`)
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
      await stockerReq("POST", `/auth/invite/${token}/send-code`);
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
      const res = await stockerReq("POST", `/auth/invite/${token}/verify`, {
        code,
        password,
        displayName: displayName || email.split("@")[0],
      });
      localStorage.setItem("stocker_token", res.token);
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
                disabled={isLoading || codeSent}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : codeSent ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                {codeSent ? "Code Sent" : "Send Verification Code"}
              </motion.button>
            </div>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                Enter the 6-digit code sent to <span className="text-white font-medium">{email}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Verification Code</label>
                <input
                  type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  className="w-full rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "1.2rem" }}
                />
              </div>
              {error && (
                <div className="text-sm rounded-xl px-4 py-3 text-center"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                  {error}
                </div>
              )}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                Verify Code <ChevronRight className="w-4 h-4" />
              </motion.button>
            </form>
          )}

          {step === "setup" && (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="text-center text-sm font-semibold text-white mb-2">Set up your account</div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder={email.split("@")[0]}
                    className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
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
                type="submit" disabled={isLoading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Complete Setup
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
