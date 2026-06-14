import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ALL_PERMISSIONS } from "../types";
import { cn } from "@/lib/utils";

interface PermissionGridProps {
  selected: string[];
  onChange: (perms: string[]) => void;
  readOnly?: boolean;
}

export default function PermissionGrid({ selected, onChange, readOnly = false }: PermissionGridProps) {
  const groups = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.group)));

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
      const newSelected = [...selected];
      groupKeys.forEach((k) => { if (!newSelected.includes(k)) newSelected.push(k); });
      onChange(newSelected);
    }
  };

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
        const allSelected = groupPerms.every((p) => selected.includes(p.key));
        const someSelected = groupPerms.some((p) => selected.includes(p.key));

        return (
          <div key={group}>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => toggleGroup(group)}
                disabled={readOnly}
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                  allSelected ? "bg-blue-600 border-blue-600" : someSelected ? "bg-blue-600/30 border-blue-600/50" : "border-white/20 bg-white/5",
                  readOnly && "cursor-default"
                )}
              >
                {(allSelected || someSelected) && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
              <span className="text-slate-300 text-sm font-medium">{group}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
              {groupPerms.map((perm) => {
                const isSelected = selected.includes(perm.key);
                return (
                  <motion.button
                    key={perm.key}
                    whileHover={!readOnly ? { scale: 1.01 } : {}}
                    whileTap={!readOnly ? { scale: 0.99 } : {}}
                    onClick={() => toggle(perm.key)}
                    disabled={readOnly}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/30 text-white"
                        : "bg-white/2 border-white/5 text-slate-400 hover:border-white/15 hover:bg-white/5",
                      readOnly && "cursor-default"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                      isSelected ? "bg-blue-600 border-blue-600" : "border-white/20"
                    )}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-medium", isSelected ? "text-blue-300" : "text-slate-300")}>
                        {perm.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
