"use client";

import { Landmark, Wallet } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  Card,
  EmptyPanel,
  PageHeader,
  Pill,
  SkeletonRows,
  StatTile,
} from "@/features/studio/components/ui/primitives";
import { studioFetcher } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import { formatDate, formatMoney } from "@/features/studio/lib/format";
import type { EarningsResponse } from "@/features/studio/lib/types";

const EARNING_STATUS = {
  PENDING: { label: "Pending", tone: "warning" },
  AVAILABLE: { label: "Available", tone: "info" },
  PAID: { label: "Paid out", tone: "success" },
  REVERSED: { label: "Refunded", tone: "neutral" },
} as const;

const PAYOUT_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  PAID: "success",
  IN_TRANSIT: "warning",
  INITIATED: "warning",
  FAILED: "danger",
  CANCELLED: "neutral",
};

export function StudioEarningsDashboard() {
  const studio = useStudio();
  const { data, error, isLoading, mutate } = useSWR<EarningsResponse>("/api/v1/business/earnings", studioFetcher);

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader
        title="Earnings"
        description="Deposits the platform holds for you, and money you collected in person."
        actions={
          studio.isOwner ? (
            <Link href="/studio/settings/payouts" className="btn-secondary">
              <Landmark aria-hidden="true" className="size-4" />
              Payouts
            </Link>
          ) : null
        }
      />

      {isLoading && !data ? (
        <SkeletonRows label="Loading earnings" rows={4} />
      ) : error && !data ? (
        <ErrorState description="We couldn't load your earnings." onRetry={() => void mutate()} />
      ) : data ? (
        <>
          <section className="grid *:min-w-0 gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">Held by Touch of Heaven</h2>
            <div className="grid *:min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Available" value={formatMoney(data.balances.availableCents)} hint="Ready for your next payout" />
              <StatTile label="Pending" value={formatMoney(data.balances.pendingCents)} hint="Clears after the appointment" />
              <StatTile label="Paid out" value={formatMoney(data.balances.paidOutCents)} hint="All time" />
              <StatTile label="Platform fees" value={formatMoney(data.lifetime.platformFeeCents)} hint="All time" />
            </div>
          </section>

          <section className="grid *:min-w-0 gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">This month</h2>
            <div className="grid *:min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Service value" value={formatMoney(data.thisMonth.serviceValueCents)} hint={`${data.thisMonth.completedAppointments} completed`} />
              <StatTile label="Deposits" value={formatMoney(data.thisMonth.depositsCents)} hint="Paid through the app" />
              <StatTile label="Collected in person" value={formatMoney(data.thisMonth.collectedInPersonCents)} hint="Cash, card, mobile money" />
              <StatTile label="Tips" value={formatMoney(data.thisMonth.tipsCents)} />
            </div>
          </section>

          {data.payoutAccount && !data.payoutAccount.payoutsEnabled ? (
            <p className="rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
              Payouts are not enabled yet for your {data.payoutAccount.provider.toLowerCase().replace("_", " ")} account
              ({data.payoutAccount.onboardingState.toLowerCase().replaceAll("_", " ")}).
            </p>
          ) : null}

          <div className="grid *:min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Card title="Recent earnings">
              {data.earnings.length === 0 ? (
                <EmptyPanel
                  icon={<Wallet aria-hidden="true" className="size-6" />}
                  title="No earnings yet"
                  description="Each deposit a client pays through the app appears here, net of the platform fee."
                />
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="text-xs text-[var(--color-text-muted)] uppercase">
                      <tr>
                        <th scope="col" className="py-2 font-semibold">Booking</th>
                        <th scope="col" className="py-2 text-right font-semibold">Gross</th>
                        <th scope="col" className="py-2 text-right font-semibold">Fee</th>
                        <th scope="col" className="py-2 text-right font-semibold">Net</th>
                        <th scope="col" className="py-2 text-right font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="[font-variant-numeric:tabular-nums]">
                      {data.earnings.map((earning) => (
                        <tr key={earning.id} className="border-t border-[var(--color-border)]">
                          <td className="py-2.5 pr-3">
                            {earning.sourceType === "APPOINTMENT" ? (
                              <Link
                                href={`/studio/appointments/${earning.sourceId}`}
                                className="block max-w-64 truncate font-semibold text-[var(--color-text-primary)] hover:underline"
                              >
                                {earning.description}
                              </Link>
                            ) : (
                              <span className="block max-w-64 truncate font-semibold">{earning.description}</span>
                            )}
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {formatDate(earning.serviceDate ?? earning.createdAt, studio.timezone, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">{formatMoney(earning.grossAmountCents)}</td>
                          <td className="py-2.5 text-right text-[var(--color-text-muted)]">−{formatMoney(earning.platformFeeCents)}</td>
                          <td className="py-2.5 text-right font-semibold">{formatMoney(earning.netAmountCents)}</td>
                          <td className="py-2.5 text-right">
                            <Pill tone={EARNING_STATUS[earning.status].tone}>{EARNING_STATUS[earning.status].label}</Pill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Payouts">
              {data.payouts.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No payouts yet.</p>
              ) : (
                <ul className="grid *:min-w-0 gap-3">
                  {data.payouts.map((payout) => (
                    <li key={payout.id} className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-text-primary)]">{formatMoney(payout.amountCents, payout.currency)}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {formatDate(payout.initiatedAt, studio.timezone, { month: "short", day: "numeric", year: "numeric" })} ·{" "}
                          {payout.itemCount} item{payout.itemCount === 1 ? "" : "s"}
                          {payout.failureMessage ? ` · ${payout.failureMessage}` : ""}
                        </p>
                      </div>
                      <Pill tone={PAYOUT_TONE[payout.status] ?? "neutral"}>
                        {payout.status.charAt(0) + payout.status.slice(1).toLowerCase().replaceAll("_", " ")}
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
