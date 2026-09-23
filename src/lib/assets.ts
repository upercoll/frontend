/**
 * Centralized Roblox Asset System
 *
 * Every game slug maps to verified Roblox universe/place IDs.
 * Thumbnail URLs are generated dynamically from these IDs via official
 * Roblox APIs — never guessed, never generic, never from another game.
 *
 * Source priority for any image:
 *   1. Custom upload from admin panel (Cloudinary URL via API)
 *   2. Official Roblox game thumbnail/icon (from this config)
 *   3. Controlled missing-artwork state (never a random image)
 */

/* ── Roblox Universe & Place IDs (verified 2026-09-12) ─────────── */

export interface RobloxGameIds {
  universeId: number;
  placeId: number;
}

export const ROBLOX_IDS: Record<string, RobloxGameIds> = {
  "murder-mystery-2":     { universeId: 66654135,    placeId: 142823291 },
  "blade-ball":           { universeId: 4777817887,  placeId: 13772394625 },
  "grow-a-garden-2":      { universeId: 10200395747, placeId: 97598239454123 },
  "steal-a-brainrot":     { universeId: 7709344486,  placeId: 109983668079237 },
  "blox-fruits":          { universeId: 994732206,   placeId: 2753915549 },
  "jailbreak":            { universeId: 245662005,   placeId: 606849621 },
  "99-nights-in-the-forest": { universeId: 7326934954, placeId: 79546208627805 },
  "dress-to-impress":     { universeId: 5203828273,  placeId: 15101393044 },
  "pet-simulator-99":     { universeId: 3317771874,  placeId: 8737899170 },
};

/* ── Roblox Thumbnail URL Generators ────────────────────────────── */

/**
 * Official game icon (square, used for cards, grid tiles, nav dropdown).
 * Endpoint: thumbnails.roblox.com/v1/games/icons
 */
export function getGameIconUrl(slug: string, size: 256 | 420 | 128 = 256): string | null {
  const ids = ROBLOX_IDS[slug];
  if (!ids) return null;
  return `https://thumbnails.roblox.com/v1/games/icons?universeIds=${ids.universeId}&size=${size}x${size}&format=Png&isCircular=false`;
}

/**
 * Official game thumbnail (wide/landscape, used for hero banners, card backgrounds).
 * Endpoint: thumbnails.roblox.com/v1/games/multiget/thumbnails
 */
export function getGameThumbnailUrl(slug: string, size: 768 | 576 | 420 | 256 = 768): string | null {
  const ids = ROBLOX_IDS[slug];
  if (!ids) return null;
  const w = size;
  const h = Math.round(size * (432 / 768));
  return `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${ids.universeId}&size=${w}x${h}&format=Png&isCircular=false&thumbnailSets.requestId=${slug}`;
}

/**
 * Game logo (square logo variant, good for feature cards).
 * Endpoint: thumbnails.roblox.com/v1/games/icons (same as icon, larger size)
 */
export function getGameLogoUrl(slug: string): string | null {
  return getGameIconUrl(slug, 420);
}

/* ── Image Resolution Helpers ────────────────────────────────────── */

/**
 * Resolve the best available image for a game.
 * Priority: custom upload → Roblox icon → null (caller handles fallback)
 */
export function resolveGameImage(
  slug: string,
  customImageUrl?: string | null,
  fallback?: string,
): string {
  if (customImageUrl) return customImageUrl;
  const robloxIcon = getGameIconUrl(slug);
  if (robloxIcon) return robloxIcon;
  return fallback || "";
}

/**
 * Resolve the best available image for a game card (wider format).
 * Priority: custom upload → Roblox thumbnail → Roblox icon → null
 */
export function resolveGameCardImage(
  slug: string,
  customImageUrl?: string | null,
): string {
  if (customImageUrl) return customImageUrl;
  const robloxThumb = getGameThumbnailUrl(slug);
  if (robloxThumb) return robloxThumb;
  return getGameIconUrl(slug, 420) || "";
}

/**
 * Resolve product image — respects the existing API imageUrl.
 * Returns null when no image exists (caller shows MissingArtwork).
 */
export function resolveProductImage(
  productImageUrl?: string | null,
  productImages?: string[] | null,
): string | null {
  if (productImageUrl) return productImageUrl;
  if (productImages && productImages.length > 0) return productImages[0];
  return null;
}

/* ── Static Grid Fallback Map (local files in /public) ────────────── */
/* These are NOT random images — they are curated game artwork stored
   locally as a safety net when Roblox APIs are unreachable. */

export const GRID_IMAGE_MAP: Record<string, string> = {
  "murder-mystery-2":      "/grid5.jpeg.jpeg",
  "blade-ball":            "/grid8.jpeg.jpeg",
  "grow-a-garden-2":       "/grid6.jpeg.jpeg",
  "steal-a-brainrot":      "/grid7.jpeg.jpeg",
  "blox-fruits":           "/grid11.jpeg.jpeg",
  "jailbreak":             "/grid4.jpeg.jpeg",
  "99-nights-in-the-forest": "/grid9.jpeg.jpeg",
  "dress-to-impress":      "/grid10.jpeg.jpeg",
  "pet-simulator-99":      "/grid1.jpeg.jpeg",
};

/**
 * Get the best available image for a game card on the homepage.
 * Priority: API imageUrl → Roblox thumbnail → local grid file → null
 */
export function resolveGameCardImageFull(
  slug: string,
  apiImageUrl?: string | null,
): string {
  if (apiImageUrl) return apiImageUrl;
  const robloxIcon = getGameIconUrl(slug, 420);
  if (robloxIcon) return robloxIcon;
  return GRID_IMAGE_MAP[slug] || "";
}

/* ── Product Image Gallery Helpers ──────────────────────────────── */

/**
 * Build gallery array for a product page.
 * Priority: product.images → product.imageUrl → empty array
 */
export function buildProductGallery(
  imageUrl?: string | null,
  images?: string[] | null,
): string[] {
  if (images && images.length > 0) return images;
  if (imageUrl) return [imageUrl];
  return [];
}

/* ── Missing Artwork State ──────────────────────────────────────── */

export interface MissingArtworkProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Returns true if the given URL is a Roblox thumbnail endpoint
 * (useful for applying different styling to Roblox-served images vs uploads).
 */
export function isRobloxThumbnailUrl(url: string): boolean {
  return url.includes("thumbnails.roblox.com");
}
