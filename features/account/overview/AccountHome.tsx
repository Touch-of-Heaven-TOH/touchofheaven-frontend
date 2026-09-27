"use client";

import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Heart,
  Images,
  MessageSquare,
  Star,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { browserApiFetch } from "@/lib/api/browser";

/**
 * The first screen a client sees after signing in.
 *
 * It answers the two questions someone actually arrives with - what have I
 * got booked, and is there anything I need to do - and then gets out of the
 * way. Everything here is a real number from a real endpoint; a client with
 * no history sees an honest empty state rather than invented activity.
 */

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

type AccountSummary = {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    emailVerifiedAt: string | null;
    status: string;
  };
  profile: {
    displayName: string | null;
    phoneNumberE164: string | null;
    avatarObjectKey: string | null;
  } | null;
  addressCount: number;
};

type ClientStats = {
  completedBookings: number;
  verifiedReviews: number;
  savedProfessionals: number;
};

const fetcher = <T,>(path: string) => browserApiFetch<T>(path);

function formatWhen(startAt: string) {
  const date = new Date(startAt);
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function firstNameOf(summary: AccountSummary | undefined) {
  const display = summary?.profile?.displayName?.trim();
  if (display) return display.split(" ")[0];
  const first = summary?.user.firstName?.trim();
  return first || "there";
}

export function AccountHome() {
  const summary = useSWR<{ summary: AccountSummary }>(
    "/api/v1/customer/account-summary",
    fetcher,
  );
  const upcoming = useSWR<{ appointments: Appointment[]; total: number }>(
    "/api/v1/bookings?status=upcoming&limit=3",
    fetcher,
  );
  // This endpoint answers the counts directly, not wrapped in { stats } -
  // unlike account-summary, which does wrap. Getting this wrong renders a
  // real 3 as a zero.
  const stats = useSWR<ClientStats>("/api/v1/customer/stats", fetcher);

  const account = summary.data?.summary;
  const appointments = upcoming.data?.appointments ?? [];
  const counts = stats.data;

  // Only things the client can actually act on. A nudge they cannot resolve
  // is just noise on the page they see most often.
  const todo: { key: string; label: string; href: string }[] = [];
  if (account && account.user.emailVerifiedAt === null) {
    todo.push({
      key: "verify",
      label: "Confirm your email address",
      href: "/customer/verify-email",
    });
  }
  if (account && !account.profile?.phoneNumberE164) {
    todo.push({
      key: "phone",
      label: "Add a phone number so a provider can reach you",
      href: "/account/settings/profile",
    });
  }
  if (account && account.addressCount === 0) {
    todo.push({
      key: "address",
      label: "Add an address for home appointments",
      href: "/account/settings/addresses",
    });
  }

  if (summary.error) {
    return (
      <section className="page-container py-8">
        <ErrorState
          title="We couldn't load your account"
          description="Please try again in a moment."
        />
      </section>
    );
  }

  return (
    <section className="page-container grid gap-6 py-8">
      <header>
        <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
          {summary.isLoading ? "Welcome back" : `Welcome back, ${firstNameOf(account)}`}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Your appointments, your saved work, and anything that still needs you.
        </p>
      </header>

      {todo.length > 0 ? (
        <div className="surface-panel p-4">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
            Before your next appointment
          </h2>
          <ul role="list" className="mt-3 grid gap-2">
            {todo.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-medium text-[var(--color-warning)] hover:brightness-95"
                >
                  <span className="min-w-0">{item.label}</span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="grid min-w-0 gap-6">
          <section className="surface-panel p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                <CalendarDays aria-hidden="true" className="size-5 text-[var(--color-brand)]" />
                Next appointments
              </h2>
              <Link
                href="/bookings"
                className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[var(--color-brand)] hover:underline"
              >
                See all
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>

            {upcoming.isLoading ? (
              <div className="mt-4">
                <LoadingSkeleton label="Loading your appointments" />
              </div>
            ) : upcoming.error ? (
              <p className="mt-4 text-sm text-[var(--color-danger)]">
                We couldn&apos;t load your appointments.
              </p>
            ) : appointments.length === 0 ? (
              <div className="mt-4 grid justify-items-start gap-3 rounded-lg border border-dashed border-[var(--color-border)] p-5">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Nothing booked yet. Find a professional near you and book your first
                  appointment.
                </p>
                <Link className="btn-primary" href="/explore">
                  Find a professional
                </Link>
              </div>
            ) : (
              <ul role="list" className="mt-4 grid gap-3">
                {appointments.map((appointment) => (
                  <li key={appointment.id}>
                    <Link
                      href={`/bookings/${appointment.id}`}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3 hover:border-[var(--color-brand)]"
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
                      <span className="shrink-0 text-sm font-semibold text-[var(--color-text-primary)]">
                        {formatPrice(appointment.computedPriceCents)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={CircleCheck}
              label="Appointments completed"
              value={counts?.completedBookings}
              loading={stats.isLoading}
            />
            <StatCard
              icon={Star}
              label="Reviews you've written"
              value={counts?.verifiedReviews}
              loading={stats.isLoading}
            />
            <StatCard
              icon={Heart}
              label="Saved professionals"
              value={counts?.savedProfessionals}
              loading={stats.isLoading}
            />
          </section>
        </div>

        <aside className="grid gap-3">
          <ShortcutCard
            icon={Images}
            title="My portfolio"
            description="The looks you've saved, and who can see each one."
            href="/account/portfolio"
          />
          <ShortcutCard
            icon={MessageSquare}
            title="Messages"
            description="Talk to a professional about an appointment."
            href="/messages"
          />
          <ShortcutCard
            icon={CalendarDays}
            title="Book again"
            description="Find a professional near you."
            href="/explore"
          />
        </aside>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof CircleCheck;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <div className="surface-panel flex min-w-0 items-start gap-3 p-4">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-semibold text-[var(--color-text-primary)]">
          {loading ? "—" : (value ?? 0)}
        </span>
        <span className="block text-xs leading-snug text-[var(--color-text-muted)]">
          {label}
        </span>
      </span>
    </div>
  );
}

function ShortcutCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof CircleCheck;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="surface-panel flex min-w-0 items-center gap-3 p-4 hover:border-[var(--color-brand)]"
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-[var(--color-text-primary)]">{title}</span>
        <span className="block text-xs leading-snug text-[var(--color-text-muted)]">
          {description}
        </span>
      </span>
      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-[var(--color-text-muted)]" />
    </Link>
  );
}
