import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Flame, Sword, Target, Heart, PawPrint, Package, Leaf, Sprout, Wrench,
  Apple, Gem, Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TopNav, SiteFooter, Testimonials } from "./Home";
import { usePrice } from "@/context/CurrencyContext";
import { effectiveStock, isSoldOut } from "@/lib/stock";
import { RBstar } from "@/components/Art";
import ProductCard from "@/components/ProductCard";
import PageLoader from "@/components/PageLoader";
import { useCart } from "@/context/CartContext";
import { fetchPublicContent, visibleBanners } from "@/lib/publicContent";
import type { PublicContent } from "@/lib/publicContent";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";
const S = "/scene/";

const iconMap: Record<string, LucideIcon> = {
  flame: Flame, sword: Sword, target: Target, heart: Heart,
  pawprint: PawPrint, package: Package, leaf: Leaf, sprout: Sprout,
  wrench: Wrench, apple: Apple, gem: Gem, star: Star,
};
const getIcon = (name?: string): LucideIcon => (name && iconMap[name.toLowerCase()]) || Package;

/* ── Data shapes ───────────────────────────────────────────────────────── */
interface Product {
  id: string; name: string; price: number; originalPrice?: number;
  outOfStock?: boolean; stock?: number; imageUrl?: string; categoryId?: string;
  featured?: boolean; bestSeller?: boolean; gradient?: [string, string];
  /** live physical inventory — stock is the legacy field, see lib/stock.ts */
  onHand?: number;
}
interface ApiCategory { _id: string; name: string; slug: string; icon?: string; game: string; }
interface ApiGame { _id: string; name: string; slug: string; gradient?: { from: string; to: string }; imageUrl?: string; bgImageUrl?: string; }

/* Card accent per category — colours the little bar + hover glow. */
const ACCENTS = ["#8b5cf6", "#2f8cff", "#22c55e", "#ec4899", "#f59e0b", "#06b6d4", "#ef4444", "#3fd08a"];
const accentFor = (key?: string) => {
  if (!key) return ACCENTS[0];
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
  return ACCENTS[h % ACCENTS.length];
};

const SORTS = [["pop", "Popularity"], ["lo", "Price: low to high"], ["hi", "Price: high to low"], ["name", "Name A-Z"]] as const;
type Sort = (typeof SORTS)[number][0];

