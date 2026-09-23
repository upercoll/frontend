import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRoute, Link } from "wouter";
import { Package, Plus, Trash2, Edit2, X, Loader2, ChevronLeft, DollarSign, AlertCircle, Check, History, Layers } from "lucide-react";
import { adminApi } from "../api";

const inp = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200";
const inpStyle = { background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" };

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
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />)}
      </div>
    );
  }

  if (!collab) return <div className="p-6 text-slate-400">Collaborator not found.</div>;

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/collaboration/collaborators">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>{collab.name}</h2>
          <p className="text-sm text-slate-500">{collab.email}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${collab.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
            {collab.status === "active" ? "Active" : "Pending Invite"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Connected Products</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "#1e1b4b" }}>{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E9EBF5" }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Unpaid Balance</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "#059669" }}>${unpaidTotal.toFixed(2)}</p>
        </div>
        <Link href={`/admin/collaboration/payouts/${id}`}>
          <div className="bg-white rounded-xl p-5 cursor-pointer transition-colors hover:bg-slate-50" style={{ border: "1px solid #E9EBF5" }}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Last Payout</p>
            <p className="text-sm font-semibold mt-1" style={{ color: "#1e1b4b" }}>
              {collab.lastPayoutAt ? new Date(collab.lastPayoutAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
            </p>
            <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1"><History className="w-3 h-3" /> View payout history</p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <h3 className="font-bold text-sm" style={{ color: "#1e1b4b" }}>Connected Products ({products.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBulkModal(true); setBulkError(""); setBulkSelected([]); setBulkCut("80"); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border"
              style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}
            >
              <Layers className="w-4 h-4" /> Bulk Add
            </button>
            <button
              onClick={() => { setAddModal(true); setFormError(""); setSelectedProduct(""); setCut("80"); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#1e1b4b" }}
            >
              <Plus className="w-4 h-4" /> Connect to products
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No products connected yet. Add products to start tracking earnings.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Cut</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((cp: any) => (
                <tr key={cp._id} style={{ borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden"
                        style={{ background: cp.product?.gradient ? `linear-gradient(135deg, ${cp.product.gradient.from}, ${cp.product.gradient.to})` : "#6366f1" }}>
                        {cp.product?.imageUrl
                          ? <img src={cp.product.imageUrl} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-white/60" /></div>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{cp.productName || cp.product?.name}</p>
                        <p className="text-xs text-slate-400">{cp.product?.game || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{cp.cut}%</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setEditModal({ cpId: cp._id, cut: String(cp.cut), productName: cp.productName || cp.product?.name }); setEditCut(String(cp.cut)); setFormError(""); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "#EEF2FF", color: "#4f46e5" }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Remove ${cp.productName || cp.product?.name}?`)) removeProdMut.mutate(cp._id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "#FEE2E2", color: "#dc2626" }}>
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
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col"
              style={{ border: "1px solid #E9EBF5" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <div>
                  <h3 className="font-bold text-base" style={{ color: "#1e1b4b" }}>Bulk Add Products</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Select multiple products and set a shared cut %</p>
                </div>
                <button onClick={() => setBulkModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600" style={{ background: "#F7F8FC" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500">Collaborator Cut (%) *</label>
                  <input type="number" min="0" max="100" step="0.01" value={bulkCut} onChange={e => setBulkCut(e.target.value)}
                    placeholder="e.g. 80" className={`${inp} focus:ring-indigo-300`} style={inpStyle} />
                  <p className="text-xs text-slate-400 mt-1">This cut applies to all selected products</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500">Select Products *</label>
                    {bulkSelected.length > 0 && (
                      <span className="text-xs font-semibold text-indigo-600">{bulkSelected.length} selected</span>
                    )}
                  </div>
                  {availLoading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
                    </div>
                  ) : availableProducts.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-sm">
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
                        className="text-xs text-indigo-600 font-semibold mb-1 hover:underline"
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
                              border: isSelected ? "1px solid #6366f1" : "1px solid #E9EBF5",
                              background: isSelected ? "#EEF2FF" : "#F7F8FC",
                            }}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-indigo-600" : "bg-white border border-slate-300"}`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0"
                              style={{ background: p.gradient ? `linear-gradient(135deg, ${p.gradient.from}, ${p.gradient.to})` : "#6366f1" }}>
                              {p.imageUrl
                                ? <img src={p.imageUrl} className="w-full h-full object-cover" alt="" />
                                : <div className="w-full h-full flex items-center justify-center"><Package className="w-3 h-3 text-white/60" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: "#1e1b4b" }}>{p.name}</p>
                              <p className="text-xs text-slate-400 truncate">{p.game}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {bulkError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {bulkError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 px-6 pb-6 pt-2 flex-shrink-0">
                <button type="button" onClick={() => setBulkModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                  Cancel
                </button>
                <button
                  onClick={handleBulkAdd}
                  disabled={bulkSelected.length === 0 || bulkSaving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "#1e1b4b" }}
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
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
              style={{ border: "1px solid #E9EBF5" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <h3 className="font-bold text-base" style={{ color: "#1e1b4b" }}>Connect Product</h3>
                <button onClick={() => setAddModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600" style={{ background: "#F7F8FC" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500">Product *</label>
                  <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className={`${inp} focus:ring-indigo-300`} style={inpStyle} required>
                    <option value="">Select a product</option>
                    {availableProducts.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.game})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500">Collaborator Cut (%) *</label>
                  <input type="number" min="0" max="100" step="0.01" value={cut} onChange={e => setCut(e.target.value)}
                    placeholder="e.g. 80" className={`${inp} focus:ring-indigo-300`} style={inpStyle} required />
                  <p className="text-xs text-slate-400 mt-1">Percentage of each sale that goes to the collaborator</p>
                </div>
                {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAddModal(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "#1e1b4b" }}>
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
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl"
              style={{ border: "1px solid #E9EBF5" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <h3 className="font-bold text-base" style={{ color: "#1e1b4b" }}>Edit Cut — {editModal.productName}</h3>
                <button onClick={() => setEditModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600" style={{ background: "#F7F8FC" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleEditProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500">Cut (%) *</label>
                  <input type="number" min="0" max="100" step="0.01" value={editCut} onChange={e => setEditCut(e.target.value)}
                    className={`${inp} focus:ring-indigo-300`} style={inpStyle} autoFocus required />
                </div>
                {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditModal(null)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "#1e1b4b" }}>
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
