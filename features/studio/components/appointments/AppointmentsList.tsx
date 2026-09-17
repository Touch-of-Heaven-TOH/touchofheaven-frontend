"use client";

import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Inbox,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  BookingActionsMenu,
  BookingCard,
  PaymentInline,
} from "@/features/studio/components/appointments/BookingParts";
import { TodayGlancePanel } from "@/features/studio/components/appointments/TodayGlancePanel";
import { BlockTimeDialog } from "@/features/studio/components/calendar/BlockTimeDialog";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import {
  Avatar,
  EmptyPanel,
  KpiCard,
  PageHeader,
  Pill,
  Segmented,
  SelectField,
  SkeletonRows,
  StatusPill,
} from "@/features/studio/components/ui/primitives";
import { studioFetcher, withQuery } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  addDaysToKey,
  dateKeyIn,
  formatDate,
  formatTime,
  keyToLabel,
  startOfWeekKey,
  zonedTimeToUtc,
} from "@/features/studio/lib/format";
import { useIsDesktop } from "@/features/studio/lib/hooks";
import type {
  AppointmentSummary,
  AppointmentsResponse,
  OwnService,
  PeriodSummary,
  TeamResponse,
} from "@/features/studio/lib/types";

type Tab = "upcoming" | "today" | "completed" | "cancelled" | "noshow";
type DateRange = "any" | "today" | "week" | "next7" | "month";
type PaymentFilter = "" | "unpaid" | "deposit" | "paid";

const TAB_QUERY: Record<Tab, { view: string; status?: string }> = {
  upcoming: { view: "upcoming" },
  today: { view: "today" },
  completed: { view: "history", status: "COMPLETED" },
  cancelled: { view: "history", status: "CANCELLED_BY_CUSTOMER,CANCELLED_BY_PROFESSIONAL" },
  noshow: { view: "history", status: "NO_SHOW" },
};

const EMPTY: Record<Tab, { title: string; description: string }> = {
  upcoming: { title: "No upcoming bookings", description: "Confirmed bookings from now on appear here." },
  today: { title: "Nothing booked today", description: "Today's bookings appear here, ready to check in." },
  completed: { title: "No completed bookings", description: "Finished appointments are kept here." },
  cancelled: { title: "No cancellations", description: "Bookings cancelled by you or the client appear here." },
  noshow: { title: "No no-shows", description: "Bookings marked as no-show appear here." },
};

const PAGE_SIZE = 20;

function readTab(value: string | null): Tab {
  if (value === "today" || value === "completed" || value === "cancelled" || value === "noshow") return value;
  if (value === "history") return "completed";
  return "upcoming";
}

