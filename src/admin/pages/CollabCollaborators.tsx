import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Mail, CheckCircle, X, Loader2, Trash2, Eye, Clock } from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "../api";

function fmt(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CollabCollaborators() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["collab-list"],
    queryFn: () => adminApi.collab.listCollaborators(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.collab.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collab-list"] }),
  });

  const collaborators = (data as any)?.data?.collaborators || [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setFormError("Name and email are required"); return; }
    setSaving(true); setFormError("");
    try {
      await adminApi.collab.invite(form.name, form.email);
      qc.invalidateQueries({ queryKey: ["collab-list"] });
      setModal(false);
      setForm({ name: "", email: "" });
    } catch (err: any) {
      setFormError(err.message || "Failed to send invite");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Collaborators</h2>
          <p className="text-sm text-slate-500 mt-0.5">{collaborators.length} total collaborators</p>
        </div>
        <button
          onClick={() => { setModal(true); setForm({ name: "", email: "" }); setFormError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: "#1e1b4b" }}
        >
          <Plus className="w-4 h-4" /> Invite Collaborator
        </button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />)}
          </div>
        ) : collaborators.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No collaborators yet.</p>
            <p className="text-sm mt-1">Invite your first collaborator to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Products</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Accepted Invite</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Payout Setup Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Last Payout</th>
                <th className="px-5 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((c: any) => (
                <tr key={c._id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{c.name}</p>
                    <p className="text-xs text-slate-400">{c.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium" style={{ color: "#1e1b4b" }}>{c.productCount ?? 0}</span>
                  </td>
                  <td className="px-5 py-4">
                    {c.status === "active"
                      ? <CheckCircle className="w-5 h-5" style={{ color: "#16a34a" }} />
                      : <Clock className="w-5 h-5 text-slate-300" />}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-500">Not set up</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-500">{fmt(c.lastPayoutAt)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { if (confirm(`Delete "${c.name}"? This will remove all their product assignments.`)) deleteMut.mutate(c._id); }}
                        className="text-sm font-medium transition-colors hover:text-red-600"
                        style={{ color: "#6b7280" }}
                      >
                        Delete
                      </button>
                      <Link href={`/admin/collaboration/view/${c._id}`}>
                        <button className="text-sm font-medium transition-colors hover:text-indigo-600" style={{ color: "#6b7280" }}>
                          View
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setModal(false)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
              style={{ border: "1px solid #E9EBF5" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <h3 className="font-bold text-base" style={{ color: "#1e1b4b" }}>Invite Collaborator</h3>
                <button onClick={() => setModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600" style={{ background: "#F7F8FC" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500">Display Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500">Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="collaborator@email.com"
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                    required
                  />
                </div>
                {formError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{formError}</div>
                )}
                <p className="text-xs text-slate-400">An invitation email will be sent. The collaborator will set their password upon accepting.</p>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModal(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "#1e1b4b" }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Send Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
