import { useEffect, useState } from "react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

export interface PublicStats {
  /** Orders whose delivery.status === "delivered" */
  ordersDelivered: number;
  /** Active customer accounts */
  customers: number;
  /** Active games on the storefront */
  games: number;
  /** Claim sessions left a rating */
  reviews: number;
  /** Mean rating, 1dp. 0 when nobody has reviewed yet. */
  rating: number;
}

/**
 * Real storefront figures from GET /api/settings/public-stats.
 *
 * This exists so marketing copy never hardcodes numbers. The old copy claimed
 * "10+ Games Supported", "2,000+ Orders Delivered", "4.9 Rating" and
 * "Trusted by 10K+ buyers" — the live store has 2 games, so those claims were
 * provably false. Consumers should treat `null` as "unknown" and render
 * numberless copy rather than inventing a figure.
 *
 * Module-level cache: the ticker, hero and review sections all want these, and
 * they should not each fire their own request. The backend also caches for 60s.
 */
let cached: PublicStats | null = null;
let inflight: Promise<PublicStats | null> | null = null;

function load(): Promise<PublicStats | null> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = fetch(`${BACKEND}/api/settings/public-stats`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      const d = json?.data;
      if (!d || typeof d.ordersDelivered !== "number") return null;
      cached = {
        ordersDelivered: d.ordersDelivered,
        customers: d.customers,
        games: d.games,
        reviews: d.reviews,
        rating: d.rating,
      };
      return cached;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function usePublicStats(): PublicStats | null {
  const [stats, setStats] = useState<PublicStats | null>(cached);

  useEffect(() => {
    let alive = true;
    load().then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  return stats;
}

/** "1,234" / "12,345" — grouped digits for the ticker and stat lines. */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}
