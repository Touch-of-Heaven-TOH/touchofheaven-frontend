"use client";

import { Search, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { AdminPageHeader, AdminPanel } from "@/features/admin/components/AdminPrimitives";
import { adminFetcher, errorMessage, withQuery } from "@/features/admin/lib/api";
import type {
  ApplicationListItem,
  ApplicationStatus,
} from "@/features/admin/lib/admin-types";
import { ApplicationStatusBadge } from "@/features/admin/applications/ApplicationStatusBadge";
import { Button } from "@/components/shared/Button";

/**
 * The queue an admin works through. Every row is a real submitted
 * application; drafts never appear here, because a half-filled wizard is
 * not something to review.
 *
 * The filter is a set of tabs rather than a dropdown: there are four
 * states, an admin switches between them constantly, and a dropdown would
 * hide which one is active behind a click.
 */

type Filter = "ALL" | ApplicationStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, DATE_FORMAT);
}

function humanise(value: string | null): string {
  if (!value) return "—";
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

export function ApplicationsQueue() {
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Typing shouldn't fire a request per keystroke, and an admin scanning a
  // queue types a name fast then stops.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const key = withQuery("/api/v1/admin/professional-applications", {
    status: filter === "ALL" ? undefined : filter,
    search: search || undefined,
    limit: "50",
  });

  const { data, error, isLoading, mutate } = useSWR<{
    applications: ApplicationListItem[];
    total: number;
  }>(key, adminFetcher);

  const applications = data?.applications ?? [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Review"
        title="Provider applications"
        description="People asking to work on Touch of Heaven. Approving one grants their role, opens their Studio and publishes their profile."
      />

      <AdminPanel>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-2">
            {FILTERS.map((option) => {
              const active = option.key === filter;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(option.key)}
                  className={`inline-flex min-h-11 items-center rounded-md px-4 text-sm font-bold transition ${
                    active
                      ? "bg-[var(--color-brand)] text-white"
                      : "border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="lg:w-80">
            <label htmlFor="application-search" className="sr-only">
              Search by name, email or business
            </label>
            <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-white px-3">
              <Search aria-hidden="true" size={16} className="shrink-0 text-[var(--color-text-muted)]" />
              <input
                id="application-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, email or business"
                className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <QueueSkeleton />
        ) : error ? (
          <div className="grid justify-items-start gap-3 rounded-md border border-[var(--color-border)] p-5">
            <p className="flex items-center gap-2 font-bold text-[var(--color-danger)]">
              <TriangleAlert aria-hidden="true" size={18} />
              {errorMessage(error, "We couldn't load the application queue.")}
            </p>
            <Button onClick={() => void mutate()}>Try again</Button>
          </div>
        ) : applications.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            {search
              ? `Nothing matches “${search}”.`
              : filter === "PENDING"
                ? "Nothing waiting. Every application has been decided."
                : "No applications with that status yet."}
          </p>
        ) : (
          <>
            <p role="status" className="sr-only">
              {applications.length} application{applications.length === 1 ? "" : "s"} shown
            </p>
            <QueueTable applications={applications} />
          </>
        )}
      </AdminPanel>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="grid gap-2" aria-busy="true" aria-label="Loading applications">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-md bg-[var(--color-surface-strong)]"
        />
      ))}
    </div>
  );
}

/**
 * A table on a wide screen, a list of cards on a narrow one. A six-column
 * table squeezed into 390px is technically scrollable and practically
 * unreadable, so below `lg` the same data is stacked per application.
 */
function QueueTable({ applications }: { applications: ApplicationListItem[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-bold uppercase text-[var(--color-text-muted)]">
              {["Applicant", "Business", "Type", "Location", "Applied", "Status"].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="border-b border-[var(--color-border)] px-3 py-3"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr
                key={application.id}
                className="border-b border-[var(--color-border)] transition hover:bg-[var(--color-surface-strong)]"
              >
                <td className="border-b border-[var(--color-border)] px-3 py-3">
                  {/* The link lives on the name rather than a row-wide click
                      handler, so it is reachable by keyboard and openable in
                      a new tab like any other link. */}
                  <Link
                    href={`/admin/applications/${application.id}`}
                    className="font-bold text-[var(--color-brand)] hover:underline"
                  >
                    {application.applicantName}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {application.applicantEmail}
                  </p>
                </td>
                <td className="border-b border-[var(--color-border)] px-3 py-3">
                  {application.businessName ?? "—"}
                </td>
                <td className="border-b border-[var(--color-border)] px-3 py-3">
                  {humanise(application.businessCategory)}
                </td>
                <td className="border-b border-[var(--color-border)] px-3 py-3">
                  {application.location ?? "—"}
                </td>
                <td className="border-b border-[var(--color-border)] px-3 py-3 whitespace-nowrap">
                  {formatDate(application.submittedAt)}
                </td>
                <td className="border-b border-[var(--color-border)] px-3 py-3">
                  <ApplicationStatusBadge status={application.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul role="list" className="grid gap-3 lg:hidden">
        {applications.map((application) => (
          <li
            key={application.id}
            className="rounded-md border border-[var(--color-border)] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/applications/${application.id}`}
                  className="font-bold text-[var(--color-brand)] hover:underline"
                >
                  {application.applicantName}
                </Link>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {application.applicantEmail}
                </p>
              </div>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-[var(--color-text-muted)]">Business</dt>
                <dd>{application.businessName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-muted)]">Type</dt>
                <dd>{humanise(application.businessCategory)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-muted)]">Location</dt>
                <dd>{application.location ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-muted)]">Applied</dt>
                <dd>{formatDate(application.submittedAt)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
