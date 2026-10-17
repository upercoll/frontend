import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { P } from "@/lib/storefront";
import { TicketStub } from "@/components/Art";
import { TopNav, SiteFooter } from "./Home";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

/* Status and priority carry meaning, so both come straight from the
   storefront palette — one meaning per colour, every one legible on white:
     blue = on our side / active · amber = needs attention ·
     mint = finished · red = urgent · neutral = structure */
const STATUS_COLOR: Record<string, string> = {
  open: P.accentDeep,
  in_progress: P.accentDeep,
  waiting: P.warn,
  resolved: P.good,
  closed: P.good,
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_HINT: Record<string, string> = {
  open: "Open — waiting for an agent",
  in_progress: "Being reviewed",
  waiting: "Needs something from you",
  resolved: "Marked solved",
  closed: "Closed",
};

/* Escalation ramp: neutral → blue → amber → red. */
const PRIORITY_COLOR: Record<string, string> = {
  low: P.muted,
  medium: P.accentDeep,
  high: P.warn,
  urgent: P.bad,
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
  urgent: "Urgent",
};

const CATEGORY_LABEL: Record<string, string> = {
  general: "General",
  order_issue: "Order Issue",
  delivery: "Delivery",
  payment: "Payment",
  technical: "Technical",
  other: "Other",
};

interface TicketMessage {
  sender: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  ticketId: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  customerEmail: string;
  lastReplyAt: string;
  createdAt: string;
  unreadCustomer: number;
  // List payloads intentionally omit the message bodies — this field is left
  // undefined (reading its .length used to crash the whole page).
  messages?: TicketMessage[];
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* Chip fills are the chip's own colour at low alpha, so a status reads as
   blue / amber / mint / red on white without ever putting light text on a
   mid-tone fill. Falls back to a neutral band for anything non-hex. */
/* The loading skeleton mirrors the real ticket-card grid so the page doesn't
   reflow the moment the query resolves. This is the original skeleton, re-cut
   for white: `P.stage` blocks on a `P.card` instead of dark-on-dark. */
function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-2xl border p-5"
      style={{ background: P.card, border: `1px solid ${P.border}` }}
    >
      <div className="mb-3 flex gap-2">
        <div className="h-4 w-16 rounded-full" style={{ background: P.stage }} />
        <div className="h-4 w-14 rounded-full" style={{ background: P.stage }} />
        <div className="h-4 w-12 rounded-full" style={{ background: P.stage }} />
      </div>
      <div className="mb-2 h-4 w-3/4 rounded" style={{ background: P.stage }} />
      <div className="mb-3 h-3 w-full rounded" style={{ background: P.stage }} />
      <div className="h-3 w-1/3 rounded" style={{ background: P.stage }} />
    </div>
  );
}

function tintOf(color: string, alpha: number): string {
  const hex = color.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return P.band;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: tintOf(color, 0.13),
        color: color,
        border: `1px solid ${tintOf(color, 0.32)}`,
      }}
    >
      {label}
    </span>
  );
}

