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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setViewDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openViewDropdown() {
    setViewDropdownOpen((o) => !o);
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
    <header className="h-16 flex items-center gap-4 px-6 flex-shrink-0 z-10" style={{ background: "#fff", borderBottom: "1px solid #E9EBF5" }}>
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden transition-colors" style={{ color: "#94a3b8" }}>
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-lg truncate" style={{ color: "#1e1b4b" }}>{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {viewAsRole && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
            style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)", color: "#d97706" }}
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
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all"
              style={{ borderColor: "#E9EBF5", color: "#6b7280", background: "#F7F8FC" }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">View As</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${viewDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {viewDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl overflow-hidden shadow-xl z-50"
                  style={{ border: "1px solid #E9EBF5" }}
                >
                  <div className="px-3 py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Switch Role View</p>
                  </div>

                  <button
                    onClick={() => { setViewAsRole(null); setViewDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors"
                    style={{ color: !viewAsRole ? "#4f46e5" : "#374151", background: !viewAsRole ? "#EEF2FF" : "transparent" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    Owner (full access)
                    {!viewAsRole && <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">Active</span>}
                  </button>

                  {rolesLoading ? (
                    <div className="px-3 py-4 text-center text-xs" style={{ color: "#9ca3af" }}>Loading roles…</div>
                  ) : roles.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-center" style={{ color: "#d1d5db" }}>No roles found</div>
                  ) : (
                    roles.map((role) => (
                      <button
                        key={role._id}
                        onClick={() => {
                          setViewAsRole({ id: role._id, name: role.name, color: role.color || "#4f46e5", permissions: role.permissions || [] });
                          setViewDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors"
                        style={{ color: viewAsRole?.id === role._id ? "#4f46e5" : "#374151", background: viewAsRole?.id === role._id ? "#EEF2FF" : "transparent" }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: role.color || "#4f46e5" }} />
                        <span className="flex-1 truncate">{role.name}</span>
                        {viewAsRole?.id === role._id && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">Active</span>
                        )}
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{connected ? "Live" : "Offline"}</span>
        </div>

        <div className="text-xs hidden sm:block" style={{ color: "#9ca3af" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>

        <Link href={user?.isOwner ? "/admin/profile" : "/panel/profile"}>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity pl-3" style={{ borderLeft: "1px solid #E9EBF5" }}>
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-200" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                <span className="text-white text-xs font-bold">
                  {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-xs font-semibold" style={{ color: "#1e1b4b" }}>{profile?.displayName || user?.email?.split("@")[0]}</p>
              <p className="text-[10px]" style={{ color: "#9ca3af" }}>{user?.isOwner ? "Owner" : user?.role?.name}</p>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
