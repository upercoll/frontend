/* Custom SVG icon set — flat, chunky, illustrated style. Matches #3BA7FF accent. */

interface SIProps {
  size?: number;
  color?: string;
  className?: string;
}

export function IconShield({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill={color} opacity="0.15" />
      <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBolt({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={color} opacity="0.15" />
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeadphones({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="1" y="15" width="4" height="6" rx="1" fill={color} opacity="0.15" stroke={color} strokeWidth="2" />
      <rect x="19" y="15" width="4" height="6" rx="1" fill={color} opacity="0.15" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function IconRefund({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill={color} opacity="0.1" stroke={color} strokeWidth="2" />
      <path d="M8 12h8M12 8v8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 7.5l-2-2M16.5 7.5l2-2M7.5 16.5l-2 2M16.5 16.5l2 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function IconCart({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="21" r="1.5" fill={color} />
      <circle cx="20" cy="21" r="1.5" fill={color} />
    </svg>
  );
}

export function IconCreditCard({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="1" y="4" width="22" height="16" rx="3" fill={color} opacity="0.1" stroke={color} strokeWidth="2" />
      <line x1="1" y1="10" x2="23" y2="10" stroke={color} strokeWidth="2" />
      <line x1="5" y1="15" x2="9" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconRocket({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill={color} opacity="0.15" stroke={color} strokeWidth="2" />
      <path d="M12 15l-3-3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 2l-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M15 2l-1 1" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 2l-1 1" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 12.5a3.5 3.5 0 0 0 5 0l4-4a8 8 0 0 0-13.5.5L9.5 12.5z" fill={color} opacity="0.15" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function IconSearch({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" fill={color} opacity="0.1" stroke={color} strokeWidth="2" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconFilter({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconStar({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function IconFlame({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 22c-4.97 0-7-3.58-7-7 0-3.07 2.25-5.37 3.5-6.5C9.5 7.62 10 5 10 2c1 1 2.5 3 2.5 5.5 0 1.5-.5 2.5-1 3.5.5-.5 1.5-.5 2.5 0 2 2 3 4.5 3 7 0 3.42-2.03 6.5-5 6.5z" fill={color} opacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 22c-1.66 0-3-1.12-3-2.5S10.34 15 12 15s3 2.12 3 4.5-1.34 2.5-3 2.5z" fill={color} opacity="0.3" />
    </svg>
  );
}

export function IconClose({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.08" />
      <line x1="8" y1="8" x2="16" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="8" x2="8" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowRight({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.15" />
      <path d="M8 12l3 3 5-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronDown({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGift({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="8" width="18" height="13" rx="2" fill={color} opacity="0.1" stroke={color} strokeWidth="2" />
      <path d="M12 8v13M3 12h18" stroke={color} strokeWidth="2" />
      <path d="M7.5 8C6 8 5 7 5.5 5.5S7.5 4 8.5 5c1 1 2.5 2 3.5 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 8C18 8 19 7 18.5 5.5S16.5 4 15.5 5c-1 1-2.5 2-3.5 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPackage({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill={color} opacity="0.1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Category icon map for marketplace */
export const CATEGORY_ICONS: Record<string, React.FC<SIProps>> = {
  flame: IconFlame,
  sword: IconSword,
  target: IconTarget,
  heart: IconHeart,
  pawprint: IconPaw,
  package: IconPackage,
  leaf: IconLeaf,
  sprout: IconSprout,
  wrench: IconWrench,
  apple: IconApple,
  gem: IconGem,
  star: IconStar,
};

function IconSword({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 19l6-6M15 21l6-6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 13l-1.5-1.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconTarget({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

function IconHeart({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} fillOpacity="0.15" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconPaw({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} fillOpacity="0.15" className={className}>
      <ellipse cx="8" cy="7" rx="2" ry="2.5" stroke={color} strokeWidth="1.5" />
      <ellipse cx="16" cy="7" rx="2" ry="2.5" stroke={color} strokeWidth="1.5" />
      <ellipse cx="5" cy="12" rx="2" ry="2.5" stroke={color} strokeWidth="1.5" />
      <ellipse cx="19" cy="12" rx="2" ry="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M8 17c0-2 2-3 4-3s4 1 4 3c0 1.5-1 3-4 3s-4-1.5-4-3z" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function IconLeaf({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" fill={color} opacity="0.15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSprout({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 22V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 3c0 4 2.5 7 5 8 2.5-1 5-4 5-8" fill={color} opacity="0.15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 15c2.5-1 5-1 7 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconWrench({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconApple({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3c-.5-1.5-2-2-3-2 0 0 .5 1 0 2s1 1 1 1c-.5.5-2 .5-3 0S5 2 5 2c-2 0-4 2-4 5 0 6 4 13 11 15 7-2 11-9 11-15 0-3-2-5-4-5 0 0-.5 1-1 1s-2.5-.5-3-2c-.5-1.5 0-2 0-2-1 0-2.5.5-3 2z" fill={color} opacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconGem({ size = 24, color = "#3BA7FF", className = "" }: SIProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 3h12l4 7-10 12L2 10l4-7z" fill={color} opacity="0.1" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M2 10h20M6.5 3l-4.5 7M17.5 3l4.5 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
