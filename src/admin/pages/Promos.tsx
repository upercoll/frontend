import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag, Trash2, X, Loader2, Copy, Check, ToggleLeft, ToggleRight, Percent, DollarSign } from "lucide-react";
import { adminApi } from "../api";

interface PromoCode {
  _id: string;
  code: string;
  description?: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export default function Promos() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["panel-promos"],
    queryFn: () => adminApi.promos.list(),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.promos.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-promos"] }),
    onError: (err: Error) => alert(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: adminApi.promos.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-promos"] }),
    onError: (err: Error) => alert(err.message),
  });

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setCode(""); setDescription(""); setDiscountType("percent"); setDiscountValue("");
    setMinOrderValue(""); setMaxUses(""); setMaxUsesPerUser(""); setStartsAt(""); setExpiresAt(""); setError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError("Code is required"); return; }
    if (!discountValue || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
      setError("Discount value must be a positive number"); return;
    }
    setSaving(true); setError("");
    try {
      await adminApi.promos.create({
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
        maxUses: maxUses ? Number(maxUses) : null,
        maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : null,
        startsAt: startsAt || null,
        expiresAt: expiresAt || null,
      });
      qc.invalidateQueries({ queryKey: ["panel-promos"] });
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create promo code");
    } finally {
      setSaving(false);
    }
  };

  const promos = (data?.data as PromoCode[]) || [];

  const getStatus = (promo: PromoCode) => {
    if (!promo.active) return { label: "Inactive", color: "text-slate-400 bg-slate-400/10" };
    const now = new Date();
    if (promo.startsAt && new Date(promo.startsAt) > now) return { label: "Scheduled", color: "text-yellow-400 bg-yellow-400/10" };
    if (promo.expiresAt && new Date(promo.expiresAt) < now) return { label: "Expired", color: "text-red-400 bg-red-400/10" };
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { label: "Exhausted", color: "text-orange-400 bg-orange-400/10" };
    return { label: "Active", color: "text-emerald-400 bg-emerald-400/10" };
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">Promo Codes</h2>
          <p className="text-slate-400 text-sm mt-0.5">Create and manage discount codes for your store</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> New Code
        </motion.button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />)}
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No promo codes yet. Create your first discount code.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((promo, i) => {
            const status = getStatus(promo);
            return (
              <motion.div
                key={promo._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-[#0d1f3c] border border-white/5 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  {promo.discountType === "percent" ? (
                    <Percent className="w-4 h-4 text-blue-400" />
                  ) : (
                    <DollarSign className="w-4 h-4 text-blue-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-mono font-bold">{promo.code}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {promo.discountType === "percent"
                        ? `${promo.discountValue}% off`
                        : `$${promo.discountValue.toFixed(2)} off`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {promo.description && <span className="text-slate-500 text-xs">{promo.description}</span>}
                    <span className="text-slate-600 text-xs">
                      Used {promo.usedCount}{promo.maxUses !== null ? `/${promo.maxUses}` : ""} times
                    </span>
                    {promo.minOrderValue > 0 && (
                      <span className="text-slate-600 text-xs">Min order: ${promo.minOrderValue}</span>
                    )}
                    {promo.expiresAt && (
                      <span className="text-slate-600 text-xs">
                        Expires {new Date(promo.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(promo.code, promo._id)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    title="Copy code"
                  >
                    {copiedId === promo._id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => toggleMut.mutate({ id: promo._id, active: !promo.active })}
                    disabled={toggleMut.isPending}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    title={promo.active ? "Deactivate" : "Activate"}
                  >
                    {promo.active
                      ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                      : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete promo code "${promo.code}"?`)) deleteMut.mutate(promo._id); }}
                    className="w-8 h-8 rounded-lg bg-red-500/5 hover:bg-red-500/15 flex items-center justify-center text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden my-4"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">Create Promo Code</h3>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Code *</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER20"
                    maxLength={30}
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Description</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Summer sale 20% off"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Discount Type *</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                      className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="percent">Percent (%)</option>
                      <option value="fixed">Fixed ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">
                      Discount Value * {discountType === "percent" ? "(%)" : "($)"}
                    </label>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percent" ? "20" : "5.00"}
                      min="0"
                      max={discountType === "percent" ? "100" : undefined}
                      step="0.01"
                      className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Min Order ($)</label>
                    <input
                      type="number"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Max Total Uses</label>
                    <input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Unlimited"
                      min="1"
                      className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Max Uses Per User</label>
                  <input
                    type="number"
                    value={maxUsesPerUser}
                    onChange={(e) => setMaxUsesPerUser(e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Starts At</label>
                    <input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Expires At</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl text-sm font-medium">
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={saving}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Code
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
