import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingBag, Package, Gamepad2, Users, Shield,
  Settings, BarChart3, MessageSquare, FileCheck, Tag, PenSquare,
  ChevronLeft, ChevronRight, LogOut, Activity, Inbox, Bell,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  ownerOnly?: boolean;
  badge?: number;
}

const ownerNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "view_analytics" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, permission: "manage_orders" },
  { href: "/admin/products", label: "Products", icon: Package, permission: "manage_products" },
  { href: "/admin/games", label: "Games & Categories", icon: Gamepad2, permission: "manage_games" },
  { href: "/admin/site-content", label: "Site Content", icon: PenSquare, permission: "edit_site_content" },
  { href: "/admin/promos", label: "Promo Codes", icon: Tag, permission: "manage_promos" },
  { href: "/admin/roles", label: "Roles", icon: Shield, permission: "manage_roles" },
  { href: "/admin/team", label: "Team", icon: Users, permission: "manage_team" },
  { href: "/admin/claim-teams", label: "Claim Teams", icon: MessageSquare, permission: "manage_team" },
  { href: "/admin/monitor", label: "Agent Monitor", icon: Activity, permission: "monitor_agents" },
  { href: "/admin/proof-of-delivery", label: "Proof of Delivery", icon: FileCheck, permission: "view_pod" },
  { href: "/admin/settings", label: "Settings", icon: Settings, ownerOnly: true },
];

const agentNav: NavItem[] = [
  { href: "/panel/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/panel/queue", label: "Claim Queue", icon: Inbox },
  { href: "/panel/stats", label: "My Stats", icon: BarChart3 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  podBadge?: number;
}

export default function Sidebar({ collapsed, onToggle, podBadge = 0 }: SidebarProps) {
  const { user, profile, hasPermission, isOwner, logout } = useAdminAuth();
  const [location] = useLocation();

  const navItems = isOwner
    ? ownerNav.filter((item) => !item.permission || hasPermission(item.permission))
    : agentNav;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-[#0a1628] border-r border-white/5 overflow-hidden flex-shrink-0"
    >
      <div className="flex items-center px-4 h-16 border-b border-white/5 flex-shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div>
                <span className="text-white font-bold text-sm">RBstars</span>
                <p className="text-blue-400/70 text-[10px]">{isOwner ? "Owner Panel" : "Agent Panel"}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">R</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto w-6 h-6 rounded-md text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          const badge = item.href.includes("proof-of-delivery") ? podBadge : 0;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-full"
                  />
                )}
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-blue-400" : "")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium truncate flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3 flex-shrink-0">
        <Link href={isOwner ? "/admin/profile" : "/panel/profile"}>
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors mb-1",
            collapsed && "justify-center"
          )}>
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-500/30" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-700/30 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-xs font-bold">
                  {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-white text-xs font-medium truncate">
                    {profile?.displayName || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-slate-500 text-[10px] truncate">
                    {isOwner ? "Owner" : user?.role?.name || "Agent"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm">
                Log out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
