import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";

import {
  ShoppingCart, Star, Gamepad2, MessageCircle, Gift,
  Play, Youtube, Zap, Lock, Headphones, LayoutGrid,
  ChevronDown, ChevronLeft, ChevronRight
} from "lucide-react";
import GameSelectModal from "@/components/GameSelectModal";
import AnimatedGrid from "@/components/AnimatedGrid";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15 + 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardPop = {
  rest:  { y: 0,  scale: 1,     boxShadow: "0 2px 10px rgba(49,46,128,0.07)" },
  hover: { y: -4, scale: 1.012, boxShadow: "0 14px 36px rgba(49,46,128,0.16)", transition: { duration: 0.22, ease: "easeOut" } },
  tap:   { y: 1,  scale: 0.977, boxShadow: "0 2px 8px rgba(49,46,128,0.09)",  transition: { duration: 0.1 } },
};

const steps = [
  { icon: Gamepad2,      number: "01", title: "Choose your game",   description: "Select the game you want, browse the matching collection, and pick the item you need." },
  { icon: MessageCircle, number: "02", title: "Reach out",          description: "To receive your items, select the chat icon in the bottom-right corner and choose 'How To Claim Items.' Once you've responded to the prompt asking for your username and order number, please wait for claim times to open." },
  { icon: Gift,          number: "03", title: "Receive your items", description: "Upon receiving a response, our team will add you on Roblox to complete the trade or gift your purchased items." },
];

const FALLBACK_TUTORIALS = [
  { _id: "1", name: "Murder Mystery 2",        gradient: { from: "#6d28d9", to: "#4c1d95" }, title: "Murder Mystery 2", videoUrl: "", thumbnailUrl: "", active: true },
  { _id: "2", name: "Blade Ball",              gradient: { from: "#4c1d95", to: "#2e1065" }, title: "Blade Ball",       videoUrl: "", thumbnailUrl: "", active: true },
  { _id: "3", name: "Grow A Garden",           gradient: { from: "#16a34a", to: "#4ade80" }, title: "Grow A Garden",    videoUrl: "", thumbnailUrl: "", active: true },
  { _id: "4", name: "Steal A Brainrot",        gradient: { from: "#ea580c", to: "#f97316" }, title: "Steal A Brainrot", videoUrl: "", thumbnailUrl: "", active: true },
  { _id: "5", name: "Blox Fruits",             gradient: { from: "#d97706", to: "#fbbf24" }, title: "Blox Fruits",      videoUrl: "", thumbnailUrl: "", active: true },
  { _id: "6", name: "Garden Tower Defense",    gradient: { from: "#15803d", to: "#84cc16" }, title: "Garden Tower Defense", videoUrl: "", thumbnailUrl: "", active: true },
  { _id: "7", name: "99 Nights In The Forest", gradient: { from: "#1e3a5f", to: "#374151" }, title: "99 Nights In The Forest", videoUrl: "", thumbnailUrl: "", active: true },
  { _id: "8", name: "Dress To Impress",        gradient: { from: "#be185d", to: "#ec4899" }, title: "Dress To Impress", videoUrl: "", thumbnailUrl: "", active: true },
  { _id: "9", name: "Pet Simulator 99",        gradient: { from: "#ec4899", to: "#f43f5e" }, title: "Pet Simulator 99", videoUrl: "", thumbnailUrl: "", active: true },
];
type TutorialItem = { _id: string; name: string; title: string; gradient: { from: string; to: string }; videoUrl?: string; thumbnailUrl?: string; active: boolean };

const features = [
  { icon: Zap,        title: "Fast and Reliable",   desc: "Our Claim Support Team ensure your items are delivered almost instantly.",                                                                                                accent: "#312E80", iconBg: "rgba(49,46,128,0.1)"  },
  { icon: Lock,       title: "Secure Transactions", desc: "We use trusted payment systems to keep your data safe and secure.",                                                                                                          accent: "#4338CA", iconBg: "rgba(67,56,202,0.1)"  },
  { icon: Headphones, title: "Unmatched Support",   desc: "If you have any questions or encounter any issues, our friendly live chat support team is available around the clock to assist you.",                                         accent: "#312E80", iconBg: "rgba(49,46,128,0.1)"  },
  { icon: LayoutGrid, title: "Wide Variety",        desc: "From Jailbreak to Grow A Garden we have everything you need to enhance your gaming experience.",                                                                             accent: "#4338CA", iconBg: "rgba(67,56,202,0.1)"  },
];


