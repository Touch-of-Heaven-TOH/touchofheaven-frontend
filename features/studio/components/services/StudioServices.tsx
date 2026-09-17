"use client";

import { Plus, Scissors } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  EmptyPanel,
  PageHeader,
  Pill,
  Segmented,
  SkeletonRows,
} from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";
import { formatDuration, formatMoney } from "@/features/studio/lib/format";
import type { OwnService, ServiceStatus } from "@/features/studio/lib/types";

export const SERVICE_STATUS: Record<ServiceStatus, { label: string; tone: "success" | "warning" | "neutral" | "info" }> = {
  PUBLISHED: { label: "Bookable", tone: "success" },
  DRAFT: { label: "Draft", tone: "neutral" },
  UNDER_REVIEW: { label: "In review", tone: "info" },
  PAUSED: { label: "Paused", tone: "warning" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

type Filter = "active" | "archived";

export function StudioServices() {
  const { data, error, isLoading, mutate } = useSWR<{ services: OwnService[] }>("/api/v1/services", studioFetcher);
  const [filter, setFilter] = useState<Filter>("active");
  const services = (data?.services ?? []).filter((service) =>
    filter === "archived" ? service.status === "ARCHIVED" : service.status !== "ARCHIVED",
  );

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader
        title="Services"
        description="What clients can book, and how it is priced."
        actions={
          <Link href="/studio/services/new" className="btn-primary">
            <Plus aria-hidden="true" className="size-4" />
            Add service
          </Link>
        }
      />
      <Segmented
        label="Service filter"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "active", label: "Current" },
          { value: "archived", label: "Archived" },
        ]}
      />
      {isLoading && !data ? (
        <SkeletonRows label="Loading services" />
      ) : error && !data ? (
        <ErrorState description="We couldn't load your services." onRetry={() => void mutate()} />
      ) : services.length === 0 ? (
        <EmptyPanel
          icon={<Scissors aria-hidden="true" className="size-6" />}
          title={filter === "archived" ? "No archived services" : "No services yet"}
          description={
            filter === "archived"
              ? "Services you retire are kept here so past bookings still make sense."
              : "Add your first service so clients can book you."
          }
          action={
            filter === "active" ? (
              <Link href="/studio/services/new" className="btn-primary">
                Add a service
              </Link>
            ) : null
          }
        />
      ) : (
        <ul className="grid *:min-w-0 gap-3 md:grid-cols-2">
          {services.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} onChanged={() => void mutate()} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ServiceCard({ service, onChanged }: { service: OwnService; onChanged: () => void }) {
  const notify = useToast();
  const [pending, setPending] = useState<ServiceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const move = async (status: ServiceStatus, message: string) => {
    setPending(status);
    setError(null);
    try {
      await studioRequest(`/api/v1/services/${service.id}/status`, "PATCH", { status });
      notify({ tone: "success", title: message });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  const meta = SERVICE_STATUS[service.status];

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-[var(--color-text-primary)]">{service.name}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            From {formatMoney(service.basePriceCents)} · {formatDuration(service.baseDurationMins)} ·{" "}
            {service.depositPercentage}% deposit
          </p>
        </div>
        <div className="shrink-0">
          <Pill tone={meta.tone}>{meta.label}</Pill>
        </div>
      </div>
      {service.description ? (
        <p className="line-clamp-2 text-sm text-[var(--color-text-muted)]">{service.description}</p>
      ) : null}
      <p className="text-xs text-[var(--color-text-muted)]">
        {service.variations.length} price option{service.variations.length === 1 ? "" : "s"}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] pt-3">
        {service.status !== "ARCHIVED" ? (
          <Button
            variant="ghost"
            loading={pending === "ARCHIVED"}
            disabled={pending !== null}
            onClick={() => void move("ARCHIVED", "Service archived")}
          >
            Archive
          </Button>
        ) : null}
        {service.status === "PUBLISHED" ? (
          <Button variant="secondary" loading={pending === "PAUSED"} disabled={pending !== null} onClick={() => void move("PAUSED", "Service paused")}>
            Pause
          </Button>
        ) : null}
        {service.status === "DRAFT" || service.status === "PAUSED" || service.status === "UNDER_REVIEW" ? (
          <Button variant="secondary" loading={pending === "PUBLISHED"} disabled={pending !== null} onClick={() => void move("PUBLISHED", "Service is now bookable")}>
            Publish
          </Button>
        ) : null}
        {service.status !== "ARCHIVED" ? (
          <Link href={`/studio/services/${service.id}`} className="btn-primary">
            Edit
          </Link>
        ) : null}
      </div>
    </article>
  );
}
