import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Shield, Users, Trash2, Edit2, X, Loader2, Check } from "lucide-react";
import { adminApi } from "../api";
import PermissionGrid from "../components/PermissionGrid";
import type { AdminRole } from "../types";

type ModalMode = "create" | "edit" | null;

const COLORS = ["#6366f1", "#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

export default function Roles() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ mode: ModalMode; role?: AdminRole }>({ mode: null });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["panel-roles"],
    queryFn: adminApi.roles.list,
  });

  const createMut = useMutation({
    mutationFn: adminApi.roles.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["panel-roles"] }); closeModal(); },
    onError: (err: Error) => setError(err.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminApi.roles.update>[1] }) => adminApi.roles.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["panel-roles"] }); closeModal(); },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: adminApi.roles.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["panel-roles"] }); setDeleteConfirm(null); },
    onError: (err: Error) => alert(err.message),
  });

  const openCreate = () => {
    setName(""); setDescription(""); setColor(COLORS[0]); setPermissions([]); setError("");
    setModal({ mode: "create" });
  };

  const openEdit = (role: AdminRole) => {
    setName(role.name); setDescription(role.description || ""); setColor(role.color); setPermissions(role.permissions); setError("");
    setModal({ mode: "edit", role });
  };

  const closeModal = () => { setModal({ mode: null }); setError(""); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    const payload = { name: name.trim(), description, color, permissions };
    if (modal.mode === "create") createMut.mutate(payload);
    else if (modal.role) updateMut.mutate({ id: modal.role._id, data: payload });
  };

  const roles = data?.data.roles || [];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">Roles & Permissions</h2>
          <p className="text-slate-400 text-sm mt-0.5">Create roles and define what each team member can access</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </motion.button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No roles yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role: AdminRole, i: number) => (
            <motion.div
              key={role._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0d1f3c] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${role.color}20`, border: `1px solid ${role.color}30` }}>
                    <Shield className="w-5 h-5" style={{ color: role.color }} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{role.name}</h3>
                    {role.description && <p className="text-slate-500 text-xs mt-0.5">{role.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(role)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(role._id)} className="w-8 h-8 rounded-lg bg-red-500/5 hover:bg-red-500/15 flex items-center justify-center text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  {role.memberCount || 0} member{role.memberCount !== 1 ? "s" : ""}
                </div>
                <div className="text-slate-400 text-xs">
                  {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 4).map((p) => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                    {p.replace(/_/g, " ")}
                  </span>
                ))}
                {role.permissions.length > 4 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500">
                    +{role.permissions.length - 4} more
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal.mode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={closeModal}>
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-2xl my-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">{modal.mode === "create" ? "Create Role" : "Edit Role"}</h3>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Role Name *</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Claim Agent"
                      className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Description</label>
                    <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description"
                      className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-2">Role Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setColor(c)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{ background: c }}>
                        {color === c && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-3">Permissions</label>
                  <PermissionGrid selected={permissions} onChange={setPermissions} />
                </div>

                {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={createMut.isPending || updateMut.isPending}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
                    {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {modal.mode === "create" ? "Create Role" : "Save Changes"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}>
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-center mb-1">Delete Role?</h3>
              <p className="text-slate-400 text-sm text-center mb-5">This cannot be undone. All members with this role must be reassigned first.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-white/5 text-slate-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={() => deleteMut.mutate(deleteConfirm)} disabled={deleteMut.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                  {deleteMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
