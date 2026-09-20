import { CircleCheck, CircleX, Eye, Hourglass } from "lucide-react";
import type { ApplicationStatus } from "@/features/admin/lib/admin-types";

/**
 * Status as a word and a shape, never as a colour alone - the difference
 * between approved and rejected is the difference between a live business
 * and a refused one, and it must survive a monochrome screen or a reader
 * who can't separate red from green.
 */
const STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string; icon: typeof CircleCheck }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    icon: Hourglass,
  },
  UNDER_REVIEW: {
    label: "Under review",
    className: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
    icon: Eye,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    icon: CircleCheck,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    icon: CircleX,
  },
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-bold ${meta.className}`}
    >
      <Icon aria-hidden="true" size={13} />
      {meta.label}
    </span>
  );
}
