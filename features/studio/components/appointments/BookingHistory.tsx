"use client";

import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  History,
  ReceiptText,
  Repeat,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import useSWR from "swr";
import { ErrorState } from "@/components/shared/ErrorState";
import { BookingActionsMenu } from "@/features/studio/components/appointments/BookingParts";
import {
  Avatar,
  EmptyPanel,
  KpiCard,
  PageHeader,
  Segmented,
  SkeletonRows,
  StatusPill,
} from "@/features/studio/components/ui/primitives";
import { studioFetcher, withQuery } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  dateKeyIn,
  formatDate,
  formatMoney,
  formatPercentBp,
  formatTime,
  keyToLabel,
  zonedTimeToUtc,
} from "@/features/studio/lib/format";
import { useIsDesktop } from "@/features/studio/lib/hooks";
import type { AppointmentSummary, AppointmentsResponse, PeriodSummary } from "@/features/studio/lib/types";

type HistoryTab = "completed" | "cancelled" | "noshow";

const STATUS_FOR: Record<HistoryTab, string> = {
  completed: "COMPLETED",
  cancelled: "CANCELLED_BY_CUSTOMER,CANCELLED_BY_PROFESSIONAL",
  noshow: "NO_SHOW",
};

const EMPTY: Record<HistoryTab, string> = {
  completed: "No completed appointments in this month.",
  cancelled: "No cancellations in this month.",
  noshow: "No no-shows in this month. Nice.",
};

const PAGE_SIZE = 20;

function shiftMonth(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number) as [number, number];
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The amount that matters for a closed booking, and what it means. */
export function historyAmount(appointment: AppointmentSummary) {
  if (appointment.status === "COMPLETED") {
    return appointment.balanceDueCents > 0
      ? { cents: appointment.balanceDueCents, label: "Total due", tone: "danger" as const }
      : { cents: appointment.paidCents, label: "Total paid", tone: "default" as const };
  }
  if (appointment.refundedCents > 0) {
    return { cents: appointment.refundedCents, label: "Refunded", tone: "success" as const };
  }
  if (appointment.paidCents > 0) {
    return { cents: appointment.paidCents, label: "Deposit kept", tone: "default" as const };
  }
  return { cents: 0, label: "No charge", tone: "muted" as const };
}

const AMOUNT_TONE = {
  default: "text-[var(--color-text-primary)]",
  danger: "text-[var(--color-danger)]",
  success: "text-[var(--color-success)]",
  muted: "text-[var(--color-text-muted)]",
};

export function BookingHistory() {
  const { timezone, can } = useStudio();
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const tab = (["completed", "cancelled", "noshow"].includes(params.get("tab") ?? "") ? params.get("tab") : "completed") as HistoryTab;
  const currentMonth = dateKeyIn(new Date(), timezone).slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(params.get("month") ?? "") ? params.get("month")! : currentMonth;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDeferredValue(searchInput.trim());

  const from = zonedTimeToUtc(`${month}-01`, "00:00", timezone).toISOString();
  const to = zonedTimeToUtc(`${shiftMonth(month, 1)}-01`, "00:00", timezone).toISOString();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    setPage(1);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const { data, error, isLoading, mutate } = useSWR<AppointmentsResponse>(
    withQuery("/api/v1/business/appointments", {
      view: "history",
      status: STATUS_FOR[tab],
      from,
      to,
      search,
      page,
      limit: PAGE_SIZE,
    }),
    studioFetcher,
    { keepPreviousData: true },
  );
  const { data: summary } = useSWR<PeriodSummary>(
    withQuery("/api/v1/business/appointments/summary", { from, to }),
    studioFetcher,
  );

  const rows = data?.appointments ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-5 *:min-w-0">
      <PageHeader
        title="Booking history"
        icon={History}
        backHref="/studio/appointments"
        backLabel="Bookings"
        description="Completed, cancelled and no-show bookings, month by month."
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented<HistoryTab>
          label="Booking outcome"
          variant="filled"
          value={tab}
          onChange={(value) => setParam("tab", value)}
          options={[
            { value: "completed", label: "Completed", count: summary?.completed },
            { value: "cancelled", label: "Cancelled", count: summary?.cancelled },
            { value: "noshow", label: "No-show", count: summary?.noShows },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setParam("month", shiftMonth(month, -1))}
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <p aria-live="polite" className="min-w-36 flex-1 text-center font-display text-lg whitespace-nowrap md:flex-none">
            {keyToLabel(`${month}-15`, { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            aria-label="Next month"
            disabled={month >= currentMonth}
            onClick={() => setParam("month", shiftMonth(month, 1))}
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)] disabled:opacity-40"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <KpiCard
          compact={!isDesktop}
          icon={CalendarCheck}
          label="Completed"
          value={summary ? String(summary.completed) : "–"}
          hint="bookings"
        />
        <KpiCard
          compact={!isDesktop}
          icon={Wallet}
          tone="gold"
          label="Revenue"
          value={summary ? (summary.revenueCents === null ? "—" : formatMoney(summary.revenueCents)) : "–"}
          hint={summary?.revenueCents === null ? "Needs earnings access" : "total earned"}
        />
        <KpiCard
          compact={!isDesktop}
          icon={Repeat}
          label="Returning"
          value={summary ? formatPercentBp(summary.returningRateBp) : "–"}
          hint="of clients"
        />
      </div>

      <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-subtle)]">
        <div className="p-4 sm:p-5">
          <label className="relative block md:max-w-sm">
            <span className="sr-only">Search history</span>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
              placeholder="Search client or service…"
              className="min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pr-3 pl-9 text-sm focus-ring"
            />
          </label>
        </div>

        {isLoading && !data ? (
          <div className="px-4 pb-4 sm:px-5">
            <SkeletonRows label="Loading booking history" rows={4} />
          </div>
        ) : error && !data ? (
          <div className="px-4 pb-4 sm:px-5">
            <ErrorState description="We couldn't load booking history." onRetry={() => void mutate()} />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyPanel
              icon={<ReceiptText aria-hidden="true" className="size-6" />}
              title={search ? "No matches" : "Nothing here yet"}
              description={search ? `No bookings match “${search}” in this month.` : EMPTY[tab]}
            />
          </div>
        ) : isDesktop ? (
          <HistoryTable rows={rows} timezone={timezone} canViewClients={can("clients")} />
        ) : (
          <ul className="grid gap-3 px-4 pb-4 *:min-w-0">
            {rows.map((row) => (
              <li key={row.id}>
                <HistoryCard appointment={row} timezone={timezone} canViewClients={can("clients")} />
              </li>
            ))}
          </ul>
        )}

        {total > PAGE_SIZE ? (
          <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 text-sm sm:px-5">
            <p className="text-[var(--color-text-muted)]">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((value) => value + 1)}
                className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </nav>
        ) : null}
      </section>
    </div>
  );
}

