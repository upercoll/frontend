import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Package, Truck, CheckCircle2, MessageCircle, ShoppingBag,
  Clock, UserRound, RefreshCw, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePrice } from "@/context/CurrencyContext";
import { TopNav, SiteFooter } from "./Home";
import { P } from "@/lib/storefront";
import { RBstar } from "@/components/Art";

/* ── My Orders — the real Track Order ────────────────────────────────────
   The nav's "Track Order" used to jump to the profile page, which had no
   order information at all. This page shows what actually exists in the
   store: the buyer's own orders (GET /api/orders/my, matched on the email
   the order was placed with) joined to their claim session, so each order
   can show delivery progress and link straight into its claim chat. */

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

type OrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string | null;
  game?: string | null;
};

type MyOrder = {
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  robloxUsername: string;
  items: OrderItem[];
  claim: { roomId: string; status: string; mode: string; claimed: number; total: number } | null;
};

type Phase = "queued" | "delivering" | "delivered" | "problem";

/* One vocabulary for order + claim state. The claim session is the truth
   once it exists (the bot drives it); the order status covers everything
   before a session is opened. */
function phaseOf(o: MyOrder): Phase {
  if (o.claim) {
    if (o.claim.status === "claimed") return "delivered";
    if (o.claim.status === "active") return "delivering";
    if (o.claim.status === "ended" || o.claim.status === "closed") return "delivered";
    return "queued";
  }
  if (o.status === "completed") return "delivered";
  if (o.status === "cancelled" || o.status === "refunded" || o.status === "partially_refunded") return "problem";
  if (o.status === "delivering") return "delivering";
  return "queued";
}

const PHASE_META: Record<Phase, { label: string; color: string; tint: string; Icon: typeof Package }> = {
  queued:      { label: "Queued",      color: P.warn,  tint: P.warnTint,  Icon: Clock },
  delivering:  { label: "Delivering",  color: P.accent, tint: P.accentTint, Icon: Truck },
  delivered:   { label: "Delivered",   color: P.good,  tint: P.goodTint,  Icon: CheckCircle2 },
  problem:     { label: "Closed",      color: P.faint, tint: "rgba(138,151,186,.14)", Icon: Package },
};

function when(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

/* Item thumbnails — real product art when the order carried a snapshot ref,
   otherwise a gradient tile with the item's first letter (never a broken img). */
function Thumbs({ items }: { items: OrderItem[] }) {
  const shown = items.slice(0, 4);
  const extra = items.length - shown.length;
  return (
    <div className="flex items-center gap-1.5">
      {shown.map((it, i) => (
        <span
          key={i}
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[11px] font-mont text-[15px] font-bold"
          style={{ background: P.stage, border: `1px solid ${P.border}`, color: P.borderStrong }}
        >
          {it.imageUrl
            ? <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" loading="lazy" />
            : (it.name[0] || "?").toUpperCase()}
        </span>
      ))}
      {extra > 0 && (
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[11px] text-[12px] font-bold"
          style={{ background: P.band, border: `1px solid ${P.border}`, color: P.faint }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

/* Delivery rail — Paid → Delivering → Delivered, the same three beats the
   flow actually has. The claim's delivered/total counts drive the middle. */
function Rail({ phase, claim }: { phase: Phase; claim: MyOrder["claim"] }) {
  const steps = [
    { key: "paid", label: "Paid", Icon: CheckCircle2 },
    { key: "delivering", label: "Delivering", Icon: Truck },
    { key: "delivered", label: "Delivered", Icon: Package },
  ];
  const activeIdx = phase === "queued" ? 0 : phase === "delivering" ? 1 : 2;
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const now = i === activeIdx;
        const color = done ? P.good : now ? (phase === "problem" ? P.faint : P.accent) : P.border;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-full transition-colors"
              style={{
                background: done ? P.goodTint : now ? P.accentTint : P.band,
                border: `1px solid ${done ? "rgba(95,224,142,.5)" : now ? "rgba(47,140,255,.55)" : P.border}`,
              }}
            >
              <s.Icon size={14} strokeWidth={2.6} color={color} />
            </span>
            <span className="text-[12.5px] font-semibold" style={{ color: done || now ? P.text : P.faint }}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                className="h-[2px] w-7 rounded-full sm:w-10"
                style={{ background: i < activeIdx ? "rgba(95,224,142,.55)" : P.border }}
                aria-hidden
              />
            )}
          </div>
        );
      })}
      {claim && claim.total > 0 && (
        <span
          className="ml-auto hidden rounded-full px-2.5 py-1 text-[11.5px] font-bold sm:inline-block"
          style={{
            background: phase === "delivered" ? P.goodTint : P.accentTint,
            color: phase === "delivered" ? P.good : P.accent,
          }}
        >
          {Math.min(claim.claimed, claim.total)}/{claim.total} items delivered
        </span>
      )}
    </div>
  );
}

