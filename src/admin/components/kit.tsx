import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   Panel kit — the shared Shopify-style primitives every dashboard is
   built from. Tokens live in ../panel.css (.pn-shell scope).
   ═══════════════════════════════════════════════════════════════════ */

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

/* ── Page header ─────────────────────────────────────────────────── */
export function PageHeader({
  title, description, children, eyebrow, icon: Icon, className,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  eyebrow?: string;
  icon?: IconType;
  /** lets a caller own vertical rhythm (e.g. `mb-6`) */
  className?: string;
}) {
  return (
    <header className={cn("pn-pagehead", className)}>
      <div className="min-w-0 flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: "var(--pn-surface)", border: "1px solid var(--pn-border)", color: "var(--pn-text-2)" }}>
            <Icon className="w-4 h-4" strokeWidth={2.1} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1"
               style={{ color: "var(--pn-action)" }}>{eyebrow}</p>
          )}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </header>
  );
}

/* ── Card ────────────────────────────────────────────────────────── */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("pn-card overflow-hidden", className)} {...rest}>{children}</section>;
}

export function CardHeader({
  title, subtitle, action, icon: Icon, tone = "neutral",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: IconType;
  tone?: "neutral" | "action" | "success" | "critical" | "warning";
}) {
  const toneColor = {
    neutral: "var(--pn-text-2)",
    action: "var(--pn-action)",
    success: "var(--pn-success-fg)",
    critical: "var(--pn-critical-text)",
    warning: "var(--pn-warning-fg)",
  }[tone];
  return (
    <div className="pn-cardhead">
      {Icon && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: "var(--pn-surface-2)", border: "1px solid var(--pn-border)", color: toneColor }}>
          <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate">{title}</h3>
        {subtitle && <p className="truncate">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pn-cardbody", className)} {...rest}>{children}</div>;
}

/* ── Delta chip ──────────────────────────────────────────────────── */
export function Delta({
  value, invert = false, suffix = "%", showSign = true,
}: { value?: number; invert?: boolean; suffix?: string; showSign?: boolean }) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const good = invert ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("pn-delta", flat ? "is-flat" : up ? "is-up" : "is-down", !flat && !good && "is-good-down")}>
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      {showSign && !flat && (up ? "+" : "−")}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

/* ── Sparkline (no deps) ─────────────────────────────────────────── */
export function Sparkline({
  values, color = "var(--pn-action)", className,
}: { values?: number[]; color?: string; className?: string }) {
  if (!values || values.length < 2) return null;
  const w = 100, h = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - ((v - min) / span) * (h - 3) - 1.5,
  ]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  const id = React.useId().replace(/:/g, "");
  return (
    <svg className={cn("pn-spark", className)} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`sk${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sk${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ── Metric tile ─────────────────────────────────────────────────── */
export function MetricTile({
  label, value, delta, deltaInvert, hint, icon: Icon, spark, sparkColor, action,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  deltaInvert?: boolean;
  hint?: string;
  icon?: IconType;
  spark?: number[];
  sparkColor?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="pn-metric">
      <div className="flex items-start justify-between gap-2">
        <span className="pn-metric__label">
          {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2} style={{ color: "var(--pn-text-3)" }} />}
          {label}
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          <Delta value={delta} invert={deltaInvert} />
          {action}
        </span>
      </div>
      <div className="pn-metric__value">{value}</div>
      {(hint || spark?.length) && (
        <div className="flex items-end gap-3" style={{ marginTop: "auto" }}>
          {hint && <span className="pn-metric__hint shrink-0">{hint}</span>}
          {spark && <Sparkline values={spark} color={sparkColor} className="flex-1 min-w-0" />}
        </div>
      )}
    </div>
  );
}

/* ── Status badge ────────────────────────────────────────────────── */
export type Tone = "neutral" | "success" | "critical" | "warning" | "info" | "action";

const TONE: Record<Tone, { bg: string; fg: string }> = {
  neutral:  { bg: "var(--pn-surface-2)",  fg: "var(--pn-text-2)" },
  success:  { bg: "var(--pn-success-bg)", fg: "var(--pn-success-fg)" },
  critical: { bg: "var(--pn-critical-bg)", fg: "var(--pn-critical-fg)" },
  warning:  { bg: "var(--pn-warning-bg)",  fg: "var(--pn-warning-fg)" },
  info:     { bg: "var(--pn-info-bg)",     fg: "var(--pn-info-fg)" },
  action:   { bg: "var(--pn-action-tint)", fg: "var(--pn-action)" },
};

export function Badge({
  children, tone = "neutral", dot = false, className,
}: { children: React.ReactNode; tone?: Tone; dot?: boolean; className?: string }) {
  const t = TONE[tone];
  return (
    <span className={cn("pn-badge", className)} style={{ background: t.bg, color: t.fg }}>
      {dot && <span className="pn-badge__dot" />}
      {children}
    </span>
  );
}

/* ── Segmented control ───────────────────────────────────────────── */
export function Segmented<T extends string>({
  options, value, onChange, className,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("pn-seg", className)} role="group">
      {options.map(o => (
        <button key={o.value} type="button" className="pn-seg__btn"
                aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon, title, body, action,
}: { icon: IconType; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="pn-empty">
      <div className="pn-empty__icon"><Icon className="w-5 h-5" strokeWidth={1.8} /></div>
      <p className="pn-empty__title">{title}</p>
      {body && <p className="pn-empty__body">{body}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}

/* ── List row ────────────────────────────────────────────────────── */
export function ListRow({
  icon: Icon, title, meta, value, right, href, onClick, tone,
}: {
  icon?: IconType;
  title: React.ReactNode;
  meta?: React.ReactNode;
  value?: React.ReactNode;
  right?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: string;
}) {
  const inner = (
    <>
      {Icon && (
        <span className="pn-row__icon" style={tone ? { color: tone } : undefined}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="pn-row__title block truncate">{title}</span>
        {meta && <span className="pn-row__meta block truncate">{meta}</span>}
      </span>
      {value !== undefined && <span className="pn-row__value">{value}</span>}
      {right}
    </>
  );
  const cls = "pn-row w-full text-left transition-colors";
  if (href) return <a href={href} className={cls}>{inner}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

/* ── Skeletons ───────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg", className)}
         style={{ background: "var(--pn-surface-2)" }} />
  );
}

export function MetricSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pn-metric" style={{ gap: 10 }}>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </>
  );
}

export function RowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pn-row" style={{ borderBottom: "1px solid var(--pn-divider)" }}>
          <Skeleton className="w-7 h-7" />
          <Skeleton className="h-3.5 flex-1" style={{ maxWidth: 200 }} />
          <Skeleton className="h-3.5 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}
