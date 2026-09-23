import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/admin/context/AdminAuthContext";

const API = import.meta.env.VITE_BACKEND_URL || "";

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
  open: { bg: "rgba(59,167,255,0.15)", text: "#3BA7FF" },
  in_progress: { bg: "rgba(249,115,22,0.15)", text: "#f97316" },
  waiting: { bg: "rgba(255,197,61,0.15)", text: "#FFC53D" },
  resolved: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  closed: { bg: "rgba(99,119,132,0.15)", text: "#637784" },
};

const PRIORITY_COLORS: Record<TicketPriority, { bg: string; text: string }> = {
  low: { bg: "rgba(99,119,132,0.15)", text: "#637784" },
  medium: { bg: "rgba(59,167,255,0.15)", text: "#3BA7FF" },
  high: { bg: "rgba(249,115,22,0.15)", text: "#f97316" },
  urgent: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.19, 1, 0.22, 1] }}
      style={{
        background: "#1C2A34",
        border: "1px solid #2C414E",
        borderRadius: 12,
        padding: 16,
        flex: "1 1 0",
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#9BAEBB",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
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
        background: "#0C141B",
        border: "1px solid #2C414E",
        borderRadius: 8,
        padding: "7px 10px",
        fontSize: 13,
        color: "#F4F8FB",
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

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/panel/tickets/${ticketId}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      return json.data.ticket;
    },
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

  if (isLoading || !ticket) {
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
          background: "#18242D",
          borderLeft: "1px solid #2C414E",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#637784", fontSize: 14 }}>Loading ticket...</div>
      </motion.div>
    );
  }

  const sc = STATUS_COLORS[ticket.status];
  const pc = PRIORITY_COLORS[ticket.priority];

  const actionBtnBase: React.CSSProperties = {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid #2C414E",
    background: "#22333F",
    color: "#F4F8FB",
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
          background: "#18242D",
          borderLeft: "1px solid #2C414E",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #2C414E",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#637784", marginBottom: 2 }}>
              {truncate(ticket.ticketId, 16)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#F4F8FB" }}>
              {ticket.subject}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9BAEBB",
              fontSize: 20,
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
          >
            &#x2715;
          </button>
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #2C414E",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <Badge
            value={ticket.status.replace("_", " ")}
            colors={sc}
          />
          <Badge value={ticket.priority} colors={pc} />
          <span
            style={{
              fontSize: 12,
              color: "#9BAEBB",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {ticket.category}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "#9BAEBB",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {ticket.customerEmail}
          </span>
          {ticket.assignedAgent && (
            <span
              style={{
                fontSize: 12,
                color: "#3BA7FF",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Assigned: {ticket.assignedAgent}
            </span>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {ticket.messages.map((msg, i) => {
            const isAgent =
              msg.senderRole === "agent" || msg.senderRole === "admin";
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  alignSelf: isAgent ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#637784",
                    marginBottom: 4,
                    textAlign: isAgent ? "right" : "left",
                  }}
                >
                  {msg.sender} &middot; {timeAgo(msg.createdAt)}
                </div>
                <div
                  style={{
                    background: isAgent ? "#22333F" : "#1C2A34",
                    border: "1px solid #2C414E",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: "#F4F8FB",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div
          style={{
            padding: 16,
            borderTop: "1px solid #2C414E",
            flexShrink: 0,
          }}
        >
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type a reply..."
            rows={3}
            style={{
              width: "100%",
              background: "#0C141B",
              border: "1px solid #2C414E",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 14,
              color: "#F4F8FB",
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <button
              onClick={() => {
                if (replyText.trim()) replyMutation.mutate(replyText.trim());
              }}
              disabled={!replyText.trim() || replyMutation.isPending}
              style={{
                ...actionBtnBase,
                background: "#3BA7FF",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                opacity:
                  !replyText.trim() || replyMutation.isPending ? 0.5 : 1,
                cursor:
                  !replyText.trim() || replyMutation.isPending
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {replyMutation.isPending ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>
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

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<{
    tickets: Ticket[];
  }>({
    queryKey: ["tickets", activeFilter],
    queryFn: async () => {
      const url =
        activeFilter === "all"
          ? `${API}/api/panel/tickets/queue`
          : `${API}/api/panel/tickets/queue?status=${activeFilter}`;
      const res = await fetch(url, { headers: authHeaders() });
      const json = await res.json();
      return json.data;
    },
  });

  const tickets = ticketsData?.tickets || [];

  return (
    <div style={{ minHeight: "100vh", background: "#131C23", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#F4F8FB",
                margin: 0,
              }}
            >
              Ticket Dashboard
            </h1>
            <p
              style={{ fontSize: 14, color: "#9BAEBB", margin: "4px 0 0" }}
            >
              Manage and respond to support tickets
            </p>
          </div>
        </motion.div>

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
            color="#3BA7FF"
            delay={0}
          />
          <StatCard
            label="In Progress"
            value={stats?.inProgress ?? 0}
            color="#f97316"
            delay={0.05}
          />
          <StatCard
            label="Waiting"
            value={stats?.waiting ?? 0}
            color="#FFC53D"
            delay={0.1}
          />
          <StatCard
            label="Resolved"
            value={stats?.resolved ?? 0}
            color="#22C55E"
            delay={0.15}
          />
          <StatCard
            label="Closed"
            value={stats?.closed ?? 0}
            color="#637784"
            delay={0.2}
          />
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 999,
                  border: "1px solid",
                  borderColor: isActive ? "#3BA7FF" : "#2C414E",
                  background: isActive
                    ? "rgba(59,167,255,0.15)"
                    : "transparent",
                  color: isActive ? "#3BA7FF" : "#9BAEBB",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Ticket table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: [0.19, 1, 0.22, 1] }}
          style={{
            background: "#1C2A34",
            border: "1px solid #2C414E",
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
              borderBottom: "1px solid #2C414E",
              background: "#22333F",
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
                  color: "#637784",
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
                color: "#637784",
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
                color: "#637784",
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
                    borderBottom: "1px solid #2C414E",
                    cursor: "pointer",
                    transition: "background 0.12s",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#22333F")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9BAEBB",
                      fontFamily: "monospace",
                    }}
                  >
                    {truncate(ticket.ticketId, 8)}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#F4F8FB",
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
                      color: "#9BAEBB",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.customerEmail}
                  </div>
                  <div style={{ fontSize: 13, color: "#9BAEBB" }}>
                    {ticket.category}
                  </div>
                  <div>
                    <Badge value={ticket.priority} colors={pc} />
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: ticket.assignedAgent ? "#3BA7FF" : "#637784",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.assignedAgent || "Unassigned"}
                  </div>
                  <div style={{ fontSize: 12, color: "#637784" }}>
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
