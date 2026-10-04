import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Info, Lock } from "lucide-react";

/**
 * Chat primitives lifted straight out of the Support Tickets system so every
 * conversation in the panel — support tickets, claim chats, agent queues,
 * deliverer queues, open chats — looks and behaves identically.
 *
 * Visual rules copied verbatim from TicketDashboard:
 *   • bubbles: flat surface fill + 1px border, radius 10, 10/14 padding,
 *     14px/1.55 — both sides styled the SAME, only the alignment differs
 *   • author line ABOVE the bubble, 11px tertiary, aligned to the bubble
 *   • composer: 3-row textarea, radius 10, then a right-aligned 13px button
 */

export interface ThreadMessage {
  _id?: string;
  id?: string;
  sender?: string;
  senderRole?: string;
  senderName?: string;
  text?: string;
  message?: string;
  timestamp?: string;
  createdAt?: string;
}

export function threadTimeAgo(dateStr?: string | null) {
  if (!dateStr) return "—";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function threadMessageText(m: ThreadMessage) {
  return m.text ?? m.message ?? "";
}

const ACTION_BTN: React.CSSProperties = {
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

/* ------------------------------------------------------------------ */
/* Thread panel — header meta row, messages, composer                 */
/* ------------------------------------------------------------------ */

export function ThreadPanel({
  meta,
  messages,
  draft,
  onDraftChange,
  onSend,
  sending = false,
  sendLabel = "Send Reply",
  placeholder = "Type a reply...",
  readOnly = false,
  readOnlyNote,
  notices = [],
  isStaff,
  emptyLabel = "No messages yet.",
  autoScroll = true,
  rows = 3,
  className,
}: {
  /** Badge/meta row content (status pills, email, assignee…) */
  meta?: React.ReactNode;
  messages: ThreadMessage[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  sending?: boolean;
  sendLabel?: string;
  placeholder?: string;
  readOnly?: boolean;
  readOnlyNote?: React.ReactNode;
  notices?: React.ReactNode[];
  /** decides which side a message sits on; defaults to sender === "agent" */
  isStaff?: (m: ThreadMessage) => boolean;
  emptyLabel?: string;
  autoScroll?: boolean;
  rows?: number;
  /** lets a parent own the flex sizing (e.g. `flex-1` inside a column) */
  className?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const staff = isStaff || ((m: ThreadMessage) => (m.senderRole || m.sender) === "agent" || (m.senderRole || m.sender) === "admin");
  const canSend = draft.trim().length > 0 && !sending && !readOnly;

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ block: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        ...(className ? {} : { flex: 1 }),
      }}
    >
      {/* Meta / badges row */}
      {meta && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--pn-border)",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {meta}
        </div>
      )}

      {/* Messages */}
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
        {notices.map((n, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center" }}>
            {n}
          </div>
        ))}

        {messages.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--pn-text-3)", fontSize: 13 }}>
            {emptyLabel}
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSystem = (msg.senderRole || msg.sender) === "system";
            if (isSystem) {
              return (
                <motion.div
                  key={msg._id || msg.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      color: "var(--pn-text-3)",
                      background: "var(--pn-surface-2)",
                      border: "1px solid var(--pn-border)",
                      borderRadius: 999,
                      padding: "4px 12px",
                      maxWidth: "90%",
                    }}
                  >
                    <Info size={11} style={{ flexShrink: 0 }} />
                    {threadMessageText(msg)}
                  </div>
                </motion.div>
              );
            }

            const mine = staff(msg);
            const author = msg.senderName || msg.sender || msg.senderRole || (mine ? "Support" : "Customer");
            return (
              <motion.div
                key={msg._id || msg.id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "85%" }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--pn-text-3)",
                    marginBottom: 4,
                    textAlign: mine ? "right" : "left",
                  }}
                >
                  {author} &middot; {threadTimeAgo(msg.timestamp || msg.createdAt)}
                </div>
                <div
                  style={{
                    background: "var(--pn-surface)",
                    border: "1px solid var(--pn-border)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: "var(--pn-text)",
                    wordBreak: "break-word",
                  }}
                >
                  {threadMessageText(msg)}
                </div>
              </motion.div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {readOnly ? (
        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--pn-border)",
            textAlign: "center",
            flexShrink: 0,
            color: "var(--pn-text-3)",
            fontSize: 12,
          }}
        >
          {readOnlyNote ?? (
            <>
              <Lock size={12} style={{ verticalAlign: "-1px", marginRight: 4 }} />
              This conversation is read-only
            </>
          )}
        </div>
      ) : (
        <div style={{ padding: 16, borderTop: "1px solid var(--pn-border)", flexShrink: 0 }}>
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
            placeholder={placeholder}
            rows={rows}
            style={{
              width: "100%",
              background: "var(--pn-surface)",
              border: "1px solid var(--pn-border)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 14,
              color: "var(--pn-text)",
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 8 }}>
            {sending && (
              <span style={{ fontSize: 12, color: "var(--pn-text-3)", marginRight: 8 }}>Sending…</span>
            )}
            <button
              onClick={() => { if (canSend) onSend(); }}
              disabled={!canSend}
              style={{
                ...ACTION_BTN,
                background: "var(--pn-action)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                opacity: canSend ? 1 : 0.5,
                cursor: canSend ? "pointer" : "not-allowed",
              }}
            >
              {sending ? "Sending..." : sendLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Thread table — the ticket system's list look, reused for every      */
/* conversation list (grid columns + uppercase micro headers).          */
/* ------------------------------------------------------------------ */

export interface ThreadColumn<T> {
  key: string;
  header: string;
  /** grid track sizing, e.g. "1fr" or "120px" */
  width: string;
  render: (row: T) => React.ReactNode;
}

export function ThreadTable<T>({
  columns,
  rows,
  rowKey,
  selectedKey,
  onSelect,
  loading = false,
  emptyLabel = "Nothing here yet.",
  loadingLabel = "Loading…",
}: {
  columns: ThreadColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  selectedKey?: string | null;
  onSelect: (row: T) => void;
  loading?: boolean;
  emptyLabel?: string;
  loadingLabel?: string;
}) {
  const gridTemplateColumns = columns.map((c) => c.width).join(" ");

  return (
    <div
      style={{
        background: "var(--pn-surface)",
        border: "1px solid var(--pn-border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns,
          gap: 12,
          padding: "12px 20px",
          borderBottom: "1px solid var(--pn-border)",
          background: "var(--pn-surface)",
        }}
      >
        {columns.map((c) => (
          <div
            key={c.key}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--pn-text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {c.header}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--pn-text-3)", fontSize: 14 }}>
          {loadingLabel}
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--pn-text-3)", fontSize: 14 }}>
          {emptyLabel}
        </div>
      ) : (
        rows.map((row, i) => {
          const key = rowKey(row);
          const selected = selectedKey === key;
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => onSelect(row)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.2) }}
              style={{
                display: "grid",
                gridTemplateColumns,
                gap: 12,
                padding: "14px 20px",
                borderBottom: "1px solid var(--pn-border)",
                background: selected ? "var(--pn-surface-2)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                border: "none",
                borderBottomWidth: 1,
                borderBottomStyle: "solid",
                borderBottomColor: "var(--pn-border)",
              }}
            >
              {columns.map((c) => (
                <div key={c.key} style={{ minWidth: 0 }}>{c.render(row)}</div>
              ))}
            </motion.button>
          );
        })
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tiny status pill matching the ticket system's Badge look            */
/* ------------------------------------------------------------------ */

export function ThreadBadge({
  label,
  bg,
  fg,
}: {
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        background: bg,
        color: fg,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

/** Meta chip used in the thread header row (email, assignee, category…). */
export function ThreadMeta({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        color: "var(--pn-text-3)",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        minWidth: 0,
      }}
    >
      {children}
    </span>
  );
}