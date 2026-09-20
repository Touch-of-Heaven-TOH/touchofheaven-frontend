"use client";

import { ArrowRight, TriangleAlert } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { AdminPanel } from "@/features/admin/components/AdminPrimitives";
import { adminFetcher, errorMessage, withQuery } from "@/features/admin/lib/api";
import type { AuditEntry } from "@/features/admin/lib/admin-types";

/**
 * Who changed what, when, and why. Reads the platform-wide AuditLog
 * filtered to one event type, so this same component serves the policies
 * page and the system page without either owning its own trail.
 *
 * The before/after pair is shown side by side rather than as a summary
 * sentence: on a system that moves money, "0 to 15" and "15 to 0" must
 * never be things a reader has to infer.
 */

type ChangeMetadata = {
  changeNote?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

const FIELD_LABELS: Record<string, string> = {
  platformFeePercent: "Platform fee",
  minimumBookingValueCents: "Minimum booking value",
  cancellationWindowHours: "Cancellation window",
  maxRefundDays: "Refund window",
  termsOfServiceUrl: "Terms of service",
  privacyPolicyUrl: "Privacy policy",
  providerCodeOfConductUrl: "Provider code of conduct",
  maintenanceMode: "Maintenance mode",
  maintenanceMessage: "Maintenance message",
  newRegistrationsEnabled: "New registrations",
  aiStudioEnabled: "AI Studio",
  marketplaceEnabled: "Marketplace",
  maxBookingsPerDay: "Max bookings per day",
};

function label(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/** null and true/false need words, not an empty cell or a raw literal. */
function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "not set";
  if (value === true) return "on";
  if (value === false) return "off";
  return String(value);
}

function isChangeMetadata(value: unknown): value is ChangeMetadata {
  return typeof value === "object" && value !== null;
}

export function AuditTrail({
  event,
  title,
  emptyText,
  limit = 20,
}: {
  event: string;
  title: string;
  emptyText: string;
  limit?: number;
}) {
  const { data, error, isLoading, mutate } = useSWR<{ entries: AuditEntry[] }>(
    withQuery("/api/v1/admin/audit", { event, limit: String(limit) }),
    adminFetcher,
  );

  const entries = data?.entries ?? [];

  return (
    <AdminPanel title={title}>
      {isLoading ? (
        <div className="grid gap-2" aria-busy="true" aria-label="Loading the change history">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-md bg-[var(--color-surface-strong)]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="grid justify-items-start gap-3">
          <p className="flex items-center gap-2 font-bold text-[var(--color-danger)]">
            <TriangleAlert aria-hidden="true" size={18} />
            {errorMessage(error, "We couldn't load the change history.")}
          </p>
          <Button onClick={() => void mutate()}>Try again</Button>
        </div>
      ) : entries.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          {emptyText}
        </p>
      ) : (
        <ol role="list" className="grid gap-3">
          {entries.map((entry) => {
            const meta = isChangeMetadata(entry.metadata) ? entry.metadata : {};
            const fields = Object.keys(meta.after ?? {});
            return (
              <li
                key={entry.id}
                className="rounded-md border border-[var(--color-border)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold text-[var(--color-text-primary)]">
                    {entry.actor?.name ?? "A removed account"}
                  </p>
                  <time
                    dateTime={entry.createdAt}
                    className="text-xs text-[var(--color-text-muted)]"
                  >
                    {new Date(entry.createdAt).toLocaleString()}
                  </time>
                </div>

                {meta.changeNote ? (
                  <p className="mt-2 rounded-md bg-[var(--color-surface-strong)] px-3 py-2 text-sm">
                    {meta.changeNote}
                  </p>
                ) : null}

                {fields.length > 0 ? (
                  <ul role="list" className="mt-3 grid gap-1.5">
                    {fields.map((field) => (
                      <li
                        key={field}
                        className="grid gap-1 text-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-2"
                      >
                        <span className="font-bold text-[var(--color-text-primary)] sm:col-span-3">
                          {label(field)}
                        </span>
                        <span className="rounded-md bg-[var(--color-danger-soft)] px-2 py-1 text-[var(--color-danger)] [overflow-wrap:anywhere]">
                          {display(meta.before?.[field])}
                        </span>
                        <ArrowRight
                          aria-label="changed to"
                          size={14}
                          className="hidden shrink-0 text-[var(--color-text-muted)] sm:block"
                        />
                        <span className="rounded-md bg-[var(--color-success-soft)] px-2 py-1 text-[var(--color-success)] [overflow-wrap:anywhere]">
                          {display(meta.after?.[field])}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </AdminPanel>
  );
}
