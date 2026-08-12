export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

export type StatusBadgeProps = {
  label: string;
  tone: StatusTone;
  className?: string;
};

const toneClassName: Record<StatusTone, string> = {
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  info: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  neutral: "bg-[var(--color-brand-soft)] text-[var(--color-text-muted)]",
};

const toneIcon: Record<StatusTone, string> = {
  success: "✓",
  warning: "⏳",
  danger: "✕",
  info: "ℹ",
  neutral: "•",
};

/**
 * Status is conveyed by icon glyph + text label, never by background color
 * alone, so the distinction still reads for color-blind users and in
 * high-contrast/forced-colors modes.
 */
export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        toneClassName[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true">{toneIcon[tone]}</span>
      {label}
    </span>
  );
}

const appointmentStatusTone: Record<string, StatusTone> = {
  CONFIRMED: "success",
  PENDING: "warning",
  PENDING_PAYMENT: "warning",
  ARRIVED: "info",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
  NO_SHOW: "danger",
};

const appointmentStatusLabel: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  PENDING_PAYMENT: "Pending",
  ARRIVED: "Arrived",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

export function AppointmentStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      tone={appointmentStatusTone[status] ?? "neutral"}
      label={appointmentStatusLabel[status] ?? status}
    />
  );
}
