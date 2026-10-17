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

/* ── Store activity (GET /api/stats/activity) ──────────────────────────────
   Real per-game inventory + sales, and today's completed deliveries. This
   backs the storefront "orders delivered" band. No PII. */

export type ActivityGame = {
  slug: string;
  name: string;
  imageUrl: string;
  gradient: { from: string; to: string } | null;
  inStock: number;
  sold: number;
  items: number;
};

export type StoreActivity = {
  itemsDeliveredToday: number;
  ordersToday: number;
  deliveredAllTime: number;
  games: ActivityGame[];
};

let actCache: StoreActivity | null = null;
let actPending: Promise<StoreActivity | null> | null = null;

export function fetchActivity(): Promise<StoreActivity | null> {
  if (actCache) return Promise.resolve(actCache);
  if (actPending) return actPending;

  actPending = fetch(`${BACKEND}/api/stats/activity`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const s = d?.data;
      if (!s || !Array.isArray(s.games)) return null;
      actCache = {
        itemsDeliveredToday: Number(s.itemsDeliveredToday) || 0,
        ordersToday: Number(s.ordersToday) || 0,
        deliveredAllTime: Number(s.deliveredAllTime) || 0,
        games: s.games
          .filter((g: unknown): g is Record<string, unknown> => !!g && typeof g === "object")
          .map((g) => ({
            slug: typeof g.slug === "string" ? g.slug : "",
            name: typeof g.name === "string" ? g.name : "",
            imageUrl: typeof g.imageUrl === "string" ? g.imageUrl : "",
            gradient: g.gradient && typeof g.gradient === "object" ? (g.gradient as { from: string; to: string }) : null,
            inStock: Number(g.inStock) || 0,
            sold: Number(g.sold) || 0,
            items: Number(g.items) || 0,
          }))
          .filter((g: ActivityGame) => g.name.length > 0),
      };
      return actCache;
    })
    .catch(() => null)
    .finally(() => { actPending = null; });

  return actPending;
}
