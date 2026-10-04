import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/admin/context/AdminAuthContext";
import { MetricTile, PageHeader, Segmented } from "../components/kit";
import { MessageSquare } from "lucide-react";
import { ThreadPanel, ThreadBadge, ThreadMeta } from "../components/ChatThread";
import type { ThreadMessage } from "../components/ChatThread";


// Same fallback as admin/api.ts — if a deployment only sets VITE_BACKEND_URL the
// dashboard used to build relative URLs and silently fetch nothing.
const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";

function getToken() {
  return localStorage.getItem("panel_token");
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + getToken(),
  };
}

type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketMessage {
  id: string;
  sender: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

interface Ticket {
  ticketId: string;
  subject: string;
  customerEmail: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgent?: string;
  assignedAgentId?: string;
  messages: TicketMessage[];
  lastReplyTime?: string;
  createdAt: string;
}

interface TicketStats {
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
}

const STATUS_COLORS: Record<TicketStatus, { bg: string; text: string }> = {
  open: { bg: "var(--pn-action-tint)", text: "var(--pn-action)" },
  in_progress: { bg: "rgba(249,115,22,0.15)", text: "#c2410c" },
  waiting: { bg: "var(--pn-warning-bg)", text: "#b78103" },
  resolved: { bg: "rgba(34,197,94,0.15)", text: "var(--pn-success-fg)" },
  closed: { bg: "rgba(99,119,132,0.15)", text: "var(--pn-text-3)" },
};

const PRIORITY_COLORS: Record<TicketPriority, { bg: string; text: string }> = {
  low: { bg: "rgba(99,119,132,0.15)", text: "var(--pn-text-3)" },
  medium: { bg: "var(--pn-action-tint)", text: "var(--pn-action)" },
  high: { bg: "rgba(249,115,22,0.15)", text: "#c2410c" },
  urgent: { bg: "var(--pn-critical-bg)", text: "var(--pn-critical-text)" },
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return "\u2014";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "\u2026" : str;
}

const FILTER_TABS: { key: string; label: string; status?: TicketStatus }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open", status: "open" },
  { key: "in_progress", label: "In Progress", status: "in_progress" },
  { key: "waiting", label: "Waiting", status: "waiting" },
  { key: "resolved", label: "Resolved", status: "resolved" },
  { key: "closed", label: "Closed", status: "closed" },
];

function StatCard({
  label,
  value,
  color,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.19, 1, 0.22, 1] }}
      className="flex-1 min-w-[150px]"
    >
      <MetricTile
        label={label}
        value={<span style={{ color }}>{value}</span>}
      />
    </motion.div>
  );
}

function Badge({
  value,
  colors,
}: {
  value: string;
  colors: { bg: string; text: string };
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: colors.bg,
        color: colors.text,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: colors.text,
          flexShrink: 0,
        }}
      />
      {value}
    </span>
  );
}

