import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mail, Lock, User, Gamepad2, Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle, ArrowLeft, Star, RefreshCw, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

async function lookupRobloxAvatar(username: string): Promise<string | null> {
  try {
    const usersRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    const usersData = await usersRes.json();
    const userId = usersData?.data?.[0]?.id;
    if (!userId) return null;

    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
    );
    const thumbData = await thumbRes.json();
    return thumbData?.data?.[0]?.imageUrl || null;
  } catch {
    return null;
  }
}

function AuthInput({
  label, placeholder, value, onChange, type = "text", icon, rightEl, error, autoFocus,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; icon?: React.ReactNode; rightEl?: React.ReactNode;
  error?: string; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: "#818CF8" }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1.5px solid ${error ? "rgba(248,113,113,0.5)" : focused ? "#4F46E5" : "rgba(165,180,252,0.18)"}`,
          boxShadow: focused ? `0 0 0 3px ${error ? "rgba(248,113,113,0.08)" : "rgba(79,70,229,0.1)"}` : "none",
        }}
      >
        {icon && <span style={{ color: focused ? "#A5B4FC" : "#4F46E5", flexShrink: 0 }}>{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#475569] min-w-0"
        />
        {rightEl}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[11px] flex items-center gap-1"
            style={{ color: "#f87171" }}
          >
            <AlertCircle size={10} />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  }
  function handleChange(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[i] = digit;
    const next = arr.join("").slice(0, 6).padEnd(6, " ").split("").map((c, idx) => idx < arr.join("").length ? arr[idx] : "").join("");
    const filled = value.slice(0, i) + digit + value.slice(i + 1);
    onChange(filled.slice(0, 6));
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }
  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    e.preventDefault();
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          whileFocus={{ scale: 1.08 }}
          className="w-11 h-14 rounded-xl text-center text-xl font-extrabold text-white outline-none transition-all duration-200"
          style={{
            background: value[i] ? "rgba(79,70,229,0.25)" : "rgba(255,255,255,0.05)",
            border: `2px solid ${value[i] ? "#4F46E5" : "rgba(165,180,252,0.18)"}`,
            boxShadow: value[i] ? "0 0 12px rgba(79,70,229,0.3)" : "none",
          }}
        />
      ))}
    </div>
  );
}

type Step = "login" | "register" | "verify";

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, login, register, user, onSuccessCallback, updateUser } = useAuth();
  const [step, setStep] = useState<Step>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [robloxUsername, setRobloxUsername] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [robloxAvatar, setRobloxAvatar] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authModalOpen) {
      setStep(authModalMode);
      setError("");
      setFieldErrors({});
      setVerifyCode("");
    }
  }, [authModalOpen, authModalMode]);

  useEffect(() => {
    if (!robloxUsername.trim() || robloxUsername.length < 3) {
      setRobloxAvatar(null);
      return;
    }
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    lookupTimeout.current = setTimeout(async () => {
      setAvatarLoading(true);
      const url = await lookupRobloxAvatar(robloxUsername.trim());
      setRobloxAvatar(url);
      setAvatarLoading(false);
    }, 800);
  }, [robloxUsername]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function clearErrors() { setError(""); setFieldErrors({}); }

  async function handleLogin() {
    clearErrors();
    if (!email.trim()) return setFieldErrors({ email: "Email is required" });
    if (!password) return setFieldErrors({ password: "Password is required" });
    setLoading(true);
    try {
      await login(email.trim(), password);
      const cb = onSuccessCallback.current;
      closeAuthModal();
      cb?.();
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    clearErrors();
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!displayName.trim()) errs.displayName = "Display name is required";
    if (!robloxUsername.trim()) errs.robloxUsername = "Roblox username is required";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Must be at least 8 characters";
    if (Object.keys(errs).length) return setFieldErrors(errs);

    setLoading(true);
    try {
      const result = await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        robloxUsername: robloxUsername.trim(),
      });
      if (robloxAvatar) {
        try {
          await fetch(`${BACKEND}/api/customer-auth/profile`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("rbstars_customer_token")}`,
            },
            body: JSON.stringify({ robloxAvatarUrl: robloxAvatar }),
          });
          updateUser({ robloxAvatarUrl: robloxAvatar });
        } catch {

        }
      }
      if (result.requiresVerification) {
        setStep("verify");
        setResendCooldown(60);
      } else {
        const cb = onSuccessCallback.current;
        closeAuthModal();
        cb?.();
      }
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    clearErrors();
    if (verifyCode.replace(/\s/g, "").length < 6) {
      return setError("Enter all 6 digits");
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/customer-auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("rbstars_customer_token")}`,
        },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser({ emailVerified: true });
      const cb = onSuccessCallback.current;
      closeAuthModal();
      cb?.();
    } catch (e: any) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      await fetch(`${BACKEND}/api/customer-auth/resend-verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("rbstars_customer_token")}` },
      });
      setResendCooldown(60);
      setError("");
    } catch {}
  }

  if (!authModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="auth-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: "rgba(7,5,30,0.88)", backdropFilter: "blur(12px)" }}
        onClick={e => { if (e.target === e.currentTarget) closeAuthModal(); }}
      >
        <motion.div
          key="auth-card"
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="w-full max-w-md relative overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(180deg,#0F0C2E 0%,#0C0B2E 100%)",
            border: "1.5px solid rgba(79,70,229,0.25)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(165,180,252,0.05)",
          }}
        >
          {}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(79,70,229,0.18),transparent 70%)" }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(55,48,163,0.12),transparent 70%)" }} />

          <div className="relative z-10 p-6">
            {}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                {step === "verify" && (
                  <button onClick={() => { setStep("register"); setVerifyCode(""); clearErrors(); }}
                    className="mr-1 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#818CF8" }}>
                    <ArrowLeft size={15} />
                  </button>
                )}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
                  <Star size={17} fill="white" color="white" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white leading-tight">
                    {step === "login" ? "Welcome back" : step === "register" ? "Create account" : "Verify email"}
                  </h2>
                  <p className="text-[11px]" style={{ color: "#64748B" }}>
                    {step === "login" ? "Sign in to your RBstars account"
                      : step === "register" ? "Join RBstars in seconds"
                      : `Code sent to ${email}`}
                  </p>
                </div>
              </div>
              <button onClick={closeAuthModal}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: "#64748B" }}>
                <X size={16} />
              </button>
            </div>

            {}
            <AnimatePresence mode="wait">
              {step === "login" && (
                <motion.div key="login"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <AuthInput label="Email" placeholder="you@email.com" value={email}
                    onChange={setEmail} icon={<Mail size={15} />}
                    error={fieldErrors.email} autoFocus />
                  <AuthInput label="Password" placeholder="Your password"
                    value={password} onChange={setPassword}
                    type={showPass ? "text" : "password"}
                    icon={<Lock size={15} />}
                    error={fieldErrors.password}
                    rightEl={
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        style={{ color: "#64748B" }} className="flex-shrink-0">
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                  />

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                        style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#fca5a5" }}>
                        <AlertCircle size={14} />{error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 28px rgba(79,70,229,0.45)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)", opacity: loading ? 0.7 : 1 }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
                  </motion.button>

                  <p className="text-center text-[12px]" style={{ color: "#64748B" }}>
                    Don't have an account?{" "}
                    <button onClick={() => { setStep("register"); clearErrors(); }}
                      className="font-bold transition-colors hover:text-white"
                      style={{ color: "#A5B4FC" }}>
                      Create one
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── REGISTER ── */}
              {step === "register" && (
                <motion.div key="register"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-3.5"
                >
                  <AuthInput label="Email" placeholder="you@email.com" value={email}
                    onChange={setEmail} icon={<Mail size={15} />}
                    error={fieldErrors.email} autoFocus />

                  <AuthInput label="Display Name" placeholder="How others see you"
                    value={displayName} onChange={setDisplayName}
                    icon={<User size={15} />} error={fieldErrors.displayName} />

                  {/* Roblox username with live avatar preview */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: "#818CF8" }}>
                      Roblox Username
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: `1.5px solid ${fieldErrors.robloxUsername ? "rgba(248,113,113,0.5)" : robloxAvatar ? "rgba(79,70,229,0.6)" : "rgba(165,180,252,0.18)"}`,
                        }}>
                        <Gamepad2 size={15} color="#4F46E5" className="flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="YourRobloxName"
                          value={robloxUsername}
                          onChange={e => setRobloxUsername(e.target.value)}
                          className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#475569] min-w-0"
                        />
                        {avatarLoading && <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: "#4F46E5" }} />}
                        {robloxAvatar && !avatarLoading && <CheckCircle size={13} color="#4ade80" className="flex-shrink-0" />}
                      </div>
                      {/* Avatar preview */}
                      <AnimatePresence>
                        {(robloxAvatar || avatarLoading) && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                            className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                            style={{ background: "rgba(79,70,229,0.15)", border: "2px solid rgba(79,70,229,0.4)" }}>
                            {avatarLoading
                              ? <Loader2 size={16} className="animate-spin" style={{ color: "#4F46E5" }} />
                              : robloxAvatar && <img src={robloxAvatar} alt="Roblox avatar" className="w-full h-full object-cover" />
                            }
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {fieldErrors.robloxUsername && (
                      <p className="text-[11px] flex items-center gap-1" style={{ color: "#f87171" }}>
                        <AlertCircle size={10} />{fieldErrors.robloxUsername}
                      </p>
                    )}
                    {robloxAvatar && !avatarLoading && (
                      <p className="text-[11px] flex items-center gap-1" style={{ color: "#4ade80" }}>
                        <CheckCircle size={10} />Avatar found — will be used as your profile picture
                      </p>
                    )}
                  </div>

                  <AuthInput label="Password" placeholder="Min. 8 characters"
                    value={password} onChange={setPassword}
                    type={showPass ? "text" : "password"}
                    icon={<Lock size={15} />}
                    error={fieldErrors.password}
                    rightEl={
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        style={{ color: "#64748B" }} className="flex-shrink-0">
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                  />

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                        style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#fca5a5" }}>
                        <AlertCircle size={14} />{error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 28px rgba(79,70,229,0.45)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)", opacity: loading ? 0.7 : 1 }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}
                  </motion.button>

                  <p className="text-center text-[12px]" style={{ color: "#64748B" }}>
                    Already have an account?{" "}
                    <button onClick={() => { setStep("login"); clearErrors(); }}
                      className="font-bold transition-colors hover:text-white"
                      style={{ color: "#A5B4FC" }}>
                      Sign in
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── VERIFY EMAIL ── */}
              {step === "verify" && (
                <motion.div key="verify"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  <div className="text-center py-2">
                    <motion.div
                      animate={{ scale: [1, 1.06, 1], boxShadow: ["0 0 0px rgba(79,70,229,0)", "0 0 24px rgba(79,70,229,0.5)", "0 0 0px rgba(79,70,229,0)"] }}
                      transition={{ repeat: Infinity, duration: 2.4 }}
                      className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.25),rgba(55,48,163,0.15))", border: "1.5px solid rgba(79,70,229,0.4)" }}>
                      <ShieldCheck size={28} color="#A5B4FC" />
                    </motion.div>
                    <p className="text-sm" style={{ color: "#818CF8" }}>
                      We sent a 6-digit code to
                    </p>
                    <p className="text-sm font-bold text-white">{email}</p>
                  </div>

                  <CodeInput value={verifyCode} onChange={v => { setVerifyCode(v); if (error) setError(""); }} />

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                        style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#fca5a5" }}>
                        <AlertCircle size={14} />{error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 28px rgba(79,70,229,0.45)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleVerify}
                    disabled={loading || verifyCode.replace(/\s/g, "").length < 6}
                    className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg,#4F46E5,#3730A3)",
                      opacity: (loading || verifyCode.replace(/\s/g, "").length < 6) ? 0.5 : 1,
                    }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify Email"}
                  </motion.button>

                  <div className="text-center">
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="text-[12px] flex items-center gap-1.5 mx-auto transition-colors"
                      style={{ color: resendCooldown > 0 ? "#475569" : "#A5B4FC" }}>
                      <RefreshCw size={11} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                    <p className="text-[11px] mt-2" style={{ color: "#475569" }}>
                      You can skip this and verify later
                    </p>
                    <button
                      onClick={() => { const cb = onSuccessCallback.current; closeAuthModal(); cb?.(); }}
                      className="text-[12px] font-bold mt-1 transition-colors hover:text-white"
                      style={{ color: "#64748B" }}>
                      Skip for now →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
