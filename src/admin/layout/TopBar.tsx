import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell, Menu, Wifi, WifiOff, Eye, ChevronDown, X, Search,
  LayoutDashboard, ShoppingCart, Package, Gamepad2, Ticket, Users, Inbox,
  BarChart3, Settings, MessageSquare, ShieldCheck, Boxes, Sparkles,
  Megaphone, Mail, Volume2, VolumeX, Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminSocket } from "../context/AdminSocketContext";
import { adminApi } from "../api";
import type { AdminRole } from "../types";
import { areSoundsEnabled, setSoundsEnabled, primeAudio } from "../lib/sounds";

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
}

/** Quick-jump destinations for the ⌘K search field. */
const SEARCH_INDEX: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  { label: "Dashboard",        href: "/admin/dashboard",              icon: LayoutDashboard, group: "Overview" },
  { label: "Analytics",        href: "/admin/analytics",              icon: BarChart3,       group: "Overview" },
  { label: "Orders",           href: "/admin/orders",                 icon: ShoppingCart,    group: "Commerce" },
  { label: "Customers",        href: "/admin/customers",              icon: Users,           group: "Commerce" },
  { label: "Products",         href: "/admin/products",               icon: Package,         group: "Commerce" },
  { label: "Games & Categories", href: "/admin/games",                icon: Gamepad2,        group: "Commerce" },
  { label: "Promo Codes",      href: "/admin/promos",                 icon: Ticket,          group: "Commerce" },
  { label: "Claim Queue",      href: "/panel/queue",                  icon: Inbox,           group: "Operations" },
  { label: "Agent Monitor",    href: "/admin/monitor",                icon: ShieldCheck,     group: "Operations" },
  { label: "Proof of Delivery", href: "/admin/proof-of-delivery",     icon: ShieldCheck,     group: "Operations" },
  { label: "Open Chats",       href: "/admin/open-chats",             icon: MessageSquare,   group: "Operations" },
  { label: "Support Tickets",  href: "/admin/tickets",                icon: MessageSquare,   group: "Operations" },
  { label: "Stock Requests",   href: "/admin/stock/requests",         icon: Boxes,           group: "Operations" },
  { label: "Stocker Tracking", href: "/admin/stock/tracking",         icon: Boxes,           group: "Operations" },
  { label: "Team",             href: "/admin/team",                   icon: Users,           group: "People" },
  { label: "Roles",            href: "/admin/roles",                  icon: ShieldCheck,     group: "People" },
  { label: "Claim Teams",      href: "/admin/claim-teams",            icon: Users,           group: "People" },
  { label: "Collaborators",    href: "/admin/collaboration/collaborators", icon: Users,       group: "People" },
  { label: "All Payouts",      href: "/admin/collaboration/payouts-all",   icon: BarChart3,   group: "People" },
  { label: "Site Content",     href: "/admin/site-content",           icon: Sparkles,        group: "Storefront" },
  { label: "Site Modes",       href: "/admin/site-modes",             icon: Sparkles,        group: "Storefront" },
  { label: "Tutorials",        href: "/admin/tutorials",              icon: Sparkles,        group: "Storefront" },
  { label: "Announcements",    href: "/admin/announcements",          icon: Megaphone,       group: "Storefront" },
  { label: "Email Broadcast",  href: "/admin/announcements",          icon: Mail,            group: "Storefront" },
  { label: "Settings",         href: "/admin/settings",               icon: Settings,        group: "Storefront" },
  { label: "My Profile",       href: "/admin/profile",                icon: Settings,        group: "Storefront" },
];

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const { profile, user, viewAsRole, setViewAsRole, isOwner, hasPermission } = useAdminAuth();
  const { connected, newOrders, unreadOrders, markOrdersRead } = useAdminSocket();
  const [bellOpen, setBellOpen] = useState(false);
  const [soundsOn, setSoundsOn] = useState(areSoundsEnabled());
  const [, navigate] = useLocation();
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const canSee = (href: string) => {
    if (user?.isOwner || !user) return true;
    if (href.startsWith("/panel")) return true;
    // Non-owners only see admin destinations they hold a permission for.
    // Routed through hasPermission so the legacy->canonical mapping matches the Sidebar.
    const allowed: Record<string, string> = {
      "/admin/dashboard": "view_analytics", "/admin/analytics": "view_analytics",
      "/admin/orders": "view_orders", "/admin/products": "view_products",
      "/admin/promos": "manage_promos", "/admin/games": "view_games",
      "/admin/site-content": "edit_site_content", "/admin/tutorials": "edit_site_content",
      "/admin/roles": "manage_roles", "/admin/team": "view_team",
      "/admin/claim-teams": "manage_team", "/admin/monitor": "monitor_agents",
      "/admin/open-chats": "monitor_agents", "/admin/proof-of-delivery": "view_pod",
      "/admin/stock/requests": "view_stock", "/admin/stock/tracking": "view_stock",
      "/admin/tickets": "view_tickets",
      "/admin/collaboration/collaborators": "manage_collaborators",
      "/admin/collaboration/payouts-all": "manage_collaborators",
      "/admin/settings": "view_settings", "/admin/customers": "view_customers",
      "/admin/site-modes": "view_site_modes", "/admin/announcements": "view_announcements",
      "/admin/role-view": "manage_roles",
    };
    const need = allowed[href];
    if (!need) return false;
    if (need === "__owner__") return false;
    return hasPermission(need);
  };

  const results = useMemo(() => {
    const pool = SEARCH_INDEX.filter(i => canSee(i.href));
    const q = query.trim().toLowerCase();
    if (!q) return pool.slice(0, 8);
    return pool.filter(i => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, user]);

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
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ⌘K / Ctrl-K focuses the search field, like Shopify's admin.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => document.getElementById("pn-search")?.focus());
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
      className="h-14 flex items-center gap-3 px-4 sm:px-6 flex-shrink-0 z-20"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid var(--pn-border)",
      }}
    >
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="lg:hidden -ml-1 p-1.5 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: "var(--pn-text-2)" }}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Page title */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <h1 className="font-semibold text-[15px] sm:text-base truncate" style={{ color: "var(--pn-text)" }}>
          {title}
        </h1>
      </div>

      {/* Quick search — Shopify-style global search */}
      <div ref={searchRef} className="relative hidden md:block w-full max-w-[420px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--pn-text-3)" }} />
        <input
          id="pn-search"
          value={query}
          onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={e => {
            if (e.key === "Enter" && results[0]) { navigate(results[0].href); setSearchOpen(false); setQuery(""); }
          }}
          placeholder="Search"
          className="w-full h-9 pl-9 pr-14 text-sm rounded-lg transition-shadow"
          style={{
            background: "#f6f6f7",
            border: "1px solid var(--pn-border)",
            color: "var(--pn-text)",
          }}
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-sans px-1.5 py-0.5 rounded"
          style={{ background: "#ffffff", border: "1px solid var(--pn-border)", color: "var(--pn-text-3)" }}>
          ⌘K
        </kbd>

        <AnimatePresence>
          {searchOpen && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50 py-1"
              style={{ background: "#ffffff", border: "1px solid var(--pn-border)", boxShadow: "var(--pn-shadow-pop)" }}
            >
              {results.map(r => (
                <button
                  key={r.href}
                  onMouseDown={() => { navigate(r.href); setSearchOpen(false); setQuery(""); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-black/[0.04]"
                  style={{ color: "var(--pn-text)" }}
                >
                  <r.icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--pn-text-3)" }} />
                  <span className="flex-1 truncate">{r.label}</span>
                  <span className="text-[11px]" style={{ color: "var(--pn-text-3)" }}>{r.group}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        {viewAsRole && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-semibold"
            style={{ background: "var(--pn-warning-bg)", color: "var(--pn-warning-fg)", border: "1px solid var(--pn-warning-line)" }}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Viewing as: {viewAsRole.name}</span>
            <span className="sm:hidden">{viewAsRole.name}</span>
            <button onClick={() => setViewAsRole(null)} className="ml-0.5 hover:opacity-70 transition-opacity" aria-label="Exit role view">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        {isOwner && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={openViewDropdown}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors hover:bg-black/[0.05]"
              style={{
                background: "#ffffff",
                border: "1px solid var(--pn-border)",
                color: "var(--pn-text-2)",
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View as</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${viewDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {viewDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full mt-2 w-60 rounded-xl overflow-hidden z-50 py-1"
                  style={{ background: "#ffffff", border: "1px solid var(--pn-border)", boxShadow: "var(--pn-shadow-pop)" }}
                >
                  <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                    <p className="text-[11px] font-semibold" style={{ color: "var(--pn-text-3)" }}>
                      Switch role view
                    </p>
                  </div>
                  <button
                    onClick={() => { setViewAsRole(null); setViewDropdownOpen(false); navigate("/admin/dashboard"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-black/[0.04]"
                    style={{ color: !viewAsRole ? "var(--pn-action)" : "var(--pn-text)", background: !viewAsRole ? "var(--pn-action-tint)" : "transparent" }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--pn-text)" }} />
                    Owner (full access)
                    {!viewAsRole && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>Active</span>
                    )}
                  </button>

                  {rolesLoading ? (
                    <div className="px-3 py-4 text-center text-xs" style={{ color: "var(--pn-text-3)" }}>Loading…</div>
                  ) : roles.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-center" style={{ color: "var(--pn-text-3)" }}>No roles found</div>
                  ) : roles.map(role => (
                    <button
                      key={role._id}
                      onClick={() => {
                        const perms = role.permissions || [];
                        setViewAsRole({ id: role._id, name: role.name, color: role.color || "#6366f1", permissions: perms });
                        setViewDropdownOpen(false);
                        navigate(getNavTargetForRole(perms));
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-black/[0.04]"
                      style={{
                        color: viewAsRole?.id === role._id ? "var(--pn-action)" : "var(--pn-text)",
                        background: viewAsRole?.id === role._id ? "var(--pn-action-tint)" : "transparent",
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: role.color || "#6366f1" }} />
                      <span className="flex-1 truncate">{role.name}</span>
                      {viewAsRole?.id === role._id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>Active</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium"
          style={{
            background: connected ? "var(--pn-success-bg)" : "var(--pn-critical-bg)",
            color: connected ? "var(--pn-success-fg)" : "var(--pn-critical-fg)",
          }}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{connected ? "Live" : "Offline"}</span>
        </div>

        {/* Order alerts + sound toggle — visible on every panel page */}
        <div className="relative">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const next = !soundsOn;
                setSoundsOn(next);
                setSoundsEnabled(next);
              }}
              onPointerDown={primeAudio}
              className="hidden sm:grid place-items-center w-9 h-9 rounded-lg transition-colors"
              style={{
                background: soundsOn ? "transparent" : "var(--pn-surface-2)",
                color: soundsOn ? "var(--pn-text-2)" : "var(--pn-text-3)",
              }}
              aria-label={soundsOn ? "Mute notification sounds" : "Unmute notification sounds"}
              title={soundsOn ? "Sounds on" : "Sounds muted"}
            >
              {soundsOn ? <Volume2 className="w-[17px] h-[17px]" /> : <VolumeX className="w-[17px] h-[17px]" />}
            </button>

            <button
              onClick={() => { setBellOpen((v) => !v); markOrdersRead(); }}
              className="relative hidden sm:grid place-items-center w-9 h-9 rounded-lg transition-colors hover:bg-black/[0.05]"
              style={{ color: "var(--pn-text-2)" }}
              aria-label={`Notifications${unreadOrders ? ` (${unreadOrders} new)` : ""}`}
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadOrders > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "var(--pn-critical)", color: "#fff" }}
                >
                  {unreadOrders > 9 ? "9+" : unreadOrders}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-11 z-50 rounded-xl overflow-hidden"
                style={{
                  width: 320,
                  background: "var(--pn-surface)",
                  border: "1px solid var(--pn-border)",
                  boxShadow: "var(--pn-shadow-pop)",
                }}
              >
                <div
                  className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ borderBottom: "1px solid var(--pn-border)", color: "var(--pn-text-3)" }}
                >
                  New orders
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {newOrders.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs" style={{ color: "var(--pn-text-3)" }}>
                      No new orders yet. You&apos;ll hear a chime when one lands.
                    </p>
                  ) : (
                    newOrders.map((o) => (
                      <Link key={o.orderId} href={`/admin/orders/${o.orderId}`}>
                        <div
                          className="flex items-start gap-2.5 px-3 py-2.5 transition-colors"
                          style={{ borderBottom: "1px solid var(--pn-divider)" }}
                        >
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "var(--pn-success-bg)" }}
                          >
                            <Receipt className="w-3.5 h-3.5" style={{ color: "var(--pn-success-fg)" }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold" style={{ color: "var(--pn-text)" }}>
                              {o.robloxUsername || o.customerEmail || "New order"}
                            </p>
                            <p className="text-[11px]" style={{ color: "var(--pn-text-3)" }}>
                              {o.orderNumber} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--pn-success-fg)" }}>
                            ${Number(o.total || 0).toFixed(2)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-[12px] hidden xl:block font-medium" style={{ color: "var(--pn-text-3)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>

        <Link href={user?.isOwner ? "/admin/profile" : "/panel/profile"}>
          <div className="flex items-center gap-2 cursor-pointer pl-2 sm:pl-3 ml-0.5 transition-opacity hover:opacity-80"
            style={{ borderLeft: "1px solid var(--pn-border)" }}>
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} className="w-8 h-8 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--pn-primary)" }}>
                <span className="text-white text-xs font-semibold">
                  {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block leading-tight max-w-[140px]">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--pn-text)" }}>
                {profile?.displayName || user?.email?.split("@")[0]}
              </p>
              <p className="text-[10px]" style={{ color: "var(--pn-text-3)" }}>
                {user?.isOwner ? "Owner" : user?.role?.name}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
