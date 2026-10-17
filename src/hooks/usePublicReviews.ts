import { useEffect, useState } from "react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

/**
 * One review left by a buyer after a claim session.
 *
 * This is exactly what the store's own GET /api/claims/public-reviews exposes —
 * the Roblox handle, the 1–5 rating and the comment. It deliberately never
 * carries the reviewer's email, Roblox user id, order reference, room id or
 * the items they bought, so nothing on this type can identify a purchase.
 */
export interface PublicReview {
  id: string;
  /** public Roblox handle */
  name: string;
  /** 1–5 */
  rating: number;
  comment: string;
  submittedAt: string;
}

export interface PublicReviewsResult {
  reviews: PublicReview[];
  /** every review that left a rating, including ones without a comment */
  total: number;
  averageRating: number;
}

let cached: PublicReviewsResult | null = null;
let inflight: Promise<PublicReviewsResult | null> | null = null;

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function load(): Promise<PublicReviewsResult | null> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = fetch(`${BACKEND}/api/claims/public-reviews?limit=40`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      const d = json?.data;
      if (!d || !Array.isArray(d.reviews)) return null;

      const reviews: PublicReview[] = d.reviews
        .filter((r: unknown): r is Record<string, unknown> => !!r && typeof r === "object")
        .map((r) => ({
          id: typeof r.id === "string" ? r.id : String(r.id ?? Math.random()),
          name: typeof r.name === "string" ? r.name : "",
          rating: isNum(r.rating) ? Math.min(5, Math.max(1, Math.round(r.rating))) : 0,
          comment: typeof r.comment === "string" ? r.comment : "",
          submittedAt: typeof r.submittedAt === "string" ? r.submittedAt : "",
        }))
        // a review needs a handle and a rating to be worth showing
        .filter((r) => r.name.length > 0 && r.rating > 0);

      cached = {
        reviews,
        total: isNum(d.total) ? d.total : reviews.length,
        averageRating: isNum(d.averageRating) ? d.averageRating : 0,
      };
      return cached;
    })
    .catch(() => null)
    .finally(() => { inflight = null; });

  return inflight;
}

/** Real buyer reviews, fetched once per page load. `null` = unknown. */
export function usePublicReviews(): PublicReviewsResult | null {
  const [state, setState] = useState<PublicReviewsResult | null>(cached);

  useEffect(() => {
    let alive = true;
    load().then((r) => { if (alive) setState(r); });
    return () => { alive = false; };
  }, []);

  return state;
}

/** "4 days ago" / "3 months ago" from an ISO date; "" when unknown. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!iso || Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [31536000, "year"], [2592000, "month"], [604800, "week"],
    [86400, "day"], [3600, "hour"], [60, "minute"],
  ];
  for (const [s, label] of units) {
    if (secs >= s) {
      const n = Math.floor(secs / s);
      return `${n} ${label}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}
