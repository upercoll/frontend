import { useState, useRef, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
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
import { RBstar, TicketStub } from "@/components/Art";
import { P } from "@/lib/storefront";
import { TopNav, SiteFooter } from "./Home";

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

/* Status words are the backend's; only their colours are ours. One meaning
   per colour: blue = live, amber = needs a reply, mint = done, red = closed. */
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: typeof Circle }> = {
  open: { bg: P.accentTint, text: P.accentDeep, icon: CheckCircle },
  in_progress: { bg: P.accentTint, text: P.accentDeep, icon: Clock },
  waiting: { bg: P.warnTint, text: P.warn, icon: Clock },
  resolved: { bg: P.goodTint, text: P.good, icon: CheckCircle },
  closed: { bg: P.badTint, text: P.bad, icon: XCircle },
};

/* The two sides of the thread. The customer (you) is filled brand blue with
   white text; staff and system are a neutral band chip with a hairline — the
   same distinction the message sides need, carried by the role tag. */
const ROLE_CHIP: Record<string, { bg: string; fg: string; border?: string }> = {
  customer: { bg: P.accentDeep, fg: "#fff" },
  agent: { bg: P.band, fg: P.text, border: P.border },
  system: { bg: P.band, fg: P.muted, border: P.border },
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
  low: { label: "Low", color: P.muted },
  medium: { label: "Medium", color: P.accentDeep },
  high: { label: "High", color: P.warn },
  urgent: { label: "Urgent", color: P.bad },
};

function Skeleton() {
  /* A skeleton, not a pulse: it previews the header bar and the post rows so
     the thread doesn't reflow when the query resolves. `P.stage` blocks. */
  const [, navigate] = useLocation();
  return (
    <div className="flex min-h-screen flex-col rglow">
      <TopNav onHome={() => navigate("/")} />
      <div className="border-b px-6 py-4" style={{ borderColor: P.border }}>
        <div className="h-4 w-20 animate-pulse rounded" style={{ background: P.stage }} />
      </div>
      <div className="flex-1 space-y-6 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-12 w-12 animate-pulse rounded-xl" style={{ background: P.stage }} />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-32 animate-pulse rounded" style={{ background: P.stage }} />
              <div className="h-20 w-full animate-pulse rounded-xl" style={{ background: P.band }} />
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
        style={{ border: `2px solid ${P.borderStrong}`, boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }}
      >
        <img src="/staff-avatar.webp" alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (sender === "system") {
    return (
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
        style={{
          background: P.band,
          border: `1px solid ${P.border}`,
          boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
        }}
      >
        <Shield size={20} color={P.text} />
      </div>
    );
  }
  return (
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ border: `2px solid ${P.accentDeep}`, boxShadow: "0 6px 16px rgba(10,110,255,.35)" }}
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
  const chip = ROLE_CHIP[msg.sender] || ROLE_CHIP.customer;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold" style={{ color: P.text }}>
        {msg.senderName || roleLabel}
      </span>
      <span
        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{
          background: chip.bg,
          color: chip.fg,
          border: chip.border ? `1px solid ${chip.border}` : undefined,
        }}
      >
        {roleLabel}
      </span>
    </div>
  );
}

