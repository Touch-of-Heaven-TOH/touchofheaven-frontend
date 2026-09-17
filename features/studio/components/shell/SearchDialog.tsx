"use client";

import { CalendarDays, Scissors, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import useSWR from "swr";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import { StatusPill } from "@/features/studio/components/ui/primitives";
import { studioFetcher, withQuery } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import { formatDateTime, formatMoney } from "@/features/studio/lib/format";
import type { SearchResponse } from "@/features/studio/lib/types";

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <SearchDialogBody onClose={onClose} />;
}

function SearchDialogBody({ onClose }: { onClose: () => void }) {
  const { timezone } = useStudio();
  const [input, setInput] = useState("");
  const query = useDeferredValue(input.trim());
  const { data, isLoading } = useSWR<SearchResponse>(
    query.length >= 2 ? withQuery("/api/v1/business/search", { q: query }) : null,
    studioFetcher,
    { keepPreviousData: true },
  );

  const total = data ? data.clients.length + data.appointments.length + data.services.length : 0;

  return (
    <StudioDialog open onClose={onClose} title="Search" size="lg">
      <div className="grid gap-4">
        <label className="relative block">
          <span className="sr-only">Search clients, bookings and services</span>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            autoFocus
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search clients, bookings and services"
            className="min-h-12 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pr-3 pl-10 text-[15px] focus-ring"
          />
        </label>

        {query.length < 2 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Type at least two letters.</p>
        ) : isLoading && !data ? (
          <p role="status" className="text-sm text-[var(--color-text-muted)]">
            Searching…
          </p>
        ) : total === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No results for “{query}”.</p>
        ) : data ? (
          <div className="grid gap-5">
            {data.clients.length > 0 ? (
              <Group title="Clients">
                {data.clients.map((client) => (
                  <ResultLink key={client.id} href={client.href} onClose={onClose} icon={<UserRound className="size-4" />}>
                    <span className="block truncate text-sm font-medium">{client.name}</span>
                    <span className="block truncate text-xs text-[var(--color-text-muted)]">{client.email}</span>
                  </ResultLink>
                ))}
              </Group>
            ) : null}
            {data.appointments.length > 0 ? (
              <Group title="Bookings">
                {data.appointments.map((appointment) => (
                  <ResultLink
                    key={appointment.id}
                    href={appointment.href}
                    onClose={onClose}
                    icon={<CalendarDays className="size-4" />}
                    trailing={<StatusPill status={appointment.status} />}
                  >
                    <span className="block truncate text-sm font-medium">{appointment.title}</span>
                    <span className="block truncate text-xs text-[var(--color-text-muted)]">
                      {formatDateTime(appointment.startAt, timezone)}
                    </span>
                  </ResultLink>
                ))}
              </Group>
            ) : null}
            {data.services.length > 0 ? (
              <Group title="Services">
                {data.services.map((service) => (
                  <ResultLink key={service.id} href={service.href} onClose={onClose} icon={<Scissors className="size-4" />}>
                    <span className="block truncate text-sm font-medium">{service.name}</span>
                    <span className="block truncate text-xs text-[var(--color-text-muted)]">
                      From {formatMoney(service.priceCents)}
                    </span>
                  </ResultLink>
                ))}
              </Group>
            ) : null}
          </div>
        ) : null}
      </div>
    </StudioDialog>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">{title}</h3>
      <ul className="grid gap-1">{children}</ul>
    </section>
  );
}

function ResultLink({
  href,
  icon,
  children,
  trailing,
  onClose,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className="flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--color-brand-soft)]"
      >
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          {icon}
        </span>
        <span className="min-w-0 flex-1">{children}</span>
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
      </Link>
    </li>
  );
}
