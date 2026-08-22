import { useState, useEffect } from "react";
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
  "/admin/claim-time": "Claim Time",
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
  "/admin/stock/requests": "Stock Requests",
  "/admin/stock/tracking": "Stocker Tracking",
  "/stocker/dashboard": "Dashboard",
  "/stocker/request": "New Stock Request",
  "/stocker/history": "My Requests",
};

const OWNER_ONLY_ROUTES = ["/admin/settings", "/admin/customers", "/admin/role-view", "/admin/collaboration"];

const ROUTE_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: "/admin/dashboard",        permission: "view_analytics" },
  { prefix: "/admin/analytics",        permission: "view_analytics" },
  { prefix: "/admin/orders",           permission: "view_orders" },
  { prefix: "/admin/products",         permission: "view_products" },
  { prefix: "/admin/promos",           permission: "manage_promos" },
  { prefix: "/admin/games",            permission: "view_games" },
  { prefix: "/admin/site-content",     permission: "edit_site_content" },
  { prefix: "/admin/tutorials",        permission: "edit_site_content" },
  { prefix: "/admin/roles",            permission: "manage_roles" },
  { prefix: "/admin/team",             permission: "view_team" },
  { prefix: "/admin/claim-teams",      permission: "manage_team" },
  { prefix: "/admin/monitor",          permission: "monitor_agents" },
  { prefix: "/admin/open-chats",       permission: "monitor_agents" },
  { prefix: "/admin/proof-of-delivery", permission: "view_pod" },
  { prefix: "/admin/stock",            permission: "view_stock" },
  { prefix: "/admin/socials",          permission: "view_socials" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, profileComplete, hasPermission, viewAsRole } = useAdminAuth();
  const { claimPopup, dismissClaimPopup } = useAdminSocket();
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isAdminRoute = location.startsWith("/admin");
  const isAgentRoute = location.startsWith("/panel");
  const isStockerRoute = location.startsWith("/stocker");

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/admin/login"); return; }

    if (!profileComplete && location !== "/admin/profile-setup" && location !== "/panel/profile-setup") {
      navigate(user.isOwner ? "/admin/profile-setup" : "/panel/profile-setup");
      return;
    }

    if (user.type === "stocker") {
      if (isAdminRoute || isAgentRoute) {
        navigate("/stocker/dashboard");
        return;
      }
      return;
    }

    if (user.isOwner && isAgentRoute && !viewAsRole) { navigate("/admin/dashboard"); return; }
    if (user.isOwner && isStockerRoute && !viewAsRole) { navigate("/admin/dashboard"); return; }

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
  }, [user, loading, profileComplete, location, viewAsRole]);

  const title = PAGE_TITLES[location] || location.split("/").pop()?.replace(/-/g, " ")?.replace(/\b\w/g, (c) => c.toUpperCase()) || "Panel";

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="dark flex h-screen overflow-hidden relative" style={{ background: "#121212" }}>

      <div className="hidden lg:flex relative z-10 flex-shrink-0">
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
