"use client";

import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Hourglass,
  MessageSquareWarning,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { ErrorState } from "@/components/shared/ErrorState";
import { AppointmentListItem } from "@/features/studio/components/appointments/AppointmentListItem";
import {
  Avatar,
  Card,
  EmptyPanel,
  PageHeader,
  SkeletonRows,
  StatTile,
  StatusPill,
} from "@/features/studio/components/ui/primitives";
import { studioFetcher } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  formatDate,
  formatMoney,
  formatTime,
  zonedParts,
} from "@/features/studio/lib/format";
import type { AppointmentSummary, OverviewResponse } from "@/features/studio/lib/types";

function greeting(timezone: string) {
  const hour = zonedParts(new Date(), timezone).hour;
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function StudioOverview() {
  const studio = useStudio();
  const { data, error, isLoading, mutate } = useSWR<OverviewResponse>(
    "/api/v1/business/overview",
    studioFetcher,
    { refreshInterval: 60_000 },
  );

  const header = (
    <PageHeader
      title={`${greeting(studio.timezone)}, ${studio.user.firstName}`}
      description={formatDate(new Date(), studio.timezone, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      actions={
        studio.can("calendar") ? (
          <Link href="/studio/calendar" className="btn-secondary">
            <CalendarDays aria-hidden="true" className="size-4" />
            Open calendar
          </Link>
        ) : null
      }
    />
  );

  if (isLoading && !data) {
    return (
      <div className="grid *:min-w-0 gap-6">
        {header}
        <SkeletonRows label="Loading today" rows={4} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="grid *:min-w-0 gap-6">
        {header}
        <ErrorState description="We couldn't load today's overview." onRetry={() => void mutate()} />
      </div>
    );
  }

  if (!data) return header;

  const attention: Array<{ key: string; href: string; icon: LucideIcon; text: string }> = [];
  const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);
  if (data.attention.pendingChangeRequests > 0) {
    attention.push({
      key: "requests",
      href: "/studio/appointments?view=requests",
      icon: MessageSquareWarning,
      text: `${data.attention.pendingChangeRequests} client ${plural(
        data.attention.pendingChangeRequests,
        "request needs",
        "requests need",
      )} an answer`,
    });
  }
  if (data.attention.overdueCheckIns > 0) {
    attention.push({
      key: "overdue",
      href: "/studio/appointments?view=today",
      icon: ClipboardCheck,
      text: `${data.attention.overdueCheckIns} ${plural(
        data.attention.overdueCheckIns,
        "client has",
        "clients have",
      )} not been checked in`,
    });
  }
  if (data.attention.awaitingPayment > 0) {
    attention.push({
      key: "payment",
      href: "/studio/appointments?view=requests",
      icon: Wallet,
      text: `${data.attention.awaitingPayment} ${plural(
        data.attention.awaitingPayment,
        "booking is",
        "bookings are",
      )} waiting for a deposit`,
    });
  }
  if (data.attention.activeWaitlist && studio.can("waitlist")) {
    attention.push({
      key: "waitlist",
      href: "/studio/waitlist",
      icon: Hourglass,
      text: `${data.attention.activeWaitlist} ${plural(
        data.attention.activeWaitlist,
        "client is",
        "clients are",
      )} on the waitlist`,
    });
  }

  return (
    <div className="grid *:min-w-0 gap-6">
      {header}

      {attention.length > 0 ? (
        <ul className="grid *:min-w-0 gap-2 md:grid-cols-2">
          {attention.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--color-warning)]/25 bg-[var(--color-warning-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-warning)]"
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-[var(--color-warning)]" />
                  <span className="min-w-0 flex-1">{item.text}</span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="grid *:min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Booked today"
          value={data.today.booked}
          hint={`${data.today.remaining} still to come`}
        />
        <StatTile
          label="Completed"
          value={data.today.completed}
          hint={
            data.today.noShows > 0
              ? `${data.today.noShows} no-show${data.today.noShows === 1 ? "" : "s"}`
              : `${data.today.inChair} in the chair`
          }
        />
        {data.today.expectedRevenueCents !== null ? (
          <StatTile
            label="Expected today"
            value={formatMoney(data.today.expectedRevenueCents)}
            hint={`${formatMoney(data.today.completedRevenueCents ?? 0)} completed`}
          />
        ) : (
          <StatTile label="In the chair" value={data.today.inChair} hint="Checked in or in service" />
        )}
        <StatTile
          label="This week"
          value={
            data.week.revenueCents !== null
              ? formatMoney(data.week.revenueCents)
              : `${data.week.bookings} bookings`
          }
          hint={data.week.revenueCents !== null ? `${data.week.bookings} bookings` : "Monday to Sunday"}
        />
      </div>

      <div className="grid *:min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card
          title="Today's schedule"
          action={
            studio.can("appointments") ? (
              <Link
                href="/studio/appointments?view=today"
                className="text-sm font-semibold text-[var(--color-brand)] hover:underline"
              >
                View all
              </Link>
            ) : null
          }
        >
          {data.schedule.length === 0 ? (
            <EmptyPanel
              icon={<CalendarDays aria-hidden="true" className="size-6" />}
              title="No appointments today"
              description="Bookings clients make for today will appear here."
            />
          ) : (
            <ul className="grid *:min-w-0 gap-2">
              {data.schedule.map((appointment) => (
                <li key={appointment.id}>
                  <AppointmentListItem appointment={appointment} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid *:min-w-0 content-start gap-4">
          <SpotlightCard
            title="In the chair"
            appointment={data.nowServing}
            empty="Nobody is checked in right now."
            timezone={studio.timezone}
          />
          <SpotlightCard
            title="Next up"
            appointment={data.nextUp}
            empty="No more confirmed appointments today."
            timezone={studio.timezone}
          />
          <Card title="Coming up this week">
            {data.comingUp.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Nothing booked for the next seven days yet.
              </p>
            ) : (
              <ul className="grid *:min-w-0 gap-2">
                {data.comingUp.map((appointment) => (
                  <li key={appointment.id}>
                    <Link
                      href={`/studio/appointments/${appointment.id}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--color-brand-soft)]"
                    >
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-[11px] font-semibold text-[var(--color-brand)] uppercase">
                          {formatDate(appointment.startAt, studio.timezone, { weekday: "short" })}
                        </p>
                        <p className="text-sm font-bold text-[var(--color-text-primary)]">
                          {formatTime(appointment.startAt, studio.timezone)}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {appointment.customer.name}
                        </p>
                        <p className="truncate text-xs text-[var(--color-text-muted)]">
                          {appointment.serviceName}
                        </p>
                      </div>
                      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[var(--color-text-muted)]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function SpotlightCard({
  title,
  appointment,
  empty,
  timezone,
}: {
  title: string;
  appointment: AppointmentSummary | null;
  empty: string;
  timezone: string;
}) {
  return (
    <Card title={title}>
      {appointment ? (
        <Link
          href={`/studio/appointments/${appointment.id}`}
          className="flex items-center gap-3 rounded-xl p-1 hover:bg-[var(--color-brand-soft)]"
        >
          <Avatar name={appointment.customer.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[var(--color-text-primary)]">
              {appointment.customer.name}
            </p>
            <p className="truncate text-sm text-[var(--color-text-muted)]">
              {appointment.serviceName} · {formatTime(appointment.startAt, timezone)}
            </p>
          </div>
          <div className="shrink-0">
            <StatusPill status={appointment.status} />
          </div>
        </Link>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">{empty}</p>
      )}
    </Card>
  );
}
