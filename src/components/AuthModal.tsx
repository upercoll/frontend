import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mail, Lock, User, Gamepad2, Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle, ArrowLeft, Star, RefreshCw, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

async function lookupRobloxAvatar(username: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND}/api/customer-auth/roblox-avatar?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    return data.avatarUrl || null;
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
      <label className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: "#637784" }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200"
        style={{
          background: "#1C2A34",
          border: `1.5px solid ${error ? "rgba(248,113,113,0.5)" : focused ? "#3BA7FF" : "#2C414E"}`,
        }}
      >
        {icon && <span style={{ color: focused ? "#3BA7FF" : "#637784", flexShrink: 0 }}>{icon}</span>}
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
            background: "#1C2A34",
            border: `2px solid ${value[i] ? "#3BA7FF" : "#2C414E"}`,
            boxShadow: value[i] ? "0 0 12px rgba(59,167,255,0.2)" : "none",
          }}
        />
      ))}
    </div>
  );
}

type Step = "login" | "register" | "verify" | "edit";

function HeroPanel({ step }: { step: Step }) {
  return (
    <div className="relative flex flex-col items-center justify-center text-center p-8 overflow-hidden" style={{ background: "#0D1520" }}>
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.4 }} />
        <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
        <div className="absolute top-[45%] left-[10%] w-1 h-1 rounded-full" style={{ background: "#5CB8FF", opacity: 0.25 }} />
        <div className="absolute top-[60%] right-[12%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.35 }} />
        <div className="absolute top-[80%] left-[25%] w-1.5 h-1.5 rounded-full" style={{ background: "#5CB8FF", opacity: 0.2 }} />
        <div className="absolute top-[15%] left-[50%] w-1 h-1 rounded-full" style={{ background: "#3BA7FF", opacity: 0.3 }} />
        <div className="absolute top-[70%] right-[35%] w-1 h-1 rounded-full" style={{ background: "#5CB8FF", opacity: 0.25 }} />
        <div className="absolute top-[35%] left-[35%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.4 }} />
        <div className="absolute top-[55%] right-[45%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.3 }} />
        <div className="absolute top-[90%] left-[60%] w-0.5 h-0.5 rounded-full" style={{ background: "white", opacity: 0.35 }} />
      </div>

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,167,255,0.15), transparent 70%)" }} />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative z-10 mb-6"
      >
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 8px 24px rgba(59,167,255,0.3)" }}>
          <Star size={36} fill="white" color="white" />
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: "#F4F8FB" }}>
          RB<span style={{ color: "#3BA7FF" }}>stars</span>
        </h1>
        <p className="text-sm leading-relaxed max-w-[220px] mx-auto" style={{ color: "#637784" }}>
          {step === "login"
            ? "Welcome back! Sign in to access your account and orders."
            : step === "register"
            ? "Join thousands of Roblox traders. Fast, safe, reliable."
            : step === "verify"
            ? "One step away from your new account."
            : "Keep your profile up to date."}
        </p>
      </motion.div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3BA7FF" }} />
    </div>
  );
}

