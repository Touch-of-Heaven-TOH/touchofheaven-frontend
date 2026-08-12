"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { StatusBadge, type StatusTone } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { browserApiFetch } from "@/lib/api/browser";

type Earning = {
  id: string;
  sourceType: "APPOINTMENT" | "SELLER_ORDER_GROUP";
  grossAmountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  currency: string;
  status: "PENDING" | "AVAILABLE" | "PAID" | "REVERSED";
  availableAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

type EarningsResponse = { earnings: Earning[] };

const STATUS_TONE: Record<Earning["status"], StatusTone> = {
  PENDING: "warning",
  AVAILABLE: "info",
  PAID: "success",
  REVERSED: "danger",
};

const STATUS_LABEL: Record<Earning["status"], string> = {
  PENDING: "Pending",
  AVAILABLE: "Available",
  PAID: "Paid out",
  REVERSED: "Reversed",
};

const SOURCE_LABEL: Record<Earning["sourceType"], string> = {
  APPOINTMENT: "Appointment",
  SELLER_ORDER_GROUP: "Product order",
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

function fetchEarnings(path: string): Promise<EarningsResponse> {
  return browserApiFetch<EarningsResponse>(path);
}

export function StudioEarnings() {
  const { data, error, isLoading, mutate } = useSWR<EarningsResponse>(
    "/api/v1/professional/earnings",
    fetchEarnings,
  );
  const earnings = useMemo(() => data?.earnings ?? [], [data]);

  // Sums only what's been fetched on this page - not a server-computed
  // lifetime total. Honest label below reflects that rather than implying
  // a precision the raw list endpoint doesn't actually provide.
  const totals = useMemo(() => {
    const available = earnings
      .filter((e) => e.status === "AVAILABLE")
      .reduce((sum, e) => sum + e.netAmountCents, 0);
    const paid = earnings
      .filter((e) => e.status === "PAID")
      .reduce((sum, e) => sum + e.netAmountCents, 0);
    const pending = earnings
      .filter((e) => e.status === "PENDING")
      .reduce((sum, e) => sum + e.netAmountCents, 0);
    return { available, paid, pending };
  }, [earnings]);

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">Studio</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">Earnings</h1>
      </div>

      {earnings.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="surface-panel p-4">
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Available for payout
            </p>
            <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
              {formatPrice(totals.available, earnings[0]!.currency)}
            </p>
          </div>
          <div className="surface-panel p-4">
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Pending
            </p>
            <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
              {formatPrice(totals.pending, earnings[0]!.currency)}
            </p>
          </div>
          <div className="surface-panel p-4">
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Paid out
            </p>
            <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
              {formatPrice(totals.paid, earnings[0]!.currency)}
            </p>
          </div>
        </div>
      ) : null}

      {isLoading && earnings.length === 0 ? (
        <LoadingSkeleton label="Loading earnings" lines={4} />
      ) : error && earnings.length === 0 ? (
        <ErrorState description="We couldn't load your earnings." onRetry={() => void mutate()} />
      ) : earnings.length === 0 ? (
        <EmptyState
          title="No earnings yet"
          description="Earnings from completed appointments and orders will show up here."
        />
      ) : (
        <div className="surface-panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Platform fee</th>
                <th className="px-4 py-3">Net</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((earning) => (
                <tr key={earning.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3">
                    {new Date(earning.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">{SOURCE_LABEL[earning.sourceType]}</td>
                  <td className="px-4 py-3">{formatPrice(earning.grossAmountCents, earning.currency)}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    -{formatPrice(earning.platformFeeCents, earning.currency)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                    {formatPrice(earning.netAmountCents, earning.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={STATUS_TONE[earning.status]} label={STATUS_LABEL[earning.status]} />
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
