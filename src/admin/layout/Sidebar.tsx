import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingBag, Package, Gamepad2, Users, Shield,
  Settings, BarChart3, MessageSquare, FileCheck, Tag, PenSquare,
  ChevronLeft, ChevronRight, LogOut, Activity, Inbox, Eye, X,
  BookOpen, UserCircle, TrendingUp, Link2, ChevronDown, DollarSign,
  Archive, ClipboardList, Clock, Video, Film, Truck, Bot, Sparkles, Megaphone, Rocket,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminSocket } from "../context/AdminSocketContext";

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
  { href: "/admin/control",    label: "Control Center",   icon: Rocket,          permission: "view_analytics",   group: "Overview" },
  { href: "/admin/dashboard", label: "Dashboard",        icon: LayoutDashboard, permission: "view_analytics",   group: "Overview" },
  { href: "/admin/analytics", label: "Analytics",        icon: TrendingUp,      permission: "view_analytics",   group: "Overview" },
  { href: "/admin/orders",    label: "Orders",           icon: ShoppingBag,     permission: "view_orders",      group: "Commerce" },
  { href: "/admin/customers", label: "Customers",        icon: UserCircle,      permission: "view_customers",    group: "Commerce" },
  { href: "/admin/products",  label: "Products",         icon: Package,         permission: "view_products",    group: "Commerce" },
  { href: "/admin/promos",    label: "Promo Codes",      icon: Tag,             permission: "manage_promos",    group: "Commerce" },
  { href: "/admin/games",     label: "Games & Categories", icon: Gamepad2,      permission: "view_games",       group: "Content" },
  { href: "/admin/claim-time", label: "Claim Time",        icon: Clock,         permission: "view_games",       group: "Content" },
  { href: "/admin/site-content", label: "Site Content", icon: PenSquare,       permission: "edit_site_content", group: "Content" },
  { href: "/admin/tutorials", label: "Tutorials",        icon: BookOpen,        permission: "edit_site_content", group: "Content" },
  { href: "/admin/roles",     label: "Roles",            icon: Shield,          permission: "manage_roles",     group: "Team" },
  { href: "/admin/team",      label: "Team",             icon: Users,           permission: "view_team",        group: "Team" },
  { href: "/admin/open-chats", label: "Open Chats",     icon: MessageSquare,   permission: "monitor_agents",   group: "Team" },
  { href: "/panel/queue",     label: "Claim Queue",     icon: Inbox,           permission: "monitor_agents",   group: "Team" },
  { href: "/admin/proof-of-delivery", label: "Proof of Delivery", icon: FileCheck, permission: "view_pod",    group: "Team" },
  { href: "/admin/auto-logs",      label: "Bot Logs",          icon: Bot,             permission: "view_orders",   group: "Operations" },
  { href: "/admin/delivery-team", label: "Delivery Team", icon: Truck, permission: "view_deliverers", group: "Team" },
  { href: "/admin/stock/requests", label: "Stock Requests", icon: ClipboardList, permission: "view_stock",    group: "Stock" },
  { href: "/admin/stock/tracking", label: "Stocker Tracking", icon: Archive,   permission: "manage_stockers", group: "Stock" },
  { href: "/admin/socials",          label: "Videos",         icon: Video,         permission: "view_socials",    group: "Socials" },
  { href: "/admin/socials/creators", label: "Creators & Payments", icon: Film,      permission: "view_socials",    group: "Socials" },
  { href: "/admin/tickets",          label: "Support Tickets",   icon: MessageSquare, permission: "view_tickets",    group: "Support" },
  { href: "/admin/role-view", label: "Role View",       icon: Eye,             permission: "manage_roles",       group: "System" },
  { href: "/admin/site-modes", label: "Site Modes",    icon: Sparkles,        permission: "view_site_modes",    group: "System" },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone,     permission: "view_announcements", group: "System" },
  { href: "/admin/settings",  label: "Settings",        icon: Settings,        permission: "view_settings",       group: "System" },
];

const agentSpecificItems: NavItem[] = [
  { href: "/panel/dashboard", label: "Dashboard",   icon: LayoutDashboard, group: "Overview" },
  { href: "/panel/stats",     label: "My Stats",    icon: BarChart3,       permission: "claim_agent", group: "Operations" },
];

const stockerNavItems: NavItem[] = [
  { href: "/stocker/dashboard", label: "Dashboard",       icon: LayoutDashboard, group: "Overview" },
  { href: "/stocker/request",   label: "New Request",     icon: ClipboardList,   group: "Stock" },
  { href: "/stocker/history",   label: "My Requests",     icon: Archive,         group: "Stock" },
];

const collabSubItems = [
  { href: "/admin/collaboration/collaborators", label: "Collaborators", icon: Users },
];

const CollabIcon = Link2;