const faqs = [
  { q: "Is RBstars a trusted place to buy game items?",      a: "Yes! RBstars is a trusted and secure platform with thousands of successful transactions. Our safe payment methods, instant delivery, and dedicated support team ensure a smooth and risk-free shopping experience." },
  { q: "What is your refund policy?",                         a: "We offer refunds on purchases where delivery was not completed. Please contact our support team within 24 hours of your purchase to initiate a refund request." },
  { q: "Can I get free items?",                               a: "RBstars occasionally runs promotions and giveaways on our social media channels. Join our discord for Free Gifts." },
  { q: "How do I receive my purchased items?",                a: "After purchasing, click the chat icon in the bottom-right corner and select 'How To Claim Items.' Provide your Roblox username and order number. Our team will then add you on Roblox to complete the trade." },
  { q: "Can I trade my in-game items for items on RBstars?", a: "Currently we do not accept in-game items as payment. All purchases must be made through our supported payment methods." },
  { q: "What if I don't receive my items after purchasing?",  a: "If you haven't received your items within the expected timeframe, contact our support team immediately via the chat widget. We monitor all orders and will resolve any delivery issues promptly." },
];

function ParticleField({ count = 22, light = false }: { count?: number; light?: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: 5 + (i * 4.3 + (i % 3) * 7.1) % 90,
      top:  3 + (i * 7.7 + (i % 5) * 11.3) % 94,
      size: 2 + (i % 4) * 0.9,
      dur:  6 + (i % 7) * 1.4,
      delay: -(i * 0.65),
      op: light ? 0.18 + (i % 4) * 0.08 : 0.12 + (i % 4) * 0.06,
    })), [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="rb-particle"
          style={{
            left: `${p.left}%`,
            top:  `${p.top}%`,
            width:  `${p.size}px`,
            height: `${p.size}px`,
            background: light
              ? `rgba(49,46,128,${p.op})`
              : `rgba(165,180,252,${p.op})`,
            animationDuration: `${p.dur}s`,
            animationDelay:    `${p.delay}s`,
            ["--p-op" as string]: p.op,
          }}
        />
      ))}
    </div>
  );
}

