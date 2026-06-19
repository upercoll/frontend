import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Info } from "lucide-react";
import { useAdminSocket } from "../context/AdminSocketContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { ClaimSession, ClaimMessage } from "../types";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  session: ClaimSession;
  onUpdate?: (messages: ClaimMessage[]) => void;
  onSessionClaimed?: (session: ClaimSession) => void;
}

function cleanItemName(raw?: string): string {
  if (!raw || raw.trim().toLowerCase() === "general claim") return "";
  return raw.trim();
}

function playPing() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1100;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
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

  // Reset messages when session changes (key-based remount handles this, but keep as safety net)
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
      if (data.sender === "customer") playPing();
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
    const handleEnded = () => setSessionStatus("ended");

    socket.on("claim:new_message",         handleNewMsg);
    socket.on("claim:message_ack",         handleMsgAck);
    socket.on("claim:typing",              handleTyping);
    socket.on("claim:agent_joined",        handleAgentJoined);
    socket.on("queue:claim_auto_assigned", handleAutoAssigned);
    socket.on("claim:marked_claimed",      handleClaimed);
    socket.on("claim:ended",               handleEnded);

    return () => {
      socket.off("claim:new_message",         handleNewMsg);
      socket.off("claim:message_ack",         handleMsgAck);
      socket.off("claim:typing",              handleTyping);
      socket.off("claim:agent_joined",        handleAgentJoined);
      socket.off("queue:claim_auto_assigned", handleAutoAssigned);
      socket.off("claim:marked_claimed",      handleClaimed);
      socket.off("claim:ended",               handleEnded);
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

  const isEnded = sessionStatus === "claimed" || sessionStatus === "ended";

  const statusLabel: Record<string, string> = {
    pending: "Waiting",
    active: "In Progress",
    claimed: "Delivered",
    ended: "Ended",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-yellow-400/10 text-yellow-400",
    active:  "bg-emerald-400/10 text-emerald-400",
    claimed: "bg-blue-400/10 text-blue-400",
    ended:   "bg-slate-400/10 text-slate-400",
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1628] rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-[#0d1f3c] flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{session.robloxUsername}</p>
          <p className="text-slate-500 text-xs truncate">
            {session.contactEmail}
            {session.game && ` · ${session.game}`}
            {cleanItemName(session.itemName) && ` · ${cleanItemName(session.itemName)}`}
          </p>
        </div>
        <div className={cn("text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0", statusColor[sessionStatus] || statusColor.pending)}>
          {statusLabel[sessionStatus] || sessionStatus}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
        {sessionStatus === "pending" && (
          <div className="text-center py-4">
            <p className="text-yellow-400/70 text-xs bg-yellow-400/5 border border-yellow-400/10 rounded-xl px-4 py-3">
              Type a message to claim this chat and start helping the customer.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg._id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex",
                msg.sender === "agent" ? "justify-end" :
                msg.sender === "system" ? "justify-center" :
                "justify-start"
              )}
            >
              {msg.sender === "system" ? (
                <div className="flex items-center gap-2 text-slate-500 text-xs bg-white/3 border border-white/5 px-3 py-1.5 rounded-full">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  {msg.text}
                </div>
              ) : (
                <div className={cn(
                  "max-w-[80%] sm:max-w-sm flex flex-col gap-1",
                  msg.sender === "agent" ? "items-end" : "items-start"
                )}>
                  <p className={cn("text-[10px]", msg.sender === "agent" ? "text-slate-500 text-right" : "text-slate-500")}>
                    {msg.senderName}
                  </p>
                  <div className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                    msg.sender === "agent"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-[#0d1f3c] text-slate-200 border border-white/5 rounded-bl-sm"
                  )}>
                    {msg.text}
                  </div>
                  <p className="text-slate-600 text-[10px]">
                    {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(new Date(msg.timestamp))}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 items-center">
            <div className="flex gap-1 bg-[#0d1f3c] border border-white/5 px-3 py-2 rounded-2xl rounded-bl-sm">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-slate-500"
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isEnded ? (
        <div className="p-2.5 md:p-3 border-t border-white/5 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={sessionStatus === "pending" ? "Type to claim this chat..." : "Type a message..."}
              rows={1}
              className="flex-1 bg-[#0d1f3c] border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ minHeight: 40, maxHeight: 120 }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!text.trim()}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-white/5 text-center flex-shrink-0">
          <p className="text-slate-500 text-xs">This session has ended</p>
        </div>
      )}
    </div>
  );
}
