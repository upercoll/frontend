import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Bell, Menu, Wifi, WifiOff, Eye, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminSocket } from "../context/AdminSocketContext";
import { adminApi } from "../api";
import type { AdminRole } from "../types";

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const { profile, user, viewAsRole, setViewAsRole, isOwner } = useAdminAuth();
  const { connected } = useAdminSocket();
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setViewDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openViewDropdown() {
    setViewDropdownOpen(o => !o);
    if (roles.length === 0 && !rolesLoading) {
      setRolesLoading(true);
      try {
        const res = await adminApi.roles.list();
        setRoles(res.data.roles || []);
      } catch {}
      setRolesLoading(false);
    }
  }

  return (
    <header
      className="h-16 flex items-center gap-4 px-6 flex-shrink-0 z-10"
      style={{
        background: "rgba(6, 9, 28, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(139,92,246,0.1)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.2)",
      }}
    >
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="w-px h-5 hidden sm:block" style={{ background: "rgba(139,92,246,0.4)" }} />
        <h1 className="font-bold text-base truncate text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {viewAsRole && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24" }}
          >
            <Eye className="w-3 h-3" />
            <span className="font-semibold">Viewing as: {viewAsRole.name}</span>
            <button onClick={() => setViewAsRole(null)} className="ml-0.5 hover:opacity-70 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        {isOwner && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={openViewDropdown}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.55)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.12)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.25)";
                (e.currentTarget as HTMLButtonElement).style.color = "#a5b4fc";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">View As</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${viewDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {viewDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: "rgba(10, 14, 40, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(139,92,246,0.15)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Switch Role View
                    </p>
                  </div>
                  <button
                    onClick={() => { setViewAsRole(null); setViewDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all"
                    style={{ color: !viewAsRole ? "#a5b4fc" : "rgba(255,255,255,0.6)", background: !viewAsRole ? "rgba(99,102,241,0.12)" : "transparent" }}
                    onMouseEnter={e => { if (viewAsRole) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (viewAsRole) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                    Owner (full access)
                    {!viewAsRole && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>Active</span>}
                  </button>

                  {rolesLoading ? (
                    <div className="px-4 py-4 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</div>
                  ) : roles.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-center" style={{ color: "rgba(255,255,255,0.25)" }}>No roles found</div>
                  ) : roles.map(role => (
                    <button
                      key={role._id}
                      onClick={() => { setViewAsRole({ id: role._id, name: role.name, color: role.color || "#6366f1", permissions: role.permissions || [] }); setViewDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all"
                      style={{ color: viewAsRole?.id === role._id ? "#a5b4fc" : "rgba(255,255,255,0.6)", background: viewAsRole?.id === role._id ? "rgba(99,102,241,0.12)" : "transparent" }}
                      onMouseEnter={e => { if (viewAsRole?.id !== role._id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { if (viewAsRole?.id !== role._id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: role.color || "#6366f1" }} />
                      <span className="flex-1 truncate">{role.name}</span>
                      {viewAsRole?.id === role._id && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>Active</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${connected ? "" : ""}`}
          style={{
            background: connected ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${connected ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            color: connected ? "#34d399" : "#f87171",
          }}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="font-medium">{connected ? "Live" : "Offline"}</span>
        </div>

        <div className="text-xs hidden sm:block font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>

        <Link href={user?.isOwner ? "/admin/profile" : "/panel/profile"}>
          <div className="flex items-center gap-2.5 cursor-pointer pl-3 transition-opacity hover:opacity-80"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} className="w-8 h-8 rounded-full object-cover"
                style={{ boxShadow: "0 0 0 2px rgba(99,102,241,0.4)" }} alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 12px rgba(99,102,241,0.35)" }}>
                <span className="text-white text-xs font-bold">
                  {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white">{profile?.displayName || user?.email?.split("@")[0]}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{user?.isOwner ? "Owner" : user?.role?.name}</p>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
