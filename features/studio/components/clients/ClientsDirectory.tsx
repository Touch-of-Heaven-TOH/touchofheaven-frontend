"use client";

import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  Avatar,
  EmptyPanel,
  PageHeader,
  SkeletonRows,
  StatTile,
} from "@/features/studio/components/ui/primitives";
import { studioFetcher, withQuery } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import { formatDate, formatMoney, formatPercentBp } from "@/features/studio/lib/format";
import type { ClientRow, ClientsResponse } from "@/features/studio/lib/types";

type Sort = "recent" | "name" | "visits" | "spend";

export function ClientsDirectory() {
  const { timezone } = useStudio();
  const [searchInput, setSearchInput] = useState("");
  const search = useDeferredValue(searchInput.trim());
  const [sort, setSort] = useState<Sort>("recent");

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<ClientsResponse>(
    (index, previous) => {
      if (previous && previous.page * previous.limit >= previous.total) return null;
      return withQuery("/api/v1/business/clients", { search, sort, page: index + 1, limit: 25 });
    },
    studioFetcher,
  );

  const clients = data?.flatMap((page) => page.clients) ?? [];
  const first = data?.[0];
  const hasMore = first ? clients.length < first.total : false;
  const dateOf = (value: string | null) =>
    value ? formatDate(value, timezone, { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader title="Clients" description="Everyone who has booked with your business." />

      {first ? (
        <div className="grid *:min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Clients" value={first.summary.totalClients} />
          <StatTile label="New this month" value={first.summary.newThisMonth} />
          <StatTile label="Returning" value={first.summary.returningClients} hint="2+ completed visits" />
          <StatTile label="Return rate" value={formatPercentBp(first.summary.returningRateBp)} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search clients</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or email"
            className="min-h-11 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pr-4 pl-9 text-sm focus-ring"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="min-h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus-ring"
          >
            <option value="recent">Most recent</option>
            <option value="name">Name</option>
            <option value="visits">Most visits</option>
            <option value="spend">Highest spend</option>
          </select>
        </label>
      </div>

      {isLoading && clients.length === 0 ? (
        <SkeletonRows label="Loading clients" />
      ) : error && clients.length === 0 ? (
        <ErrorState description="We couldn't load your clients." onRetry={() => void mutate()} />
      ) : clients.length === 0 ? (
        <EmptyPanel
          icon={<Users aria-hidden="true" className="size-6" />}
          title={search ? "No matching clients" : "No clients yet"}
          description={
            search
              ? `Nobody matches “${search}”.`
              : "Clients appear here as soon as they book with you."
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-subtle)] md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)] uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Client</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Visits</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Last visit</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Next</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Spent</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-brand-soft)]/40">
                    <td className="px-4 py-3">
                      <Link href={`/studio/clients/${client.id}`} className="flex min-w-0 items-center gap-3">
                        <Avatar name={client.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-[var(--color-text-primary)] hover:underline">
                            {client.name}
                          </span>
                          <span className="block truncate text-xs text-[var(--color-text-muted)]">{client.email}</span>
                        </span>
                      </Link>
                      <Tags tags={client.tags} />
                    </td>
                    <td className="px-4 py-3">
                      {client.visits}
                      {client.noShows > 0 ? (
                        <span className="ml-2 text-xs text-[var(--color-danger)]">{client.noShows} no-show</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{dateOf(client.lastVisitAt)}</td>
                    <td className="px-4 py-3">{dateOf(client.nextAppointmentAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoney(client.totalSpentCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid *:min-w-0 gap-2 md:hidden">
            {clients.map((client) => (
              <li key={client.id}>
                <ClientCard client={client} lastVisit={dateOf(client.lastVisitAt)} />
              </li>
            ))}
          </ul>
        </>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="secondary" loading={size > (data?.length ?? 0)} onClick={() => void setSize(size + 1)}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1 pl-11">
      {tags.slice(0, 4).map((tag) => (
        <span key={tag} className="rounded-full bg-[var(--color-surface-strong)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
          {tag}
        </span>
      ))}
    </div>
  );
}

function ClientCard({ client, lastVisit }: { client: ClientRow; lastVisit: string }) {
  return (
    <Link
      href={`/studio/clients/${client.id}`}
      className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-subtle)]"
    >
      <Avatar name={client.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[var(--color-text-primary)]">{client.name}</p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">
          {client.visits} visit{client.visits === 1 ? "" : "s"} · Last {lastVisit}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-[var(--color-text-primary)]">
        {formatMoney(client.totalSpentCents)}
      </span>
    </Link>
  );
}
