"use client";

import { Check, CircleAlert, Copy, Info, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ErrorState } from "@/components/shared/ErrorState";
import { Avatar, Card, PageHeader, SkeletonRows } from "@/features/studio/components/ui/primitives";
import { errorCode, errorMessage, studioFetcher } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  BALANCE_METHOD_LABEL,
  formatDate,
  formatDuration,
  formatMoney,
  formatTime,
} from "@/features/studio/lib/format";
import type { AppointmentDetail, AppointmentDetailResponse } from "@/features/studio/lib/types";

/* ---------------------------------------------------------------------------
 * Data
 * ------------------------------------------------------------------------- */

/** One appointment, plus `apply` to swap in the fresh copy an action returns
 * and refresh every list, calendar and dashboard figure that shows it. */
export function useAppointment(appointmentId: string) {
  const key = `/api/v1/business/appointments/${appointmentId}`;
  const { mutate: globalMutate } = useSWRConfig();
  const swr = useSWR<AppointmentDetailResponse>(key, studioFetcher);

  const apply = (response: AppointmentDetailResponse) => {
    void swr.mutate({ appointment: response.appointment }, { revalidate: false });
    void globalMutate(
      (cacheKey) =>
        typeof cacheKey === "string" &&
        cacheKey !== key &&
        cacheKey.startsWith("/api/v1/business/"),
    );
  };

  return { ...swr, key, apply };
}

/**
 * Header, loading and error handling shared by every appointment sub-page
 * (check-in, reschedule, cancel, no-show, complete, refund).
 */
export function AppointmentFlowFrame({
  appointmentId,
  title,
  backHref,
  backLabel,
  badge,
  description,
  children,
}: {
  appointmentId: string;
  title: string | ((appointment: AppointmentDetail) => string);
  backHref?: string;
  backLabel?: string;
  badge?: (appointment: AppointmentDetail) => ReactNode;
  description?: (appointment: AppointmentDetail) => ReactNode;
  children: (appointment: AppointmentDetail, apply: (response: AppointmentDetailResponse) => void) => ReactNode;
}) {
  const { data, error, isLoading, mutate, apply } = useAppointment(appointmentId);
  const back = backHref ?? `/studio/appointments/${appointmentId}`;
  const label = backLabel ?? "Appointment";
  const staticTitle = typeof title === "string" ? title : "Appointment";

  if (isLoading && !data) {
    return (
      <div className="grid gap-5">
        <PageHeader title={staticTitle} backHref={back} backLabel={label} />
        <SkeletonRows label={`Loading ${staticTitle.toLowerCase()}`} rows={3} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="grid gap-5">
        <PageHeader title={staticTitle} backHref={back} backLabel={label} />
        {errorCode(error) === "APPOINTMENT_NOT_FOUND" ? (
          <ErrorState
            title="Appointment not found"
            description="It may belong to another business, or it is not assigned to you."
          />
        ) : (
          <ErrorState description={error ? errorMessage(error) : "Something went wrong."} onRetry={() => void mutate()} />
        )}
      </div>
    );
  }

  const appointment = data.appointment;
  return (
    <div className="grid gap-5 *:min-w-0">
      <PageHeader
        title={typeof title === "string" ? title : title(appointment)}
        backHref={back}
        backLabel={label}
        badge={badge?.(appointment)}
        description={description?.(appointment)}
      />
      {children(appointment, apply)}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Pieces
 * ------------------------------------------------------------------------- */

export function CopyReference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-sm text-[var(--color-text-primary)]">{value}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          } catch {
            setCopied(false);
          }
        }}
        aria-label={copied ? "Booking reference copied" : "Copy booking reference"}
        className="grid size-9 place-items-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
      >
        {copied ? (
          <Check aria-hidden="true" className="size-4 text-[var(--color-success)]" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </span>
  );
}

