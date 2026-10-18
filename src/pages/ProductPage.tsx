import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Check, ShoppingCart, Zap, Share2, Mail, Lock, Minus, Plus, ChevronRight, AlertTriangle, History, Headphones } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { usePrice } from "@/context/CurrencyContext";
import { effectiveStock, isSoldOut } from "@/lib/stock";
import { TopNav, SiteFooter } from "./Home";
import { RBstar } from "@/components/Art";
import PageLoader from "@/components/PageLoader";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

/* ── Data shapes ───────────────────────────────────────────────────────── */
interface ApiCategory { _id: string; name: string; slug: string; icon?: string }
interface ApiProduct {
  _id: string; name: string; slug: string; description?: string; game: string;
  category?: ApiCategory | string; price: number; originalPrice?: number;
  gradient?: { from: string; to: string }; imageUrl?: string; images?: string[];
  features?: string[]; stock: number; onHand?: number; outOfStock?: boolean;
  notice?: { text?: string; required?: boolean };
  variations?: { name: string; options: string[] }[];
  featured?: boolean; bestSeller?: boolean; tags?: string[];
}

/* Rarity-style accent per category (colours rings, chips, borders). */
const ACCENTS = ["#8b5cf6", "#2f8cff", "#22c55e", "#ec4899", "#f59e0b", "#06b6d4", "#ef4444", "#3fd08a"];
const accentFor = (key?: string) => {
  if (!key) return ACCENTS[0];
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
  return ACCENTS[h % ACCENTS.length];
};

