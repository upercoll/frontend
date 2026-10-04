import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag, Trash2, X, Loader2, Copy, Check, ToggleLeft, ToggleRight, Percent, DollarSign } from "lucide-react";
import { adminApi } from "../api";
import { PageHeader, EmptyState } from "../components/kit";

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
    if (!promo.active) return { label: "Inactive", color: "text-[var(--pn-text-3)] bg-[var(--pn-surface-2)]" };
    const now = new Date();
    if (promo.startsAt && new Date(promo.startsAt) > now) return { label: "Scheduled", color: "text-[var(--pn-warning-fg)] bg-[var(--pn-warning-bg)]" };
    if (promo.expiresAt && new Date(promo.expiresAt) < now) return { label: "Expired", color: "text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)]" };
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { label: "Exhausted", color: "text-[#c2410c] bg-[var(--pn-critical-bg)]" };
    return { label: "Active", color: "text-[var(--pn-success-fg)] bg-[var(--pn-success-bg)]" };
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <PageHeader title="Promo Codes" description="Create and manage discount codes for your store">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-[var(--pn-primary)] hover:bg-[var(--pn-primary-hover)] text-white px-4 py-2.5 rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> New Code
        </motion.button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-[var(--pn-surface)] rounded-xl border border-[var(--pn-border)] animate-pulse" />)}
        </div>
      ) : promos.length === 0 ? (
        <EmptyState icon={Tag} title="No promo codes yet. Create your first discount code." />
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
                className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--pn-action-tint)] border border-[var(--pn-action-border)] flex items-center justify-center flex-shrink-0">
                  {promo.discountType === "percent" ? (
                    <Percent className="w-4 h-4 text-[var(--pn-action)]" />
                  ) : (
                    <DollarSign className="w-4 h-4 text-[var(--pn-action)]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[var(--pn-text)] font-mono font-bold">{promo.code}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="text-[var(--pn-text-3)] text-sm">
                      {promo.discountType === "percent"
                        ? `${promo.discountValue}% off`
                        : `$${promo.discountValue.toFixed(2)} off`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {promo.description && <span className="text-[var(--pn-text-2)] text-xs">{promo.description}</span>}
                    <span className="text-[var(--pn-text-2)] text-xs">
                      Used {promo.usedCount}{promo.maxUses !== null ? `/${promo.maxUses}` : ""} times
                    </span>
                    {promo.minOrderValue > 0 && (
                      <span className="text-[var(--pn-text-2)] text-xs">Min order: ${promo.minOrderValue}</span>
                    )}
                    {promo.expiresAt && (
                      <span className="text-[var(--pn-text-2)] text-xs">
                        Expires {new Date(promo.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(promo.code, promo._id)}
                    className="w-8 h-8 rounded-lg bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text)] transition-colors"
                    title="Copy code"
                  >
                    {copiedId === promo._id ? <Check className="w-3.5 h-3.5 text-[var(--pn-success-fg)]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => toggleMut.mutate({ id: promo._id, active: !promo.active })}
                    disabled={toggleMut.isPending}
                    className="w-8 h-8 rounded-lg bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text)] transition-colors"
                    title={promo.active ? "Deactivate" : "Activate"}
                  >
                    {promo.active
                      ? <ToggleRight className="w-4 h-4 text-[var(--pn-success-fg)]" />
                      : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete promo code "${promo.code}"?`)) deleteMut.mutate(promo._id); }}
                    className="w-8 h-8 rounded-lg bg-[var(--pn-critical-bg)] hover:bg-[var(--pn-critical-bg)] flex items-center justify-center text-[var(--pn-critical-text)] transition-colors"
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
            className="fixed inset-0 pn-scrim z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl w-full max-w-md overflow-hidden my-4"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--pn-border)]">
                <h3 className="text-[var(--pn-text)] font-semibold">Create Promo Code</h3>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-[var(--pn-surface-2)] flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Code *</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER20"
                    maxLength={30}
                    className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] placeholder-[var(--pn-text-3)] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--pn-action-border)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Description</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Summer sale 20% off"
                    className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] placeholder-[var(--pn-text-3)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Discount Type *</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                      className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                    >
                      <option value="percent">Percent (%)</option>
                      <option value="fixed">Fixed ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">
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
                      className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] placeholder-[var(--pn-text-3)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Min Order ($)</label>
                    <input
                      type="number"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] placeholder-[var(--pn-text-3)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Max Total Uses</label>
                    <input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Unlimited"
                      min="1"
                      className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] placeholder-[var(--pn-text-3)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Max Uses Per User</label>
                  <input
                    type="number"
                    value={maxUsesPerUser}
                    onChange={(e) => setMaxUsesPerUser(e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] placeholder-[var(--pn-text-3)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Starts At</label>
                    <input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--pn-text-3)] text-sm font-medium block mb-1.5">Expires At</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--pn-action-border)]"
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-[var(--pn-critical-text)] text-sm bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 bg-[var(--pn-surface-2)] hover:bg-[var(--pn-surface-2)] text-[var(--pn-text-2)] py-3 rounded-xl text-sm font-medium">
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={saving}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 bg-[var(--pn-primary)] hover:bg-[var(--pn-primary-hover)] text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
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
