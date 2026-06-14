import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Loader2, Gamepad2, Package, FolderOpen, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { adminApi } from "../api";
import type { Game, Category } from "../types";

export default function Games() {
  const qc = useQueryClient();
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [showGameModal, setShowGameModal] = useState<"create" | "edit" | null>(null);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [showCatModal, setShowCatModal] = useState<string | null>(null);
  const [addingSubcatFor, setAddingSubcatFor] = useState<string | null>(null);
  const [newSubcatName, setNewSubcatName] = useState("");

  const [gameName, setGameName] = useState("");
  const [gameDesc, setGameDesc] = useState("");
  const [gameGradFrom, setGameGradFrom] = useState("#1e3a5f");
  const [gameGradTo, setGameGradTo] = useState("#0f172a");
  const [gameImage, setGameImage] = useState<File | null>(null);
  const [gameFeatured, setGameFeatured] = useState(false);
  const [catName, setCatName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: gamesData, isLoading } = useQuery({ queryKey: ["panel-games"], queryFn: () => adminApi.games.list() });
  const { data: catsData } = useQuery({ queryKey: ["panel-categories"], queryFn: () => adminApi.categories.all() });

  const deleteGameMut = useMutation({
    mutationFn: adminApi.games.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-games"] }),
    onError: (err: Error) => alert(err.message),
  });

  const createCatMut = useMutation({
    mutationFn: adminApi.categories.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["panel-categories"] }); setShowCatModal(null); setCatName(""); setError(""); },
    onError: (err: Error) => setError(err.message),
  });

  const deleteCatMut = useMutation({
    mutationFn: adminApi.categories.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-categories"] }),
  });

  const addSubcatMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      adminApi.categories.addSubcategory(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panel-categories"] });
      setAddingSubcatFor(null);
      setNewSubcatName("");
    },
    onError: (err: Error) => alert(err.message),
  });

  const removeSubcatMut = useMutation({
    mutationFn: ({ catId, subId }: { catId: string; subId: string }) =>
      adminApi.categories.removeSubcategory(catId, subId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-categories"] }),
    onError: (err: Error) => alert(err.message),
  });

  const openCreate = () => {
    setGameName(""); setGameDesc(""); setGameGradFrom("#1e3a5f"); setGameGradTo("#0f172a"); setGameImage(null); setGameFeatured(false); setError("");
    setEditingGame(null);
    setShowGameModal("create");
  };

  const openEdit = (game: Game) => {
    setGameName(game.name); setGameDesc(game.description || ""); setGameGradFrom(game.gradient.from); setGameGradTo(game.gradient.to); setGameFeatured(game.featured); setGameImage(null); setError("");
    setEditingGame(game);
    setShowGameModal("edit");
  };

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim()) { setError("Game name is required"); return; }
    setSaving(true); setError("");
    try {
      const form = new FormData();
      form.append("name", gameName.trim());
      form.append("description", gameDesc);
      form.append("gradientFrom", gameGradFrom);
      form.append("gradientTo", gameGradTo);
      form.append("featured", String(gameFeatured));
      if (gameImage) form.append("image", gameImage);

      if (showGameModal === "create") {
        await adminApi.games.create(form);
      } else if (editingGame) {
        await adminApi.games.update(editingGame.slug, form);
      }
      qc.invalidateQueries({ queryKey: ["panel-games"] });
      setShowGameModal(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save game");
    } finally {
      setSaving(false);
    }
  };

  const games = gamesData?.data.games || [];
  const categories = (catsData?.data as Category[]) || [];
  const getGameCats = (slug: string) => categories.filter((c) => c.game === slug);

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">Games & Categories</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage games, categories and subcategories</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Game
        </motion.button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-[#0d1f3c] rounded-xl border border-white/5 animate-pulse" />)}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No games yet. Add your first game to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game: Game, i: number) => {
            const gameCats = getGameCats(game.slug);
            const isExpanded = expandedGame === game.slug;

            return (
              <motion.div
                key={game._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  {game.imageUrl ? (
                    <img src={game.imageUrl} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${game.gradient.from}, ${game.gradient.to})` }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-5 h-5 text-white/50" />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{game.name}</p>
                      {game.featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400">Featured</span>}
                      {!game.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-400/10 text-slate-400">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-slate-500 text-xs flex items-center gap-1"><Package className="w-3 h-3" />{game.productCount || 0} products</span>
                      <span className="text-slate-500 text-xs flex items-center gap-1"><FolderOpen className="w-3 h-3" />{gameCats.length} categories</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => { setShowCatModal(game.slug); setCatName(""); setError(""); }}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1.5">
                      <Plus className="w-3 h-3" /> Category
                    </button>
                    <button onClick={() => openEdit(game)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(`Delete game "${game.name}"?`)) deleteGameMut.mutate(game.slug); }}
                      className="w-8 h-8 rounded-lg bg-red-500/5 hover:bg-red-500/15 flex items-center justify-center text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpandedGame(isExpanded ? null : game.slug)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5">
                      <div className="p-4 space-y-2">
                        {gameCats.length === 0 ? (
                          <p className="text-slate-500 text-sm text-center py-3">No categories yet. Click "+ Category" to add one.</p>
                        ) : (
                          gameCats.map((cat) => (
                            <div key={cat._id} className="bg-white/3 border border-white/5 rounded-lg overflow-hidden">
                              <div className="flex items-center gap-3 p-3">
                                <Tag className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-200 text-sm font-medium">{cat.name}</p>
                                  {cat.subcategories?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {cat.subcategories.map((sub: { _id: string; name: string }) => (
                                        <span key={sub._id} className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded-full">
                                          {sub.name}
                                          <button
                                            onClick={() => removeSubcatMut.mutate({ catId: cat._id, subId: sub._id })}
                                            className="text-blue-400/60 hover:text-red-400 transition-colors ml-0.5"
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {addingSubcatFor === cat._id && (
                                    <div className="flex gap-2 mt-2">
                                      <input
                                        autoFocus
                                        value={newSubcatName}
                                        onChange={(e) => setNewSubcatName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && newSubcatName.trim()) {
                                            addSubcatMut.mutate({ id: cat._id, name: newSubcatName.trim() });
                                          } else if (e.key === "Escape") {
                                            setAddingSubcatFor(null); setNewSubcatName("");
                                          }
                                        }}
                                        placeholder="Subcategory name, then Enter"
                                        className="flex-1 bg-[#0a1628] border border-blue-500/40 text-white placeholder-slate-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                                      />
                                      <button
                                        onClick={() => { if (newSubcatName.trim()) addSubcatMut.mutate({ id: cat._id, name: newSubcatName.trim() }); }}
                                        disabled={addSubcatMut.isPending || !newSubcatName.trim()}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs flex items-center gap-1 disabled:opacity-50"
                                      >
                                        {addSubcatMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        Add
                                      </button>
                                      <button
                                        onClick={() => { setAddingSubcatFor(null); setNewSubcatName(""); }}
                                        className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      if (addingSubcatFor === cat._id) { setAddingSubcatFor(null); setNewSubcatName(""); }
                                      else { setAddingSubcatFor(cat._id); setNewSubcatName(""); }
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span className="hidden sm:inline">Sub</span>
                                  </button>
                                  <button
                                    onClick={() => { if (confirm(`Delete category "${cat.name}"?`)) deleteCatMut.mutate(cat._id); }}
                                    className="w-6 h-6 rounded flex items-center justify-center text-red-400/60 hover:text-red-400 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showGameModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowGameModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">{showGameModal === "create" ? "Add Game" : "Edit Game"}</h3>
                <button onClick={() => setShowGameModal(null)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleGameSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Game Name *</label>
                  <input value={gameName} onChange={(e) => setGameName(e.target.value)} required placeholder="e.g. Murder Mystery 2"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Description</label>
                  <input value={gameDesc} onChange={(e) => setGameDesc(e.target.value)} placeholder="Short description"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Gradient From</label>
                    <div className="flex gap-2">
                      <input type="color" value={gameGradFrom} onChange={(e) => setGameGradFrom(e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer" />
                      <input value={gameGradFrom} onChange={(e) => setGameGradFrom(e.target.value)}
                        className="flex-1 bg-[#0a1628] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">Gradient To</label>
                    <div className="flex gap-2">
                      <input type="color" value={gameGradTo} onChange={(e) => setGameGradTo(e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer" />
                      <input value={gameGradTo} onChange={(e) => setGameGradTo(e.target.value)}
                        className="flex-1 bg-[#0a1628] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Game Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setGameImage(e.target.files?.[0] || null)}
                    className="w-full bg-[#0a1628] border border-white/10 text-slate-400 rounded-xl px-4 py-2 text-sm focus:outline-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={gameFeatured} onChange={(e) => setGameFeatured(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  <span className="text-slate-300 text-sm">Featured game</span>
                </label>
                {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowGameModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl text-sm font-medium">Cancel</button>
                  <motion.button type="submit" disabled={saving}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {showGameModal === "create" ? "Add Game" : "Save Changes"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showCatModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCatModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1f3c] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-semibold">Add Category to {games.find((g: Game) => g.slug === showCatModal)?.name}</h3>
                <button onClick={() => setShowCatModal(null)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Category Name *</label>
                  <input
                    autoFocus
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && catName.trim()) {
                        createCatMut.mutate({ name: catName.trim(), game: showCatModal! });
                      }
                    }}
                    placeholder="e.g. Knives, Pets, Guns"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                  <p className="text-slate-600 text-xs mt-1">After creating the category, expand the game to add subcategories to it.</p>
                </div>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <div className="flex gap-3">
                  <button onClick={() => setShowCatModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
                  <button
                    onClick={() => {
                      if (!catName.trim()) { setError("Name is required"); return; }
                      createCatMut.mutate({ name: catName.trim(), game: showCatModal! });
                    }}
                    disabled={createCatMut.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                    {createCatMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Category
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
