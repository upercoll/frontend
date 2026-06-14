import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, Info } from "lucide-react";
import { useAdminSocket } from "../context/AdminSocketContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { ClaimSession, ClaimMessage } from "../types";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  session: ClaimSession;
  onUpdate?: (messages: ClaimMessage[]) => void;
}

export default function ChatWindow({ session, onUpdate }: ChatWindowProps) {
  const { socket } = useAdminSocket();
  const { user, profile } = useAdminAuth();
  const [messages, setMessages] = useState<ClaimMessage[]>(session.messages);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setMessages(session.messages);
  }, [session.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMsg = (data: ClaimMessage & { roomId: string }) => {
      if (data.roomId !== session.roomId) return;
      setMessages((prev) => {
        const updated = [...prev, data];
        onUpdate?.(updated);
        return updated;
      });
    };

    const handleTyping = ({ senderName }: { senderName: string }) => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2500);
    };

    socket.on("claim:new_message", handleNewMsg);
    socket.on("claim:typing", handleTyping);

    return () => {
      socket.off("claim:new_message", handleNewMsg);
      socket.off("claim:typing", handleTyping);
    };
  }, [socket, session.roomId]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;
    socket.emit("claim:message", {
      roomId: session.roomId,
      text: text.trim(),
      sender: "agent",
      senderName: profile?.displayName || user?.email || "Agent",
    });
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (socket && !typing) {
      setTyping(true);
      socket.emit("claim:typing", {
        roomId: session.roomId,
        senderName: profile?.displayName || "Agent",
      });
      typingTimeout.current = setTimeout(() => setTyping(false), 2000);
    }
  };

  const isEnded = session.status === "claimed" || session.status === "ended";

  return (
    <div className="flex flex-col h-full bg-[#0a1628] rounded-xl border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 bg-[#0d1f3c] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">{session.robloxUsername}</p>
          <p className="text-slate-500 text-xs">{session.contactEmail} {session.game && `• ${session.game}`}</p>
        </div>
        <div className={cn(
          "ml-auto text-xs px-2.5 py-1 rounded-full font-medium",
          session.status === "active" ? "bg-emerald-400/10 text-emerald-400" :
          session.status === "claimed" ? "bg-blue-400/10 text-blue-400" :
          session.status === "ended" ? "bg-slate-400/10 text-slate-400" :
          "bg-yellow-400/10 text-yellow-400"
        )}>
          {session.status}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                  <Info className="w-3 h-3" />
                  {msg.text}
                </div>
              ) : (
                <div className={cn(
                  "max-w-xs lg:max-w-sm",
                  msg.sender === "agent" ? "items-end" : "items-start",
                  "flex flex-col gap-1"
                )}>
                  <p className={cn(
                    "text-[10px]",
                    msg.sender === "agent" ? "text-slate-500 text-right" : "text-slate-500"
                  )}>
                    {msg.senderName}
                  </p>
                  <div className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                    msg.sender === "agent"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-[#0d1f3c] text-slate-200 border border-white/5 rounded-bl-sm"
                  )}>
                    {msg.text}
                  </div>
                  <p className="text-slate-600 text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 items-center">
            <div className="flex gap-1 bg-[#0d1f3c] border border-white/5 px-3 py-2 rounded-2xl rounded-bl-sm">
              {[0, 1, 2].map((i) => (
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

      {!isEnded && (
        <div className="p-3 border-t border-white/5">
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-[#0d1f3c] border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ minHeight: 40, maxHeight: 120 }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!text.trim()}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors self-end"
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      )}
      {isEnded && (
        <div className="p-3 border-t border-white/5 text-center">
          <p className="text-slate-500 text-xs">This session has ended</p>
        </div>
      )}
    </div>
  );
}
