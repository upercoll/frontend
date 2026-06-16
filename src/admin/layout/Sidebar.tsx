import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingBag, Package, Gamepad2, Users, Shield,
  Settings, BarChart3, MessageSquare, FileCheck, Tag, PenSquare,
  ChevronLeft, ChevronRight, LogOut, Activity, Inbox, Bell, Eye, X,
  BookOpen, UserCircle, TrendingUp, Link2, ChevronDown, DollarSign,
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
  group?: string;
}

const ownerNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard",        icon: LayoutDashboard, permission: "view_analytics",   group: "Overview" },
  { href: "/admin/analytics", label: "Analytics",        icon: TrendingUp,      permission: "view_analytics",   group: "Overview" },
  { href: "/admin/orders",    label: "Orders",           icon: ShoppingBag,     permission: "manage_orders",    group: "Commerce" },
  { href: "/admin/customers", label: "Customers",        icon: UserCircle,      ownerOnly: true,                group: "Commerce" },
  { href: "/admin/products",  label: "Products",         icon: Package,         permission: "manage_products",  group: "Commerce" },
  { href: "/admin/promos",    label: "Promo Codes",      icon: Tag,             permission: "manage_promos",    group: "Commerce" },
  { href: "/admin/games",     label: "Games & Categories", icon: Gamepad2,      permission: "manage_games",     group: "Content" },
  { href: "/admin/site-content", label: "Site Content", icon: PenSquare,       permission: "edit_site_content", group: "Content" },
  { href: "/admin/tutorials", label: "Tutorials",        icon: BookOpen,        permission: "edit_site_content", group: "Content" },
  { href: "/admin/roles",     label: "Roles",            icon: Shield,          permission: "manage_roles",     group: "Team" },
  { href: "/admin/team",      label: "Team",             icon: Users,           permission: "manage_team",      group: "Team" },
  { href: "/admin/claim-teams", label: "Claim Teams",   icon: MessageSquare,   permission: "manage_team",      group: "Team" },
  { href: "/admin/monitor",   label: "Agent Monitor",   icon: Activity,        permission: "monitor_agents",   group: "Team" },
  { href: "/admin/open-chats", label: "Open Chats",     icon: MessageSquare,   permission: "monitor_agents",   group: "Team" },
  { href: "/admin/proof-of-delivery", label: "Proof of Delivery", icon: FileCheck, permission: "view_pod",    group: "Team" },
  { href: "/admin/role-view", label: "Role View",       icon: Eye,             ownerOnly: true,                group: "System" },
  { href: "/admin/settings",  label: "Settings",        icon: Settings,        ownerOnly: true,                group: "System" },
];

const agentSpecificItems: NavItem[] = [
  { href: "/panel/dashboard", label: "Dashboard",   icon: LayoutDashboard, group: "Overview" },
  { href: "/panel/queue",     label: "Claim Queue", icon: Inbox,           permission: "claim_agent", group: "Operations" },
  { href: "/panel/stats",     label: "My Stats",    icon: BarChart3,       permission: "claim_agent", group: "Operations" },
];

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Overview: BarChart3, Commerce: ShoppingBag, Content: PenSquare, Team: Users, System: Settings, Operations: Inbox,
};

const collabSubItems = [
  { href: "/admin/collaboration/collaborators", label: "Collaborators", icon: Users },
];

const CollabIcon = Link2;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  podBadge?: number;
}

