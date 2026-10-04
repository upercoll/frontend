import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRoute, Link } from "wouter";
import { Package, Plus, Trash2, Edit2, X, Loader2, ChevronLeft, DollarSign, AlertCircle, Check, History, Layers } from "lucide-react";
import { adminApi } from "../api";
import { PageHeader } from "../components/kit";

const inp = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200";
const inpStyle = { background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" };

export default function CollabView() {
  const [, params] = useRoute("/admin/collaboration/view/:id");
  const id = params?.id || "";
  const qc = useQueryClient();

  const [addModal, setAddModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [editModal, setEditModal] = useState<{ cpId: string; cut: string; productName: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [cut, setCut] = useState("80");
  const [editCut, setEditCut] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkCut, setBulkCut] = useState("80");
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["collab-view", id],
    queryFn: () => adminApi.collab.getCollaborator(id),
    enabled: !!id,
  });

  const { data: availData, isLoading: availLoading } = useQuery({
    queryKey: ["collab-available-products", id],
    queryFn: () => adminApi.collab.getAvailableProducts(id),
    enabled: !!id && (addModal || bulkModal),
  });

  const removeProdMut = useMutation({
    mutationFn: (cpId: string) => adminApi.collab.removeProduct(id, cpId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collab-view", id] }),
  });

  const collab = (data as any)?.data?.collaborator;
  const products: any[] = (data as any)?.data?.products || [];
  const unpaidTotal: number = (data as any)?.data?.unpaidTotal || 0;
  const availableProducts: any[] = (availData as any)?.data?.products || [];

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) { setFormError("Select a product"); return; }
    const cutNum = parseFloat(cut);
    if (isNaN(cutNum) || cutNum < 0 || cutNum > 100) { setFormError("Cut must be 0–100"); return; }
    setSaving(true); setFormError("");
    try {
      await adminApi.collab.addProduct(id, selectedProduct, cutNum);
      qc.invalidateQueries({ queryKey: ["collab-view", id] });
      qc.invalidateQueries({ queryKey: ["collab-available-products", id] });
      setAddModal(false);
      setSelectedProduct(""); setCut("80");
    } catch (err: any) {
      setFormError(err.message || "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    const cutNum = parseFloat(editCut);
    if (isNaN(cutNum) || cutNum < 0 || cutNum > 100) { setFormError("Cut must be 0–100"); return; }
    setSaving(true); setFormError("");
    try {
      await adminApi.collab.updateProduct(id, editModal.cpId, cutNum);
      qc.invalidateQueries({ queryKey: ["collab-view", id] });
      setEditModal(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    if (bulkSelected.length === 0) { setBulkError("Select at least one product"); return; }
    const cutNum = parseFloat(bulkCut);
    if (isNaN(cutNum) || cutNum < 0 || cutNum > 100) { setBulkError("Cut must be 0–100"); return; }
    setBulkSaving(true); setBulkError("");
    let failed = 0;
    for (const productId of bulkSelected) {
      try {
        await adminApi.collab.addProduct(id, productId, cutNum);
      } catch {
        failed++;
      }
    }
    qc.invalidateQueries({ queryKey: ["collab-view", id] });
    qc.invalidateQueries({ queryKey: ["collab-available-products", id] });
    if (failed > 0) {
      setBulkError(`${failed} products failed to add.`);
    } else {
      setBulkModal(false);
    }
    setBulkSelected([]);
    setBulkSaving(false);
  };

  const toggleBulkProduct = (productId: string) => {
    setBulkSelected(prev =>
      prev.includes(productId) ? prev.filter(p => p !== productId) : [...prev, productId]
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-3 max-w-[1200px] mx-auto">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--pn-surface-2)" }} />)}
      </div>
    );
  }

  if (!collab) return <div className="p-6 text-[var(--pn-text-3)]">Collaborator not found.</div>;

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/collaboration/collaborators">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Link>
        <PageHeader title={collab.name} description={collab.email} icon={Package}>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${collab.status === "active" ? "bg-[var(--pn-success-bg)] text-[var(--pn-success-fg)] border-[var(--pn-success-line)]" : "bg-[var(--pn-warning-bg)] text-[var(--pn-warning-fg)] border-[var(--pn-warning-line)]"}`}>
            {collab.status === "active" ? "Active" : "Pending Invite"}
          </span>
        </PageHeader>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
          <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Connected Products</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--pn-text)" }}>{products.length}</p>
        </div>
        <div className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
          <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Unpaid Balance</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--pn-success-fg)" }}>${unpaidTotal.toFixed(2)}</p>
        </div>
        <Link href={`/admin/collaboration/payouts/${id}`}>
          <div className="bg-[var(--pn-surface)] rounded-xl p-5 cursor-pointer transition-colors hover:bg-[var(--pn-surface-2)]" style={{ border: "1px solid var(--pn-border)" }}>
            <p className="text-xs font-semibold text-[var(--pn-text-3)] uppercase tracking-wide">Last Payout</p>
            <p className="text-sm font-semibold mt-1" style={{ color: "var(--pn-text)" }}>
              {collab.lastPayoutAt ? new Date(collab.lastPayoutAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
            </p>
            <p className="text-xs text-[var(--pn-action)] mt-1 flex items-center gap-1"><History className="w-3 h-3" /> View payout history</p>
          </div>
        </Link>
      </div>

      <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
          <div>
            <h3 className="font-bold text-sm" style={{ color: "var(--pn-text)" }}>Connected Products ({products.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBulkModal(true); setBulkError(""); setBulkSelected([]); setBulkCut("80"); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
            >
              <Layers className="w-4 h-4" /> Bulk Add
            </button>
            <button
              onClick={() => { setAddModal(true); setFormError(""); setSelectedProduct(""); setCut("80"); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--pn-primary)" }}
            >
              <Plus className="w-4 h-4" /> Connect to products
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center text-[var(--pn-text-3)]">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No products connected yet. Add products to start tracking earnings.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Cut</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((cp: any) => (
                <tr key={cp._id} style={{ borderBottom: "1px solid var(--pn-border)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden"
                        style={{ background: cp.product?.gradient ? `linear-gradient(135deg, ${cp.product.gradient.from}, ${cp.product.gradient.to})` : "var(--pn-action)" }}>
                        {cp.product?.imageUrl
                          ? <img src={cp.product.imageUrl} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-[var(--pn-text-2)]" /></div>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>{cp.productName || cp.product?.name}</p>
                        <p className="text-xs text-[var(--pn-text-3)]">{cp.product?.game || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>{cp.cut}%</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setEditModal({ cpId: cp._id, cut: String(cp.cut), productName: cp.productName || cp.product?.name }); setEditCut(String(cp.cut)); setFormError(""); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Remove ${cp.productName || cp.product?.name}?`)) removeProdMut.mutate(cp._id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--pn-critical-bg)", color: "var(--pn-critical-text)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {bulkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setBulkModal(false)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
              className="pn-modal w-full max-w-lg max-h-[80vh] flex flex-col"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                <div>
                  <h3 className="font-bold text-base" style={{ color: "var(--pn-text)" }}>Bulk Add Products</h3>
                  <p className="text-xs text-[var(--pn-text-3)] mt-0.5">Select multiple products and set a shared cut %</p>
                </div>
                <button onClick={() => setBulkModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text-2)]" style={{ background: "var(--pn-surface-2)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--pn-text-2)]">Collaborator Cut (%) *</label>
                  <input type="number" min="0" max="100" step="0.01" value={bulkCut} onChange={e => setBulkCut(e.target.value)}
                    placeholder="e.g. 80" className={`${inp} focus:ring-[var(--pn-action-border)]`} style={inpStyle} />
                  <p className="text-xs text-[var(--pn-text-3)] mt-1">This cut applies to all selected products</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[var(--pn-text-2)]">Select Products *</label>
                    {bulkSelected.length > 0 && (
                      <span className="text-xs font-semibold text-[var(--pn-action)]">{bulkSelected.length} selected</span>
                    )}
                  </div>
                  {availLoading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-5 h-5 text-[var(--pn-text-3)] animate-spin mx-auto" />
                    </div>
                  ) : availableProducts.length === 0 ? (
                    <div className="py-6 text-center text-[var(--pn-text-3)] text-sm">
                      All products are already connected.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (bulkSelected.length === availableProducts.length) {
                            setBulkSelected([]);
                          } else {
                            setBulkSelected(availableProducts.map((p: any) => p._id));
                          }
                        }}
                        className="text-xs text-[var(--pn-action)] font-semibold mb-1 hover:underline"
                      >
                        {bulkSelected.length === availableProducts.length ? "Deselect all" : "Select all"}
                      </button>
                      {availableProducts.map((p: any) => {
                        const isSelected = bulkSelected.includes(p._id);
                        return (
                          <div
                            key={p._id}
                            onClick={() => toggleBulkProduct(p._id)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                            style={{
                              border: isSelected ? "1px solid var(--pn-action-border)" : "1px solid var(--pn-border)",
                              background: isSelected ? "var(--pn-action-tint)" : "var(--pn-surface-2)",
                            }}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-[var(--pn-primary)]" : "bg-[var(--pn-surface)] border border-[var(--pn-border)]"}`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-[var(--pn-text)]" />}
                            </div>
                            <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0"
                              style={{ background: p.gradient ? `linear-gradient(135deg, ${p.gradient.from}, ${p.gradient.to})` : "var(--pn-action)" }}>
                              {p.imageUrl
                                ? <img src={p.imageUrl} className="w-full h-full object-cover" alt="" />
                                : <div className="w-full h-full flex items-center justify-center"><Package className="w-3 h-3 text-[var(--pn-text-2)]" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: "var(--pn-text)" }}>{p.name}</p>
                              <p className="text-xs text-[var(--pn-text-3)] truncate">{p.game}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {bulkError && (
                  <div className="text-sm text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-lg px-3 py-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {bulkError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 px-6 pb-6 pt-2 flex-shrink-0">
                <button type="button" onClick={() => setBulkModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                  Cancel
                </button>
                <button
                  onClick={handleBulkAdd}
                  disabled={bulkSelected.length === 0 || bulkSaving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "var(--pn-primary)" }}
                >
                  {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  Add {bulkSelected.length > 0 ? `${bulkSelected.length} ` : ""}Products
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setAddModal(false)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
              className="pn-modal w-full max-w-md"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                <h3 className="font-bold text-base" style={{ color: "var(--pn-text)" }}>Connect Product</h3>
                <button onClick={() => setAddModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text-2)]" style={{ background: "var(--pn-surface-2)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--pn-text-2)]">Product *</label>
                  <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className={`${inp} focus:ring-[var(--pn-action-border)]`} style={inpStyle} required>
                    <option value="">Select a product</option>
                    {availableProducts.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.game})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--pn-text-2)]">Collaborator Cut (%) *</label>
                  <input type="number" min="0" max="100" step="0.01" value={cut} onChange={e => setCut(e.target.value)}
                    placeholder="e.g. 80" className={`${inp} focus:ring-[var(--pn-action-border)]`} style={inpStyle} required />
                  <p className="text-xs text-[var(--pn-text-3)] mt-1">Percentage of each sale that goes to the collaborator</p>
                </div>
                {formError && <div className="text-sm text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-lg px-3 py-2">{formError}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAddModal(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "var(--pn-primary)" }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Connect
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setEditModal(null)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
              className="pn-modal w-full max-w-sm"
              style={{ border: "1px solid var(--pn-border)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--pn-border)" }}>
                <h3 className="font-bold text-base" style={{ color: "var(--pn-text)" }}>Edit Cut — {editModal.productName}</h3>
                <button onClick={() => setEditModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text-2)]" style={{ background: "var(--pn-surface-2)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleEditProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--pn-text-2)]">Cut (%) *</label>
                  <input type="number" min="0" max="100" step="0.01" value={editCut} onChange={e => setEditCut(e.target.value)}
                    className={`${inp} focus:ring-[var(--pn-action-border)]`} style={inpStyle} autoFocus required />
                </div>
                {formError && <div className="text-sm text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-lg px-3 py-2">{formError}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditModal(null)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                    style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "var(--pn-primary)" }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save
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