/* ── Inline icon helper ────────────────────────────────────────────────── */
const PATHS: Record<string, string> = {
  chev: '<path d="M6 9l6 6 6-6"/>', left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  filter: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.5 6.6 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  check: '<path d="M5 12l4 4 10-10"/>',
};
function Ic({ n, s = 20, className }: { n: string; s?: number; className?: string }) {
  return <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: PATHS[n] }} />;
}
const Spark = ({ s }: { s: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.7 6.5 3.5 9.3 12 12-8.5 2.7-11.3 5.5-12 12-.7-6.5-3.5-9.3-12-12 8.5-2.7 11.3-5.5 12-12z" /></svg>
);

/* Per-slide gradient, kept for slides that have no uploaded image. */
const SLIDE_BG = [
  "linear-gradient(100deg,#0a2f8f,#1a56d6 50%,#0a2f8f)",
  "linear-gradient(100deg,#2a1d8f,#5a3be0 50%,#2a1d8f)",
  "linear-gradient(100deg,#0a5a78,#1a8fb8 50%,#0a5a78)",
];
const SPARKS: [number, number, number][] = [[268, 14, 18], [520, 22, 14], [900, 18, 16], [1080, 54, 12], [820, 122, 22], [120, 128, 20], [1120, 146, 15], [430, 132, 14]];

/* ── Promo banner (auto-rotate, pause on hover) ──────────────────────────
   Slides are owned in Admin → Site Content → Promo Banners: each one has a
   visibility toggle, its own image, a headline, a button label and a link.
   With no image set the slide keeps the gradient + game art it always had. */
function Banner({ navigate }: { navigate: (u: string) => void }) {
  const [content, setContent] = useState<PublicContent | null>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchPublicContent().then(c => { if (alive) setContent(c); });
    return () => { alive = false; };
  }, []);

  const slides = visibleBanners(content);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  if (!open || slides.length === 0) return null;
  const go = (n: number) => setSlide((n + slides.length) % slides.length);

  /* internal paths reuse the client router; absolute URLs open in a new tab */
  const goCta = (raw: string) => {
    const to = (raw || "").trim();
    if (!to) return;
    if (/^https?:\/\//i.test(to) || to.startsWith("//")) window.open(to, "_blank", "noopener");
    else navigate(to);
  };

  return (
    <section className="mk-banner" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((s, k) => (
        <div key={k} className={"mk-slide" + (s.image ? " has-img" : "") + (k === slide ? " on" : "")} style={{ background: SLIDE_BG[k % SLIDE_BG.length] }}>
          {s.image
            ? <img className="mk-slide-img" src={s.image} alt="" />
            : <>
                {SPARKS.map(([x, y, z], i) => <span key={i} className="mk-spark" style={{ left: x, top: y }}><Spark s={z} /></span>)}
                <img className="mk-art" src={`${S}island_new.png`} alt="" style={{ left: 28, top: 16, width: 150, filter: "drop-shadow(0 14px 16px rgba(0,0,0,.35))" }} />
                <img className="mk-art" src={`${S}island_r.png`} alt="" style={{ right: 34, top: 24, width: 132, filter: "drop-shadow(0 14px 16px rgba(0,0,0,.35))" }} />
                <img className="mk-art" src={`${S}coin.png`} alt="" style={{ right: 210, bottom: 18, width: 52 }} />
                <img className="mk-art" src={`${S}gem_g.png`} alt="" style={{ left: 190, bottom: 16, width: 48 }} />
              </>}
          {s.title && <h2>{s.title}</h2>}
          {s.cta && <button className="mk-cta" type="button" onClick={() => goCta(s.url || "/browse")}>{s.cta}</button>}
        </div>
      ))}
      {slides.length > 1 && (
        <>
          <button className="mk-bn l" aria-label="Previous" onClick={() => go(slide - 1)}><Ic n="left" s={18} /></button>
          <button className="mk-bn r" aria-label="Next" onClick={() => go(slide + 1)}><Ic n="right" s={18} /></button>
          <div className="mk-dots">{slides.map((_, k) => <i key={k} className={k === slide ? "on" : ""} onClick={() => go(k)} />)}</div>
        </>
      )}
      <button className="mk-x" aria-label="Close banner" onClick={() => setOpen(false)}><Ic n="x" s={16} /></button>
    </section>
  );
}

/* ── Item card ─────────────────────────────────────────────────────────── */
/* Thin adapter so the three grid call sites keep their exact signature.
   The card itself is the shared reference-based design in
   components/ProductCard.tsx, which now also serves the home grid. */
