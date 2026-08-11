"use client";

import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { DisputeStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useDisputes } from "@/hooks/useDisputes";
import { DISPUTE_CASE_TYPE_LABELS } from "@/lib/resolution/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DisputesList() {
  const { disputes, isLoading, error, refresh } = useDisputes();

  return (
    <section className="grid gap-6">
      <div className="surface-panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
            Resolution center
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
            My disputes
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Open a case if something went wrong with an appointment or order.
          </p>
        </div>
        <Link href="/disputes/new">
          <Button>Open a dispute</Button>
        </Link>
      </div>

      {isLoading && disputes.length === 0 ? (
        <LoadingSkeleton label="Loading disputes" lines={4} />
      ) : error && disputes.length === 0 ? (
        <ErrorState description="We couldn't load your cases." onRetry={() => void refresh()} />
      ) : disputes.length === 0 ? (
        <EmptyState
          title="No cases yet"
          description="If something goes wrong with a booking or order, you can open a case here."
          action={
            <Link href="/disputes/new">
              <Button variant="secondary">Open a dispute</Button>
            </Link>
          }
        />
      ) : (
        <ul role="list" className="grid gap-3">
          {disputes.map((dispute) => (
            <li key={dispute.id}>
              <Link
                href={`/disputes/${dispute.id}`}
                className="surface-panel flex items-center justify-between gap-4 p-4 transition-colors hover:border-[var(--color-brand)]"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {DISPUTE_CASE_TYPE_LABELS[dispute.caseType]}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {dispute.referenceNumber} · Opened {formatDate(dispute.createdAt)}
                  </p>
                </div>
                <DisputeStatusBadge status={dispute.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
