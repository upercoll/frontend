import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, Percent, Store, CreditCard, Bell, Globe, Shield } from "lucide-react";
import { adminApi } from "../api";

function Section({ icon: Icon, title, description, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E9EBF5" }}>
      <div className="flex items-start gap-3 px-6 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#EEF2FF" }}>
          <Icon className="w-4 h-4" style={{ color: "#4f46e5" }} />
        </div>
        <div>
          <h3 className="font-bold text-sm" style={{ color: "#1e1b4b" }}>{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange, label, description }: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer py-1">
      <div>
        <p className="text-sm font-medium" style={{ color: "#374151" }}>{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: enabled ? "#4f46e5" : "#E5E7EB" }}
      >
        <div
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm"
          style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </label>
  );
}

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
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4f46e5" }} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[860px] mx-auto">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#1e1b4b" }}>Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Configure your store settings and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Section icon={Percent} title="Sales Tax" description="Configure tax rates applied at checkout">
          <div className="space-y-4">
            <Toggle
              enabled={taxEnabled}
              onChange={setTaxEnabled}
              label="Enable sales tax"
              description="Automatically add tax to all orders at checkout"
            />

            <div className={`space-y-4 transition-opacity ${taxEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "#374151" }}>Tax Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number" value={salesTaxRate}
                      onChange={(e) => setSalesTaxRate(e.target.value)}
                      min="0" max="100" step="0.01" placeholder="0"
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-10"
                      style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {Number(salesTaxRate) > 0
                      ? `$100 order → +$${(100 * Number(salesTaxRate) / 100).toFixed(2)} tax`
                      : "Enter a value greater than 0"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: "#374151" }}>Tax Label</label>
                  <input
                    value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)}
                    placeholder="Sales Tax"
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ background: "#F7F8FC", border: "1px solid #E9EBF5", color: "#1e1b4b" }}
                  />
                  <p className="text-xs text-slate-400 mt-1">Shown to customers at checkout</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section icon={Store} title="Store Information" description="General store configuration (coming soon)">
          <div className="space-y-3">
            <div className="rounded-xl px-4 py-3 text-sm text-slate-400" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
              Store name, logo, and other branding settings will be available here in a future update.
            </div>
          </div>
        </Section>

        <Section icon={CreditCard} title="Payment Methods" description="Configure accepted payment methods (coming soon)">
          <div className="space-y-3">
            <div className="rounded-xl px-4 py-3 text-sm text-slate-400" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
              Payment gateway configuration will be available here in a future update.
            </div>
          </div>
        </Section>

        <Section icon={Bell} title="Notifications" description="Configure email and system notifications (coming soon)">
          <div className="space-y-3">
            <div className="rounded-xl px-4 py-3 text-sm text-slate-400" style={{ background: "#F7F8FC", border: "1px solid #E9EBF5" }}>
              Notification preferences will be available here in a future update.
            </div>
          </div>
        </Section>

        {error && (
          <div className="text-sm rounded-xl px-4 py-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
            {error}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <motion.button
            type="submit" disabled={saving}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: "#1e1b4b" }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved && !saving && <Check className="w-4 h-4 text-emerald-300" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