export default function TicketThread() {
  const [, params] = useRoute("/tickets/:ticketId");
  const [, navigate] = useLocation();
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
      // The controller returns the ticket object directly under data — it is
      // NOT nested at data.ticket (reading data.ticket left this page blank forever).
      return json.data as Ticket;
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
        className="flex min-h-screen rglow flex-col items-center justify-center gap-4 pt-24"
      >
        <p className="text-sm font-bold" style={{ color: P.warn }}>
          Ticket not found or failed to load.
        </p>
        <Link
          href="/tickets"
          className="text-sm font-medium transition-colors hover:underline"
          style={{ color: P.accentDeep }}
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
    <div className="min-h-screen rglow">
      <TopNav onHome={() => navigate("/")} />
      {/* Header — parks just under the fixed Navbar (64px bar + 1px border).
          The loading/error states already offset with pt-24; this view didn't,
          so the header sat behind the navbar. It is the ticket's identity card:
          white panel, hairline, soft elevation under the sticky bar. */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: P.card, borderColor: P.border, boxShadow: P.shadow }}
      >
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Link
            href="/tickets"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
            style={{ color: P.muted }}
          >
            <ArrowLeft size={14} />
            Back to Tickets
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {/* Designed moment — the ticket itself, once, beside the subject.
                  This page is a support ticket; the stub says so before a word
                  of the thread is read. */}
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: P.accentTint }}
                >
                  <TicketStub className="w-7 h-7" />
                </span>
                <h1
                  className="font-display min-w-0 truncate text-lg font-black sm:text-xl"
                  style={{ color: P.text }}
                >
                  {data.subject}
                </h1>
              </div>
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
                  style={{ background: P.accentTint, color: P.accentDeep }}
                >
                  {CATEGORY_LABEL[data.category] || data.category}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: pr.color + "18", color: pr.color }}
                >
                  {pr.label}
                </span>
                <span className="text-xs" style={{ color: P.faint }}>
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
                  border: `1.5px solid ${P.bad}`,
                  color: P.bad,
                  boxShadow: "0 6px 16px rgba(255,90,77,.28)",
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
                    <div className="h-px flex-1" style={{ background: P.border }} />
                    <span
                      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                      style={{ background: P.band, color: P.muted, border: `1px solid ${P.border}` }}
                    >
                      <Shield size={12} />
                      {msg.text}
                    </span>
                    <div className="h-px flex-1" style={{ background: P.border }} />
                  </div>
                ) : (
                  <div
                    className="py-5"
                    style={{ borderBottom: `1px solid ${P.border}` }}
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
                          style={{ color: P.faint }}
                        >
                          {relativeTime(msg.timestamp)} · {formatFull(msg.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Post content — break-words: unbroken URLs or pasted
                        strings from a ticket would otherwise blow past the
                        post column at any viewport */}
                    <div
                      className="mb-3 text-[15px] leading-[1.7] sm:pl-15 break-words"
                      style={{ color: P.text }}
                    >
                      {msg.text.split("\n").map((line, li) => {
                        let html = line
                          .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
                          .replace(/_(.+?)_/g, "<i>$1</i>")
                          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#0a84ff;font-weight:600;text-decoration:none">$1</a>')
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
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
                        style={{ color: P.muted }}
                      >
                        <AlertTriangle size={13} />
                        Report
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
                        style={{ color: P.muted }}
                      >
                        <Quote size={13} />
                        Quote
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
                        style={{ color: P.accentDeep }}
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

      {/* Reply editor — sticks to the viewport bottom. It previously offset
          itself by 68px "above MobileBottomNav", but that component is dead
          code and never renders, so the editor floated over an empty gap. */}
      {data.status !== "closed" && (
        <div
          className="sticky bottom-0 z-10 border-t"
          style={{ background: P.band, borderColor: P.border, paddingBottom: "env(safe-area-inset-bottom,0px)" }}
        >
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
            {/* §4 input: white field, emphasized hairline, blue focus glow */}
            <div
              className="overflow-hidden rounded-2xl transition-shadow focus-within:ring-4 focus-within:ring-[#2f8cff]/25"
              style={{ background: P.card, border: `1px solid ${P.borderStrong}` }}
            >
              {/* Toolbar — wraps for the same reason: icon row plus the
                  ⌘+Enter hint is ~277px, which breaks under text scaling */}
              <div
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2.5"
                style={{ background: P.band, borderBottom: `1px solid ${P.border}` }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => wrapSelection("**", "**")}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                    style={{ color: P.muted }}
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    onClick={() => wrapSelection("_", "_")}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                    style={{ color: P.muted }}
                  >
                    <Italic size={16} />
                  </button>
                  <div className="h-4 w-px" style={{ background: P.borderStrong }} />
                  <button
                    onClick={insertLink}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                    style={{ color: P.muted }}
                  >
                    <LinkIcon size={16} />
                  </button>
                  <button
                    onClick={insertImage}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                    style={{ color: P.muted }}
                  >
                    <ImageIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: P.faint }}>
                    ⌘ + Enter to send
                  </span>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative" style={{ background: P.card }}>
                <textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write your reply..."
                  rows={4}
                  className="w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:opacity-40"
                  style={{ color: P.text, minHeight: 120 }}
                />
              </div>

              {/* Bottom bar — wraps: Attach + Preview + Send Reply needed
                  ~335px and overflowed every phone below ~380px */}
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                style={{ background: P.band, borderTop: `1px solid ${P.border}` }}
              >
                <div className="flex items-center gap-3">
                  <button
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
                    style={{ color: P.muted }}
                  >
                    <Paperclip size={14} />
                    Attach files
                  </button>
                  <button
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
                    style={{ color: P.muted }}
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
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all disabled:opacity-40"
                  style={{
                    background: P.accentDeep,
                    color: "#fff",
                    boxShadow: "0 6px 16px rgba(10,110,255,.35)",
                  }}
                >
                  {sendMutation.isPending ? (
                    <motion.span
                      className="inline-flex"
                      animate={{ scale: [1, 1.16, 1] }}
                      transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                    >
                      <RBstar size={16} color="#fff" />
                    </motion.span>
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
      <SiteFooter />
    </div>
  );
}