function SelectDropdown({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "var(--pn-surface)",
        border: "1px solid var(--pn-border)",
        borderRadius: 8,
        padding: "7px 10px",
        fontSize: 13,
        color: "var(--pn-text)",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TicketSidePanel({
  ticketId,
  onClose,
}: {
  ticketId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useAdminAuth();
  const [replyText, setReplyText] = useState("");
  const [resolutionText, setResolutionText] = useState("");

  const { data: ticket, isLoading, isError } = useQuery<Ticket>({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/panel/tickets/${ticketId}`, {
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || `Failed to load ticket (${res.status})`);
      return json.data;
    },
    retry: 1,
  });

  const replyMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`${API}/api/panel/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Reply failed");
      return res.json();
    },
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: TicketStatus) => {
      const res = await fetch(
        `${API}/api/panel/tickets/${ticketId}/status`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Status update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticketStats"] });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: async (priority: TicketPriority) => {
      const res = await fetch(
        `${API}/api/panel/tickets/${ticketId}/priority`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ priority }),
        }
      );
      if (!res.ok) throw new Error("Priority update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(`${API}/api/panel/tickets/${ticketId}/assign`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          agentId,
          agentName: user?.name || user?.email || "Agent",
        }),
      });
      if (!res.ok) throw new Error("Assign failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (resolution: string) => {
      const res = await fetch(
        `${API}/api/panel/tickets/${ticketId}/resolve`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ resolution }),
        }
      );
      if (!res.ok) throw new Error("Resolve failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticketStats"] });
    },
  });

  if (isLoading || isError || !ticket) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 520,
          maxWidth: "100vw",
          background: "var(--pn-surface)",
          borderLeft: "1px solid var(--pn-border)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ color: isError ? "var(--pn-critical-text)" : "var(--pn-text-3)", fontSize: 14 }}>
          {isError ? "Couldn't load this ticket." : "Loading ticket..."}
        </div>
        {isError && (
          <button onClick={onClose} style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)",
            color: "var(--pn-text-2)", cursor: "pointer",
          }}>Close</button>
        )}
      </motion.div>
    );
  }

  const sc = STATUS_COLORS[ticket.status];
  const pc = PRIORITY_COLORS[ticket.priority];

  const actionBtnBase: React.CSSProperties = {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid var(--pn-border)",
    background: "var(--pn-surface)",
    color: "var(--pn-text)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.15s",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 999,
        }}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 520,
          maxWidth: "100vw",
          background: "var(--pn-surface)",
          borderLeft: "1px solid var(--pn-border)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--pn-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "var(--pn-text-3)", marginBottom: 2 }}>
              {truncate(ticket.ticketId, 16)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--pn-text)" }}>
              {ticket.subject}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--pn-text-3)",
              fontSize: 20,
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
          >
            &#x2715;
          </button>
        </div>

        {/* Ticket actions */}
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid var(--pn-border)",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {(["open", "in_progress", "waiting", "resolved", "closed"] as TicketStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => statusMutation.mutate(st)}
              disabled={statusMutation.isPending || ticket.status === st}
              style={{
                ...actionBtnBase,
                fontSize: 12,
                textTransform: "capitalize",
                background: ticket.status === st ? "var(--pn-action-tint)" : "var(--pn-surface)",
                border: `1px solid ${ticket.status === st ? "var(--pn-action-border)" : "var(--pn-border)"}`,
                color: ticket.status === st ? "var(--pn-action)" : "var(--pn-text-2)",
                opacity: ticket.status === st ? 1 : 0.85,
              }}
            >
              {st.replace("_", " ")}
            </button>
          ))}

          <span style={{ width: 10 }} />

          {/* Assign to me — the assign endpoint needs an agentId */}
          <button
            onClick={() => user?.id && assignMutation.mutate(String(user.id))}
            disabled={!user?.id || assignMutation.isPending || ticket.assignedAgent === (user?.name || user?.email)}
            title="Assign this ticket to yourself"
            style={{
              ...actionBtnBase,
              fontSize: 12,
              background: "var(--pn-surface)",
              color: "var(--pn-text-2)",
              opacity: !user?.id ? 0.5 : 1,
            }}
          >
            {assignMutation.isPending ? "Assigning..." : "Assign to me"}
          </button>

          {(["low", "medium", "high", "urgent"] as TicketPriority[]).map((pr) => (
            <button
              key={pr}
              onClick={() => priorityMutation.mutate(pr)}
              disabled={priorityMutation.isPending || ticket.priority === pr}
              style={{
                ...actionBtnBase,
                fontSize: 12,
                textTransform: "capitalize",
                background: ticket.priority === pr ? PRIORITY_COLORS[pr].bg : "var(--pn-surface)",
                border: `1px solid var(--pn-border)`,
                color: ticket.priority === pr ? PRIORITY_COLORS[pr].text : "var(--pn-text-2)",
              }}
            >
              {pr}
            </button>
          ))}
        </div>

        {/* Resolution / assign strip */}
        {ticket.status !== "closed" && (
          <div
            style={{
              padding: "10px 20px",
              borderBottom: "1px solid var(--pn-border)",
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <input
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Resolution note (optional)"
              style={{
                flex: 1,
                minWidth: 0,
                background: "var(--pn-surface)",
                border: "1px solid var(--pn-border)",
                borderRadius: 8,
                padding: "7px 12px",
                fontSize: 13,
                color: "var(--pn-text)",
                outline: "none",
              }}
            />
            <button
              onClick={() => resolveMutation.mutate(resolutionText.trim() || "Resolved")}
              disabled={resolveMutation.isPending}
              style={{
                ...actionBtnBase,
                background: "var(--pn-action)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                opacity: resolveMutation.isPending ? 0.5 : 1,
              }}
            >
              {resolveMutation.isPending ? "Resolving..." : "Resolve"}
            </button>
          </div>
        )}

        <ThreadPanel
          className="flex-1"
          messages={ticket.messages as unknown as ThreadMessage[]}
          draft={replyText}
          onDraftChange={setReplyText}
          onSend={() => {
            if (replyText.trim()) replyMutation.mutate(replyText.trim());
          }}
          sending={replyMutation.isPending}
          sendLabel="Send Reply"
          placeholder="Type a reply..."
          isStaff={(m) => m.senderRole === "agent" || m.senderRole === "admin"}
          meta={
            <>
              <ThreadBadge
                label={ticket.status.replace("_", " ")}
                bg={sc.bg}
                fg={sc.text}
              />
              <ThreadBadge label={ticket.priority} bg={pc.bg} fg={pc.text} />
              <ThreadMeta>{ticket.category}</ThreadMeta>
              <ThreadMeta>{ticket.customerEmail}</ThreadMeta>
              {ticket.assignedAgent && (
                <ThreadMeta>
                  <span style={{ color: "var(--pn-action)" }}>
                    Assigned: {ticket.assignedAgent}
                  </span>
                </ThreadMeta>
              )}
            </>
          }
        />
      </motion.div>
    </>
  );
}

