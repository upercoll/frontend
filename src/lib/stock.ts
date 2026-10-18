/* Sellable stock — one rule, used everywhere so the product page, the cards,
   the cart drawer and checkout can never disagree.

   The backend keeps two numbers on a product:
     onHand — live physical inventory, decremented when a sale is finalised
              (services/stockService.js) and refilled by stockers
     stock  — the older field, also auto-maintained but editable by hand in
              admin, so it drifts away from onHand (some products sit at
              stock=0 while onHand=14)

   onHand is the truth; `stock` is only a fallback for products that have
   never been stocked. Both use -1 as "unlimited". This matches the rule the
   backend stocker panel already uses (stockerPanelController.js). */

export interface StockSource {
  onHand?: number | null;
  stock?: number | null;
}

/** Units available to buy. `null` means unlimited. */
export function effectiveStock(p: StockSource | null | undefined): number | null {
  if (!p) return null;
  const onHand = typeof p.onHand === "number" ? p.onHand : null;
  const stock = typeof p.stock === "number" ? p.stock : null;
  const raw = onHand !== null && onHand >= 0 ? onHand : stock;
  if (raw === null || raw < 0) return null;
  return Math.floor(raw);
}

/** Hard sellable limit for an out-of-stock product. */
export function isSoldOut(p: (StockSource & { outOfStock?: boolean }) | null | undefined): boolean {
  if (!p) return false;
  if (p.outOfStock) return true;
  return effectiveStock(p) === 0;
}

/** Clamp a wanted quantity into [1, cap]. `cap === null` leaves it alone. */
export function clampQty(qty: number, cap: number | null): number {
  const want = Math.max(1, Math.floor(Number(qty) || 1));
  if (cap === null) return want;
  return Math.min(want, Math.max(0, cap));
}
