import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Shield, Check, X, LayoutDashboard, ShoppingBag, Package,
  Gamepad2, Users, PenSquare, Tag, MessageSquare, Activity,
  FileCheck, Settings, BarChart3, Inbox, ChevronDown,
} from "lucide-react";
import { adminApi } from "../api";
import { ALL_PERMISSIONS } from "../types";
import type { AdminRole } from "../types";
import { cn } from "@/lib/utils";

const PERMISSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  view_analytics: BarChart3,
  manage_games: Gamepad2,
  manage_categories: Gamepad2,
  manage_products: Package,
  edit_site_content: PenSquare,
  manage_orders: ShoppingBag,
  manage_claims: MessageSquare,
  claim_agent: Inbox,
  view_pod: FileCheck,
  manage_promos: Tag,
  manage_team: Users,
  manage_roles: Shield,
  monitor_agents: Activity,
};

const SIDEBAR_PREVIEW: { label: string; icon: React.ComponentType<{ className?: string }>; permission?: string }[] = [
  { label: "Dashboard", icon: LayoutDashboard, permission: "view_analytics" },
  { label: "Orders", icon: ShoppingBag, permission: "manage_orders" },
  { label: "Products", icon: Package, permission: "manage_products" },
  { label: "Games & Categories", icon: Gamepad2, permission: "manage_games" },
  { label: "Site Content", icon: PenSquare, permission: "edit_site_content" },
  { label: "Promo Codes", icon: Tag, permission: "manage_promos" },
  { label: "Roles", icon: Shield, permission: "manage_roles" },
  { label: "Team", icon: Users, permission: "manage_team" },
  { label: "Claim Teams", icon: MessageSquare, permission: "manage_team" },
  { label: "Agent Monitor", icon: Activity, permission: "monitor_agents" },
  { label: "Proof of Delivery", icon: FileCheck, permission: "view_pod" },
];

const AGENT_SIDEBAR: { label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Claim Queue", icon: Inbox },
  { label: "My Stats", icon: BarChart3 },
];

const permissionGroups = ALL_PERMISSIONS.reduce((acc, p) => {
  if (!acc[p.group]) acc[p.group] = [];
  acc[p.group].push(p);
  return acc;
}, {} as Record<string, typeof ALL_PERMISSIONS>);

export default function RoleView() {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["panel-roles"],
    queryFn: () => adminApi.roles.list(),
  });

  const roles: AdminRole[] = data?.data.roles || [];
  const selectedRole = roles.find((r) => r._id === selectedRoleId) || null;
  const rolePerms = new Set(selectedRole?.permissions || []);

  const isAgentRole = selectedRole
    ? rolePerms.has("claim_agent") && !rolePerms.has("view_analytics") && !rolePerms.has("manage_orders")
    : false;

  const visibleOwnerItems = SIDEBAR_PREVIEW.filter(
    (item) => !item.permission || rolePerms.has(item.permission)
  );

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-white font-semibold text-lg">Role View Switcher</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Preview exactly what a team member with a given role can see and access.
        </p>
      </div>

      <div className="relative w-72">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#0d1f3c] border border-white/10 rounded-xl text-sm text-white hover:border-blue-500/40 transition-colors"
        >
          {selectedRole ? (
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: selectedRole.color || "#3b82f6" }}
              />
              <span>{selectedRole.name}</span>
            </div>
          ) : (
            <span className="text-slate-400">Select a role to preview…</span>
          )}
          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", dropdownOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-1 w-full bg-[#0d1f3c] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl"
            >
              {roles.map((role) => (
                <button
                  key={role._id}
                  onClick={() => { setSelectedRoleId(role._id); setDropdownOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors",
                    selectedRoleId === role._id ? "text-blue-400" : "text-slate-300"
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: role.color || "#3b82f6" }} />
                  <span className="flex-1">{role.name}</span>
                  {role.description && <span className="text-slate-500 text-xs truncate max-w-[120px]">{role.description}</span>}
                </button>
              ))}
              {roles.length === 0 && (
                <div className="px-4 py-3 text-slate-500 text-sm">No roles created yet</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!selectedRole ? (
        <div className="text-center py-20 text-slate-600">
          <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a role above to see their panel view</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0"
                  style={{ background: selectedRole.color || "#3b82f6" }}
                />
                <p className="text-white text-sm font-semibold">{selectedRole.name}</p>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                  {isAgentRole ? "Agent Panel" : "Admin Panel"}
                </span>
              </div>

              <div className="p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
                  {isAgentRole ? "Agent Sidebar" : "Visible Sidebar Items"}
                </p>
                <div className="space-y-0.5">
                  {(isAgentRole ? AGENT_SIDEBAR : visibleOwnerItems).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 text-sm"
                      >
                        <Icon className="w-4 h-4 text-blue-400/60 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                  {!isAgentRole && visibleOwnerItems.length === 0 && (
                    <p className="text-slate-600 text-xs px-3 py-2">No pages accessible</p>
                  )}
                </div>

                {!isAgentRole && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-4 mb-2 px-1">
                      Hidden Items
                    </p>
                    <div className="space-y-0.5">
                      {SIDEBAR_PREVIEW.filter(
                        (item) => item.permission && !rolePerms.has(item.permission)
                      ).map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 text-sm"
                          >
                            <Icon className="w-4 h-4 flex-shrink-0 opacity-30" />
                            <span className="line-through opacity-40">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <p className="text-white text-sm font-semibold">Permission Breakdown</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {rolePerms.size} of {ALL_PERMISSIONS.length} permissions granted
                </p>
              </div>

              <div className="p-5 space-y-6">
                {Object.entries(permissionGroups).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">{group}</p>
                    <div className="space-y-2">
                      {perms.map((perm) => {
                        const has = rolePerms.has(perm.key);
                        const Icon = PERMISSION_ICONS[perm.key] || Shield;
                        return (
                          <motion.div
                            key={perm.key}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
                              has
                                ? "bg-emerald-500/5 border-emerald-500/15"
                                : "bg-white/2 border-white/5 opacity-50"
                            )}
                          >
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                              has ? "bg-emerald-500/15" : "bg-white/5"
                            )}>
                              <Icon className={cn("w-3.5 h-3.5", has ? "text-emerald-400" : "text-slate-600")} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium", has ? "text-white" : "text-slate-600")}>
                                {perm.label}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">{perm.description}</p>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                              has ? "bg-emerald-500/20" : "bg-white/5"
                            )}>
                              {has
                                ? <Check className="w-3 h-3 text-emerald-400" />
                                : <X className="w-3 h-3 text-slate-600" />
                              }
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