const claimQueueSubItems = [
  { label: "Waiting to be Claimed", icon: Inbox, section: "waiting" },
  { label: "My Active Chats", icon: Activity, section: "mine" },
  { label: "Completed Chats", icon: FileCheck, section: "completed" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  podBadge?: number;
}

function NavLink({ item, location, collapsed, podBadge = 0 }: { item: NavItem; location: string; collapsed: boolean; podBadge?: number }) {
  const isActive = location === item.href || location.startsWith(item.href + "/");
  const badge = item.href === "/admin/proof-of-delivery" ? podBadge : (item.badge || 0);

  return (
    <Link href={item.href}>
      <div className={`pn-navitem mb-0.5 ${isActive ? "is-active" : ""}`} title={collapsed ? item.label : undefined}>
        <item.icon className="w-4 h-4 pn-navicon" />
        {!collapsed && <span className="truncate flex-1">{item.label}</span>}
        {!collapsed && badge > 0 && <span className="pn-count">{badge}</span>}
        {collapsed && badge > 0 && (
          <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full" style={{ background: "var(--pn-critical-line)" }} />
        )}
      </div>
    </Link>
  );
}

function GroupLabel({ label, icon: Icon }: { label: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 px-2.5 pt-4 pb-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 pn-navicon" style={{ color: "var(--pn-text-3)" }} />}
      <p className="pn-navlabel">{label}</p>
    </div>
  );
}

function SubRow({ active, children, href, onClick }: {
  active: boolean; href?: string; onClick?: () => void; children: React.ReactNode;
}) {
  const cls = `pn-navitem pn-navsub mb-0.5 ${active ? "is-active" : ""}`;
  const inner = <div className={cls}>{children}</div>;
  return href
    ? <Link href={href}>{inner}</Link>
    : <div onClick={onClick} style={{ cursor: "pointer" }}>{inner}</div>;
}

export default function Sidebar({ collapsed, onToggle, podBadge = 0 }: SidebarProps) {
  const { user, profile, hasPermission, isOwner, logout, viewAsRole, setViewAsRole } = useAdminAuth();
  const { pendingClaims } = useAdminSocket();
  const [location] = useLocation();
  const [collabOpen, setCollabOpen] = useState(location.startsWith("/admin/collaboration"));
  const [claimQueueOpen, setClaimQueueOpen] = useState(location.startsWith("/panel/queue"));

  const isStocker = user?.type === "stocker";
  const isAgent = !isOwner && !isStocker && user?.type === "team_member";
  const hasClaimAgent = isAgent && hasPermission("claim_agent");

  const isViewingAsAgentRole = viewAsRole
    ? viewAsRole.permissions.includes("claim_agent") &&
      !viewAsRole.permissions.includes("view_analytics") &&
      !viewAsRole.permissions.includes("view_orders")
    : false;

  let navItems: NavItem[];

  if (isStocker) {
    navItems = stockerNavItems;
  } else if (isOwner) {
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
          return !item.permission || hasPermission(item.permission);
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

  const groups: string[] | undefined = isStocker
    ? ["Overview", "Stock"]
    : isOwner && !viewAsRole
    ? ["Overview", "Commerce", "Content", "Team", "Stock", "Socials", "Support", "System"]
    : isOwner && viewAsRole && isViewingAsAgentRole
    ? ["Overview", "Operations"]
    : isOwner && viewAsRole && !isViewingAsAgentRole
    ? ["Overview", "Commerce", "Content", "Team", "Stock", "Socials", "Support"]
    : ["Overview", "Commerce", "Content", "Team", "Stock", "Socials", "Support"];

  const profileHref = isStocker ? "/stocker/dashboard" : isOwner ? "/admin/profile" : "/panel/profile";
  const showCollab = isOwner && !viewAsRole && !isStocker;
  const isCollabActive = location.startsWith("/admin/collaboration");
  const isQueueActive = location.startsWith("/panel/queue");

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 244 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="pn-rail relative flex flex-col h-full overflow-hidden flex-shrink-0"
    >
      <div className="flex items-center px-3.5 h-14 flex-shrink-0" style={{ borderBottom: "1px solid var(--pn-border)" }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 flex-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="/rb-logo.png" alt="RBstars" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="pn-navlabel truncate">
                  {isStocker ? "Stocker panel" : isOwner ? (viewAsRole ? `Viewing as ${viewAsRole.name}` : "Owner panel") : "Team panel"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto overflow-hidden">
            <img src="/rb-logo.png" alt="RBstars" className="w-full h-full object-contain" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto w-6 h-6 rounded-md hidden lg:flex items-center justify-center transition-colors flex-shrink-0 hover:bg-black/[0.06]"
          style={{ color: "var(--pn-text-3)" }}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {viewAsRole && !collapsed && (
        <div className="mx-2.5 mt-2.5 px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold"
          style={{ background: "var(--pn-warning-bg)", color: "var(--pn-warning-fg)", border: "1px solid var(--pn-warning-line)" }}>
          <Eye className="w-3 h-3 flex-shrink-0" />
          <span className="flex-1 truncate">Viewing as: {viewAsRole.name}</span>
          <button onClick={() => setViewAsRole(null)} className="hover:opacity-70 transition-opacity flex-shrink-0" aria-label="Exit role view">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1.5 px-2">
        {groups && !collapsed ? (
          <>
            {groups.map(group => {
              const groupItems = navItems.filter(item => item.group === group);
              if (groupItems.length === 0) return null;
              return (
                <div key={group}>
                  <GroupLabel label={group} />
                  {groupItems.map(item => (
                    <NavLink key={item.href} item={item} location={location} collapsed={collapsed} podBadge={podBadge} />
                  ))}
                </div>
              );
            })}

            {hasClaimAgent && !collapsed && (
              <div>
                <GroupLabel label="Operations" icon={Inbox} />
                <div className={`pn-navitem mb-0.5 ${isQueueActive ? "is-active" : ""}`}
                  onClick={() => setClaimQueueOpen(o => !o)}>
                  <Inbox className="w-4 h-4 pn-navicon" />
                  <span className="truncate flex-1">Claim Queue</span>
                  {pendingClaims.length > 0 && <span className="pn-count">{pendingClaims.length}</span>}
                  <ChevronDown className={`w-3.5 h-3.5 pn-navicon transition-transform ${claimQueueOpen ? "rotate-180" : ""}`} />
                </div>

                <AnimatePresence>
                  {claimQueueOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {claimQueueSubItems.map(sub => {
                        const SubIcon = sub.icon;
                        const count = sub.section === "waiting" ? pendingClaims.length : 0;
                        return (
                          <SubRow key={sub.section} href="/panel/queue" active={location.startsWith("/panel/queue")}>
                            <SubIcon className="w-3.5 h-3.5 pn-navicon" />
                            <span className="truncate flex-1">{sub.label}</span>
                            {count > 0 && <span className="pn-count">{count}</span>}
                          </SubRow>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {showCollab && (
              <div>
                <GroupLabel label="Collaboration" icon={CollabIcon} />
                <div className={`pn-navitem mb-0.5 ${isCollabActive ? "is-active" : ""}`}
                  onClick={() => setCollabOpen(o => !o)}>
                  <CollabIcon className="w-4 h-4 pn-navicon" />
                  <span className="truncate flex-1">Collaboration</span>
                  <ChevronDown className={`w-3.5 h-3.5 pn-navicon transition-transform ${collabOpen ? "rotate-180" : ""}`} />
                </div>

                <AnimatePresence>
                  {collabOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {collabSubItems.map(sub => {
                        const SubIcon = sub.icon;
                        return (
                          <SubRow key={sub.href} href={sub.href} active={location === sub.href || location.startsWith(sub.href)}>
                            <SubIcon className="w-3.5 h-3.5 pn-navicon" />
                            <span className="truncate flex-1">{sub.label}</span>
                          </SubRow>
                        );
                      })}
                      <SubRow href="/admin/collaboration/payouts-all" active={location.startsWith("/admin/collaboration/payouts-all")}>
                        <DollarSign className="w-3.5 h-3.5 pn-navicon" />
                        <span className="truncate flex-1">Payouts</span>
                      </SubRow>
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
            {hasClaimAgent && (
              <Link href="/panel/queue">
                <div className={`pn-navitem mt-1 justify-center ${isQueueActive ? "is-active" : ""}`}>
                  <Inbox className="w-4 h-4 pn-navicon" />
                  {!collapsed && <span className="flex-1">Claim Queue</span>}
                  {!collapsed && pendingClaims.length > 0 && <span className="pn-count">{pendingClaims.length}</span>}
                </div>
              </Link>
            )}
          </div>
        )}
      </nav>

      <div className="flex-shrink-0 px-2 py-2" style={{ borderTop: "1px solid var(--pn-border)" }}>
        <Link href={profileHref}>
          <div className="pn-navitem" title={collapsed ? (profile?.displayName || user?.email) : undefined}>
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--pn-primary)" }}>
                <span className="text-white text-[10px] font-semibold">
                  {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--pn-text)" }}>
                  {profile?.displayName || user?.email?.split("@")[0]}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--pn-text-3)" }}>
                  {isStocker ? "Stocker" : isOwner ? "Owner" : user?.role?.name || "Team member"}
                </p>
              </div>
            )}
          </div>
        </Link>

        <button
          onClick={logout}
          className="pn-navitem w-full mt-0.5"
          style={{ color: "var(--pn-text-2)" }}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 pn-navicon" />
          {!collapsed && <span className="flex-1 text-left">Sign out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
