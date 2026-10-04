import { motion, useReducedMotion } from "framer-motion";

export type SpinPrize = { label: string; color: string };

const C = 130;
const R_OUT = 100;
const R_LAB = 66;
const INK = "#05090D";

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
  { x: 30, y: 58, r: 12, fill: "#FFC53D", delay: 0 },
  { x: 244, y: 92, r: 9, fill: "#3BA7FF", delay: 0.6 },
  { x: 26, y: 198, r: 8, fill: "#3BA7FF", delay: 1.2 },
  { x: 236, y: 204, r: 12, fill: "#FFC53D", delay: 0.9 },
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
    <svg width={size} height={size} viewBox="0 0 260 260" style={{ display: "block", overflow: "visible" }}>
      {/* floating sparkles */}
      {SPARKS.map((s, i) => (
        <motion.path
          key={i}
          d={starPath(s.x, s.y, s.r)}
          fill={s.fill}
          stroke={INK}
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
        {/* offset shadow */}
        <circle cx={C + 7} cy={C + 7} r={118} fill={INK} opacity={0.5} />

        {/* outer ring + bolts */}
        <circle cx={C} cy={C} r={118} fill="#16222C" stroke={INK} strokeWidth={5} />
        <circle cx={C} cy={C} r={107} fill="#0D1520" stroke={INK} strokeWidth={3} />
        {Array.from({ length: n }).map((_, i) => {
          const p = pt(112.5, i * step);
          return (
            <circle key={i} cx={p.x} cy={p.y} r={5.5} fill="#2C414E" stroke={INK} strokeWidth={2.5} />
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
          <circle cx={C} cy={C} r={R_OUT} fill={INK} />
          {prizes.map((prize, i) => (
            <path
              key={i}
              d={wedge(i * step, (i + 1) * step)}
              fill={prize.color}
              stroke={INK}
              strokeWidth={3.5}
              strokeLinejoin="round"
            />
          ))}
          {prizes.map((prize, i) => {
            const mid = i * step + step / 2;
            const p = pt(R_LAB, mid);
            let rot = mid - 90;
            while (rot > 90) rot -= 180;
            while (rot < -90) rot += 180;
            const words = prize.label.split(" ");
            const twoLine = words.length > 1;
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
                fill="#FFFFFF"
                stroke={INK}
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

          {/* golden glow on the wedge we landed on */}
          {highlight != null && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45 }}
              style={{ pointerEvents: "none" }}
            >
              <path d={wedge(highlight * step, (highlight + 1) * step)} fill="#FFC53D" opacity={0.34} />
              <path
                d={wedge(highlight * step, (highlight + 1) * step)}
                fill="none"
                stroke="#FFC53D"
                strokeWidth={5}
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 8px rgba(255,197,61,0.95))" }}
              />
              <motion.path
                d={wedge(highlight * step, (highlight + 1) * step)}
                fill="none"
                stroke="#FFF3D0"
                strokeWidth={2.5}
                strokeLinejoin="round"
                animate={{ opacity: reduced ? 1 : [0.3, 1, 0.3] }}
                transition={reduced ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          )}
        </g>

        {/* static rims over the rotating group */}
        <circle cx={C} cy={C} r={R_OUT} fill="none" stroke={INK} strokeWidth={7} />
        <circle cx={C} cy={C} r={R_OUT - 7} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.16} />

        {/* pointer */}
        <path
          d="M110,10 Q110,3 117,3 H143 Q150,3 150,10 L133,34 Q130,39 127,34 Z"
          fill="#EF4444"
          stroke={INK}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />
        <path d="M118,9 h10 l-7,16 z" fill="#FFFFFF" opacity={0.4} />
        <circle cx={130} cy={7} r={7.5} fill="#FFC53D" stroke={INK} strokeWidth={4} />
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
          <rect x={208} y={22} width={54} height={54} rx={16} fill={INK} opacity={0.5} />
          <path d="M216,21 v-7 a9.5,9.5 0 0 1 19,0 v7" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <rect x={203} y={17} width={54} height={54} rx={16} fill="#FFC53D" stroke={INK} strokeWidth={5} />
          <circle cx={230} cy={41} r={4.5} fill={INK} />
          <rect x={228.3} y={41} width={3.4} height={11} rx={1.7} fill={INK} />
        </motion.g>
      )}
    </svg>
  );
}
