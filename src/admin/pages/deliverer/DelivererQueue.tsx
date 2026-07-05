import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Clock, Package, Mail, Gamepad2, Inbox, CheckCircle,
  Send, Loader2, User, X, RefreshCw, Truck, ArrowLeft,
} from "lucide-react";
import { delivererGet, delivererPost } from "@/pages/DelivererLayout";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function fmt(t: string) {
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface Session {
  _id: string; roomId: string; robloxUsername: string; contactEmail: string;
  game?: string; orderRef?: string; status: string; items: { name: string; quantity: number }[];
  createdAt: string; messages?: any[];
  delivererAssigned?: { delivererId: string; name: string };
}

interface Message {
  _id: string; sender: "customer" | "agent" | "system"; text: string;
  senderName: string; timestamp: string;
}

function SessionItem({ session, selected, onClick }: { session: Session; selected: boolean; onClick: () => void }) {
  const statusColor = session.status === "active" ? "#4ade80" : "#94a3b8";
  return (
    <motion.div whileHover={{ x: 2 }} onClick={onClick}
      className="px-3 py-3 cursor-pointer rounded-xl mx-2 mb-1 transition-all"
      style={selected
        ? { background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.25)" }
        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor }} />
        <span className="text-white text-sm font-medium truncate flex-1">{session.robloxUsername}</span>
        <span className="text-white/30 text-[10px] flex-shrink-0">{timeAgo(session.createdAt)}</span>
      </div>
      {session.game && <p className="text-white/40 text-xs mt-0.5 ml-4 truncate">{session.game}</p>}
      {session.items?.length > 0 && (
        <p className="text-sky-400/60 text-[10px] mt-0.5 ml-4 truncate">
          {session.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}
        </p>
      )}
    </motion.div>
  );
}

