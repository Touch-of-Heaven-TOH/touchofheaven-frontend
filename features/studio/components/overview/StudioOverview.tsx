"use client";

import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  Clock,
  DollarSign,
  EllipsisVertical,
  Inbox,
  Scissors,
  Sun,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ErrorState } from "@/components/shared/ErrorState";
import { BlockTimeDialog } from "@/features/studio/components/calendar/BlockTimeDialog";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import {
  Avatar,
  Card,
  ChangeLabel,
  KpiCard,
  Pill,
  ProgressRing,
  SkeletonRows,
  StatusPill,
} from "@/features/studio/components/ui/primitives";
import { studioFetcher, withQuery } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  addDaysToKey,
  formatDuration,
  formatMoney,
  formatTime,
  keyToLabel,
  zonedParts,
} from "@/features/studio/lib/format";
import type {
  AppointmentSummary,
  BlockType,
  OverviewResponse,
  ProfileHealth,
  WeeklyRevenue,
} from "@/features/studio/lib/types";

function greeting(timezone: string) {
  const hour = zonedParts(new Date(), timezone).hour;
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function minutesUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
}

function relativeStart(iso: string) {
  const minutes = minutesUntil(iso);
  if (minutes <= 0) return minutes > -15 ? "Starting now" : "Started";
  if (minutes < 60) return `In ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `In ${hours} hr${hours === 1 ? "" : "s"}` : `In ${Math.floor(hours / 24)} days`;
}

export function StudioOverview() {
  const studio = useStudio();
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);
  const [blockType, setBlockType] = useState<BlockType | null>(null);

  const { data, error, isLoading, isValidating, mutate } = useSWR<OverviewResponse>(
    withQuery("/api/v1/business/overview", { date: scheduleDate }),
    studioFetcher,
    { refreshInterval: 60_000, keepPreviousData: true },
  );

  const header = (
    <header className="flex items-start gap-3">
      <Sun aria-hidden="true" strokeWidth={1.4} className="mt-1 size-8 shrink-0 text-[var(--color-gold)] sm:size-9" />
      <div className="min-w-0">
        <h1 className="font-display text-[28px] leading-tight text-[var(--color-text-primary)] sm:text-[34px]">
          {greeting(studio.timezone)}, {studio.user.firstName}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)] sm:text-[15px]">
          {keyToLabel(data?.date ?? new Date().toISOString().slice(0, 10), {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          <span className="sm:hidden"> · Here&apos;s your business today.</span>
        </p>
      </div>
    </header>
  );

  if (isLoading && !data) {
    return (
      <div className="grid gap-6">
        {header}
        <SkeletonRows label="Loading your business overview" rows={4} />
      </div>
    );
  }
  if (error && !data) {
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState description="We couldn't load today's overview." onRetry={() => void mutate()} />
      </div>
    );
  }
  if (!data) return header;

  const pendingRequests = data.attention.pendingChangeRequests + data.attention.awaitingPayment;
  const selectedDate = data.scheduleDate;
  const isToday = selectedDate === data.date;
  const canMoney = data.today.expectedRevenueCents !== null;

  const kpis = (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      <KpiCard
        compact
        icon={CalendarDays}
        label="Today's bookings"
        value={data.today.booked}
        href="/studio/appointments?tab=today"
        linkLabel="View schedule"
      />
      {canMoney ? (
        <KpiCard
          compact
          icon={DollarSign}
          tone="gold"
          label="Expected revenue"
          value={formatMoney(data.today.expectedRevenueCents ?? 0)}
          href={studio.can("earnings") ? "/studio/earnings" : "/studio/analytics"}
          linkLabel="View earnings"
        />
      ) : (
        <KpiCard
          compact
          icon={Clock}
          tone="gold"
          label="In the chair"
          value={data.today.inChair}
          href="/studio/appointments?tab=today"
          linkLabel="View today"
        />
      )}
      <KpiCard
        compact className="sm:hidden"
        icon={Inbox}
        label="Pending requests"
        value={pendingRequests}
        href="/studio/appointments/requests"
        linkLabel="View requests"
      />
      <KpiCard
        compact className="hidden sm:flex"
        icon={UserRoundPlus}
        label="New clients"
        value={data.today.newClients}
        href="/studio/clients"
        linkLabel="View clients"
      />
    </div>
  );

  return (
    <div className="grid gap-5 sm:gap-6">
      {header}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] xl:items-start">
        {/* Main column */}
        <div className="grid min-w-0 gap-5">
          {kpis}

          {data.profileHealth ? (
            <div className="xl:hidden">
              <ProfileHealthCard health={data.profileHealth} />
            </div>
          ) : null}
          {data.nextUp || data.nowServing ? (
            <div className="xl:hidden">
              <AttentionCard appointment={(data.nowServing ?? data.nextUp)!} />
            </div>
          ) : null}

          <Card
            title={isToday ? "Today's schedule" : `Schedule · ${keyToLabel(selectedDate, { weekday: "short", month: "short", day: "numeric" })}`}
            icon={CalendarDays}
            padded={false}
            action={
              <div className="flex items-center gap-2">
                <Link href="/studio/calendar" className="btn-secondary !min-h-10 !px-3 !font-medium">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">View calendar</span>
                  <span className="sm:hidden">Calendar</span>
                </Link>
                <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]">
                  <button
                    type="button"
                    aria-label="Previous day"
                    onClick={() => setScheduleDate(addDaysToKey(selectedDate, -1))}
                    className="grid size-10 place-items-center hover:bg-[var(--color-brand-soft)]"
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next day"
                    onClick={() => setScheduleDate(addDaysToKey(selectedDate, 1))}
                    className="grid size-10 place-items-center border-l border-[var(--color-border)] hover:bg-[var(--color-brand-soft)]"
                  >
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            }
          >
            <div className={`transition-opacity ${isValidating && scheduleDate ? "opacity-60" : ""}`}>
              {data.schedule.length === 0 ? (
                <div className="grid justify-items-center gap-2 border-t border-[var(--color-border)] px-6 py-10 text-center">
                  <CalendarDays aria-hidden="true" strokeWidth={1.4} className="size-10 text-[var(--color-gold)]" />
                  <p className="font-display text-lg">No appointments {isToday ? "today" : "this day"}</p>
                  <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
                    Bookings clients make will appear here in time order.
                  </p>
                </div>
              ) : (
                <ol className="border-t border-[var(--color-border)]">
                  {data.schedule.map((appointment, index) => (
                    <ScheduleRow
                      key={appointment.id}
                      appointment={appointment}
                      last={index === data.schedule.length - 1}
                    />
                  ))}
                </ol>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:px-6">
                {!isToday ? (
                  <button
                    type="button"
                    onClick={() => setScheduleDate(null)}
                    className="min-h-10 text-sm font-medium text-[var(--color-brand)] hover:underline"
                  >
                    Back to today
                  </button>
                ) : (
                  <span />
                )}
                <Link
                  href="/studio/appointments?tab=today"
                  className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[var(--color-brand)] hover:underline"
                >
                  View full day
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          </Card>

          <div className="xl:hidden">
            {data.weeklyRevenue ? <WeeklyRevenueCard revenue={data.weeklyRevenue} /> : null}
          </div>
          <div className="xl:hidden">
            <QuickActions onBlock={setBlockType} />
          </div>

          <UpcomingWeekCard data={data} />
        </div>

        {/* Right column (desktop) */}
        <div className="hidden min-w-0 gap-5 xl:grid">
          {data.profileHealth ? <ProfileHealthCard health={data.profileHealth} /> : null}
          <QuickActions onBlock={setBlockType} />
          {data.weeklyRevenue ? <WeeklyRevenueCard revenue={data.weeklyRevenue} /> : null}
          {data.nowServing || data.nextUp ? (
            <AttentionCard appointment={(data.nowServing ?? data.nextUp)!} />
          ) : (
            <Card title="Needs your attention" icon={BellRing}>
              <p className="text-sm text-[var(--color-text-muted)]">
                Nothing urgent. Your next confirmed booking will show here.
              </p>
            </Card>
          )}
        </div>
      </div>

      {blockType ? <BlockTimeDialog open onClose={() => setBlockType(null)} initialType={blockType} /> : null}
    </div>
  );
}

function ScheduleRow({ appointment, last }: { appointment: AppointmentSummary; last: boolean }) {
  const { timezone } = useStudio();
  return (
    <li className="relative flex items-center gap-3 border-b border-[var(--color-border)] py-3 pr-2 pl-4 last:border-b-0 sm:gap-4 sm:pr-4 sm:pl-12">
      <span aria-hidden="true" className="absolute top-1/2 left-6 hidden size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-brand)] sm:block" />
      {!last ? (
        <span aria-hidden="true" className="absolute top-1/2 left-6 hidden h-full w-px -translate-x-1/2 bg-[var(--color-brand)]/35 sm:block" />
      ) : null}
      <div className="w-[4.5rem] shrink-0 sm:w-24">
        <p className="text-sm font-medium whitespace-nowrap text-[var(--color-text-primary)]">
          {formatTime(appointment.startAt, timezone)}
        </p>
        <p className="text-xs whitespace-nowrap text-[var(--color-text-muted)]">{formatDuration(appointment.durationMins)}</p>
      </div>
      <Link
        href={`/studio/appointments/${appointment.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg after:absolute after:inset-0 after:content-['']"
      >
        <Avatar name={appointment.customer.name} size="md" />
        <span className="min-w-0">
          <span className="block truncate font-display text-base text-[var(--color-text-primary)] sm:text-[17px]">
            {appointment.customer.name}
          </span>
          <span className="block truncate text-sm text-[var(--color-text-muted)]">{appointment.serviceName}</span>
        </span>
      </Link>
      <div className="relative z-10 hidden shrink-0 sm:block">
        <StatusPill status={appointment.status} />
      </div>
      <RowMenu appointmentId={appointment.id} />
    </li>
  );
}

