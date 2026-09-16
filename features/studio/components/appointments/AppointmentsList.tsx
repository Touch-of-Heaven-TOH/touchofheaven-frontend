"use client";

import { CalendarDays, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { AppointmentListItem } from "@/features/studio/components/appointments/AppointmentListItem";
import {
  EmptyPanel,
  PageHeader,
  Segmented,
  SkeletonRows,
} from "@/features/studio/components/ui/primitives";
import { studioFetcher, withQuery } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import { dateKeyIn, keyToLabel } from "@/features/studio/lib/format";
import type {
  AppointmentSummary,
  AppointmentsResponse,
  AppointmentsView,
} from "@/features/studio/lib/types";

const VIEWS: AppointmentsView[] = ["today", "upcoming", "requests", "history"];
const PAGE_SIZE = 25;

const EMPTY_COPY: Record<AppointmentsView, { title: string; description: string }> = {
  today: {
    title: "Nothing booked today",
    description: "Appointments for today appear here, ready to check in.",
  },
  upcoming: {
    title: "No upcoming appointments",
    description: "Confirmed bookings from now on will be listed here.",
  },
  requests: {
    title: "No requests waiting",
    description:
      "Bookings still waiting for a deposit, and clients asking to move or cancel, show up here.",
  },
  history: {
    title: "No past appointments",
    description: "Completed, cancelled and no-show appointments are kept here.",
  },
};

function groupByDay(appointments: AppointmentSummary[], timezone: string) {
  const groups: Array<{ key: string; items: AppointmentSummary[] }> = [];
  for (const appointment of appointments) {
    const key = dateKeyIn(new Date(appointment.startAt), timezone);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(appointment);
    else groups.push({ key, items: [appointment] });
  }
  return groups;
}

export function AppointmentsList() {
  const { timezone } = useStudio();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("view") as AppointmentsView | null;
  const view: AppointmentsView = requested && VIEWS.includes(requested) ? requested : "upcoming";

  const [searchInput, setSearchInput] = useState("");
  const search = useDeferredValue(searchInput.trim());

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<AppointmentsResponse>(
    (pageIndex, previous) => {
      if (previous && previous.page * previous.limit >= previous.total) return null;
      return withQuery("/api/v1/business/appointments", {
        view,
        search,
        page: pageIndex + 1,
        limit: PAGE_SIZE,
      });
    },
    studioFetcher,
    { revalidateFirstPage: true },
  );

  const appointments = data?.flatMap((page) => page.appointments) ?? [];
  const first = data?.[0];
  const total = first?.total ?? 0;
  const hasMore = appointments.length < total;
  const loadingMore = size > (data?.length ?? 0);

  const setView = (next: AppointmentsView) => {
    router.replace(`${pathname}?view=${next}`, { scroll: false });
  };

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader
        title="Appointments"
        description="Check clients in, close out services and answer requests."
      />

      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented
          label="Appointment lists"
          value={view}
          onChange={setView}
          options={[
            { value: "today", label: "Today", ...(first ? { count: first.counts.today } : {}) },
            { value: "upcoming", label: "Upcoming", ...(first ? { count: first.counts.upcoming } : {}) },
            { value: "requests", label: "Requests", ...(first ? { count: first.counts.requests } : {}) },
            { value: "history", label: "History" },
          ]}
        />
        <label className="relative block w-full md:w-72">
          <span className="sr-only">Search by client or service</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search client or service"
            className="min-h-11 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pr-4 pl-9 text-sm focus-ring"
          />
        </label>
      </div>

      {isLoading && appointments.length === 0 ? (
        <SkeletonRows label="Loading appointments" />
      ) : error && appointments.length === 0 ? (
        <ErrorState description="We couldn't load appointments." onRetry={() => void mutate()} />
      ) : appointments.length === 0 ? (
        <EmptyPanel
          icon={<CalendarDays aria-hidden="true" className="size-6" />}
          title={search ? "No matches" : EMPTY_COPY[view].title}
          description={
            search ? `Nothing matches “${search}” in this list.` : EMPTY_COPY[view].description
          }
        />
      ) : view === "today" ? (
        <ul className="grid *:min-w-0 gap-2">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <AppointmentListItem appointment={appointment} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid *:min-w-0 gap-5">
          {groupByDay(appointments, timezone).map((group) => (
            <section key={group.key} className="grid *:min-w-0 gap-2">
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
                {keyToLabel(group.key, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </h2>
              <ul className="grid *:min-w-0 gap-2">
                {group.items.map((appointment) => (
                  <li key={appointment.id}>
                    <AppointmentListItem appointment={appointment} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="secondary" loading={loadingMore} onClick={() => void setSize(size + 1)}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
