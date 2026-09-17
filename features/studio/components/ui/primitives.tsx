"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronLeft, type LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  APPOINTMENT_STATUS,
  formatPercentBp,
  initials,
  type StatusTone,
} from "@/features/studio/lib/format";
import type { AppointmentStatus } from "@/features/studio/lib/types";

/* ---------------------------------------------------------------------------
 * Page structure
 * ------------------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Back",
  icon: Icon,
  badge,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  icon?: LucideIcon;
  badge?: ReactNode;
}) {
  return (
    <header className="grid gap-3">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-lg pr-2 text-sm font-medium text-[var(--color-brand)] hover:underline"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <Icon aria-hidden="true" strokeWidth={1.5} className="mt-1.5 size-7 shrink-0 text-[var(--color-gold)] sm:size-8" />
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="font-display text-[28px] leading-tight font-normal text-[var(--color-text-primary)] sm:text-[34px]">
                {title}
              </h1>
              {badge}
            </div>
            {description ? (
              <p className="mt-1 text-sm text-[var(--color-text-muted)] sm:text-[15px]">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Card({
  title,
  icon: Icon,
  action,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={[
        "min-w-0 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-subtle)]",
        padded ? "p-4 sm:p-6" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title || action ? (
        <div className={`flex flex-wrap items-center justify-between gap-3 ${padded ? "mb-4" : "px-4 pt-4 pb-3 sm:px-6 sm:pt-5"}`}>
          {title ? (
            <h2 className="flex min-w-0 items-center gap-2.5 font-display text-lg font-normal text-[var(--color-text-primary)] sm:text-xl">
              {Icon ? <Icon aria-hidden="true" strokeWidth={1.6} className="size-5 shrink-0 text-[var(--color-brand)]" /> : null}
              <span className="min-w-0">{title}</span>
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Status chips
 * ------------------------------------------------------------------------- */

export type ChipTone = StatusTone | "gold";

const CHIP_CLASS: Record<ChipTone, string> = {
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  info: "bg-[var(--color-info-soft,#e6eff9)] text-[var(--color-info,#2f5e9a)]",
  accent: "bg-[var(--color-info-soft,#e6eff9)] text-[var(--color-info,#2f5e9a)]",
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
  neutral: "bg-[var(--color-surface-strong)] text-[var(--color-text-muted)]",
  gold: "bg-[var(--color-gold-light)] text-[var(--color-gold-text,#8f5a1d)]",
};

/** A tinted status label. The text always names the state, so meaning never
 * depends on colour alone. */
