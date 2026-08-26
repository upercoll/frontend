import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, User, AtSign, FileText, Loader2, CheckCircle } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminApi } from "../api";
import { useLocation } from "wouter";

export default function ProfileSetup() {
  const { user, profile, updateProfile, isOwner } = useAdminAuth();
  const [, navigate] = useLocation();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [picture, setPicture] = useState(profile?.profilePicture || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError("Display name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await adminApi.profile.update({ displayName: displayName.trim(), username: username.trim(), bio: bio.trim() });
      updateProfile(res.data.profile);
      navigate(isOwner ? "/admin/dashboard" : "/panel/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Your Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome! Let's get you set up before you dive in.</p>
        </div>

        <div className="bg-[#0d1f3c] border border-white/5 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col items-center gap-3 mb-2">
              <div className="relative">
                {picture ? (
                  <img src={picture} className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/20" alt="" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-700/30 border-2 border-blue-500/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePictureUpload(f); e.target.value = ""; }} />
              <p className="text-slate-500 text-xs">Click the camera icon to upload a photo</p>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">
                Display Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Your name"
                  className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="username"
                  className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <p className="text-slate-600 text-xs mt-1">Lowercase letters, numbers, and underscores only</p>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Bio <span className="text-slate-600">(optional)</span></label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Tell the team a bit about yourself..." rows={3}
                  className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <p className="text-slate-600 text-xs mt-1 text-right">{bio.length}/200</p>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
            )}

            <motion.button type="submit" disabled={saving || !displayName.trim()}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-blue-500/20">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? "Saving..." : "Complete Setup & Enter Panel"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
