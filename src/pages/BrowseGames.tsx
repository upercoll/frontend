import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Headphones } from "lucide-react";
import { useLocation } from "wouter";
import {
  IconCart, IconCreditCard, IconRocket,
  IconSearch, IconClose, IconStar,
} from "@/components/SiteIcons";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

type ShopGame = {
  _id: string; name: string; slug: string;
  gradient: { from: string; to: string };
  imageUrl?: string; bgImageUrl?: string; active?: boolean; productCount?: number;
};

const FALLBACK_GAMES: ShopGame[] = [
  { _id: "1", name: "Murder Mystery 2",         slug: "murder-mystery-2",         gradient: { from: "#1C2A34", to: "#22333F" } },
  { _id: "2", name: "Blade Ball",               slug: "blade-ball",               gradient: { from: "#22333F", to: "#2C414E" } },
  { _id: "3", name: "Grow A Garden 2",          slug: "grow-a-garden-2",          gradient: { from: "#15803D", to: "#22C55E" } },
  { _id: "4", name: "Steal A Brainrot",         slug: "steal-a-brainrot",         gradient: { from: "#EA580C", to: "#F97316" } },
  { _id: "5", name: "Blox Fruits",              slug: "blox-fruits",              gradient: { from: "#D97706", to: "#FBBF24" } },
  { _id: "6", name: "Garden Tower Defense",     slug: "garden-tower-defense",     gradient: { from: "#15803D", to: "#84CC16" } },
  { _id: "7", name: "99 Nights In The Forest",  slug: "99-nights-in-the-forest",  gradient: { from: "#1E3A5F", to: "#374151" } },
  { _id: "8", name: "Dress To Impress",         slug: "dress-to-impress",         gradient: { from: "#BE185D", to: "#EC4899" } },
  { _id: "9", name: "Pet Simulator 99",         slug: "pet-simulator-99",         gradient: { from: "#EC4899", to: "#F43F5E" } },
];

const steps = [
  { icon: IconCart, number: "01", title: "Choose your items", description: "Select the game you want, browse the matching collection, and pick the item you need.", image: "/step-choose.png" },
  { icon: IconCreditCard, number: "02", title: "Secure Checkout", description: "Complete your purchase through our secure checkout — we accept all major cards and PayPal with 256-bit SSL encryption.", image: "/step-checkout.png" },
  { icon: IconRocket, number: "03", title: "Fast Delivery", description: "Our team delivers your items in minutes — just provide your Roblox username after checkout and we'll trade or gift them to you instantly.", image: "/step-delivery.png" },
];

const fallbackReviews = [
  { initials: "D", name: "Dawn Hughes", country: "United States", stars: 5, text: "Cheap: the prices were much cheaper than other adopt me stores. Easy: it's idiot proof, all you do is join and it gives you your items instantly. Good service: every time I had an issue they responded really quickly." },
  { initials: "M", name: "Max Rivera", country: "United Kingdom", stars: 5, text: "Super fast delivery! Got my items within minutes. The support team was also really helpful when I had questions about my order." },
  { initials: "S", name: "Sara K", country: "Canada", stars: 5, text: "Best place to buy Roblox items hands down. Trusted sellers, fair prices, and the whole process was smooth from start to finish." },
];
const avatarColors = ["#EA580C", "#15803D", "#2563EB"];

