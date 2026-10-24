/* Storefront palette — ONE source of truth.
   Every customer-facing page and component imports this; nothing on the
   storefront declares its own colours any more.

   One meaning per colour, nothing decorative:
      blue   = action        mint  = delivered / positive
      gold   = star / brand  amber = attention
      red    = problem       neutral = structure

   THEME: "RoGoat" dark-navy marketplace (see DESIGN_SYSTEM.md).
   Same meanings, same key names, same semantics — only the surface moved
   from white to flat navy `#111a2b`. Flat, no decorative gradients: all the
   colour on the page comes from the 3D item art floating over the dark bg.
   This file is the single switch that flips the whole old theme dark. */
export const P = {
  bg:"#111a2b",          /* page background — flat navy, never pure black */
  band:"#151f38",        /* inset panels / secondary surface */
  stage:"#16213c",        /* thumbnails, skeletons, empty tiles */
  card:"#1b2745",        /* card surface */
  border:"#2a3a60",      /* hairline structure */
  borderStrong:"#38497a",/* input borders / stronger edges */
  text:"#ffffff",
  muted:"#a9b3d3",
  faint:"#8a97ba",
  accent:"#2f8cff",      /* action */
  accentDeep:"#0a84ff",  /* solid action fill */
  accentTint:"rgba(47,140,255,0.16)",
  star:"#FFC53D",        /* brand gold */
  starOff:"#3a4a72",
  shadow:"0 8px 24px rgba(0,0,0,0.35)",
  good:"#5fe08e",        /* price / delivered */
  warn:"#f59e0b",        /* attention */
  warnTint:"rgba(245,158,11,0.14)",
  bad:"#ff5a4d",         /* problem */
  badTint:"rgba(239,68,68,0.14)",
  goodTint:"rgba(95,224,142,0.16)",
  shadowSoft:"0 6px 18px rgba(10,110,255,0.35)",
};

export type Palette = typeof P;

/* ─── Product image shapes ───────────────────────────────────────────────────
   Cover art comes in three proportions. Each card sizes its media box to the
   shape (tall art gets a tall box, wide art a wide box) instead of squishing
   everything into a square, and the market grid groups like shapes together.

   Keep this in sync with the `imageShape` enum on the backend Product model. */
export type ImageShape = "square" | "vertical" | "horizontal";

/** Grid display order: squares first, then horizontal, then vertical.
    Stable (Array.prototype.sort is stable) — any pre-existing order inside a
    shape group (price, popularity, admin sort) is preserved. Index in this
    array IS the sort rank, so it must start with "square". */
export const SHAPES: ImageShape[] = ["square", "horizontal", "vertical"];

/** Shape for an image from its real proportions (wide → horizontal,
    tall → vertical, near-square → square). Same thresholds as the admin
    panel's auto-detect so both ends always agree. */
export function shapeFromRatio(w: number, h: number): ImageShape {
  if (!w || !h) return "square";
  const r = w / h;
  if (r > 1.15) return "horizontal";
  if (r < 0.87) return "vertical";
  return "square";
}

/** Grid display order: squares first, then horizontal, then vertical.
    Stable (Array.prototype.sort is stable) — any pre-existing order inside a
    shape group (price, popularity, admin sort) is preserved. */
export function byShape<T extends { imageShape?: string }>(items: T[]): T[] {
  const rank = (s?: string): number => {
    const i = SHAPES.indexOf((s || "square") as ImageShape);
    return i < 0 ? 0 : i;
  };
  return [...items].sort((a, b) => rank(a.imageShape) - rank(b.imageShape));
}
