import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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
}

interface AdminSocketContextType {
  socket: Socket | null;
  connected: boolean;
  claimPopup: ClaimPopup | null;
  dismissClaimPopup: () => void;
  answerClaim: (roomId: string) => void;
  declineClaim: (roomId: string) => void;
  onlineAgents: { agentId: string; agentName: string; games: string[] }[];
}

const AdminSocketContext = createContext<AdminSocketContextType | null>(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || "";

export function AdminSocketProvider({ children }: { children: ReactNode }) {
  const { user, token, profile } = useAdminAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [claimPopup, setClaimPopup] = useState<ClaimPopup | null>(null);
  const [onlineAgents, setOnlineAgents] = useState<{ agentId: string; agentName: string; games: string[] }[]>([]);

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

      if (user.type === "team_member" && user.claimGames?.length) {
        socket.emit("queue:join", {
          games: user.claimGames,
          agentId: user.id,
          agentName: profile?.displayName || user.email,
        });
      }
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("queue:claim_popup", (data: ClaimPopup) => {
      setClaimPopup(data);
    });

    socket.on("queue:already_taken", () => {
      setClaimPopup(null);
    });

    socket.on("admin:agent_online", (data: { agentId: string; agentName: string; games: string[] }) => {
      setOnlineAgents((prev) => {
        const filtered = prev.filter((a) => a.agentId !== data.agentId);
        return [...filtered, data];
      });
    });

    socket.on("admin:agent_offline", ({ agentId }: { agentId: string }) => {
      setOnlineAgents((prev) => prev.filter((a) => a.agentId !== agentId));
    });

    return () => {
      if (user.type === "team_member") {
        socket.emit("queue:leave", { agentId: user.id });
      }
      socket.disconnect();
    };
  }, [user?.id, token]);

  const dismissClaimPopup = () => setClaimPopup(null);

  const answerClaim = (roomId: string) => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("queue:answer", {
      roomId,
      agentId: user.id,
      agentName: profile?.displayName || user.email,
    });
    setClaimPopup(null);
  };

  const declineClaim = (roomId: string) => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("queue:decline", { roomId, agentId: user.id });
    setClaimPopup(null);
  };

  return (
    <AdminSocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        claimPopup,
        dismissClaimPopup,
        answerClaim,
        declineClaim,
        onlineAgents,
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
