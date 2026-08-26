import { useEffect, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════
   RBSTARS MASCOT SYSTEM — blocky R6-style characters & art
   Pure SVG, zero dependencies. Cartoonish by design.
════════════════════════════════════════════════════════════ */

const INK = "#0E1A3C";
const ROYAL = "#2B50F6";
const GOLD = "#FFC53D";

export interface AvatarCfg {
  skin?: string;
  shirt?: string;
  pants?: string;
  hat?: "none" | "cap" | "top" | "prop" | "phones" | "crown";
  hatColor?: string;
  face?: "smile" | "chill" | "uwu" | "shock";
  wave?: boolean;
}

const FACES: Record<string, string> = {
  smile: `<g class="av-eyes"><circle cx="86" cy="84" r="4.6" fill="${INK}"/><circle cx="114" cy="84" r="4.6" fill="${INK}"/></g><path d="M87 97 Q100 108 113 97" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  chill: `<rect x="75" y="77" width="50" height="14" rx="7" fill="${INK}"/><path d="M88 100 L112 96" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  uwu: `<g class="av-eyes" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"><path d="M78 86 q7 -10 15 0"/><path d="M107 86 q7 -10 15 0"/></g><circle cx="79" cy="95" r="5" fill="#FF9ECF" opacity=".55"/><circle cx="121" cy="95" r="5" fill="#FF9ECF" opacity=".55"/><path d="M94 100 q6 6 12 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  shock: `<g class="av-eyes"><circle cx="86" cy="84" r="5.6" fill="${INK}"/><circle cx="114" cy="84" r="5.6" fill="${INK}"/></g><ellipse cx="100" cy="101" rx="7" ry="9" fill="${INK}"/>`,
};

const HATS: Record<string, (c: string) => string> = {
  none: () => "",
  cap: (c) => `<path d="M62 62 Q100 30 138 62 L138 67 L62 67 Z" fill="${c}" stroke="${INK}" stroke-width="3.5"/><rect x="114" y="56" width="44" height="11" rx="5.5" fill="${c}" stroke="${INK}" stroke-width="3.5"/>`,
  top: (c) => `<rect x="74" y="12" width="52" height="46" rx="6" fill="${c}" stroke="${INK}" stroke-width="3.5"/><rect x="74" y="44" width="52" height="8" fill="${INK}"/><rect x="52" y="54" width="96" height="10" rx="5" fill="${INK}"/>`,
  prop: (c) => `<path d="M64 60 Q100 26 136 60 Z" fill="${c}" stroke="${INK}" stroke-width="3.5"/><g class="av-prop"><rect x="72" y="15" width="56" height="8" rx="4" fill="${ROYAL}" stroke="${INK}" stroke-width="2.5"/><rect x="96" y="-9" width="8" height="56" rx="4" fill="${GOLD}" stroke="${INK}" stroke-width="2.5"/></g><circle cx="100" cy="19" r="5" fill="${INK}"/>`,
  phones: (c) => `<path d="M58 76 Q58 30 100 30 Q142 30 142 76" fill="none" stroke="${INK}" stroke-width="9"/><rect x="48" y="70" width="17" height="27" rx="8" fill="${c}" stroke="${INK}" stroke-width="3.5"/><rect x="135" y="70" width="17" height="27" rx="8" fill="${c}" stroke="${INK}" stroke-width="3.5"/>`,
  crown: () => `<path d="M66 56 L72 30 L86 44 L100 24 L114 44 L128 30 L134 56 Z" fill="${GOLD}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="100" cy="38" r="4" fill="#FF6B9D" stroke="${INK}" stroke-width="2.5"/>`,
};

export function avatarSVG(c: AvatarCfg): string {
  const skin = c.skin || "#FFD23F";
  const shirt = c.shirt || ROYAL;
  const pants = c.pants || "#16204D";
  const hatColor = c.hatColor || GOLD;
  const bd = (2.6 + Math.random() * 1.6).toFixed(2);
  return `<svg class="av" viewBox="0 0 200 252" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<ellipse cx="100" cy="245" rx="40" ry="7" fill="rgba(14,26,60,.16)"/>
<g class="av-bob" style="--bd:${bd}s">
<rect x="76" y="180" width="22" height="64" rx="6" fill="${pants}" stroke="${INK}" stroke-width="3.5"/>
<rect x="102" y="180" width="22" height="64" rx="6" fill="${pants}" stroke="${INK}" stroke-width="3.5"/>
<rect x="44" y="122" width="22" height="62" rx="9" fill="${skin}" stroke="${INK}" stroke-width="3.5"/>
<g class="${c.wave ? "arm-wave" : ""}"><rect x="134" y="122" width="22" height="62" rx="9" fill="${skin}" stroke="${INK}" stroke-width="3.5"/></g>
<rect x="70" y="116" width="60" height="70" rx="8" fill="${shirt}" stroke="${INK}" stroke-width="3.5"/>
<g class="av-head">
<rect x="63" y="57" width="74" height="58" rx="10" fill="${skin}" stroke="${INK}" stroke-width="3.5"/>
${(HATS[c.hat || "none"])(hatColor)}
${FACES[c.face || "smile"]}
</g>
</g>
</svg>`;
}

/* ── Live character component (bobbing + blinking + optional wave) ── */
export function Character({
  cfg, size = 180, className = "", style,
}: { cfg: AvatarCfg; size?: number | string; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`mascot ${className}`}
      style={{ width: typeof size === "number" ? `${size}px` : size, ...style }}
      dangerouslySetInnerHTML={{ __html: avatarSVG(cfg) }}
    />
  );
}

