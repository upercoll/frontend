/* Public storefront copy owned by Admin → Site Content.
   One module-level cache, so no matter how many page loaders or banner sliders
   mount this fires at most ONE request per page load and never blocks render:
   the built-in defaults paint immediately and swap in when (if) it lands. */

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

export type PublicBanner = {
  enabled: boolean;
  image: string;
  title: string;
  cta: string;
  url: string;
};

export type PublicContent = {
  loader: string[];
  banners: PublicBanner[];
};

/* Built-in fallbacks, used until the owner-set copy arrives (or if it fails). */
export const DEFAULT_LOADER_LINES = [
  "SECURE CHECKOUT ON EVERY ORDER",
  "10% OFF YOUR FIRST ORDER",
  "JOIN OUR DISCORD & WIN ITEMS",
];

export const DEFAULT_BANNERS: PublicBanner[] = [
  { enabled: true, image: "", title: "RARE ITEMS AT UNBEATABLE PRICES!", cta: "SHOP NOW", url: "/browse" },
  { enabled: true, image: "", title: "10% OFF YOUR FIRST ORDER!", cta: "CLAIM DISCOUNT", url: "/browse" },
  { enabled: true, image: "", title: "JOIN OUR DISCORD & WIN ITEMS!", cta: "JOIN NOW", url: "/browse" },
];

let cache: PublicContent | null = null;
let pending: Promise<PublicContent | null> | null = null;

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Fetch the owner-set loader + banner copy once per page load, then reuse it. */
export function fetchPublicContent(): Promise<PublicContent | null> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;

  pending = fetch(`${BACKEND}/api/site-content`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const loader = (Array.isArray(d?.data?.loader) ? d.data.loader : [])
        .map((l: unknown) => (typeof l === "string" ? l.trim() : ""))
        .filter(Boolean);

      const banners = (Array.isArray(d?.data?.banners) ? d.data.banners : [])
        .filter((b: unknown): b is Record<string, unknown> => !!b && typeof b === "object")
        .map((b) => ({
          enabled: b.enabled !== false,
          image: str(b.image).trim(),
          title: str(b.title).trim(),
          cta: str(b.cta).trim(),
          url: str(b.url).trim(),
        }));

      cache = { loader, banners };
      return cache;
    })
    .catch(() => null)
    .finally(() => { pending = null; });

  return pending;
}

/* Slides that are switched on and actually have something to show. */
export function visibleBanners(c: PublicContent | null): PublicBanner[] {
  if (!c || c.banners.length === 0) return DEFAULT_BANNERS;
  const live = c.banners.filter((b) => b.enabled && (b.title || b.image));
  return live.length > 0 ? live : DEFAULT_BANNERS;
}
