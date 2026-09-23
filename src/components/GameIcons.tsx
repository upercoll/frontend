/* Custom SVG icon set — flat, chunky, Roblox-game feel. No emojis. */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

function I({ size = 24, color = "currentColor", className = "", d, fill }: IconProps & { d: string; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      stroke={fill ? "none" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {fill ? <path d={d} fill={color} stroke="none" /> : <path d={d} />}
    </svg>
  );
}

/* ── Game icons ── */
export function IconMM2(p: IconProps) {
  return <I {...p} d="M14.5 3.5l6 6-11 11H3.5v-6l11-11z M9 15l6-6" />;
}
export function IconBladeBall(p: IconProps) {
  return <I {...p} d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v4l3 3" />;
}
export function IconGAG2(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <path d="M12 22V12M12 12C12 9 10 6 7 5M12 12C12 9 14 6 17 5" stroke={p.color||"currentColor"} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="4" r="2" fill={p.color||"currentColor"} stroke="none" />
    </svg>
  );
}
export function IconBrainrot(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <path d="M12 3C8 3 5 6 5 9c0 2 1 3.5 2 4.5V16a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2.5c1-1 2-2.5 2-4.5 0-3-3-6-7-6z" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M9 21h6M10 18v3M14 18v3" stroke={p.color||"currentColor"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function IconBlox(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M8 8h8v8H8z" fill={p.color||"currentColor"} stroke="none" />
    </svg>
  );
}
export function IconTower(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <rect x="5" y="10" width="14" height="11" rx="1" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M8 10V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4" stroke={p.color||"currentColor"} strokeWidth="2" />
      <rect x="10" y="14" width="4" height="7" rx="1" fill={p.color||"currentColor"} stroke="none" />
      <path d="M3 10l9-7 9 7" stroke={p.color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconForest(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <path d="M12 3l-6 9h4l-3 6h8l-3-6h4l-6-9z" fill={p.color||"currentColor"} stroke="none" />
      <rect x="11" y="18" width="2" height="4" fill={p.color||"currentColor"} stroke="none" />
    </svg>
  );
}
export function IconDTI(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <path d="M6 4l6 3 6-3v14l-6 3-6-3V4z" stroke={p.color||"currentColor"} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 7v13M6 4l6 3 6-3" stroke={p.color||"currentColor"} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
export function IconPetSim(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <circle cx="9" cy="9" r="2.5" fill={p.color||"currentColor"} stroke="none" />
      <circle cx="15" cy="9" r="2.5" fill={p.color||"currentColor"} stroke="none" />
      <ellipse cx="12" cy="15" rx="4" ry="3.5" fill={p.color||"currentColor"} stroke="none" />
      <circle cx="10.5" cy="14" r="1" fill="white" />
      <circle cx="13.5" cy="14" r="1" fill="white" />
      <path d="M11 16.5h2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Feature / utility icons ── */
export function IconBolt(p: IconProps) {
  return <I {...p} fill={p.color} d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />;
}
export function IconShield(p: IconProps) {
  return <I {...p} d="M12 2l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" />;
}
export function IconChat(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke={p.color||"currentColor"} strokeWidth="2" />
      <circle cx="9.5" cy="11.5" r="1" fill={p.color||"currentColor"} stroke="none" />
      <circle cx="12.5" cy="11.5" r="1" fill={p.color||"currentColor"} stroke="none" />
      <circle cx="15.5" cy="11.5" r="1" fill={p.color||"currentColor"} stroke="none" />
    </svg>
  );
}
export function IconCoins(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <circle cx="9" cy="10" r="6" stroke={p.color||"currentColor"} strokeWidth="2" />
      <circle cx="15" cy="14" r="6" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M7.5 10h3M9 8.5v3" stroke={p.color||"currentColor"} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 14h3M15 12.5v3" stroke={p.color||"currentColor"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function IconStar(p: IconProps) {
  return <I {...p} fill={p.color} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
}
export function IconCart(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M3 6h18" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M16 10a4 4 0 0 1-8 0" stroke={p.color||"currentColor"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function IconGift(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <rect x="3" y="8" width="18" height="13" rx="2" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M12 8v13M3 12h18" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M12 8c-2-3-6-3-6 0s4 0 6 0c2-3 6-3 6 0s-4 0-6 0" stroke={p.color||"currentColor"} strokeWidth="2" />
    </svg>
  );
}
export function IconRocket(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M12 15l-3-3M22 2l-7 7M15 2l-1 1M22 2l-1 1" stroke={p.color||"currentColor"} strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 12.5a3.5 3.5 0 0 0 5 0l4-4a8 8 0 0 0-13.5.5L9.5 12.5z" stroke={p.color||"currentColor"} strokeWidth="2" />
    </svg>
  );
}
export function IconCheck(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <circle cx="12" cy="12" r="10" fill={p.color||"currentColor"} stroke="none" opacity="0.15" />
      <path d="M8 12l3 3 5-6" stroke={p.color||"currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconArrow(p: IconProps) {
  return <I {...p} d="M5 12h14M12 5l7 7-7 7" />;
}
export function IconClock(p: IconProps) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" className={p.className||""}>
      <circle cx="12" cy="12" r="10" stroke={p.color||"currentColor"} strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke={p.color||"currentColor"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Game icon map ── */
export const GAME_ICON_MAP: Record<string, React.FC<IconProps>> = {
  "murder-mystery-2": IconMM2,
  "blade-ball": IconBladeBall,
  "grow-a-garden-2": IconGAG2,
  "steal-a-brainrot": IconBrainrot,
  "blox-fruits": IconBlox,
  "garden-tower-defense": IconTower,
  "99-nights-in-the-forest": IconForest,
  "dress-to-impress": IconDTI,
  "pet-simulator-99": IconPetSim,
};
