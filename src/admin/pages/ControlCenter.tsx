import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  AlertTriangle, ArrowRight, Boxes, CheckCircle2, ClipboardList, Film, Gamepad2,
  LayoutDashboard, Megaphone, Package, Percent, Rocket, Shield, ShoppingBag, Sparkles,
  Ticket, TrendingUp, Truck, Users, Video, Globe, Workflow, type LucideIcon,
} from "lucide-react";
import { adminApi } from "../api";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Badge, Card, CardBody, CardHeader, MetricTile, PageHeader, Skeleton } from "../components/kit";

/* ------------------------------------------------------------------ */
/* Section index — every part of the panel, in one place.              */
/* ------------------------------------------------------------------ */

interface Section {
  href: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  /** permission required to see it; owner always passes */
  permission?: string;
  group: "Commerce" | "Content" | "Operations" | "People" | "Growth" | "System";
}

const SECTIONS: Section[] = [
  { href: "/admin/dashboard", label: "Dashboard", blurb: "Today at a glance", icon: LayoutDashboard, permission: "view_analytics", group: "Commerce" },
  { href: "/admin/analytics", label: "Analytics", blurb: "Revenue, conversion, traffic", icon: TrendingUp, permission: "view_analytics", group: "Commerce" },
  { href: "/admin/orders", label: "Orders", blurb: "Every order and its state", icon: ShoppingBag, permission: "view_orders", group: "Commerce" },
  { href: "/admin/products", label: "Products", blurb: "Catalogue, pricing, stock", icon: Package, permission: "view_products", group: "Commerce" },
  { href: "/admin/games", label: "Games & Categories", blurb: "Titles and their categories", icon: Gamepad2, permission: "view_games", group: "Commerce" },
  { href: "/admin/promos", label: "Promo Codes", blurb: "Discounts and usage limits", icon: Percent, permission: "manage_promos", group: "Growth" },
  { href: "/admin/announcements", label: "Announcements", blurb: "Site popup + broadcast email", icon: Megaphone, permission: "view_announcements", group: "Growth" },
  { href: "/admin/socials", label: "Video Submissions", blurb: "Creator videos and payouts", icon: Video, permission: "view_socials", group: "Growth" },
  { href: "/admin/claim-teams", label: "Claim Time", blurb: "Per-game claim windows", icon: ClipboardList, permission: "view_games", group: "Operations" },
  { href: "/admin/tickets", label: "Support Tickets", blurb: "Customer questions", icon: Ticket, permission: "view_tickets", group: "Operations" },
  { href: "/admin/open-chats", label: "Open Chats", blurb: "Live claim conversations", icon: Workflow, permission: "monitor_agents", group: "Operations" },
  { href: "/admin/monitor", label: "Agent Monitor", blurb: "Who is online right now", icon: Shield, permission: "monitor_agents", group: "Operations" },
  { href: "/admin/proof-of-delivery", label: "Proof of Delivery", blurb: "Delivery evidence", icon: CheckCircle2, permission: "view_pod", group: "Operations" },
  { href: "/admin/stock/requests", label: "Stock Requests", blurb: "Inbound stock approvals", icon: Boxes, permission: "view_stock", group: "Operations" },
  { href: "/admin/stock/tracking", label: "Stocker Tracking", blurb: "Stockers and payouts", icon: Truck, permission: "manage_stockers", group: "Operations" },
  { href: "/admin/delivery-team", label: "Delivery Team", blurb: "Deliverers and commission", icon: Truck, permission: "view_deliverers", group: "People" },
  { href: "/admin/team", label: "Team", blurb: "Staff accounts + roles", icon: Users, permission: "view_team", group: "People" },
  { href: "/admin/roles", label: "Roles & Permissions", blurb: "What each role can reach", icon: Shield, permission: "manage_roles", group: "People" },
  { href: "/admin/customers", label: "Customers", blurb: "Accounts and spend", icon: Users, permission: "view_customers", group: "People" },
  { href: "/admin/site-content", label: "Site Content", blurb: "Homepage copy and banners", icon: Globe, permission: "edit_site_content", group: "System" },
  { href: "/admin/tutorials", label: "Tutorials", blurb: "How-to videos", icon: Film, permission: "edit_site_content", group: "System" },
  { href: "/admin/site-modes", label: "Site Modes", blurb: "Seasonal themes", icon: Sparkles, permission: "view_site_modes", group: "System" },
  { href: "/admin/settings", label: "Settings", blurb: "Store configuration", icon: Sparkles, permission: "view_settings", group: "System" },
];

/* ------------------------------------------------------------------ */

function Stat({
  label, value, icon: Icon,
}: { label: string; value: number | string; icon: LucideIcon }) {
  return <MetricTile label={label} value={String(value)} icon={Icon} />;
}

