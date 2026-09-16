"use client";

import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { AppointmentListItem } from "@/features/studio/components/appointments/AppointmentListItem";
import {
  BLOCK_TYPE_LABEL,
  BlockTimeDialog,
} from "@/features/studio/components/calendar/BlockTimeDialog";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import {
  PageHeader,
  Segmented,
  SelectField,
  toneAccentClass,
} from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import {
  errorMessage,
  studioFetcher,
  studioRequest,
  withQuery,
} from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  APPOINTMENT_STATUS,
  WEEKDAY_SHORT,
  addDaysToKey,
  dateKeyIn,
  dayOfWeekOfKey,
  formatTime,
  keyToLabel,
  minutesIntoDay,
  startOfWeekKey,
  zonedTimeToUtc,
} from "@/features/studio/lib/format";
import type {
  AppointmentSummary,
  CalendarBlockedPeriod,
  CalendarResponse,
} from "@/features/studio/lib/types";

type View = "day" | "week" | "month";

const HOUR_PX = 64;

function subscribeDesktop(callback: () => void) {
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}

function shiftMonth(key: string, months: number) {
  const [year, month] = key.split("-").map(Number) as [number, number];
  const total = year * 12 + (month - 1) + months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number) as [number, number];
  return hours * 60 + minutes;
}

type DayEvent =
  | { kind: "appointment"; id: string; startMin: number; endMin: number; appointment: AppointmentSummary }
  | { kind: "block"; id: string; startMin: number; endMin: number; block: CalendarBlockedPeriod };

type PlacedEvent = DayEvent & { lane: number; lanes: number };

/** Side-by-side lanes for overlapping events, so two blocks sharing a
 * time never render on top of each other. */
function layoutDay(events: DayEvent[]): PlacedEvent[] {
  const sorted = [...events].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const placed: PlacedEvent[] = [];
  let cluster: PlacedEvent[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const event of cluster) event.lanes = laneEnds.length;
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const event of sorted) {
    if (event.startMin >= clusterEnd && cluster.length > 0) flush();
    let lane = laneEnds.findIndex((end) => end <= event.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(event.endMin);
    } else {
      laneEnds[lane] = event.endMin;
    }
    cluster.push({ ...event, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, event.endMin);
  }
  if (cluster.length > 0) flush();
  return placed;
}

