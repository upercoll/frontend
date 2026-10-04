import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Archive, ClipboardList, LayoutDashboard, DollarSign } from "lucide-react";
import PanelShell, { PanelNavItem } from "@/components/PanelShell";

const BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

function getToken() { return localStorage.getItem("stocker_token") || ""; }

async function apiGet(path: string) {
  const res = await fetch(`${BASE}/api/stocker${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const navItems: PanelNavItem[] = [
  { href: "/stocker/dashboard", label: "Dashboard",   icon: LayoutDashboard },
  { href: "/stocker/payouts",   label: "My Payouts",  icon: DollarSign },
  { href: "/stocker/request",   label: "New Request", icon: ClipboardList },
  { href: "/stocker/history",   label: "My History",  icon: Archive },
];

export default function StockerLayout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [stocker, setStocker] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/stocker/login"); return; }
    apiGet("/auth/me")
      .then(res => setStocker(res.data?.stocker || res.data?.user))
      .catch(() => { localStorage.removeItem("stocker_token"); navigate("/stocker/login"); });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("stocker_token");
    navigate("/stocker/login");
  };

  return (
    <PanelShell
      eyebrow="Stocker portal"
      navItems={navItems}
      user={stocker ? {
        name: stocker.name || stocker.email,
        email: stocker.email,
        role: stocker.commissionRate != null ? `${stocker.commissionRate}% commission` : "Stocker",
      } : null}
      onLogout={handleLogout}
    >
      {children}
    </PanelShell>
  );
}