function TicketCard({ ticket, index }: { ticket: Ticket; index: number }) {
  // The list endpoint strips message bodies, so derive a useful subtitle from
  // status instead of touching ticket.messages (which is undefined here).
  const preview =
    ticket.unreadCustomer > 0
      ? "You have a new reply on this ticket"
      : STATUS_HINT[ticket.status] || "No updates on this ticket yet";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.19, 1, 0.22, 1],
      }}
    >
      <Link href={`/tickets/${ticket.ticketId}`}>
        <motion.div
          whileHover={{ scale: 1.015 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative block cursor-pointer rounded-2xl p-5"
          style={{
            background: P.card,
            border: `1px solid ${P.border}`,
            boxShadow: P.shadow,
          }}
        >
          {ticket.unreadCustomer > 0 && (
            <span
              className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: P.bad,
                boxShadow: `0 0 0 4px ${P.badTint}`,
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
          )}

          <div
            className="flex flex-wrap items-center gap-2 px-5 py-3 -mx-5 -mt-5 mb-4 rounded-t-2xl"
            style={{ background: P.band, borderBottom: `1px solid ${P.border}` }}
          >
            <span
              className="text-xs font-mono font-bold"
              style={{ color: P.accentDeep }}
            >
              #{ticket.ticketId.slice(0, 8)}
            </span>
            <Badge
              label={STATUS_LABEL[ticket.status] || ticket.status}
              color={STATUS_COLOR[ticket.status] || P.muted}
            />
            <Badge
              label={PRIORITY_LABEL[ticket.priority] || ticket.priority}
              color={PRIORITY_COLOR[ticket.priority] || P.muted}
            />
            <Badge
              label={CATEGORY_LABEL[ticket.category] || ticket.category}
              color={P.faint}
            />
          </div>

          <h3
            className="mb-2 text-sm font-semibold leading-snug"
            style={{ color: P.text }}
          >
            {ticket.subject}
          </h3>

          <p
            className="mb-3 line-clamp-2 text-xs leading-relaxed"
            style={{ color: P.muted }}
          >
            {preview}
          </p>

          <div
            className="flex items-center justify-between text-xs"
            style={{ color: P.faint }}
          >
            <span>{STATUS_LABEL[ticket.status] || ticket.status}</span>
            <span>{relativeTime(ticket.lastReplyAt || ticket.createdAt)}</span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function TicketList() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", user?.email],
    queryFn: async () => {
      const res = await fetch(`${BACKEND}/api/tickets/my?email=${encodeURIComponent(user?.email || "")}`);
      const json = await res.json();
      return json.data?.tickets as Ticket[] || [];
    },
    enabled: !!user?.email,
  });

  const tickets = data ?? [];

  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
      `}</style>

      <TopNav onHome={() => navigate("/")} />

      <div
        className="min-h-screen rglow px-4 pt-10 pb-10 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            >
              {/* Section-header chip — the glyph is the page's subject: a ticket. */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: P.accentTint }}
                >
                  <TicketStub className="w-4 h-4" />
                </span>
                <h1
                  className="text-3xl font-black tracking-tight sm:text-4xl"
                  style={{ color: P.text }}
                >
                  Support Tickets
                </h1>
                {!isLoading && (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-black"
                    style={{ background: P.band, color: P.muted }}
                  >
                    {tickets.length}
                  </span>
                )}
              </div>
              <p
                className="mt-2 text-sm"
                style={{ color: P.muted }}
              >
                Track and manage your support requests
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
            >
              <Link href="/tickets/new">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl px-5 py-2.5 text-sm font-black"
                  style={{
                    background: P.accentDeep,
                    color: "#fff",
                    boxShadow: "0 6px 16px rgba(10,110,255,.35)",
                  }}
                >
                  + New Ticket
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {isLoading ? (
            /* A skeleton, not a pulse — it mirrors the real card grid so the
               page doesn't reflow the moment the query resolves. */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
              className="flex flex-col items-center justify-center py-20"
            >
              {/* §5 designed moment — the empty state shows the object itself:
                  a perforated ticket stub. No fake tickets, no fake dates. */}
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: P.band, border: `1px solid ${P.border}` }}
              >
                <TicketStub className="w-16 h-16" />
              </div>
              <h3
                className="mb-2 text-xl font-bold"
                style={{ color: P.text }}
              >
                No tickets yet
              </h3>
              <p
                className="mb-6 text-base"
                style={{ color: P.muted }}
              >
                Create a ticket and we'll get back to you.
              </p>
              <Link href="/tickets/new">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl px-5 py-2.5 text-sm font-black"
                  style={{
                    background: P.accentDeep,
                    color: "#fff",
                    boxShadow: "0 6px 16px rgba(10,110,255,.35)",
                  }}
                >
                  + New Ticket
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {tickets.map((ticket, i) => (
                <TicketCard key={ticket.ticketId} ticket={ticket} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
