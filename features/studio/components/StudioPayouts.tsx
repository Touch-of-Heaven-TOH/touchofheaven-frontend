"use client";

import useSWR from "swr";
import { StatusBadge, type StatusTone } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { browserApiFetch } from "@/lib/api/browser";

type Payout = {
  id: string;
  amountCents: number;
  currency: string;
  status: "INITIATED" | "IN_TRANSIT" | "PAID" | "FAILED" | "CANCELLED";
  initiatedAt: string;
  expectedArrivalAt: string | null;
  arrivedAt: string | null;
};

type PayoutsResponse = { payouts: Payout[] };

const STATUS_TONE: Record<Payout["status"], StatusTone> = {
  INITIATED: "info",
  IN_TRANSIT: "warning",
  PAID: "success",
  FAILED: "danger",
  CANCELLED: "neutral",
};

const STATUS_LABEL: Record<Payout["status"], string> = {
  INITIATED: "Initiated",
  IN_TRANSIT: "In transit",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

function fetchPayouts(path: string): Promise<PayoutsResponse> {
  return browserApiFetch<PayoutsResponse>(path);
}

export function StudioPayouts() {
  const { data, error, isLoading, mutate } = useSWR<PayoutsResponse>(
    "/api/v1/professional/payouts",
    fetchPayouts,
  );
  const payouts = data?.payouts ?? [];

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">Studio</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">Payouts</h1>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4 text-sm text-[var(--color-warning)]">
        Connecting or changing your payout bank account isn&apos;t available yet - that requires a
        Stripe Connect onboarding flow this platform hasn&apos;t built. This page shows your payout
        history from what has already been sent.
      </div>

      {isLoading && payouts.length === 0 ? (
        <LoadingSkeleton label="Loading payouts" lines={4} />
      ) : error && payouts.length === 0 ? (
        <ErrorState description="We couldn't load your payouts." onRetry={() => void mutate()} />
      ) : payouts.length === 0 ? (
        <EmptyState
          title="No payouts yet"
          description="Payouts sent to you will show up here."
        />
      ) : (
        <div className="surface-panel relative overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3">Initiated</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expected arrival</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3">
                    {new Date(payout.initiatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                    {formatPrice(payout.amountCents, payout.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={STATUS_TONE[payout.status]} label={STATUS_LABEL[payout.status]} />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {payout.arrivedAt
                      ? `Arrived ${new Date(payout.arrivedAt).toLocaleDateString()}`
                      : payout.expectedArrivalAt
                        ? new Date(payout.expectedArrivalAt).toLocaleDateString()
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
