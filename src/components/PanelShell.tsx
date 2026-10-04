import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, LogOut } from "lucide-react";
// Importing here (not in AdminLayout) so EVERY panel — deliverer, stocker,
// collab, socials — gets the Shopify token set + pn-* component styles.
// Without this the pn-card / pn-btn / pn-badge classes on those pages have no
// rules at all, which is what made the deliverer panel look broken.
import "@/admin/panel.css";

export interface PanelNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Exact-path match (default) vs prefix match for nested routes. */
  matchPrefix?: boolean;
}

export interface PanelShellProps {
  /** Small muted label beside the logo in the rail, e.g. "Delivery portal". */
  eyebrow: string;
  navItems: PanelNavItem[];
  user?: { name?: string; email?: string; role?: string } | null;
  onLogout: () => void;
  children: React.ReactNode;
}

function Rail({
  eyebrow, navItems, location, user, onLogout, onNavigate,
}: {
  eyebrow: string;
  navItems: PanelNavItem[];
  location: string;
  user?: PanelShellProps["user"];
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const isActive = (item: PanelNavItem) =>
    item.matchPrefix ? location.startsWith(item.href) : location === item.href;

  const name = user?.name || user?.email || "";
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  return (
    <div
      className="pn-rail relative flex flex-col h-full overflow-hidden flex-shrink-0"
      style={{ width: 244 }}
    >
      {/* Rail header — mirrors Sidebar.tsx exactly */}
      <div
        className="flex items-center px-3.5 h-14 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--pn-border)" }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/rb-logo.png" alt="RBstars" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="pn-navlabel truncate">{eyebrow}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <p className="pn-navlabel px-2.5 pb-1.5 pt-1">Menu</p>
        {navItems.map(item => {
          const active = isActive(item);
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <div className={`pn-navitem mb-0.5 ${active ? "is-active" : ""}`}>
                <item.icon className="w-4 h-4 pn-navicon" />
                <span className="truncate flex-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Account + sign out */}
      <div className="p-2 flex-shrink-0" style={{ borderTop: "1px solid var(--pn-border)" }}>
        {user && (
          <div className="pn-navitem" style={{ cursor: "default" }}>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--pn-primary)" }}
            >
              <span className="text-[10px] font-bold" style={{ color: "#fff" }}>{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--pn-text)" }}>
                {name}
              </p>
              {user.role && (
                <p className="truncate" style={{ fontSize: 11, color: "var(--pn-text-3)" }}>
                  {user.role}
                </p>
              )}
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="pn-navitem w-full mt-0.5"
          style={{ color: "var(--pn-text-2)" }}
        >
          <LogOut className="w-4 h-4 pn-navicon" />
          <span className="flex-1 text-left">Sign out</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Shared Shopify-style chrome for the non-admin panels (deliverer, stocker,
 * collab, socials). Same structure, classes and breakpoints as AdminLayout:
 * 244px rail on lg+, sliding rail below, h-14 white top bar, scrollable main.
 */
export default function PanelShell({
  eyebrow, navItems, user, onLogout, children,
}: PanelShellProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = navItems.find(i =>
    i.matchPrefix ? location.startsWith(i.href) : location === i.href
  );
  const title = current?.label || "Dashboard";
  const name = user?.name || user?.email || "";
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  return (
    <div className="pn-shell flex h-screen overflow-hidden relative">
      {/* Desktop rail */}
      <div className="hidden lg:flex relative z-10">
        <Rail
          eyebrow={eyebrow} navItems={navItems} location={location}
          user={user} onLogout={onLogout}
        />
      </div>

      {/* Mobile rail */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <Rail
                eyebrow={eyebrow} navItems={navItems} location={location}
                user={user} onLogout={onLogout}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-10">
        {/* Top bar — mirrors TopBar.tsx */}
        <header
          className="h-14 flex items-center gap-3 px-4 sm:px-6 flex-shrink-0 z-20"
          style={{ background: "#ffffff", borderBottom: "1px solid var(--pn-border)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden -ml-1 p-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: "var(--pn-text-2)" }}
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1
            className="font-semibold text-[15px] sm:text-base truncate"
            style={{ color: "var(--pn-text)" }}
          >
            {title}
          </h1>

          <div className="ml-auto flex items-center gap-2.5">
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full"
                style={{ border: "1px solid var(--pn-border)", background: "var(--pn-surface-2)" }}>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--pn-primary)" }}
                >
                  <span className="text-[10px] font-bold" style={{ color: "#fff" }}>{initial}</span>
                </div>
                <span
                  className="text-xs font-semibold truncate max-w-[160px]"
                  style={{ color: "var(--pn-text)" }}
                >
                  {name}
                </span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--pn-text-2)", border: "1px solid var(--pn-border)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--pn-surface-2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
