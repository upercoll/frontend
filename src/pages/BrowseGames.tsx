import { useState, useMemo, useEffect } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { Search, X, Play } from "lucide-react";
import { useLocation } from "wouter";
import { RBstar } from "@/components/Art";
import { C, Reveal, TopNav, SiteFooter } from "./Home";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";
const A = "/rogoat/";
const SC = "/scene/";

/* floating-prop helpers: P = shared classes (only from lg up, where there is free space beside the centred text) */
const P = "bgf absolute hidden lg:block";
const f = (width: string, rise: string, dur: string, delay = "0s") =>
  ({ width, "--bf": rise, "--bd": dur, "--bl": delay } as CSSProperties);

/* ══════════════════════════════════════════════════════════════════════════
   BROWSE GAMES — dark navy marketplace, same system as the homepage.
   Real games from the API, real reviews, one hero 3D render, one blue CTA.
   ══════════════════════════════════════════════════════════════════════════ */

type ShopGame = {
  _id: string; name: string; slug: string;
  gradient?: { from: string; to: string };
  imageUrl?: string; active?: boolean; productCount?: number;
};

type Review = { name: string; rating: number; comment: string; submittedAt: string };

/* Same three steps as the homepage — one explanation, never contradicting. */
const steps = [
  { n: "1", t: "Find your favourite Roblox item", d: "Select your desired item from the Roblox world" },
  { n: "2", t: "Payment method", d: "Check out and pay with your favourite payment method" },
  { n: "3", t: "Successfully", d: "Confirm your username and receive your items in-game" },
];

