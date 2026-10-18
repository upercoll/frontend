import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { clampQty, effectiveStock } from "@/lib/stock";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  gradient: [string, string];
  image?: string;
  quantity: number;
  game?: string;
  bgImageUrl?: string;
  /** Units available when this was added — see lib/stock.ts. null = unlimited. */
  stock?: number | null;
}

export interface AddResult {
  /** Units that actually went in — 0 when the item is already at its cap. */
  added: number;
  /** True when the request had to be cut back to what is in stock. */
  clamped: boolean;
}

interface CartContextType {
  items: CartItem[];
  /** Caps `qty` to the product's stock (and to what is already in the cart). */
  addItem: (product: Omit<CartItem, "quantity">, qty?: number) => AddResult;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const STORAGE_KEY = "rbstars_cart";

/* Stock drops while an item sits in the cart, and older carts in localStorage
   predate the cap entirely — trim on load so a stale cart can never ask for
   more than exists. */
function normalizeItem(i: CartItem): CartItem | null {
  if (!i || typeof i.id !== "string" || typeof i.price !== "number") return null;
  const cap = effectiveStock(i);
  const quantity = clampQty(i.quantity, cap);
  if (quantity <= 0) return null;
  return { ...i, quantity, stock: cap };
}

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((i) => normalizeItem(i as CartItem))
      .filter((i): i is CartItem => i !== null);
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {

  }
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadFromStorage());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  /* A cart outlives the stock it was built from: it may have been saved
     before the cap existed (older entries carry no stock field at all), or
     while more units were on hand. Re-read the real numbers once on mount so
     the drawer and the product page never trust a stale count. Items whose
     product can't be read are left alone — the server still decides at
     payment. */
  useEffect(() => {
    if (items.length === 0) return;
    let alive = true;
    const ids = [...new Set(items.map((i) => i.id))];

    Promise.all(ids.map(async (id) => {
      try {
        const r = await fetch(`${BACKEND}/api/products/${id}`);
        const d = await r.json();
        return (d?.data ?? null) as { _id: string; onHand?: number; stock?: number } | null;
      } catch {
        return null;
      }
    })).then((products) => {
      if (!alive) return;
      const byId = new Map(products.filter(Boolean).map((p) => [p!._id, p!]));
      if (byId.size === 0) return;
      setItems((prev) => prev.map((i) => {
        const p = byId.get(i.id);
        if (!p) return i;
        const cap = effectiveStock(p);
        const quantity = clampQty(i.quantity, cap);
        return quantity === i.quantity && i.stock === cap ? i : { ...i, stock: cap, quantity };
      }));
    });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Caps the request at the product's stock and at whatever room is left
     after what is already in the cart. Returns what actually happened so the
     caller can say so — silently dropping units would be a lie. */
  const addItem = useCallback((product: Omit<CartItem, "quantity">, qty = 1): AddResult => {
    const cap = effectiveStock(product);
    const have = items.find((i) => i.id === product.id)?.quantity ?? 0;
    const want = Math.max(1, Math.floor(Number(qty) || 1));
    /* Unlimited products have room for whatever was asked for. */
    const room = cap === null ? want : Math.max(0, cap - have);
    const added = Math.min(want, room);

    if (added > 0) {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + added, stock: cap } : i,
          );
        }
        return [...prev, { ...product, quantity: added, stock: cap }];
      });
    }
    return { added, clamped: added < want };
  }, [items]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  /* Never above the cap: the drawer's "+" and any typed value go through here. */
  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next = clampQty(qty, effectiveStock(i));
      if (next === i.quantity) return i;
      return { ...i, quantity: next };
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      totalItems, totalPrice,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
