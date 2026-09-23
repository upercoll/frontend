import { useState, useRef, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  Quote,
  Reply,
  Send,
  Paperclip,
  Eye,
  Bold,
  Italic,
  LinkIcon,
  ImageIcon,
  MoreHorizontal,
  Circle,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  User,
  Headphones,
} from "lucide-react";

const BACKEND =
  (import.meta.env.VITE_BACKEND_URL as string) || "";

interface TicketMessage {
  sender: "customer" | "agent" | "system";
  text: string;
  senderName: string;
  timestamp: string;
}

interface Ticket {
  ticketId: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  messages: TicketMessage[];
  createdAt: string;
}

function formatFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: typeof Circle }> = {
  open: { bg: "rgba(34,197,94,0.15)", text: "#22C55E", icon: CheckCircle },
  in_progress: { bg: "rgba(59,167,255,0.15)", text: "#3BA7FF", icon: Clock },
  waiting: { bg: "rgba(255,197,61,0.15)", text: "#FFC53D", icon: Clock },
  resolved: { bg: "rgba(99,119,132,0.15)", text: "#637784", icon: CheckCircle },
  closed: { bg: "rgba(99,119,132,0.15)", text: "#637784", icon: XCircle },
};

const CATEGORY_LABEL: Record<string, string> = {
  delivery: "Delivery",
  payment: "Payment",
  technical: "Technical",
  order_issue: "Order Issue",
  general: "General",
  account: "Account",
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "#637784" },
  medium: { label: "Medium", color: "#3BA7FF" },
  high: { label: "High", color: "#F59E0B" },
  urgent: { label: "Urgent", color: "#ef4444" },
};

function Skeleton() {
  return (
    <div className="flex min-h-screen flex-col pt-24" style={{ background: "#131C23" }}>
      <div className="border-b px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-4 w-20 animate-pulse rounded" style={{ background: "#1C2A34" }} />
      </div>
      <div className="flex-1 space-y-6 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-12 w-12 animate-pulse rounded-xl" style={{ background: "#1C2A34" }} />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-32 animate-pulse rounded" style={{ background: "#1C2A34" }} />
              <div className="h-20 w-full animate-pulse rounded-xl" style={{ background: "#1C2A34" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostAvatar({ sender }: { sender: string }) {
  if (sender === "agent") {
    return (
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ border: "2px solid #3BA7FF", boxShadow: "0 3px 0 #1a6bbf" }}
      >
        <img src="/staff-avatar.webp" alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (sender === "system") {
    return (
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: "#637784", boxShadow: "0 3px 0 #4a5d6a" }}
      >
        <Shield size={20} color="#fff" />
      </div>
    );
  }
  return (
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ border: "2px solid #22C55E", boxShadow: "0 3px 0 #188c46" }}
    >
      <img src="/customer-avatar.png" alt="" className="h-full w-full object-cover" />
    </div>
  );
}

function PostAuthor({ msg }: { msg: TicketMessage }) {
  const roleLabel =
    msg.sender === "agent"
      ? "Support Agent"
      : msg.sender === "system"
      ? "System"
      : "Customer";
  const roleColor = "#F4F8FB";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold" style={{ color: "#F4F8FB" }}>
        {msg.senderName || roleLabel}
      </span>
      <span
        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: roleColor + "20", color: roleColor }}
      >
        {roleLabel}
      </span>
    </div>
  );
}

