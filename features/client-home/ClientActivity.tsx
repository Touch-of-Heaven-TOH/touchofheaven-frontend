"use client";

import { CalendarDays, MessageSquare, Scale, Star } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { ClientShell } from "@/features/discovery/DiscoveryShell";
import { browserApiFetch } from "@/lib/api/browser";

/**
 * The client's own activity.
 *
 * The phone's Activity tab needs a destination that belongs to the
 * client - not the business analytics dashboard, which is a different
 * product for a different person. This is their appointments, with the
 * other places their account has news.
 */

type Appointment = {
  id: string;
  status: string;
  startAt: string;
  computedPriceCents: number;
  serviceName: string | null;
  braiderName: string | null;
};

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ClientActivity({
  initialTab = "upcoming",
}: {
  initialTab?: (typeof TABS)[number]["value"];
}) {
  type Bookings = { appointments: Appointment[]; total: number };
  const { data, error, isLoading, mutate } = useSWR<Bookings>(
    `/api/v1/bookings?status=${initialTab}&limit=25`,
    (path: string) => browserApiFetch<Bookings>(path),
  );

  const appointments = data?.appointments ?? [];

  return (
    <ClientShell>
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">Your activity</h1>
        <p className="mt-1 text-[var(--color-text-muted)]">
          Appointments, and everywhere else your account has news.
        </p>

        <div role="tablist" aria-label="Filter appointments" className="mt-6 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const selected = tab.value === initialTab;
            return (
              <Link
                key={tab.value}
                role="tab"
                aria-selected={selected}
                href={`/activity?status=${tab.value}`}
                className={`inline-flex min-h-11 items-center rounded-[var(--radius-control)] border px-4 text-sm font-bold ${
                  selected
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                    : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {isLoading ? (
          <div role="status" aria-label="Loading your appointments" className="mt-6 grid gap-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                aria-hidden="true"
                className="h-20 animate-pulse rounded-[var(--radius-panel,16px)] bg-[var(--color-surface-strong,#f2ece9)]"
              />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-6 grid justify-items-start gap-3">
            <p className="font-semibold text-[var(--color-danger)]">
              We couldn&apos;t load your appointments.
            </p>
            <button type="button" onClick={() => void mutate()} className="btn-primary min-h-11">
              Try again
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="mt-6 grid justify-items-start gap-3 rounded-[var(--radius-panel,16px)] border border-dashed border-[var(--color-border)] p-6">
            <CalendarDays aria-hidden="true" className="size-7 text-[var(--color-text-muted)]" />
            <p className="text-[var(--color-text-muted)]">
              Nothing {initialTab === "upcoming" ? "booked" : initialTab} yet.
            </p>
            <Link href="/explore" className="btn-primary min-h-11">
              Find a professional
            </Link>
          </div>
        ) : (
          <ul role="list" className="mt-6 grid min-w-0 gap-3">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="min-w-0">
                <Link
                  href={`/bookings/${appointment.id}`}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-4 transition-colors hover:border-[var(--color-brand)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[var(--color-text-primary)]">
                      {appointment.serviceName ?? "Appointment"}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-[var(--color-text-muted)]">
                      {formatWhen(appointment.startAt)}
                      {appointment.braiderName ? ` · ${appointment.braiderName}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold">
                    ${(appointment.computedPriceCents / 100).toFixed(2)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-10 font-serif text-xl font-semibold">Elsewhere</h2>
        <ul role="list" className="mt-3 grid gap-3 sm:grid-cols-3">
          <ElsewhereLink href="/messages" icon={MessageSquare} label="Messages" />
          <ElsewhereLink href="/disputes" icon={Scale} label="Your disputes" />
          <ElsewhereLink href="/account/portfolio" icon={Star} label="Your portfolio" />
        </ul>
      </div>
    </ClientShell>
  );
}

function ElsewhereLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof MessageSquare;
  label: string;
}) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="flex min-h-11 items-center gap-3 rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-3 transition-colors hover:border-[var(--color-brand)]"
      >
        <Icon aria-hidden="true" className="size-5 shrink-0 text-[var(--color-brand)]" />
        <span className="min-w-0 truncate font-semibold">{label}</span>
      </Link>
    </li>
  );
}
