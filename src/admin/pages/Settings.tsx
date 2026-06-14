import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings2, Loader2, Check, Percent } from "lucide-react";
import { adminApi } from "../api";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [salesTaxRate, setSalesTaxRate] = useState("0");
  const [taxLabel, setTaxLabel] = useState("Sales Tax");
  const [taxEnabled, setTaxEnabled] = useState(false);

  useEffect(() => {
    adminApi.settings.get()
      .then((res) => {
        const s = res.data;
        setSalesTaxRate(String(s.salesTaxRate ?? 0));
        setTaxLabel(s.taxLabel ?? "Sales Tax");
        setTaxEnabled(s.taxEnabled ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(salesTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError("Sales tax rate must be between 0 and 100");
      return;
    }
    setSaving(true); setError(""); setSaved(false);
    try {
      await adminApi.settings.update({
        salesTaxRate: rate,
        taxLabel: taxLabel.trim() || "Sales Tax",
        taxEnabled,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[800px] mx-auto">
      <div>
        <h2 className="text-white font-semibold text-lg">Settings</h2>
        <p className="text-slate-400 text-sm mt-0.5">Configure store-wide settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-[#0d1f3c] border border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Percent className="w-4 h-4 text-blue-400" />
            <h3 className="text-white font-medium">Sales Tax</h3>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setTaxEnabled((p) => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${taxEnabled ? "bg-blue-600" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${taxEnabled ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-slate-300 text-sm">Enable sales tax on orders</span>
          </label>

          <div className={`space-y-4 transition-opacity ${taxEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1.5">Tax Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={salesTaxRate}
                    onChange={(e) => setSalesTaxRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  {Number(salesTaxRate) > 0
                    ? `A $100 order will have $${(100 * Number(salesTaxRate) / 100).toFixed(2)} tax added`
                    : "Enter a value greater than 0"}
                </p>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1.5">Tax Label</label>
                <input
                  value={taxLabel}
                  onChange={(e) => setTaxLabel(e.target.value)}
                  placeholder="Sales Tax"
                  className="w-full bg-[#0a1628] border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                />
                <p className="text-slate-500 text-xs mt-1">Shown to customers at checkout</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved && !saving && <Check className="w-4 h-4 text-emerald-300" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
