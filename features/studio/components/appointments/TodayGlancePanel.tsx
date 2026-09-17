"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Avatar, Card, Pill, ProgressRing } from "@/features/studio/components/ui/primitives";
import { studioFetcher, withQuery } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  addDaysToKey,
  dateKeyIn,
  dayOfWeekOfKey,
  formatMoney,
  formatTime,
  zonedTimeToUtc,
} from "@/features/studio/lib/format";
import type {
  AppointmentsResponse,
  CalendarResponse,
  OverviewResponse,
} from "@/features/studio/lib/types";

const CANCELLED = new Set(["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_PROFESSIONAL"]);

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number) as [number, number];
  return hours * 60 + minutes;
}

function hours(minutes: number) {
  const value = minutes / 60;
  return `${Number.isInteger(value) ? value : value.toFixed(1)}h`;
}

/**
 * "Today at a glance" beside the bookings table. Booked share = minutes of
 * today's non-cancelled bookings divided by today's working minutes; blocked
 * time is shown separately and the rest is available.
 */
export function TodayGlancePanel() {
  const { timezone, can } = useStudio();
  const today = dateKeyIn(new Date(), timezone);
  const from = zonedTimeToUtc(today, "00:00", timezone).toISOString();
  const to = zonedTimeToUtc(addDaysToKey(today, 1), "00:00", timezone).toISOString();

  const { data: overview } = useSWR<OverviewResponse>("/api/v1/business/overview", studioFetcher);
  const { data: calendar } = useSWR<CalendarResponse>(
    can("calendar") ? withQuery("/api/v1/business/calendar", { from, to }) : null,
    studioFetcher,
  );
  const { data: requests } = useSWR<AppointmentsResponse>(
    withQuery("/api/v1/business/appointments", { view: "requests", limit: 3 }),
    studioFetcher,
  );

  const dayStart = new Date(from).getTime();
  const dayEnd = new Date(to).getTime();
  const workingMinutes = (calendar?.workingHours ?? [])
    .filter((rule) => rule.dayOfWeek === dayOfWeekOfKey(today))
    .reduce((total, rule) => total + toMinutes(rule.endTime) - toMinutes(rule.startTime), 0);
  const bookedMinutes = (calendar?.appointments ?? [])
    .filter((appointment) => !CANCELLED.has(appointment.status))
    .reduce((total, appointment) => total + appointment.durationMins, 0);
  const blockedMinutes = (calendar?.blockedPeriods ?? []).reduce((total, period) => {
    const start = Math.max(new Date(period.startAt).getTime(), dayStart);
    const end = Math.min(new Date(period.endAt).getTime(), dayEnd);
    return total + Math.max(0, Math.round((end - start) / 60_000));
  }, 0);
  const bookedShare = workingMinutes > 0 ? Math.min(100, Math.round((bookedMinutes / workingMinutes) * 100)) : 0;
  const available = Math.max(0, workingMinutes - bookedMinutes - blockedMinutes);

  const todaysByMember = new Map<string, number>();
  for (const appointment of calendar?.appointments ?? []) {
    if (CANCELLED.has(appointment.status)) continue;
    const key = appointment.teamMember?.id ?? "owner";
    todaysByMember.set(key, (todaysByMember.get(key) ?? 0) + 1);
  }

  return (
    <div className="grid gap-4">
      <Card title="Today at a glance">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Today&apos;s bookings</p>
            <p className="font-display text-[28px] leading-tight">{overview?.today.booked ?? "–"}</p>
          </div>
          <Link href="/studio/calendar" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline">
            View schedule
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        {calendar ? (
          <div className="mt-4 flex items-center gap-5">
            <ProgressRing value={bookedShare} label="of working time booked" caption="Booked" size={104} stroke={9} />
            <dl className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-[var(--color-brand)]" />
                <dt className="w-20 text-[var(--color-text-muted)]">Booked</dt>
                <dd className="font-medium">{hours(bookedMinutes)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-[var(--color-brand-soft)] ring-1 ring-[var(--color-brand)]/30" />
                <dt className="w-20 text-[var(--color-text-muted)]">Available</dt>
                <dd className="font-medium">{hours(available)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-[var(--color-border-strong,#ddd0cc)]" />
                <dt className="w-20 text-[var(--color-text-muted)]">Blocked</dt>
                <dd className="font-medium">{hours(blockedMinutes)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
        {workingMinutes === 0 && calendar ? (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">No working hours are set for today.</p>
        ) : null}
      </Card>

      {overview?.today.expectedRevenueCents !== null && overview ? (
        <Card title="Revenue today">
          <p className="font-display text-[28px] leading-tight">{formatMoney(overview.today.expectedRevenueCents ?? 0)}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {formatMoney(overview.today.completedRevenueCents ?? 0)} from completed appointments
          </p>
          <Link href="/studio/earnings" className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline">
            View earnings
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Card>
      ) : null}

      {overview?.nextUp ? (
        <Card title="Up next">
          <Link href={`/studio/appointments/${overview.nextUp.id}`} className="flex items-center gap-3 rounded-lg hover:bg-[var(--color-brand-soft)]/40">
            <Avatar name={overview.nextUp.customer.name} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-base">{overview.nextUp.customer.name}</span>
              <span className="block truncate text-sm text-[var(--color-text-muted)]">
                {formatTime(overview.nextUp.startAt, timezone)} – {overview.nextUp.serviceName}
              </span>
            </span>
          </Link>
        </Card>
      ) : null}

      <Card
        title="Pending requests"
        action={
          <Link href="/studio/appointments/requests" className="text-sm font-medium text-[var(--color-brand)] hover:underline">
            View all
          </Link>
        }
      >
        {requests && requests.appointments.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No requests waiting.</p>
        ) : (
          <ul className="grid gap-3">
            {(requests?.appointments ?? []).map((appointment) => (
              <li key={appointment.id}>
                <Link href={`/studio/appointments/requests?id=${appointment.id}`} className="flex items-center gap-3">
                  <Avatar name={appointment.customer.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{appointment.customer.name}</span>
                    <span className="block truncate text-xs text-[var(--color-text-muted)]">{appointment.serviceName}</span>
                  </span>
                  {appointment.pendingChangeRequest ? (
                    <Pill tone="danger">Changes requested</Pill>
                  ) : (
                    <Pill tone="warning">Deposit pending</Pill>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {calendar && calendar.teamMembers.length > 0 ? (
        <Card title="Team today">
          <ul className="grid gap-3">
            {calendar.teamMembers.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <Avatar name={member.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{member.name}</span>
                  <span className="block truncate text-xs text-[var(--color-text-muted)]">{member.jobTitle ?? "Team member"}</span>
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">{todaysByMember.get(member.id) ?? 0} today</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
