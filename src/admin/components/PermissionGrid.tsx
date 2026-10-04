import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Search, ShieldAlert, Sparkles, X } from "lucide-react";
import { ALL_PERMISSIONS } from "../types";
import {
  IMPLIED_BY,
  PERMISSION_PRESETS,
  PERMISSION_UNLOCKS,
  SENSITIVE_PERMISSIONS,
} from "../permissions";
import { cn } from "@/lib/utils";

interface PermissionGridProps {
  selected: string[];
  onChange: (perms: string[]) => void;
  readOnly?: boolean;
}

/**
 * The complete permission picker.
 *
 * Every capability in the admin panel is listed here — the grid reads straight
 * from ALL_PERMISSIONS, which is kept in lockstep with the backend's PERMISSIONS
 * enum, so there is no such thing as an admin feature that cannot be delegated.
 *
 * On top of the raw list it adds the things you actually need to manage roles:
 *   • search across label / description / key
 *   • "N of M selected" coverage readout
 *   • role presets (read-only, support agent, content editor, store manager)
 *   • per-group select / clear
 *   • implied-by markers so broad keys (manage_orders) aren't granted twice
 *   • a plain-English "this unlocks X" line, and a warning on money/destructive keys
 */
export default function PermissionGrid({ selected, onChange, readOnly = false }: PermissionGridProps) {
  const [query, setQuery] = useState("");

  const groups = useMemo(
    () => Array.from(new Set(ALL_PERMISSIONS.map((p) => p.group))),
    []
  );

  /** key → the broad permission that already grants it */
  const impliedBy = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [broad, children] of Object.entries(IMPLIED_BY)) {
      children.forEach((c) => { map[c] = broad; });
    }
    return map;
  }, []);

  const toggle = (key: string) => {
    if (readOnly) return;
    if (selected.includes(key)) {
      onChange(selected.filter((p) => p !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const toggleGroup = (group: string) => {
    if (readOnly) return;
    const groupKeys = ALL_PERMISSIONS.filter((p) => p.group === group).map((p) => p.key);
    const allSelected = groupKeys.every((k) => selected.includes(k));
    if (allSelected) {
      onChange(selected.filter((p) => !groupKeys.includes(p)));
    } else {
      const next = [...selected];
      groupKeys.forEach((k) => { if (!next.includes(k)) next.push(k); });
      onChange(next);
    }
  };

  const q = query.trim().toLowerCase();
  const visibleGroups = groups
    .map((g) => ({
      group: g,
      perms: ALL_PERMISSIONS.filter((p) => p.group === g).filter(
        (p) =>
          !q ||
          p.label.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q)
      ),
    }))
    .filter((g) => g.perms.length > 0);

  const total = ALL_PERMISSIONS.length;
  const picked = selected.length;
  const pct = total ? Math.round((picked / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* ── Coverage + master controls ─────────────────────────────────── */}
      <div
        className="rounded-lg p-3 space-y-3"
        style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span style={{ color: "var(--pn-text-2)" }}>
                <strong style={{ color: "var(--pn-text)" }}>{picked}</strong> of {total} permissions selected
              </span>
              <span style={{ color: "var(--pn-text-3)" }}>{pct}%</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--pn-surface)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: pct === 100
                    ? "var(--pn-warning-fg)"
                    : "var(--pn-action)",
                }}
              />
            </div>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <button
                onClick={() => onChange(ALL_PERMISSIONS.map((p) => p.key))}
                className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold"
                style={{ background: "var(--pn-surface)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}
              >
                Select all
              </button>
              <button
                onClick={() => onChange([])}
                className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-1"
                style={{ background: "var(--pn-surface)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Presets */}
        {!readOnly && (
          <div className="flex gap-2 flex-wrap pt-1">
            <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "var(--pn-text-3)" }}>
              <Sparkles className="w-3 h-3" /> Presets:
            </span>
            {PERMISSION_PRESETS.map((preset) => {
              const active =
                preset.permissions.length === picked &&
                preset.permissions.every((p) => selected.includes(p));
              return (
                <button
                  key={preset.id}
                  title={preset.blurb}
                  onClick={() => onChange(preset.permissions)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors"
                  style={{
                    background: active ? "var(--pn-action-tint)" : "var(--pn-surface)",
                    border: `1px solid ${active ? "var(--pn-action-border)" : "var(--pn-border)"}`,
                    color: active ? "var(--pn-action)" : "var(--pn-text-2)",
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      {total > 12 && (
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "var(--pn-text-3)" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search permissions…"
            className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
            style={{
              background: "var(--pn-surface)",
              border: "1px solid var(--pn-border)",
              color: "var(--pn-text)",
            }}
          />
          {query && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: "var(--pn-text-3)" }}>
              {visibleGroups.reduce((n, g) => n + g.perms.length, 0)} match
            </span>
          )}
        </div>
      )}

      {/* ── Groups ─────────────────────────────────────────────────────── */}
      {visibleGroups.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--pn-text-3)" }}>
          No permission matches “{query}”.
        </p>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map(({ group, perms }) => {
            const groupKeys = perms.map((p) => p.key);
            const allSelected = groupKeys.every((k) => selected.includes(k));
            const someSelected = groupKeys.some((k) => selected.includes(k));

            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => toggleGroup(group)}
                    disabled={readOnly}
                    aria-label={`Toggle ${group}`}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                      allSelected
                        ? "bg-[var(--pn-primary)] border-[var(--pn-primary)]"
                        : someSelected
                          ? "bg-[var(--pn-action-tint)] border-[var(--pn-action-border)]"
                          : "border-[var(--pn-border-strong)] bg-[var(--pn-surface)]",
                      readOnly && "cursor-default"
                    )}
                  >
                    {(allSelected || someSelected) && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--pn-text-3)" }}>
                    {group}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--pn-text-3)" }}>
                    {groupKeys.filter((k) => selected.includes(k)).length}/{groupKeys.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                  {perms.map((perm) => {
                    const isSelected = selected.includes(perm.key);
                    const parent = impliedBy[perm.key];
                    const implied = !isSelected && !!parent && selected.includes(parent);
                    const unlocks = PERMISSION_UNLOCKS[perm.key] || [];
                    const sensitive = SENSITIVE_PERMISSIONS[perm.key];

                    return (
                      <motion.button
                        key={perm.key}
                        whileHover={!readOnly ? { scale: 1.005 } : {}}
                        whileTap={!readOnly ? { scale: 0.995 } : {}}
                        onClick={() => toggle(perm.key)}
                        disabled={readOnly}
                        title={unlocks.length ? `Unlocks: ${unlocks.join(", ")}` : undefined}
                        className={cn(
                          "flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all",
                          isSelected
                            ? "bg-[var(--pn-action-tint)] border-[var(--pn-action-border)]"
                            : "bg-[var(--pn-surface)] border-[var(--pn-border)] hover:border-[var(--pn-border-strong)]",
                          implied && "opacity-60",
                          readOnly && "cursor-default"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                            isSelected
                              ? "bg-[var(--pn-primary)] border-[var(--pn-primary)]"
                              : "border-[var(--pn-border-strong)]"
                          )}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p
                              className={cn(
                                "text-xs font-medium",
                                isSelected ? "text-[var(--pn-action)]" : "text-[var(--pn-text)]"
                              )}
                            >
                              {perm.label}
                            </p>
                            {sensitive && (
                              <ShieldAlert
                                className="w-3 h-3 flex-shrink-0"
                                style={{ color: "var(--pn-critical-text)" }}
                                aria-label={`This permission ${sensitive}`}
                              />
                            )}
                          </div>
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--pn-text-2)" }}>
                            {perm.description}
                          </p>
                          {unlocks.length > 0 && (
                            <p className="text-[10px] mt-1" style={{ color: "var(--pn-text-3)" }}>
                              Gives access to: {unlocks.join(" · ")}
                            </p>
                          )}
                          {implied && (
                            <p className="text-[10px] mt-1 italic" style={{ color: "var(--pn-text-3)" }}>
                              Already covered by “{parent.replace(/_/g, " ")}”
                            </p>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}