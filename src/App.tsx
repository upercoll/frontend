import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportChat from "@/components/SupportChat";
import AuthModal from "@/components/AuthModal";
import WelcomeModal from "@/components/WelcomeModal";
import Home from "@/pages/Home";
import GamePage from "@/pages/GamePage";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import NotFound from "@/pages/not-found";
import CollabInviteAccept from "@/pages/CollabInviteAccept";
import CollabLogin from "@/pages/CollabLogin";
import CollabDashboard from "@/pages/CollabDashboard";
import SocialsLogin from "@/pages/SocialsLogin";
import SocialsInviteAccept from "@/pages/SocialsInviteAccept";
import SocialsDashboard from "@/pages/SocialsDashboard";
import StockerLogin from "@/pages/StockerLogin";
import StockerLayout from "@/pages/StockerLayout";

import DelivererLogin from "@/pages/DelivererLogin";
import DelivererInviteAccept from "@/pages/DelivererInviteAccept";
import DelivererLayout from "@/pages/DelivererLayout";
import DelivererDashboard from "@/admin/pages/deliverer/DelivererDashboard";
import DelivererQueue from "@/admin/pages/deliverer/DelivererQueue";
import DelivererHistory from "@/admin/pages/deliverer/DelivererHistory";

import { AdminAuthProvider } from "@/admin/context/AdminAuthContext";
import { AdminSocketProvider } from "@/admin/context/AdminSocketContext";
import AdminLayout from "@/admin/layout/AdminLayout";

import AdminLogin from "@/admin/pages/Login";
import InviteAccept from "@/admin/pages/InviteAccept";
import AdminProfileSetup from "@/admin/pages/ProfileSetup";
import Dashboard from "@/admin/pages/Dashboard";
import Orders from "@/admin/pages/Orders";
import Products from "@/admin/pages/Products";
import Games from "@/admin/pages/Games";
import Roles from "@/admin/pages/Roles";
import Team from "@/admin/pages/Team";
import ClaimTeams from "@/admin/pages/ClaimTeams";
import Monitor from "@/admin/pages/Monitor";
import SiteContent from "@/admin/pages/SiteContent";
import ProofOfDelivery from "@/admin/pages/ProofOfDelivery";
import AdminProfilePage from "@/admin/pages/Profile";

import DeliveryTeam from "@/admin/pages/delivery/DeliveryTeam";
import DeliveryMemberDetail from "@/admin/pages/delivery/DeliveryMemberDetail";

import Promos from "@/admin/pages/Promos";
import Settings from "@/admin/pages/Settings";
import RoleView from "@/admin/pages/RoleView";
import OpenChats from "@/admin/pages/OpenChats";

import Analytics from "@/admin/pages/Analytics";
import ClaimTime from "@/admin/pages/ClaimTime";
import Customers from "@/admin/pages/Customers";
import Tutorials from "@/admin/pages/Tutorials";
import OrderDetail from "@/admin/pages/OrderDetail";
import CollabCollaborators from "@/admin/pages/CollabCollaborators";
import CollabView from "@/admin/pages/CollabView";
import CollabPayouts from "@/admin/pages/CollabPayouts";
import CollabPayoutDetail from "@/admin/pages/CollabPayoutDetail";
import CollabPayoutsAll from "@/admin/pages/CollabPayoutsAll";

import AgentDashboard from "@/admin/pages/agent/AgentDashboard";
import Queue from "@/admin/pages/agent/Queue";
import AgentStats from "@/admin/pages/agent/AgentStats";

import StockRequests from "@/admin/pages/stock/StockRequests";
import StockTracking from "@/admin/pages/stock/StockTracking";

import SocialsAdmin from "@/admin/pages/SocialsAdmin";
import SocialsCreators from "@/admin/pages/SocialsCreator";
import SocialsTrackerDetail from "@/admin/pages/SocialsTrackerDetail";

import StockerDashboard from "@/admin/pages/stocker/StockerDashboard";
import StockerRequestForm from "@/admin/pages/stocker/StockerRequestForm";
import StockerHistory from "@/admin/pages/stocker/StockerHistory";
import StockerInviteAccept from "@/admin/pages/stocker/StockerInviteAccept";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function isAdminRoute(location: string) {
  return (
    location.startsWith("/admin") ||
    location.startsWith("/panel") ||
    location.startsWith("/invite/")
  );
}

function isCollabRoute(location: string) {
  return location.startsWith("/collab");
}

function isSocialsRoute(location: string) {
  return location.startsWith("/socials");
}