function OrderCard({ o, index }: { o: MyOrder; index: number }) {
  const fmt = usePrice();
  const phase = phaseOf(o);
  const meta = PHASE_META[phase];
  const chatHref = o.claim?.roomId ? `/claim-chat?room=${encodeURIComponent(o.claim.roomId)}` : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[18px] p-4 sm:p-5"
      style={{ background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow }}
    >
      {/* Head — ref, date, phase pill */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-[13px] font-bold tracking-wide" style={{ color: P.text }}>
          {o.orderNumber}
        </span>
        <span className="text-[12.5px]" style={{ color: P.faint }}>{when(o.createdAt)}</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold"
          style={{ background: meta.tint, color: meta.color }}
        >
          <meta.Icon size={13} strokeWidth={2.8} />
          {phase === "delivering" && o.claim && o.claim.total > 0 && o.claim.claimed >= o.claim.total
            ? "Delivered" : meta.label}
        </span>
      </div>

      {/* Items row */}
      <div className="mt-4 flex items-center gap-3">
        <Thumbs items={o.items} />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold" style={{ color: P.text }}>
            {o.items[0]?.name || "Order"}
            {o.items.length > 1 && <span style={{ color: P.faint }}> +{o.items.length - 1} more</span>}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px]" style={{ color: P.faint }}>
            <UserRound size={12} strokeWidth={2.4} />
            {o.robloxUsername || "—"}
          </p>
        </div>
        <b className="ml-auto shrink-0 font-mont text-[17px]" style={{ color: P.good }}>
          {fmt(o.total)}
        </b>
      </div>

      {/* Rail */}
      <div className="mt-4">
        <Rail phase={phase} claim={o.claim} />
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {chatHref && phase !== "problem" && (
          <a
            href={chatHref}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5"
            style={{ background: `linear-gradient(180deg, ${P.accent}, ${P.accentDeep})`, color: "#fff", boxShadow: P.shadowSoft }}
          >
            <MessageCircle size={14} strokeWidth={2.6} />
            {phase === "delivered" ? "Open claim chat" : "Chat with delivery"}
            <ChevronRight size={13} strokeWidth={3} />
          </a>
        )}
        <a
          href="/tickets/new"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors"
          style={{ background: P.band, border: `1px solid ${P.border}`, color: P.muted }}
        >
          Need help?
        </a>
      </div>
    </motion.article>
  );
}