export function Pill({
  tone,
  children,
  icon: Icon,
  className,
}: {
  tone: ChipTone;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium",
        CHIP_CLASS[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function StatusPill({ status }: { status: AppointmentStatus }) {
  const meta = APPOINTMENT_STATUS[status];
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

const ACCENT_BAR: Record<ChipTone, string> = {
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  danger: "bg-[var(--color-danger)]",
  info: "bg-[var(--color-info,#2f5e9a)]",
  accent: "bg-[var(--color-info,#2f5e9a)]",
  brand: "bg-[var(--color-brand)]",
  neutral: "bg-[var(--color-border-strong,#ddd0cc)]",
  gold: "bg-[var(--color-gold)]",
};

export function toneAccentClass(tone: ChipTone) {
  return ACCENT_BAR[tone];
}

/* ---------------------------------------------------------------------------
 * Figures
 * ------------------------------------------------------------------------- */

const ICON_CIRCLE: Record<"brand" | "gold" | "success" | "info", string> = {
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
  gold: "bg-[var(--color-gold-light)] text-[var(--color-gold)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  info: "bg-[var(--color-info-soft,#e6eff9)] text-[var(--color-info,#2f5e9a)]",
};

export function IconCircle({
  icon: Icon,
  tone = "brand",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: keyof typeof ICON_CIRCLE;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full ${ICON_CIRCLE[tone]} ${
        size === "sm" ? "size-10" : "size-11 sm:size-12"
      }`}
    >
      <Icon strokeWidth={1.6} className={size === "sm" ? "size-[18px]" : "size-5 sm:size-[22px]"} />
    </span>
  );
}

export function ChangeLabel({
  basisPoints,
  suffix = "vs last week",
  invert = false,
}: {
  basisPoints: number | null;
  suffix?: string;
  invert?: boolean;
}) {
  if (basisPoints === null) {
    return <span className="text-xs text-[var(--color-text-muted)]">No earlier data</span>;
  }
  const up = basisPoints >= 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-xs">
      <span
        className={`inline-flex items-center gap-0.5 font-medium ${
          basisPoints === 0
            ? "text-[var(--color-text-muted)]"
            : good
              ? "text-[var(--color-success)]"
              : "text-[var(--color-danger)]"
        }`}
      >
        {basisPoints !== 0 ? <Icon aria-hidden="true" className="size-3.5" /> : null}
        {formatPercentBp(Math.abs(basisPoints))}
        <span className="sr-only">{up ? "up" : "down"}</span>
      </span>
      {suffix ? <span className="text-[var(--color-text-muted)]">{suffix}</span> : null}
    </span>
  );
}

/** The dashboard's metric card: tinted icon circle, label, serif figure and a
 * link to where the number comes from. */
export function KpiCard({
  icon,
  tone = "brand",
  label,
  value,
  href,
  linkLabel,
  hint,
  className,
  compact = false,
}: {
  icon?: LucideIcon;
  tone?: "brand" | "gold" | "success" | "info";
  label: string;
  value: ReactNode;
  href?: string;
  linkLabel?: string;
  hint?: ReactNode;
  className?: string;
  /** Stacked layout for three-across cards on phones. */
  compact?: boolean;
}) {
  const linkColour = tone === "gold" ? "text-[var(--color-gold-text,#8f5a1d)]" : "text-[var(--color-brand)]";
  return (
    <div
      className={[
        "flex min-w-0 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-subtle)]",
        compact
          ? "flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-4 sm:p-5"
          : "items-start gap-3 p-4 sm:gap-4 sm:p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? <IconCircle icon={icon} tone={tone} size={compact ? "sm" : "md"} /> : null}
      <div className="min-w-0 flex-1">
        <p
          className={
            compact
              ? "text-xs leading-snug text-[var(--color-text-muted)] sm:truncate sm:text-sm"
              : "truncate text-sm text-[var(--color-text-muted)]"
          }
        >
          {label}
        </p>
        <p
          className={`mt-1 truncate font-display leading-tight text-[var(--color-text-primary)] ${
            compact ? "text-[22px] sm:text-[28px]" : "text-[26px] sm:text-[28px]"
          }`}
        >
          {value}
        </p>
        {hint ? <div className="mt-1 min-h-4 text-xs text-[var(--color-text-muted)]">{hint}</div> : null}
        {href && linkLabel ? (
          <Link
            href={href}
            className={`mt-2 inline-flex min-h-8 items-center gap-1 font-medium hover:underline ${
              compact ? "text-xs leading-tight sm:gap-1.5 sm:text-sm" : "gap-1.5 text-sm"
            } ${linkColour}`}
          >
            {linkLabel}
            <ArrowRight aria-hidden="true" className={compact ? "size-3.5 shrink-0 sm:size-4" : "size-4"} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** Kept for pages not yet moved to KpiCard. */
export function StatTile({
  label,
  value,
  hint,
  changeBp,
  invertChange = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  changeBp?: number | null;
  invertChange?: boolean;
}) {
  return (
    <KpiCard
      label={label}
      value={value}
      hint={
        changeBp !== undefined || hint ? (
          <span className="flex flex-wrap items-center gap-x-2">
            {changeBp !== undefined ? <ChangeLabel basisPoints={changeBp} suffix="" invert={invertChange} /> : null}
            {hint ? <span className="truncate">{hint}</span> : null}
          </span>
        ) : undefined
      }
    />
  );
}

/** Donut progress ring, e.g. profile health or utilisation. */
export function ProgressRing({
  value,
  label,
  size = 120,
  stroke = 10,
  tone = "brand",
  caption,
}: {
  value: number;
  label?: string;
  size?: number;
  stroke?: number;
  tone?: "brand" | "success" | "gold";
  caption?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const colour =
    tone === "success" ? "var(--color-success)" : tone === "gold" ? "var(--color-gold)" : "var(--color-brand)";
  return (
    <div
      role="img"
      aria-label={`${Math.round(clamped)}%${label ? ` ${label}` : ""}`}
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-brand-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 grid place-content-center text-center">
        <span className="font-display leading-none text-[var(--color-text-primary)]" style={{ fontSize: Math.max(14, size * 0.24) }}>
          {Math.round(clamped)}%
        </span>
        {caption ? <span className="mt-1 text-xs text-[var(--color-text-muted)]">{caption}</span> : null}
      </div>
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass = {
    xs: "size-7 text-[10px]",
    sm: "size-9 text-xs",
    md: "size-11 text-sm",
    lg: "size-14 text-base",
    xl: "size-20 text-xl",
  }[size];
  if (src) {
    return (
      // Business logos and client photos come from arbitrary allowed hosts;
      // a plain img with fixed dimensions avoids layout shift without
      // requiring each host in next.config.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${sizeClass} shrink-0 rounded-full object-cover`} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] font-display text-[var(--color-brand)] ${sizeClass}`}
    >
      {initials(name)}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Tabs & controls
 * ------------------------------------------------------------------------- */

export type SegmentOption<TValue extends string> = {
  value: TValue;
  label: string;
  count?: number;
};

/**
 * Tabs in two styles from the designs: `underline` (page sections such as
 * Weekly hours / Time off) and `filled` (view switches such as Day / Week /
 * Month). Both scroll sideways on narrow screens instead of wrapping.
 */
export function Segmented<TValue extends string>({
  options,
  value,
  onChange,
  label,
  variant = "underline",
}: {
  options: SegmentOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  label: string;
  variant?: "underline" | "filled";
}) {
  if (variant === "filled") {
    return (
      <div className="relative max-w-full overflow-x-auto [scrollbar-width:none]">
        <div
          role="tablist"
          aria-label={label}
          className="inline-flex min-w-max overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChange(option.value)}
                className={`inline-flex min-h-10 items-center gap-2 border-r border-[var(--color-border)] px-4 text-sm font-medium whitespace-nowrap last:border-r-0 ${
                  selected
                    ? "bg-[var(--color-brand)] text-white"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)]"
                }`}
              >
                {option.label}
                {option.count !== undefined ? (
                  <span className={`rounded-full px-1.5 text-xs ${selected ? "bg-white/20" : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"}`}>
                    {option.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-full overflow-x-auto border-b border-[var(--color-border)] [scrollbar-width:none]">
      <div role="tablist" aria-label={label} className="flex min-w-max gap-1 sm:gap-4">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(option.value)}
              className={`-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap transition-colors sm:px-4 sm:text-[15px] ${
                selected
                  ? "border-[var(--color-brand)] font-medium text-[var(--color-brand)]"
                  : "border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-brand)]"
              }`}
            >
              {option.label}
              {option.count !== undefined ? (
                <span className="rounded-full bg-[var(--color-brand-soft)] px-1.5 text-xs text-[var(--color-brand)]">
                  {option.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong,#ddd0cc)]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

const CONTROL =
  "w-full min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus-ring";

export function SelectField({
  label,
  children,
  hint,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-primary)]">
        {label}
      </label>
      <select id={id} {...rest} className={CONTROL}>
        {children}
      </select>
      {hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = useId();
  const length = typeof rest.value === "string" ? rest.value.length : null;
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-primary)]">
        {label}
      </label>
      <textarea id={id} rows={3} {...rest} className={`${CONTROL} min-h-24 py-2.5`} />
      <div className="flex justify-between gap-3 text-xs text-[var(--color-text-muted)]">
        <span>{hint}</span>
        {rest.maxLength && length !== null ? (
          <span>
            {length}/{rest.maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
    >
      {message}
    </p>
  );
}

export function RateLabel({ basisPoints }: { basisPoints: number }) {
  return <>{formatPercentBp(basisPoints)}</>;
}

export function EmptyPanel({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-2 rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border-strong,#ddd0cc)] bg-[var(--color-surface)] px-6 py-10 text-center">
      {icon ? (
        <span className="grid size-12 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          {icon}
        </span>
      ) : null}
      <h2 className="font-display text-lg text-[var(--color-text-primary)]">{title}</h2>
      <p className="max-w-md text-sm text-[var(--color-text-muted)]">{description}</p>
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="grid gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-20 animate-pulse rounded-[var(--radius-panel)] bg-[var(--color-surface-strong)]"
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
