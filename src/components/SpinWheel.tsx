import { motion, useReducedMotion } from "framer-motion";
import { P } from "@/lib/storefront";

export type SpinPrize = { label: string; color: string };

const C = 130;
const R_OUT = 100;
const R_LAB = 66;

/* Wedge fills are normalised to the storefront palette — flat, no gradients.
   Incoming prize colours come from the page; anything unmapped passes through.
   BOTH the legacy (light-theme) and current prize hexes are listed as keys, so
   prizes persisted before the dark theme keep normalising correctly. */
const WEDGE: Record<string, string> = {
  "#3BA7FF": P.accent,
  "#2F8CFF": P.accent,
  "#5CB8FF": P.accent,
  "#4DA3FF": P.accent,
  "#1B7FE3": P.accentDeep,
  "#0A84FF": P.accentDeep,
  "#22C55E": "#2ED3A0",
  "#2ED3A0": "#2ED3A0",
  "#0F9B62": "#2ED3A0",
  "#5FE08E": "#2ED3A0",
  "#FFC53D": P.star,
  "#FFB020": P.star,
  "#EF4444": P.bad,
  "#DC2626": P.bad,
  "#FF5A4D": P.bad,
  "#F87171": P.bad,
  "#FF6B6B": P.bad,
  // Violet sits one step darker than the brand-violet it replaces: white on
  // #7C5CFF measured 4.35:1 (just under AA), white on #6844D6 measures 6.2:1.
  // It stays clearly a different hue from the blue wedge beside it.
  "#A855F7": "#6844D6",
  "#7C5CFF": "#6844D6",
};

function wedgeFill(color: string) {
  return WEDGE[color.toUpperCase()] ?? color;
}