export function AppointmentsList() {
  const studio = useStudio();
  const timezone = studio.timezone;
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const legacyView = searchParams.get("view");
  useEffect(() => {
    // Older links used ?view=requests; requests now have their own inbox page.
    if (legacyView === "requests") router.replace("/studio/appointments/requests");
  }, [legacyView, router]);
  const tab = readTab(searchParams.get("tab") ?? legacyView);

  const [searchInput, setSearchInput] = useState("");
  const search = useDeferredValue(searchInput.trim());
  const [range, setRange] = useState<DateRange>("any");
  const [serviceId, setServiceId] = useState("");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [payment, setPayment] = useState<PaymentFilter>("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const today = dateKeyIn(new Date(), timezone);
  const dates = useMemo(() => {
    const bounds = (fromKey: string, days: number) => ({
      from: zonedTimeToUtc(fromKey, "00:00", timezone).toISOString(),
      to: zonedTimeToUtc(addDaysToKey(fromKey, days), "00:00", timezone).toISOString(),
    });
    if (range === "today") return bounds(today, 1);
    if (range === "week") return bounds(startOfWeekKey(today), 7);
    if (range === "next7") return bounds(today, 7);
    if (range === "month") {
      const first = `${today.slice(0, 7)}-01`;
      const next = addDaysToKey(first, 32).slice(0, 7);
      return {
        from: zonedTimeToUtc(first, "00:00", timezone).toISOString(),
        to: zonedTimeToUtc(`${next}-01`, "00:00", timezone).toISOString(),
      };
    }
    return null;
  }, [range, today, timezone]);

  const key = withQuery("/api/v1/business/appointments", {
    ...TAB_QUERY[tab],
    search,
    from: dates?.from,
    to: dates?.to,
    serviceId,
    teamMemberId,
    payment,
    page,
    limit: PAGE_SIZE,
  });
  const { data, error, isLoading, isValidating, mutate } = useSWR<AppointmentsResponse>(key, studioFetcher, {
    keepPreviousData: true,
  });

  const monthFirst = `${today.slice(0, 7)}-01`;
  const { data: month } = useSWR<PeriodSummary>(
    withQuery("/api/v1/business/appointments/summary", {
      from: zonedTimeToUtc(monthFirst, "00:00", timezone).toISOString(),
      to: zonedTimeToUtc(`${addDaysToKey(monthFirst, 32).slice(0, 7)}-01`, "00:00", timezone).toISOString(),
    }),
    studioFetcher,
  );
  const { data: services } = useSWR<{ services: OwnService[] }>(
    studio.isOwner ? "/api/v1/services" : null,
    studioFetcher,
  );
  const { data: team } = useSWR<TeamResponse>(
    studio.can("team") && studio.appointmentScope === "all" ? "/api/v1/business/team" : null,
    studioFetcher,
  );

  const setTab = (next: Tab) => {
    setPage(1);
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  };
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setPage(1);
    setter(value);
  };

  const appointments = data?.appointments ?? [];
  const total = data?.total ?? 0;
  const counts = data?.counts;
  const activeFilterCount = [range !== "any", serviceId, teamMemberId, payment].filter(Boolean).length;

  const tabOptions = isDesktop
    ? [
        { value: "upcoming" as Tab, label: "Upcoming", ...(counts ? { count: counts.upcoming } : {}) },
        { value: "today" as Tab, label: "Today", ...(counts ? { count: counts.today } : {}) },
        { value: "completed" as Tab, label: "Completed" },
        { value: "cancelled" as Tab, label: "Cancelled" },
        { value: "noshow" as Tab, label: "No-show" },
      ]
    : [
        { value: "upcoming" as Tab, label: "Upcoming" },
        { value: "today" as Tab, label: "Today" },
        { value: "completed" as Tab, label: "Completed" },
        { value: "cancelled" as Tab, label: "Cancelled" },
        { value: "noshow" as Tab, label: "No-show" },
      ];

  const filters = (
    <>
      <SelectField label="Date" value={range} onChange={(event) => resetPage(setRange)(event.target.value as DateRange)}>
        <option value="any">Any date</option>
        <option value="today">Today</option>
        <option value="week">This week</option>
        <option value="next7">Next 7 days</option>
        <option value="month">This month</option>
      </SelectField>
      {services ? (
        <SelectField label="Service" value={serviceId} onChange={(event) => resetPage(setServiceId)(event.target.value)}>
          <option value="">All services</option>
          {services.services
            .filter((service) => service.status !== "ARCHIVED")
            .map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
        </SelectField>
      ) : null}
      {team && team.members.length > 0 ? (
        <SelectField label="Team member" value={teamMemberId} onChange={(event) => resetPage(setTeamMemberId)(event.target.value)}>
          <option value="">Everyone</option>
          <option value="unassigned">Owner / unassigned</option>
          {team.members
            .filter((member) => member.status === "ACTIVE")
            .map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
        </SelectField>
      ) : null}
      <SelectField label="Payment" value={payment} onChange={(event) => resetPage(setPayment)(event.target.value as PaymentFilter)}>
        <option value="">Any payment</option>
        <option value="unpaid">Deposit not paid</option>
        <option value="deposit">Deposit paid, balance due</option>
        <option value="paid">Paid in full</option>
      </SelectField>
    </>
  );

  return (
    <div className="grid gap-5 sm:gap-6">
      <PageHeader
        title="Bookings"
        icon={ClipboardList}
        actions={
          <>
            <Link href="/studio/appointments/requests" className="btn-secondary !font-medium">
              <Inbox aria-hidden="true" className="size-4" />
              Requests
              {counts?.requests ? (
                <span className="rounded-full bg-[var(--color-brand)] px-1.5 text-xs text-white">{counts.requests}</span>
              ) : null}
            </Link>
            {studio.isOwner ? (
              <Button leadingIcon={<Plus aria-hidden="true" className="size-4" />} onClick={() => setAddOpen(true)}>
                Add booking
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard compact icon={CalendarDays} label="Today" value={counts?.today ?? "–"} href="/studio/appointments?tab=today" linkLabel="View today" />
        <KpiCard compact icon={Inbox} tone="gold" label="Pending requests" value={counts?.requests ?? "–"} href="/studio/appointments/requests" linkLabel="View pending" />
        <KpiCard compact icon={CalendarCheck} label="Upcoming" value={counts?.upcoming ?? "–"} href="/studio/appointments?tab=upcoming" linkLabel="View upcoming" />
        <KpiCard compact icon={ClipboardList} tone="gold" label="Completed this month" value={month?.completed ?? "–"} href="/studio/appointments/history" linkLabel="View history" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <section className="min-w-0 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-subtle)]">
          <div className="px-4 pt-2 sm:px-6">
            <Segmented label="Booking lists" value={tab} onChange={setTab} options={tabOptions} />
          </div>

          <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:flex-wrap lg:items-end">
            <label className="relative block min-w-0 lg:w-64 lg:self-end">
              <span className="sr-only">Search bookings</span>
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => {
                  setPage(1);
                  setSearchInput(event.target.value);
                }}
                placeholder="Search client or service"
                className="min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pr-3 pl-9 text-sm focus-ring"
              />
            </label>
            <div className="hidden min-w-0 flex-1 grid-cols-2 gap-3 lg:grid xl:grid-cols-4">{filters}</div>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 text-sm font-medium lg:hidden"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-[var(--color-brand)] px-1.5 text-xs text-white">{activeFilterCount}</span>
              ) : null}
            </button>
          </div>

          <div className={`transition-opacity ${isValidating && data ? "opacity-60" : ""}`} aria-busy={isValidating}>
            {isLoading && !data ? (
              <div className="px-4 pb-4 sm:px-6">
                <SkeletonRows label="Loading bookings" rows={5} />
              </div>
            ) : error && !data ? (
              <div className="px-4 pb-4 sm:px-6">
                <ErrorState description="We couldn't load bookings." onRetry={() => void mutate()} />
              </div>
            ) : appointments.length === 0 ? (
              <div className="px-4 pb-6 sm:px-6">
                <EmptyPanel
                  icon={<CalendarDays aria-hidden="true" className="size-6" />}
                  title={search || activeFilterCount ? "No matching bookings" : EMPTY[tab].title}
                  description={search || activeFilterCount ? "Try another search or clear the filters." : EMPTY[tab].description}
                />
              </div>
            ) : isDesktop ? (
              <BookingsTable appointments={appointments} timezone={timezone} />
            ) : (
              <GroupedCards appointments={appointments} timezone={timezone} />
            )}
          </div>

          {total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)] sm:px-6">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} bookings
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="grid size-10 place-items-center rounded-lg border border-[var(--color-border)] disabled:opacity-40"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </button>
                <span className="min-w-16 text-center">
                  {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page * PAGE_SIZE >= total}
                  onClick={() => setPage((value) => value + 1)}
                  className="grid size-10 place-items-center rounded-lg border border-[var(--color-border)] disabled:opacity-40"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <div className="hidden xl:block">
          <TodayGlancePanel />
        </div>
      </div>

      <StudioDialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter bookings"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRange("any");
                setServiceId("");
                setTeamMemberId("");
                setPayment("");
                setPage(1);
              }}
            >
              Clear
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Show results</Button>
          </>
        }
      >
        <div className="grid gap-4">{filters}</div>
      </StudioDialog>

      {addOpen ? <BlockTimeDialog open onClose={() => setAddOpen(false)} initialType="MANUAL_APPOINTMENT" /> : null}
    </div>
  );
}

