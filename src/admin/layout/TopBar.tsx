import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Bell, Search, Menu, Wifi, WifiOff, Eye, ChevronDown, X } from "lucide-react";
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
    <header className="h-16 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-sm flex items-center gap-4 px-6 flex-shrink-0 z-10">
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden text-slate-400 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-white font-semibold text-lg truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {viewAsRole && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
            style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b" }}
          >
            <Eye className="w-3 h-3" />
            <span className="font-semibold">Viewing as: {viewAsRole.name}</span>
            <button
              onClick={() => setViewAsRole(null)}
              className="ml-0.5 hover:opacity-70 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        {isOwner && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={openViewDropdown}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
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
                  className="absolute right-0 top-full mt-1.5 w-56 bg-[#0d1f3c] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                >
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Switch Role View</p>
                  </div>

                  <button
                    onClick={() => { setViewAsRole(null); setViewDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-white/5 transition-colors ${!viewAsRole ? "text-blue-400" : "text-slate-300"}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Owner (full access)
                    {!viewAsRole && <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold">Active</span>}
                  </button>

                  {rolesLoading ? (
                    <div className="px-3 py-4 text-center text-slate-500 text-xs">Loading roles…</div>
                  ) : roles.length === 0 ? (
                    <div className="px-3 py-3 text-slate-600 text-xs text-center">No roles found</div>
                  ) : (
                    roles.map((role) => (
                      <button
                        key={role._id}
                        onClick={() => {
                          setViewAsRole({
                            id: role._id,
                            name: role.name,
                            color: role.color || "#3b82f6",
                            permissions: role.permissions || [],
                          });
                          setViewDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-white/5 transition-colors ${viewAsRole?.id === role._id ? "text-blue-400" : "text-slate-300"}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: role.color || "#3b82f6" }}
                        />
                        <span className="flex-1 truncate">{role.name}</span>
                        {viewAsRole?.id === role._id && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold">Active</span>
                        )}
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{connected ? "Live" : "Offline"}</span>
        </div>

        <div className="text-slate-400 text-xs hidden sm:block">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>

        <Link href={user?.isOwner ? "/admin/profile" : "/panel/profile"}>
          <div className="flex items-center gap-1 border-l border-white/5 pl-3 cursor-pointer hover:opacity-80 transition-opacity">
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-700/30 border border-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-xs font-bold">
                  {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block ml-1">
              <p className="text-white text-xs font-medium">{profile?.displayName || user?.email?.split("@")[0]}</p>
              <p className="text-slate-500 text-[10px]">{user?.isOwner ? "Owner" : user?.role?.name}</p>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