/** The client-and-booking header card every flow page opens with. */
export function ClientBookingCard({
  appointment,
  aside,
}: {
  appointment: AppointmentDetail;
  aside?: ReactNode;
}) {
  const { timezone } = useStudio();
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <Avatar name={appointment.client.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-xl text-[var(--color-text-primary)] sm:text-2xl">
              {appointment.client.name}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {formatDate(appointment.startAt, timezone, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
              {formatTime(appointment.startAt, timezone)} – {formatTime(appointment.endAt, timezone)} ·{" "}
              {formatDuration(appointment.durationMins)}
            </p>
            <p className="truncate text-sm text-[var(--color-text-primary)]">
              {appointment.service.name}
              {appointment.teamMember ? (
                <span className="text-[var(--color-text-muted)]"> with {appointment.teamMember.name}</span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-xs text-[var(--color-text-muted)]">Booking reference</p>
            <CopyReference value={appointment.reference} />
          </div>
          {aside}
        </div>
      </div>
    </Card>
  );
}

export type TimelineStep = {
  label: string;
  detail?: ReactNode;
  state: "done" | "current" | "upcoming" | "warning" | "danger";
  badge?: ReactNode;
  icon?: LucideIcon;
};

const STEP_DOT: Record<TimelineStep["state"], string> = {
  done: "border-[var(--color-brand)] bg-[var(--color-brand)] text-white",
  current: "border-[var(--color-success)] bg-[var(--color-success)] text-white",
  upcoming: "border-[var(--color-border-strong,#ddd0cc)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
  warning: "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

/** Vertical status timeline: filled crimson checks for what has happened,
 * hollow circles for what has not. Each step states itself in text too. */
export function StepTimeline({ steps, label = "Appointment status" }: { steps: TimelineStep[]; label?: string }) {
  return (
    <ol aria-label={label} className="grid">
      {steps.map((step, index) => {
        const Icon = step.icon ?? (step.state === "warning" || step.state === "danger" ? CircleAlert : Check);
        return (
          <li key={`${step.label}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute top-8 bottom-0 left-[13px] w-0.5 ${
                  step.state === "done" ? "bg-[var(--color-brand)]" : "bg-[var(--color-border)]"
                }`}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`relative grid size-7 shrink-0 place-items-center rounded-full border-2 ${STEP_DOT[step.state]}`}
            >
              {step.state === "upcoming" ? null : <Icon strokeWidth={2.4} className="size-3.5" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p
                  className={`text-[15px] ${
                    step.state === "upcoming" ? "text-[var(--color-text-muted)]" : "font-medium text-[var(--color-text-primary)]"
                  }`}
                >
                  {step.label}
                </p>
                {step.badge}
                <span className="sr-only">
                  {step.state === "done" ? "(done)" : step.state === "upcoming" ? "(not yet)" : "(now)"}
                </span>
              </div>
              {step.detail ? <div className="text-sm text-[var(--color-text-muted)]">{step.detail}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The standard lifecycle of an appointment, for the status timelines. */
export function lifecycleSteps(appointment: AppointmentDetail, timezone: string): TimelineStep[] {
  const at = (value: string | null) =>
    value ? `${formatDate(value, timezone, { month: "short", day: "numeric" })} · ${formatTime(value, timezone)}` : undefined;
  const { lifecycle, pricing, status } = appointment;
  const steps: TimelineStep[] = [{ label: "Booked", detail: at(appointment.createdAt), state: "done" }];

  steps.push(
    pricing.depositPaidCents > 0
      ? { label: `Deposit paid ${formatMoney(pricing.depositPaidCents)}`, state: "done" }
      : { label: "Deposit", detail: "Waiting for the client to pay", state: status === "PENDING_PAYMENT" ? "warning" : "upcoming" },
  );

  if (status === "CANCELLED_BY_CUSTOMER" || status === "CANCELLED_BY_PROFESSIONAL") {
    steps.push({
      label: status === "CANCELLED_BY_CUSTOMER" ? "Cancelled by client" : "Cancelled by business",
      detail: [at(lifecycle.cancelledAt), lifecycle.cancellationReason].filter(Boolean).join(" · "),
      state: "danger",
    });
    return steps;
  }
  if (status === "NO_SHOW") {
    steps.push({ label: "Marked as no-show", detail: at(lifecycle.noShowAt), state: "danger" });
    return steps;
  }

  steps.push(
    lifecycle.checkInAt
      ? { label: "Checked in", detail: at(lifecycle.checkInAt), state: status === "ARRIVED" ? "current" : "done" }
      : { label: "Awaiting arrival", detail: at(appointment.startAt), state: "upcoming" },
  );
  steps.push(
    lifecycle.serviceStartedAt
      ? { label: "In service", detail: at(lifecycle.serviceStartedAt), state: status === "IN_PROGRESS" ? "current" : "done" }
      : { label: "In service", state: "upcoming" },
  );
  steps.push(
    lifecycle.completedAt
      ? { label: "Completed", detail: at(lifecycle.completedAt), state: "done" }
      : { label: "Completed", state: "upcoming" },
  );
  return steps;
}

function MoneyRow({
  label,
  value,
  tone = "default",
  strong = false,
}: {
  label: ReactNode;
  value: string;
  tone?: "default" | "success" | "danger" | "muted";
  strong?: boolean;
}) {
  const color = {
    default: "text-[var(--color-text-primary)]",
    success: "text-[var(--color-success)]",
    danger: "text-[var(--color-danger)]",
    muted: "text-[var(--color-text-muted)]",
  }[tone];
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "font-medium text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}>{label}</dt>
      <dd className={`text-right whitespace-nowrap ${color} ${strong ? "font-display text-2xl" : "font-medium"}`}>{value}</dd>
    </div>
  );
}

/** Where the money for this appointment stands, straight from the server. */
export function PaymentSummary({
  appointment,
  title = "Payment summary",
  footer,
}: {
  appointment: AppointmentDetail;
  title?: string;
  footer?: ReactNode;
}) {
  const { pricing } = appointment;
  return (
    <Card title={title}>
      <dl className="grid gap-2.5 text-[15px]">
        <MoneyRow label="Total" value={formatMoney(pricing.servicePriceCents)} />
        {appointment.service.variations.map((variation) => (
          <div key={variation.label} className="-mt-1 flex justify-between gap-4 pl-3 text-xs text-[var(--color-text-muted)]">
            <dt className="min-w-0 truncate">{variation.label}</dt>
            <dd className="shrink-0">
              {variation.priceDeltaCents >= 0 ? "+" : "−"}
              {formatMoney(Math.abs(variation.priceDeltaCents))}
            </dd>
          </div>
        ))}
        <MoneyRow
          label="Deposit paid"
          value={pricing.depositPaidCents > 0 ? `−${formatMoney(pricing.depositPaidCents)}` : "Not paid"}
          tone={pricing.depositPaidCents > 0 ? "success" : "muted"}
        />
        {pricing.balanceCollectedCents > 0 ? (
          <MoneyRow
            label={`Collected${pricing.balanceCollectionMethod ? ` (${BALANCE_METHOD_LABEL[pricing.balanceCollectionMethod]})` : ""}`}
            value={`−${formatMoney(pricing.balanceCollectedCents)}`}
            tone="success"
          />
        ) : null}
        {pricing.tipCents > 0 ? <MoneyRow label="Tip" value={formatMoney(pricing.tipCents)} /> : null}
        {pricing.refundedCents > 0 ? <MoneyRow label="Refunded" value={formatMoney(pricing.refundedCents)} tone="danger" /> : null}
        {pricing.pendingRefundCents > 0 ? (
          <MoneyRow label="Refund processing" value={formatMoney(pricing.pendingRefundCents)} tone="muted" />
        ) : null}
        <div className="my-1 border-t border-[var(--color-border)]" />
        <MoneyRow
          label={pricing.balanceDueCents > 0 ? "Remaining balance" : "Balance"}
          value={pricing.balanceDueCents > 0 ? formatMoney(pricing.balanceDueCents) : "Paid in full"}
          tone={pricing.balanceDueCents > 0 ? "danger" : "success"}
          strong
        />
      </dl>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </Card>
  );
}

export function Notice({
  tone = "info",
  icon: Icon = Info,
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  icon?: LucideIcon;
  title?: ReactNode;
  children?: ReactNode;
}) {
  const styles = {
    info: "border-[var(--color-info,#2f5e9a)]/20 bg-[var(--color-info-soft,#e6eff9)] text-[var(--color-info,#2f5e9a)]",
    success: "border-[var(--color-success)]/25 bg-[var(--color-success-soft)] text-[var(--color-success)]",
    warning: "border-[var(--color-warning)]/25 bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    danger: "border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  }[tone];
  return (
    <div className={`flex gap-3 rounded-xl border p-3.5 ${styles}`}>
      <Icon aria-hidden="true" strokeWidth={1.8} className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 text-sm text-[var(--color-text-primary)]">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5 text-[var(--color-text-muted)]" : ""}>{children}</div> : null}
      </div>
    </div>
  );
}

/** A large selectable option card with a check badge when chosen. */
export function ChoiceTile({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
  disabled = false,
  disabledReason,
  name,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: LucideIcon;
  title: string;
  description?: string;
  disabled?: boolean;
  disabledReason?: string;
  name: string;
}) {
  return (
    <label
      className={`relative flex min-h-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-brand)] ${
        disabled
          ? "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-strong)] opacity-70"
          : selected
            ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]/40"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      {selected ? (
        <span aria-hidden="true" className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-[var(--color-brand)] text-white">
          <Check strokeWidth={3} className="size-3" />
        </span>
      ) : null}
      <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
        <Icon strokeWidth={1.6} className="size-5" />
      </span>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{title}</span>
      {description ? <span className="text-xs text-[var(--color-text-muted)]">{disabled && disabledReason ? disabledReason : description}</span> : null}
    </label>
  );
}

/** A bottom-of-page action row. Buttons stack full width on phones and sit
 * right-aligned on larger screens; it never floats over content. */
export function ActionBar({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)] sm:p-5">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        {children}
      </div>
      {note ? <p className="text-xs text-[var(--color-text-muted)] sm:text-right">{note}</p> : null}
    </div>
  );
}

/** "In 25 min" / "24 min ago" relative to now. */
export function relativeToNow(iso: string, now: number) {
  const minutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  const abs = Math.abs(minutes);
  const text =
    abs < 60
      ? `${abs} min`
      : abs < 60 * 24
        ? `${Math.floor(abs / 60)} hr${Math.floor(abs / 60) === 1 ? "" : "s"}${abs % 60 ? ` ${abs % 60} min` : ""}`
        : `${Math.round(abs / 1440)} day${Math.round(abs / 1440) === 1 ? "" : "s"}`;
  return { minutes, text: minutes >= 0 ? `in ${text}` : `${text} ago` };
}
