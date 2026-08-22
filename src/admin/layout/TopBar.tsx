import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
  const [, navigate] = useLocation();
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function getNavTargetForRole(permissions: string[]): string {
    const isAgentRole = permissions.includes("claim_agent") &&
      !permissions.includes("view_analytics") &&
      !permissions.includes("manage_orders") &&
      !permissions.includes("view_orders");
    return isAgentRole ? "/panel/dashboard" : "/admin/dashboard";
  }

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
      className="h-16 flex items-center gap-4 px-6 flex-shrink-0 z-10 bg-white"
      style={{
        borderBottom: "2.5px solid #131313",
      }}
    >
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden transition-colors" style={{ color: "#131313" }}>
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 min-w-0 flex items-center gap-3">
        <span className="tilt-sq hidden sm:block !w-2 !h-2" />
        <h1 className="font-display text-lg uppercase tracking-wide truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {viewAsRole && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1.5 rounded-lg -rotate-1"
            style={{ background: "#FFF6DC", border: "1.5px solid #FFC800", color: "#92670a" }}
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
              className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white border-2 hover:bg-[#131313] hover:text-white transition-all"
              style={{ borderColor: "#131313", color: "#131313" }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View As</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${viewDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {viewDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50 bg-white"
                  style={{
                    border: "2px solid #131313",
                    boxShadow: "6px 6px 0 #131313",
                  }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: "2px solid #131313" }}>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#8a8375" }}>
                      Switch Role View
                    </p>
                  </div>
                  <button
                    onClick={() => { setViewAsRole(null); setViewDropdownOpen(false); navigate("/admin/dashboard"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-[#F2EEE5]"
                    style={{ color: "#131313", fontWeight: !viewAsRole ? 700 : 500, background: !viewAsRole ? "#F2EEE5" : "transparent" }}
                  >
                    <span className="tilt-sq !w-2 !h-2" />
                    Owner (full access)
                    {!viewAsRole && <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold text-white rotate-3" style={{ background: "#E2231A" }}>Active</span>}
                  </button>

                  {rolesLoading ? (
                    <div className="px-4 py-4 text-center font-mono text-xs" style={{ color: "#8a8375" }}>Loading…</div>
                  ) : roles.length === 0 ? (
                    <div className="px-4 py-3 font-mono text-xs text-center" style={{ color: "#8a8375" }}>No roles found</div>
                  ) : roles.map(role => (
                    <button
                      key={role._id}
                      onClick={() => {
                        const perms = role.permissions || [];
                        setViewAsRole({ id: role._id, name: role.name, color: role.color || "#E2231A", permissions: perms });
                        setViewDropdownOpen(false);
                        navigate(getNavTargetForRole(perms));
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-[#F2EEE5]"
                      style={{ color: "#131313", background: viewAsRole?.id === role._id ? "#F2EEE5" : "transparent" }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: role.color || "#E2231A", border: "1px solid #131313" }} />
                      <span className="flex-1 truncate font-medium">{role.name}</span>
                      {viewAsRole?.id === role._id && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold text-white rotate-3" style={{ background: "#E2231A" }}>Active</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded-lg"
          style={{
            background: connected ? "#E9F8EF" : "#FDEEEC",
            border: `1.5px solid ${connected ? "#00B06F" : "#E2231A"}`,
            color: connected ? "#00875A" : "#C53011",
          }}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{connected ? "Live" : "Offline"}</span>
        </div>

        <div className="hidden sm:block font-mono text-[11px] uppercase tracking-wider" style={{ color: "#8a8375" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>

        <Link href={user?.isOwner ? "/admin/profile" : "/panel/profile"}>
          <div className="flex items-center gap-2.5 cursor-pointer pl-3 transition-opacity hover:opacity-80"
            style={{ borderLeft: "2px solid rgba(19,19,19,.12)" }}>
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} className="w-8 h-8 rounded-full object-cover"
                style={{ boxShadow: "0 0 0 2px #131313" }} alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                style={{ background: "#E2231A", borderColor: "#131313" }}>
                <span className="text-white text-xs font-bold">
                  {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-xs font-bold">{profile?.displayName || user?.email?.split("@")[0]}</p>
              <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "#8a8375" }}>{user?.isOwner ? "Owner" : user?.role?.name}</p>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
