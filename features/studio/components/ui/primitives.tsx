"use client";

import { ArrowDownRight, ArrowUpRight, ChevronLeft } from "lucide-react";
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

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="grid *:min-w-0 gap-3">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1 rounded-md py-1 text-sm font-semibold text-[var(--color-brand)] hover:underline"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

const TONE_CLASS: Record<StatusTone, string> = {
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  info: "bg-[#e8eefc] text-[#1d4ed8]",
  accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  neutral: "bg-[var(--color-surface-strong)] text-[var(--color-text-muted)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const TONE_DOT: Record<StatusTone, string> = {
  warning: "bg-[var(--color-warning)]",
  info: "bg-[#1d4ed8]",
  accent: "bg-[var(--color-accent)]",
  brand: "bg-[var(--color-brand)]",
  success: "bg-[var(--color-success)]",
  neutral: "bg-[var(--color-text-muted)]",
  danger: "bg-[var(--color-danger)]",
};

export function Pill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${TONE_CLASS[tone]}`}
    >
      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${TONE_DOT[tone]}`} />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function StatusPill({ status }: { status: AppointmentStatus }) {
  const meta = APPOINTMENT_STATUS[status];
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function toneAccentClass(tone: StatusTone) {
  return TONE_DOT[tone];
}

export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)] sm:p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title || action ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title ? (
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
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
  /** Relative change in basis points; null means "no previous data". */
  changeBp?: number | null;
  /** For metrics where down is good (cancellations, no-shows). */
  invertChange?: boolean;
}) {
  const hasChange = changeBp !== undefined;
  const positive = (changeBp ?? 0) >= 0;
  const good = invertChange ? !positive : positive;
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)]">
      <p className="truncate text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase">
        {label}
      </p>
      <p className="mt-2 truncate text-2xl font-semibold text-[var(--color-text-primary)]">{value}</p>
      <div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-2 text-xs text-[var(--color-text-muted)]">
        {hasChange ? (
          changeBp === null ? (
            <span>No earlier data</span>
          ) : (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                changeBp === 0
                  ? "text-[var(--color-text-muted)]"
                  : good
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-danger)]"
              }`}
            >
              {changeBp !== 0 ? (
                positive ? (
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                ) : (
                  <ArrowDownRight aria-hidden="true" className="size-3.5" />
                )
              ) : null}
              {formatPercentBp(Math.abs(changeBp))}
              <span className="sr-only">{positive ? "increase" : "decrease"}</span>
            </span>
          )
        ) : null}
        {hint ? <span className="truncate">{hint}</span> : null}
      </div>
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-14 text-lg" : "size-10 text-sm";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] font-bold text-[var(--color-brand)] ${sizeClass}`}
    >
      {initials(name)}
    </span>
  );
}

export type SegmentOption<TValue extends string> = {
  value: TValue;
  label: string;
  count?: number;
};

/** Tabs that scroll sideways on narrow screens instead of wrapping into
 * each other or overflowing the page. */
export function Segmented<TValue extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  label: string;
}) {
  return (
    <div className="-mx-1 max-w-full overflow-x-auto px-1 [scrollbar-width:none]">
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex min-w-max gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
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
              className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-[var(--color-brand)] text-white"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
              }`}
            >
              {option.label}
              {option.count !== undefined ? (
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    selected ? "bg-white/20" : "bg-[var(--color-surface-strong)]"
                  }`}
                >
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
    <div className="grid *:min-w-0 min-w-0 gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--color-text-primary)]">
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
  return (
    <div className="grid *:min-w-0 min-w-0 gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--color-text-primary)]">
        {label}
      </label>
      <textarea id={id} rows={3} {...rest} className={`${CONTROL} min-h-24 py-2.5`} />
      {hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
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
    <div className="grid *:min-w-0 justify-items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
      {icon ? (
        <span className="grid size-12 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          {icon}
        </span>
      ) : null}
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <p className="max-w-md text-sm text-[var(--color-text-muted)]">{description}</p>
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="grid *:min-w-0 gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-20 animate-pulse rounded-2xl bg-[var(--color-skeleton)]"
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