export default function TicketDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAdminAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<TicketStats>({
    queryKey: ["ticketStats"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/panel/tickets/stats`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      return json.data;
    },
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<
    Ticket[] | { tickets?: Ticket[]; total?: number }
  >({
    queryKey: ["tickets", activeFilter],
    queryFn: async () => {
      const url =
        activeFilter === "all"
          ? `${API}/api/panel/tickets/queue`
          : `${API}/api/panel/tickets/queue?status=${activeFilter}`;
      const res = await fetch(url, { headers: authHeaders() });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || `Failed to load tickets (${res.status})`);
      return json.data;
    },
  });

  const tickets: Ticket[] = Array.isArray(ticketsData)
    ? ticketsData
    : ticketsData?.tickets || [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--pn-bg)", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <PageHeader
          icon={MessageSquare}
          title="Ticket Dashboard"
          description="Manage and respond to support tickets"
          className="mb-6"
        />

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <StatCard
            label="Open"
            value={stats?.open ?? 0}
            color="var(--pn-action)"
            delay={0}
          />
          <StatCard
            label="In Progress"
            value={stats?.inProgress ?? 0}
            color="#c2410c"
            delay={0.05}
          />
          <StatCard
            label="Waiting"
            value={stats?.waiting ?? 0}
            color="#b78103"
            delay={0.1}
          />
          <StatCard
            label="Resolved"
            value={stats?.resolved ?? 0}
            color="var(--pn-success-fg)"
            delay={0.15}
          />
          <StatCard
            label="Closed"
            value={stats?.closed ?? 0}
            color="var(--pn-text-3)"
            delay={0.2}
          />
        </div>

        <Segmented
          value={activeFilter}
          onChange={(v) => setActiveFilter(v)}
          options={FILTER_TABS.map((t) => ({ value: t.key, label: t.label }))}
          className="mb-5"
        />


        {/* Ticket table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: [0.19, 1, 0.22, 1] }}
          style={{
            background: "var(--pn-surface)",
            border: "1px solid var(--pn-border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "100px 1fr 160px 120px 90px 120px 100px 100px",
              gap: 12,
              padding: "12px 20px",
              borderBottom: "1px solid var(--pn-border)",
              background: "var(--pn-surface)",
            }}
          >
            {[
              "ID",
              "Subject",
              "Customer",
              "Category",
              "Priority",
              "Agent",
              "Last Reply",
              "Status",
            ].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--pn-text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {ticketsLoading ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--pn-text-3)",
                fontSize: 14,
              }}
            >
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--pn-text-3)",
                fontSize: 14,
              }}
            >
              No tickets found
            </div>
          ) : (
            tickets.map((ticket, i) => {
              const sc = STATUS_COLORS[ticket.status];
              const pc = PRIORITY_COLORS[ticket.priority];
              return (
                <motion.div
                  key={ticket.ticketId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedTicketId(ticket.ticketId)}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "100px 1fr 160px 120px 90px 120px 100px 100px",
                    gap: 12,
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--pn-border)",
                    cursor: "pointer",
                    transition: "background 0.12s",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--pn-surface)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--pn-text-3)",
                      fontFamily: "monospace",
                    }}
                  >
                    {truncate(ticket.ticketId, 8)}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--pn-text)",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.subject}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--pn-text-3)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.customerEmail}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--pn-text-3)" }}>
                    {ticket.category}
                  </div>
                  <div>
                    <Badge value={ticket.priority} colors={pc} />
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: ticket.assignedAgent ? "var(--pn-action)" : "var(--pn-text-3)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.assignedAgent || "Unassigned"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--pn-text-3)" }}>
                    {timeAgo(ticket.lastReplyTime)}
                  </div>
                  <div>
                    <Badge
                      value={ticket.status.replace("_", " ")}
                      colors={sc}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* Side panel */}
      <AnimatePresence>
        {selectedTicketId && (
          <TicketSidePanel
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