function GlareCard({ children, className, style, delayClass = "" }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delayClass?: string;
}) {
  return (
    <motion.div
      initial="rest" whileHover="hover" whileTap="tap" variants={cardPop}
      className={`relative overflow-hidden cursor-pointer ${className ?? ""}`}
      style={style}
    >
      {children}
      <div className={`rb-glare-indigo ${delayClass}`} />
    </motion.div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial="rest" whileHover="hover" whileTap="tap" variants={cardPop}
      className="rounded-2xl overflow-hidden cursor-pointer bg-white"
      style={{ border: "1.5px solid rgba(49,46,128,0.1)" }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        style={{ background: open ? "rgba(49,46,128,0.06)" : "transparent" }}
      >
        <span className="font-semibold text-sm leading-snug" style={{ color: "#1E1B4B" }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex-shrink-0">
          <ChevronDown size={18} color="#312E80" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="c"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-5 pt-1 pb-4 text-sm leading-relaxed" style={{ color: "#5B5EA8" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const fallbackReviews = [
  { initials: "D", name: "Dawn Hughes", country: "United States", days: "76 days ago", stars: 5, text: "Cheap: the prices were much cheaper than other adopt me stores. Easy: it's idiot proof, all you do is join and it gives you your items instantly. Good service: every time I had an issue they responded really quickly." },
  { initials: "M", name: "Max Rivera",  country: "United Kingdom", days: "14 days ago", stars: 5, text: "Super fast delivery! Got my Blade Ball items within minutes. The support team was also really helpful when I had questions about my order." },
  { initials: "S", name: "Sara K",      country: "Canada",         days: "31 days ago", stars: 5, text: "Best place to buy Roblox items hands down. Trusted sellers, fair prices, and the whole process was smooth from start to finish." },
];
const avatarColors = ["#ea580c", "#16a34a", "#2563eb"];

export default function Home() {
  const [shopOpen, setShopOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviews, setReviews] = useState(fallbackReviews);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [tutorials, setTutorials] = useState<TutorialItem[]>(FALLBACK_TUTORIALS);

  useEffect(() => {
    fetch(`${BACKEND}/api/panel/tutorials`)
      .then(r => r.json())
      .then(data => {
        const fetched: TutorialItem[] = (data?.data?.tutorials || []).filter((t: TutorialItem) => t.active);
        if (fetched.length > 0) setTutorials(fetched);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${BACKEND}/api/claims/public-reviews?limit=20`)
      .then(r => r.json())
      .then(data => {
        if (data?.data?.reviews?.length >= 3) {
          const mapped = data.data.reviews.map((r: { name: string; rating: number; comment: string; submittedAt: string }) => ({
            initials: r.name.charAt(0).toUpperCase(),
            name: r.name,
            country: "Verified",
            days: r.submittedAt ? `${Math.floor((Date.now() - new Date(r.submittedAt).getTime()) / 86400000)} days ago` : "Recently",
            stars: r.rating,
            text: r.comment,
          }));
          setReviews(mapped);
        }
        if (data?.data?.averageRating) setAvgRating(data.data.averageRating);
      })
      .catch(() => {});
  }, []);

  const howRef = useRef<HTMLElement>(null);
  const { scrollYProgress: howProg } = useScroll({
    target: howRef,
    offset: ["start 0.85", "end 0.5"],
  });
  const rawLineH = useTransform(howProg, [0, 1], ["0%", "100%"]);
  const lineH = useSpring(rawLineH, { stiffness: 90, damping: 26 });

  return (
    <main>

      {}
      <section className="relative min-h-screen flex flex-col overflow-hidden line-grid-dark">
        <div className="absolute inset-0">
          <AnimatedGrid />
        </div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(10,8,40,.55) 0%,rgba(15,12,50,.60) 50%,rgba(10,8,40,.75) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%,rgba(49,46,128,.22) 0%,transparent 70%)" }} />
        <ParticleField count={28} light={false} />

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-4 pt-24 pb-16">

          {}
          <motion.div
            custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 overflow-hidden"
            style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(165,180,252,.4)", backdropFilter: "blur(10px)" }}
          >
            <div className="rb-glare rb-glare-d1" />
            <div className="flex items-center gap-0.5 relative z-10">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <span className="text-white text-sm font-bold relative z-10">2k+</span>
            <span className="text-[#A5B4FC] text-sm relative z-10">Happy Customers</span>
          </motion.div>

          <motion.h1
            custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl mx-auto"
            style={{ letterSpacing: "-0.02em" }}
          >
            Instantly buy your favourite{" "}
            <span style={{ background: "linear-gradient(135deg,#A5B4FC 0%,#6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Roblox Game Item
            </span>{" "}
            from the most trusted dealers!
          </motion.h1>

          <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp} className="mt-10">
            <motion.button
              data-testid="button-shop-now"
              onClick={() => setShopOpen(true)}
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.07, boxShadow: "0 0 40px rgba(49,46,128,0.7), 0 0 80px rgba(49,46,128,0.3)", transition: { duration: 0.25, ease: "easeOut" } }}
              whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-white text-lg font-bold shadow-xl"
              style={{ background: "linear-gradient(135deg,#312E80 0%,#1E1B4B 100%)" }}
            >
              <ShoppingCart size={22} /> Shop Now
            </motion.button>
          </motion.div>

        </div>
      </section>

      {}
      <section
        ref={howRef}
        className="relative py-20 px-4 overflow-hidden dot-grid"
        style={{ backgroundColor: "#F7FAFF" }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(49,46,128,.06) 0%,transparent 70%)", transform: "translate(30%,-30%)" }} />
        <ParticleField count={14} light={true} />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5" style={{ background: "rgba(49,46,128,.08)", border: "1px solid rgba(49,46,128,.15)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#312E80" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#312E80" }}>Simple Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "#1E1B4B", letterSpacing: "-0.02em" }}>How RBstars Works?</h2>
            <p className="text-base leading-relaxed max-w-md mx-auto" style={{ color: "#5B5EA8" }}>Getting your favourite Roblox items is simple, fast, and reliable. Here's how:</p>
          </div>

          {/* Steps with animated rail attached to card left edge */}
          <div className="relative flex flex-col gap-4">
            {/* Rail track — spans full height of the steps stack, flush to card left */}
            <div
              className="absolute pointer-events-none"
              style={{ left: 0, top: 0, bottom: 0, width: 5, background: "rgba(49,46,128,0.13)", zIndex: 3, borderRadius: 9999 }}
            />
            {/* Animated fill */}
            <div
              className="absolute pointer-events-none overflow-hidden"
              style={{ left: 0, top: 0, bottom: 0, width: 5, zIndex: 4, borderRadius: 9999 }}
            >
              <motion.div
                style={{
                  height: lineH,
                  width: "100%",
                  background: "linear-gradient(180deg,#312E80 0%,#6366F1 100%)",
                }}
              />
            </div>

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    initial="rest" whileHover="hover" whileTap="tap" variants={cardPop}
                    data-testid={`card-step-${i + 1}`}
                    className="relative flex items-start gap-5 p-6 rounded-2xl bg-white cursor-pointer"
                    style={{ border: "1.5px solid rgba(49,46,128,0.1)" }}
                  >
                    <span className="absolute top-4 right-5 text-xs font-bold" style={{ color: "rgba(49,46,128,0.3)" }}>{step.number}</span>
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ background: "#1E1B4B" }}>
                      <Icon size={22} color="#A5B4FC" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1.5" style={{ color: "#1E1B4B" }}>{step.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#5B5EA8" }}>{step.description}</p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ TUTORIALS ══ */}
      <section
        className="relative py-20 px-4 overflow-hidden"
        style={{ background: "#EEF2FF" }}
      >
        <div className="absolute inset-0 pointer-events-none dot-grid" style={{ opacity: 0.6 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%,rgba(49,46,128,.1) 0%,transparent 60%)" }} />
        <ParticleField count={16} light={true} />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5" style={{ background: "rgba(49,46,128,.1)", border: "1px solid rgba(49,46,128,.2)" }}>
              <Youtube size={13} color="#312E80" />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#312E80" }}>Video Guides</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "#1E1B4B", letterSpacing: "-0.02em" }}>Game Tutorials</h2>
            <p className="text-base max-w-md mx-auto" style={{ color: "#5B5EA8" }}>Watch step-by-step guides for claiming your items in each game.</p>
          </div>

          {/* 1 col mobile / 2 col sm / 3 col lg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tutorials.map((tut, i) => {
              const col = i % 3;
              const gradFrom = tut.gradient?.from || "#6d28d9";
              const gradTo = tut.gradient?.to || "#4c1d95";
              const hasVideo = !!tut.videoUrl;
              return (
              <motion.div
                key={tut._id}
                initial={{ opacity: 0, x: col === 0 ? -24 : col === 2 ? 24 : 0, y: col === 1 ? 20 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3.2 + i * 0.35, ease: "easeInOut", delay: i * 0.18 }}
              >
              <motion.div
                data-testid={`card-tutorial-${i + 1}`}
                initial="rest" whileHover="hover" whileTap="tap" variants={cardPop}
                className="flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-white"
                style={{ border: "1.5px solid rgba(49,46,128,0.1)" }}
                onClick={() => { if (tut.videoUrl) window.open(tut.videoUrl, "_blank"); }}
              >
                <div className="relative w-full overflow-hidden" style={{ paddingTop: "56.25%" }}>
                  {tut.thumbnailUrl ? (
                    <img src={tut.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover" alt={tut.title} />
                  ) : (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                      style={{ background: `linear-gradient(135deg,${gradFrom} 0%,${gradTo} 100%)` }}
                    >
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
                      <div
                        className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,.18)", backdropFilter: "blur(6px)", border: "2px solid rgba(255,255,255,.3)" }}
                      >
                        <Play size={20} fill="white" color="white" className="ml-0.5" />
                      </div>
                      <div
                        className="relative z-10 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: "rgba(0,0,0,.5)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,.2)" }}
                      >
                        {hasVideo ? "Watch tutorial" : "Tutorial soon"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm leading-tight" style={{ color: "#1E1B4B" }}>{tut.title || tut.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "#5B5EA8" }}>{tut.description || "Watch tutorial"}</p>
                  </div>
                  <motion.button
                    data-testid={`button-tutorial-${i + 1}`}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold text-white"
                    style={{ background: "#1E1B4B" }}
                  >
                    View
                  </motion.button>
                </div>
              </motion.div>
              </motion.div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ WHY CHOOSE ══ */}
      <section
        className="relative py-20 px-4 overflow-hidden dot-grid"
        style={{ backgroundColor: "#F7FAFF" }}
      >
        <ParticleField count={20} light={true} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 80% 50%,rgba(49,46,128,.06) 0%,transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 20% 50%,rgba(67,56,202,.05) 0%,transparent 60%)" }} />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: "rgba(49,46,128,.08)", border: "1px solid rgba(49,46,128,.15)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#312E80" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#312E80" }}>Why Us</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "#1E1B4B", letterSpacing: "-0.02em" }}>Why Choose RBstars?</h2>
          </div>
          <div className="flex flex-col gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              const delayClasses = ["rb-glare-d1", "rb-glare-d2", "rb-glare-d3", "rb-glare-d4"];
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.58, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <GlareCard
                    delayClass={delayClasses[i % delayClasses.length]}
                    className="p-6 rounded-2xl bg-white"
                    style={{ border: "1.5px solid rgba(49,46,128,0.1)" }}
                  >
                    <div data-testid={`card-feature-${i + 1}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.iconBg }}>
                        <Icon size={20} color={f.accent} strokeWidth={2} />
                      </div>
                      <h3 className="font-bold text-base mb-2" style={{ color: "#1E1B4B" }}>{f.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#5B5EA8" }}>{f.desc}</p>
                    </div>
                  </GlareCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section
        className="relative py-20 px-4 overflow-hidden dot-grid"
        style={{ backgroundColor: "#EEF2FF" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(49,46,128,.3),transparent)" }} />
        <ParticleField count={12} light={true} />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="mb-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-5" style={{ background: "rgba(49,46,128,.1)", color: "#312E80", border: "1px solid rgba(49,46,128,.2)" }}>
              Customer Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "#1E1B4B", letterSpacing: "-0.02em" }}>
              Trusted by{" "}
              <span style={{ background: "linear-gradient(135deg,#312E80,#6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                2000+
              </span>{" "}
              Happy Customers
            </h2>
          </div>

          <div className="p-5 rounded-2xl mb-4 bg-white" style={{ border: "1.5px solid rgba(49,46,128,0.1)" }}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-extrabold text-lg" style={{ color: "#312E80" }}>
                Excellent {avgRating !== null ? avgRating.toFixed(1) : "4.7"}
              </span>
              <span className="text-sm" style={{ color: "#5B5EA8" }}>out of 5.0</span>
            </div>
            <div className="flex items-center gap-0.5 mb-1">
              {[...Array(4)].map((_, i) => <Star key={i} size={16} fill="#312E80" color="#312E80" />)}
              <Star size={16} fill="none" color="#312E80" strokeWidth={2} />
            </div>
            <p className="text-xs mb-3" style={{ color: "#5B5EA8" }}>Based on 1300+ reviews</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(49,46,128,.08)", border: "1px solid rgba(49,46,128,.2)" }}>
              <Star size={11} fill="#312E80" color="#312E80" />
              <span className="text-xs font-semibold" style={{ color: "#312E80" }}>Verified Reviews</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewIndex}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="p-5 rounded-2xl mb-4 bg-white"
              style={{ border: "1.5px solid rgba(49,46,128,0.1)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: avatarColors[reviewIndex] }}>
                    {reviews[reviewIndex].initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#1E1B4B" }}>{reviews[reviewIndex].name}</p>
                    <p className="text-xs" style={{ color: "#5B5EA8" }}>{reviews[reviewIndex].country}</p>
                  </div>
                </div>
                <span className="text-xs" style={{ color: "#94A3B8" }}>{reviews[reviewIndex].days}</span>
              </div>
              <div className="flex items-center gap-0.5 mb-2">
                {[...Array(reviews[reviewIndex].stars)].map((_, i) => <Star key={i} size={13} fill="#312E80" color="#312E80" />)}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#3730A3" }}>{reviews[reviewIndex].text}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2 mb-6">
            <motion.button
              data-testid="button-prev-review" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setReviewIndex(p => (p - 1 + reviews.length) % reviews.length)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white"
              style={{ border: "1.5px solid rgba(49,46,128,0.2)" }}
            >
              <ChevronLeft size={16} color="#312E80" />
            </motion.button>
            <motion.button
              data-testid="button-next-review" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setReviewIndex(p => (p + 1) % reviews.length)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white"
              style={{ border: "1.5px solid rgba(49,46,128,0.2)" }}
            >
              <ChevronRight size={16} color="#312E80" />
            </motion.button>
            <div className="flex items-center gap-1.5 ml-2">
              {reviews.map((_, i) => (
                <button key={i} onClick={() => setReviewIndex(i)}
                  className="rounded-full transition-all duration-200"
                  style={{ width: i === reviewIndex ? 20 : 7, height: 7, background: i === reviewIndex ? "#312E80" : "rgba(49,46,128,0.2)" }}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section
        className="relative py-20 px-4 overflow-hidden dot-grid"
        style={{ backgroundColor: "#F7FAFF" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(49,46,128,.25),transparent)" }} />
        <ParticleField count={10} light={true} />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ color: "#1E1B4B", letterSpacing: "-0.02em" }}>
              Frequently Asked{" "}
              <span style={{ textDecoration: "underline", textDecorationColor: "#312E80", textUnderlineOffset: "6px" }}>Questions</span>
            </h2>
            <p style={{ color: "#5B5EA8" }}>Got Questions? We've Got Answers!</p>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      <GameSelectModal open={shopOpen} onClose={() => setShopOpen(false)} />
    </main>
  );
}