export default function BrowseGames() {
  const [, navigate] = useLocation();
  const [games, setGames] = useState<ShopGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);

  /* Retry — the backend sleeps on Render and can take ~30s to wake. */
  useEffect(() => {
    let alive = true;
    async function attempt(round: number) {
      try {
        const res = await fetch(`${BACKEND}/api/games?active=true`);
        const d = await res.json();
        const fetched: ShopGame[] = d?.data?.games || [];
        if (!alive) return;
        if (fetched.length > 0) { setGames(fetched); setLoading(false); return; }
        if (round < 3) setTimeout(() => attempt(round + 1), 800 * round);
        else setLoading(false);
      } catch {
        if (!alive) return;
        if (round < 3) setTimeout(() => attempt(round + 1), 800 * round);
        else setLoading(false);
      }
    }
    attempt(1);
    return () => { alive = false; };
  }, []);

  /* Real reviews only — no invented testimonials, ever. */
  useEffect(() => {
    let alive = true;
    fetch(`${BACKEND}/api/claims/public-reviews?limit=20`)
      .then(r => r.json())
      .then(data => {
        if (!alive) return;
        const raw = data?.data?.reviews;
        if (Array.isArray(raw) && raw.length > 0) {
          setReviews(raw.map((r: { name: string; rating: number; comment: string; submittedAt: string }) => ({
            name: r.name, rating: r.rating, comment: r.comment, submittedAt: r.submittedAt,
          })));
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (reviews.length < 2) return;
    const t = setInterval(() => setReviewIndex(i => (i + 1) % reviews.length), 4000);
    return () => clearInterval(t);
  }, [reviews.length]);

  const filtered = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter(g => g.name.toLowerCase().includes(q));
  }, [games, search]);

  const current = reviews[reviewIndex];

  return (
    <main className="relative min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>
      {/* same background glows as the homepage */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(900px 700px at 0% 0%,#19284a,transparent 70%)," +
            "radial-gradient(800px 700px at 100% 12%,#1b2c4f,transparent 70%)," +
            "radial-gradient(700px 600px at 100% 40%,#1a2a4d,transparent 70%)," +
            "radial-gradient(600px 700px at 100% 75%,#14203c,transparent 70%)," +
            "#121a2e",
        }}
      />

      <div className="relative z-10">
        <TopNav onHome={() => navigate("/")} />

        {/* ════════════════════════════════════════════════════════════
            HERO — immersive floating scene + glass games panel.
            Centre: tag, headline, search, paginated game tiles.
            Edges: floating props (clouds/islands/gems) that frame it.
        ════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          {/* Floating props — crisp, fully inside the hero (nothing cut off), only where there is free space beside the centred text */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0 flex justify-center">
            <style>{`
              @keyframes bgFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(var(--bf,-12px))}}
              .bgf{animation:bgFloat var(--bd,8s) ease-in-out infinite;animation-delay:var(--bl,0s);will-change:transform}
              @media (prefers-reduced-motion:reduce){.bgf{animation:none}}
            `}</style>
            <div className="relative w-full max-w-[1680px] h-full">
              {/* clouds — a dark shadow is overlaid ON each cloud (masked to its shape) so it blends into the navy */}
              <div className={`${P} bottom-[-52px] left-[-2vw]`} style={f("clamp(210px,20vw,330px)", "-12px", "11s")}>
                <img src={`${SC}cloud2.png`} alt="" className="w-full select-none" draggable={false} />
                <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(4,9,22,0) 40%,rgba(4,9,22,.55) 100%)", WebkitMaskImage: `url(${SC}cloud2.png)`, maskImage: `url(${SC}cloud2.png)`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />
              </div>
              <div className={`${P} bottom-[-52px] right-[-2vw]`} style={f("clamp(210px,20vw,330px)", "-12px", "11s", "-4s")}>
                <img src={`${SC}cloud4.png`} alt="" className="w-full select-none" draggable={false} style={{ transform: "scaleX(-1)" }} />
                <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(4,9,22,0) 40%,rgba(4,9,22,.55) 100%)", WebkitMaskImage: `url(${SC}cloud4.png)`, maskImage: `url(${SC}cloud4.png)`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />
              </div>
              <div className={`${P} top-[16px] left-[23vw]`} style={f("clamp(90px,8vw,130px)", "-9px", "9s", "-1s")}>
                <img src={`${SC}cloud1.png`} alt="" className="w-full select-none" draggable={false} />
                <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(4,9,22,0) 45%,rgba(4,9,22,.45) 100%)", WebkitMaskImage: `url(${SC}cloud1.png)`, maskImage: `url(${SC}cloud1.png)`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />
              </div>
              <div className={`${P} top-[16px] right-[23vw]`} style={f("clamp(90px,8vw,130px)", "-9px", "9s", "-5s")}>
                <img src={`${SC}cloud3.png`} alt="" className="w-full select-none" draggable={false} style={{ transform: "scaleX(-1)" }} />
                <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(4,9,22,0) 45%,rgba(4,9,22,.45) 100%)", WebkitMaskImage: `url(${SC}cloud3.png)`, maskImage: `url(${SC}cloud3.png)`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />
              </div>

              {/* islands — mirror pair, identical size + top */}
              <div className={`${P} top-[18px] left-[1vw]`} style={f("clamp(190px,18vw,300px)", "-15px", "8s")}>
                <img src={`${SC}island_new.png`} alt="" className="w-full select-none" draggable={false} style={{ filter: "drop-shadow(0 28px 34px rgba(0,0,0,.5))" }} />
              </div>
              <div className={`${P} top-[18px] right-[1vw]`} style={f("clamp(190px,18vw,300px)", "-15px", "8s", "-3s")}>
                <img src={`${SC}island_new.png`} alt="" className="w-full select-none" draggable={false} style={{ transform: "scaleX(-1)", filter: "drop-shadow(0 28px 34px rgba(0,0,0,.5))" }} />
              </div>

              {/* small props — lifted ABOVE the cloud line so nothing sits on the clouds */}
              <div className={`${P} bottom-[272px] right-[3.5vw]`} style={f("clamp(60px,6vw,92px)", "-14px", "5s", "-1s")}>
                <img src={`${SC}coin.png`} alt="" className="w-full select-none" draggable={false} style={{ transform: "rotate(-12deg)", filter: "drop-shadow(0 14px 18px rgba(0,0,0,.4))" }} />
              </div>
              <div className={`${P} bottom-[196px] left-[7vw]`} style={f("clamp(64px,6vw,100px)", "-16px", "5.5s")}>
                <img src={`${SC}gem_g.png`} alt="" className="w-full select-none" draggable={false} style={{ transform: "rotate(-10deg)", filter: "drop-shadow(0 14px 18px rgba(0,0,0,.4))" }} />
              </div>
              <div className={`${P} bottom-[196px] right-[7vw]`} style={f("clamp(64px,6vw,100px)", "-16px", "5.5s", "-2.5s")}>
                <img src={`${SC}gem_b.png`} alt="" className="w-full select-none" draggable={false} style={{ transform: "rotate(10deg)", filter: "drop-shadow(0 14px 18px rgba(0,0,0,.4))" }} />
              </div>
              <div className={`${P} bottom-[168px] left-[14vw]`} style={f("clamp(78px,7.5vw,120px)", "-13px", "7s", "-1.5s")}>
                <img src={`${SC}crate.png`} alt="" className="w-full select-none" draggable={false} style={{ transform: "rotate(6deg)", filter: "drop-shadow(0 14px 18px rgba(0,0,0,.4))" }} />
              </div>
              <div className={`${P} bottom-[168px] right-[14vw]`} style={f("clamp(78px,7.5vw,120px)", "-13px", "7s", "-4.5s")}>
                <img src={`${SC}gift.png`} alt="" className="w-full select-none" draggable={false} style={{ transform: "rotate(-6deg)", filter: "drop-shadow(0 14px 18px rgba(0,0,0,.4))" }} />
              </div>
            </div>
          </div>

          {/* Centred hero content */}
          <div className="relative z-10 max-w-[1096px] mx-auto px-4 sm:px-5 pt-16 sm:pt-24 pb-20 sm:pb-28 flex flex-col items-center text-center">
            <Reveal>
              <span
                className="inline-block px-6 py-[7px] rounded-full text-[12px] font-semibold"
                style={{ background: "#1f2f52", border: "1px solid #2c3d66", letterSpacing: ".14em", color: "#c9d3f0" }}
              >
                EXPLORE GAME WORLDS
              </span>
            </Reveal>

            <Reveal>
              <h1 className="font-mont text-[38px] leading-[1.08] sm:text-[52px] font-bold mt-5" style={{ color: C.text, letterSpacing: "-0.5px" }}>
                Browse our
              </h1>
            </Reveal>

            <Reveal delay={0.06}>
              <div
                className="inline-block mt-3 px-9 py-3.5 rounded-[14px] font-mont text-[30px] sm:text-[34px] font-bold text-white select-none"
                style={{
                  background: "linear-gradient(180deg,#1c8cff,#0a62e6)",
                  boxShadow: "0 7px 0 #0848a8, 0 12px 24px rgba(10,110,255,.35), 0 0 0 3px rgba(255,255,255,.9)",
                  transform: "rotate(-2.2deg)",
                }}
              >
                Games
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-3 text-[15px] max-w-[520px]" style={{ color: C.muted }}>
                Pick a game and get your items delivered straight to your account.
              </p>
            </Reveal>

            {/* Search — slim dark pill, filters the games below */}
            <Reveal delay={0.16} className="w-full max-w-[440px] mt-7">
              <div
                className="flex items-center gap-3 px-4 h-[48px] rounded-full mx-auto transition-shadow focus-within:ring-4 focus-within:ring-[#0a84ff]/25"
                style={{ background: "#1f2f52", border: "1px solid #2c3d66" }}
              >
                <Search size={17} color="#8ea0cf" className="flex-shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search a game"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: C.text }}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="flex-shrink-0" aria-label="Clear search">
                    <X size={15} color="#8ea0cf" />
                  </button>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            ALL GAMES — blue cards (homepage style), real games, search-filtered.
        ════════════════════════════════════════════════════════════ */}
        <section className="relative">
          <div className="max-w-[1096px] mx-auto px-4 sm:px-5 py-14">
            <Reveal>
              <h2 className="font-mont text-[26px] sm:text-[32px] font-bold text-center" style={{ color: C.text }}>
                All games
              </h2>
              <p className="text-center text-[13.5px] mt-2" style={{ color: C.muted }}>
                {loading ? "Loading the catalog…" : `${filtered.length} ${filtered.length === 1 ? "game" : "games"} available`}
              </p>
            </Reveal>

            <div className="mt-8">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-[18px] animate-pulse" style={{ background: "linear-gradient(180deg,#1c2e4f,#1a2848)", border: `1px solid ${C.border}`, aspectRatio: "1 / 1", animationDelay: `${i * 80}ms` }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-[18px] py-16 text-center" style={{ background: "linear-gradient(180deg,#1c2e4f,#1a2848)", border: `1px solid ${C.border}` }}>
                  <p className="text-[15px] font-semibold" style={{ color: C.text }}>
                    {search ? "No games match your search." : "No games available yet."}
                  </p>
                  <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>
                    {search ? "Try a different name." : "New catalogs are added regularly — check back soon."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((game, i) => (
                    <Reveal key={game._id} delay={Math.min(i, 6) * 0.05}>
                      <button
                        onClick={() => navigate(`/game/${game.slug}`)}
                        aria-label={`Browse ${game.name}`}
                        className="group relative w-full text-left rounded-[18px] overflow-hidden focus:outline-none transition-transform duration-300 hover:-translate-y-1.5"
                        style={{
                          background: "linear-gradient(180deg,#1c2e4f,#1a2848)",
                          border: `1px solid ${C.border}`,
                          aspectRatio: "1 / 1",
                        }}
                      >
                        <div className="relative w-full h-full overflow-hidden">
                          {game.imageUrl ? (
                            <img
                              src={game.imageUrl}
                              alt={game.name}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <span
                              className="absolute inset-0 flex items-center justify-center text-5xl font-mont font-bold text-white select-none"
                              style={{ background: game.gradient?.from || C.blue }}
                            >
                              {game.name.charAt(0)}
                            </span>
                          )}
                          {/* legibility scrim */}
                          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, transparent 35%, transparent 55%, rgba(0,0,0,.72) 100%)" }} />
                          <div className="absolute top-3.5 left-3.5 right-3.5">
                            <p className="text-[17px] font-mont font-bold leading-tight" style={{ color: "#fff" }}>{game.name}</p>
                            {game.productCount != null && (
                              <p className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,.75)" }}>
                                {game.productCount} items
                              </p>
                            )}
                          </div>
                          <div className="absolute bottom-3.5 left-3.5 right-3.5">
                            <div
                              className="py-2 rounded-[10px] text-[11px] font-bold text-center text-white transition-transform duration-300 group-hover:-translate-y-0.5"
                              style={{ background: "linear-gradient(90deg,#0a84ff,#0a50d6)", boxShadow: "0 4px 12px rgba(0,0,0,.3)" }}
                            >
                              Shop Now
                            </div>
                          </div>
                        </div>
                      </button>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            HOW IT WORKS — full layout: steps left, video + mascot right.
        ════════════════════════════════════════════════════════════ */}
        <section className="relative">
          <div className="max-w-[1096px] mx-auto px-4 sm:px-5 py-14 grid lg:grid-cols-[1fr_640px] gap-12 items-center">
            {/* Steps */}
            <div>
              <Reveal>
                <h2 className="font-mont text-[26px] sm:text-[31px] font-bold" style={{ color: C.text }}>
                  How does RBstars work?
                </h2>
                <p className="text-[13.5px] mt-2" style={{ color: C.muted }}>Three easy steps and your items are on their way.</p>
              </Reveal>
              <div className="relative mt-9 ml-[15px]">
                <div className="absolute left-[15px] top-2 bottom-2 w-px border-l border-dashed" style={{ borderColor: "#3a4a78" }} />
                {steps.map((s, i) => (
                  <Reveal key={s.n} delay={i * 0.1} className="relative pl-[45px] mb-8 last:mb-0">
                    <span
                      className="absolute left-0 top-[-4px] w-[30px] h-[30px] rounded-full grid place-items-center text-[13px] font-bold text-white"
                      style={{ background: "linear-gradient(180deg,#1c8cff,#0a62e6)", border: "2px solid #fff" }}
                    >
                      {s.n}
                    </span>
                    <div className="text-[16px] font-medium pt-1" style={{ color: C.text }}>{s.t}</div>
                    <div className="text-[13px] mt-1.5" style={{ color: C.muted }}>{s.d}</div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Video thumbnail + mascot */}
            <Reveal delay={0.15} className="flex items-end justify-center gap-5">
              <img
                src={`${A}IMG_1278.png`}
                alt=""
                aria-hidden
                className="hidden sm:block w-[180px] shrink-0 select-none"
              />
              <div
                className="relative w-full max-w-[430px] overflow-hidden"
                style={{
                  aspectRatio: "510 / 336",
                  border: "3px solid #1385ff",
                  borderRadius: 28,
                  boxShadow: "0 0 40px rgba(19,133,255,.3)",
                }}
              >
                <img
                  src={`${A}IMG_1282.jpg`}
                  alt="How RBstars delivery works"
                  className="absolute inset-[5px] w-[calc(100%-10px)] h-[calc(100%-10px)] object-cover"
                  style={{ borderRadius: 22 }}
                />
                <span className="absolute inset-[5px]" style={{ background: "rgba(0,0,0,.4)", borderRadius: 22 }} />
                <span className="absolute inset-0 grid place-items-center" aria-hidden>
                  <span
                    className="w-[64px] h-[64px] rounded-full grid place-items-center text-white"
                    style={{ background: "rgba(10,132,255,.92)", boxShadow: "0 8px 24px rgba(10,110,255,.5)" }}
                  >
                    <Play size={26} fill="#fff" />
                  </span>
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            REVIEWS — real reviews only, dark cards, auto-rotating.
        ════════════════════════════════════════════════════════════ */}
        {reviews.length > 0 && current && (
          <section className="relative">
            <div className="max-w-[1096px] mx-auto px-4 sm:px-5 py-14">
              <Reveal className="text-center">
                <h2 className="font-mont text-[26px] sm:text-[32px] font-bold" style={{ color: C.text }}>
                  Rated by <span style={{ color: C.greenBright }}>real players</span>
                </h2>
                <p className="text-[13.5px] mt-2" style={{ color: C.muted }}>Left after a delivery, on the order they bought.</p>
              </Reveal>

              <div className="mt-8 max-w-[640px] mx-auto">
                <motion.div
                  key={reviewIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[18px] p-6 sm:p-7"
                  style={{ background: "linear-gradient(180deg,#1c2e4f,#1a2848)", border: `1px solid ${C.border}` }}
                >
                  <div className="flex items-center gap-1 mb-4" role="img" aria-label={`${current.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <RBstar key={i} size={17} color={i < current.rating ? C.starOn : C.starOff} />
                    ))}
                  </div>
                  <p className="text-[15px] leading-relaxed mb-5" style={{ color: C.text }}>
                    &ldquo;{current.comment}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-full inline-flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ background: "linear-gradient(135deg,#2f3de0,#4a63ff)", color: "#fff" }}
                    >
                      {current.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: C.text }}>{current.name}</p>
                      <p className="text-[11px]" style={{ color: C.muted }}>
                        {current.submittedAt
                          ? new Date(current.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "Verified purchase"}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {reviews.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-5">
                    {reviews.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setReviewIndex(i)}
                        aria-label={`Review ${i + 1}`}
                        className="rounded-full transition-all duration-300"
                        style={{ width: i === reviewIndex ? 20 : 7, height: 7, background: i === reviewIndex ? C.blue : C.borderStrong }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <SiteFooter />
      </div>
    </main>
  );
}
