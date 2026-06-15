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
import Home from "@/pages/Home";
import GamePage from "@/pages/GamePage";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import NotFound from "@/pages/not-found";

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

import Promos from "@/admin/pages/Promos";
import Settings from "@/admin/pages/Settings";
import RoleView from "@/admin/pages/RoleView";

import AgentDashboard from "@/admin/pages/agent/AgentDashboard";
import Queue from "@/admin/pages/agent/Queue";
import AgentStats from "@/admin/pages/agent/AgentStats";

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
    </>
  );
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/invite/:token" component={InviteAccept} />
      <Route path="/admin/profile-setup" component={AdminProfileSetup} />
      <Route path="/panel/profile-setup" component={AdminProfileSetup} />

      <Route path="/admin/dashboard">
        <AdminLayout>
          <Dashboard />
        </AdminLayout>
      </Route>
      <Route path="/admin/orders">
        <AdminLayout>
          <Orders />
        </AdminLayout>
      </Route>
      <Route path="/admin/products">
        <AdminLayout>
          <Products />
        </AdminLayout>
      </Route>
      <Route path="/admin/games">
        <AdminLayout>
          <Games />
        </AdminLayout>
      </Route>
      <Route path="/admin/roles">
        <AdminLayout>
          <Roles />
        </AdminLayout>
      </Route>
      <Route path="/admin/team">
        <AdminLayout>
          <Team />
        </AdminLayout>
      </Route>
      <Route path="/admin/claim-teams">
        <AdminLayout>
          <ClaimTeams />
        </AdminLayout>
      </Route>
      <Route path="/admin/monitor">
        <AdminLayout>
          <Monitor />
        </AdminLayout>
      </Route>
      <Route path="/admin/site-content">
        <AdminLayout>
          <SiteContent />
        </AdminLayout>
      </Route>
      <Route path="/admin/proof-of-delivery">
        <AdminLayout>
          <ProofOfDelivery />
        </AdminLayout>
      </Route>
      <Route path="/admin/promos">
        <AdminLayout>
          <Promos />
        </AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout>
          <Settings />
        </AdminLayout>
      </Route>
      <Route path="/admin/role-view">
        <AdminLayout>
          <RoleView />
        </AdminLayout>
      </Route>
      <Route path="/admin/profile">
        <AdminLayout>
          <AdminProfilePage />
        </AdminLayout>
      </Route>

      <Route path="/panel/dashboard">
        <AdminLayout>
          <AgentDashboard />
        </AdminLayout>
      </Route>
      <Route path="/panel/queue">
        <AdminLayout>
          <Queue />
        </AdminLayout>
      </Route>
      <Route path="/panel/stats">
        <AdminLayout>
          <AgentStats />
        </AdminLayout>
      </Route>
      <Route path="/panel/profile">
        <AdminLayout>
          <AdminProfilePage />
        </AdminLayout>
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

function RootRouter() {
  const [location] = useLocation();

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