export default function ControlCenter() {
  const { user, hasPermission } = useAdminAuth();

  // Everything is wrapped so one broken endpoint can never blank the hub.
  const safe = <T,>(q: Promise<T>) => q.catch(() => null as T | null);

  const orders = useQuery({
    queryKey: ["cc-orders"],
    queryFn: () => safe(adminApi.orders.list({ limit: 200 })),
    refetchInterval: 60000,
  });
  const products = useQuery({
    queryKey: ["cc-products"],
    queryFn: () => safe(adminApi.products.list({ limit: 300 })),
    refetchInterval: 120000,
  });
  const team = useQuery({
    queryKey: ["cc-team"],
    queryFn: () => safe(adminApi.team.list()),
  });
  const tickets = useQuery({
    queryKey: ["cc-tickets"],
    queryFn: () => safe(fetch(`${import.meta.env.VITE_API_URL || ""}/api/panel/tickets/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("panel_token") || ""}` },
    }).then((r) => (r.ok ? r.json() : null)).then((j) => (j?.data ?? null) as any)),
    refetchInterval: 60000,
  });
  const announcements = useQuery({
    queryKey: ["cc-announcements"],
    queryFn: () => safe(adminApi.announcements.listAll()),
    refetchInterval: 90000,
  });
  const broadcasts = useQuery({
    queryKey: ["cc-broadcasts"],
    queryFn: () => safe(adminApi.announcements.broadcasts()),
  });

  const orderList: any[] = useMemo(() => {
    const d = (orders.data as any)?.data;
    return Array.isArray(d) ? d : Array.isArray(d?.orders) ? d.orders : [];
  }, [orders.data]);
  const productList: any[] = useMemo(() => {
    const d = (products.data as any)?.data;
    return Array.isArray(d) ? d : Array.isArray(d?.products) ? d.products : [];
  }, [products.data]);
  const teamList: any[] = useMemo(() => {
    const d = (team.data as any)?.data;
    return Array.isArray(d) ? d : Array.isArray(d?.members) ? d.members : [];
  }, [team.data]);
  const ticketStats: any = tickets.data || null;
  const annList: any[] = useMemo(
    () => (announcements.data as any)?.data?.announcements || [],
    [announcements.data]
  );
  const bcasts: any[] = useMemo(
    () => (broadcasts.data as any)?.data?.broadcasts || [],
    [broadcasts.data]
  );

  const loading = orders.isLoading || products.isLoading || team.isLoading;

  // ── Things that actually need a human ─────────────────────────────
  const attention = useMemo(() => {
    const items: { tone: "critical" | "warning" | "neutral"; label: string; detail: string; href: string }[] = [];

    const awaiting = orderList.filter((o) => ["pending", "paid"].includes(o.status)).length;
    if (awaiting > 0) {
      items.push({
        tone: "warning",
        label: `${awaiting} order${awaiting === 1 ? "" : "s"} waiting to be fulfilled`,
        detail: "Paid but not yet marked complete.",
        href: "/admin/orders?status=paid",
      });
    }

    const openTickets = (ticketStats?.open || 0) + (ticketStats?.waiting || 0);
    if (openTickets > 0) {
      items.push({
        tone: "warning",
        label: `${openTickets} support ticket${openTickets === 1 ? "" : "s"} unanswered`,
        detail: "Customers are waiting on a reply.",
        href: "/admin/tickets",
      });
    }

    const outOfStock = productList.filter((p) => p.outOfStock || p.stock === 0).length;
    if (outOfStock > 0) {
      items.push({
        tone: "warning",
        label: `${outOfStock} product${outOfStock === 1 ? "" : "s"} out of stock`,
        detail: "Buyers cannot check out on these.",
        href: "/admin/products",
      });
    }

    const disabled = teamList.filter((m) => m.active === false || m.status === "disabled").length;
    if (disabled > 0) {
      items.push({
        tone: "neutral",
        label: `${disabled} disabled team member${disabled === 1 ? "" : "s"}`,
        detail: "Re-enable or remove them.",
        href: "/admin/team",
      });
    }

    const badBroadcasts = bcasts.filter(
      (b) => b.status === "failed" || (b.failed || 0) > 0
    );
    if (badBroadcasts.length > 0) {
      items.push({
        tone: "critical",
        label: `${badBroadcasts.length} broadcast email${badBroadcasts.length === 1 ? "" : "s"} had failures`,
        detail: "Some customers never received the email.",
        href: "/admin/announcements",
      });
    }

    const inFlight = bcasts.filter((b) => b.status === "sending" || b.status === "queued");
    if (inFlight.length > 0) {
      items.push({
        tone: "neutral",
        label: `${inFlight.length} broadcast email${inFlight.length === 1 ? "" : "s"} still sending`,
        detail: "Progress is tracked on the Announcements page.",
        href: "/admin/announcements",
      });
    }

    const drafts = annList.filter((a) => !a.published);
    if (drafts.length > 0) {
      items.push({
        tone: "neutral",
        label: `${drafts.length} unpublished announcement${drafts.length === 1 ? "" : "s"}`,
        detail: "Drafts never reach customers.",
        href: "/admin/announcements",
      });
    }

    if (items.length === 0) {
      items.push({
        tone: "success" as any,
        label: "Nothing needs your attention",
        detail: "No unfulfilled orders, unanswered tickets or failed sends.",
        href: "/admin/dashboard",
      });
    }
    return items;
  }, [orderList, ticketStats, productList, teamList, bcasts, annList]);

  const visibleSections = useMemo(
    () =>
      SECTIONS.filter(
        (s) => !s.permission || user?.isOwner || hasPermission(s.permission)
      ),
    [user?.isOwner, hasPermission]
  );
  const grouped = useMemo(() => {
    const map = new Map<string, Section[]>();
    visibleSections.forEach((s) => {
      const arr = map.get(s.group) || [];
      arr.push(s);
      map.set(s.group, arr);
    });
    return Array.from(map.entries());
  }, [visibleSections]);

  const liveAnnouncements = annList.filter((a) => a.isLive).length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <PageHeader
        icon={Rocket}
        title="Control Center"
        description="Everything you can change about the store, and anything that needs you."
        actions={
          <Link href="/admin/dashboard">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--pn-primary)", color: "#fff" }}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </span>
          </Link>
        }
      />

      {/* ── Pulse ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Stat label="Orders" value={orderList.length} icon={ShoppingBag} />
          <Stat label="Products" value={productList.length} icon={Package} />
          <Stat label="Open tickets" value={(ticketStats?.open || 0) + (ticketStats?.waiting || 0)} icon={Ticket} />
          <Stat label="Team members" value={teamList.filter((m) => m.active !== false).length} icon={Users} />
          <Stat label="Live popups" value={liveAnnouncements} icon={Megaphone} />
        </div>
      )}

      {/* ── Attention + quick controls ─────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        <Card>
          <CardHeader
            title="Needs attention"
            subtitle={attention.length === 1 ? "1 item" : `${attention.length} items`}
            icon={AlertTriangle}
          />
          <CardBody className="p-0">
            <ul>
              {attention.map((a, i) => (
                <li key={i}>
                  <Link href={a.href}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 transition-colors"
                      style={{ borderBottom: "1px solid var(--pn-divider)" }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background:
                            a.tone === "critical"
                              ? "var(--pn-critical)"
                              : a.tone === "warning"
                                ? "var(--pn-warning)"
                                : a.tone === "success"
                                  ? "var(--pn-success-fg)"
                                  : "var(--pn-border-strong)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium" style={{ color: "var(--pn-text)" }}>
                          {a.label}
                        </p>
                        <p className="text-xs" style={{ color: "var(--pn-text-3)" }}>{a.detail}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--pn-text-3)" }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick actions" subtitle="Shortcuts to the things you change most" icon={Sparkles} />
          <CardBody>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--pn-text-3)" }}>
                Jump to
              </p>
              <div className="grid grid-cols-2 gap-2">
                <QuickLink href="/admin/announcements" icon={Megaphone} label="Post announcement" />
                <QuickLink href="/admin/promos" icon={Percent} label="New promo code" />
                <QuickLink href="/admin/products" icon={Package} label="Add product" />
                <QuickLink href="/admin/roles" icon={Shield} label="Manage roles" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── Everything else ───────────────────────────────────────────── */}
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-bold mb-2.5" style={{ color: "var(--pn-text)" }}>
            All sections
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--pn-text-3)" }}>
            Showing the {visibleSections.length} sections your role can open.
          </p>
        </div>

        {grouped.map(([group, items]) => (
          <div key={group}>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--pn-text-3)" }}
            >
              {group}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {items.map((s) => (
                <Link key={s.href} href={s.href}>
                  <div
                    className="flex items-start gap-3 p-3.5 rounded-xl transition-colors h-full"
                    style={{
                      background: "var(--pn-surface)",
                      border: "1px solid var(--pn-border)",
                    }}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--pn-surface-2)" }}
                    >
                      <s.icon className="w-4 h-4" style={{ color: "var(--pn-text-2)" }} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>
                        {s.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--pn-text-3)" }}>{s.blurb}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href}>
      <span
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
        style={{
          background: "var(--pn-surface-2)",
          border: "1px solid var(--pn-border)",
          color: "var(--pn-text-2)",
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: "var(--pn-action)" }} />
        <span className="truncate">{label}</span>
      </span>
    </Link>
  );
}