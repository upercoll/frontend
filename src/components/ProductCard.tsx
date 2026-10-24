import { useState } from "react";
import { motion } from "framer-motion";
import { Tag, ShoppingCart, Check, Ban, Minus, Plus } from "lucide-react";
import { P, type ImageShape } from "@/lib/storefront";
import { usePrice } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { effectiveStock, isSoldOut } from "@/lib/stock";

/* ── Product card ─────────────────────────────────────────────────────────
   Reference layout: lit media panel + "save" chip + best-sellers chip +
   title + price/discount row + full-width Add to Cart.

   Re-skinned to the storefront's RoGoat language rather than the reference's:
     · Outfit → Montserrat (title/price) + Inter (body/button), our fonts
     · the loud blue media panel → a navy stage lit by the item's own
       category colour, so all the colour still comes from the 3D art
     · price stays green (green = price everywhere else on the site)
     · discount chip is amber, not red — red means "problem" here
     · best-sellers diamond is brand gold, not green

   Responsive by construction: the card is fluid (the grid sets its width),
   the media box uses aspect-ratio instead of a fixed 190px, type is clamped,
   and every chip/badge is absolutely positioned inside an overflow-hidden
   panel so nothing can escape on a narrow phone. */

export type CardProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  /** how the cover art is framed — square keeps the classic floating stage,
      vertical/horizontal get a shape-matched panel so the art is never
      squished (see lib/storefront.ts) */
  imageShape?: ImageShape;
  /** category colour — tints the media panel glow + the hover glow */
  accent?: string;
  /** small muted line above the title (the shop grid's category label) */
  category?: string;
  bestSeller?: boolean;
  outOfStock?: boolean;
  /** legacy stock field — kept only as a fallback, see lib/stock.ts */
  stock?: number | null;
  /** live physical inventory; this is the number that decides availability */
  onHand?: number | null;
};

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
  const save = onSale ? p.originalPrice! - p.price : 0;
  const off = onSale ? Math.round((1 - p.price / p.originalPrice!) * 100) : 0;
  const soldOut = isSoldOut(p);
  const accent = p.accent || P.accent;
  /* Media framing per shape: square keeps the classic slightly-wide stage
     (351 existing products live in it — changing it would restyle the whole
     store); wide art gets a wide panel, tall art a tall one. The market grid
     groups like shapes, so a row is almost always one height. */
  const shape: ImageShape = p.imageShape || "square";
  const mediaRatio = shape === "horizontal" ? "16 / 10" : shape === "vertical" ? "4 / 5" : "212 / 186";
  const [added, setAdded] = useState(false);
  /* Display currency only — the stored price stays USD and so does the charge. */
  const fmt = usePrice();

  /* How much of this item the cart already holds. The button stops at the
     real limit and says so, instead of quietly adding nothing. */
  const { items, updateQty } = useCart();
  const cap = effectiveStock(p);
  const inCart = items.find((i) => i.id === p.id)?.quantity ?? 0;
  const remaining = cap === null ? null : Math.max(0, cap - inCart);
  const atCap = !soldOut && remaining === 0;
  const lowStock = !soldOut && !atCap && remaining !== null && remaining <= 5;

  return (
    <motion.article
      /* Mount animation, not whileInView: opening the cart drawer shifts
         layout, which made the IntersectionObserver re-fire and flash every
         card back to opacity 0 on each add-to-cart. */
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05 }}
      className="group relative flex flex-col w-full rounded-[18px] p-3 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5"
      style={{
        background: P.card,
        border: `1px solid ${P.border}`,
        boxShadow: P.shadow,
        opacity: soldOut ? 0.72 : 1,
      }}
    >
      {/* Category accent on hover — the shop grid's signature move
          (border + glow in the group's colour). An overlay rather than a
          :hover on the card itself, so it never fights the inline base
          border/shadow for specificity. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 0 1px ${accent}, 0 0 24px color-mix(in srgb, ${accent} 38%, transparent)`,
        }}
      />

      {/* ── Media ── The stage is a tint wash, not a nested box: no border,
          no inner card. The item art floats directly on the card surface so
          the card reads as one object instead of a box inside a box. */}
      <button
        type="button"
        onClick={() => onNavigate?.(p.id)}
        aria-label={p.name}
        className="relative block w-full overflow-hidden rounded-[12px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2745]"
        style={{
          aspectRatio: mediaRatio,
          /* flat navy stage + a single soft bloom in the item's own colour.
             The reference used a full blue gradient wash; ours keeps the
             surface flat and lets the art carry the colour. */
          background: `radial-gradient(ellipse 66% 50% at 50% 64%, color-mix(in srgb, ${accent} 26%, transparent), transparent 70%), linear-gradient(165deg, ${P.stage}, #121c33)`,
        }}
      >
        {/* item art — square art floats on the stage (drop shadow + all);
            vertical/horizontal art fills its shape-matched panel edge to
            edge (object-cover crops, never distorts). */}
        {p.imageUrl ? (
          shape === "square" ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              loading="lazy"
              className="absolute left-1/2 top-1/2 w-[68%] max-h-[74%] -translate-x-1/2 -translate-y-1/2 object-contain transition-transform duration-500 group-hover:scale-[1.07]"
              style={{
                filter: soldOut
                  ? "grayscale(.7) brightness(.75)"
                  : `drop-shadow(0 10px 14px rgba(0,0,0,.45))`,
              }}
            />
          ) : (
            <img
              src={p.imageUrl}
              alt={p.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              style={{ filter: soldOut ? "grayscale(.7) brightness(.75)" : undefined }}
            />
          )
        ) : (
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mont text-[28px] font-bold"
            style={{ color: P.borderStrong }}
          >
            RB
          </span>
        )}

        {/* save chip — top-left, green (green = value on this site).
            Hidden when sold out: an item you can't buy has nothing to save. */}
        {onSale && !soldOut && (
          <span
            className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-[7px] px-2 py-[5px] text-[11px] font-bold"
            style={{ background: P.good, color: "#08240f" }}
          >
            <Tag size={12} strokeWidth={2.6} />
            Save ${save.toFixed(2)}
          </span>
        )}

        {/* collectible corner sparkle — the sticker moment: best-seller
            cards get a slow gold shimmer top-right (save chip owns top-left,
            stock chip owns bottom-right, so this corner is always free). */}
        {p.bestSeller && !soldOut && (
          <span aria-hidden className="pk-sparkle absolute right-2.5 top-2.5 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2c1.2 6.4 2.4 7.6 8.8 8.8-6.4 1.2-7.6 2.4-8.8 8.8-1.2-6.4-2.4-7.6-8.8-8.8C9.6 9.6 10.8 8.4 12 2z"
                fill="#FFC53D"
              />
            </svg>
          </span>
        )}

        {/* best sellers chip — bottom-right, brand gold diamond. Diagonally
            opposite the save chip, so the two can never collide at any width.
            (A full-width "sold out" bar used to own this corner and did
            collide with it — stock is now carried by the button instead.) */}
        {p.bestSeller && (
          <span
            className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-[7px] px-2 py-[5px] text-[10.5px] font-semibold"
            style={{ background: "rgba(10,16,30,.86)", border: `1px solid ${P.borderStrong}`, color: "#fff" }}
          >
            <i
              className="block h-[7px] w-[7px] rotate-45"
              style={{ background: P.star }}
            />
            Best Sellers
          </span>
        )}
      </button>

      {/* ── Info ── */}
      <div className="flex flex-1 flex-col px-0.5 pt-3.5">
        {p.category && (
          <div
            className="mb-1 text-[12.5px] leading-[17px]"
            style={{ color: P.faint }}
          >
            {p.category}
          </div>
        )}
        <h3
          className="font-mont text-[15px] font-bold leading-snug text-white"
          title={p.name}
          style={{
            /* two lines then ellipsis: a long item name must not push the
               price/button out of the card on a 2-col phone grid */
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
          }}
        >
          {p.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <b className="font-mont text-[19px] font-bold leading-none" style={{ color: P.good }}>
            {fmt(p.price)}
          </b>
          {onSale && !soldOut && (
            <span
              className="rounded-[6px] border px-[7px] py-[3px] text-[11px] font-semibold leading-none"
              style={{ background: P.warnTint, borderColor: "rgba(245,158,11,.45)", color: P.warn }}
            >
              -{off}%
            </span>
          )}
          {onSale && (
            <s className="text-[12px] font-semibold" style={{ color: P.faint }}>
              {fmt(p.originalPrice!)}
            </s>
          )}
        </div>

        {/* spacer pushes the CTA to the bottom so every card in a row
            lines up regardless of how many lines its title takes */}
        <div className="flex-1 min-h-3" />

        {/* Stock — every card says where it stands, same vocabulary the
            checkout uses. Green when healthy, amber when it's running out,
            grey when it's gone. */}
        <p
          className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
          style={{ color: soldOut ? P.faint : lowStock ? "#f2792e" : P.good }}
        >
          <i
            className="block h-[6px] w-[6px] shrink-0 rounded-full"
            style={{ background: soldOut ? P.faint : lowStock ? "#f2792e" : P.good }}
          />
          {soldOut ? "Sold out" : cap === null ? "In stock" : lowStock ? `Only ${remaining} left` : `In stock · ${remaining} left`}
        </p>

        {/* ── CTA ── One slot, three states: Add → Added (flash) → stepper.
            The slot keeps a fixed height so the morph never reflows the
            card, and every colour/background change eases instead of
            snapping. Once you own one, the control becomes − N + so the
            card always tells you what's already in the cart. */}
        <div className="relative mt-3 h-[44px]">
          {soldOut ? (
            <button
              type="button"
              disabled
              aria-label={`${p.name} is sold out`}
              className="flex h-full w-full items-center justify-center gap-2 rounded-[11px] px-3 text-[13.5px] font-bold"
              style={{ background: P.band, border: `1px solid ${P.border}`, color: P.faint, cursor: "not-allowed" }}
            >
              <Ban size={15} strokeWidth={2.6} /> Sold out
            </button>
          ) : added ? (
            /* the flash — same shape as everything else, so the morph into
               the stepper below reads as one control changing its mind */
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: [0.96, 1.03, 1] }}
              transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex h-full w-full items-center justify-center gap-2 rounded-[11px] px-3 text-[13.5px] font-bold"
              style={{ background: P.good, color: "#08240f", boxShadow: `0 6px 18px rgba(95,224,142,.32)` }}
            >
              <Check size={16} strokeWidth={3} /> Added
            </motion.div>
          ) : inCart > 0 ? (
            /* the stepper — you already have some, take more or take less */
            <div
              className="flex h-full w-full items-stretch overflow-hidden rounded-[11px]"
              style={{ background: P.band, border: `1px solid ${P.borderStrong}` }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updateQty(p.id, inCart - 1); }}
                aria-label={`Remove one ${p.name} from cart`}
                className="grid w-[46px] shrink-0 place-items-center transition-colors"
                style={{ color: P.text }}
                onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(47,140,255,.14)")}
                onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
              >
                <Minus size={15} strokeWidth={3} />
              </button>
              <span
                className="grid flex-1 place-items-center border-x text-[13.5px] font-bold"
                style={{ borderColor: P.borderStrong, color: P.text }}
              >
                {inCart} in cart
              </span>
              <button
                type="button"
                disabled={atCap}
                onClick={(e) => { e.stopPropagation(); if (!atCap) updateQty(p.id, inCart + 1); }}
                aria-label={atCap ? `All ${cap} of ${p.name} are already in your cart` : `Add another ${p.name}`}
                className="grid w-[46px] shrink-0 place-items-center transition-colors disabled:cursor-not-allowed"
                style={{ color: atCap ? P.faint : "#fff", background: atCap ? "transparent" : `linear-gradient(180deg, ${P.accent}, ${P.accentDeep})` }}
                onMouseEnter={(ev) => { if (!atCap) ev.currentTarget.style.filter = "brightness(1.12)"; }}
                onMouseLeave={(ev) => (ev.currentTarget.style.filter = "none")}
              >
                <Plus size={15} strokeWidth={3} />
              </button>
            </div>
          ) : (
            /* first add */
            <button
              type="button"
              disabled={atCap}
              onClick={(e) => {
                e.stopPropagation();
                if (atCap) return;
                onAdd?.(p);
                setAdded(true);
                setTimeout(() => setAdded(false), 950);
              }}
              aria-label={atCap ? `All ${cap} of ${p.name} are already in your cart` : `Add ${p.name} to cart`}
              className="flex h-full w-full items-center justify-center gap-2 rounded-[11px] px-3 text-[13.5px] font-bold transition-[filter,transform,background-color,color] duration-300 hover:brightness-110 active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2745] disabled:cursor-not-allowed disabled:hover:brightness-100"
              style={{
                background: atCap ? P.band : `linear-gradient(180deg, ${P.accent}, ${P.accentDeep})`,
                border: atCap ? `1px solid ${P.border}` : "none",
                color: atCap ? P.faint : "#fff",
                boxShadow: atCap ? "none" : P.shadowSoft,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {atCap ? (
                <>
                  <Check size={15} strokeWidth={2.6} /> All {cap} in cart
                </>
              ) : (
                <>
                  <ShoppingCart size={15} strokeWidth={2.6} /> Add to Cart
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/** Skeleton shown while the grid loads — same box as the real card. */
export function ProductCardSkeleton() {
  return (
    <div
      className="w-full animate-pulse rounded-[18px] p-3"
      style={{ background: P.card, border: `1px solid ${P.border}` }}
    >
      <div className="w-full rounded-[12px]" style={{ aspectRatio: "212 / 186", background: P.stage }} />
      <div className="mt-3.5 h-4 w-3/4 rounded" style={{ background: P.stage }} />
      <div className="mt-2 h-3.5 w-1/2 rounded" style={{ background: P.stage }} />
      <div
        className="mt-4 h-[42px] w-full rounded-[11px]"
        style={{ background: P.stage }}
      />
    </div>
  );
}
