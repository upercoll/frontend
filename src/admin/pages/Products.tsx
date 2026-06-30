import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Edit2, Trash2, X, Loader2, Package, Star,
  CheckSquare, Square, ChevronDown, ChevronLeft, ChevronRight,
  Layers, ToggleLeft, ToggleRight, AlertCircle
} from "lucide-react";
import { adminApi } from "../api";
import type { Product, Category, Game } from "../types";
import ImageUpload from "../components/ImageUpload";

type BulkRow = { name: string; game: string; category: string; price: string; originalPrice: string; stock: string; onHand: string; imageUrl: string };

const DEFAULT_FORM = {
  name: "", description: "", game: "", category: "", price: "",
  originalPrice: "", gradFrom: "#7c3aed", gradTo: "#4c1d95",
  imageUrl: "" as string | string[], featured: false, bestSeller: false,
  stock: "-1", onHand: "-1", tags: "", active: true, outOfStock: false,
};

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Out of Stock", value: "oos" },
  { label: "Inactive", value: "inactive" },
];

function StatusBadge({ product }: { product: Product }) {
  if (!product.active)
    return <span className="text-xs px-2.5 py-1 rounded-full font-semibold border" style={{ background: "#F3F4F6", color: "#374151", borderColor: "#D1D5DB" }}>Inactive</span>;
  if (product.outOfStock)
    return <span className="text-xs px-2.5 py-1 rounded-full font-semibold border" style={{ background: "#FEF9C3", color: "#854D0E", borderColor: "#FDE047" }}>Out of Stock</span>;
  return <span className="text-xs px-2.5 py-1 rounded-full font-semibold border" style={{ background: "#ECFDF5", color: "#065F46", borderColor: "#34D399" }}>Active</span>;
}