function receiptHref(appointment: AppointmentSummary) {
  const base = `/studio/appointments/${appointment.id}`;
  if (appointment.status === "COMPLETED") return `${base}/complete`;
  if (appointment.refundedCents > 0) return `${base}/refund`;
  return base;
}

function HistoryCard({
  appointment,
  timezone,
  canViewClients,
}: {
  appointment: AppointmentSummary;
  timezone: string;
  canViewClients: boolean;
}) {
  const amount = historyAmount(appointment);
  return (
    <article className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex gap-3 p-3.5">
        <Avatar name={appointment.customer.name} size="md" />
        <div className="min-w-0 flex-1">
          <Link href={`/studio/appointments/${appointment.id}`} className="block truncate font-display text-[17px] hover:underline">
            {appointment.customer.name}
          </Link>
          <p className="truncate text-sm text-[var(--color-text-muted)]">{appointment.serviceName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {formatDate(appointment.startAt, timezone, { month: "short", day: "numeric" })} · {formatTime(appointment.startAt, timezone)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className={`font-display text-lg leading-tight ${AMOUNT_TONE[amount.tone]}`}>{formatMoney(amount.cents)}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{amount.label}</p>
          <StatusPill status={appointment.status} />
        </div>
        <div className="-mr-1.5 shrink-0">
          <BookingActionsMenu appointment={appointment} />
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-[var(--color-border)] border-t border-[var(--color-border)] text-sm font-medium">
        <Link href={receiptHref(appointment)} className="flex min-h-11 items-center justify-center gap-1.5 text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]/50">
          <ReceiptText aria-hidden="true" className="size-4" />
          {appointment.status === "COMPLETED" ? "View receipt" : appointment.refundedCents > 0 ? "View refund" : "View booking"}
        </Link>
        {canViewClients ? (
          <Link
            href={`/studio/clients/${appointment.customer.id}`}
            className="flex min-h-11 items-center justify-center gap-1.5 text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]/50"
          >
            <UserRound aria-hidden="true" className="size-4" />
            View client
          </Link>
        ) : (
          <Link href={`/studio/appointments/${appointment.id}`} className="flex min-h-11 items-center justify-center gap-1.5 text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]/50">
            View booking
          </Link>
        )}
      </div>
    </article>
  );
}

function HistoryTable({
  rows,
  timezone,
  canViewClients,
}: {
  rows: AppointmentSummary[];
  timezone: string;
  canViewClients: boolean;
}) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-y border-[var(--color-border)] bg-[var(--color-surface-strong)]/50 text-xs text-[var(--color-text-muted)]">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">Client</th>
            <th scope="col" className="px-3 py-3 font-medium">Booking</th>
            <th scope="col" className="px-3 py-3 font-medium">Date &amp; time</th>
            <th scope="col" className="px-3 py-3 font-medium">Service</th>
            <th scope="col" className="px-3 py-3 font-medium">Amount</th>
            <th scope="col" className="px-3 py-3 font-medium">Status</th>
            <th scope="col" className="px-3 py-3 font-medium"><span className="sr-only">Links</span></th>
            <th scope="col" className="py-3 pr-4"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const amount = historyAmount(row);
            return (
              <tr key={row.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-brand-soft)]/35">
                <td className="px-5 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={row.customer.name} size="sm" />
                    {canViewClients ? (
                      <Link href={`/studio/clients/${row.customer.id}`} className="max-w-44 truncate font-display text-[15px] hover:underline">
                        {row.customer.name}
                      </Link>
                    ) : (
                      <span className="max-w-44 truncate font-display text-[15px]">{row.customer.name}</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-xs whitespace-nowrap text-[var(--color-text-muted)]">{row.reference}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="block">{formatDate(row.startAt, timezone, { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span className="block text-xs text-[var(--color-text-muted)]">{formatTime(row.startAt, timezone)}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="block max-w-48 truncate">{row.serviceName}</span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`block font-medium ${AMOUNT_TONE[amount.tone]}`}>{formatMoney(amount.cents)}</span>
                  <span className="block text-xs text-[var(--color-text-muted)]">{amount.label}</span>
                </td>
                <td className="px-3 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href={receiptHref(row)} className="text-sm font-medium text-[var(--color-brand)] hover:underline">
                    {row.status === "COMPLETED" ? "View receipt" : row.refundedCents > 0 ? "View refund" : "View booking"}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <BookingActionsMenu appointment={row} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
