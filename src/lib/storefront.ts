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
