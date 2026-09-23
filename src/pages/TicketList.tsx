import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const STATUS_COLOR: Record<string, string> = {
  open: "#3BA7FF",
  in_progress: "#FFC53D",
  waiting: "#f97316",
  resolved: "#22C55E",
  closed: "#637784",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "#3BA7FF",
  medium: "#FFC53D",
  high: "#f97316",
  urgent: "#ef4444",
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
  messages: TicketMessage[];
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

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: "rgba(255,255,255,0.2)",
        color: "#F4F8FB",
        border: "1px solid rgba(255,255,255,0.3)",
      }}
    >
      {label}
    </span>
  );
}

function TicketCard({ ticket, index }: { ticket: Ticket; index: number }) {
  const preview =
    ticket.messages.length > 0
      ? ticket.messages[ticket.messages.length - 1].message
      : "No messages yet";

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
          className="relative block cursor-pointer rounded-2xl border p-5"
          style={{
            backgroundColor: "#111820",
            border: "1.5px solid rgba(255,255,255,0.35)",
          }}
        >
          {ticket.unreadCustomer > 0 && (
            <span
              className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: "#ef4444",
                boxShadow: "0 0 8px 2px rgba(239,68,68,0.4)",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
          )}

          <div
            className="flex flex-wrap items-center gap-2 px-5 py-3 -mx-5 -mt-5 mb-4 rounded-t-2xl"
            style={{ background: "#3BA7FF", borderBottom: "1px solid #2a8de6", boxShadow: "0 4px 0 0 #1a6bbf" }}
          >
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#F4F8FB" }}
            >
              #{ticket.ticketId.slice(0, 8)}
            </span>
            <Badge
              label={STATUS_LABEL[ticket.status] || ticket.status}
              color={STATUS_COLOR[ticket.status] || "#637784"}
            />
            <Badge
              label={PRIORITY_LABEL[ticket.priority] || ticket.priority}
              color={PRIORITY_COLOR[ticket.priority] || "#637784"}
            />
            <Badge
              label={CATEGORY_LABEL[ticket.category] || ticket.category}
              color="#9BAEBB"
            />
          </div>

          <h3
            className="mb-2 text-sm font-semibold leading-snug"
            style={{ color: "#F4F8FB" }}
          >
            {ticket.subject}
          </h3>

          <p
            className="mb-3 line-clamp-2 text-xs leading-relaxed"
            style={{ color: "#9BAEBB" }}
          >
            {preview}
          </p>

          <div
            className="flex items-center justify-between text-xs"
            style={{ color: "#637784" }}
          >
            <span>
              {ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}
            </span>
            <span>{relativeTime(ticket.lastReplyAt || ticket.createdAt)}</span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-2xl border p-5"
      style={{ backgroundColor: "#111820", border: "2px solid #F4F8FB" }}
    >
      <div className="mb-3 flex gap-2">
        <div className="h-4 w-16 rounded-full" style={{ backgroundColor: "#2C414E" }} />
        <div className="h-4 w-14 rounded-full" style={{ backgroundColor: "#2C414E" }} />
        <div className="h-4 w-12 rounded-full" style={{ backgroundColor: "#2C414E" }} />
      </div>
      <div className="mb-2 h-4 w-3/4 rounded" style={{ backgroundColor: "#2C414E" }} />
      <div className="mb-3 h-3 w-full rounded" style={{ backgroundColor: "#2C414E" }} />
      <div className="h-3 w-1/3 rounded" style={{ backgroundColor: "#2C414E" }} />
    </div>
  );
}

export default function TicketList() {
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

      <div
        className="min-h-screen px-4 pt-28 pb-10 sm:px-6 lg:px-8"
        style={{ backgroundColor: "#131C23" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            >
              <h1
                className="text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ color: "#F4F8FB" }}
              >
                Support Tickets
              </h1>
              <p
                className="mt-2 text-sm"
                style={{ color: "#9BAEBB" }}
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
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold"
                  style={{
                    backgroundColor: "#3BA7FF",
                    color: "#F4F8FB",
                    boxShadow: "0 4px 0 0 #1a6bbf",
                  }}
                >
                  + New Ticket
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {isLoading ? (
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
              <img src="/IMG_0732.png" alt="" className="w-24 h-24 object-contain mb-4" />
              <h3
                className="mb-2 text-xl font-bold"
                style={{ color: "#F4F8FB" }}
              >
                No tickets yet
              </h3>
              <p
                className="mb-6 text-base"
                style={{ color: "#9BAEBB" }}
              >
                Create a ticket and we'll get back to you.
              </p>
              <Link href="/tickets/new">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold"
                  style={{
                    backgroundColor: "#3BA7FF",
                    color: "#F4F8FB",
                    boxShadow: "0 4px 0 0 #1a6bbf",
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
    </>
  );
}