function Card({ p, idx, accent, catName, navigate, onAdd }: {
  p: Product; idx: number; accent: string; catName: string; navigate: (u: string) => void; onAdd: (p: Product) => void;
}) {
  return (
    <ProductCard
      index={idx}
      onNavigate={(id) => navigate(`/product/${id}`)}
      onAdd={() => onAdd(p)}
      product={{
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        imageUrl: p.imageUrl,
        bestSeller: p.bestSeller,
        outOfStock: p.outOfStock,
        stock: p.stock,
        onHand: p.onHand,
        /* card reads these off the product, not as component props —
           passing them at the top level compiles but is silently dropped */
        accent,
        category: catName,
      }}
    />
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function GamePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { addItem } = useCart();
  /* Display currency for the price filter label — filtering stays in USD. */
  const fmt = usePrice();

  const [gameInfo, setGameInfo] = useState<ApiGame | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // UI state
  const [cat, setCat] = useState<string>("");          // "" = all
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("pop");
  const [maxP, setMaxP] = useState(0);                 // 0 = no cap (set on load)
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [menu, setMenu] = useState<"" | "sort" | "filter">("");
  const root = useRef<HTMLDivElement>(null);

  const gameName = gameInfo?.name || (slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Game");

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setLoadError(null);
    async function attempt(round: number) {
      try {
        const [gameRes, catsRes, prodsRes] = await Promise.all([
          fetch(`${BACKEND}/api/games/${slug}`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${BACKEND}/api/categories/game/${slug}`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`${BACKEND}/api/products/game/${slug}?limit=200`).then(r => r.json()).catch(() => ({ data: [] })),
        ]);
        const ok = gameRes.success && catsRes.success && prodsRes.success;
        if (!ok && round < 3) { setTimeout(() => attempt(round + 1), 800 * round); return; }
        if (gameRes.success && gameRes.data?.game) setGameInfo(gameRes.data.game);
        else setGameInfo({ _id: slug, name: gameName, slug });
        setCategories(catsRes.data || []);
        setLoadError(ok ? null : "Could not load the store. Refresh to retry.");
        const fetched: Product[] = (prodsRes.data || []).map((p: Record<string, unknown>) => ({
          id: p._id as string, name: p.name as string, price: p.price as number,
          originalPrice: p.originalPrice as number | undefined,
          stock: p.stock as number | undefined,
          onHand: p.onHand as number | undefined,
          /* Sold out means the admin flag, or genuinely nothing on hand. This
             used to read `stock`, which goes stale — items with real stock
             (14 on hand, stock=0) were showing as unavailable. */
          outOfStock: isSoldOut({
            stock: typeof p.stock === "number" ? p.stock : null,
            onHand: typeof p.onHand === "number" ? p.onHand : null,
            outOfStock: p.outOfStock === true,
          }),
          imageUrl: p.imageUrl as string | undefined,
          categoryId: typeof p.category === "object" && p.category !== null ? (p.category as { _id: string })._id : p.category as string,
          featured: p.featured as boolean, bestSeller: p.bestSeller as boolean,
        }));
        setProducts(fetched);
        const max = fetched.filter(x => !x.outOfStock).reduce((m, x) => Math.max(m, x.price), 0) || 10;
        setMaxP(Math.ceil(max));
      } finally { setLoading(false); }
    }
    attempt(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // close popovers on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!root.current?.querySelector(".mk-bar")?.contains(e.target as Node)) setMenu(""); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const catName = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach(c => { m[c._id] = c.name; });
    return m;
  }, [categories]);

  const filterCount = (inStockOnly ? 1 : 0) + (onSale ? 1 : 0) + (maxP < (Math.ceil(products.reduce((m, x) => Math.max(m, x.price), 0) || 10)) ? 1 : 0);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const priceCap = maxP;
    const out = products.filter(p =>
      (!cat || p.categoryId === cat) &&
      (!needle || p.name.toLowerCase().includes(needle)) &&
      (!inStockOnly || !p.outOfStock) &&
      (!onSale || (p.originalPrice && p.originalPrice > p.price)) &&
      p.price <= priceCap);
    out.sort((a, b) =>
      sort === "lo" ? a.price - b.price :
      sort === "hi" ? b.price - a.price :
      sort === "name" ? a.name.localeCompare(b.name) :
      (Number(!!b.bestSeller) - Number(!!a.bestSeller)) || (Number(!!b.featured) - Number(!!a.featured)) || b.name.localeCompare(a.name));
    return out;
  }, [products, cat, q, sort, inStockOnly, onSale, maxP]);

  const clearFilters = () => { setInStockOnly(false); setOnSale(false); setMaxP(Math.ceil(products.reduce((m, x) => Math.max(m, x.price), 0) || 10)); };

  function handleAdd(p: Product) {
    if (p.outOfStock) return;
    addItem({
      id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
      gradient: p.gradient || ["#0a84ff", "#121a2e"], image: p.imageUrl, game: slug,
      bgImageUrl: gameInfo?.bgImageUrl,
      /* carried so the cart can cap the "+" — the card tells the user when
         something was cut back to available stock */
      stock: effectiveStock(p),
    });
  }

  if (loading) {
    return <PageLoader label={gameName} />;
  }

  const priceCeil = Math.ceil(products.reduce((m, x) => Math.max(m, x.price), 0) || 10);

  return (
    <div ref={root} className="mk-page">
      <style>{mkCSS}</style>
      <TopNav onHome={() => navigate("/")} />

      <div className="mk-wrap">
        <Banner navigate={navigate} />

        {/* Category chips */}
        <div className="mk-chips">
          <button className={"mk-chip" + (cat === "" ? " on" : "")} onClick={() => setCat("")}>All Items</button>
          {categories.map(c => (
            <button key={c._id} className={"mk-chip" + (cat === c._id ? " on" : "")} onClick={() => setCat(cat === c._id ? "" : c._id)}>{c.name}</button>
          ))}
        </div>

        {/* Filter / search / sort bar */}
        <div className="mk-bar">
          <div style={{ position: "relative" }} className={menu === "filter" ? "mk-open" : ""}>
            <button className="mk-fb" aria-label="Filters" onClick={() => setMenu(menu === "filter" ? "" : "filter")}>
              <Ic n="filter" s={22} />{filterCount > 0 && <b>{filterCount}</b>}
            </button>
            <div className="mk-menu mk-pop">
              <h4>AVAILABILITY</h4>
              <label className={inStockOnly ? "on" : ""} onClick={e => { e.preventDefault(); setInStockOnly(v => !v); }}>
                <input type="checkbox" checked={inStockOnly} readOnly /><i />In stock only
              </label>
              <label className={onSale ? "on" : ""} onClick={e => { e.preventDefault(); setOnSale(v => !v); }}>
                <input type="checkbox" checked={onSale} readOnly /><i />On sale
              </label>
              <h4 style={{ marginTop: 10 }}>MAX PRICE</h4>
              <div className="rg">
                <input type="range" min={1} max={priceCeil} step={0.5} value={maxP} onChange={e => setMaxP(+e.target.value)} />
                <span>{fmt(maxP)}</span>
              </div>
              <button className="clr" onClick={clearFilters}>Clear filters</button>
            </div>
          </div>

          <label className="mk-search"><Ic n="search" s={22} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Quick search" autoComplete="off" />
            {q && <button className="mk-clr" aria-label="Clear" onClick={() => setQ("")}><Ic n="x" s={16} /></button>}
          </label>

          <div className={"mk-sort" + (menu === "sort" ? " open" : "")}>
            <button className="mk-sb" onClick={() => setMenu(menu === "sort" ? "" : "sort")}>
              <span className="st"><Ic n="star" s={20} /></span><span>{SORTS.find(s => s[0] === sort)![1]}</span><Ic n="chev" s={18} className="cv" />
            </button>
            <div className="mk-menu">
              {SORTS.map(([k, label]) => (
                <button key={k} className={sort === k ? "on" : ""} onClick={() => { setSort(k); setMenu(""); }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid — grouped by category on "All Items", flat when a category or search is active */}
        {list.length === 0 ? (
          <div className="mk-empty">
            <p>No items match your filters.</p>
            <button className="clr" onClick={() => { clearFilters(); setQ(""); setCat(""); }}>Reset everything</button>
          </div>
        ) : !cat && !q.trim() ? (
          /* Grouped by category */
          categories.map(group => {
            const items = list.filter(p => p.categoryId === group._id);
            if (items.length === 0) return null;
            const Icon = getIcon(group.icon);
            const accent = accentFor(group._id);
            return (
              <section key={group._id} className="mk-group">
                <div className="mk-gh">
                  <span className="mk-gh-ic" style={{ background: `${accent}22`, color: accent }}>
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <h3>{group.name}</h3>
                  <span className="mk-gh-n">{items.length}</span>
                  <span className="mk-gh-line" />
                </div>
                <div className="mk-grid">
                  {items.map((p, i) => (
                    <Card key={p.id} p={p} idx={i} accent={accent} catName={group.name}
                      navigate={navigate} onAdd={handleAdd} />
                  ))}
                </div>
              </section>
            );
          }).concat(
            /* Any items with no matching category go in an "Uncategorized" group */
            (() => {
              const rest = list.filter(p => !p.categoryId || !categories.some(c => c._id === p.categoryId));
              if (rest.length === 0) return [];
              return [
                <section key="__uncat" className="mk-group">
                  <div className="mk-gh">
                    <span className="mk-gh-ic" style={{ background: "#2f8cff22", color: "#2f8cff" }}><Package size={18} strokeWidth={2.2} /></span>
                    <h3>More Items</h3>
                    <span className="mk-gh-n">{rest.length}</span>
                    <span className="mk-gh-line" />
                  </div>
                  <div className="mk-grid">
                    {rest.map((p, i) => (
                      <Card key={p.id} p={p} idx={i} accent="#2f8cff" catName="Item"
                        navigate={navigate} onAdd={handleAdd} />
                    ))}
                  </div>
                </section>,
              ];
            })()
          )
        ) : (
          /* Flat grid for a single category or a search */
          <div className="mk-grid">
            {list.map((p, i) => (
              <Card key={p.id} p={p} idx={i} accent={accentFor(p.categoryId)} catName={catName[p.categoryId || ""] || "Item"}
                navigate={navigate} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>

      {/* Same reviews band the homepage runs — the store's real buyer
          reviews, not a separate game-flavoured variant. */}
      <Testimonials />

      <SiteFooter />
    </div>
  );
}

/* ── Styles (ported from the reference, tuned to our navy) ─────────────── */
const mkCSS = `
.mk-page{position:relative;min-height:100vh;color:#fff;font-family:Inter,system-ui,sans-serif;
  background:radial-gradient(900px 600px at 0% 0%,#1a2b52,transparent 70%),radial-gradient(800px 600px at 100% 20%,#15264a,transparent 70%),#111a2b;padding:24px 20px 40px}
.mk-page *{box-sizing:border-box}
/* Header sits flush to the top and spans the full width (cancels the page padding) */
.mk-page>header{margin:-24px -20px 0}
/* The banner used to sit flush against the header (nav bottom = banner top,
   measured at 65/65) which read as one glued block. This is the seam. */
.mk-wrap{max-width:1180px;margin:0 auto;padding-top:22px}

/* banner */
.mk-banner{position:relative;height:188px;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.35)}
.mk-slide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity .5s;pointer-events:none}
.mk-slide.on{opacity:1;pointer-events:auto}
/* Owner-uploaded slide image (Admin → Site Content → Promo Banners). Fills the
   banner and crops to cover so it stays sharp at any width — the banner is
   fluid-width and a fixed 188px tall (176px on mobile). */
.mk-slide-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;pointer-events:none;user-select:none}
/* scrim so the headline + button stay legible over a busy image */
.mk-slide.has-img:before{content:"";position:absolute;inset:0;z-index:1;background:rgba(6,12,26,.34)}
.mk-slide h2{font:800 40px/1 Montserrat,Inter,sans-serif;letter-spacing:-1.2px;text-align:center;text-shadow:0 3px 0 rgba(0,0,0,.18);margin-top:-6px;white-space:nowrap;position:relative;z-index:2}
.mk-cta{margin-top:20px;height:48px;padding:0 30px;border-radius:99px;border:0;cursor:pointer;background:linear-gradient(180deg,#ffd75a,#f0a81c);color:#1a1a3a;font:800 17px Inter,sans-serif;box-shadow:0 5px 0 #b97a0c,0 10px 20px rgba(0,0,0,.25);transition:transform .15s,filter .2s;position:relative;z-index:2}
.mk-cta:hover{filter:brightness(1.06);transform:translateY(-1px)}
.mk-art{position:absolute;pointer-events:none;user-select:none}
.mk-spark{position:absolute;color:#ffd75a;pointer-events:none;opacity:.85}
.mk-bn{position:absolute;top:50%;width:32px;height:32px;margin-top:-16px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;cursor:pointer;display:grid;place-items:center;z-index:3;transition:background .2s}
.mk-bn:hover{background:rgba(255,255,255,.3)}.mk-bn.l{left:16px}.mk-bn.r{right:16px}
.mk-x{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:9px;border:0;background:rgba(255,255,255,.18);color:#fff;cursor:pointer;display:grid;place-items:center;z-index:4}
.mk-x:hover{background:rgba(255,255,255,.32)}
.mk-dots{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;gap:9px;z-index:3}
.mk-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.45);cursor:pointer;transition:.2s}.mk-dots i.on{background:#fff;transform:scale(1.15)}

/* chips */
.mk-chips{display:flex;gap:12px;margin-top:16px;flex-wrap:wrap}
.mk-chip{height:40px;padding:0 20px;border-radius:12px;background:#1b2745;border:1px solid #2a3a60;color:#c9d3f0;font:500 15px Inter,sans-serif;cursor:pointer;transition:.18s}
.mk-chip:hover{border-color:#4f86e8;color:#fff}.mk-chip.on{background:#0a5ec4;border-color:#2f8cff;color:#fff}

/* bar */
.mk-bar{display:flex;gap:16px;align-items:center;margin-top:26px;position:relative;flex-wrap:wrap}
.mk-fb{position:relative;width:46px;height:46px;border-radius:12px;background:#1b2745;border:1px solid #2a3a60;color:#c9d3f0;cursor:pointer;display:grid;place-items:center}
.mk-fb:hover{border-color:#4f86e8}
.mk-fb b{position:absolute;left:-2px;top:-12px;min-width:24px;height:24px;border-radius:8px;background:#f59e0b;color:#fff;font:800 13px/24px Inter,sans-serif;text-align:center}
.mk-search{display:flex;align-items:center;gap:10px;width:300px;height:46px;padding:0 14px;border-radius:12px;background:#1b2745;border:1px solid #2a3a60;color:#8ea0cf;transition:box-shadow .2s,border-color .2s}
.mk-search:focus-within{border-color:#2f8cff;box-shadow:0 0 0 4px rgba(47,140,255,.2)}
.mk-search input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font:400 15px Inter,sans-serif}.mk-search input::placeholder{color:#7f8cad}
.mk-search .mk-clr{background:none;border:0;color:#8ea0cf;cursor:pointer;display:grid;place-items:center;padding:0}
.mk-sort{position:relative}
.mk-sb{display:flex;align-items:center;gap:12px;width:196px;height:46px;padding:0 14px 0 8px;border-radius:12px;background:#1b2745;border:1px solid #2a3a60;color:#fff;cursor:pointer;font:500 16px Inter,sans-serif}
.mk-sb .st{width:34px;height:34px;border-radius:9px;background:rgba(47,140,255,.18);color:#4f9bff;display:grid;place-items:center}
.mk-sb svg.cv{margin-left:auto;color:#9fb0d8;transition:transform .2s}.mk-sort.open .cv{transform:rotate(180deg)}
.mk-menu{position:absolute;z-index:20;top:52px;left:0;min-width:200px;padding:6px;border-radius:12px;background:#17223d;border:1px solid #2a3a60;box-shadow:0 14px 30px rgba(0,0,0,.45);display:none}
.mk-open>.mk-menu,.mk-sort.open .mk-menu{display:block}
.mk-menu button{display:block;width:100%;text-align:left;background:none;border:0;color:#c9d3f0;padding:10px 12px;border-radius:8px;font:500 15px Inter,sans-serif;cursor:pointer}
.mk-menu button:hover{background:#1f2f52;color:#fff}.mk-menu button.on{color:#4f9bff}
.mk-pop{top:54px;width:260px;padding:16px}
.mk-pop h4{font:700 12px Inter,sans-serif;letter-spacing:.08em;color:#9fb0d8;margin:0 0 10px}
.mk-pop label{display:flex;align-items:center;gap:10px;height:34px;font-size:15px;cursor:pointer;color:#e6ecff}
.mk-pop label i{width:18px;height:18px;border-radius:5px;border:1.5px solid #4a5b86;display:grid;place-items:center}
.mk-pop label.on i{background:#2f8cff;border-color:#2f8cff}.mk-pop label.on i:after{content:"";width:4px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}
.mk-pop input[type=checkbox]{position:absolute;opacity:0;pointer-events:none}
.mk-pop .rg{display:flex;align-items:center;gap:10px;margin:6px 0 14px;font-size:14px;color:#aab6d8}.mk-pop .rg input{flex:1;accent-color:#2f8cff}
.mk-pop .clr,.mk-empty .clr{height:36px;padding:0 14px;border-radius:9px;border:1px solid #2a3a60;background:#1b2745;color:#c9d3f0;font:600 14px Inter,sans-serif;cursor:pointer;margin-top:6px}.mk-pop .clr:hover,.mk-empty .clr:hover{border-color:#4f86e8}

/* grid */
/* grid — 5 up: the new card carries a CTA, so 6 across the 1180px wrap
   would squeeze it to 184px (the reference sits at 236px) */
.mk-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:15px;margin-top:15px;padding-bottom:20px}

/* category group heading */
.mk-group{margin-top:34px}
.mk-group:first-of-type{margin-top:26px}
.mk-gh{display:flex;align-items:center;gap:12px;margin-bottom:4px}
.mk-gh-ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:none}
.mk-gh h3{font:700 20px/1 Montserrat,Inter,sans-serif;letter-spacing:-.3px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.mk-gh-n{min-width:26px;height:24px;padding:0 8px;border-radius:8px;background:#1b2745;border:1px solid #2a3a60;color:#9fb0d8;font:700 13px/22px Inter,sans-serif;text-align:center;flex:none}
.mk-gh-line{flex:1;height:1px;background:linear-gradient(90deg,#2a3a60,transparent)}
/* Card styles live in components/ProductCard.tsx (shared with the home
   grid) — the old inline .mk-card / .mk-bar3 / .mk-bonus / .mk-oos /
   .mk-img / .mk-info / .mk-add rules went with it. The hover accent glow
   and the category colour bar are recreated there via --accent. */
.mk-empty{grid-column:1/-1;text-align:center;padding:70px 0;color:#9aa8cb;display:flex;flex-direction:column;align-items:center;gap:10px}
.mk-empty p{font-size:16px}

@media(max-width:1100px){.mk-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.mk-slide h2{font-size:32px;white-space:normal;padding:0 72px;line-height:1.05}.mk-art{display:none}}
@media(max-width:900px){.mk-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:760px){.mk-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mk-slide h2{font-size:22px;white-space:normal;padding:0 56px}.mk-cta{height:44px;font-size:15px;padding:0 22px}.mk-search{width:100%}.mk-banner{height:176px}}
/* Phones: the market grid becomes a swipeable snap rail (one full card +
   a peek) instead of a long 2-col stack. Desktop keeps the grid above. */
@media(max-width:639px){.mk-grid{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;padding-bottom:10px;scrollbar-width:none}.mk-grid::-webkit-scrollbar{display:none}.mk-grid>*{flex:0 0 55%;scroll-snap-align:start}}
@media(prefers-reduced-motion:reduce){.mk-slide{transition:none}}
`;