/* ── Head-tracking hook: attach to a container ref ── */
export function useHeadTrack() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: MouseEvent) => {
      tx = ((e.clientX / window.innerWidth) - 0.5) * 12;
      ty = ((e.clientY / window.innerHeight) - 0.5) * 8;
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      el.querySelectorAll(".av-head").forEach(h => {
        h.setAttribute("transform", `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${(cx * 0.45).toFixed(2)} 100 86)`);
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return ref;
}

/* ── Track wrapper: characters inside follow the cursor ── */
export function CharacterTrack({
  children, className = "", style,
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useHeadTrack();
  return (
    <div ref={ref} className={className} style={{ position: "relative", width: "100%", height: "100%", ...style }}>
      {children}
    </div>
  );
}

/* ═══════════ CHUNKY CARTOON ICONS (hand-drawn feel) ═══════════ */

type IconName =
  | "bolt" | "shield" | "headset" | "grid" | "gamepad" | "chat"
  | "gift" | "cart" | "star" | "bot" | "rocket" | "coin";

export function ChunkIcon({ name, size = 44 }: { name: IconName; size?: number }) {
  const common = {
    width: size, height: size, viewBox: "0 0 64 64", fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  } as const;

  switch (name) {
    case "bolt":
      return (
        <svg {...common}>
          <path d="M36 6 L16 36 h12 l-4 20 L48 26 H34 z" fill={GOLD} stroke={INK} strokeWidth="3.5" strokeLinejoin="round"/>
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M32 5 L54 13 V30 C54 45 44 55 32 59 C20 55 10 45 10 30 V13 Z" fill="#3ED598" stroke={INK} strokeWidth="3.5" strokeLinejoin="round"/>
          <path d="M23 31 l7 7 12 -13" stroke={INK} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "headset":
      return (
        <svg {...common}>
          <path d="M12 34 v-4 a20 20 0 0 1 40 0 v4" stroke={INK} strokeWidth="4.5" strokeLinecap="round"/>
          <rect x="7" y="32" width="13" height="20" rx="6" fill={ROYAL} stroke={INK} strokeWidth="3.5"/>
          <rect x="44" y="32" width="13" height="20" rx="6" fill={ROYAL} stroke={INK} strokeWidth="3.5"/>
          <path d="M50 52 v3 a6 6 0 0 1 -6 6 h-8" stroke={INK} strokeWidth="4" strokeLinecap="round"/>
          <circle cx="33" cy="61" r="3.5" fill={GOLD} stroke={INK} strokeWidth="2.5"/>
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="21" height="21" rx="6" fill={ROYAL} stroke={INK} strokeWidth="3.5"/>
          <rect x="35" y="8" width="21" height="21" rx="6" fill={GOLD} stroke={INK} strokeWidth="3.5"/>
          <rect x="8" y="35" width="21" height="21" rx="6" fill="#FF6B9D" stroke={INK} strokeWidth="3.5"/>
          <rect x="35" y="35" width="21" height="21" rx="6" fill="#3ED598" stroke={INK} strokeWidth="3.5"/>
        </svg>
      );
    case "gamepad":
      return (
        <svg {...common}>
          <path d="M20 18 h24 c9 0 15 8 16 19 c1 9 -3 17 -9 17 c-4 0 -6 -3 -9 -7 c-2 -3 -4 -4 -10 -4 s-8 1 -10 4 c-3 4 -5 7 -9 7 c-6 0 -10 -8 -9 -17 C5 26 11 18 20 18z" fill={ROYAL} stroke={INK} strokeWidth="3.5" strokeLinejoin="round"/>
          <path d="M20 30 v10 m-5 -5 h10" stroke="#fff" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="43" cy="29" r="3.5" fill={GOLD} stroke={INK} strokeWidth="2.5"/>
          <circle cx="50" cy="37" r="3.5" fill="#FF6B9D" stroke={INK} strokeWidth="2.5"/>
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M10 14 h44 a6 6 0 0 1 6 6 v22 a6 6 0 0 1 -6 6 H30 L18 58 V48 H10 a6 6 0 0 1 -6 -6 V20 a6 6 0 0 1 6 -6z" fill="#fff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" transform="translate(0,-2)"/>
          <circle cx="22" cy="30" r="3.5" fill={ROYAL}/>
          <circle cx="33" cy="30" r="3.5" fill={GOLD}/>
          <circle cx="44" cy="30" r="3.5" fill="#FF6B9D"/>
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <rect x="10" y="26" width="44" height="30" rx="5" fill={ROYAL} stroke={INK} strokeWidth="3.5"/>
          <rect x="28" y="26" width="8" height="30" fill={GOLD} stroke={INK} strokeWidth="2.5"/>
          <rect x="6" y="16" width="52" height="12" rx="4" fill="#3D63FF" stroke={INK} strokeWidth="3.5"/>
          <path d="M32 16 C26 4 12 6 16 13 c2 4 10 3 16 3 c6 0 14 1 16 -3 c4 -7 -10 -9 -16 3z" fill="#FF6B9D" stroke={INK} strokeWidth="3" strokeLinejoin="round"/>
        </svg>
      );
    case "cart":
      return (
        <svg {...common}>
          <path d="M8 10 h8 l7 30 h26 l7 -22 H19" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="#fff"/>
          <circle cx="27" cy="52" r="5.5" fill={GOLD} stroke={INK} strokeWidth="3"/>
          <circle cx="46" cy="52" r="5.5" fill={GOLD} stroke={INK} strokeWidth="3"/>
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M32 5 l7.6 15.6 17.2 2.5 -12.4 12 2.9 17.1 L32 44.2 16.7 52.2 19.6 35.1 7.2 23.1 24.4 20.6z" fill={GOLD} stroke={INK} strokeWidth="3.5" strokeLinejoin="round"/>
        </svg>
      );
    case "coin":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="25" fill={GOLD} stroke={INK} strokeWidth="3.5"/>
          <circle cx="32" cy="32" r="17" fill="#FFDE7A" stroke={INK} strokeWidth="3"/>
          <path d="M32 22 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.9 -5.2 -2.7 -5.2 2.7 1 -5.9 -4.3 -4.1 5.9 -.8z" fill={GOLD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round"/>
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M32 4 C42 12 47 24 47 36 L38 46 H26 L17 36 C17 24 22 12 32 4z" fill="#fff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round"/>
          <circle cx="32" cy="26" r="6" fill={ROYAL} stroke={INK} strokeWidth="3"/>
          <path d="M17 36 L8 48 l11 -2 M47 36 l9 12 -11 -2" fill={ROYAL} stroke={INK} strokeWidth="3.5" strokeLinejoin="round"/>
          <path d="M27 48 q5 8 5 12 q0 -4 5 -12z" fill={GOLD} stroke={INK} strokeWidth="3" strokeLinejoin="round"/>
        </svg>
      );
    case "bot":
      return (
        <svg {...common}>
          <line x1="32" y1="6" x2="32" y2="14" stroke={INK} strokeWidth="4" strokeLinecap="round"/>
          <circle cx="32" cy="6" r="4" fill={GOLD} stroke={INK} strokeWidth="2.5"/>
          <rect x="10" y="14" width="44" height="34" rx="12" fill={ROYAL} stroke={INK} strokeWidth="3.5"/>
          <circle cx="24" cy="31" r="6" fill="#fff" stroke={INK} strokeWidth="3"/>
          <circle cx="40" cy="31" r="6" fill="#fff" stroke={INK} strokeWidth="3"/>
          <circle cx="24" cy="31" r="2.2" fill={INK}/>
          <circle cx="40" cy="31" r="2.2" fill={INK}/>
          <path d="M26 41 q6 5 12 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <rect x="2" y="24" width="6" height="14" rx="3" fill={GOLD} stroke={INK} strokeWidth="2.5"/>
          <rect x="56" y="24" width="6" height="14" rx="3" fill={GOLD} stroke={INK} strokeWidth="2.5"/>
        </svg>
      );
  }
}

/* ── Speech bubble ── */
export function SpeechBubble({
  children, tail = "bottom-left", className = "", style,
}: { children: React.ReactNode; tail?: "bottom-left" | "bottom-right"; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`speech ${className}`} data-tail={tail} style={style}>
      {children}
    </div>
  );
}
