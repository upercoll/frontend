import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Gamepad2, UserPlus, UserMinus, Loader2, Tag, ChevronDown, ChevronUp, Users } from "lucide-react";
import { adminApi } from "../api";
import type { Game, TeamMember, Category } from "../types";

export default function ClaimTeams() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<string | null>(null);

  const { data: gamesData } = useQuery({ queryKey: ["panel-games"], queryFn: () => adminApi.games.list() });
  const { data: membersData } = useQuery({ queryKey: ["panel-team", "active"], queryFn: () => adminApi.team.list({ status: "active" }) });
  const { data: catsData } = useQuery({ queryKey: ["panel-categories"], queryFn: () => adminApi.categories.all() });

  const games: Game[] = gamesData?.data.games || [];
  const members: TeamMember[] = membersData?.data.members || [];
  const allCategories: Category[] = (catsData?.data as Category[]) || [];

  const claimAgents = members.filter((m) =>
    m.role?.permissions?.includes("claim_agent")
  );

  const getAgentsForGame = (slug: string) =>
    claimAgents.filter((m) => m.claimGames?.includes(slug));

  const getUnassignedForGame = (slug: string) =>
    claimAgents.filter((m) => !m.claimGames?.includes(slug));

  const getAgentsForCategory = (catId: string) =>
    claimAgents.filter((m) => m.claimCategories?.includes(catId));

  const getUnassignedForCategory = (catId: string) =>
    claimAgents.filter((m) => !m.claimCategories?.includes(catId));

  const toggleAgentGame = async (member: TeamMember, gameSlug: string, add: boolean) => {
    setSaving(`g-${member._id}-${gameSlug}`);
    try {
      const newGames = add
        ? [...(member.claimGames || []), gameSlug]
        : (member.claimGames || []).filter((g) => g !== gameSlug);
      await adminApi.team.update(member._id, { claimGames: newGames });
      qc.invalidateQueries({ queryKey: ["panel-team"] });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(null);
    }
  };

  const toggleAgentCategory = async (member: TeamMember, catId: string, add: boolean) => {
    setSaving(`c-${member._id}-${catId}`);
    try {
      const currentCats = member.claimCategories || [];
      const newCats = add
        ? [...currentCats, catId]
        : currentCats.filter((c: string) => c !== catId);
      await adminApi.team.update(member._id, { claimCategories: newCats });
      qc.invalidateQueries({ queryKey: ["panel-team"] });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-white font-semibold text-lg">Claim Teams</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Assign agents to games (they receive all claims for that game) or to specific categories (they only receive claims for those categories).
        </p>
      </div>

      {claimAgents.length === 0 && (
        <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 text-yellow-300 text-sm">
          No active claim agents found. Invite team members with the <strong>Claim Agent</strong> permission to get started.
        </div>
      )}

      {games.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No games found. Add games first.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {games.filter((g) => g.active).map((game: Game, i: number) => {
            const assigned = getAgentsForGame(game.slug);
            const available = getUnassignedForGame(game.slug);
            const gameCats = allCategories.filter((c) => c.game === game.slug);
            const isCatsExpanded = expandedCats === game.slug;

            return (
              <motion.div key={game._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[#0d1f3c] border border-white/5 rounded-xl overflow-hidden">

                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  {game.imageUrl ? (
                    <img src={game.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${game.gradient.from}, ${game.gradient.to})` }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-white/50" />
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-semibold">{game.name}</p>
                    <p className="text-slate-500 text-xs">{assigned.length} agent{assigned.length !== 1 ? "s" : ""} assigned to game</p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Game-level assignment
                    </p>
                    <p className="text-slate-600 text-xs mb-3">Agents assigned here receive ALL claim requests for {game.name}, regardless of category.</p>

                    {assigned.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Assigned</p>
                        {assigned.map((agent) => (
                          <div key={agent._id} className="flex items-center gap-3 bg-emerald-400/5 border border-emerald-400/10 rounded-lg px-3 py-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-emerald-400 text-xs font-bold">
                                {(agent.profile?.displayName || agent.email)[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-200 text-sm font-medium truncate">{agent.profile?.displayName || agent.email.split("@")[0]}</p>
                              <p className="text-slate-500 text-xs truncate">{agent.email}</p>
                            </div>
                            <button
                              onClick={() => toggleAgentGame(agent, game.slug, false)}
                              disabled={saving === `g-${agent._id}-${game.slug}`}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors disabled:opacity-50">
                              {saving === `g-${agent._id}-${game.slug}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {available.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Available to Assign</p>
                        {available.map((agent) => (
                          <div key={agent._id} className="flex items-center gap-3 bg-white/2 border border-white/5 rounded-lg px-3 py-2">
                            <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-400 text-xs font-bold">
                                {(agent.profile?.displayName || agent.email)[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-300 text-sm truncate">{agent.profile?.displayName || agent.email.split("@")[0]}</p>
                              <p className="text-slate-500 text-xs truncate">{agent.email}</p>
                            </div>
                            <button
                              onClick={() => toggleAgentGame(agent, game.slug, true)}
                              disabled={saving === `g-${agent._id}-${game.slug}`}
                              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs transition-colors disabled:opacity-50">
                              {saving === `g-${agent._id}-${game.slug}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                              Assign
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {claimAgents.length === 0 && (
                      <p className="text-slate-600 text-sm text-center py-2">No claim agents available</p>
                    )}
                  </div>

                  {gameCats.length > 0 && (
                    <div className="border-t border-white/5 pt-3">
                      <button
                        onClick={() => setExpandedCats(isCatsExpanded ? null : game.slug)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium uppercase tracking-wider w-full text-left transition-colors"
                      >
                        <Tag className="w-3 h-3" />
                        Category-level assignment ({gameCats.length} categories)
                        {isCatsExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                      </button>
                      <p className="text-slate-600 text-xs mt-1 mb-2">
                        Agents assigned to a category only receive claims from that category.
                      </p>

                      {isCatsExpanded && (
                        <div className="space-y-3 mt-3">
                          {gameCats.map((cat) => {
                            const catAssigned = getAgentsForCategory(cat._id);
                            const catAvailable = getUnassignedForCategory(cat._id);
                            return (
                              <div key={cat._id} className="bg-white/2 border border-white/5 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Tag className="w-3 h-3 text-purple-400" />
                                  <p className="text-slate-200 text-sm font-medium">{cat.name}</p>
                                  <span className="text-slate-600 text-xs">{catAssigned.length} agent{catAssigned.length !== 1 ? "s" : ""}</span>
                                </div>

                                <div className="space-y-1.5">
                                  {catAssigned.map((agent) => (
                                    <div key={agent._id} className="flex items-center gap-2 bg-purple-400/5 border border-purple-400/10 rounded-lg px-2.5 py-1.5">
                                      <div className="w-5 h-5 rounded-full bg-purple-400/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-purple-400 text-[10px] font-bold">
                                          {(agent.profile?.displayName || agent.email)[0].toUpperCase()}
                                        </span>
                                      </div>
                                      <p className="text-slate-300 text-xs flex-1 truncate">{agent.profile?.displayName || agent.email.split("@")[0]}</p>
                                      <button
                                        onClick={() => toggleAgentCategory(agent, cat._id, false)}
                                        disabled={saving === `c-${agent._id}-${cat._id}`}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition-colors disabled:opacity-50">
                                        {saving === `c-${agent._id}-${cat._id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <UserMinus className="w-2.5 h-2.5" />}
                                        Remove
                                      </button>
                                    </div>
                                  ))}

                                  {catAvailable.map((agent) => (
                                    <div key={agent._id} className="flex items-center gap-2 bg-white/2 border border-white/5 rounded-lg px-2.5 py-1.5 opacity-60 hover:opacity-100 transition-opacity">
                                      <div className="w-5 h-5 rounded-full bg-slate-500/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-slate-500 text-[10px] font-bold">
                                          {(agent.profile?.displayName || agent.email)[0].toUpperCase()}
                                        </span>
                                      </div>
                                      <p className="text-slate-500 text-xs flex-1 truncate">{agent.profile?.displayName || agent.email.split("@")[0]}</p>
                                      <button
                                        onClick={() => toggleAgentCategory(agent, cat._id, true)}
                                        disabled={saving === `c-${agent._id}-${cat._id}`}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-[10px] transition-colors disabled:opacity-50">
                                        {saving === `c-${agent._id}-${cat._id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <UserPlus className="w-2.5 h-2.5" />}
                                        Assign
                                      </button>
                                    </div>
                                  ))}

                                  {claimAgents.length === 0 && (
                                    <p className="text-slate-600 text-xs text-center py-1">No claim agents</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
