import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingBag, DollarSign, Loader2, AlertTriangle } from "lucide-react";
import PanelShell, { PanelNavItem } from "@/components/PanelShell";

const BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

async function apiGet(path: string, token: string) {
  const res = await fetch(`${BASE}/api/collab${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function fmt(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const navItems: PanelNavItem[] = [
  { href: "/collab/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function CollabDashboard() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("collab_token");
    if (!token) { navigate("/collab/login"); return; }
    apiGet("/me", token)
      .then(res => setData(res.data))
      .catch(err => {
        if (err.message.includes("401") || err.message.toLowerCase().includes("invalid")) {
          localStorage.removeItem("collab_token");
          navigate("/collab/login");
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("collab_token");
    navigate("/collab/login");
  };

  const collab = data?.collaborator;
  const products: any[] = data?.products || data?.assignedProducts || [];
  const sales: any[] = data?.sales || [];
  const unpaidEarnings: number = data?.unpaidEarnings || 0;

  const shellUser = collab ? { name: collab.name, email: collab.email, role: "Collaborator" } : null;

  const body = loading ? (
    <div className="p-6 max-w-[1100px] mx-auto space-y-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="pn-card p-5">
          <div className="animate-pulse rounded" style={{ background: "var(--pn-surface-2)", height: 14, width: "40%" }} />
          <div className="animate-pulse rounded mt-3" style={{ background: "var(--pn-surface-2)", height: 34, width: "25%" }} />
        </div>
      ))}
    </div>
  ) : error ? (
    <div className="p-6 max-w-[1100px] mx-auto">
      <div className="pn-card p-10 text-center">
        <AlertTriangle className="w-7 h-7 mx-auto mb-2" style={{ color: "var(--pn-critical-fg)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>Something went wrong</p>
        <p className="text-xs mt-1" style={{ color: "var(--pn-text-3)" }}>{error}</p>
      </div>
    </div>
  ) : (
    <div className="p-6 space-y-5 max-w-[1100px] mx-auto">
      <div className="pn-pagehead">
        <div>
          <h1>Welcome back, {collab?.name?.split(" ")[0] || "there"}</h1>
          <p>Here's an overview of your assigned products and sales.</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Assigned Products", value: products.length, icon: Package, hint: undefined as string | undefined },
          { label: "Paid Orders", value: sales.length, icon: ShoppingBag, hint: "from paid customers only" },
          { label: "Pending Commission", value: `$${unpaidEarnings.toFixed(2)}`, icon: DollarSign, hint: "owed to you, not yet paid out" },
        ].map((stat, i) => (
          <div key={i} className="pn-metric">
            <span className="pn-metric__label">
              <stat.icon className="w-3.5 h-3.5" style={{ color: "var(--pn-text-3)" }} />
              {stat.label}
            </span>
            <span className="pn-metric__value">{stat.value}</span>
            {stat.hint && <span className="pn-metric__hint">{stat.hint}</span>}
          </div>
        ))}
      </div>

      {/* Assigned products */}
      <div className="pn-card overflow-hidden">
        <div className="pn-cardhead">
          <div>
            <h3>Assigned Products ({products.length})</h3>
          </div>
        </div>
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-7 h-7 mx-auto mb-2" style={{ color: "var(--pn-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--pn-text-3)" }}>No products assigned yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Game</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Price</th>
                </tr>
              </thead>
              <tbody>
                {products.map((cp: any) => (
                  <tr key={cp._id}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                          style={{ background: cp.product?.gradient?.from || "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}
                        >
                          {cp.product?.imageUrl
                            ? <img src={cp.product.imageUrl} className="w-full h-full object-cover" alt="" />
                            : <div className="w-full h-full flex items-center justify-center"><Package className="w-3.5 h-3.5" style={{ color: "var(--pn-text-3)" }} /></div>}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>
                          {cp.productName || cp.product?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="pn-badge" style={{ background: "var(--pn-neutral-bg)", color: "var(--pn-neutral-fg)" }}>
                        {cp.product?.game || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "var(--pn-text-2)" }}>
                      ${cp.product?.price?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales log */}
      <div className="pn-card overflow-hidden">
        <div className="pn-cardhead">
          <div>
            <h3>Sales Log ({sales.length})</h3>
            <p>All entries below are from paid customer orders. "Commission" shows whether your cut has been paid to you yet.</p>
          </div>
        </div>
        {sales.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-7 h-7 mx-auto mb-2" style={{ color: "var(--pn-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--pn-text-3)" }}>No sales yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Sale Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Commission</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s: any, i: number) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "var(--pn-text-2)" }}>{fmt(s.orderDate)}</td>
                    <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--pn-action)" }}>
                      #{s.orderNumber?.replace("RB-", "")}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "var(--pn-text)" }}>{s.productName}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "var(--pn-text-2)" }}>{s.quantity}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--pn-text)" }}>
                      ${(s.salePrice ?? s.unitPrice * s.quantity).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="pn-badge"
                        style={s.isPaid
                          ? { background: "var(--pn-success-bg)", color: "var(--pn-success-fg)" }
                          : { background: "var(--pn-warning-bg)", color: "var(--pn-warning-fg)" }}
                      >
                        <span className="pn-badge__dot" />
                        {s.isPaid ? "Paid to You" : "Owed to You"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && !collab) {
    // Still show chrome while the first load runs so there's no dark flash.
    return (
      <PanelShell eyebrow="Collaborator portal" navItems={navItems} user={null} onLogout={handleLogout}>
        <div className="p-6 max-w-[1100px] mx-auto flex items-center gap-2 text-sm" style={{ color: "var(--pn-text-3)" }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your dashboard…
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell eyebrow="Collaborator portal" navItems={navItems} user={shellUser} onLogout={handleLogout}>
      {body}
    </PanelShell>
  );
}