export function StudioCalendar() {
  const studio = useStudio();
  const timezone = studio.timezone;
  const isDesktop = useIsDesktop();
  const today = dateKeyIn(new Date(), timezone);

  const [chosenView, setChosenView] = useState<View | null>(null);
  const view: View = chosenView ?? (isDesktop ? "week" : "day");
  const [anchor, setAnchor] = useState(today);
  const [teamMemberId, setTeamMemberId] = useState("");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlockedPeriod | null>(null);

  const range = useMemo(() => {
    if (view === "day") return { startKey: anchor, days: 1 };
    if (view === "week") return { startKey: startOfWeekKey(anchor), days: 7 };
    return { startKey: startOfWeekKey(`${anchor.slice(0, 7)}-01`), days: 42 };
  }, [view, anchor]);

  const dayKeys = useMemo(
    () => Array.from({ length: range.days }, (_, index) => addDaysToKey(range.startKey, index)),
    [range],
  );

  const from = zonedTimeToUtc(range.startKey, "00:00", timezone).toISOString();
  const to = zonedTimeToUtc(addDaysToKey(range.startKey, range.days), "00:00", timezone).toISOString();
  const key = withQuery("/api/v1/business/calendar", { from, to, teamMemberId });
  const { data, error, isLoading, mutate } = useSWR<CalendarResponse>(key, studioFetcher, {
    keepPreviousData: true,
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>(dayKeys.map((dayKey) => [dayKey, []]));
    if (!data) return map;
    for (const appointment of data.appointments) {
      const dayKey = dateKeyIn(new Date(appointment.startAt), timezone);
      const startMin = minutesIntoDay(new Date(appointment.startAt), timezone);
      map.get(dayKey)?.push({
        kind: "appointment",
        id: appointment.id,
        startMin,
        endMin: Math.max(startMin + 15, startMin + appointment.durationMins),
        appointment,
      });
    }
    for (const block of data.blockedPeriods) {
      const blockStart = new Date(block.startAt).getTime();
      const blockEnd = new Date(block.endAt).getTime();
      for (const dayKey of dayKeys) {
        const dayStart = zonedTimeToUtc(dayKey, "00:00", timezone).getTime();
        const dayEnd = zonedTimeToUtc(addDaysToKey(dayKey, 1), "00:00", timezone).getTime();
        if (blockEnd <= dayStart || blockStart >= dayEnd) continue;
        const startMin = Math.round((Math.max(blockStart, dayStart) - dayStart) / 60_000);
        const endMin = Math.round((Math.min(blockEnd, dayEnd) - dayStart) / 60_000);
        map.get(dayKey)?.push({ kind: "block", id: `${block.id}-${dayKey}`, startMin, endMin, block });
      }
    }
    return map;
  }, [data, dayKeys, timezone]);

  const title =
    view === "day"
      ? keyToLabel(anchor, { weekday: "long", month: "long", day: "numeric" })
      : view === "week"
        ? `${keyToLabel(range.startKey, { month: "short", day: "numeric" })} – ${keyToLabel(
            addDaysToKey(range.startKey, 6),
            { month: "short", day: "numeric", year: "numeric" },
          )}`
        : keyToLabel(`${anchor.slice(0, 7)}-01`, { month: "long", year: "numeric" });

  const step = (direction: 1 | -1) => {
    if (view === "day") setAnchor((value) => addDaysToKey(value, direction));
    else if (view === "week") setAnchor((value) => addDaysToKey(value, 7 * direction));
    else setAnchor((value) => shiftMonth(value, direction));
  };

  const openDay = (dayKey: string) => {
    setAnchor(dayKey);
    setChosenView("day");
  };

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader
        title="Calendar"
        description={`All times in ${timezone}.`}
        actions={
          studio.isOwner ? (
            <Button leadingIcon={<Plus aria-hidden="true" className="size-4" />} onClick={() => setBlockDialogOpen(true)}>
              Block time
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-subtle)] md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button variant="secondary" className="!min-h-10" onClick={() => setAnchor(today)}>
            Today
          </Button>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={`Previous ${view}`}
              className="grid size-10 place-items-center rounded-full hover:bg-[var(--color-brand-soft)]"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={`Next ${view}`}
              className="grid size-10 place-items-center rounded-full hover:bg-[var(--color-brand-soft)]"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
          <h2 className="min-w-0 text-base font-semibold text-[var(--color-text-primary)] sm:text-lg" aria-live="polite">
            {title}
          </h2>
        </div>
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          {data && data.teamMembers.length > 0 && studio.appointmentScope === "all" ? (
            <div className="w-full sm:w-56">
              <SelectField
                label="Team member"
                value={teamMemberId}
                onChange={(event) => setTeamMemberId(event.target.value)}
              >
                <option value="">Everyone</option>
                {data.teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </SelectField>
            </div>
          ) : null}
          <Segmented
            label="Calendar view"
            value={view}
            onChange={(value) => setChosenView(value)}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </div>
      </div>

      {error && !data ? (
        <ErrorState description="We couldn't load the calendar." onRetry={() => void mutate()} />
      ) : !data && isLoading ? (
        <div role="status" className="h-[32rem] animate-pulse rounded-2xl bg-[var(--color-skeleton)]">
          <span className="sr-only">Loading calendar</span>
        </div>
      ) : data ? (
        view === "month" ? (
          <MonthGrid
            dayKeys={dayKeys}
            monthKey={anchor.slice(0, 7)}
            today={today}
            eventsByDay={eventsByDay}
            timezone={timezone}
            onOpenDay={openDay}
          />
        ) : view === "week" && !isDesktop ? (
          <WeekAgenda
            dayKeys={dayKeys}
            today={today}
            eventsByDay={eventsByDay}
            timezone={timezone}
            onOpenDay={openDay}
            onSelectBlock={setSelectedBlock}
          />
        ) : (
          <TimeGrid
            dayKeys={dayKeys}
            today={today}
            data={data}
            eventsByDay={eventsByDay}
            timezone={timezone}
            onOpenDay={openDay}
            onSelectBlock={setSelectedBlock}
          />
        )
      ) : null}

      {blockDialogOpen ? (
        <BlockTimeDialog open onClose={() => setBlockDialogOpen(false)} initialDate={anchor} />
      ) : null}
      <BlockDetailDialog
        block={selectedBlock}
        timezone={timezone}
        canDelete={studio.isOwner}
        onClose={() => setSelectedBlock(null)}
        onDeleted={() => {
          setSelectedBlock(null);
          void mutate();
        }}
      />
    </div>
  );
}