export default function Sidebar({ collapsed, onToggle, podBadge = 0 }: SidebarProps) {
  const { user, profile, hasPermission, isOwner, logout, viewAsRole, setViewAsRole } = useAdminAuth();
  const [location] = useLocation();
  const [collabOpen, setCollabOpen] = useState(location.startsWith("/admin/collaboration"));

  const isViewingAsAgentRole = viewAsRole
    ? viewAsRole.permissions.includes("claim_agent") &&
      !viewAsRole.permissions.includes("view_analytics") &&
      !viewAsRole.permissions.includes("manage_orders")
    : false;

  let navItems: NavItem[];

  if (isOwner) {
    if (viewAsRole) {
      if (isViewingAsAgentRole) {
        navItems = [
          { href: "/panel/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
          { href: "/panel/queue", label: "Claim Queue", icon: Inbox, group: "Operations" },
          { href: "/panel/stats", label: "My Stats", icon: BarChart3, group: "Operations" },
        ];
      } else {
        navItems = ownerNav.filter(item => {
          if (item.ownerOnly) return false;
          return !item.permission || viewAsRole.permissions.includes(item.permission);
        });
      }
    } else {
      navItems = ownerNav.filter(item => !item.permission || hasPermission(item.permission));
    }
  } else {
    const agentItems = agentSpecificItems.filter(item => !item.permission || hasPermission(item.permission));
    const adminItems = ownerNav.filter(item =>
      !item.ownerOnly &&
      item.permission &&
      hasPermission(item.permission)
    );
    navItems = [...agentItems, ...adminItems];
  }

  const groups = isOwner && !viewAsRole
    ? ["Overview", "Commerce", "Content", "Team", "System"]
    : !isOwner
    ? ["Overview", "Operations", "Commerce", "Content", "Team"]
    : undefined;

  const dashboardHref = isOwner ? "/admin/dashboard" : "/panel/dashboard";
  const profileHref = isOwner ? "/admin/profile" : "/panel/profile";
  const showCollab = isOwner && !viewAsRole;
  const isCollabActive = location.startsWith("/admin/collaboration");

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="relative flex flex-col h-full overflow-hidden flex-shrink-0"
      style={{
        background: "rgba(6, 9, 28, 0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(139,92,246,0.12)",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.03), 4px 0 32px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-center px-4 h-16 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 flex-1"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div>
                <span className="text-white font-bold text-sm tracking-tight">RBstars</span>
                <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(139,92,246,0.7)" }}>
                  {isOwner ? (viewAsRole ? `Viewing as ${viewAsRole.name}` : "Owner Panel") : "Team Panel"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 16px rgba(99,102,241,0.35)" }}>
            <span className="text-white font-bold text-sm">R</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 hover:bg-white/5"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {viewAsRole && !collapsed && (
        <div className="mx-3 my-2 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
          <Eye className="w-3 h-3 flex-shrink-0" />
          <span className="flex-1 truncate">Viewing as: {viewAsRole.name}</span>
          <button onClick={() => setViewAsRole(null)} className="hover:opacity-70 transition-opacity flex-shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {groups && !collapsed ? (
          <>
            {groups.map(group => {
              const groupItems = navItems.filter(item => item.group === group);
              if (groupItems.length === 0) return null;
              const GIcon = GROUP_ICONS[group];
              return (
                <div key={group} className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-2 mb-0.5">
                    {GIcon && <GIcon className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(139,92,246,0.5)" }} />}
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>
                      {group}
                    </p>
                    <div className="flex-1 h-px ml-1" style={{ background: "rgba(255,255,255,0.05)" }} />
                  </div>
                  {groupItems.map(item => (
                    <NavLink key={item.href} item={item} location={location} collapsed={collapsed} podBadge={podBadge} />
                  ))}
                </div>
              );
            })}

            {showCollab && (
              <div className="mb-2">
                <div className="flex items-center gap-2 px-3 py-2 mb-0.5">
                  <CollabIcon className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(139,92,246,0.5)" }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>
                    Collaboration
                  </p>
                  <div className="flex-1 h-px ml-1" style={{ background: "rgba(255,255,255,0.05)" }} />
                </div>

                <motion.div
                  whileHover={{ x: collapsed ? 0 : 3 }}
                  onClick={() => setCollabOpen(o => !o)}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-0.5"
                  style={isCollabActive ? {
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 100%)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99,102,241,0.25)",
                    boxShadow: "0 0 12px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
                  } : {
                    color: "rgba(255,255,255,0.4)",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={e => {
                    if (!isCollabActive) {
                      (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.85)";
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isCollabActive) {
                      (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.4)";
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }
                  }}
                >
                  {isCollabActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                      style={{ background: "linear-gradient(180deg,#818cf8,#8b5cf6)" }} />
                  )}
                  <CollabIcon className="w-4 h-4 flex-shrink-0" />
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium truncate flex-1">
                    Collaboration
                  </motion.span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collabOpen ? "rotate-180" : ""}`} />
                </motion.div>

                <AnimatePresence>
                  {collabOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {collabSubItems.map(sub => {
                        const isActive = location === sub.href || location.startsWith(sub.href);
                        const SubIcon = sub.icon;
                        return (
                          <Link key={sub.href} href={sub.href}>
                            <div className="flex items-center gap-3 px-3 py-2 ml-4 rounded-xl cursor-pointer transition-all mb-0.5 text-sm"
                              style={isActive ? {
                                background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)",
                                color: "#a5b4fc",
                                border: "1px solid rgba(99,102,241,0.2)",
                              } : {
                                color: "rgba(255,255,255,0.35)",
                                border: "1px solid transparent",
                              }}
                              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.7)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; } }}
                              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; } }}
                            >
                              <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="font-medium">{sub.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                      <Link href="/admin/collaboration/payouts-all">
                        <div className="flex items-center gap-3 px-3 py-2 ml-4 rounded-xl cursor-pointer transition-all mb-0.5 text-sm"
                          style={location.startsWith("/admin/collaboration/payouts-all") ? {
                            background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)",
                            color: "#a5b4fc",
                            border: "1px solid rgba(99,102,241,0.2)",
                          } : {
                            color: "rgba(255,255,255,0.35)",
                            border: "1px solid transparent",
                          }}
                          onMouseEnter={e => { if (!location.startsWith("/admin/collaboration/payouts-all")) { (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.7)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; } }}
                          onMouseLeave={e => { if (!location.startsWith("/admin/collaboration/payouts-all")) { (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; } }}
                        >
                          <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-medium">Payouts</span>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-0.5">
            {navItems.map(item => (
              <NavLink key={item.href} item={item} location={location} collapsed={collapsed} podBadge={podBadge} />
            ))}
            {showCollab && !collapsed && (
              <Link href="/admin/collaboration/collaborators">
                <motion.div
                  whileHover={{ x: 3 }}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-0.5"
                  style={isCollabActive ? {
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 100%)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99,102,241,0.25)",
                  } : {
                    color: "rgba(255,255,255,0.4)",
                    border: "1px solid transparent",
                  }}
                >
                  <CollabIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Collaboration</span>
                </motion.div>
              </Link>
            )}
            {showCollab && collapsed && (
              <Link href="/admin/collaboration/collaborators">
                <motion.div
                  className="relative flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-0.5"
                  style={isCollabActive ? {
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 100%)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99,102,241,0.25)",
                  } : {
                    color: "rgba(255,255,255,0.4)",
                    border: "1px solid transparent",
                  }}
                >
                  <CollabIcon className="w-4 h-4 flex-shrink-0" />
                </motion.div>
              </Link>
            )}
          </div>
        )}
      </nav>

      <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href={profileHref}>
          <div className={cn(
            "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all mb-1 hover:bg-white/5",
            collapsed && "justify-center"
          )}>
            {profile?.profilePicture ? (
              <img src={profile.profilePicture}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                style={{ boxShadow: "0 0 0 2px rgba(99,102,241,0.4)" }} alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))", border: "1px solid rgba(139,92,246,0.3)" }}>
                <span className="text-indigo-300 text-xs font-bold">
                  {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">
                    {profile?.displayName || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {isOwner ? "Owner" : user?.role?.name || "Agent"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>
        <button
          onClick={logout}
          className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm", collapsed && "justify-center")}
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Log out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

function NavLink({ item, location, collapsed, podBadge }: { item: NavItem; location: string; collapsed: boolean; podBadge: number }) {
  const isActive = location === item.href || location.startsWith(item.href + "/");
  const Icon = item.icon;
  const badge = item.href.includes("proof-of-delivery") ? podBadge : 0;

  return (
    <Link href={item.href}>
      <motion.div
        whileHover={{ x: collapsed ? 0 : 3 }}
        className={cn("relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-0.5", collapsed && "justify-center")}
        style={isActive ? {
          background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 100%)",
          color: "#a5b4fc",
          border: "1px solid rgba(99,102,241,0.25)",
          boxShadow: "0 0 12px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
        } : {
          color: "rgba(255,255,255,0.4)",
          border: "1px solid transparent",
        }}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.85)";
            (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.4)";
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
          }
        }}
      >
        {isActive && !collapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
            style={{ background: "linear-gradient(180deg,#818cf8,#8b5cf6)" }} />
        )}
        <Icon className="w-4 h-4 flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
}