export default function AuthModal() {
  const { authModalOpen, authModalMode, openAuthModal, closeAuthModal, login, register, user, onSuccessCallback, updateUser } = useAuth();
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
  const skipNextLookup = useRef(false);

  const displayStep: Step = step === "verify" ? "verify" : (authModalMode as Step);

  useEffect(() => {
    if (authModalOpen) {
      setStep(authModalMode as Step);
      setError("");
      setFieldErrors({});
      setVerifyCode("");
      if (authModalMode === "edit" && user) {
        skipNextLookup.current = true;
        setDisplayName(user.displayName || "");
        setRobloxUsername(user.robloxUsername || "");
        setRobloxAvatar(user.robloxAvatarUrl || null);
      }
    }
  }, [authModalOpen, authModalMode, user]);

  useEffect(() => {
    if (skipNextLookup.current) { skipNextLookup.current = false; return; }
    if (!robloxUsername.trim() || robloxUsername.length < 3) { setRobloxAvatar(null); return; }
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
        email: email.trim(), password,
        displayName: displayName.trim(), robloxUsername: robloxUsername.trim(),
      });
      if (robloxAvatar) {
        try {
          await fetch(`${BACKEND}/api/customer-auth/profile`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("rbstars_customer_token")}` },
            body: JSON.stringify({ robloxAvatarUrl: robloxAvatar }),
          });
          updateUser({ robloxAvatarUrl: robloxAvatar });
        } catch {}
      }
      if (result.requiresVerification) { setStep("verify"); setResendCooldown(60); }
      else { const cb = onSuccessCallback.current; closeAuthModal(); cb?.();
        setTimeout(() => { window.dispatchEvent(new CustomEvent("rbstars:welcome-gift")); }, 400);
      }
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    clearErrors();
    if (verifyCode.replace(/\s/g, "").length < 6) return setError("Enter all 6 digits");
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/customer-auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("rbstars_customer_token")}` },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser({ emailVerified: true });
      const cb = onSuccessCallback.current; closeAuthModal(); cb?.();
      setTimeout(() => { window.dispatchEvent(new CustomEvent("rbstars:welcome-gift")); }, 400);
    } catch (e: any) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleEditProfile() {
    clearErrors();
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = "Display name is required";
    if (!robloxUsername.trim()) errs.robloxUsername = "Roblox username is required";
    if (Object.keys(errs).length) return setFieldErrors(errs);
    setLoading(true);
    try {
      updateUser({ displayName: displayName.trim(), robloxUsername: robloxUsername.trim(), ...(robloxAvatar ? { robloxAvatarUrl: robloxAvatar } : {}) });
      closeAuthModal();
    } catch (e: any) {
      setError(e.message || "Update failed");
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
      setResendCooldown(60); setError("");
    } catch {}
  }

  if (!authModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="auth-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={e => { if (e.target === e.currentTarget) closeAuthModal(); }}
      >
        <motion.div
          key="auth-card"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-[740px] relative overflow-hidden rounded-3xl flex flex-col sm:flex-row"
          style={{
            background: "#131C23",
            border: "1px solid #2C414E",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            minHeight: "480px",
          }}
        >
          {/* Hero — left side */}
          <div className="hidden sm:flex w-[340px] flex-shrink-0">
            <HeroPanel step={displayStep} />
          </div>

          {/* Form — right side */}
          <div className="flex-1 relative flex flex-col">
            {/* Close button */}
            <button onClick={closeAuthModal}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "#1C2A34", border: "1px solid #2C414E", color: "#9BAEBB" }}>
              <X size={14} />
            </button>

            <div className="flex-1 p-7 sm:p-8 flex flex-col justify-center">
              {/* Mobile logo */}
              <div className="sm:hidden flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#3BA7FF" }}>
                  <Star size={17} fill="white" color="white" />
                </div>
                <span className="text-lg font-black" style={{ color: "#F4F8FB" }}>RB<span style={{ color: "#3BA7FF" }}>stars</span></span>
              </div>

              <AnimatePresence mode="wait">
                {displayStep === "login" && (
                  <motion.div key="login"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="mb-1">
                      <h2 className="text-xl font-extrabold" style={{ color: "#F4F8FB" }}>Welcome back</h2>
                      <p className="text-xs mt-0.5" style={{ color: "#637784" }}>Sign in to your RBstars account</p>
                    </div>

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
                          style={{ color: "#637784" }} className="flex-shrink-0">
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
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogin}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 text-sm"
                      style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 6px 16px rgba(0,0,0,0.3)", opacity: loading ? 0.7 : 1 }}>
                      {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
                    </motion.button>

                    <p className="text-center text-[12px]" style={{ color: "#637784" }}>
                      Don't have an account?{" "}
                      <button onClick={() => { openAuthModal("register"); clearErrors(); }}
                        className="font-bold transition-colors hover:text-white"
                        style={{ color: "#3BA7FF" }}>
                        Create one
                      </button>
                    </p>
                  </motion.div>
                )}

                {displayStep === "register" && (
                  <motion.div key="register"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="mb-1">
                      <h2 className="text-xl font-extrabold" style={{ color: "#F4F8FB" }}>Create account</h2>
                      <p className="text-xs mt-0.5" style={{ color: "#637784" }}>Join RBstars in seconds</p>
                    </div>

                    <AuthInput label="Email" placeholder="you@email.com" value={email}
                      onChange={setEmail} icon={<Mail size={15} />}
                      error={fieldErrors.email} autoFocus />
                    <AuthInput label="Display Name" placeholder="How others see you"
                      value={displayName} onChange={setDisplayName}
                      icon={<User size={15} />} error={fieldErrors.displayName} />

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: "#637784" }}>
                        Roblox Username
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200"
                          style={{
                            background: "#1C2A34",
                            border: `1.5px solid ${fieldErrors.robloxUsername ? "rgba(248,113,113,0.5)" : robloxAvatar ? "rgba(59,167,255,0.6)" : "#2C414E"}`,
                          }}>
                          <Gamepad2 size={15} color={robloxAvatar ? "#3BA7FF" : "#637784"} className="flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="YourRobloxName"
                            value={robloxUsername}
                            onChange={e => setRobloxUsername(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#475569] min-w-0"
                          />
                          {avatarLoading && <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: "#3BA7FF" }} />}
                          {robloxAvatar && !avatarLoading && <CheckCircle size={13} color="#4ade80" className="flex-shrink-0" />}
                        </div>
                        <AnimatePresence>
                          {(robloxAvatar || avatarLoading) && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                              className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                              style={{ background: "#1C2A34", border: "2px solid #2C414E" }}>
                              {avatarLoading
                                ? <Loader2 size={16} className="animate-spin" style={{ color: "#3BA7FF" }} />
                                : robloxAvatar && <img src={robloxAvatar} alt="avatar" className="w-full h-full object-cover" />
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
                    </div>

                    <AuthInput label="Password" placeholder="Min. 8 characters"
                      value={password} onChange={setPassword}
                      type={showPass ? "text" : "password"}
                      icon={<Lock size={15} />}
                      error={fieldErrors.password}
                      rightEl={
                        <button type="button" onClick={() => setShowPass(s => !s)}
                          style={{ color: "#637784" }} className="flex-shrink-0">
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
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRegister}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 text-sm"
                      style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 6px 16px rgba(0,0,0,0.3)", opacity: loading ? 0.7 : 1 }}>
                      {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}
                    </motion.button>

                    <p className="text-center text-[12px]" style={{ color: "#637784" }}>
                      Already have an account?{" "}
                      <button onClick={() => { openAuthModal("login"); clearErrors(); }}
                        className="font-bold transition-colors hover:text-white"
                        style={{ color: "#3BA7FF" }}>
                        Sign in
                      </button>
                    </p>
                  </motion.div>
                )}

                {displayStep === "edit" && (
                  <motion.div key="edit"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="mb-1">
                      <h2 className="text-xl font-extrabold" style={{ color: "#F4F8FB" }}>Edit Profile</h2>
                      <p className="text-xs mt-0.5" style={{ color: "#637784" }}>Update your display name and Roblox username</p>
                    </div>

                    <AuthInput label="Display Name" placeholder="How others see you"
                      value={displayName} onChange={setDisplayName}
                      icon={<User size={15} />} error={fieldErrors.displayName} autoFocus />

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: "#637784" }}>
                        Roblox Username
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200"
                          style={{
                            background: "#1C2A34",
                            border: `1.5px solid ${fieldErrors.robloxUsername ? "rgba(248,113,113,0.5)" : robloxAvatar ? "rgba(59,167,255,0.6)" : "#2C414E"}`,
                          }}>
                          <Gamepad2 size={15} color={robloxAvatar ? "#3BA7FF" : "#637784"} className="flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="YourRobloxName"
                            value={robloxUsername}
                            onChange={e => setRobloxUsername(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-[#475569] min-w-0"
                          />
                          {avatarLoading && <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: "#3BA7FF" }} />}
                          {robloxAvatar && !avatarLoading && <CheckCircle size={13} color="#4ade80" className="flex-shrink-0" />}
                        </div>
                        <AnimatePresence>
                          {(robloxAvatar || avatarLoading) && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                              className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                              style={{ background: "#1C2A34", border: "2px solid #2C414E" }}>
                              {avatarLoading
                                ? <Loader2 size={16} className="animate-spin" style={{ color: "#3BA7FF" }} />
                                : robloxAvatar && <img src={robloxAvatar} alt="avatar" className="w-full h-full object-cover" />
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
                    </div>

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
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEditProfile}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 text-sm"
                      style={{ background: "#3BA7FF", boxShadow: "0 4px 0 0 #2980b9, 0 6px 16px rgba(0,0,0,0.3)", opacity: loading ? 0.7 : 1 }}>
                      {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                    </motion.button>
                  </motion.div>
                )}

                {displayStep === "verify" && (
                  <motion.div key="verify"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <button onClick={() => { setStep("register"); setVerifyCode(""); clearErrors(); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "#1C2A34", border: "1px solid #2C414E", color: "#5CB8FF" }}>
                        <ArrowLeft size={15} />
                      </button>
                      <div>
                        <h2 className="text-xl font-extrabold" style={{ color: "#F4F8FB" }}>Verify email</h2>
                        <p className="text-xs" style={{ color: "#637784" }}>Code sent to {email}</p>
                      </div>
                    </div>

                    <div className="text-center py-2">
                      <motion.div
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ repeat: Infinity, duration: 2.4 }}
                        className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                        style={{ background: "rgba(59,167,255,0.15)", border: "1.5px solid rgba(59,167,255,0.3)" }}>
                        <ShieldCheck size={26} color="#3BA7FF" />
                      </motion.div>
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
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleVerify}
                      disabled={loading || verifyCode.replace(/\s/g, "").length < 6}
                      className="w-full py-3.5 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 text-sm"
                      style={{
                        background: "#3BA7FF",
                        boxShadow: "0 4px 0 0 #2980b9, 0 6px 16px rgba(0,0,0,0.3)",
                        opacity: (loading || verifyCode.replace(/\s/g, "").length < 6) ? 0.5 : 1,
                      }}>
                      {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify Email"}
                    </motion.button>

                    <div className="text-center space-y-2">
                      <button
                        onClick={handleResend}
                        disabled={resendCooldown > 0}
                        className="text-[12px] flex items-center gap-1.5 mx-auto transition-colors"
                        style={{ color: resendCooldown > 0 ? "#475569" : "#3BA7FF" }}>
                        <RefreshCw size={11} />
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                      </button>
                      <button
                        onClick={() => { const cb = onSuccessCallback.current; closeAuthModal(); cb?.(); }}
                        className="text-[12px] font-bold transition-colors hover:text-white block mx-auto"
                        style={{ color: "#637784" }}>
                        Skip for now →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
