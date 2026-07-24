import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { LogOut, LayoutDashboard, MessageSquare, Clock, Truck, ShoppingBag } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "";
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

const navItems = [
  { href: "/deliverer/dashboard", label: "Dashboard",    icon: LayoutDashboard },
  { href: "/deliverer/queue",     label: "Claim Queue",  icon: MessageSquare },
  { href: "/deliverer/orders",    label: "Orders",       icon: ShoppingBag },
  { href: "/deliverer/history",   label: "My Deliveries", icon: Clock },
];

export default function DelivererLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [deliverer, setDeliverer] = useState<any>(null);

  useEffect(() => {
    const token = getDelivererToken();
    if (!token) { navigate("/deliverer/login"); return; }
    delivererGet("/auth/me")
      .then(res => setDeliverer(res.data?.user))
      .catch(() => { localStorage.removeItem("deliverer_token"); navigate("/deliverer/login"); });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #060a1a 0%, #0c1445 45%, #060a1a 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(14,165,233,0.07) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(2,132,199,0.06) 0%, transparent 70%)" }} />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-6 h-16 flex-shrink-0"
          style={{ background: "rgba(6,9,28,0.82)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)", boxShadow: "0 0 16px rgba(14,165,233,0.35)" }}>
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-sm tracking-tight">RBstars</span>
                <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(14,165,233,0.7)" }}>Delivery Portal</p>
              </div>
            </div>
            <nav className="hidden sm:flex items-center gap-1 ml-4">
              {navItems.map(item => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
                      style={isActive
                        ? { background: "rgba(14,165,233,0.2)", color: "#7dd3fc", border: "1px solid rgba(14,165,233,0.3)" }
                        : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }}>
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {deliverer && (
              <div className="text-right hidden sm:block">
                <p className="text-white text-xs font-semibold">{deliverer.name || deliverer.email}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{deliverer.commissionRate}% commission</p>
              </div>
            )}
            <button onClick={() => { localStorage.removeItem("deliverer_token"); navigate("/deliverer/login"); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <LogOut className="w-3.5 h-3.5" /> Log out
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
