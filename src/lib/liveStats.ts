/* Live storefront counters from GET /api/stats (Admin-free, public).
   One module-level cache: however many sections read this, it fires at most
   ONE request per page load. There is no fake fallback — a caller that gets
   `null` back must show nothing rather than an invented number. */

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

export type LiveStats = {
  itemsInStock: number;
  itemsSold: number;
  customersServed: number;
};

let cache: LiveStats | null = null;
let pending: Promise<LiveStats | null> | null = null;

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function fetchLiveStats(): Promise<LiveStats | null> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;

  pending = fetch(`${BACKEND}/api/stats`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const s = d?.data;
      if (!s || !isNum(s.itemsInStock) || !isNum(s.itemsSold) || !isNum(s.customersServed)) return null;
      cache = {
        itemsInStock: Math.max(0, Math.round(s.itemsInStock)),
        itemsSold: Math.max(0, Math.round(s.itemsSold)),
        customersServed: Math.max(0, Math.round(s.customersServed)),
      };
      return cache;
    })
    .catch(() => null)
    .finally(() => { pending = null; });

  return pending;
}

/* 858693 -> "858 693" (thin-space thousands separator) */
export const groupNum = (n: number) =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