const inp = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200";
const inpStyle = { background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" };
const labelCls = "block text-xs font-semibold mb-1.5" ;
const labelStyle = { color: "#6b7280" };

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"create" | "edit" | "bulk" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDropOpen, setBulkDropOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<{ id: string; value: string } | null>(null);
  const [stockSaving, setStockSaving] = useState<string | null>(null);
  const [editingOnHand, setEditingOnHand] = useState<{ id: string; value: string } | null>(null);
  const [onHandSaving, setOnHandSaving] = useState<string | null>(null);
  const [bulkQueue, setBulkQueue] = useState<BulkRow[]>([]);
  const [bulkDraft, setBulkDraft] = useState<BulkRow>({ name: "", game: "", category: "", price: "", originalPrice: "", stock: "-1", onHand: "-1", imageUrl: "" });
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkResult, setBulkResult] = useState<{ total: number; errors: { name: string; error: string }[] } | null>(null);

  const params: Record<string, string> = { page: String(page), limit: "20" };
  if (search) params.search = search;
  if (gameFilter) params.game = gameFilter;
  if (activeStatus) params.activeStatus = activeStatus;

  const { data, isLoading } = useQuery({ queryKey: ["panel-products", params], queryFn: () => adminApi.products.list(params) });
  const { data: gamesData } = useQuery({ queryKey: ["panel-games"], queryFn: () => adminApi.games.list() });
  const { data: allCatsData } = useQuery({ queryKey: ["panel-categories-all"], queryFn: () => adminApi.categories.all() });

  const products = (data?.data as Product[]) || [];
  const total = (data as any)?.total || 0;
  const pages = Math.ceil(total / 20) || 1;
  const games: Game[] = gamesData?.data.games || [];
  const allCats: Category[] = (allCatsData?.data as Category[]) || [];
  const formCats = form.game ? allCats.filter((c: any) => c.game === form.game) : allCats;

  const setF = (k: keyof typeof DEFAULT_FORM, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => {
    setForm(DEFAULT_FORM); setEditing(null); setFormError(""); setModal("create");
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description || "",
      game: p.game,
      category: typeof p.category === "object" ? (p.category as any)._id : p.category as string,
      price: String(p.price), originalPrice: String(p.originalPrice || ""),
      gradFrom: p.gradient.from, gradTo: p.gradient.to,
      imageUrl: p.imageUrl || "", featured: p.featured, bestSeller: p.bestSeller,
      stock: String(p.stock), onHand: String(p.onHand ?? -1), tags: p.tags?.join(", ") || "",
      active: p.active !== false, outOfStock: p.outOfStock || false,
    });
    setEditing(p); setFormError(""); setModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.game || !form.category || !form.price) {
      setFormError("Name, game, category and price are required"); return;
    }
    setSaving(true); setFormError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("description", form.description);
      fd.append("game", form.game);
      fd.append("category", form.category);
      fd.append("price", form.price);
      if (form.originalPrice) fd.append("originalPrice", form.originalPrice);
      fd.append("gradient[from]", form.gradFrom);
      fd.append("gradient[to]", form.gradTo);
      if (typeof form.imageUrl === "string" && form.imageUrl) fd.append("imageUrl", form.imageUrl);
      fd.append("featured", String(form.featured));
      fd.append("bestSeller", String(form.bestSeller));
      fd.append("stock", form.stock);
      fd.append("onHand", form.onHand);
      fd.append("outOfStock", String(form.outOfStock));
      fd.append("active", String(form.active));
      if (form.tags) fd.append("tags", form.tags.split(",").map(t => t.trim()).filter(Boolean).join(","));

      if (modal === "create") await adminApi.products.create(fd);
      else if (editing) await adminApi.products.update(editing._id, fd);

      qc.invalidateQueries({ queryKey: ["panel-products"] });
      setModal(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const saveStock = async (id: string) => {
    if (!editingStock || editingStock.id !== id) return;
    const num = parseInt(editingStock.value);
    if (isNaN(num)) { setEditingStock(null); return; }
    setStockSaving(id);
    try {
      await adminApi.products.updateStockFields(id, { stock: num, outOfStock: num === 0 });
      qc.invalidateQueries({ queryKey: ["panel-products"] });
    } catch {}
    setEditingStock(null);
    setStockSaving(null);
  };

  const saveOnHand = async (id: string) => {
    if (!editingOnHand || editingOnHand.id !== id) return;
    const num = parseInt(editingOnHand.value);
    if (isNaN(num)) { setEditingOnHand(null); return; }
    setOnHandSaving(id);
    try {
      await adminApi.products.updateStockFields(id, { onHand: num });
      qc.invalidateQueries({ queryKey: ["panel-products"] });
    } catch {}
    setEditingOnHand(null);
    setOnHandSaving(null);
  };

  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => selected.size === products.length ? setSelected(new Set()) : setSelected(new Set(products.map(p => p._id)));

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    setBulkDropOpen(false);
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`Permanently delete ${ids.length} product(s)?`)) return;
    try {
      await Promise.all(ids.map(id =>
        action === "delete" ? adminApi.products.delete(id) : adminApi.products.partialUpdate(id, { active: action === "activate" })
      ));
      qc.invalidateQueries({ queryKey: ["panel-products"] });
      setSelected(new Set());
    } catch (err: any) {
      alert(err.message || "Bulk action failed");
    }
  };

  const EMPTY_DRAFT: BulkRow = { name: "", game: "", category: "", price: "", originalPrice: "", stock: "-1", onHand: "-1", imageUrl: "" };

  const addToQueue = () => {
    const { name, game, category, price } = bulkDraft;
    if (!name.trim() || !game || !category || !price) {
      setBulkError("Name, game, category and price are required before adding"); return;
    }
    setBulkQueue(q => [...q, { ...bulkDraft, name: bulkDraft.name.trim() }]);
    setBulkDraft(d => ({ ...EMPTY_DRAFT, game: d.game, category: d.category }));
    setBulkError("");
  };

  const removeFromQueue = (i: number) => setBulkQueue(q => q.filter((_, idx) => idx !== i));

  const handleBulkSubmit = async () => {
    if (bulkQueue.length === 0) { setBulkError("Add at least one product to the list first"); return; }
    setBulkSaving(true); setBulkError(""); setBulkResult(null);
    try {
      const payload = bulkQueue.map(r => ({
        name: r.name, game: r.game, category: r.category,
        price: parseFloat(r.price),
        ...(r.originalPrice ? { originalPrice: parseFloat(r.originalPrice) } : {}),
        stock: parseInt(r.stock) || -1,
        onHand: parseInt(r.onHand) || -1,
        ...(r.imageUrl ? { imageUrl: r.imageUrl } : {}),
      }));
      const res = await adminApi.products.bulkCreate(payload);
      qc.invalidateQueries({ queryKey: ["panel-products"] });
      setBulkResult({ total: res.data.total, errors: res.data.errors as any });
      if ((res.data.errors as any[]).length === 0) {
        setModal(null);
        setBulkQueue([]);
        setBulkDraft(EMPTY_DRAFT);
      }
    } catch (err: any) {
      setBulkError(err.message || "Bulk create failed");
    } finally {
      setBulkSaving(false);
    }
  };

  const inputCls = `${inp} focus:ring-indigo-300`;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Products</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} total products</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setBulkQueue([]); setBulkDraft(EMPTY_DRAFT); setBulkError(""); setBulkResult(null); setModal("bulk"); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}>
            <Layers className="w-4 h-4" /> Bulk Add
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: "#1e1b4b" }}>
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search products by name, tag..."
                className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                style={inpStyle} />
            </div>
            <select value={gameFilter} onChange={e => { setGameFilter(e.target.value); setPage(1); }}
              className="rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ ...inpStyle, minWidth: 130 }}>
              <option value="">All Games</option>
              {games.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </select>
            {selected.size > 0 && (
              <div className="relative">
                <button onClick={() => setBulkDropOpen(o => !o)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: "#1e1b4b" }}>
                  {selected.size} selected <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {bulkDropOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl z-20 overflow-hidden"
                      style={{ border: "1px solid #E9EBF5" }}>
                      <div className="px-3 py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bulk Actions</p>
                      </div>
                      {[
                        { label: "Set Active", action: "activate" as const },
                        { label: "Set Inactive", action: "deactivate" as const },
                        { label: "Delete", action: "delete" as const },
                      ].map(item => (
                        <button key={item.action} onClick={() => handleBulkAction(item.action)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
                          style={{ color: item.action === "delete" ? "#dc2626" : "#374151" }}>
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {FILTER_TABS.map(tab => (
              <button key={tab.value} onClick={() => { setActiveStatus(tab.value); setPage(1); setSelected(new Set()); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                style={activeStatus === tab.value
                  ? { background: "#1e1b4b", color: "#fff" }
                  : { background: "#F7F8FC", color: "#6b7280", border: "1px solid #E9EBF5" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "#F7F8FC" }} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll}>
                      {selected.size === products.length && products.length > 0
                        ? <CheckSquare className="w-4 h-4" style={{ color: "#4f46e5" }} />
                        : <Square className="w-4 h-4 text-slate-300" />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Game</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">On Hand</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">In Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Sales</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: Product) => {
                  const isSelected = selected.has(p._id);
                  const isEditingThisStock = editingStock?.id === p._id;
                  return (
                    <tr key={p._id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid #F3F4F6", background: isSelected ? "#EEF2FF" : undefined }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <td className="px-4 py-3.5 w-10" onClick={e => { e.stopPropagation(); toggleSelect(p._id); }}>
                        {isSelected
                          ? <CheckSquare className="w-4 h-4" style={{ color: "#4f46e5" }} />
                          : <Square className="w-4 h-4 text-slate-300" />}
                      </td>
                      <td className="px-4 py-3.5 cursor-pointer" onClick={() => openEdit(p)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${p.gradient.from}, ${p.gradient.to})` }}>
                            {p.imageUrl
                              ? <img src={p.imageUrl} className="w-full h-full object-cover" alt="" />
                              : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-white/60" /></div>}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{p.name}</p>
                              {p.featured && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: "#EEF2FF", color: "#4f46e5" }}>{p.game}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>${p.price.toFixed(2)}</p>
                          {p.originalPrice ? <p className="text-xs text-slate-400 line-through">${p.originalPrice.toFixed(2)}</p> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        {editingOnHand?.id === p._id ? (
                          <input
                            autoFocus
                            type="number"
                            value={editingOnHand.value}
                            onChange={e => setEditingOnHand({ id: p._id, value: e.target.value })}
                            onBlur={() => saveOnHand(p._id)}
                            onKeyDown={e => { if (e.key === "Enter") saveOnHand(p._id); if (e.key === "Escape") setEditingOnHand(null); }}
                            className="w-20 px-2 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            style={{ border: "1px solid #4f46e5", color: "#1e1b4b", background: "#fff" }}
                          />
                        ) : (
                          <button onClick={() => setEditingOnHand({ id: p._id, value: String(p.onHand ?? -1) })}
                            className="flex items-center gap-1 group text-left"
                            title="Click to edit on hand quantity">
                            {onHandSaving === p._id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                              : null}
                            <span className={`text-sm font-medium ${(p.onHand ?? -1) === 0 ? "text-red-500" : (p.onHand ?? -1) === -1 ? "text-slate-400" : ""}`}
                              style={(p.onHand ?? -1) > 0 ? { color: "#1e1b4b" } : undefined}>
                              {(p.onHand ?? -1) === -1 ? "∞" : (p.onHand ?? 0)}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors ml-0.5" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        {isEditingThisStock ? (
                          <input
                            autoFocus
                            type="number"
                            value={editingStock.value}
                            onChange={e => setEditingStock({ id: p._id, value: e.target.value })}
                            onBlur={() => saveStock(p._id)}
                            onKeyDown={e => { if (e.key === "Enter") saveStock(p._id); if (e.key === "Escape") setEditingStock(null); }}
                            className="w-20 px-2 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            style={{ border: "1px solid #4f46e5", color: "#1e1b4b", background: "#fff" }}
                          />
                        ) : (
                          <button onClick={() => setEditingStock({ id: p._id, value: String(p.stock) })}
                            className="flex items-center gap-1 group text-left"
                            title="Click to edit available stock">
                            {stockSaving === p._id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                              : null}
                            <span className={`text-sm font-medium ${p.stock === 0 ? "text-red-500" : p.stock === -1 ? "text-slate-400" : ""}`}
                              style={p.stock > 0 ? { color: "#1e1b4b" } : undefined}>
                              {p.stock === -1 ? "∞" : p.stock}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors ml-0.5" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge product={p} /></td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-sm text-slate-500">{p.salesCount || 0}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(p)} title="Edit product"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: "#EEF2FF", color: "#4f46e5" }}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) adminApi.products.delete(p._id).then(() => qc.invalidateQueries({ queryKey: ["panel-products"] })); }}
                            title="Delete product"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: "#FEE2E2", color: "#dc2626" }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-sm text-slate-400">Page {page} of {pages} · {total} products</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(modal === "create" || modal === "edit") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
              className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl"
              style={{ border: "1px solid #E9EBF5" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <h3 className="font-bold text-base" style={{ color: "#1e1b4b" }}>{modal === "create" ? "Add Product" : `Edit — ${editing?.name}`}</h3>
                <button onClick={() => setModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600" style={{ background: "#F7F8FC" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls} style={labelStyle}>Product Name *</label>
                    <input value={form.name} onChange={e => setF("name", e.target.value)} required className={inputCls} style={inpStyle} placeholder="e.g. Godly Knife" />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Game *</label>
                    <select value={form.game} onChange={e => setF("game", e.target.value)} required className={inputCls} style={inpStyle}>
                      <option value="">Select game</option>
                      {games.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Category *</label>
                    <select value={form.category} onChange={e => setF("category", e.target.value)} required className={inputCls} style={inpStyle} disabled={!form.game}>
                      <option value="">Select category</option>
                      {formCats.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Price *</label>
                    <input type="number" step="0.01" min="0" value={form.price} onChange={e => setF("price", e.target.value)} required className={inputCls} style={inpStyle} placeholder="0.00" />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Original Price <span className="text-slate-400 font-normal">(for strike-through)</span></label>
                    <input type="number" step="0.01" min="0" value={form.originalPrice} onChange={e => setF("originalPrice", e.target.value)} className={inputCls} style={inpStyle} placeholder="0.00" />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>In Stock <span className="text-slate-400 font-normal">(-1 = unlimited)</span></label>
                    <input type="number" value={form.stock} onChange={e => setF("stock", e.target.value)} className={inputCls} style={inpStyle} />
                    <p className="text-[10px] text-slate-400 mt-1">Available for customers to order</p>
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>On Hand <span className="text-slate-400 font-normal">(-1 = unlimited)</span></label>
                    <input type="number" value={form.onHand} onChange={e => setF("onHand", e.target.value)} className={inputCls} style={inpStyle} />
                    <p className="text-[10px] text-slate-400 mt-1">Physical quantity in your account</p>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls} style={labelStyle}>Description</label>
                    <textarea value={form.description} onChange={e => setF("description", e.target.value)} rows={2} className={`${inputCls} resize-none`} style={inpStyle} placeholder="Short description..." />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Gradient From</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.gradFrom} onChange={e => setF("gradFrom", e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: "#E9EBF5" }} />
                      <input value={form.gradFrom} onChange={e => setF("gradFrom", e.target.value)} className={`${inputCls} flex-1`} style={inpStyle} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Gradient To</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.gradTo} onChange={e => setF("gradTo", e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: "#E9EBF5" }} />
                      <input value={form.gradTo} onChange={e => setF("gradTo", e.target.value)} className={`${inputCls} flex-1`} style={inpStyle} />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls} style={labelStyle}>Product Image</label>
                    <ImageUpload value={form.imageUrl} onChange={url => setF("imageUrl", url)} folder="rbstars/products" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls} style={labelStyle}>Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                    <input value={form.tags} onChange={e => setF("tags", e.target.value)} className={inputCls} style={inpStyle} placeholder="rare, godly, limited" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                  {[
                    { label: "Featured", key: "featured" as const },
                    { label: "Best Seller", key: "bestSeller" as const },
                    { label: "Out of Stock", key: "outOfStock" as const },
                  ].map(({ label, key }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={form[key] as boolean} onChange={e => setF(key, e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded" />
                      <span className="text-sm font-medium" style={{ color: "#374151" }}>{label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button type="button" onClick={() => setF("active", !form.active)} className="transition-colors">
                      {form.active
                        ? <ToggleRight className="w-5 h-5" style={{ color: "#16a34a" }} />
                        : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                    <span className="text-sm font-medium" style={{ color: "#374151" }}>Active / Listed</span>
                  </label>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModal(null)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                    style={{ background: "#1e1b4b" }}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {modal === "create" ? "Create Product" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === "bulk" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
              className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl"
              style={{ border: "1px solid #E9EBF5" }}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <div>
                  <h3 className="font-bold text-base" style={{ color: "#1e1b4b" }}>Quick Add Products</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Fill in a product and hit Add — repeat for each one, then create them all at once.</p>
                </div>
                <button onClick={() => setModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600" style={{ background: "#F7F8FC" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-xl p-4 space-y-3" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">New Product</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input
                        value={bulkDraft.name}
                        onChange={e => setBulkDraft(d => ({ ...d, name: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addToQueue()}
                        placeholder="Product name *"
                        className={inputCls} style={inpStyle}
                        autoFocus
                      />
                    </div>
                    <select value={bulkDraft.game} onChange={e => setBulkDraft(d => ({ ...d, game: e.target.value, category: "" }))}
                      className={inputCls} style={inpStyle}>
                      <option value="">Game *</option>
                      {games.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
                    </select>
                    <select value={bulkDraft.category} onChange={e => setBulkDraft(d => ({ ...d, category: e.target.value }))}
                      className={inputCls} style={inpStyle} disabled={!bulkDraft.game}>
                      <option value="">Category *</option>
                      {(bulkDraft.game ? allCats.filter((c: any) => c.game === bulkDraft.game) : allCats).map((c: any) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input type="number" step="0.01" min="0" value={bulkDraft.price}
                        onChange={e => setBulkDraft(d => ({ ...d, price: e.target.value }))}
                        placeholder="Price *" className={`${inputCls} pl-7`} style={inpStyle} />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input type="number" step="0.01" min="0" value={bulkDraft.originalPrice}
                        onChange={e => setBulkDraft(d => ({ ...d, originalPrice: e.target.value }))}
                        placeholder="Orig price" className={`${inputCls} pl-7`} style={inpStyle} />
                    </div>
                    <input type="number" value={bulkDraft.stock}
                      onChange={e => setBulkDraft(d => ({ ...d, stock: e.target.value }))}
                      placeholder="In Stock (-1=∞)"
                      title="Available for sale (-1 = unlimited)"
                      className={inputCls} style={inpStyle} />
                    <input type="number" value={bulkDraft.onHand}
                      onChange={e => setBulkDraft(d => ({ ...d, onHand: e.target.value }))}
                      placeholder="On Hand (-1=∞)"
                      title="Physical quantity on hand (-1 = unlimited)"
                      className={inputCls} style={inpStyle} />
                    <div className="col-span-2">
                      <ImageUpload
                        value={bulkDraft.imageUrl}
                        onChange={url => setBulkDraft(d => ({ ...d, imageUrl: url as string }))}
                        folder="rbstars/products"
                        light
                      />
                    </div>
                  </div>
                  {bulkError && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {bulkError}
                    </div>
                  )}
                  <button onClick={addToQueue}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    style={{ background: "#EEF2FF", color: "#4f46e5", border: "1px solid #c7d2fe" }}>
                    <Plus className="w-4 h-4" /> Add to List
                  </button>
                </div>

                {bulkQueue.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{bulkQueue.length} product{bulkQueue.length !== 1 ? "s" : ""} queued</p>
                      <button onClick={() => setBulkQueue([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear all</button>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5" }}>
                      {bulkQueue.map((item, i) => {
                        const catName = allCats.find((c: any) => c._id === item.category || c._id?.toString() === item.category);
                        return (
                          <div key={i} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                            style={{ borderBottom: i < bulkQueue.length - 1 ? "1px solid #F3F4F6" : undefined }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: "#1e1b4b" }}>{item.name}</p>
                              <p className="text-xs text-slate-400 truncate">
                                {item.game} · {(catName as any)?.name || item.category} · ${parseFloat(item.price || "0").toFixed(2)}
                                {item.onHand !== "-1" && item.onHand ? ` · ${item.onHand} on hand` : " · ∞ on hand"}
                              </p>
                            </div>
                            <button onClick={() => removeFromQueue(i)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {bulkResult && bulkResult.errors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-sm font-semibold text-yellow-700">{bulkResult.total} created, {bulkResult.errors.length} failed:</p>
                    {bulkResult.errors.map((e: any, i: number) => (
                      <p key={i} className="text-xs text-yellow-600">• {e.name}: {e.error}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setModal(null)}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#374151" }}>
                    Cancel
                  </button>
                  <button onClick={handleBulkSubmit} disabled={bulkSaving || bulkQueue.length === 0}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    style={{ background: "#1e1b4b" }}>
                    {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create {bulkQueue.length > 0 ? `${bulkQueue.length} ` : ""}Product{bulkQueue.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