function isStockerRoute(location: string) {
  return location.startsWith("/stocker");
}

function isDelivererRoute(location: string) {
  return location.startsWith("/deliverer");
}

function DiscordFloat() {
  return (
    <a
      href="https://discord.gg/XZKj4FzHCm"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join our Discord"
      style={{
        position: "fixed",
        bottom: "88px",
        right: "16px",
        zIndex: 9999,
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        background: "#5865F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 20px rgba(88,101,242,0.5)",
        textDecoration: "none",
        transition: "transform 0.18s, box-shadow 0.18s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.1)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 28px rgba(88,101,242,0.7)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(88,101,242,0.5)";
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.034.056a19.94 19.94 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    </a>
  );
}

function StorefrontRouter() {
  const [location] = useLocation();
  const isGamePage = location.startsWith("/game/");
  const isCheckout = location === "/checkout";
  const isSuccess = location === "/order-success";

  return (
    <>
      {!isCheckout && !isSuccess && <Navbar dark={isGamePage} />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/game/:slug" component={GamePage} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-success" component={PaymentSuccess} />
        <Route component={NotFound} />
      </Switch>
      {!isGamePage && !isCheckout && !isSuccess && <Footer />}
      <SupportChat />
      <CartDrawer />
      <AuthModal />
      <WelcomeModal />
      <DiscordFloat />
    </>
  );
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/invite/:token" component={InviteAccept} />
      <Route path="/admin/invite/:token" component={InviteAccept} />
      <Route path="/admin/profile-setup" component={AdminProfileSetup} />
      <Route path="/panel/profile-setup" component={AdminProfileSetup} />

      <Route path="/admin/dashboard">
        <AdminLayout><Dashboard /></AdminLayout>
      </Route>
      <Route path="/admin/orders/:id">
        <AdminLayout><OrderDetail /></AdminLayout>
      </Route>
      <Route path="/admin/orders">
        <AdminLayout><Orders /></AdminLayout>
      </Route>
      <Route path="/admin/analytics">
        <AdminLayout><Analytics /></AdminLayout>
      </Route>
      <Route path="/admin/customers">
        <AdminLayout><Customers /></AdminLayout>
      </Route>
      <Route path="/admin/tutorials">
        <AdminLayout><Tutorials /></AdminLayout>
      </Route>
      <Route path="/admin/products">
        <AdminLayout><Products /></AdminLayout>
      </Route>
      <Route path="/admin/games">
        <AdminLayout><Games /></AdminLayout>
      </Route>
      <Route path="/admin/claim-time">
        <AdminLayout><ClaimTime /></AdminLayout>
      </Route>
      <Route path="/admin/roles">
        <AdminLayout><Roles /></AdminLayout>
      </Route>
      <Route path="/admin/team">
        <AdminLayout><Team /></AdminLayout>
      </Route>
      <Route path="/admin/claim-teams">
        <AdminLayout><ClaimTeams /></AdminLayout>
      </Route>
      <Route path="/admin/monitor">
        <AdminLayout><Monitor /></AdminLayout>
      </Route>
      <Route path="/admin/open-chats">
        <AdminLayout><OpenChats /></AdminLayout>
      </Route>
      <Route path="/admin/site-content">
        <AdminLayout><SiteContent /></AdminLayout>
      </Route>
      <Route path="/admin/proof-of-delivery">
        <AdminLayout><ProofOfDelivery /></AdminLayout>
      </Route>
      <Route path="/admin/delivery-team/:id">
        <AdminLayout><DeliveryMemberDetail /></AdminLayout>
      </Route>
      <Route path="/admin/delivery-team">
        <AdminLayout><DeliveryTeam /></AdminLayout>
      </Route>
      <Route path="/admin/promos">
        <AdminLayout><Promos /></AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout><Settings /></AdminLayout>
      </Route>
      <Route path="/admin/role-view">
        <AdminLayout><RoleView /></AdminLayout>
      </Route>
      <Route path="/admin/profile">
        <AdminLayout><AdminProfilePage /></AdminLayout>
      </Route>
      <Route path="/admin/stock/requests">
        <AdminLayout><StockRequests /></AdminLayout>
      </Route>
      <Route path="/admin/stock/tracking">
        <AdminLayout><StockTracking /></AdminLayout>
      </Route>
      <Route path="/panel/dashboard">
        <AdminLayout><AgentDashboard /></AdminLayout>
      </Route>
      <Route path="/panel/queue">
        <AdminLayout><Queue /></AdminLayout>
      </Route>
      <Route path="/panel/stats">
        <AdminLayout><AgentStats /></AdminLayout>
      </Route>
      <Route path="/panel/profile">
        <AdminLayout><AdminProfilePage /></AdminLayout>
      </Route>
      <Route path="/admin/collaboration/collaborators">
        <AdminLayout><CollabCollaborators /></AdminLayout>
      </Route>
      <Route path="/admin/collaboration/view/:id">
        <AdminLayout><CollabView /></AdminLayout>
      </Route>
      <Route path="/admin/collaboration/payouts-all">
        <AdminLayout><CollabPayoutsAll /></AdminLayout>
      </Route>
      <Route path="/admin/collaboration/payouts/:id/detail/:payoutId">
        <AdminLayout><CollabPayoutDetail /></AdminLayout>
      </Route>
      <Route path="/admin/collaboration/payouts/:id">
        <AdminLayout><CollabPayouts /></AdminLayout>
      </Route>
      <Route path="/admin/socials/creators/:id">
        <AdminLayout><SocialsTrackerDetail /></AdminLayout>
      </Route>
      <Route path="/admin/socials/creators">
        <AdminLayout><SocialsCreators /></AdminLayout>
      </Route>
      <Route path="/admin/socials">
        <AdminLayout><SocialsAdmin /></AdminLayout>
      </Route>
      <Route path="/admin">
        {() => { window.location.replace("/admin/login"); return null; }}
      </Route>
      <Route path="/panel">
        {() => { window.location.replace("/panel/dashboard"); return null; }}
      </Route>
    </Switch>
  );
}

function CollabRouter() {
  return (
    <Switch>
      <Route path="/collab/invite/:token" component={CollabInviteAccept} />
      <Route path="/collab/login" component={CollabLogin} />
      <Route path="/collab/dashboard" component={CollabDashboard} />
      <Route path="/collab">{() => { window.location.replace("/collab/login"); return null; }}</Route>
    </Switch>
  );
}

function SocialsRouter() {
  return (
    <Switch>
      <Route path="/socials/invite/:token" component={SocialsInviteAccept} />
      <Route path="/socials/login" component={SocialsLogin} />
      <Route path="/socials/dashboard" component={SocialsDashboard} />
      <Route path="/socials">{() => { window.location.replace("/socials/login"); return null; }}</Route>
    </Switch>
  );
}

function StockerRouter() {
  return (
    <Switch>
      <Route path="/stocker/login" component={StockerLogin} />
      <Route path="/stocker/invite/:token" component={StockerInviteAccept} />
      <Route path="/stocker/dashboard">
        <StockerLayout><StockerDashboard /></StockerLayout>
      </Route>
      <Route path="/stocker/request">
        <StockerLayout><StockerRequestForm /></StockerLayout>
      </Route>
      <Route path="/stocker/history">
        <StockerLayout><StockerHistory /></StockerLayout>
      </Route>
      <Route path="/stocker/payouts">
        <StockerLayout><StockerDashboard /></StockerLayout>
      </Route>
      <Route path="/stocker">
        {() => { window.location.replace("/stocker/login"); return null; }}
      </Route>
    </Switch>
  );
}

function DelivererRouter() {
  return (
    <Switch>
      <Route path="/deliverer/login" component={DelivererLogin} />
      <Route path="/deliverer/invite/:token" component={DelivererInviteAccept} />
      <Route path="/deliverer/dashboard">
        <DelivererLayout><DelivererDashboard /></DelivererLayout>
      </Route>
      <Route path="/deliverer/queue">
        <DelivererLayout><DelivererQueue /></DelivererLayout>
      </Route>
      <Route path="/deliverer/history">
        <DelivererLayout><DelivererHistory /></DelivererLayout>
      </Route>
      <Route path="/deliverer">
        {() => { window.location.replace("/deliverer/login"); return null; }}
      </Route>
    </Switch>
  );
}

function RootRouter() {
  const [location] = useLocation();

  if (isSocialsRoute(location)) {
    return <SocialsRouter />;
  }

  if (isCollabRoute(location)) {
    return <CollabRouter />;
  }

  if (isStockerRoute(location)) {
    return <StockerRouter />;
  }

  if (isDelivererRoute(location)) {
    return <DelivererRouter />;
  }

  if (isAdminRoute(location)) {
    return <AdminRouter />;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <StorefrontRouter />
      </CartProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminAuthProvider>
          <AdminSocketProvider>
            <WouterRouter>
              <RootRouter />
            </WouterRouter>
            <Toaster />
          </AdminSocketProvider>
        </AdminAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
