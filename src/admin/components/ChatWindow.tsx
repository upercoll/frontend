import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThreadPanel, ThreadBadge, ThreadMeta } from "./ChatThread";
import { playMessageSound } from "../lib/sounds";
import type { ThreadMessage } from "./ChatThread";
import { useAdminSocket } from "../context/AdminSocketContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { ClaimSession, ClaimMessage } from "../types";

interface ChatWindowProps {
  session: ClaimSession;
  onUpdate?: (messages: ClaimMessage[]) => void;
  onSessionClaimed?: (session: ClaimSession) => void;
}

const GENERIC_ITEM_NAMES = ["general claim", "claim chat"];
function cleanItemName(raw?: string): string {
  if (!raw || GENERIC_ITEM_NAMES.includes(raw.trim().toLowerCase())) return "";
  return raw.trim();
}

export default function ChatWindow({ session, onUpdate, onSessionClaimed }: ChatWindowProps) {
  const { socket } = useAdminSocket();
  const { user, profile } = useAdminAuth();
  const [messages, setMessages] = useState<ClaimMessage[]>(session.messages || []);
  const [sessionStatus, setSessionStatus] = useState(session.status);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const joinedRef = useRef(false);
  const pendingMsgIds = useRef(new Set<string>());

  useEffect(() => {
    setMessages(session.messages || []);
    setSessionStatus(session.status);
    joinedRef.current = false;
  }, [session.roomId]);

  useEffect(() => {
    if (session.messages && session.messages.length > 0) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m._id).filter(Boolean));
        const newMsgs = session.messages.filter(m => !m._id || !existingIds.has(m._id));
        if (newMsgs.length === 0) return prev;
        const all = [...prev, ...newMsgs];
        return all.filter((m, i, arr) => !m._id || arr.findIndex(x => x._id === m._id) === i);
      });
    }
  }, [session._id, session.messages]);

  useEffect(() => {
    setSessionStatus(session.status);
  }, [session.status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket || joinedRef.current) return;
    joinedRef.current = true;
    socket.emit("claim:agent_browse", { roomId: session.roomId });
    return () => { joinedRef.current = false; };
  }, [socket, session.roomId]);

  const addMessage = useCallback((msg: ClaimMessage & { roomId?: string }) => {
    if (msg.roomId && msg.roomId !== session.roomId) return;
    setMessages(prev => {
      if (msg._id && prev.some(m => m._id === msg._id)) return prev;
      if (msg._id) pendingMsgIds.current.delete(msg._id);
      const updated = [...prev, msg];
      onUpdate?.(updated);
      return updated;
    });
  }, [session.roomId, onUpdate]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMsg = (data: ClaimMessage & { roomId: string }) => {
      if (data.roomId && data.roomId !== session.roomId) return;
      addMessage(data);
      if (data.sender === "customer") playMessageSound();
    };
    const handleMsgAck = (data: ClaimMessage & { roomId: string }) => addMessage(data);
    const handleTyping = ({ roomId }: { roomId?: string; senderName?: string }) => {
      if (roomId && roomId !== session.roomId) return;
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2500);
    };
    const handleAgentJoined = ({ agentName }: { agentName: string; message: string }) => {
      setSessionStatus("active");
      const sysMsg: ClaimMessage = {
        _id: `sys_${Date.now()}`,
        sender: "system",
        text: `${agentName} has joined the chat`,
        senderName: "System",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => {
        if (prev.some(m => m.text === sysMsg.text && m.sender === "system")) return prev;
        return [...prev, sysMsg];
      });
    };
    const handleAutoAssigned = ({ session: assignedSession }: { roomId: string; session: ClaimSession }) => {
      setSessionStatus("active");
      onSessionClaimed?.(assignedSession);
    };
    const handleClaimed = () => setSessionStatus("claimed");
    const handleEnded  = () => setSessionStatus("ended");
    const handleClosed = () => setSessionStatus("closed");

    socket.on("claim:new_message",         handleNewMsg);
    socket.on("claim:message_ack",         handleMsgAck);
    socket.on("claim:typing",              handleTyping);
    socket.on("claim:agent_joined",        handleAgentJoined);
    socket.on("queue:claim_auto_assigned", handleAutoAssigned);
    socket.on("claim:marked_claimed",      handleClaimed);
    socket.on("claim:ended",               handleEnded);
    socket.on("claim:closed",              handleClosed);

    return () => {
      socket.off("claim:new_message",         handleNewMsg);
      socket.off("claim:message_ack",         handleMsgAck);
      socket.off("claim:typing",              handleTyping);
      socket.off("claim:agent_joined",        handleAgentJoined);
      socket.off("queue:claim_auto_assigned", handleAutoAssigned);
      socket.off("claim:marked_claimed",      handleClaimed);
      socket.off("claim:ended",               handleEnded);
      socket.off("claim:closed",              handleClosed);
    };
  }, [socket, session.roomId, addMessage, onSessionClaimed]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;
    socket.emit("claim:message", {
      roomId: session.roomId,
      text: text.trim(),
      sender: "agent",
      senderName: profile?.displayName || user?.email || "Agent",
    });
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "40px";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      return;
    }
    if (socket && !typing) {
      setTyping(true);
      socket.emit("claim:typing", { roomId: session.roomId, senderName: profile?.displayName || "Agent" });
      typingTimeout.current = setTimeout(() => setTyping(false), 2000);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = "40px";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const isReadOnly = sessionStatus === "claimed" || sessionStatus === "ended" || sessionStatus === "closed";

  const statusLabel: Record<string, string> = {
    pending: "Waiting",
    active:  "In Progress",
    claimed: "Delivered",
    ended:   "Ended",
    closed:  "Closed",
  };
  const statusPill: Record<string, { bg: string; fg: string }> = {
    pending: { bg: "var(--pn-warning-bg)",    fg: "var(--pn-warning-fg)" },
    active:  { bg: "var(--pn-success-bg)",    fg: "var(--pn-success-fg)" },
    claimed: { bg: "var(--pn-action-tint)",   fg: "var(--pn-action)" },
    ended:   { bg: "var(--pn-surface-2)",    fg: "var(--pn-text-3)" },
    closed:  { bg: "var(--pn-surface-2)",    fg: "var(--pn-text-2)" },
  };

  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl border overflow-hidden"
         style={{ background: "var(--pn-surface)", borderColor: "var(--pn-border)" }}>
      <ThreadPanel
        messages={messages as unknown as ThreadMessage[]}
        draft={text}
        onDraftChange={(v) => setText(v)}
        onSend={sendMessage}
        sendLabel="Send Reply"
        placeholder={sessionStatus === "pending" ? "Type to claim this chat..." : "Type a message..."}
        readOnly={isReadOnly}
        notices={[
          sessionStatus === "pending" && (
            <p
              style={{
                margin: 0,
                width: "100%",
                textAlign: "center",
                fontSize: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--pn-warning-bg)",
                border: "1px solid var(--pn-warning-line)",
                color: "var(--pn-warning-fg)",
              }}
            >
              Type a message to claim this chat and start helping the customer.
            </p>
          ),
          sessionStatus === "closed" && (
            <p
              style={{
                margin: 0,
                width: "100%",
                textAlign: "center",
                fontSize: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--pn-action-tint)",
                border: "1px solid var(--pn-action-border)",
                color: "var(--pn-action)",
              }}
            >
              This chat is closed — read-only view
            </p>
          ),
        ].filter(Boolean) as React.ReactNode[]}
        readOnlyNote={
          sessionStatus === "closed"
            ? <>This chat is closed — read-only view</>
            : "This session has ended"
        }
        meta={
          <>
            <ThreadBadge label={statusLabel[sessionStatus] || sessionStatus} {...statusPill[sessionStatus]} />
            <ThreadMeta>{session.robloxUsername}</ThreadMeta>
            <ThreadMeta>{session.contactEmail}</ThreadMeta>
            {session.game && <ThreadMeta>{session.game}</ThreadMeta>}
            {cleanItemName(session.itemName) && <ThreadMeta>{cleanItemName(session.itemName)}</ThreadMeta>}
            {session.orderRef && <ThreadMeta>{session.orderRef}</ThreadMeta>}
            {session.assignedAgent?.name && (
              <ThreadMeta>
                <span style={{ color: "var(--pn-action)" }}>
                  Assigned: {session.assignedAgent.name}
                </span>
              </ThreadMeta>
            )}
          </>
        }
      />
    </div>
  );
}
