import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { adminApi } from "../api";
import {
  Users, Loader2, ChevronRight, DollarSign, Video, UserPlus,
  X, AlertCircle, CheckCircle, Clock, Trash2,
} from "lucide-react";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  active:  { bg: "var(--pn-success-bg)", text: "var(--pn-success-fg)" },
  invited: { bg: "var(--pn-warning-bg)", text: "var(--pn-warning-fg)" },
};
import { PageHeader } from "../components/kit";

function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rateType, setRateType] = useState<"per_1k" | "per_video">("per_1k");
  const [rate, setRate] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [requiresPaymentProof, setRequiresPaymentProof] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      await adminApi.socials.inviteCreator({ name: name.trim(), email: email.trim(), rateType, rate: Number(rate) || 0, paymentMethods, requiresPaymentProof });
      setSuccess(`Invite sent to ${email}`);
      setName(""); setEmail("");
      qc.invalidateQueries({ queryKey: ["socials-creators"] });
    } catch (err: any) {
      setError(err.message || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="pn-modal w-full max-w-md p-6" style={{ border: "1px solid var(--pn-border)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base" style={{ color: "var(--pn-text)" }}>Invite Social Creator</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--pn-text-3)] hover:text-[var(--pn-text-2)]"
            style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-sm text-[var(--pn-text-2)] mb-5">
          They'll receive an invite link to set up their account on the Creator Portal.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--pn-text-2)] mb-1.5">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Smith"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[var(--pn-text-2)]">Default rate type
              <select value={rateType} onChange={e => setRateType(e.target.value as "per_1k" | "per_video")} className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}><option value="per_1k">Per 1,000 views</option><option value="per_video">Fixed per video</option></select>
            </label>
            <label className="text-xs font-semibold text-[var(--pn-text-2)]">Default amount ($)
              <input type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="0.00" className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }} />
            </label>
          </div>
          <div><p className="text-xs font-semibold text-[var(--pn-text-2)] mb-2">Preferred payment methods</p><div className="flex flex-wrap gap-2">{["paypal", "cashapp", "bank", "crypto", "other"].map(method => <label key={method} className="text-xs capitalize px-2.5 py-1.5 rounded-lg cursor-pointer" style={{ background: paymentMethods.includes(method) ? "var(--pn-action-tint)" : "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }}><input className="mr-1.5" type="checkbox" checked={paymentMethods.includes(method)} onChange={e => setPaymentMethods(v => e.target.checked ? [...v, method] : v.filter(x => x !== method))} />{method}</label>)}</div></div>
          <label className="flex gap-2 items-center text-xs text-[var(--pn-text-2)]"><input type="checkbox" checked={requiresPaymentProof} onChange={e => setRequiresPaymentProof(e.target.checked)} /> Keep payment proof for this creator</label>
          <div>
            <label className="block text-xs font-semibold text-[var(--pn-text-2)] mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@example.com"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pn-action-border)]"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-[var(--pn-success-fg)] bg-[var(--pn-success-bg)] border border-[var(--pn-success-line)] rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "var(--pn-action)" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MarkPaidModal({ creator, pendingPayout, onClose }: { creator: any; pendingPayout: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [marking, setMarking] = useState(false);
  const [err, setErr] = useState("");
  const [amount, setAmount] = useState("");

  const handleConfirm = async () => {
    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0 || payoutAmount > pendingPayout) {
      setErr(`Enter an amount from $0.01 to $${pendingPayout.toFixed(2)}`);
      return;
    }
    setMarking(true); setErr("");
    try {
      await adminApi.socials.markPaid(creator._id, { partialAmount: payoutAmount });
      qc.invalidateQueries({ queryKey: ["socials-creators"] });
      onClose();
    } catch (e: any) {
      setErr(e.message || "Failed to mark as paid");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="pn-modal w-full max-w-md p-6" style={{ border: "1px solid var(--pn-border)" }}
        onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-base mb-2" style={{ color: "var(--pn-text)" }}>Confirm Payout</h3>
        <p className="text-sm text-[var(--pn-text-2)] mb-4">Enter the exact amount to pay. Any remaining balance stays unpaid for a later payout.</p>
        <label className="block text-xs font-semibold text-[var(--pn-text-2)] mb-5">Amount to pay
          <input type="number" min="0.01" max={pendingPayout} step="0.01" value={amount} placeholder={pendingPayout.toFixed(2)}
            onChange={e => setAmount(e.target.value)} className="mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm"
            style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }} />
        </label>
        {err && (
          <div className="flex items-center gap-2 text-sm text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-lg px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={marking}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "var(--pn-success-fg)" }}>
            {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Pay amount
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ creator, onClose }: { creator: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");

  const handleDelete = async () => {
    setDeleting(true); setErr("");
    try {
      await adminApi.socials.deleteCreator(creator._id);
      qc.invalidateQueries({ queryKey: ["socials-creators"] });
      onClose();
    } catch (e: any) {
      setErr(e.message || "Failed to remove creator");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="pn-modal w-full max-w-sm p-6" style={{ border: "1px solid var(--pn-border)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pn-critical-bg)" }}>
            <Trash2 className="w-5 h-5 text-[var(--pn-critical-text)]" />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: "var(--pn-text)" }}>Remove Creator</h3>
            <p className="text-xs text-[var(--pn-text-3)]">{creator.name}</p>
          </div>
        </div>
        <p className="text-sm text-[var(--pn-text-2)] mb-5">
          This permanently removes <strong style={{ color: "var(--pn-text)" }}>{creator.name}</strong> from the social creator portal.
          Creators with pending or unpaid submissions cannot be removed.
        </p>
        {err && (
          <div className="flex items-center gap-2 text-sm text-[var(--pn-critical-text)] bg-[var(--pn-critical-bg)] border border-[var(--pn-critical-line)] rounded-lg px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: "var(--pn-text)" }}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "var(--pn-critical)" }}>
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedYouTubersPanel() {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["featured-youtubers"], queryFn: () => adminApi.socials.featuredYouTubers() });
  const creators: any[] = (data as any)?.data?.creators || [];
  const add = async (e: React.FormEvent) => { e.preventDefault(); if (!username.trim()) return; setSaving(true); setError(""); try { await adminApi.socials.addFeaturedYouTuber(username.trim()); setUsername(""); qc.invalidateQueries({ queryKey: ["featured-youtubers"] }); } catch (e: any) { setError(e.message || "Could not add YouTuber"); } finally { setSaving(false); } };
  return <section className="bg-[var(--pn-surface)] rounded-xl p-5" style={{ border: "1px solid var(--pn-border)" }}>
    <div className="flex items-center gap-2"><Video className="w-4 h-4 text-[var(--pn-critical-text)]" /><div><h3 className="font-bold text-sm" style={{ color: "var(--pn-text)" }}>YouTubers That Trust Us</h3><p className="text-xs text-[var(--pn-text-2)] mt-0.5">Adding a channel here automatically publishes it to the homepage carousel.</p></div></div>
    <form onSubmit={add} className="flex gap-2 mt-4"><input value={username} onChange={e => setUsername(e.target.value)} placeholder="YouTube username, e.g. MrBeast" className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)" }} /><button disabled={saving} className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-60" style={{ background: "var(--pn-critical)" }}>{saving ? "Fetching…" : "Add YouTuber"}</button></form>
    {error && <p className="mt-2 text-xs text-[var(--pn-critical-text)]">{error}</p>}
    {!isLoading && creators.length > 0 && <div className="grid sm:grid-cols-2 gap-2 mt-4">{creators.map(c => <div key={c._id} className="flex items-center gap-2 rounded-lg p-2" style={{ background: "var(--pn-surface-2)" }}>{c.avatarUrl ? <img src={c.avatarUrl} className="w-8 h-8 rounded-full object-cover" /> : <Video className="w-8 h-8 p-2 rounded-full text-white bg-[var(--pn-critical)]" />}<span className="text-xs font-semibold flex-1 truncate">{c.name || c.username}</span><button onClick={() => adminApi.socials.deleteFeaturedYouTuber(c._id).then(() => qc.invalidateQueries({ queryKey: ["featured-youtubers"] }))} className="text-xs text-[var(--pn-critical-text)]">Remove</button></div>)}</div>}
  </section>;
}

export default function SocialsCreators() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [markPaidTarget, setMarkPaidTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["socials-creators"],
    queryFn: () => adminApi.socials.listCreators(),
  });

  const creators: any[] = (data as any)?.data?.creators || [];

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      {markPaidTarget && (
        <MarkPaidModal
          creator={markPaidTarget}
          pendingPayout={markPaidTarget.socialStats?.pendingPayout || 0}
          onClose={() => setMarkPaidTarget(null)}
        />
      )}
      {deleteTarget && <DeleteModal creator={deleteTarget} onClose={() => setDeleteTarget(null)} />}

      <PageHeader title="Social Creators" description={`${creators.length} creator${creators.length !== 1 ? "s" : ""}`} icon={Users}>
        <button onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--pn-action)" }}>
          <UserPlus className="w-4 h-4" /> Invite Creator
        </button>
      </PageHeader>

      <div className="bg-[var(--pn-surface)] rounded-xl overflow-hidden" style={{ border: "1px solid var(--pn-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "var(--pn-surface-2)" }} />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="p-16 text-center text-[var(--pn-text-3)]">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No social creators yet.</p>
            <p className="text-sm mt-1">Use the "Invite Creator" button above to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--pn-surface-2)", borderBottom: "1px solid var(--pn-border)" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Creator</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Videos</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden md:table-cell">In Review</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden md:table-cell">Accepted</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)]">Pending Payout</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden lg:table-cell">Total Paid</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--pn-text-3)] hidden lg:table-cell">Last Payout</th>
                <th className="px-5 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c: any) => {
                const s = c.socialStats || {};
                const hasPending = (s.pendingPayout || 0) > 0;
                const badge = STATUS_BADGE[c.status] || STATUS_BADGE.invited;
                return (
                  <tr key={c._id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--pn-border)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-surface-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>{c.name}</p>
                      <p className="text-xs text-[var(--pn-text-3)]">{c.email}</p>
                      {c.payoutRequestedAt && <p className="text-[10px] font-bold text-[var(--pn-warning-fg)] mt-1">● Payout requested</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                        style={{ background: badge.bg, color: badge.text }}>
                        {c.status === "invited" ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Invited</span> : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[var(--pn-text-3)]" />
                        <span className="text-sm font-semibold" style={{ color: "var(--pn-text)" }}>{s.total ?? 0}</span>
                        {s.paid > 0 && <span className="text-xs text-[var(--pn-text-3)]">({s.paid} paid)</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-[var(--pn-text-2)]">{s.inReview ?? 0}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-[var(--pn-text-2)]">{s.accepted ?? 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      {hasPending ? (
                        <span className="text-sm font-bold" style={{ color: "var(--pn-success-fg)" }}>
                          ${(s.pendingPayout || 0).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--pn-text-3)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {s.totalPaid > 0
                        ? <span className="text-sm font-semibold text-[var(--pn-text)]">${(s.totalPaid).toFixed(2)}</span>
                        : <span className="text-xs text-[var(--pn-text-3)]">—</span>}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-[var(--pn-text-2)]">{fmtDate(c.lastSocialPayoutAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        {hasPending && (
                          <button
                            onClick={() => setMarkPaidTarget(c)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: "var(--pn-success-bg)", color: "var(--pn-success-fg)", border: "1px solid var(--pn-success-line)" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-success-bg)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--pn-success-bg)"}>
                            <DollarSign className="w-3 h-3" /> Pay
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: "var(--pn-critical-bg)", color: "var(--pn-critical-text)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--pn-critical-bg)"}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--pn-critical-bg)"}
                          title="Remove creator">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Link href={`/admin/socials/creators/${c._id}`}>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: "var(--pn-action-tint)", color: "var(--pn-action)" }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--pn-action-tint)"}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--pn-action-tint)"}>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <FeaturedYouTubersPanel />
    </div>
  );
}