/* ── Inline icons ──────────────────────────────────────────────────────── */
const PATHS: Record<string, string> = {
  x: '<path d="M6 6l12 12M18 6L6 18"/>', bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  cart: '<path d="M3 4h2.5l2 11h10l2-8H7"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  flame: '<path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" fill="currentColor"/>',
  tag: '<path d="M4 20L14 10l5-6-1 7-6 5z"/><path d="M4 20l4-4"/>', chev: '<path d="M9 6l6 6-6 6"/>',
  cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
};
const Ic = ({ n, s = 20, className }: { n: string; s?: number; className?: string }) => (
  <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: PATHS[n] }} />
);
const Spark = ({ s }: { s: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.7 6.5 3.5 9.3 12 12-8.5 2.7-11.3 5.5-12 12-.7-6.5-3.5-9.3-12-12 8.5-2.7 11.3-5.5 12-12z" /></svg>
);

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function ProductPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { addItem, items, openCart } = useCart();
  /* Display currency — stored prices and Stripe charges stay USD. */
  const fmt = usePrice();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [noticeAck, setNoticeAck] = useState(false);
  const [pickedVariants, setPickedVariants] = useState<Record<string, string>>({});
  const [gameBgImageUrl, setGameBgImageUrl] = useState<string | undefined>(undefined);
  const [catalog, setCatalog] = useState<ApiProduct[]>([]);
  const [related, setRelated] = useState<ApiProduct[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const tm = useRef<number | null>(null);
  const say = (m: string) => { setToast(m); if (tm.current != null) window.clearTimeout(tm.current); tm.current = window.setTimeout(() => setToast(""), 1600); };

  useEffect(() => () => { if (tm.current != null) window.clearTimeout(tm.current); }, []);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true); setNotFound(false); setQuantity(1); setNoticeAck(false); setPickedVariants({}); setDetailsOpen(false);
    window.scrollTo(0, 0); setGameBgImageUrl(undefined);
    fetch(`${BACKEND}/api/products/${params.id}`).then(r => r.json())
      .then(data => { if (!data.success || !data.data) setNotFound(true); else { setProduct(data.data); if (data.data.gameBgImageUrl) setGameBgImageUrl(data.data.gameBgImageUrl); } })
      .catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => { let alive = true; fetch(`${BACKEND}/api/products?limit=200`).then(r => r.json()).then(d => { if (alive && d?.success && Array.isArray(d.data)) setCatalog(d.data); }).catch(() => {}); return () => { alive = false; }; }, []);
  useEffect(() => { if (!params.id) return; let alive = true; setRelated([]); fetch(`${BACKEND}/api/products/${params.id}/related`).then(r => r.json()).then(d => { if (alive && d?.success && Array.isArray(d.data)) setRelated(d.data); }).catch(() => {}); return () => { alive = false; }; }, [params.id]);

  const categoryId = product && typeof product.category === "object" ? product.category._id : (product?.category as string | undefined);
  const categoryName = product && typeof product.category === "object" ? product.category.name : undefined;
  const accent = accentFor(categoryId);

  const similarProducts = useMemo(() => {
    const base = related.length > 0
      ? related
      : catalog.filter(p => { const catId = typeof p.category === "object" ? p.category._id : p.category; return catId === categoryId; });
    return base.filter(p => p._id !== product?._id && !p.outOfStock).slice(0, 12);
  }, [related, catalog, categoryId, product]);

  const recentlyViewed = useMemo(() => {
    if (catalog.length === 0) return [];
    let ids: string[] = []; try { ids = JSON.parse(localStorage.getItem("rbstars_recently_viewed") || "[]"); } catch {}
    return ids.filter(id => id !== product?._id).map(id => catalog.find(p => p._id === id)).filter(Boolean).slice(0, 10) as ApiProduct[];
  }, [catalog, product]);

  useEffect(() => { if (product) { try { const ids = JSON.parse(localStorage.getItem("rbstars_recently_viewed") || "[]").filter((i: string) => i !== product._id); ids.unshift(product._id); localStorage.setItem("rbstars_recently_viewed", JSON.stringify(ids.slice(0, 20))); } catch {} } }, [product?._id]);

  const savings = product?.originalPrice && !product.outOfStock ? product.originalPrice - product.price : null;
  const noticeText = product?.notice?.text?.trim() || "";
  const noticeRequired = !!product?.notice?.required && !!noticeText;
  const buyLocked = noticeRequired && !noticeAck;
  const featureList = product?.features?.filter(Boolean) || [];
  /* Real discount off list price — this drives the starburst sticker on the
     stage. (A seeded fake price/volume chart used to live here.) */
  const discountPct = product?.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const rarity = product?.outOfStock ? "Sold out" : product?.bestSeller ? "Best Seller" : product?.featured ? "Featured" : "In Stock";

  /* One payload builder so "add" and "fast buy" can never drift apart. The
     stock cap travels with the item — see lib/stock.ts. */
  function cartPayload(p: ApiProduct) {
    return {
      id: p._id, name: p.name, price: p.price, originalPrice: p.originalPrice,
      gradient: [p.gradient?.from || "#0a84ff", p.gradient?.to || "#121a2e"] as [string, string],
      image: p.imageUrl, game: p.game, bgImageUrl: gameBgImageUrl,
      stock: effectiveStock(p),
    };
  }
  function add() {
    if (!product || isSoldOut(product) || buyLocked) return;
    const { added, clamped } = addItem(cartPayload(product), quantity);
    if (added <= 0) { say(`No more stock — ${product.name} is fully in your cart`); return; }
    setJustAdded(true); setTimeout(() => setJustAdded(false), 1400);
    say(clamped ? `Added ${added} — that's all we have in stock` : "Added to cart");
    openCart();
  }
  function buyNow() {
    if (!product || isSoldOut(product) || buyLocked) return;
    addItem(cartPayload(product), quantity);
    navigate("/checkout");
  }
  function quickAdd(p: ApiProduct) {
    if (isSoldOut(p)) return;
    const { added, clamped } = addItem(cartPayload(p), 1);
    if (added <= 0) { say(`No more stock — ${p.name} is fully in your cart`); return; }
    say(clamped ? `Added — that's all we have of ${p.name}` : "Added to cart");
    openCart();
  }
  const share = () => { navigator.clipboard?.writeText(window.location.href); say("Link copied"); };

  if (loading) {
    /* Full-viewport screen, same shape as GamePage. It deliberately renders
       on its own (no .it-page wrapper): inside that wrapper it was a 60vh
       block under the header, which left a dead half-page gap below it. */
    return <PageLoader label="item" />;
  }
  if (notFound || !product) {
    return (
      <div className="it-page"><TopNav onHome={() => navigate("/")} />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <RBstar size={44} color="#3c4f7d" />
          <h1 className="text-xl font-bold">Product not found</h1>
          <p className="text-sm" style={{ color: "#a9b3d3" }}>This item may have been removed or is no longer available.</p>
          <button onClick={() => navigate("/browse")} className="it-btn fast" style={{ padding: "0 24px", height: 48 }}>Browse Games</button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  /* Total units that exist (the lib/stock.ts rule), and how many of those are
     still buyable once what is already sitting in the cart is taken off — the
     stepper used to cap on the total, so "max" could double-count. */
  const stockCap = effectiveStock(product);
  const inCart = items.find((i) => i.id === product._id)?.quantity ?? 0;
  const remaining = stockCap === null ? null : Math.max(0, stockCap - inCart);
  const unlimited = stockCap === null;
  const accentStyle = { ["--c" as any]: accent } as React.CSSProperties;

  return (
    <div className="it-page">
      <style>{itCSS}</style>
      <TopNav onHome={() => navigate("/")} />

      {/* Breadcrumb */}
      <div className="it-crumbs">
        <button onClick={() => navigate("/browse")}>Browse</button><ChevronRight size={13} />
        <button onClick={() => navigate(`/game/${product.game}`)} className="capitalize">{product.game.split("-").join(" ")}</button>
        {categoryName && <><ChevronRight size={13} /><button onClick={() => navigate(`/game/${product.game}`)}>{categoryName}</button></>}
        <ChevronRight size={13} /><span>{product.name}</span>
      </div>

      <div className="it-wrap">
        {/* LEFT — display stage + item details */}
        <div>
          <div className="it-card it-stage" style={accentStyle}>
            <i className="sgrid" aria-hidden="true" />
            {product.imageUrl
              ? <img src={product.imageUrl} alt={product.name} />
              : <RBstar size={120} color={accent} />}
            <span className="sp" style={{ right: 56, top: 42 }}><Spark s={34} /></span>
            <span className="sp" style={{ right: 40, top: 96, animationDelay: ".8s" }}><Spark s={22} /></span>
            <span className="sp" style={{ left: 34, bottom: 46, animationDelay: "1.4s" }}><Spark s={32} /></span>

            {/* Rotated starburst carrying the REAL discount — this is what
                replaced the old seeded price / "number of pieces" chart. */}
            {discountPct >= 5 && !product.outOfStock && (
              <span className="it-burst"><b>−{discountPct}%</b><small>OFF</small></span>
            )}

            {!product.outOfStock && (
              <span className="it-stock">
                <i className={unlimited ? "dot inf" : "dot"} />
                {unlimited ? "Unlimited stock" : `${stockCap!.toLocaleString("en-US")} in stock`}
              </span>
            )}

            {product.outOfStock && <span className="it-oos">Out of Stock</span>}
          </div>

          {/* Details sit under the case so both hero columns balance out */}
          {(product.description || featureList.length > 0) && (
            <div className={"it-card it-det" + (detailsOpen ? " open" : "")}>
              <div className="it-detcol">
                <h3>Item details</h3>
                {product.description && <p>{product.description}</p>}
                {product.description && (
                  <button className="it-more" onClick={() => setDetailsOpen(o => !o)}>{detailsOpen ? "Show less" : "Read more"}</button>
                )}
              </div>
              {featureList.length > 0 && (
                <div className="it-featwrap">
                  <h4>What's included</h4>
                  <ul className="it-feats">
                    {featureList.map((f, i) => <li key={i}><Check size={14} strokeWidth={3} />{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: title, chips, buy box */}
        <div>
          <h1 className="it-h1">{product.name}</h1>
          <div className="it-chips">
            <div className="it-chip"><Ic n="cube" s={18} />{categoryName || "Item"}</div>
            <div className="it-chip r" style={accentStyle}><i />{rarity}</div>
          </div>

          <div className="it-buy">
            <div className="it-pr">
              <div className="it-price">
                <small>Best price</small>
                <b>{fmt(product.price)}{product.originalPrice && <s>{fmt(product.originalPrice)}</s>}</b>
              </div>
              {savings && (
                <div className="it-cb"><small>You save</small><span>+{fmt(savings)}</span></div>
              )}
            </div>

            {/* Quantity — capped on what is still available, so the page and
                the cart can never disagree about how many are left. */}
            {!product.outOfStock && (
              <div className="it-qty">
                <span>Quantity</span>
                <div className="it-stepper">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}><Minus size={15} strokeWidth={2.6} /></button>
                  <b>{quantity}</b>
                  <button onClick={() => setQuantity(q => q + 1)} disabled={!unlimited && quantity >= remaining!} aria-label="Increase quantity"><Plus size={15} strokeWidth={2.6} /></button>
                </div>
                <div className="it-quick">
                  {[1, 3, 5].map(n => (
                    <button key={n} className={quantity === n ? "on" : ""} disabled={!unlimited && n > remaining!} onClick={() => setQuantity(n)}>{n}×</button>
                  ))}
                  {!unlimited && remaining! > 0 && (
                    <button className={quantity === remaining ? "on" : ""} onClick={() => setQuantity(remaining!)}>Max</button>
                  )}
                </div>
                <em>
                  {unlimited
                    ? "Unlimited stock"
                    : remaining === 0
                      ? "All of it is already in your cart"
                      : inCart > 0
                        ? `${remaining} more available · ${inCart} in cart`
                        : `${remaining} available`}
                </em>
              </div>
            )}

            <div className="it-btns">
              <button className="it-btn fast" onClick={buyNow} disabled={product.outOfStock || buyLocked}><Zap size={18} fill="currentColor" />Fast buy</button>
              <button className={"it-btn cart" + (justAdded ? " ok" : "")} onClick={add} disabled={product.outOfStock || buyLocked}>
                {justAdded ? <><Check size={18} strokeWidth={3} />Added</> : <>Add to cart <Ic n="cart" s={20} /></>}
              </button>
              <button className="it-btn share" onClick={share}><Share2 size={18} />Share</button>
            </div>
            {buyLocked && <p className="it-lock"><AlertTriangle size={13} /> Tick the notice below to unlock purchasing</p>}
          </div>

          {/* Notice */}
          {noticeText && (
            <div className={"it-notice" + (noticeRequired ? " req" : "")}>
              <AlertTriangle size={16} className="it-ni" />
              <div>
                <b>{noticeRequired ? "Please read before buying" : "Notice"}</b>
                <p>{noticeText}</p>
                {noticeRequired && (
                  <label className="it-ack"><input type="checkbox" checked={noticeAck} onChange={e => setNoticeAck(e.target.checked)} /><span className={noticeAck ? "on" : ""}><Check size={12} strokeWidth={3} /></span>I understand and meet this requirement</label>
                )}
              </div>
            </div>
          )}

          {/* Variations (display-only) */}
          {(product.variations || []).filter(v => v.name && v.options?.length).map(v => (
            <div className="it-var" key={v.name}>
              <p>{v.name}</p>
              <div className="it-opts">
                {v.options.map(opt => {
                  const picked = pickedVariants[v.name] === opt;
                  return <button key={opt} className={picked ? "on" : ""} onClick={() => setPickedVariants(prev => ({ ...prev, [v.name]: opt }))}>{opt}</button>;
                })}
              </div>
            </div>
          ))}

        </div>

        {/* RIGHT: trust band + more from category */}
        <div className="it-side">
          <div className="it-band">
            <div className="it-trust">
              <span className="it-ti"><Mail size={20} /></span>
              <div><b>Delivered to your Roblox account</b><p>Confirm your username when you claim and your items are delivered to your in-game mailbox.</p></div>
            </div>
            <div className="it-trust pay">
              <span className="it-ti"><Lock size={20} /></span>
              <div><b>Secure checkout</b><p>256-bit encrypted payments on every order.</p></div>
            </div>
            <div className="it-trust help">
              <span className="it-ti"><Headphones size={20} /></span>
              <div><b>24/7 human support</b><p>Live chat or a support ticket whenever you need a hand.</p></div>
            </div>
          </div>

          {similarProducts.length > 0 && (
            <>
              <h3 className="it-sh3"><span className="ic"><Ic n="cube" s={20} /></span>More like this <span className="n">{similarProducts.length}</span></h3>
              <div className="it-offers">
                {similarProducts.slice(0, 8).map(p => (
                  <div className="it-offer" key={p._id} style={{ ["--c" as any]: accentFor(typeof p.category === "object" ? (p.category as ApiCategory)._id : p.category) } as React.CSSProperties}>
                    <div className="th" onClick={() => navigate(`/product/${p._id}`)}>
                      {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <RBstar size={30} color="#8ea0cf" />}
                    </div>
                    <div className="meta" onClick={() => navigate(`/product/${p._id}`)}>
                      <b>{fmt(p.price)}</b><small>{p.name}</small>
                    </div>
                    <button aria-label="Add to cart" onClick={() => quickAdd(p)}><Ic n="cart" s={19} /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* BOTTOM: similar priced rail */}
        {similarProducts.length > 0 && (
          <section className="it-sim">
            <div className="it-shead">
              <span className="ic"><Ic n="flame" s={20} /></span><h3>Similar items</h3>
              <a onClick={() => navigate(`/game/${product.game}`)}>Show all <Ic n="chev" s={15} /></a>
            </div>
            <div className="it-rail">
              {similarProducts.map(p => (
                <button key={p._id} className="it-mini" style={{ ["--c" as any]: accentFor(typeof p.category === "object" ? (p.category as ApiCategory)._id : p.category) } as React.CSSProperties} onClick={() => navigate(`/product/${p._id}`)}>
                  <i className="bar" />
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" /> : <span className="ph"><RBstar size={44} color="#8ea0cf" /></span>}
                  <div className="n" title={p.name}>{p.name}</div><div className="p">{fmt(p.price)}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Recently viewed rail */}
        {recentlyViewed.length > 0 && (
          <section className="it-sim">
            <div className="it-shead">
              <span className="ic hist"><History size={20} /></span><h3>Recently viewed</h3>
            </div>
            <div className="it-rail">
              {recentlyViewed.map(p => (
                <button key={p._id} className="it-mini" style={{ ["--c" as any]: accentFor(typeof p.category === "object" ? (p.category as ApiCategory)._id : p.category) } as React.CSSProperties} onClick={() => navigate(`/product/${p._id}`)}>
                  <i className="bar" />
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" /> : <span className="ph"><RBstar size={44} color="#8ea0cf" /></span>}
                  <div className="n" title={p.name}>{p.name}</div><div className="p">{fmt(p.price)}</div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky CTA */}
      {!product.outOfStock && (
        <div className="it-mob">
          <button className="it-btn cart" onClick={add} disabled={buyLocked} aria-label="Add to cart">
            {justAdded ? <Check size={20} strokeWidth={3} /> : <Ic n="cart" s={22} />}
          </button>
          <button className="it-btn fast" onClick={buyNow} disabled={buyLocked}><Zap size={17} fill="currentColor" />{buyLocked ? "Acknowledge notice" : `Buy Now${quantity > 1 ? ` (×${quantity})` : ""}`}</button>
        </div>
      )}

      <div className={"it-toast" + (toast ? " show" : "")}>{toast}</div>
      <SiteFooter />
    </div>
  );
}

/* ── Styles (ported from the reference, tuned to our navy) ─────────────── */
const itCSS = `
.it-page{position:relative;min-height:100vh;color:#fff;font-family:Inter,system-ui,sans-serif;
  background:radial-gradient(900px 600px at 0% 0%,#1a2b52,transparent 70%),radial-gradient(800px 700px at 100% 25%,#15264a,transparent 70%),#111a2b;padding:24px 20px 40px}
.it-page *{box-sizing:border-box}.it-page button{font-family:inherit}
/* Header sits flush to the top and spans the full width (cancels the page padding) */
.it-page>header{margin:-24px -20px 0}
.it-crumbs{max-width:1360px;margin:0 auto 16px;display:flex;align-items:center;gap:6px;font-size:13px;color:#8a97ba;flex-wrap:wrap}
.it-crumbs button{background:none;border:0;color:inherit;cursor:pointer;padding:0;font-size:13px}.it-crumbs button:hover{color:#fff}.it-crumbs span{color:#fff;font-weight:600}
.it-wrap{max-width:1360px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.06fr);gap:26px;align-items:start}
.it-card{background:#1b2745;border:1px solid #2a3a60;border-radius:18px}

/* ── Display stage: the item on a lit podium, dot-grid backdrop ─────────── */
.it-stage{position:relative;height:430px;overflow:hidden;display:grid;place-items:center;background:#16213c}
.it-stage .sgrid{position:absolute;inset:0;opacity:.55;pointer-events:none;
  background-image:radial-gradient(color-mix(in srgb,var(--c) 36%,transparent) 1px,transparent 1.5px);
  background-size:22px 22px;
  -webkit-mask-image:radial-gradient(circle at 50% 46%,#000 16%,transparent 74%);
  mask-image:radial-gradient(circle at 50% 46%,#000 16%,transparent 74%)}
.it-stage img{position:relative;width:214px;max-height:254px;object-fit:contain;filter:drop-shadow(0 16px 22px rgba(0,0,0,.45));animation:itFloat 5s ease-in-out infinite}
@keyframes itFloat{50%{transform:translateY(-9px)}}
.it-stage .sp{position:absolute;color:#ffc933;animation:itTw 3s ease-in-out infinite;z-index:2}@keyframes itTw{50%{transform:scale(.7);opacity:.6}}

/* Discount starburst — real % off list price, stuck on at an angle. This is
   what replaced the seeded price / "number of pieces" chart. */
.it-burst{position:absolute;left:16px;top:14px;z-index:3;width:90px;height:90px;display:grid;place-content:center;text-align:center;
  background:#FFC53D;color:#1a1204;transform:rotate(-12deg);
  clip-path:polygon(50% 0,61% 12%,75% 6%,79% 21%,94% 21%,90% 36%,100% 50%,90% 64%,94% 79%,79% 79%,75% 94%,61% 88%,50% 100%,39% 88%,25% 94%,21% 79%,6% 79%,10% 64%,0 50%,10% 36%,6% 21%,21% 21%,25% 6%,39% 12%);
  filter:drop-shadow(0 8px 16px rgba(0,0,0,.42));
  animation:itPop .55s cubic-bezier(.34,1.56,.64,1) both}
.it-burst b{display:block;font:800 25px/1 Montserrat,Inter,sans-serif;letter-spacing:-.6px}
.it-burst small{display:block;font:800 10px/1.4 Inter,sans-serif;letter-spacing:.18em;margin-top:2px}
@keyframes itPop{0%{transform:rotate(-12deg) scale(0)}100%{transform:rotate(-12deg) scale(1)}}

/* Real stock read-out */
.it-stock{position:absolute;left:16px;bottom:16px;z-index:3;display:flex;align-items:center;gap:9px;height:34px;padding:0 15px;border-radius:99px;background:#0d1526e6;border:1px solid #2a3a60;color:#c9d3f0;font:700 12.5px Inter,sans-serif;letter-spacing:.02em}
.it-stock .dot{width:8px;height:8px;border-radius:50%;background:#5fe08e;box-shadow:0 0 0 3px rgba(95,224,142,.22)}
.it-stock .dot.inf{background:#2f8cff;box-shadow:0 0 0 3px rgba(47,140,255,.22)}
.it-oos{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:3;height:30px;padding:0 16px;border-radius:99px;background:#0d1526e6;border:1px solid rgba(239,68,68,.5);color:#ff8a80;font:800 12px/28px Inter,sans-serif;letter-spacing:.06em}

/* ── Buy panel ──────────────────────────────────────────────────────────── */
.it-h1{font:800 clamp(24px,3.1vw,33px)/1.12 Montserrat,Inter,sans-serif;letter-spacing:-.7px;margin:2px 0 0}
.it-chips{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.it-chip{display:flex;align-items:center;gap:9px;height:36px;padding:0 15px;border-radius:99px;background:#16213c;border:1px solid #2a3a60;color:#c9d3f0;font-size:14px;font-weight:600}
.it-chip.r{background:color-mix(in srgb,var(--c) 18%,transparent);border-color:color-mix(in srgb,var(--c) 44%,transparent);color:color-mix(in srgb,var(--c) 72%,#fff)}
.it-chip.r i{width:10px;height:10px;border-radius:50%;background:var(--c);box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 26%,transparent)}

.it-buy{max-width:none;margin-top:24px}
.it-pr{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;padding-bottom:20px;border-bottom:1px solid #223153}
.it-pr small,.it-cb small{display:block;color:#8a97ba;font:700 11.5px/1 Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase}
.it-price b{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 12px;font:800 clamp(34px,5vw,46px)/1.05 Montserrat,Inter,sans-serif;letter-spacing:-1.2px;margin-top:10px;color:#5fe08e}
.it-price b s{color:#5b6a91;font-size:clamp(17px,2.4vw,21px);font-weight:700;letter-spacing:0}
.it-cb{text-align:right}.it-cb span{display:inline-flex;align-items:center;height:30px;padding:0 13px;border-radius:99px;background:rgba(95,224,142,.16);color:#5fe08e;font-weight:800;font-size:14px;margin-top:8px}

.it-qty{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin-top:20px}
.it-qty>span{font:700 11.5px Inter,sans-serif;color:#8a97ba;letter-spacing:.14em;text-transform:uppercase}
.it-stepper{display:flex;align-items:center;background:#141e36;border:1px solid #2a3a60;border-radius:11px;overflow:hidden}
.it-stepper button{width:42px;height:42px;border:0;background:none;color:#c9d3f0;cursor:pointer;display:grid;place-items:center;transition:.15s}
.it-stepper button:hover:not(:disabled){color:#fff;background:#1f2f52}.it-stepper button:disabled{opacity:.35;cursor:not-allowed}
.it-stepper b{width:46px;text-align:center;font:800 17px Inter,sans-serif}
.it-qty em{font-style:normal;font-size:12.5px;color:#8a97ba}
/* one-tap quantity picks */
.it-quick{display:flex;gap:6px;flex-wrap:wrap}
.it-quick button{height:34px;min-width:46px;padding:0 13px;border-radius:99px;background:#16213c;border:1px solid #2a3a60;color:#a9b3d3;font:700 13px Inter,sans-serif;cursor:pointer;transition:.15s}
.it-quick button:hover:not(:disabled){border-color:#4f86e8;color:#fff}
.it-quick button.on{background:#0a5ec4;border-color:#1b86ff;color:#fff}
.it-quick button:disabled{opacity:.35;cursor:not-allowed}

.it-btns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:22px}
.it-btn{height:56px;border:0;border-radius:13px;color:#fff;font:800 16.5px Inter,sans-serif;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;transition:filter .18s,transform .12s}
.it-btn:hover:not(:disabled){filter:brightness(1.08)}.it-btn:active:not(:disabled){transform:scale(.985)}.it-btn:disabled{opacity:.45;cursor:not-allowed}
.it-btn.fast{background:linear-gradient(180deg,#2090f4,#0d58c4);box-shadow:0 6px 18px rgba(10,90,220,.4)}
.it-btn.cart{background:linear-gradient(180deg,#ffc53d,#f08a0a);color:#241300;box-shadow:0 6px 18px rgba(240,138,10,.32)}.it-btn.cart.ok{background:linear-gradient(180deg,#2ec27a,#14884f);color:#04220f}
.it-btn.share{grid-column:1/-1;height:48px;background:#16213c;border:1px solid #2a3a60;color:#a9b3d3;font-weight:700;font-size:14.5px}
.it-lock{display:flex;align-items:center;gap:6px;margin-top:10px;color:#f59e0b;font-size:12.5px;font-weight:600}

.it-notice{margin-top:22px;display:flex;gap:12px;padding:14px 16px;border-radius:12px;background:#1b2745;border:1px solid #2a3a60}
.it-notice.req{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4)}
.it-notice .it-ni{color:#f59e0b;flex:none;margin-top:2px}
.it-notice b{display:block;font:700 13px Inter,sans-serif;color:#f59e0b;letter-spacing:.02em}
.it-notice p{margin-top:6px;color:#c9d3f0;font-size:14px;line-height:22px;white-space:pre-line}
.it-ack{display:flex;align-items:center;gap:9px;margin-top:12px;cursor:pointer;font-size:13px;color:#e6ecff;font-weight:600}
.it-ack input{position:absolute;opacity:0;pointer-events:none}
.it-ack span{flex:none;width:18px;height:18px;border-radius:5px;border:1.5px solid #4a5b86;display:grid;place-items:center;color:transparent;transition:.15s}
.it-ack span.on{background:#2f8cff;border-color:#2f8cff;color:#fff}

.it-var{margin-top:22px}.it-var p{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a97ba;margin-bottom:9px}
.it-opts{display:flex;flex-wrap:wrap;gap:8px}
.it-opts button{height:38px;padding:0 16px;border-radius:10px;background:#1b2745;border:1px solid #2a3a60;color:#c9d3f0;font:600 13px Inter,sans-serif;cursor:pointer;transition:.16s}
.it-opts button.on{background:#2f8cff;border-color:#2f8cff;color:#fff}

/* ── Details card — description + what's included, side by side ─────────── */
.it-det{margin-top:26px;padding:22px 24px 20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:24px 32px}
.it-det h3{font:800 18px Montserrat,Inter,sans-serif;letter-spacing:-.3px}
.it-det h4{font:800 12.5px Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8a97ba;margin:0}
.it-det p{position:relative;margin-top:12px;color:#9aa8cb;font-size:15px;line-height:25px;max-height:112px;overflow:hidden;transition:max-height .35s}
.it-det p:after{content:"";position:absolute;left:0;right:0;bottom:0;height:52px;background:linear-gradient(transparent,#1b2745);pointer-events:none;transition:opacity .2s}
.it-det.open p{max-height:700px}.it-det.open p:after{opacity:0}
.it-featwrap h4{margin-bottom:4px}
.it-feats{list-style:none;padding:0;margin:10px 0 0;display:grid;gap:9px}
.it-feats li{display:flex;align-items:flex-start;gap:9px;color:#c9d3f0;font-size:14.5px;line-height:21px}.it-feats li svg{color:#5fe08e;flex:none;margin-top:3px}
.it-more{display:inline-flex;align-items:center;height:34px;padding:0 16px;margin-top:14px;background:#16213c;border:1px solid #2a3a60;border-radius:99px;color:#7fb4ff;font:700 13px Inter,sans-serif;cursor:pointer;transition:.15s}
.it-more:hover{border-color:#4f86e8;color:#fff}

/* ── Trust band — full-width row under the hero ─────────────────────────── */
.it-side{grid-column:1/-1;margin-top:2px}
.it-band{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
.it-trust{display:flex;gap:13px;padding:18px;border-radius:16px;background:#1b2745;border:1px solid #2a3a60;transition:border-color .2s,transform .2s}
.it-trust:hover{border-color:#4f86e8;transform:translateY(-3px)}
.it-ti{width:42px;height:42px;border-radius:12px;background:rgba(47,140,255,.16);color:#4f9bff;display:grid;place-items:center;flex:none}
.it-trust.pay .it-ti{background:rgba(95,224,142,.16);color:#5fe08e}
.it-trust.help .it-ti{background:rgba(255,197,61,.16);color:#FFC53D}
.it-trust b{display:block;font:700 14.5px Inter,sans-serif}.it-trust p{margin-top:4px;color:#8ea0cf;font-size:13px;line-height:19px}

.it-sh3{display:flex;align-items:center;gap:12px;font:800 clamp(18px,2.4vw,22px) Montserrat,Inter,sans-serif;letter-spacing:-.4px;margin:30px 0 16px}
.it-sh3 .ic{width:40px;height:40px;border-radius:12px;background:rgba(139,92,246,.16);color:#a78bfa;display:grid;place-items:center;flex:none}
.it-sh3 .n{height:26px;min-width:32px;padding:0 9px;border-radius:8px;background:#f59e0b;color:#241300;font:800 13px/26px Inter,sans-serif;text-align:center}
.it-offers{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.it-offer{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:13px;background:#1b2745;border:1px solid #2a3a60;transition:.18s}.it-offer:hover{border-color:#4f86e8;transform:translateX(-2px)}
.it-offer .th{width:52px;height:54px;border-radius:11px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 14%,#16213c);display:grid;place-items:center;flex:none;cursor:pointer}.it-offer .th img{width:40px;height:40px;object-fit:contain}
.it-offer .meta{flex:1;min-width:0;cursor:pointer}.it-offer b{display:block;font:700 17px Inter,sans-serif}.it-offer small{display:block;font-size:12px;color:#8ea0cf;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.it-offer button{width:40px;height:40px;border-radius:11px;border:0;background:#f59e0b;color:#fff;cursor:pointer;display:grid;place-items:center;flex:none;transition:filter .15s}.it-offer button:hover{filter:brightness(1.1)}

.it-sim{grid-column:1/-1;margin-top:8px}
.it-shead{display:flex;align-items:center;gap:14px}.it-shead .ic{width:42px;height:42px;border-radius:12px;background:rgba(239,68,68,.16);color:#ff5a4d;display:grid;place-items:center}
.it-shead .ic.hist{background:rgba(47,140,255,.16);color:#4f9bff}
.it-shead h3{font:700 20px Montserrat,Inter,sans-serif}.it-shead a{margin-left:auto;color:#8ea0cf;font-size:15px;display:flex;align-items:center;gap:4px;cursor:pointer}.it-shead a:hover{color:#fff}
.it-rail{margin-top:16px;padding:16px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid #223153;display:flex;gap:14px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:#2f8cff #17223d}
.it-rail::-webkit-scrollbar{height:6px}.it-rail::-webkit-scrollbar-thumb{background:#2f8cff;border-radius:4px}.it-rail::-webkit-scrollbar-track{background:#17223d;border-radius:4px}
.it-mini{position:relative;flex:none;width:150px;height:180px;scroll-snap-align:start;border-radius:12px;background:#1b2745;border:1px solid #2a3a60;cursor:pointer;transition:.2s;text-align:left;color:#fff;padding:0}
.it-mini:hover{transform:translateY(-4px);border-color:var(--c);box-shadow:0 12px 22px rgba(0,0,0,.4)}
.it-mini .bar{position:absolute;left:50%;top:0;width:34px;height:3px;margin-left:-17px;background:var(--c);border-radius:0 0 3px 3px}
.it-mini img,.it-mini .ph{display:grid;place-items:center;width:82px;height:82px;object-fit:contain;margin:16px auto 8px}
.it-mini .n{padding:0 12px;font:600 14px/20px Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.it-mini .p{padding:0 12px;font:700 15px/22px Inter,sans-serif;color:#5fe08e}

.it-mob{position:fixed;left:0;right:0;bottom:0;z-index:40;display:none;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:#111a2bf2;backdrop-filter:blur(8px);border-top:1px solid #223153}
.it-mob .it-btn{height:50px;flex:1}.it-mob .it-btn.cart{flex:none;width:56px}
.it-toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,20px);padding:12px 22px;border-radius:12px;background:#17223d;border:1px solid #4f86e8;box-shadow:0 12px 28px rgba(0,0,0,.45);font:600 15px Inter,sans-serif;opacity:0;pointer-events:none;transition:.25s;z-index:50}.it-toast.show{opacity:1;transform:translate(-50%,0)}

@media(max-width:1180px){.it-wrap{grid-template-columns:minmax(0,1fr)}.it-stage{height:400px}.it-offers{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:820px){
  .it-stage{height:288px}
  .it-stage img{width:168px;max-height:196px}
  .it-burst{width:74px;height:74px;left:12px;top:11px}.it-burst b{font-size:20px}.it-burst small{font-size:8.5px}
  /* "More like this" — swipeable snap rail on phones, not a tall stack */
  .it-offers{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;padding-bottom:6px;scrollbar-width:none}
  .it-offers::-webkit-scrollbar{display:none}
  .it-offers>*{flex:0 0 82%;scroll-snap-align:start}
  .it-h1{font-size:25px}.it-mob{display:flex}.it-page{padding-bottom:96px}
  .it-btn{height:50px;font-size:15px;gap:6px}.it-btn.share{height:44px}
  .it-det{padding:18px 18px 16px;grid-template-columns:minmax(0,1fr)}.it-band{grid-template-columns:minmax(0,1fr)}
  .it-pr{flex-wrap:wrap}.it-price b{letter-spacing:-.8px}
  .it-shead{flex-wrap:wrap;gap:10px}.it-shead h3{font-size:18px;min-width:0}.it-shead .ic{width:36px;height:36px}.it-shead a{margin-left:auto;font-size:14px}
}
@media(max-width:360px){.it-stage{height:262px}.it-quick{display:none}.it-burst{width:66px;height:66px}.it-burst b{font-size:18px}.it-price b{font-size:31px}}
@media(prefers-reduced-motion:reduce){.it-stage img,.it-stage .sp,.it-burst{animation:none}}
`;
