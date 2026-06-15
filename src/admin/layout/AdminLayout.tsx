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
  "/admin/profile": "My Profile",
  "/panel/dashboard": "Agent Dashboard",
  "/panel/queue": "Claim Queue",
  "/panel/stats": "My Statistics",
  "/panel/profile": "My Profile",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, profileComplete } = useAdminAuth();
  const { claimPopup, answerClaim, declineClaim } = useAdminSocket();
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isAdminRoute = location.startsWith("/admin");
  const isAgentRoute = location.startsWith("/panel");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/admin/login");
      return;
    }
    if (!profileComplete && location !== "/admin/profile-setup" && location !== "/panel/profile-setup") {
      navigate(user.isOwner ? "/admin/profile-setup" : "/panel/profile-setup");
      return;
    }
    if (user.isOwner && isAgentRoute) {
      navigate("/admin/dashboard");
    }
    if (!user.isOwner && isAdminRoute && location !== "/admin/profile-setup") {
      navigate("/panel/dashboard");
    }
  }, [user, loading, profileComplete, location]);

  const title = PAGE_TITLES[location] || location.split("/").pop()?.replace(/-/g, " ")?.replace(/\b\w/g, (c) => c.toUpperCase()) || "Panel";

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#060d1a] overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
      </div>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
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
        {claimPopup && (
          <ClaimQueuePopup
            popup={claimPopup}
            ownerMode={!!claimPopup.isOwnerAlert}
            onAnswer={() => {
              if (claimPopup.isOwnerAlert) {
                navigate("/admin/monitor");
                declineClaim(claimPopup.roomId);
              } else {
                answerClaim(claimPopup.roomId);
                navigate("/panel/queue");
              }
            }}
            onDecline={() => declineClaim(claimPopup.roomId)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
