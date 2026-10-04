import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SiteModeProvider } from "@/context/SiteModeContext";
import CartDrawer from "@/components/CartDrawer";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import WelcomeModal from "@/components/WelcomeModal";
import WelcomeGiftModal from "@/components/WelcomeGiftModal";
import Home from "@/pages/Home";
import GamePage from "@/pages/GamePage";
import ProductPage from "@/pages/ProductPage";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import AutoDelivery from "@/pages/AutoDelivery";
import ClaimChatPage from "@/pages/ClaimChatPage";
import ProfilePage from "@/pages/ProfilePage";
import BrowseGames from "@/pages/BrowseGames";
import NotFound from "@/pages/not-found";
import TicketList from "@/pages/TicketList";
import TicketThread from "@/pages/TicketThread";
import CreateTicket from "@/pages/CreateTicket";
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
import DelivererOrders from "@/admin/pages/deliverer/DelivererOrders";

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
import AutoBotLogs from "@/admin/pages/AutoBotLogs";
import Announcements from "@/admin/pages/Announcements";
import ControlCenter from "@/admin/pages/ControlCenter";

import AdminProfilePage from "@/admin/pages/Profile";

import DeliveryTeam from "@/admin/pages/delivery/DeliveryTeam";
import DeliveryMemberDetail from "@/admin/pages/delivery/DeliveryMemberDetail";

import Promos from "@/admin/pages/Promos";
import Settings from "@/admin/pages/Settings";
import SiteModes from "@/admin/pages/SiteModes";
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
import TicketDashboard from "@/admin/pages/TicketDashboard";

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

function StorefrontRouter() {
  const [location] = useLocation();
  const isGamePage = location.startsWith("/game/");
  const isProductPage = location.startsWith("/product/");
  const isCheckout = location === "/checkout";
  const isSuccess = location === "/order-success";
  const isAutoDelivery = location === "/auto-delivery";
  const isClaimChat = location === "/claim-chat";
  const isProfile = location === "/profile";

  return (
    <>
      {!isCheckout && !isSuccess && !isAutoDelivery && !isClaimChat && !isProfile && <Navbar dark={isGamePage || isProductPage} />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/game/:slug" component={GamePage} />
        <Route path="/product/:id" component={ProductPage} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-success" component={PaymentSuccess} />
        <Route path="/auto-delivery" component={AutoDelivery} />
        <Route path="/claim-chat" component={ClaimChatPage} />
        <Route path="/browse" component={BrowseGames} />
        <Route path="/tickets/new" component={CreateTicket} />
        <Route path="/tickets/:ticketId" component={TicketThread} />
        <Route path="/tickets" component={TicketList} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
      {!isGamePage && !isProductPage && !isCheckout && !isSuccess && !isAutoDelivery && !isClaimChat && !isProfile && <Footer />}
      <CartDrawer />
      <AuthModal />
      <WelcomeModal />
      <WelcomeGiftModal />
      {/* Site-wide announcement popup — owner-authored, shown on site load. */}
      <AnnouncementPopup />
      {/* Bottom nav hidden on product pages: they ship their own sticky Buy bar,
          which would otherwise be painted underneath this nav (z-40 vs z-50). */}
      {!isCheckout && !isSuccess && !isAutoDelivery && !isClaimChat && !isProductPage && <MobileBottomNav />}
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
      <Route path="/admin/auto-logs">
        <AdminLayout><AutoBotLogs /></AdminLayout>
      </Route>
      <Route path="/admin/announcements">
        <AdminLayout><Announcements /></AdminLayout>
      </Route>
      <Route path="/admin/control">
        <AdminLayout><ControlCenter /></AdminLayout>
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
      <Route path="/admin/site-modes">
        <AdminLayout><SiteModes /></AdminLayout>
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
      <Route path="/admin/tickets">
        <AdminLayout><TicketDashboard /></AdminLayout>
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
      <Route path="/deliverer/orders">
        <DelivererLayout><DelivererOrders /></DelivererLayout>
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
    <SiteModeProvider>
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
    </SiteModeProvider>
  );
}

export default App;