export default function BrowseGames() {
  const [, navigate] = useLocation();
  const [games, setGames] = useState<ShopGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviews] = useState(fallbackReviews);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/api/games?active=true`)
      .then(r => r.json())
      .then(d => {
        const fetched = d.data?.games || [];
        setGames(fetched.length > 0 ? fetched : FALLBACK_GAMES);
      })
      .catch(() => setGames(FALLBACK_GAMES))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setReviewIndex(i => (i + 1) % reviews.length), 3500);
    return () => clearInterval(t);
  }, [reviews.length]);

  const filtered = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter(g => g.name.toLowerCase().includes(q));
  }, [games, search]);

  return (
    <main style={{ background: "#131C23", minHeight: "100vh" }}>

      {/* ═══ HERO + GAMES (one continuous section) ═══ */}
      <section className="relative overflow-hidden">

        {/* Radial glow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(59,167,255,0.15) 0%, rgba(59,167,255,0.05) 40%, transparent 70%)" }} />

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 pt-24 sm:pt-32 lg:pt-40 pb-8 max-w-5xl mx-auto text-center">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[32px] sm:text-[42px] lg:text-[50px] font-extrabold leading-[1.05] tracking-tight"
            style={{ color: "#F4F8FB" }}
          >
            BROWSE OUR <span style={{ color: "#3BA7FF" }}>GAMES</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-4 text-sm sm:text-base lg:text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: "#9BAEBB" }}
          >
            Items, boosts and services across every catalog we carry.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative max-w-[640px] mx-auto mt-10"
          >
            <div className="flex items-center gap-3 px-5 h-[52px] rounded-xl"
              style={{ background: "#1C2A34", border: "1px solid #2C414E" }}>
              <IconSearch size={18} color="#637784" className="flex-shrink-0 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search game"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "#F4F8FB" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="flex-shrink-0">
                  <IconClose size={14} color="#637784" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-center gap-8 sm:gap-12 mt-10 flex-wrap"
          >
            {[
              { icon: <Shield size={16} color="white" />, title: "100%", sub: "Secure" },
              { icon: <Zap size={16} color="white" />, title: "Instant", sub: "Delivery" },
              { icon: <Headphones size={16} color="white" />, title: "24/7", sub: "Support" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#3BA7FF", boxShadow: "0 4px 14px rgba(59,167,255,0.3)" }}>
                  {b.icon}
                </div>
                <div>
                  <b className="block text-sm font-bold" style={{ color: "#F4F8FB" }}>{b.title}</b>
                  <span className="block text-xs" style={{ color: "#9BAEBB" }}>{b.sub}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ═══ GAMES GRID (same section, no separator) ═══ */}
        <div className="relative z-10 px-6 sm:px-10 lg:px-16 pt-4 pb-20 max-w-6xl mx-auto">

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl animate-pulse"
                  style={{ background: "#1C2A34", border: "1px solid #2C414E" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-bold" style={{ color: "#F4F8FB" }}>No games found</p>
              <p className="text-sm mt-1" style={{ color: "#9BAEBB" }}>Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {filtered.map((game, i) => (
                <motion.div
                  key={game._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: 0.03 + i * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.35)" }}
                  onClick={() => navigate("/game/" + game.slug)}
                  className="relative rounded-2xl overflow-hidden group cursor-pointer"
                  style={{ background: "#1C2A34", border: "1px solid #2C414E", aspectRatio: "1 / 1" }}
                >
                  <div className="relative w-full h-full overflow-hidden">
                    {game.imageUrl ? (
                      <img src={game.imageUrl} alt={game.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                        style={{ background: game.gradient?.from || "#3BA7FF" }} />
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.65) 100%)" }} />
                    {/* Game name */}
                    <div className="absolute top-4 left-4 right-4">
                      <p className="text-lg font-black leading-tight drop-shadow-lg" style={{ color: "white" }}>{game.name}</p>
                      {game.productCount != null && (
                        <p className="text-xs font-bold mt-1 drop-shadow-md" style={{ color: "rgba(255,255,255,0.7)" }}>{game.productCount} items</p>
                      )}
                    </div>
                    {/* Shop Now */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="py-2.5 rounded-xl text-xs font-extrabold text-center text-white transition-all duration-300"
                        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                        Shop Now
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative py-20 overflow-hidden" style={{ background: "#131C23" }}>
        <div className="relative z-10 px-6 sm:px-10 lg:px-16 max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: "#F4F8FB", letterSpacing: "-0.025em" }}>
              How It <span style={{ color: "#3BA7FF" }}>Works</span>
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#9BAEBB" }}>Three easy steps and your items are on their way.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.05 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-2xl overflow-hidden group"
                style={{ background: "#1C2A34", border: "1px solid #2C414E" }}
              >
                {(step as { image?: string }).image ? (
                  <div className="relative w-full overflow-hidden flex items-center justify-center p-5">
                    <img src={(step as { image: string }).image} alt={step.title} className="w-full h-auto max-h-48 object-contain" />
                  </div>
                ) : (
                  <div className="relative p-6">
                    <span className="absolute top-4 right-5 text-[64px] font-black leading-none select-none pointer-events-none"
                      style={{ color: "rgba(59,167,255,0.06)" }}>{step.number}</span>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "#3BA7FF", boxShadow: "0 4px 14px rgba(59,167,255,0.27)" }}>
                      <step.icon size={20} color="white" />
                    </div>
                  </div>
                )}
                <div className="p-6 pt-0">
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#3BA7FF" }}>{step.number}</span>
                  <h3 className="font-display font-bold text-lg mt-1 mb-2" style={{ color: "#F4F8FB" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#9BAEBB" }}>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section className="relative py-20 overflow-hidden" style={{ background: "#131C23" }}>
        <div className="relative z-10 px-6 sm:px-10 lg:px-16 max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: "#F4F8FB", letterSpacing: "-0.025em" }}>
              Trusted By <span style={{ color: "#3BA7FF" }}>2,000+</span> Customers
            </h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center gap-8 sm:gap-10"
          >
            {/* Mascot */}
            <div className="flex-shrink-0 flex flex-col items-center text-center">
              <div className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
                <img src="/review-mascot.png" alt="" className="w-full h-full object-contain" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-extrabold mt-3" style={{ color: "#F4F8FB", letterSpacing: "-0.02em" }}>
                Real Players, <span style={{ color: "#3BA7FF" }}>Real Reviews</span>
              </h3>
              <p className="text-xs mt-1.5 max-w-[200px]" style={{ color: "#9BAEBB" }}>
                Thousands of happy customers trust RBstars.
              </p>
            </div>

            {/* Rotating review */}
            <div className="flex-1 w-full">
              <motion.div
                key={reviewIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl p-6"
                style={{ background: "#18242D", border: "1px solid #2C414E" }}
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(reviews[reviewIndex]?.stars ?? 5)].map((_, i) => <IconStar key={i} size={14} color="#FBBF24" />)}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#F4F8FB" }}>
                  &ldquo;{reviews[reviewIndex]?.text}&rdquo;
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: avatarColors[reviewIndex % avatarColors.length] }}>
                    {reviews[reviewIndex]?.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#F4F8FB" }}>{reviews[reviewIndex]?.name}</p>
                    <p className="text-xs" style={{ color: "#9BAEBB" }}>{reviews[reviewIndex]?.country}</p>
                  </div>
                </div>
              </motion.div>
              {/* Dots */}
              <div className="flex items-center gap-1.5 mt-4">
                {reviews.map((_, i) => (
                  <button key={i} onClick={() => setReviewIndex(i)}
                    className="rounded-full transition-all duration-300"
                    style={{ width: i === reviewIndex ? 20 : 7, height: 7, background: i === reviewIndex ? "#3BA7FF" : "#2C414E" }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