function TimeGrid({
  dayKeys,
  today,
  data,
  eventsByDay,
  timezone,
  onOpenDay,
  onSelectBlock,
}: {
  dayKeys: string[];
  today: string;
  data: CalendarResponse;
  eventsByDay: Map<string, DayEvent[]>;
  timezone: string;
  onOpenDay: (dayKey: string) => void;
  onSelectBlock: (block: CalendarBlockedPeriod) => void;
}) {
  const allEvents = dayKeys.flatMap((dayKey) => eventsByDay.get(dayKey) ?? []);
  const workingForDays = data.workingHours.filter((rule) =>
    dayKeys.some((dayKey) => dayOfWeekOfKey(dayKey) === rule.dayOfWeek),
  );
  const earliest = Math.min(
    7 * 60,
    ...workingForDays.map((rule) => timeToMinutes(rule.startTime)),
    ...allEvents.map((event) => event.startMin),
  );
  const latest = Math.max(
    20 * 60,
    ...workingForDays.map((rule) => timeToMinutes(rule.endTime)),
    ...allEvents.map((event) => event.endMin),
  );
  const startHour = Math.max(0, Math.floor(earliest / 60));
  const endHour = Math.min(24, Math.ceil(latest / 60));
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const gridHeight = hours.length * HOUR_PX;
  const nowMinutes = minutesIntoDay(new Date(), timezone);
  const isWeek = dayKeys.length > 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-subtle)]">
      <div className="max-h-[calc(100dvh-17rem)] min-h-[28rem] overflow-auto">
        <div className={isWeek ? "min-w-[760px]" : ""}>
          <div
            className="sticky top-0 z-20 grid border-b border-[var(--color-border)] bg-[var(--color-surface)]"
            style={{ gridTemplateColumns: `3.5rem repeat(${dayKeys.length}, minmax(0, 1fr))` }}
          >
            <div />
            {dayKeys.map((dayKey) => {
              const isToday = dayKey === today;
              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => onOpenDay(dayKey)}
                  disabled={!isWeek}
                  className="flex flex-col items-center gap-0.5 border-l border-[var(--color-border)] py-2 text-xs font-semibold text-[var(--color-text-muted)] enabled:hover:bg-[var(--color-brand-soft)]"
                >
                  <span className="uppercase">{WEEKDAY_SHORT[dayOfWeekOfKey(dayKey)]}</span>
                  <span
                    className={`grid size-8 place-items-center rounded-full text-sm ${
                      isToday ? "bg-[var(--color-brand)] text-white" : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {Number(dayKey.slice(8))}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="relative grid"
            style={{ gridTemplateColumns: `3.5rem repeat(${dayKeys.length}, minmax(0, 1fr))`, height: gridHeight }}
          >
            <div className="relative">
              {hours.map((hour, index) => (
                <span
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)]"
                  style={{ top: index * HOUR_PX }}
                >
                  {index === 0 ? "" : keyToLabelHour(hour)}
                </span>
              ))}
            </div>

            {dayKeys.map((dayKey) => {
              const dayOfWeek = dayOfWeekOfKey(dayKey);
              const working = data.workingHours.filter((rule) => rule.dayOfWeek === dayOfWeek);
              const placed = layoutDay(eventsByDay.get(dayKey) ?? []);
              return (
                <div
                  key={dayKey}
                  className="relative border-l border-[var(--color-border)] bg-[var(--color-surface-strong)]/50"
                >
                  {working.map((rule) => {
                    const top = ((timeToMinutes(rule.startTime) - startHour * 60) / 60) * HOUR_PX;
                    const height =
                      ((timeToMinutes(rule.endTime) - timeToMinutes(rule.startTime)) / 60) * HOUR_PX;
                    return (
                      <div
                        key={rule.id}
                        aria-hidden="true"
                        className="absolute inset-x-0 bg-[var(--color-surface)]"
                        style={{ top, height }}
                      />
                    );
                  })}
                  {hours.map((hour, index) => (
                    <div
                      key={hour}
                      aria-hidden="true"
                      className="absolute inset-x-0 border-t border-[var(--color-border)]/70"
                      style={{ top: index * HOUR_PX }}
                    />
                  ))}
                  {dayKey === today && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60 ? (
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 z-10 h-0.5 bg-[var(--color-danger)]"
                      style={{ top: ((nowMinutes - startHour * 60) / 60) * HOUR_PX }}
                    >
                      <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-[var(--color-danger)]" />
                    </div>
                  ) : null}
                  {placed.map((event) => {
                    const top = ((event.startMin - startHour * 60) / 60) * HOUR_PX + 1;
                    const height = Math.max(((event.endMin - event.startMin) / 60) * HOUR_PX - 2, 22);
                    const style = {
                      top,
                      height,
                      left: `calc(${(event.lane / event.lanes) * 100}% + 2px)`,
                      width: `calc(${100 / event.lanes}% - 4px)`,
                    };
                    if (event.kind === "block") {
                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => onSelectBlock(event.block)}
                          className="absolute z-[5] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[repeating-linear-gradient(135deg,#efe6ea_0,#efe6ea_6px,#f8f3f5_6px,#f8f3f5_12px)] px-2 py-1 text-left text-[11px] font-semibold text-[var(--color-text-muted)]"
                          style={style}
                        >
                          <span className="flex items-center gap-1 truncate">
                            <Lock aria-hidden="true" className="size-3 shrink-0" />
                            <span className="truncate">{BLOCK_TYPE_LABEL[event.block.blockType]}</span>
                          </span>
                        </button>
                      );
                    }
                    const tone = APPOINTMENT_STATUS[event.appointment.status].tone;
                    const cancelled =
                      event.appointment.status === "CANCELLED_BY_CUSTOMER" ||
                      event.appointment.status === "CANCELLED_BY_PROFESSIONAL";
                    return (
                      <Link
                        key={event.id}
                        href={`/studio/appointments/${event.appointment.id}`}
                        className={`absolute z-[6] flex overflow-hidden rounded-lg border border-[var(--color-brand)]/15 bg-[var(--color-brand-soft)] text-left shadow-sm hover:border-[var(--color-brand)] ${
                          cancelled ? "opacity-60" : ""
                        }`}
                        style={style}
                      >
                        <span aria-hidden="true" className={`w-1 shrink-0 ${toneAccentClass(tone)}`} />
                        <span className="min-w-0 flex-1 px-1.5 py-1">
                          <span className="block truncate text-[11px] font-bold text-[var(--color-text-primary)]">
                            {event.appointment.customer.name}
                          </span>
                          {height >= 40 ? (
                            <span className="block truncate text-[11px] text-[var(--color-text-muted)]">
                              {formatTime(event.appointment.startAt, timezone)} ·{" "}
                              {event.appointment.serviceName}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function keyToLabelHour(hour: number) {
  const suffix = hour < 12 ? "am" : "pm";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

function WeekAgenda({
  dayKeys,
  today,
  eventsByDay,
  timezone,
  onOpenDay,
  onSelectBlock,
}: {
  dayKeys: string[];
  today: string;
  eventsByDay: Map<string, DayEvent[]>;
  timezone: string;
  onOpenDay: (dayKey: string) => void;
  onSelectBlock: (block: CalendarBlockedPeriod) => void;
}) {
  return (
    <div className="grid *:min-w-0 gap-4">
      {dayKeys.map((dayKey) => {
        const events = [...(eventsByDay.get(dayKey) ?? [])].sort((a, b) => a.startMin - b.startMin);
        return (
          <section key={dayKey} className="grid *:min-w-0 gap-2">
            <button
              type="button"
              onClick={() => onOpenDay(dayKey)}
              className="flex items-center gap-2 text-left text-sm font-semibold text-[var(--color-text-primary)]"
            >
              <span
                className={`grid size-8 place-items-center rounded-full text-sm ${
                  dayKey === today ? "bg-[var(--color-brand)] text-white" : "bg-[var(--color-surface-strong)]"
                }`}
              >
                {Number(dayKey.slice(8))}
              </span>
              {keyToLabel(dayKey, { weekday: "long", month: "short", day: "numeric" })}
            </button>
            {events.length === 0 ? (
              <p className="pl-10 text-sm text-[var(--color-text-muted)]">No appointments</p>
            ) : (
              <ul className="grid *:min-w-0 gap-2">
                {events.map((event) =>
                  event.kind === "appointment" ? (
                    <li key={event.id}>
                      <AppointmentListItem appointment={event.appointment} />
                    </li>
                  ) : (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onSelectBlock(event.block)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left text-sm"
                      >
                        <Lock aria-hidden="true" className="size-4 shrink-0 text-[var(--color-text-muted)]" />
                        <span className="min-w-0 flex-1 truncate font-semibold text-[var(--color-text-primary)]">
                          {BLOCK_TYPE_LABEL[event.block.blockType]}
                        </span>
                        <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                          {formatTime(event.block.startAt, timezone)} – {formatTime(event.block.endAt, timezone)}
                        </span>
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function MonthGrid({
  dayKeys,
  monthKey,
  today,
  eventsByDay,
  timezone,
  onOpenDay,
}: {
  dayKeys: string[];
  monthKey: string;
  today: string;
  eventsByDay: Map<string, DayEvent[]>;
  timezone: string;
  onOpenDay: (dayKey: string) => void;
}) {
  const weekdays = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-subtle)]">
      <div className="grid *:min-w-0 grid-cols-7 border-b border-[var(--color-border)]">
        {weekdays.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase">
            {WEEKDAY_SHORT[day]}
          </div>
        ))}
      </div>
      <div className="grid *:min-w-0 grid-cols-7">
        {dayKeys.map((dayKey) => {
          const appointments = (eventsByDay.get(dayKey) ?? [])
            .filter((event): event is Extract<DayEvent, { kind: "appointment" }> => event.kind === "appointment")
            .sort((a, b) => a.startMin - b.startMin);
          const inMonth = dayKey.startsWith(monthKey);
          const isToday = dayKey === today;
          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onOpenDay(dayKey)}
              aria-label={`${keyToLabel(dayKey, { weekday: "long", month: "long", day: "numeric" })}, ${appointments.length} appointments`}
              className={`flex min-h-16 min-w-0 flex-col gap-1 border-r border-b border-[var(--color-border)] p-1.5 text-left hover:bg-[var(--color-brand-soft)] sm:min-h-28 sm:p-2 [&:nth-child(7n)]:border-r-0 ${
                inMonth ? "" : "bg-[var(--color-surface-strong)]/50 text-[var(--color-text-muted)]"
              }`}
            >
              <span
                className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${
                  isToday ? "bg-[var(--color-brand)] text-white" : ""
                }`}
              >
                {Number(dayKey.slice(8))}
              </span>
              {appointments.length > 0 ? (
                <>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-brand)] sm:hidden">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--color-brand)]" />
                    {appointments.length}
                  </span>
                  <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                    {appointments.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className="truncate rounded bg-[var(--color-brand-soft)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-text-primary)]"
                      >
                        {formatTime(event.appointment.startAt, timezone)} {event.appointment.customer.name}
                      </span>
                    ))}
                    {appointments.length > 3 ? (
                      <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                        +{appointments.length - 3} more
                      </span>
                    ) : null}
                  </span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BlockDetailDialog({
  block,
  timezone,
  canDelete,
  onClose,
  onDeleted,
}: {
  block: CalendarBlockedPeriod | null;
  timezone: string;
  canDelete: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const notify = useToast();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!block) return null;

  return (
    <StudioDialog
      open
      onClose={onClose}
      title={BLOCK_TYPE_LABEL[block.blockType]}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canDelete ? (
            <Button
              variant="danger"
              loading={deleting}
              onClick={async () => {
                setDeleting(true);
                setError(null);
                try {
                  await studioRequest(`/api/v1/availability/blocked-periods/${block.id}`, "DELETE");
                  notify({ tone: "success", title: "Time unblocked", description: "Clients can book it again." });
                  onDeleted();
                } catch (caught) {
                  setError(errorMessage(caught));
                } finally {
                  setDeleting(false);
                }
              }}
            >
              Remove block
            </Button>
          ) : null}
        </>
      }
    >
      <dl className="grid *:min-w-0 gap-3 text-sm">
        <div>
          <dt className="text-[var(--color-text-muted)]">From</dt>
          <dd className="font-semibold text-[var(--color-text-primary)]">
            {keyToLabel(dateKeyIn(new Date(block.startAt), timezone), { weekday: "short", month: "short", day: "numeric" })}{" "}
            · {formatTime(block.startAt, timezone)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-muted)]">Until</dt>
          <dd className="font-semibold text-[var(--color-text-primary)]">
            {keyToLabel(dateKeyIn(new Date(block.endAt), timezone), { weekday: "short", month: "short", day: "numeric" })}{" "}
            · {formatTime(block.endAt, timezone)}
          </dd>
        </div>
        {block.reason ? (
          <div>
            <dt className="text-[var(--color-text-muted)]">Note</dt>
            <dd className="text-[var(--color-text-primary)]">{block.reason}</dd>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}
      </dl>
    </StudioDialog>
  );
}
