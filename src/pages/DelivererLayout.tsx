import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { LayoutDashboard, MessageSquare, Clock, ShoppingBag } from "lucide-react";
import PanelShell, { PanelNavItem } from "@/components/PanelShell";

const BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
export function getDelivererToken() { return localStorage.getItem("deliverer_token") || ""; }

export async function delivererGet(path: string) {
  const res = await fetch(`${BASE}/api/deliverer${path}`, {
    headers: { Authorization: `Bearer ${getDelivererToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function delivererPost(path: string, body?: unknown) {
  const res = await fetch(`${BASE}/api/deliverer${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getDelivererToken()}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function delivererPostForm(path: string, form: FormData) {
  const res = await fetch(`${BASE}/api/deliverer${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getDelivererToken()}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const navItems: PanelNavItem[] = [
  { href: "/deliverer/dashboard", label: "Dashboard",     icon: LayoutDashboard },
  { href: "/deliverer/queue",     label: "Claim Queue",   icon: MessageSquare },
  { href: "/deliverer/orders",    label: "Orders",        icon: ShoppingBag },
  { href: "/deliverer/history",   label: "My Deliveries", icon: Clock },
];

export default function DelivererLayout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [deliverer, setDeliverer] = useState<any>(null);

  useEffect(() => {
    const token = getDelivererToken();
    if (!token) { navigate("/deliverer/login"); return; }
    delivererGet("/auth/me")
      .then(res => setDeliverer(res.data?.user))
      .catch(() => { localStorage.removeItem("deliverer_token"); navigate("/deliverer/login"); });
  }, []);

  const assignments = deliverer?.assignments;
  const role = assignments?.length
    ? `${assignments.length} game-specific rate${assignments.length === 1 ? "" : "s"}`
    : deliverer?.commissionRate != null
      ? `${deliverer.commissionRate}% commission`
      : "Delivery team";

  const handleLogout = () => {
    localStorage.removeItem("deliverer_token");
    navigate("/deliverer/login");
  };

  return (
    <PanelShell
      eyebrow="Delivery portal"
      navItems={navItems}
      user={deliverer ? { name: deliverer.name || deliverer.email, email: deliverer.email, role } : null}
      onLogout={handleLogout}
    >
      {children}
    </PanelShell>
  );
}
