import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, X, Loader2, Package, Star, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "../api";
import type { Product, Category, Game } from "../types";
import ImageUpload from "../components/ImageUpload";

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [game, setGame] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [gradFrom, setGradFrom] = useState("#7c3aed");
  const [gradTo, setGradTo] = useState("#4c1d95");
  const [imageUrl, setImageUrl] = useState<string | string[]>("");
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [stock, setStock] = useState("-1");
  const [tags, setTags] = useState("");

  const params: Record<string, string> = { page: String(page), limit: "20" };
  if (search) params.search = search;
  if (gameFilter) params.game = gameFilter;

  const { data, isLoading } = useQuery({ queryKey: ["panel-products", params], queryFn: () => adminApi.products.list(params) });
  const { data: gamesData } = useQuery({ queryKey: ["panel-games"], queryFn: () => adminApi.games.list() });
  const { data: catsData } = useQuery({ queryKey: ["panel-categories", game], queryFn: () => adminApi.categories.all(game || undefined), enabled: !!game });

  const deleteMut = useMutation({
    mutationFn: adminApi.products.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-products"] }),
  });

  const openCreate = () => {
    setName(""); setDescription(""); setGame(""); setCategory(""); setPrice(""); setOriginalPrice("");
    setGradFrom("#7c3aed"); setGradTo("#4c1d95"); setImageUrl(""); setFeatured(false); setBestSeller(false); setStock("-1"); setTags(""); setError("");
    setEditing(null); setModal("create");
  };

  const openEdit = (product: Product) => {
    setName(product.name); setDescription(product.description || ""); setGame(product.game);
    setCategory(typeof product.category === "object" ? product.category._id : product.category as string);
    setPrice(String(product.price)); setOriginalPrice(String(product.originalPrice || ""));
    setGradFrom(product.gradient.from); setGradTo(product.gradient.to);
    setImageUrl(product.imageUrl || ""); setFeatured(product.featured); setBestSeller(product.bestSeller);
    setStock(String(product.stock)); setTags(product.tags?.join(", ") || ""); setError("");
    setEditing(product); setModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !game || !category || !price) { setError("Name, game, category and price are required"); return; }
    setSaving(true); setError("");
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("description", description);
      form.append("game", game);
      form.append("category", category);
      form.append("price", price);
      if (originalPrice) form.append("originalPrice", originalPrice);
      form.append("gradient[from]", gradFrom);
      form.append("gradient[to]", gradTo);
      if (typeof imageUrl === "string" && imageUrl) form.append("imageUrl", imageUrl);
      form.append("featured", String(featured));
      form.append("bestSeller", String(bestSeller));
      form.append("stock", stock);
      if (tags) form.append("tags", tags.split(",").map((t) => t.trim()).join(","));

      if (modal === "create") await adminApi.products.create(form);
      else if (editing) await adminApi.products.update(editing._id, form);

      qc.invalidateQueries({ queryKey: ["panel-products"] });
      setModal(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const products = (data?.data as Product[]) || [];
  const total = (data as { total?: number })?.total || 0;
  const pages = Math.ceil(total / 20);
  const games = gamesData?.data.games || [];
  const cats = (catsData?.data as Category[]) || [];

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">Products</h2>
          <p className="text-slate-400 text-sm mt-0.5">{total} total products</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..."
              className="w-full bg-[#0d1f3c] border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
          <select value={gameFilter} onChange={(e) => { setGameFilter(e.target.value); setPage(1); }}
            className="bg-[#0d1f3c] border border-white/10 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
            <option value="">All Games</option>
            {games.map((g: Game) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
          </select>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex-shrink-0">
            <Plus className="w-4 h-4" /> Add Product
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-48 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product: Product, i: number) => (
            <motion.div key={product._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors group">
              <div className="aspect-square relative" style={{ background: `linear-gradient(135deg, ${product.gradient.from}, ${product.gradient.to})` }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-white/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {product.featured && <span className="w-5 h-5 bg-yellow-400/90 rounded flex items-center justify-center"><Star className="w-3 h-3 text-yellow-900" /></span>}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(product)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMut.mutate(product._id)} className="w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center text-white transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-white text-xs font-medium truncate">{product.name}</p>
                <p className="text-slate-500 text-[10px] truncate">{product.game}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-blue-400 text-sm font-bold">${product.price.toFixed(2)}</span>
                  {product.originalPrice && <span className="text-slate-600 text-xs line-through">${product.originalPrice.toFixed(2)}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg bg-[#0d1f3c] border border-white/5 disabled:opacity-30 flex items-center justify-center text-slate-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="w-8 h-8 rounded-lg bg-[#0d1f3c] border border-white/5 disabled:opacity-30 flex items-center justify-center text-slate-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-xl my-8"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">{modal === "create" ? "Add Product" : "Edit Product"}</h3>
                <button onClick={() => setModal(null)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Product Name *</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required
                      className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Game *</label>
                    <select value={game} onChange={(e) => { setGame(e.target.value); setCategory(""); }} required
                      className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50">
                      <option value="">Select game</option>
                      {games.map((g: Game) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Category *</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required
                      className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50">
                      <option value="">Select category</option>
                      {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Price *</label>
                    <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required
                      className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Original Price</label>
                    <input type="number" step="0.01" min="0" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                    className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Gradient From</label>
                    <div className="flex gap-2"><input type="color" value={gradFrom} onChange={(e) => setGradFrom(e.target.value)} className="w-10 h-10 rounded-lg border border-white/10" />
                      <input value={gradFrom} onChange={(e) => setGradFrom(e.target.value)} className="flex-1 bg-[#0a1628] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Gradient To</label>
                    <div className="flex gap-2"><input type="color" value={gradTo} onChange={(e) => setGradTo(e.target.value)} className="w-10 h-10 rounded-lg border border-white/10" />
                      <input value={gradTo} onChange={(e) => setGradTo(e.target.value)} className="flex-1 bg-[#0a1628] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Product Image</label>
                  <ImageUpload
                    value={imageUrl}
                    onChange={(url) => setImageUrl(url)}
                    folder="rbstars/products"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Tags (comma-separated)</label>
                  <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="rare, godly, limited"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Stock (-1 = unlimited)</label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-[#0a1628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-blue-600 w-4 h-4" /><span className="text-slate-300 text-sm">Featured</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={bestSeller} onChange={(e) => setBestSeller(e.target.checked)} className="accent-blue-600 w-4 h-4" /><span className="text-slate-300 text-sm">Best Seller</span></label>
                </div>
                {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl text-sm font-medium">Cancel</button>
                  <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {modal === "create" ? "Add Product" : "Save Changes"}
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
