import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminSocket } from "../context/AdminSocketContext";
import ClaimQueuePopup from "../components/ClaimQueuePopup";
import LoadingScreen from "../components/LoadingScreen";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/products": "Products",
  "/admin/games": "Games & Categories",
  "/admin/site-content": "Site Content",
  "/admin/promos": "Promo Codes",
  "/admin/roles": "Roles",
  "/admin/team": "Team",
  "/admin/claim-teams": "Claim Teams",
  "/admin/monitor": "Agent Monitor",
  "/admin/role-view": "Role View",
  "/admin/proof-of-delivery": "Proof of Delivery",
  "/admin/open-chats": "Open Chats",
  "/admin/settings": "Settings",
  "/admin/analytics": "Analytics",
  "/admin/customers": "Customers",
  "/admin/tutorials": "Tutorials",
  "/admin/profile": "My Profile",
  "/panel/dashboard": "Dashboard",
  "/panel/queue": "Claim Queue",
  "/panel/stats": "My Statistics",
  "/panel/profile": "My Profile",
  "/admin/collaboration/collaborators": "Collaborators",
  "/admin/collaboration/payouts-all": "All Payouts",
};

const OWNER_ONLY_ROUTES = ["/admin/settings", "/admin/customers", "/admin/role-view", "/admin/collaboration"];

const ROUTE_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: "/admin/dashboard",        permission: "view_analytics" },
  { prefix: "/admin/analytics",        permission: "view_analytics" },
  { prefix: "/admin/orders",           permission: "manage_orders" },
  { prefix: "/admin/products",         permission: "manage_products" },
  { prefix: "/admin/promos",           permission: "manage_promos" },
  { prefix: "/admin/games",            permission: "manage_games" },
  { prefix: "/admin/site-content",     permission: "edit_site_content" },
  { prefix: "/admin/tutorials",        permission: "edit_site_content" },
  { prefix: "/admin/roles",            permission: "manage_roles" },
  { prefix: "/admin/team",             permission: "manage_team" },
  { prefix: "/admin/claim-teams",      permission: "manage_team" },
  { prefix: "/admin/monitor",          permission: "monitor_agents" },
  { prefix: "/admin/open-chats",       permission: "monitor_agents" },
  { prefix: "/admin/proof-of-delivery", permission: "view_pod" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, profileComplete, hasPermission } = useAdminAuth();
  const { claimPopup, dismissClaimPopup } = useAdminSocket();
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isAdminRoute = location.startsWith("/admin");
  const isAgentRoute = location.startsWith("/panel");

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/admin/login"); return; }
    if (!profileComplete && location !== "/admin/profile-setup" && location !== "/panel/profile-setup") {
      navigate(user.isOwner ? "/admin/profile-setup" : "/panel/profile-setup");
      return;
    }
    if (user.isOwner && isAgentRoute) { navigate("/admin/dashboard"); return; }

    if (!user.isOwner && isAdminRoute && location !== "/admin/profile-setup") {
      if (OWNER_ONLY_ROUTES.some(r => location.startsWith(r))) {
        navigate("/panel/dashboard");
        return;
      }
      const routeRule = ROUTE_PERMISSIONS.find(r => location.startsWith(r.prefix));
      if (routeRule && !hasPermission(routeRule.permission)) {
        navigate("/panel/dashboard");
        return;
      }
    }
  }, [user, loading, profileComplete, location]);

  const title = PAGE_TITLES[location] || location.split("/").pop()?.replace(/-/g, " ")?.replace(/\b\w/g, (c) => c.toUpperCase()) || "Panel";

  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: 5 + (i * 4.7 + (i % 3) * 9.1) % 90,
      top:  3 + (i * 7.3 + (i % 5) * 11.7) % 94,
      size: 2 + (i % 4) * 1.2,
      dur:  7 + (i % 6) * 1.6,
      delay: -(i * 0.65),
      op: 0.06 + (i % 5) * 0.03,
    })), []
  );

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #060a1a 0%, #0c1445 45%, #060a1a 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="rb-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `rgba(139,92,246,${p.op})`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              ["--p-op" as string]: p.op,
            }}
          />
        ))}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="hidden lg:flex relative z-10">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      </div>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-10">
        <TopBar title={title} onMenuClick={() => setMobileSidebarOpen(true)} />
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

      <AnimatePresence>
        {claimPopup && user.isOwner && (
          <ClaimQueuePopup
            popup={claimPopup}
            ownerMode={true}
            onAnswer={() => {
              navigate("/admin/monitor");
              dismissClaimPopup();
            }}
            onDecline={() => dismissClaimPopup()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