function StatChip({ value, label, color, tint, Icon }: {
  value: number; label: string; color: string; tint: string; Icon: typeof Package;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[16px] px-4 py-3.5"
      style={{ background: tint, border: `1px solid ${P.border}` }}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: P.card }}>
        <Icon size={18} strokeWidth={2.4} color={color} />
      </span>
      <div>
        <b className="font-mont text-[21px] leading-none" style={{ color: P.text }}>{value}</b>
        <p className="mt-1 text-[12.5px] font-semibold" style={{ color: P.muted }}>{label}</p>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [, navigate] = useLocation();
  const { token, openAuthModal } = useAuth();

  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [error, setError] = useState(false);
  /* an expired token is not an empty store — send them back to the door */
  const [authExpired, setAuthExpired] = useState(false);

  function load() {
    if (!token) return;
    setError(false);
    setAuthExpired(false);
    setOrders(null);
    fetch(`${BACKEND}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401) { setAuthExpired(true); setOrders([]); return null; }
        return r.json();
      })
      .then((d) => { if (d) setOrders(Array.isArray(d?.data?.orders) ? d.data.orders : []); })
      .catch(() => { setError(true); setOrders([]); });
  }

  useEffect(() => { load(); /* eslint-disable-line */ }, [token]);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const list = orders || [];
  const active = list.filter((o) => phaseOf(o) === "queued" || phaseOf(o) === "delivering");
  const done = list.filter((o) => phaseOf(o) === "delivered");
  const closed = list.filter((o) => phaseOf(o) === "problem");

  return (
    <div className="rglow min-h-screen" style={{ color: P.text }}>
      <TopNav onHome={() => navigate("/")} />

      <main className="wide-wrap px-5 pb-20 pt-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-mont text-[30px] font-bold sm:text-[36px]">My Orders</h1>
          <p className="mt-2 text-[14.5px]" style={{ color: P.muted }}>
            Every order, from payment to your in-game mailbox — with the delivery chat one tap away.
          </p>
        </motion.div>

        {/* Signed-out (or a token that expired mid-visit): a real door,
            not a dead link and not a fake empty store. */}
        {(!token || authExpired) && (
          <div
            className="mt-8 grid place-items-center rounded-[20px] px-6 py-16 text-center"
            style={{ background: P.card, border: `1px solid ${P.border}` }}
          >
            <RBstar size={64} color={P.borderStrong} />
            <h2 className="mt-5 font-mont text-[21px] font-bold">
              {authExpired ? "Your session expired" : "Log in to see your orders"}
            </h2>
            <p className="mt-2 max-w-[420px] text-[14px]" style={{ color: P.muted }}>
              {authExpired
                ? "Log in again and every order you have placed comes right back — nothing is lost."
                : "Your orders follow your account — log in with the email you checked out with and everything you have bought shows up here."}
            </p>
            <button
              onClick={() => openAuthModal("login")}
              className="mt-6 rounded-full px-6 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: `linear-gradient(180deg, ${P.accent}, ${P.accentDeep})`, color: "#fff", boxShadow: P.shadowSoft }}
            >
              Log in
            </button>
          </div>
        )}

        {token && !authExpired && (
          <>
            {/* Summary — the "2 pending, 15 claimed" strip */}
            {orders !== null && !error && (
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatChip value={active.length} label={active.length === 1 ? "order in progress" : "orders in progress"} color={P.accent} tint={P.accentTint} Icon={Truck} />
                <StatChip value={done.length} label={done.length === 1 ? "order delivered" : "orders delivered"} color={P.good} tint={P.goodTint} Icon={CheckCircle2} />
                <StatChip value={list.length} label={list.length === 1 ? "order total" : "orders total"} color={P.star} tint="rgba(255,197,61,.12)" Icon={ShoppingBag} />
              </div>
            )}

            {/* Loading */}
            {orders === null && !error && (
              <div className="mt-7 space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[168px] animate-pulse rounded-[18px]" style={{ background: P.card, border: `1px solid ${P.border}` }} />
                ))}
              </div>
            )}

            {/* Error + retry */}
            {error && (
              <div
                className="mt-7 grid place-items-center rounded-[20px] px-6 py-14 text-center"
                style={{ background: P.card, border: `1px solid ${P.border}` }}
              >
                <p className="text-[15px] font-semibold">Could not load your orders.</p>
                <button
                  onClick={load}
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold"
                  style={{ background: P.band, border: `1px solid ${P.border}`, color: P.text }}
                >
                  <RefreshCw size={14} strokeWidth={2.6} /> Try again
                </button>
              </div>
            )}

            {/* Empty */}
            {orders !== null && !error && list.length === 0 && (
              <div
                className="mt-7 grid place-items-center rounded-[20px] px-6 py-16 text-center"
                style={{ background: P.card, border: `1px solid ${P.border}` }}
              >
                <RBstar size={64} color={P.borderStrong} />
                <h2 className="mt-5 font-mont text-[21px] font-bold">No orders yet</h2>
                <p className="mt-2 max-w-[420px] text-[14px]" style={{ color: P.muted }}>
                  When you buy something it lands here instantly — payment, delivery progress and the
                  chat with whoever is handing it over.
                </p>
                <button
                  onClick={() => navigate("/browse")}
                  className="mt-6 rounded-full px-6 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                  style={{ background: `linear-gradient(180deg, ${P.accent}, ${P.accentDeep})`, color: "#fff", boxShadow: P.shadowSoft }}
                >
                  Browse the shop
                </button>
              </div>
            )}

            {/* In progress */}
            {active.length > 0 && (
              <section className="mt-9">
                <h2 className="flex items-center gap-2.5 font-mont text-[19px] font-bold">
                  <span className="grid h-8 w-8 place-items-center rounded-[9px]" style={{ background: P.accentTint }}>
                    <Truck size={16} strokeWidth={2.5} color={P.accent} />
                  </span>
                  In progress
                  <span
                    className="rounded-full px-2 py-0.5 text-[12px] font-bold"
                    style={{ background: P.accentTint, color: P.accent }}
                  >{active.length}</span>
                </h2>
                <div className="mt-4 space-y-3">
                  {active.map((o, i) => <OrderCard key={o.orderNumber} o={o} index={i} />)}
                </div>
              </section>
            )}

            {/* Delivered */}
            {done.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2.5 font-mont text-[19px] font-bold">
                  <span className="grid h-8 w-8 place-items-center rounded-[9px]" style={{ background: P.goodTint }}>
                    <CheckCircle2 size={16} strokeWidth={2.5} color={P.good} />
                  </span>
                  Delivered
                  <span className="rounded-full px-2 py-0.5 text-[12px] font-bold" style={{ background: P.goodTint, color: P.good }}>
                    {done.length}
                  </span>
                </h2>
                <div className="mt-4 space-y-3">
                  {done.map((o, i) => <OrderCard key={o.orderNumber} o={o} index={i} />)}
                </div>
              </section>
            )}

            {/* Closed / refunded */}
            {closed.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2.5 font-mont text-[17px] font-bold" style={{ color: P.muted }}>
                  <span className="grid h-8 w-8 place-items-center rounded-[9px]" style={{ background: P.band }}>
                    <Package size={15} strokeWidth={2.4} color={P.faint} />
                  </span>
                  Closed
                </h2>
                <div className="mt-4 space-y-3">
                  {closed.map((o, i) => <OrderCard key={o.orderNumber} o={o} index={i} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
