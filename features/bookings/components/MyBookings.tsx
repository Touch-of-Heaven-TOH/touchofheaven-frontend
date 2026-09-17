"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { AppointmentStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { browserApiFetch } from "@/lib/api/browser";

type Appointment = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  computedPriceCents: number;
  serviceName: string | null;
  braiderName: string | null;
  locationDescription: string | null;
};

type AppointmentsResponse = {
  appointments: Appointment[];
  total: number;
};

const TABS = ["upcoming", "completed", "cancelled"] as const;
type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fetchAppointments(path: string): Promise<AppointmentsResponse> {
  return browserApiFetch<AppointmentsResponse>(path);
}

export function MyBookings() {
  const [tab, setTab] = useState<TabValue>("upcoming");
  const { data, error, isLoading, mutate } = useSWR<AppointmentsResponse>(
    `/api/v1/bookings?status=${tab}&limit=50`,
    fetchAppointments,
  );
  const appointments = data?.appointments ?? [];

  return (
    <section className="page-container grid gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
            My Bookings
          </h1>
        </div>
        <Link href="/businesses" className="btn-primary">
          Book new appointment
        </Link>
      </div>

      <div className="flex gap-1 border-b border-[var(--color-border)]" role="tablist">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === value
                ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {TAB_LABELS[value]}
          </button>
        ))}
      </div>

      {isLoading && appointments.length === 0 ? (
        <LoadingSkeleton label="Loading bookings" lines={4} />
      ) : error && appointments.length === 0 ? (
        <ErrorState description="We couldn't load your bookings." onRetry={() => void mutate()} />
      ) : appointments.length === 0 ? (
        <EmptyState
          title={`No ${TAB_LABELS[tab].toLowerCase()} bookings`}
          description="Appointments you book will show up here."
        />
      ) : (
        <ul role="list" className="grid gap-3">
          {appointments.map((appointment) => {
            const start = new Date(appointment.startAt);
            return (
              <li key={appointment.id}>
                <Link
                  href={`/bookings/${appointment.id}`}
                  className="surface-panel flex items-center gap-4 p-4 transition hover:border-[var(--color-brand)]"
                >
                  <div className="grid w-14 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] py-2 text-center">
                    <span className="text-xs font-semibold uppercase text-[var(--color-brand)]">
                      {start.toLocaleDateString(undefined, { month: "short" })}
                    </span>
                    <span className="text-lg font-bold text-[var(--color-text-primary)]">
                      {start.getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {appointment.serviceName ?? "Appointment"}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {appointment.braiderName ?? "Business"} ·{" "}
                      {start.toLocaleString(undefined, {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <AppointmentStatusBadge status={appointment.status} />
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {formatPrice(appointment.computedPriceCents)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
