import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Check, Ban, Minus, Plus } from "lucide-react";
import { P, type ImageShape } from "@/lib/storefront";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { effectiveStock, isSoldOut } from "@/lib/stock";

/* ── Product card ─────────────────────────────────────────────────────────
   Tall "collectible" card, built 1:1 from the reference:
     · portrait 164 / 288 silhouette, small radius, no inner boxes
     · the item's colour washes the top of the surface and fades into the
       card body (color-mix, not a decorative gradient wash)
     · a 1px gradient hairline runs the full outline — the reference's
       signature edge — drawn with a mask so it never covers the art
     · the art floats free, centred, with a soft contact shadow
     · name → sub line → hairline divider → price row with a currency coin
   Everything is our navy palette, our type and our motion.

   The reference has no CTA, so the Add to Cart lives where it costs the
   silhouette nothing: a floating action button inside the art, bottom-right.
   It is an icon at rest, opens into a labelled pill on card hover, flashes
   green on add, and becomes a − / + stepper once the cart holds the item —
   the same three states the old full-width button had, in a fraction of the
   space, so the reference proportions stay intact. */

export type CardProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  /** how the cover art is framed — square keeps the classic floating art,
      vertical/horizontal get a shape-matched frame so art is never squished
      (see lib/storefront.ts) */
  imageShape?: ImageShape;
  /** category colour — tints the card surface, the hairline and the glow */
  accent?: string;
  /** small muted line above the title (kept for callers; the sub line now
      carries live stock instead) */
  category?: string;
  bestSeller?: boolean;
  outOfStock?: boolean;
  /** legacy stock field — kept only as a fallback, see lib/stock.ts */
  stock?: number | null;
  /** live physical inventory; this is the number that decides availability */
  onHand?: number | null;
};

/* Price → { symbol, main, frac } with the exact same Intl rules the rest of
   the site prices with, so the coin can hold the real currency symbol and the
   decimals can sit back in muted type (the reference's "$ 46 .00" rhythm).
   Anything the runtime can't split falls back to the plain formatted string. */
function splitMoney(
  value: number,
  code: string,
  decimals: number,
): { symbol: string; main: string; frac: string } {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).formatToParts(value);
    let symbol = "";
    let main = "";
    let frac = "";
    for (const part of parts) {
      if (part.type === "currency") symbol = part.value;
      else if (part.type === "integer" || part.type === "group") {
        if (!frac) main += part.value;
      } else if (part.type === "decimal" || part.type === "fraction") frac += part.value;
    }
    if (!main) main = value.toFixed(decimals);
    return { symbol: symbol || "$", main, frac };
  } catch {
    return { symbol: "$", main: value.toFixed(decimals), frac: "" };
  }
}

/* Card surface. Deliberately darker than the shared `P.card` (#1b2745): the
   card just has to hold the art, so the art does the lighting. The accent wash
   still lands on the top of the card, which keeps the reference's tinted crown
   without the whole tile reading as a pale slab. */
const SURFACE = "#141d31";

