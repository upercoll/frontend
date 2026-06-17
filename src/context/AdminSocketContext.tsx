import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAdminAuth } from "./AdminAuthContext";
import type { ClaimSession } from "../types";

interface ClaimPopup {
  roomId: string;
  robloxUsername: string;
  contactEmail: string;
  game?: string;
  items: { name: string; quantity: number }[];
  orderRef?: string;
  createdAt: string;
  isOwnerAlert?: boolean;
}

export interface LiveClaimSession {
  roomId: string;
  robloxUsername: string;
  contactEmail?: string;
  game?: string;
  status: "pending" | "active" | "claimed" | "ended";
  agentName?: string;
  createdAt: string;
}

export interface PendingClaim {
  roomId: string;
  robloxUsername: string;
  contactEmail?: string;
  game?: string;
  itemName?: string;
  items: { name: string; quantity: number }[];
  orderRef?: string;
  createdAt: string;
}

interface AdminSocketContextType {
  socket: Socket | null;
  connected: boolean;
  claimPopup: ClaimPopup | null;
  dismissClaimPopup: () => void;
  onlineAgents: { agentId: string; agentName: string; games: string[] }[];
  activeClaims: LiveClaimSession[];
  pendingClaims: PendingClaim[];
  removePendingClaim: (roomId: string) => void;
}

const AdminSocketContext = createContext<AdminSocketContextType | null>(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || "";

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    const t = ctx.currentTime;
    playTone(880, t, 0.3, 0.28);
    playTone(1108, t + 0.12, 0.28, 0.22);
    playTone(1318, t + 0.24, 0.45, 0.18);
  } catch {}
}

export function AdminSocketProvider({ children }: { children: ReactNode }) {
  const { user, token, profile } = useAdminAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [claimPopup, setClaimPopup] = useState<ClaimPopup | null>(null);
  const [onlineAgents, setOnlineAgents] = useState<{ agentId: string; agentName: string; games: string[] }[]>([]);
  const [activeClaims, setActiveClaims] = useState<LiveClaimSession[]>([]);
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([]);

  const removePendingClaim = useCallback((roomId: string) => {
    setPendingClaims(prev => prev.filter(c => c.roomId !== roomId));
  }, []);

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);

      if (user.type === "team_member") {
        socket.emit("queue:join", {
          games: user.claimGames || [],
          agentId: user.id,
          agentName: profile?.displayName || user.email,
        });
      }
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("queue:new_pending_claim", (data: PendingClaim) => {
      if (user.type !== "team_member") return;
      setPendingClaims(prev => {
        const exists = prev.find(c => c.roomId === data.roomId);
        if (exists) return prev;
        return [data, ...prev];
      });
      playNotificationSound();
    });

    socket.on("queue:claim_taken", ({ roomId }: { roomId: string }) => {
      setPendingClaims(prev => prev.filter(c => c.roomId !== roomId));
    });

    socket.on("queue:claim_ended", ({ roomId }: { roomId: string }) => {
      setPendingClaims(prev => prev.filter(c => c.roomId !== roomId));
    });

    socket.on("admin:new_claim", (data: Omit<ClaimPopup, "isOwnerAlert">) => {
      setActiveClaims(prev => {
        const exists = prev.find(c => c.roomId === data.roomId);
        if (exists) return prev;
        return [
          {
            roomId: data.roomId,
            robloxUsername: data.robloxUsername,
            contactEmail: data.contactEmail,
            game: data.game,
            status: "pending",
            createdAt: data.createdAt,
          },
          ...prev,
        ];
      });

      if (user.isOwner) {
        setClaimPopup({ ...data, isOwnerAlert: true });
        playNotificationSound();
      }
    });

    socket.on("admin:claim_status_changed", ({ roomId, status, agentName }: { roomId: string; status: string; agentName?: string }) => {
      setActiveClaims(prev =>
        prev
          .map(c =>
            c.roomId === roomId
              ? { ...c, status: status as LiveClaimSession["status"], ...(agentName ? { agentName } : {}) }
              : c
          )
          .filter(c => c.status !== "ended" && c.status !== "claimed")
      );
    });

    socket.on("admin:agent_online", (data: { agentId: string; agentName: string; games: string[] }) => {
      setOnlineAgents(prev => {
        const filtered = prev.filter(a => a.agentId !== data.agentId);
        return [...filtered, data];
      });
    });

    socket.on("admin:agent_offline", ({ agentId }: { agentId: string }) => {
      setOnlineAgents(prev => prev.filter(a => a.agentId !== agentId));
    });

    return () => {
      if (user.type === "team_member") {
        socket.emit("queue:leave", { agentId: user.id });
      }
      socket.disconnect();
    };
  }, [user?.id, token]);

  const claimGamesKey = user?.claimGames?.join(",") ?? "";
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !user || user.type !== "team_member") return;
    socket.emit("queue:join", {
      games: user.claimGames || [],
      agentId: user.id,
      agentName: profile?.displayName || user.email,
    });
  }, [claimGamesKey]);

  const dismissClaimPopup = () => setClaimPopup(null);

  return (
    <AdminSocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        claimPopup,
        dismissClaimPopup,
        onlineAgents,
        activeClaims,
        pendingClaims,
        removePendingClaim,
      }}
    >
      {children}
    </AdminSocketContext.Provider>
  );
}

export function useAdminSocket() {
  const ctx = useContext(AdminSocketContext);
  if (!ctx) throw new Error("useAdminSocket must be used inside AdminSocketProvider");
  return ctx;
}