function relLum(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return 1;
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(a: number, b: number) {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

/* White label on dark wedges, P.text on light ones — picked by measured contrast
   so every prize label passes against ITS OWN wedge. */
function labelInk(bg: string) {
  return ratio(relLum(bg), 1) >= ratio(relLum(bg), relLum(P.text)) ? "#FFFFFF" : P.text;
}

function pt(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

function wedge(a0: number, a1: number) {
  const p0 = pt(R_OUT, a0);
  const p1 = pt(R_OUT, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${C},${C}L${p0.x.toFixed(2)},${p0.y.toFixed(2)}A${R_OUT},${R_OUT} 0 ${large} 1 ${p1.x.toFixed(2)},${p1.y.toFixed(2)}Z`;
}

function starPath(cx: number, cy: number, r: number) {
  const i = r * 0.32;
  return [
    `M${cx},${cy - r}`,
    `Q${cx + i},${cy - i} ${cx + r},${cy}`,
    `Q${cx + i},${cy + i} ${cx},${cy + r}`,
    `Q${cx - i},${cy + i} ${cx - r},${cy}`,
    `Q${cx - i},${cy - i} ${cx},${cy - r}`,
    "Z",
  ].join(" ");
}

const SPARKS = [
  { x: 30, y: 58, r: 12, fill: P.star, delay: 0 },
  { x: 244, y: 92, r: 9, fill: P.accent, delay: 0.6 },
  { x: 26, y: 198, r: 8, fill: P.accent, delay: 1.2 },
  { x: 236, y: 204, r: 12, fill: P.star, delay: 0.9 },
];

export default function SpinWheel({
  prizes,
  angle,
  spinning,
  locked,
  size = 260,
  highlight = null,
  onSettle,
}: {
  prizes: SpinPrize[];
  angle: number;
  spinning: boolean;
  locked: boolean;
  size?: number;
  highlight?: number | null;
  onSettle?: () => void;
}) {
  const reduced = useReducedMotion();
  const step = 360 / prizes.length;
  const n = prizes.length;

  return (
    <div
      className="rounded-2xl"
      style={{
        background: P.card,
        border: `1px solid ${P.border}`,
        boxShadow: P.shadow,
        padding: 18,
        /* `size` is the DESKTOP target, not a hard floor. The old fixed
           `width: size + 36` overflowed any viewport under ~344px because the
           inner box stayed a literal 260px no matter how narrow the card
           got — `min()` lets the card shrink and the wheel scale with it. */
        width: `min(${size + 36}px, 100%)`,
        boxSizing: "border-box",
      }}
    >
      {/* Fluid square: the SVG keeps its viewBox, so every coordinate
          (bolts, wedges, hub, rotation origin) scales with the box. */}
      <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
        {/* flat circle bed — the wheel sits in it instead of floating on a glow */}
        <div
          aria-hidden="true"
          className="absolute"
          style={{
            inset: -14,
            background: P.band,
            border: `2px solid ${P.border}`,
            borderRadius: "50%",
          }}
        />
        <svg viewBox="0 0 260 260" style={{ display: "block", overflow: "visible", position: "relative", width: "100%", height: "auto" }}>
      {/* floating sparkles */}
      {SPARKS.map((s, i) => (
        <motion.path
          key={i}
          d={starPath(s.x, s.y, s.r)}
          fill={s.fill}
          stroke={P.text}
          strokeWidth={2.5}
          strokeLinejoin="round"
          animate={{ opacity: reduced ? 0.8 : [0.3, 1, 0.3] }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 2.6, repeat: Infinity, delay: s.delay, ease: "easeInOut" }
          }
        />
      ))}

      <g style={locked ? { filter: "grayscale(0.9)", opacity: 0.55 } : undefined}>
        {/* outer ring + bolts */}
        <circle cx={C} cy={C} r={118} fill={P.card} stroke={P.text} strokeWidth={5} />
        <circle cx={C} cy={C} r={107} fill={P.band} stroke={P.text} strokeWidth={3} />
        {Array.from({ length: n }).map((_, i) => {
          const p = pt(112.5, i * step);
          return (
            <circle key={i} cx={p.x} cy={p.y} r={5.5} fill={P.borderStrong} stroke={P.text} strokeWidth={2.5} />
          );
        })}

        {/* rotating face */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${C}px ${C}px`,
            transformBox: "view-box",
            transition: spinning ? "transform 5.6s cubic-bezier(0.12, 0.78, 0.14, 1)" : "none",
          }}
          onTransitionEnd={onSettle}
        >
          <circle cx={C} cy={C} r={R_OUT} fill={P.text} />
          {prizes.map((prize, i) => {
            const fill = wedgeFill(prize.color);
            return (
              <path
                key={i}
                d={wedge(i * step, (i + 1) * step)}
                fill={fill}
                stroke={P.text}
                strokeWidth={3.5}
                strokeLinejoin="round"
              />
            );
          })}
          {prizes.map((prize, i) => {
            const mid = i * step + step / 2;
            const p = pt(R_LAB, mid);
            let rot = mid - 90;
            while (rot > 90) rot -= 180;
            while (rot < -90) rot += 180;
            const words = prize.label.split(" ");
            const twoLine = words.length > 1;
            const ink = labelInk(wedgeFill(prize.color));
            return (
              <text
                key={i}
                x={p.x}
                y={p.y}
                transform={`rotate(${rot} ${p.x} ${p.y})`}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-display"
                fontSize={12}
                fontWeight={800}
                fill={ink}
                stroke={P.text}
                strokeWidth={3.5}
                style={{ paintOrder: "stroke", pointerEvents: "none" }}
              >
                <tspan x={p.x} dy={twoLine ? "-0.48em" : undefined}>
                  {twoLine ? words[0] : prize.label}
                </tspan>
                {twoLine && <tspan x={p.x} dy="0.96em">{words.slice(1).join(" ")}</tspan>}
              </text>
            );
          })}

          {/* gold mark on the wedge we landed on */}
          {highlight != null && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45 }}
              style={{ pointerEvents: "none" }}
            >
              <path d={wedge(highlight * step, (highlight + 1) * step)} fill={P.star} opacity={0.34} />
              <path
                d={wedge(highlight * step, (highlight + 1) * step)}
                fill="none"
                stroke={P.star}
                strokeWidth={5}
                strokeLinejoin="round"
              />
              <motion.path
                d={wedge(highlight * step, (highlight + 1) * step)}
                fill="none"
                stroke={P.bg}
                strokeWidth={2.5}
                strokeLinejoin="round"
                animate={{ opacity: reduced ? 1 : [0.3, 1, 0.3] }}
                transition={reduced ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          )}
        </g>

        {/* static rims over the rotating group */}
        <circle cx={C} cy={C} r={R_OUT} fill="none" stroke={P.text} strokeWidth={7} />
        <circle cx={C} cy={C} r={R_OUT - 7} fill="none" stroke={P.bg} strokeWidth={2} opacity={0.3} />

        {/* pointer */}
        <path
          d="M110,10 Q110,3 117,3 H143 Q150,3 150,10 L133,34 Q130,39 127,34 Z"
          fill={P.bad}
          stroke={P.text}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />
        <path d="M118,9 h10 l-7,16 z" fill={P.bg} opacity={0.4} />
        <circle cx={130} cy={7} r={7.5} fill={P.star} stroke={P.text} strokeWidth={4} />
      </g>

      {/* mascot head — outside the locked filter so the face always reads */}
      <image
        href="/spin/roblox-head.webp"
        x={73.33}
        y={81.33}
        width={113.33}
        height={113.33}
        style={{ filter: "brightness(1.4) contrast(1.05) saturate(1.1)" }}
      />

      {/* lock sticker (never greyed) */}
      {locked && (
        <motion.g
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: -10 }}
          transition={{ type: "spring", stiffness: 240, damping: 14 }}
          style={{ transformOrigin: "230px 44px", transformBox: "view-box" }}
        >
          <rect x={208} y={22} width={54} height={54} rx={16} fill={P.text} opacity={0.25} />
          <path d="M216,21 v-7 a9.5,9.5 0 0 1 19,0 v7" fill="none" stroke={P.text} strokeWidth={7} strokeLinecap="round" />
          <rect x={203} y={17} width={54} height={54} rx={16} fill={P.star} stroke={P.text} strokeWidth={5} />
          <circle cx={230} cy={41} r={4.5} fill={P.text} />
          <rect x={228.3} y={41} width={3.4} height={11} rx={1.7} fill={P.text} />
        </motion.g>
      )}
        </svg>
      </div>
    </div>
  );
}