function RowMenu({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const href = `/studio/appointments/${appointmentId}`;
  return (
    <div ref={ref} className="relative z-10 shrink-0">
      <button
        type="button"
        aria-label="Booking actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-10 place-items-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
      >
        <EllipsisVertical aria-hidden="true" className="size-5" />
      </button>
      {open ? (
        <div className="absolute top-11 right-0 z-30 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-soft)]">
          {[
            { label: "View booking", href },
            { label: "Check in or complete", href },
            { label: "Reschedule or cancel", href },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-[var(--color-brand-soft)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProfileHealthCard({ health }: { health: ProfileHealth }) {
  const [open, setOpen] = useState(false);
  const remaining = health.checks.filter((check) => !check.done);
  return (
    <Card
      title="Business profile health"
      action={remaining.length > 0 ? <Pill tone="gold">Setup in progress</Pill> : <Pill tone="success">Complete</Pill>}
    >
      <div className="flex items-center gap-5">
        <ProgressRing value={health.score} label="profile complete" caption={health.label} size={112} stroke={9} />
        <div className="min-w-0">
          <p className="text-sm text-[var(--color-text-muted)]">
            {remaining.length === 0
              ? "You're all set! Keep your profile updated to attract more clients."
              : `${remaining.length} step${remaining.length === 1 ? "" : "s"} left to help clients find and trust you.`}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            Review suggestions
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      <StudioDialog open={open} onClose={() => setOpen(false)} title="Profile health" description={`${health.score}% complete`} size="sm">
        <ul className="grid gap-2">
          {health.checks.map((check) => (
            <li key={check.key}>
              <Link
                href={check.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 hover:border-[var(--color-brand)]"
              >
                {check.done ? (
                  <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-[var(--color-success)]" />
                ) : (
                  <CircleDashed aria-hidden="true" className="size-5 shrink-0 text-[var(--color-gold)]" />
                )}
                <span className="min-w-0 flex-1 text-sm">
                  {check.label}
                  <span className="sr-only">{check.done ? " (done)" : " (to do)"}</span>
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">{check.weight}%</span>
              </Link>
            </li>
          ))}
        </ul>
      </StudioDialog>
    </Card>
  );
}

function QuickActions({ onBlock }: { onBlock: (type: BlockType) => void }) {
  const studio = useStudio();
  const tile =
    "flex min-h-14 items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm whitespace-nowrap hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]";
  return (
    <Card title="Quick actions">
      <div className="grid grid-cols-2 gap-3">
        {studio.isOwner ? (
          <button type="button" onClick={() => onBlock("MANUAL_APPOINTMENT")} className={`${tile} text-[var(--color-brand)]`}>
            <CalendarPlus aria-hidden="true" strokeWidth={1.6} className="size-5 shrink-0" />
            Add booking
          </button>
        ) : null}
        {studio.isOwner ? (
          <button type="button" onClick={() => onBlock("PERSONAL")} className={`${tile} text-[var(--color-gold-text,#8f5a1d)]`}>
            <Clock aria-hidden="true" strokeWidth={1.6} className="size-5 shrink-0 text-[var(--color-gold)]" />
            Block time
          </button>
        ) : null}
        {studio.isOwner ? (
          <Link href="/studio/services/new" className={`${tile} text-[var(--color-gold-text,#8f5a1d)]`}>
            <Scissors aria-hidden="true" strokeWidth={1.6} className="size-5 shrink-0 text-[var(--color-gold)]" />
            Add service
          </Link>
        ) : null}
        <Link href="/studio/appointments/requests" className={`${tile} text-[var(--color-brand)]`}>
          <Inbox aria-hidden="true" strokeWidth={1.6} className="size-5 shrink-0" />
          View requests
        </Link>
      </div>
    </Card>
  );
}

function niceCeil(value: number) {
  if (value <= 0) return 100_00;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

function compactMoney(cents: number) {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${Number.isInteger(dollars / 1000) ? dollars / 1000 : (dollars / 1000).toFixed(1)}k`;
  return `$${Math.round(dollars)}`;
}

function WeeklyRevenueCard({ revenue }: { revenue: WeeklyRevenue }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceCeil(Math.max(...revenue.days.map((day) => day.revenueCents)));
  const ticks = [max, max / 2, 0];
  const activeDay = active === null ? null : revenue.days[active];

  return (
    <Card title="Weekly revenue" action={<span className="text-sm text-[var(--color-text-muted)]">This week</span>}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-display text-[28px] leading-none">{formatMoney(revenue.totalCents)}</p>
        <ChangeLabel basisPoints={revenue.changeBp} />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="relative h-36 w-10 shrink-0 text-right text-[11px] text-[var(--color-text-muted)]">
          {ticks.map((tick, index) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: `${index * 50}%` }}>
              {compactMoney(tick)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" onPointerLeave={() => setActive(null)}>
          <div className="relative h-36">
            {ticks.map((tick, index) => (
              <span key={tick} aria-hidden="true" className="absolute inset-x-0 border-t border-[var(--color-border)]" style={{ top: `${index * 50}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end">
              {revenue.days.map((day, index) => {
                const height = (day.revenueCents / max) * 100;
                return (
                  <button
                    key={day.key}
                    type="button"
                    aria-label={`${keyToLabel(day.key, { weekday: "long" })}: ${formatMoney(day.revenueCents)}`}
                    onPointerEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    className={`relative flex h-full min-w-0 flex-1 items-end justify-center rounded-md px-px ${
                      day.isToday ? "bg-[var(--color-gold-light)]/60" : ""
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`block w-full max-w-5 rounded-t-[4px] ${
                        day.isFuture ? "bg-[var(--color-brand-soft)]" : "bg-[var(--color-brand)]"
                      } ${active === index ? "opacity-80" : ""}`}
                      style={{ height: `${day.revenueCents > 0 ? Math.max(height, 3) : 0}%` }}
                    />
                  </button>
                );
              })}
            </div>
            {activeDay && active !== null ? (
              <div
                role="status"
                className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-center shadow-[var(--shadow-soft)]"
                style={{ left: `clamp(2.5rem, ${((active + 0.5) / 7) * 100}%, calc(100% - 2.5rem))` }}
              >
                <p className="text-sm font-bold whitespace-nowrap">{formatMoney(activeDay.revenueCents)}</p>
                <p className="text-[11px] whitespace-nowrap text-[var(--color-text-muted)]">
                  {keyToLabel(activeDay.key, { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>
            ) : null}
          </div>
          <div aria-hidden="true" className="mt-2 flex text-[11px] text-[var(--color-text-muted)]">
            {revenue.days.map((day) => (
              <span key={day.key} className={`flex-1 text-center ${day.isToday ? "font-medium text-[var(--color-text-primary)]" : ""}`}>
                {keyToLabel(day.key, { weekday: "short" })}
              </span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>Revenue by day this week</caption>
        <tbody>
          {revenue.days.map((day) => (
            <tr key={day.key}>
              <th scope="row">{keyToLabel(day.key, { weekday: "long" })}</th>
              <td>{formatMoney(day.revenueCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function AttentionCard({ appointment }: { appointment: AppointmentSummary }) {
  const { timezone } = useStudio();
  const inChair = appointment.status === "ARRIVED" || appointment.status === "IN_PROGRESS";
  const note = appointment.pendingChangeRequest
    ? appointment.pendingChangeRequest.type === "RESCHEDULE"
      ? "The client has asked to reschedule."
      : "The client has asked to cancel."
    : appointment.scalpSensitivity
      ? "Sensitive scalp noted in the consultation. Plan for lighter tension."
      : inChair
        ? "Client is in the studio."
        : "Confirm the station and products are ready before they arrive.";
  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--color-brand)]/60 bg-[var(--color-brand-soft)]/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] text-[var(--color-brand)]">
          <BellRing aria-hidden="true" strokeWidth={1.6} className="size-5" />
          {inChair ? "In the chair" : "Needs your attention"}
        </h2>
        <span className="text-sm font-medium text-[var(--color-brand)]">
          {inChair ? formatTime(appointment.startAt, timezone) : relativeStart(appointment.startAt)}
        </span>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <Avatar name={appointment.customer.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg">{appointment.customer.name}</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            {formatTime(appointment.startAt, timezone)} – {appointment.serviceName}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-primary)]">{note}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          href={`/studio/appointments/${appointment.id}`}
          className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
        >
          View booking
        </Link>
      </div>
    </section>
  );
}

function UpcomingWeekCard({ data }: { data: OverviewResponse }) {
  const week = data.upcomingWeek;
  const metrics = [
    { label: "Total bookings", value: String(week.bookings), change: week.changes.bookingsBp },
    ...(week.expectedRevenueCents !== null
      ? [{ label: "Expected revenue", value: formatMoney(week.expectedRevenueCents), change: week.changes.expectedRevenueBp }]
      : []),
    { label: "New clients", value: String(week.newClients), change: week.changes.newClientsBp },
    { label: "Returning clients", value: String(week.returningClients), change: week.changes.returningClientsBp },
  ];
  return (
    <Card title="Upcoming this week" icon={CalendarDays}>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:divide-x lg:divide-[var(--color-border)]">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 lg:px-4 lg:first:pl-0">
            <dt className="text-sm text-[var(--color-text-muted)]">{metric.label}</dt>
            <dd className="mt-1 font-display text-2xl">{metric.value}</dd>
            <dd className="mt-1">
              <ChangeLabel basisPoints={metric.change} />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