export default function DelivererQueue() {
  const [sessions, setSessions] = useState<{ pending: Session[]; mine: Session[]; completed: Session[] }>({ pending: [], mine: [], completed: [] });
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [error, setError] = useState("");
  const [showMobile, setShowMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadQueue = useCallback(async () => {
    try {
      const res = await delivererGet("/claims");
      setSessions(res.data);
    } catch {}
  }, []);

  const loadSession = useCallback(async (roomId: string) => {
    try {
      const res = await delivererGet(`/claims/${roomId}`);
      const s = res.data.session;
      setSessionData(s);
      setMessages(s.messages || []);
    } catch {}
  }, []);

  useEffect(() => { loadQueue(); }, []);

  // Poll selected session messages every 4s
  useEffect(() => {
    if (!selectedRoom) return;
    loadSession(selectedRoom);
    const id = setInterval(() => loadSession(selectedRoom), 4000);
    return () => clearInterval(id);
  }, [selectedRoom, loadSession]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const claim = async (roomId: string) => {
    setClaiming(roomId); setError("");
    try {
      await delivererPost(`/claims/${roomId}/claim`);
      setSelectedRoom(roomId);
      setShowMobile(true);
      await loadQueue();
    } catch (err: any) { setError(err.message); }
    finally { setClaiming(null); }
  };

  const deliver = async () => {
    if (!selectedRoom) return;
    setDelivering(true); setError("");
    try {
      await delivererPost(`/claims/${selectedRoom}/deliver`);
      await loadQueue();
      setSelectedRoom(null);
      setSessionData(null);
      setMessages([]);
    } catch (err: any) { setError(err.message); }
    finally { setDelivering(false); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedRoom) return;
    setSendingMsg(true);
    try {
      await delivererPost(`/claims/${selectedRoom}/message`, { text: msgText.trim() });
      setMsgText("");
      await loadSession(selectedRoom);
    } catch (err: any) { setError(err.message); }
    finally { setSendingMsg(false); }
  };

  const allSessions = [
    ...sessions.mine.map(s => ({ ...s, _tab: "mine" })),
    ...sessions.pending.map(s => ({ ...s, _tab: "pending" })),
  ];

  const isActive = sessionData?.status === "active" && sessionData.delivererAssigned?.delivererId;

  return (
    <div className="flex h-[calc(100vh-64px-48px)] rounded-2xl overflow-hidden"
      style={{ background: "rgba(6,9,28,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Sidebar */}
      <div className={cn("flex flex-col w-72 flex-shrink-0 border-r border-white/5", showMobile ? "hidden md:flex" : "flex")}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h2 className="text-white font-semibold text-sm">Claim Queue</h2>
          <button onClick={loadQueue} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {/* My active */}
          {sessions.mine.length > 0 && (
            <>
              <p className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-400/60">My Active Chats</p>
              {sessions.mine.map(s => (
                <SessionItem key={s.roomId} session={s} selected={selectedRoom === s.roomId}
                  onClick={() => { setSelectedRoom(s.roomId); setShowMobile(true); }} />
              ))}
            </>
          )}
          {/* Pending */}
          {sessions.pending.length > 0 && (
            <>
              <p className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">Waiting ({sessions.pending.length})</p>
              {sessions.pending.map(s => (
                <SessionItem key={s.roomId} session={s} selected={selectedRoom === s.roomId}
                  onClick={() => { setSelectedRoom(s.roomId); setShowMobile(true); }} />
              ))}
            </>
          )}
          {allSessions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-white/20">
              <Inbox className="w-8 h-8 mb-2" />
              <p className="text-xs">No active chats</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat / detail area */}
      <div className={cn("flex flex-col flex-1 min-w-0", !showMobile && "hidden md:flex")}>
        {!selectedRoom ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Select a chat from the queue</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0">
              <button onClick={() => { setShowMobile(false); }} className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{sessionData?.robloxUsername}</p>
                <p className="text-white/40 text-xs truncate">{[sessionData?.contactEmail, sessionData?.game].filter(Boolean).join(" · ")}</p>
              </div>
              {sessionData?.status === "pending" && (
                <button
                  onClick={() => claim(selectedRoom)}
                  disabled={!!claiming}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-colors flex-shrink-0"
                  style={{ background: "rgba(14,165,233,0.9)", border: "1px solid rgba(14,165,233,0.4)" }}>
                  {claiming === selectedRoom ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3" />}
                  Claim Chat
                </button>
              )}
              {isActive && (
                <button
                  onClick={deliver}
                  disabled={delivering}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-colors flex-shrink-0"
                  style={{ background: "rgba(74,222,128,0.9)", border: "1px solid rgba(74,222,128,0.4)" }}>
                  {delivering ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  Mark Delivered
                </button>
              )}
            </div>

            {error && (
              <div className="mx-4 mt-2 px-3 py-2 rounded-lg text-xs text-red-400 flex items-center gap-2 flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <X className="w-3 h-3 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Items */}
            {sessionData?.items && sessionData.items.length > 0 && (
              <div className="px-4 py-2 flex items-center gap-2 flex-wrap border-b border-white/5 flex-shrink-0">
                <Package className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                {sessionData.items.map((item, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full text-sky-300/70 flex-shrink-0"
                    style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.12)" }}>
                    {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
                  </span>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => {
                if (msg.sender === "system") {
                  return (
                    <div key={i} className="flex justify-center">
                      <span className="text-[11px] text-white/30 bg-white/4 border border-white/5 px-3 py-1 rounded-full">{msg.text}</span>
                    </div>
                  );
                }
                const isAgent = msg.sender === "agent";
                return (
                  <div key={i} className={cn("flex items-end gap-2", isAgent ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                      isAgent ? "bg-sky-500/20 text-sky-400" : "bg-blue-500/20 text-blue-400")}>
                      {(msg.senderName || (isAgent ? "D" : "C"))[0].toUpperCase()}
                    </div>
                    <div className={cn("max-w-[75%] flex flex-col gap-1", isAgent ? "items-end" : "items-start")}>
                      <span className={cn("text-[10px] font-medium", isAgent ? "text-sky-400 text-right" : "text-blue-400")}>
                        {msg.senderName}
                      </span>
                      <div className={cn("px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                        isAgent
                          ? "bg-sky-600/20 text-sky-100 border border-sky-500/15 rounded-tr-sm"
                          : "bg-blue-600/15 text-slate-200 border border-blue-500/10 rounded-tl-sm")}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-white/25">{fmt(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {isActive && (
              <form onSubmit={sendMessage} className="px-4 py-3 border-t border-white/5 flex-shrink-0 flex gap-2">
                <input
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                <button type="submit" disabled={sendingMsg || !msgText.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-colors"
                  style={{ background: "rgba(14,165,233,0.9)" }}>
                  {sendingMsg ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </form>
            )}

            {sessionData?.status === "claimed" && (
              <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-400 text-xs font-medium">Delivered — this chat is complete</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