export default function ProductCard({
  product: p,
  index = 0,
  onNavigate,
  onAdd,
}: {
  product: CardProduct;
  index?: number;
  onNavigate?: (id: string) => void;
  onAdd?: (p: CardProduct) => void;
}) {
  const onSale = typeof p.originalPrice === "number" && p.originalPrice > p.price;
  const off = onSale ? Math.round((1 - p.price / p.originalPrice!) * 100) : 0;
  const soldOut = isSoldOut(p);
  const accent = p.accent || P.accent;
  const shape: ImageShape = p.imageShape || "square";
  const [added, setAdded] = useState(false);

  /* Display currency only — the stored price stays USD and so does the charge. */
  const { currency, convert } = useCurrency();
  const money = splitMoney(convert(p.price), currency.code, currency.decimals);

  /* How much of this item the cart already holds. The stepper stops at the
     real limit and says so, instead of quietly adding nothing. */
  const { items, updateQty } = useCart();
  const cap = effectiveStock(p);
  const inCart = items.find((i) => i.id === p.id)?.quantity ?? 0;
  const remaining = cap === null ? null : Math.max(0, cap - inCart);
  const atCap = !soldOut && remaining === 0;
  const lowStock = !soldOut && !atCap && remaining !== null && remaining <= 5;
  const stockColor = soldOut ? P.faint : lowStock ? "#f2792e" : P.good;

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (atCap) return;
    onAdd?.(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 950);
  };

  return (
    <motion.article
      /* Mount animation, not whileInView: opening the cart drawer shifts
         layout, which made the IntersectionObserver re-fire and flash every
         card back to opacity 0 on each add-to-cart. */
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05 }}
      className="group relative flex w-full flex-col overflow-hidden px-3 pb-3 pt-4 transition-transform duration-300 hover:-translate-y-1.5"
      style={{
        aspectRatio: "164 / 258",
        borderRadius: 14,
        background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 16%, ${SURFACE}) 0%, ${SURFACE} 52%)`,
        /* At rest the card is just surface — no frame, no glow. The accent
           edge and the bloom are rewards for hovering, nothing else. */
        opacity: soldOut ? 0.78 : 1,
      }}
    >
      {/* gradient hairline — the reference edge, hover only. Masked to the 1px
          frame so it outlines the card instead of tinting the art behind it. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          borderRadius: 14,
          padding: 1,
          background: `linear-gradient(180deg, ${accent} 0%, color-mix(in srgb, ${accent} 52%, transparent) 42%, rgba(255,255,255,.06) 100%)`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
        }}
      />

      {/* hover bloom in the item's own colour — our signature move, kept.
          Glow only: the gradient hairline above is the single border, so the
          hover state doesn't read as a double frame. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          borderRadius: 14,
          boxShadow: `0 0 24px color-mix(in srgb, ${accent} 34%, transparent)`,
        }}
      />

      {/* ── Art ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 min-h-0 flex-1">
        <button
          type="button"
          onClick={() => onNavigate?.(p.id)}
          aria-label={p.name}
          className="absolute inset-0 flex items-center justify-center rounded-[10px] px-1.5 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141d31]"
        >
          {p.imageUrl ? (
            shape === "square" ? (
              /* square art floats free — drop shadow, no frame (reference) */
              <img
                src={p.imageUrl}
                alt={p.name}
                loading="lazy"
                className="max-h-[90%] w-[82%] object-contain transition-transform duration-500 group-hover:scale-[1.07]"
                style={{
                  filter: soldOut
                    ? "grayscale(.7) brightness(.75)"
                    : `drop-shadow(0 12px 16px rgba(0,0,0,.5))`,
                }}
              />
            ) : (
              /* photos keep their own frame so a screenshot never looks
                 squished inside a tall card */
              <img
                src={p.imageUrl}
                alt={p.name}
                loading="lazy"
                className={
                  shape === "horizontal"
                    ? "max-h-[86%] w-full rounded-[9px] object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                    : "h-full max-h-[94%] w-auto max-w-full rounded-[9px] object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                }
                style={{
                  border: shape === "horizontal" ? "1px solid rgba(255,255,255,.08)" : undefined,
                  filter: soldOut
                    ? "grayscale(.7) brightness(.75)"
                    : `drop-shadow(0 10px 14px rgba(0,0,0,.45))`,
                }}
              />
            )
          ) : (
            /* no artwork (most of the live catalogue) — a lit plate + the RB
               monogram reads as an intentional placeholder, not a broken img */
            <>
              <span
                aria-hidden
                className="absolute aspect-square w-[56%] rounded-full blur-2xl"
                style={{ background: accent, opacity: 0.22 }}
              />
              <span
                className="relative font-mont text-[34px] font-bold leading-none tracking-tight"
                style={{ color: "rgba(255,255,255,.34)" }}
              >
                RB
              </span>
            </>
          )}
        </button>

        {/* discount — top-left, green (green = value on this site) */}
        {onSale && !soldOut && (
          <span
            className="pointer-events-none absolute left-0 top-0 inline-flex items-center rounded-[7px] px-1.5 py-[3px] text-[11px] font-bold"
            style={{ background: P.good, color: "#08240f" }}
          >
            -{off}%
          </span>
        )}

        {/* best-seller sparkle — top-right, gold, slowly shimmering */}
        {p.bestSeller && !soldOut && (
          <span aria-hidden className="pk-sparkle pointer-events-none absolute right-0 top-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2c1.2 6.4 2.4 7.6 8.8 8.8-6.4 1.2-7.6 2.4-8.8 8.8-1.2-6.4-2.4-7.6-8.8-8.8C9.6 9.6 10.8 8.4 12 2z"
                fill={P.star}
              />
            </svg>
          </span>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────────
            Floating in the art, bottom-right. Three states, one shape:
            add (icon → labelled pill on card hover), added (green flash),
            and − N + once the cart holds some. Nothing reflows the card. */}
        <div className="absolute bottom-0 right-0 z-20">
          {soldOut ? (
            <span
              className="inline-flex h-[30px] items-center gap-1.5 rounded-full px-2.5 text-[10.5px] font-semibold backdrop-blur-md"
              style={{ background: "rgba(9,15,28,.82)", border: `1px solid ${P.border}`, color: P.faint }}
            >
              <Ban size={12} strokeWidth={2.6} /> Sold out
            </span>
          ) : inCart > 0 && !added ? (
            /* the stepper — you already have some, take more or take less */
            <div
              className="flex h-[34px] items-stretch overflow-hidden rounded-full backdrop-blur-md"
              style={{
                background: "rgba(9,15,28,.86)",
                border: `1px solid ${P.borderStrong}`,
                boxShadow: `0 8px 18px rgba(0,0,0,.35)`,
              }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updateQty(p.id, inCart - 1); }}
                aria-label={`Remove one ${p.name} from cart`}
                className="grid w-[30px] shrink-0 place-items-center transition-colors hover:bg-white/10"
                style={{ color: P.text }}
              >
                <Minus size={13} strokeWidth={3} />
              </button>
              <span
                className="grid min-w-[26px] place-items-center px-1 text-[12.5px] font-bold tabular-nums"
                style={{ color: P.text }}
              >
                {inCart}
              </span>
              <button
                type="button"
                disabled={atCap}
                onClick={(e) => { e.stopPropagation(); if (!atCap) updateQty(p.id, inCart + 1); }}
                aria-label={atCap ? `All ${cap} of ${p.name} are already in your cart` : `Add another ${p.name}`}
                className="grid w-[30px] shrink-0 place-items-center transition-[filter,background-color] disabled:cursor-not-allowed"
                style={{
                  color: atCap ? P.faint : "#fff",
                  background: atCap ? "transparent" : `linear-gradient(180deg, ${P.accent}, ${P.accentDeep})`,
                }}
                onMouseEnter={(ev) => { if (!atCap) ev.currentTarget.style.filter = "brightness(1.14)"; }}
                onMouseLeave={(ev) => (ev.currentTarget.style.filter = "none")}
              >
                <Plus size={13} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={atCap}
              onClick={addToCart}
              aria-label={atCap ? `All ${cap} of ${p.name} are already in your cart` : `Add ${p.name} to cart`}
              className="flex h-[34px] items-center overflow-hidden rounded-full pl-[9px] pr-[9px] backdrop-blur-md transition-[filter,transform,padding] duration-300 hover:brightness-110 active:scale-[.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141d31] disabled:cursor-not-allowed"
              style={{
                background: added
                  ? P.good
                  : atCap
                    ? "rgba(9,15,28,.86)"
                    : `linear-gradient(180deg, ${P.accent}, ${P.accentDeep})`,
                border: added
                  ? "1px solid rgba(255,255,255,.3)"
                  : atCap
                    ? `1px solid ${P.border}`
                    : "1px solid rgba(255,255,255,.16)",
                color: added ? "#08240f" : atCap ? P.faint : "#fff",
                boxShadow: added
                  ? "0 8px 20px rgba(95,224,142,.4)"
                  : atCap
                    ? "none"
                    : P.shadowSoft,
              }}
            >
              {added ? <Check size={15} strokeWidth={3} /> : atCap ? <Ban size={14} strokeWidth={2.6} /> : <ShoppingCart size={14} strokeWidth={2.6} />}
              {/* the label is the reward for hovering the card — on touch it
                  stays an icon, which is all a 150px-wide card has room for */}
              <span
                className={
                  "overflow-hidden whitespace-nowrap text-[12px] font-bold transition-[max-width,padding] duration-300 " +
                  (added
                    ? "max-w-[86px] pl-1.5"
                    : "max-w-0 pl-0 group-hover:max-w-[86px] group-hover:pl-1.5")
                }
              >
                {added ? "Added" : atCap ? "In cart" : "Add to cart"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Info ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 mt-3 shrink-0 text-center">
        <h3
          className="font-mont text-[14.5px] font-bold leading-[1.25] text-white"
          title={p.name}
          style={{
            /* fixed two-line block: every card in a row keeps its divider and
               price on the same baseline, and a long Roblox name is never
               silently cut to one word */
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.5em",
            overflowWrap: "anywhere",
          }}
        >
          {p.name}
        </h3>

        <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: stockColor }}>
          <i className="block h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: stockColor }} />
          {soldOut ? "Sold out" : cap === null ? "In stock" : lowStock ? `Only ${remaining} left` : `${remaining} in stock`}
        </p>

        {/* hairline divider — the reference's quiet rhythm break */}
        <div
          aria-hidden
          className="mx-auto my-2.5 h-px w-[78%]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent)" }}
        />

        {/* price row: currency coin + bold amount + muted decimals */}
        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span
            className="grid h-[21px] min-w-[21px] shrink-0 place-items-center rounded-full px-1 text-[10.5px] font-bold leading-none text-white"
            style={{
              background: P.accentDeep,
              boxShadow: "0 0 0 3px rgba(47,140,255,.16)",
            }}
          >
            {money.symbol}
          </span>
          <b className="font-mont text-[16px] font-bold leading-none" style={{ color: P.text }}>
            {money.main}
          </b>
          {money.frac && (
            <small className="text-[11px] font-semibold leading-none" style={{ color: P.faint }}>
              {money.frac}
            </small>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/** Skeleton shown while the grid loads — same tall box as the real card. */
export function ProductCardSkeleton() {
  return (
    <div
      className="w-full animate-pulse px-3 pb-3 pt-3.5"
      style={{
        aspectRatio: "164 / 258",
        borderRadius: 14,
        background: SURFACE,
      }}
    >
      <div className="h-[74%] w-full rounded-[10px]" style={{ background: P.stage }} />
      <div className="mx-auto mt-3 h-3.5 w-3/4 rounded" style={{ background: P.stage }} />
      <div className="mx-auto mt-2 h-2.5 w-1/2 rounded" style={{ background: P.stage }} />
      <div className="mx-auto mt-4 h-px w-[78%]" style={{ background: P.border }} />
      <div className="mx-auto mt-3 h-4 w-1/3 rounded" style={{ background: P.stage }} />
    </div>
  );
}
