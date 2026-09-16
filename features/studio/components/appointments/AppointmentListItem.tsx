"use client";

import { MessageSquareWarning, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/features/studio/components/ui/primitives";
import { useStudio } from "@/features/studio/lib/context";
import {
  formatDate,
  formatDuration,
  formatMoney,
  formatTime,
} from "@/features/studio/lib/format";
import type { AppointmentSummary } from "@/features/studio/lib/types";

/**
 * One appointment as a tappable row. Three columns that never collide:
 * a fixed-width time column, a flexible middle that truncates long names,
 * and a right column that stacks its status and price vertically.
 */
export function AppointmentListItem({
  appointment,
  showDate = false,
}: {
  appointment: AppointmentSummary;
  showDate?: boolean;
}) {
  const { timezone } = useStudio();
  const request = appointment.pendingChangeRequest;

  return (
    <Link
      href={`/studio/appointments/${appointment.id}`}
      className="flex items-stretch gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-subtle)] transition-colors hover:border-[var(--color-brand)] sm:p-4"
    >
      <div className="flex w-[4.75rem] shrink-0 flex-col justify-center border-r border-[var(--color-border)] pr-2 whitespace-nowrap sm:w-24 sm:pr-3">
        {showDate ? (
          <span className="text-[11px] font-semibold tracking-wide text-[var(--color-brand)] uppercase">
            {formatDate(appointment.startAt, timezone, { month: "short", day: "numeric" })}
          </span>
        ) : null}
        <span className="text-[13px] font-bold text-[var(--color-text-primary)] sm:text-sm">
          {formatTime(appointment.startAt, timezone)}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {formatDuration(appointment.durationMins)}
        </span>
      </div>

      <div className="min-w-0 flex-1 self-center">
        <p className="truncate font-semibold text-[var(--color-text-primary)]">
          {appointment.customer.name}
        </p>
        <p className="truncate text-sm text-[var(--color-text-muted)]">
          {appointment.serviceName}
          {appointment.teamMember ? ` · with ${appointment.teamMember.name}` : ""}
        </p>
        {request || appointment.scalpSensitivity || appointment.rescheduleCount > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {request ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-warning)]">
                <MessageSquareWarning aria-hidden="true" className="size-3" />
                {request.type === "RESCHEDULE" ? "Wants to reschedule" : "Wants to cancel"}
              </span>
            ) : null}
            {appointment.scalpSensitivity ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-copper-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-copper)]">
                <TriangleAlert aria-hidden="true" className="size-3" />
                Sensitive scalp
              </span>
            ) : null}
            {appointment.rescheduleCount > 0 ? (
              <span className="rounded-full bg-[var(--color-surface-strong)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
                Rescheduled
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-center gap-1.5">
        <StatusPill status={appointment.status} />
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {formatMoney(appointment.priceCents)}
        </span>
      </div>
    </Link>
  );
}
