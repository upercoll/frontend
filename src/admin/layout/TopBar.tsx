import { useState } from "react";
import { Link } from "wouter";
import { Bell, Search, Menu, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminSocket } from "../context/AdminSocketContext";

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const { profile, user } = useAdminAuth();
  const { connected } = useAdminSocket();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-sm flex items-center gap-4 px-6 flex-shrink-0 z-10">
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden text-slate-400 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1">
        <h1 className="text-white font-semibold text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{connected ? "Live" : "Offline"}</span>
        </div>

        <div className="text-slate-400 text-xs hidden sm:block">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>

        <Link href={user?.isOwner ? "/admin/profile" : "/panel/profile"}>
          <div className="flex items-center gap-1 border-l border-white/5 pl-3 cursor-pointer hover:opacity-80 transition-opacity">
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-700/30 border border-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-xs font-bold">
                  {(profile?.displayName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block ml-1">
              <p className="text-white text-xs font-medium">{profile?.displayName || user?.email?.split("@")[0]}</p>
              <p className="text-slate-500 text-[10px]">{user?.isOwner ? "Owner" : user?.role?.name}</p>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
