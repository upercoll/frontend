import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, AlertTriangle, Sparkles } from "lucide-react";
import { adminApi } from "../api";
import { useSiteModes } from "@/context/SiteModeContext";
import { PageHeader, Card, CardBody, CardHeader } from "../components/kit";

export default function SiteModes() {
  const { modes, setModes, localOnly } = useSiteModes();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const halloween = modes.halloween;

  const toggle = async () => {
    const prev = modes;
    const next = { ...modes, halloween: !modes.halloween };

    setModes(next); // optimistic, mirrors to localStorage
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await adminApi.siteModes.update({ halloween: next.halloween });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // Roll back so the toggle never lies about the stored state.
      setModes(prev);
      const msg = err instanceof Error ? err.message : "Failed to save";
      if (/not found|failed to fetch|networkerror|load failed/i.test(msg)) {
        setError("Couldn't reach the server — the switch is only stored on this browser for now.");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[720px] mx-auto">
      <PageHeader
        icon={Sparkles}
        title="Site Modes"
        description="Switch seasonal features on or off."
      />

      <Card>
        <CardHeader icon={Sparkles} title="Halloween" subtitle="Seasonal theme" />
        <CardBody>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--pn-text)" }}>
                {halloween ? "On" : "Off"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--pn-text-3)" }}>
                Applies to every visitor.
              </p>
            </div>
            <button
              type="button"
              onClick={toggle}
              disabled={saving}
              className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0 disabled:opacity-60"
              style={{ background: halloween ? "var(--pn-action)" : "var(--pn-surface-2)" }}
              role="switch"
              aria-checked={halloween}
              aria-label="Halloween mode"
            >
              <motion.span
                className="absolute top-1 w-5 h-5 rounded-full"
                style={{ background: "var(--pn-surface)" }}
                animate={{ left: halloween ? 26 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            </button>
          </label>

          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "var(--pn-text-3)" }}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saved && !saving && <Check className="w-3.5 h-3.5" style={{ color: "var(--pn-success-fg)" }} />}
            {saving && "Saving…"}
            {saved && !saving && "Saved"}
          </div>

          {(error || localOnly) && (
            <div
              className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
              style={{
                background: "var(--pn-warning-bg)",
                border: "1px solid var(--pn-warning-line)",
                color: "var(--pn-warning-fg)",
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              <p>{error || "Working offline — this switch is only stored on this browser."}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}