export default function TicketThread() {
  const [, params] = useRoute("/tickets/:ticketId");
  const ticketId = params?.ticketId ?? "";
  const { user } = useAuth();
  const email = user?.email || "";
  const queryClient = useQueryClient();

  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const res = await fetch(`${BACKEND}/api/tickets/${ticketId}?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (!json.success) throw new Error("Failed to load ticket");
      return json.data.ticket as Ticket;
    },
    enabled: !!ticketId && !!email,
    refetchInterval: 15000,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`${BACKEND}/api/tickets/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, customerEmail: email, text }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BACKEND}/api/tickets/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, customerEmail: email }),
      });
      if (!res.ok) throw new Error("Failed to close ticket");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
  });

  useEffect(() => {
    if (data?.messages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.messages?.length]);

  const handleSend = () => {
    const trimmed = reply.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      wrapSelection("**", "**");
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "i") {
      e.preventDefault();
      wrapSelection("_", "_");
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      insertLink();
    }
  };

  const wrapSelection = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = reply.substring(start, end);
    const newText =
      reply.substring(0, start) +
      before +
      (selected || "text") +
      after +
      reply.substring(end);
    setReply(newText);
    setTimeout(() => {
      ta.focus();
      if (selected) {
        ta.setSelectionRange(start + before.length, end + before.length);
      } else {
        ta.setSelectionRange(start + before.length, start + before.length + 4);
      }
    }, 0);
  };

  const insertLink = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const url = prompt("Enter URL:");
    if (!url) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = reply.substring(start, end) || "link text";
    const newText =
      reply.substring(0, start) +
      "[" +
      selected +
      "](" +
      url +
      ")" +
      reply.substring(end);
    setReply(newText);
    setTimeout(() => ta.focus(), 0);
  };

  const insertImage = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const url = prompt("Enter image URL:");
    if (!url) return;
    const start = ta.selectionStart;
    const newText =
      reply.substring(0, start) +
      "\n![image](" +
      url +
      ")\n" +
      reply.substring(start);
    setReply(newText);
    setTimeout(() => ta.focus(), 0);
  };

  if (isLoading) return <Skeleton />;

  if (isError || !data) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 pt-24"
        style={{ background: "#131C23" }}
      >
        <p className="text-sm" style={{ color: "#9BAEBB" }}>
          Ticket not found or failed to load.
        </p>
        <Link
          href="/tickets"
          className="text-sm font-medium transition-colors hover:underline"
          style={{ color: "#3BA7FF" }}
        >
          &larr; Back to Tickets
        </Link>
      </div>
    );
  }

  const canClose =
    data.status === "open" || data.status === "in_progress";
  const st = STATUS_CONFIG[data.status] || STATUS_CONFIG.open;
  const StatusIcon = st.icon;
  const pr = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.medium;

  return (
    <div className="min-h-screen" style={{ background: "#131C23" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: "#0F1920", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Link
            href="/tickets"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
            style={{ color: "#9BAEBB" }}
          >
            <ArrowLeft size={14} />
            Back to Tickets
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1
                className="truncate text-lg font-bold sm:text-xl"
                style={{ color: "#F4F8FB" }}
              >
                {data.subject}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: st.bg, color: st.text }}
                >
                  <StatusIcon size={12} />
                  {data.status.replace("_", " ")}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wider"
                  style={{ background: "rgba(59,167,255,0.12)", color: "#3BA7FF" }}
                >
                  {CATEGORY_LABEL[data.category] || data.category}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: pr.color + "18", color: pr.color }}
                >
                  {pr.label}
                </span>
                <span className="text-xs" style={{ color: "#637784" }}>
                  #{data.ticketId.slice(0, 8)}
                </span>
              </div>
            </div>

            {canClose && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50"
                style={{
                  background: "transparent",
                  border: "1.5px solid #ef4444",
                  color: "#ef4444",
                  boxShadow: "0 3px 0 0 rgba(239,68,68,0.3)",
                }}
              >
                <XCircle size={14} />
                {closeMutation.isPending ? "Closing..." : "Close Ticket"}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="space-y-1">
          <AnimatePresence>
            {data.messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                {msg.sender === "system" ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <span
                      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                      style={{ background: "#18242D", color: "#637784" }}
                    >
                      <Shield size={12} />
                      {msg.text}
                    </span>
                    <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                  </div>
                ) : (
                  <div
                    className="py-5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {/* Post header */}
                    <div className="mb-3 flex items-start gap-3">
                      <PostAvatar sender={msg.sender} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <PostAuthor msg={msg} />
                        </div>
                        <span
                          className="mt-0.5 text-xs"
                          style={{ color: "#637784" }}
                        >
                          {relativeTime(msg.timestamp)} · {formatFull(msg.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Post content */}
                    <div
                      className="mb-3 text-[15px] leading-[1.7] sm:pl-15"
                      style={{ color: "#D1D5DB" }}
                    >
                      {msg.text.split("\n").map((line, li) => {
                        let html = line
                          .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
                          .replace(/_(.+?)_/g, "<i>$1</i>")
                          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#3BA7FF;font-weight:600;text-decoration:none">$1</a>')
                          .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin-top:8px" />');
                        return (
                          <p key={li} className={li > 0 ? "mt-3" : ""}>
                            <span dangerouslySetInnerHTML={{ __html: html }} />
                          </p>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-4 sm:pl-15"
                    >
                      <button
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:brightness-125"
                        style={{ color: "#637784" }}
                      >
                        <AlertTriangle size={13} />
                        Report
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:brightness-125"
                        style={{ color: "#637784" }}
                      >
                        <Quote size={13} />
                        Quote
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:brightness-125"
                        style={{ color: "#3BA7FF" }}
                        onClick={() => {
                          textareaRef.current?.focus();
                          setReply((prev) => prev + `> ${msg.text.split("\n")[0]}\n\n`);
                        }}
                      >
                        <Reply size={13} />
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Reply editor */}
      {data.status !== "closed" && (
        <div
          className="sticky bottom-0 border-t"
          style={{ background: "#0F1920", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
            <div
              className="overflow-hidden rounded-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {/* Toolbar */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: "#151B27", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => wrapSelection("**", "**")}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                    style={{ color: "#9BAEBB" }}
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    onClick={() => wrapSelection("_", "_")}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                    style={{ color: "#9BAEBB" }}
                  >
                    <Italic size={16} />
                  </button>
                  <div className="h-4 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <button
                    onClick={insertLink}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                    style={{ color: "#9BAEBB" }}
                  >
                    <LinkIcon size={16} />
                  </button>
                  <button
                    onClick={insertImage}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                    style={{ color: "#9BAEBB" }}
                  >
                    <ImageIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: "#637784" }}>
                    ⌘ + Enter to send
                  </span>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative" style={{ background: "#131C23" }}>
                <textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write your reply..."
                  rows={4}
                  className="w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:opacity-40"
                  style={{ color: "#F4F8FB", minHeight: 120 }}
                />
              </div>

              {/* Bottom bar */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: "#151B27", borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <button
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:brightness-125"
                    style={{ color: "#637784" }}
                  >
                    <Paperclip size={14} />
                    Attach files
                  </button>
                  <button
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:brightness-125"
                    style={{ color: "#637784" }}
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSend}
                  disabled={!reply.trim() || sendMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-40"
                  style={{
                    background: "#3BA7FF",
                    color: "#fff",
                    boxShadow: "0 4px 0 0 #1a6bbf",
                  }}
                >
                  {sendMutation.isPending ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Send size={16} />
                  )}
                  Send Reply
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
