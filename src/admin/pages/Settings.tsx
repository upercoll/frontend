import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  AlertTriangle, ArrowRight, Check, Compass, Loader2, Percent, Ticket, Workflow,
} from "lucide-react";
import { adminApi } from "../api";
import { PageHeader, Card, CardBody, CardHeader } from "../components/kit";

function Toggle({ enabled, onChange, label, description }: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer py-1">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--pn-text)" }}>{label}</p>
        {description && <p className="text-xs text-[var(--pn-text-3)] mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: enabled ? "var(--pn-action)" : "var(--pn-surface-2)" }}
        aria-pressed={enabled}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
          style={{
            background: "var(--pn-surface)",
            transform: enabled ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </button>
    </label>
  );
}

/** Real, working destinations — replaces the empty "coming soon" boxes. */
const ELSEWHERE: { href: string; title: string; body: string }[] = [
  { href: "/admin/products", title: "Catalogue & pricing", body: "Products, prices, stock levels and featured items." },
  { href: "/admin/games", title: "Games & categories", body: "Add a title, its categories and claim windows." },
  { href: "/admin/promos", title: "Discount codes", body: "Create promo codes with usage caps and expiry." },
  { href: "/admin/site-content", title: "Storefront copy", body: "Homepage headlines, banners and any text on the site." },
  { href: "/admin/announcements", title: "Announcements", body: "The popup customers see on load, plus broadcast email." },
  { href: "/admin/site-modes", title: "Site modes", body: "Seasonal themes such as Halloween." },
  { href: "/admin/roles", title: "Roles & permissions", body: "Decide exactly what each team member can reach." },
  { href: "/admin/delivery-team", title: "Delivery & stock teams", body: "Commission rates and payouts for deliverers and stockers." },
];

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
        const s = res.data as any;
        setSalesTaxRate(String(s?.salesTaxRate ?? 0));
        setTaxLabel(s?.taxLabel ?? "Sales Tax");
        setTaxEnabled(s?.taxEnabled ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(salesTaxRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
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
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--pn-action)" }} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[900px] mx-auto">
      <PageHeader
        icon={Compass}
        title="Store Settings"
        description="Checkout configuration. Everything else lives in its own section — listed below."
        actions={
          <Link href="/admin/control">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--pn-primary)", color: "#fff" }}
            >
              Control Center <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        }
      />

      <form onSubmit={handleSave} className="space-y-5">
        {/* ── Sales tax ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader
            icon={Percent}
            title="Sales tax"
            subtitle="Rate and label stored against the store"
          />
          <CardBody>
            {/* Honest about current behaviour: these values are saved but the
                checkout does not add tax yet. */}
            <div
              className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 mb-4 text-xs"
              style={{
                background: "var(--pn-warning-bg)",
                border: "1px solid var(--pn-warning-line)",
                color: "var(--pn-warning-fg)",
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              <p>
                <strong>Not applied at checkout yet.</strong> These values are saved, but
                order totals are still calculated without tax. They will start applying
                once checkout tax is switched on server-side.
              </p>
            </div>

            <div className="space-y-4">
              <Toggle
                enabled={taxEnabled}
                onChange={setTaxEnabled}
                label="Enable sales tax"
                description="Marks the store as tax-enabled"
              />

              <div
                className={`space-y-4 transition-opacity ${taxEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={salesTaxRate}
                      onChange={(e) => setSalesTaxRate(e.target.value)}
                      min="0" max="100" step="0.01" placeholder="0"
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--pn-text-3)" }}>
                      {Number(salesTaxRate) > 0
                        ? `$100 order → +$${(100 * Number(salesTaxRate) / 100).toFixed(2)}`
                        : "Enter a value greater than 0"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--pn-text)" }}>
                      Tax label
                    </label>
                    <input
                      value={taxLabel}
                      onChange={(e) => setTaxLabel(e.target.value)}
                      placeholder="Sales Tax"
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--pn-text-3)" }}>
                      Name shown to customers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {error && (
          <div
            className="text-sm rounded-lg px-4 py-3"
            style={{ background: "var(--pn-critical-bg)", border: "1px solid var(--pn-critical-line)", color: "var(--pn-critical-text)" }}
          >
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--pn-primary)" }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved && !saving && <Check className="w-4 h-4" style={{ color: "var(--pn-success-fg)" }} />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
          </motion.button>
        </div>
      </form>

      {/* ── Real destinations, instead of empty placeholder boxes ──────── */}
      <Card>
        <CardHeader
          icon={Workflow}
          title="Everything else"
          subtitle="These live in their own sections — nothing here is a placeholder"
        />
        <CardBody className="p-0">
          <div className="grid sm:grid-cols-2">
            {ELSEWHERE.map((d, i) => (
              <Link key={d.href} href={d.href}>
                <div
                  className="flex items-start gap-3 p-4 transition-colors h-full"
                  style={{
                    borderBottom: "1px solid var(--pn-divider)",
                    borderRight: i % 2 === 0 ? "1px solid var(--pn-divider)" : undefined,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>
                      {d.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--pn-text-3)" }}>{d.body}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--pn-text-3)" }} />
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}