function BookingsTable({ appointments, timezone }: { appointments: AppointmentSummary[]; timezone: string }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-y border-[var(--color-border)] bg-[var(--color-surface-strong)]/50 text-xs text-[var(--color-text-muted)]">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium">Client</th>
            <th scope="col" className="px-3 py-3 font-medium">Booking</th>
            <th scope="col" className="px-3 py-3 font-medium">Date &amp; time</th>
            <th scope="col" className="px-3 py-3 font-medium">Service</th>
            <th scope="col" className="px-3 py-3 font-medium">Staff</th>
            <th scope="col" className="px-3 py-3 font-medium">Location</th>
            <th scope="col" className="px-3 py-3 font-medium">Payment</th>
            <th scope="col" className="px-3 py-3 font-medium">Status</th>
            <th scope="col" className="py-3 pr-4"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id} className="relative border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-brand-soft)]/35">
              <td className="px-6 py-3">
                <Link
                  href={`/studio/appointments/${appointment.id}`}
                  className="flex min-w-0 items-center gap-3 after:absolute after:inset-0 after:content-['']"
                >
                  <Avatar name={appointment.customer.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block max-w-44 truncate font-display text-[15px] text-[var(--color-text-primary)]">
                      {appointment.customer.name}
                    </span>
                    <span className="block text-xs text-[var(--color-text-muted)]">{appointment.customer.phone ?? "No phone"}</span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-3 font-mono text-xs whitespace-nowrap text-[var(--color-text-muted)]">{appointment.reference}</td>
              <td className="px-3 py-3 whitespace-nowrap">
                <span className="block">{formatDate(appointment.startAt, timezone, { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="block text-xs text-[var(--color-text-muted)]">{formatTime(appointment.startAt, timezone)}</span>
              </td>
              <td className="px-3 py-3">
                <span className="block max-w-44 truncate">{appointment.serviceName}</span>
              </td>
              <td className="px-3 py-3">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Avatar name={appointment.teamMember?.name ?? "Owner"} size="xs" />
                  {appointment.teamMember?.name ?? "Owner"}
                </span>
              </td>
              <td className="px-3 py-3">
                <Pill tone="neutral">{appointment.location.label}</Pill>
              </td>
              <td className="relative z-10 px-3 py-3">
                <PaymentInline appointment={appointment} />
              </td>
              <td className="relative z-10 px-3 py-3">
                <StatusPill status={appointment.status} />
              </td>
              <td className="relative z-10 py-3 pr-4">
                <BookingActionsMenu appointment={appointment} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupedCards({ appointments, timezone }: { appointments: AppointmentSummary[]; timezone: string }) {
  const today = dateKeyIn(new Date(), timezone);
  const groups: Array<{ key: string; items: AppointmentSummary[] }> = [];
  for (const appointment of appointments) {
    const key = dateKeyIn(new Date(appointment.startAt), timezone);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(appointment);
    else groups.push({ key, items: [appointment] });
  }
  return (
    <div className="grid gap-5 px-4 pb-4 sm:px-6">
      {groups.map((group) => (
        <section key={group.key} className="grid gap-2.5">
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">
            {group.key === today ? "Today" : group.key === addDaysToKey(today, 1) ? "Tomorrow" : null}
            {group.key === today || group.key === addDaysToKey(today, 1) ? " · " : ""}
            <span className="text-[var(--color-text-muted)]">
              {keyToLabel(group.key, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </h2>
          <ul className="grid gap-2.5">
            {group.items.map((appointment) => (
              <li key={appointment.id}>
                <BookingCard appointment={appointment} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
