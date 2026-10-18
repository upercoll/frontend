import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Lock, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLocation } from "wouter";
import { RBstar, ItemTileGlyph } from "@/components/Art";

/* ─────────────────────────────────────────────────────────────────────────
   CART DRAWER — dark-navy marketplace side panel.
   Same design language as the shop page (market-grid) + product page
   (item-page): navy #111a2b panel, #1b2745 cards, #2a3a60 borders, Montserrat
   headings, Inter body, green #5fe08e prices, blue gradient actions, per-item
   accent colour drawn from the product's own gradient.
   ───────────────────────────────────────────────────────────────────────── */

const CartGlyph = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="17" cy="20" r="1.5" fill="currentColor" />
    <circle cx="10" cy="8.5" r="1" fill="currentColor" />
    <circle cx="14.5" cy="8.5" r="1" fill="currentColor" />
    <path d="M10 11c.8.8 3.2.8 4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export default function CartDrawer() {
  const { items, removeItem, updateQty, totalItems, totalPrice, isOpen, closeCart } = useCart();
  /* Display currency; the cart total handed to Stripe stays USD. */
  const { fmt, converted, rates } = useCurrency();
  const [, navigate] = useLocation();
  const [checking, setChecking] = useState(false);

  /* Lock body scroll + close on Escape while open */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [isOpen, closeCart]);

  /* Real savings vs. the struck-through original price (informational) */
  const savings = useMemo(
    () => items.reduce((s, i) => s + (i.originalPrice && i.originalPrice > i.price ? (i.originalPrice - i.price) * i.quantity : 0), 0),
    [items]
  );

  function handleCheckout() {
    setChecking(true);
    setTimeout(() => { setChecking(false); closeCart(); navigate("/checkout"); }, 400);
  }

  return (
    <>
      <style>{crtCSS}</style>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="crt-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="crt-backdrop"
              onClick={closeCart}
            />

            {/* Side panel */}
            <motion.aside
              key="crt-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="crt"
              aria-label="Shopping cart"
            >
              {/* Header */}
              <div className="crt-hd">
                <span className="crt-hd-ic"><CartGlyph s={20} /></span>
                <div className="crt-hd-t">
                  <h2>Your Cart</h2>
                  {totalItems > 0 && (
                    <p>{totalItems} {totalItems === 1 ? "item" : "items"} ready</p>
                  )}
                </div>
                {totalItems > 0 && <span className="crt-count">{totalItems}</span>}
                <button className="crt-x" aria-label="Close cart" onClick={closeCart}><X size={17} /></button>
              </div>

              {/* Body */}
              {items.length === 0 ? (
                <div className="crt-empty">
                  <div className="crt-empty-art">
                    <i className="r r1" /><i className="r r2" /><i className="r r3" />
                    <RBstar size={54} color="#4f9bff" className="crt-star" />
                  </div>
                  <h3>Your cart is empty</h3>
                  <p>Browse the store and add items — they'll show up right here.</p>
                  <button className="crt-browse" onClick={() => { closeCart(); navigate("/browse"); }}>
                    Browse Games
                  </button>
                </div>
              ) : (
                <div className="crt-body">
                  <AnimatePresence initial={false}>
                    {items.map(item => {
                      const accent = item.gradient?.[0] || "#2f8cff";
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96, height: 0, marginBottom: -12 }}
                          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          className="crt-item"
                          style={{ ["--c" as any]: accent } as React.CSSProperties}
                        >
                          <button className="crt-rm" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}>
                            <X size={14} strokeWidth={2.6} />
                          </button>

                          {/* Thumbnail */}
                          <div className="crt-th">
                            {item.image
                              ? <img src={item.image} alt={item.name} />
                              : <ItemTileGlyph className="w-9 h-9" />}
                          </div>

                          {/* Info */}
                          <div className="crt-info">
                            <p className="crt-nm" title={item.name}>{item.name}</p>
                            <div className="crt-pr">
                              <b>{fmt(item.price)}</b>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <s>${item.originalPrice.toFixed(2)}</s>
                              )}
                            </div>

                            <div className="crt-row">
                              <div className="crt-step">
                                <button
                                  onClick={() => updateQty(item.id, item.quantity - 1)}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} strokeWidth={2.8} />
                                </button>
                                <b>{item.quantity}</b>
                                <button onClick={() => updateQty(item.id, item.quantity + 1)} aria-label="Increase quantity">
                                  <Plus size={13} strokeWidth={2.8} />
                                </button>
                              </div>
                              <span className="crt-lt">{fmt(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Footer / summary */}
              {items.length > 0 && (
                <div className="crt-ft">
                  <div className="crt-line">
                    <span>Subtotal · {totalItems} {totalItems === 1 ? "item" : "items"}</span>
                    <b>{fmt(totalPrice)}</b>
                  </div>
                  {savings > 0 && (
                    <div className="crt-line save">
                      <span>You saved</span>
                      <b>+{fmt(savings)}</b>
                    </div>
                  )}

                  <div className="crt-total">
                    <span>Total</span>
                    <b>{fmt(totalPrice)}</b>
                  </div>

                  {/* Converted display prices are a convenience; the amount
                      actually taken from the card is USD. */}
                  {converted && (
                    <p className="crt-usd-note">
                      ≈ ${totalPrice.toFixed(2)} USD charged · rates from {rates.date ?? "today"}
                    </p>
                  )}

                  <button className="crt-go" onClick={handleCheckout} disabled={checking}>
                    {checking ? "Processing…" : <>Checkout <ArrowRight size={18} strokeWidth={2.6} /></>}
                  </button>

                  <div className="crt-secure"><Lock size={13} /> Secure 256-bit checkout · delivered to your account</div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Styles (dark-navy marketplace, matching shop + product pages) ─────── */
const crtCSS = `
.crt-backdrop{position:fixed;inset:0;z-index:70;background:rgba(6,10,20,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.crt{position:fixed;top:0;right:0;bottom:0;z-index:80;width:min(440px,100vw);display:flex;flex-direction:column;overflow:hidden;
  color:#fff;font-family:Inter,system-ui,sans-serif;
  background:
    radial-gradient(520px 400px at 100% 0%,rgba(47,140,255,.16),transparent 70%),
    radial-gradient(440px 340px at 0% 100%,rgba(139,92,246,.12),transparent 70%),
    linear-gradient(180deg,#151f38,#111a2b);
  border-left:1px solid #2a3a60;border-radius:20px 0 0 20px;
  box-shadow:-24px 0 54px rgba(0,0,0,.5)}
.crt *{box-sizing:border-box}.crt button{font-family:inherit}

/* header */
.crt-hd{display:flex;align-items:center;gap:12px;padding:17px 18px;border-bottom:1px solid #2a3a60;flex:none}
.crt-hd-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:rgba(47,140,255,.16);color:#4f9bff;flex:none}
.crt-hd-t{min-width:0}
.crt-hd h2{margin:0;font:700 20px/1.15 Montserrat,Inter,sans-serif;letter-spacing:-.3px}
.crt-hd p{margin:2px 0 0;font-size:12.5px;color:#8ea0cf}
.crt-count{height:24px;min-width:30px;padding:0 9px;border-radius:99px;background:#f59e0b;color:#1a1a3a;font:800 13px/24px Inter,sans-serif;text-align:center;flex:none}
.crt-x{margin-left:auto;width:40px;height:40px;border-radius:11px;border:1px solid #2a3a60;background:#1b2745;color:#c9d3f0;cursor:pointer;display:grid;place-items:center;transition:.18s;flex:none}
.crt-x:hover{border-color:#4f86e8;color:#fff}

/* body */
.crt-body{flex:1;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.crt-body::-webkit-scrollbar{width:8px}.crt-body::-webkit-scrollbar-thumb{background:#2f8cff;border-radius:4px}
.crt-body::-webkit-scrollbar-track{background:#17223d;border-radius:4px}

/* item card */
.crt-item{position:relative;display:flex;gap:13px;padding:14px 13px 13px;border-radius:14px;overflow:hidden;
  background:linear-gradient(180deg,#222f4d,#1b2641);border:1px solid #2a3a60;transition:border-color .18s,box-shadow .18s}
.crt-item::before{content:"";position:absolute;left:50%;top:0;width:46px;height:3px;margin-left:-23px;border-radius:0 0 3px 3px;background:var(--c)}
.crt-item:hover{border-color:var(--c);box-shadow:0 10px 22px rgba(0,0,0,.35),0 0 16px color-mix(in srgb,var(--c) 26%,transparent)}
.crt-rm{position:absolute;top:6px;right:6px;width:32px;height:32px;border-radius:9px;border:0;background:transparent;color:#6f7c99;cursor:pointer;display:grid;place-items:center;transition:.15s;z-index:2}
.crt-rm:hover{background:rgba(239,68,68,.16);color:#ff5a4d}
.crt-th{width:70px;height:70px;border-radius:12px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 14%,#16213c);display:grid;place-items:center;flex:none;overflow:hidden}
.crt-th img{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}
.crt-info{flex:1;min-width:0}
.crt-nm{margin:0;font:700 15px/20px Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:24px}
.crt-pr{display:flex;align-items:baseline;gap:8px;margin-top:3px}
.crt-pr b{font:700 16px Inter,sans-serif;color:#5fe08e}
.crt-pr s{color:#6f7c99;font-size:12px;font-weight:600}
.crt-row{display:flex;align-items:center;justify-content:space-between;margin-top:12px}
.crt-step{display:flex;align-items:center;background:#141e36;border:1px solid #2a3a60;border-radius:10px;overflow:hidden}
.crt-step button{width:36px;height:36px;border:0;background:none;color:#c9d3f0;cursor:pointer;display:grid;place-items:center;transition:.15s}
.crt-step button:hover:not(:disabled){color:#fff;background:#1f2f52}.crt-step button:disabled{opacity:.35;cursor:not-allowed}
.crt-step b{width:36px;text-align:center;font:700 14px Inter,sans-serif}
.crt-lt{font:700 17px Inter,sans-serif;color:#fff}

/* empty state */
.crt-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:40px 26px;text-align:center}
.crt-empty-art{position:relative;width:154px;height:154px;display:grid;place-items:center;margin-bottom:10px}
.crt-empty-art i{position:absolute;border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)}
.crt-empty-art .r1{width:154px;height:154px;background:rgba(47,140,255,.07)}
.crt-empty-art .r2{width:116px;height:116px;background:rgba(47,140,255,.11)}
.crt-empty-art .r3{width:82px;height:82px;background:rgba(47,140,255,.18);box-shadow:0 0 36px rgba(47,140,255,.35)}
.crt-star{position:relative;animation:crtFloat 4.5s ease-in-out infinite}
@keyframes crtFloat{50%{transform:translateY(-8px)}}
.crt-empty h3{margin:0;font:700 18px Montserrat,Inter,sans-serif}
.crt-empty p{margin:6px 0 0;font-size:13.5px;line-height:20px;color:#8ea0cf;max-width:250px}
.crt-browse{margin-top:16px;height:48px;padding:0 26px;border:0;border-radius:12px;cursor:pointer;color:#fff;font:700 15px Inter,sans-serif;
  background:linear-gradient(180deg,#2090f4,#0d58c4);box-shadow:0 6px 16px rgba(10,90,220,.35);transition:filter .18s,transform .12s}
.crt-browse:hover{filter:brightness(1.1)}.crt-browse:active{transform:scale(.98)}

/* footer */
.crt-ft{flex:none;padding:15px 18px calc(17px + env(safe-area-inset-bottom,0px));border-top:1px solid #2a3a60;background:rgba(13,20,38,.72);backdrop-filter:blur(6px)}
.crt-line{display:flex;align-items:center;justify-content:space-between;font-size:13.5px;color:#8ea0cf;margin-bottom:9px}
.crt-line b{color:#fff;font-weight:700;font-size:14px}
.crt-line.save b{color:#5fe08e}
.crt-total{display:flex;align-items:center;justify-content:space-between;padding-top:13px;border-top:1px solid #2a3a60}
.crt-total span{font:700 15px Montserrat,Inter,sans-serif;color:#c9d3f0}
.crt-total b{font:700 26px Inter,sans-serif;color:#fff;letter-spacing:-.5px}
.crt-go{margin-top:14px;width:100%;height:54px;border:0;border-radius:12px;cursor:pointer;color:#fff;font:700 17px Inter,sans-serif;
  display:flex;align-items:center;justify-content:center;gap:9px;
  background:linear-gradient(180deg,#0a84ff,#0a50d6);box-shadow:0 8px 20px rgba(10,90,220,.4);transition:filter .18s,transform .12s}
.crt-go:hover:not(:disabled){filter:brightness(1.08)}.crt-go:active:not(:disabled){transform:scale(.985)}
.crt-go:disabled{opacity:.72;cursor:progress}
.crt-secure{margin-top:11px;display:flex;align-items:center;justify-content:center;gap:7px;font-size:12px;color:#8a97ba}
.crt-usd-note{margin-top:7px;text-align:center;font-size:11px;color:#8a97ba}

@media(max-width:460px){.crt{width:100vw;border-radius:0;border-left:0}}
@media(prefers-reduced-motion:reduce){.crt-star{animation:none}}
`;
