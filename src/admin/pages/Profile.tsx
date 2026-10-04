import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, User, AtSign, FileText, Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminApi } from "../api";
import { PageHeader } from "../components/kit";

export default function AdminProfilePage() {
  const { user, profile, updateProfile, isOwner } = useAdminAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [picture, setPicture] = useState(profile?.profilePicture || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const handlePictureUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await adminApi.profile.uploadPicture(form);
      setPicture(res.data.profilePicture);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    try {
      const res = await adminApi.profile.update({ displayName: displayName.trim(), username: username.trim(), bio });
      updateProfile(res.data.profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) { setPassError("New password must be at least 8 characters"); return; }
    setChangingPass(true); setPassError(""); setPassSuccess(false);
    try {
      await adminApi.profile.changePassword(currentPass, newPass);
      setCurrentPass(""); setNewPass("");
      setPassSuccess(true);
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="p-6 max-w-[700px] mx-auto space-y-6">
      <PageHeader title="My Profile" description="Your account details, avatar and password." icon={User} />

      <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-6">
        <h3 className="text-[var(--pn-text)] font-medium mb-5">Profile Information</h3>

        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="relative">
            {picture ? (
              <img src={picture} className="w-20 h-20 rounded-full object-cover ring-4 ring-[var(--pn-action)]" alt="" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[var(--pn-action)] border-2 border-[var(--pn-action-border)] flex items-center justify-center">
                <User className="w-8 h-8 text-[var(--pn-action)]" />
              </div>
            )}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[var(--pn-primary)] rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--pn-primary-hover)] transition-colors">
              {uploading ? <Loader2 className="w-3.5 h-3.5 text-[var(--pn-text)] animate-spin" /> : <Camera className="w-3.5 h-3.5 text-[var(--pn-text)]" />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePictureUpload(f); e.target.value = ""; }} />
          <div className="text-center">
            <p className="text-[var(--pn-text)] font-medium">{profile?.displayName || user?.email?.split("@")[0]}</p>
            <p className="text-[var(--pn-text-2)] text-sm">{isOwner ? "Owner" : user?.role?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pn-text-2)]" />
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]" />
            </div>
          </div>
          <div>
            <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Username</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pn-text-2)]" />
              <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]" />
            </div>
          </div>
          <div>
            <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Bio</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[var(--pn-text-2)]" />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={3}
                className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)] resize-none" />
            </div>
          </div>
          {error && <div className="text-[var(--pn-critical-text)] text-sm bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-xl px-4 py-3">{error}</div>}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-[var(--pn-success-fg)] bg-[var(--pn-success-bg)] border border-[var(--pn-success-line)] rounded-xl px-4 py-3 text-sm">
              <CheckCircle className="w-4 h-4" /> Profile saved successfully
            </motion.div>
          )}
          <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full bg-[var(--pn-primary)] hover:bg-[var(--pn-primary-hover)] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Profile
          </motion.button>
        </form>
      </div>

      {!isOwner && (
        <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-6">
          <h3 className="text-[var(--pn-text)] font-medium mb-5">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pn-text-2)]" />
                <input type={showCurrent ? "text" : "password"} value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required
                  className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl pl-10 pr-11 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pn-text-2)]">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pn-text-2)]" />
                <input type={showNew ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={8}
                  className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl pl-10 pr-11 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pn-text-2)]">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {passError && <div className="text-[var(--pn-critical-text)] text-sm bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-xl px-4 py-3">{passError}</div>}
            {passSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-[var(--pn-success-fg)] bg-[var(--pn-success-bg)] border border-[var(--pn-success-line)] rounded-xl px-4 py-3 text-sm">
                <CheckCircle className="w-4 h-4" /> Password updated successfully
              </motion.div>
            )}
            <motion.button type="submit" disabled={changingPass} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full bg-[var(--pn-primary)] hover:bg-[var(--pn-primary-hover)] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
              {changingPass && <Loader2 className="w-4 h-4 animate-spin" />}
              Change Password
            </motion.button>
          </form>
        </div>
      )}

      <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-6">
        <h3 className="text-[var(--pn-text)] font-medium mb-3">Account Info</h3>
        <div className="space-y-3">
          {[
            { label: "Email", value: user?.email },
            { label: "Account Type", value: isOwner ? "Owner" : user?.role?.name || "Team Member" },
            { label: "Status", value: "Active" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--pn-border)] last:border-0">
              <span className="text-[var(--pn-text-3)] text-sm">{item.label}</span>
              <span className="text-[var(--pn-text)] text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
