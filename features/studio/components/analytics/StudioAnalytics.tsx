"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { ErrorState } from "@/components/shared/ErrorState";
import { ColumnChart } from "@/features/studio/components/analytics/ColumnChart";
import {
  Card,
  PageHeader,
  Segmented,
  SkeletonRows,
  StatTile,
} from "@/features/studio/components/ui/primitives";
import { studioFetcher, withQuery } from "@/features/studio/lib/api";
import {
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  addDaysToKey,
  formatMoney,
  formatPercentBp,
  keyToLabel,
} from "@/features/studio/lib/format";
import type { AnalyticsRange, AnalyticsResponse } from "@/features/studio/lib/types";

const RANGE_LABEL: Record<AnalyticsRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

function compactMoney(cents: number) {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(dollars >= 10_000 ? 0 : 1)}K`;
  return `$${Math.round(dollars)}`;
}

function hourLabel(hour: number) {
  const suffix = hour < 12 ? "am" : "pm";
  return `${hour % 12 === 0 ? 12 : hour % 12}${suffix}`;
}

export function StudioAnalytics() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const { data, error, isLoading, isValidating, mutate } = useSWR<AnalyticsResponse>(
    withQuery("/api/v1/business/analytics", { range }),
    studioFetcher,
    { keepPreviousData: true },
  );

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader title="Analytics" description="How your business is doing, in your own timezone." />

      <Segmented
        label="Date range"
        value={range}
        onChange={setRange}
        options={(Object.keys(RANGE_LABEL) as AnalyticsRange[]).map((value) => ({
          value,
          label: RANGE_LABEL[value],
        }))}
      />

      {isLoading && !data ? (
        <SkeletonRows label="Loading analytics" rows={4} />
      ) : error && !data ? (
        <ErrorState description="We couldn't load analytics." onRetry={() => void mutate()} />
      ) : data ? (
        <div className={`grid *:min-w-0 gap-5 transition-opacity ${isValidating ? "opacity-60" : ""}`} aria-busy={isValidating}>
          <p className="text-sm text-[var(--color-text-muted)]">
            {keyToLabel(data.period.start, { month: "short", day: "numeric", year: "numeric" })} –{" "}
            {keyToLabel(data.period.end, { month: "short", day: "numeric", year: "numeric" })} · compared with
            the previous {RANGE_LABEL[data.range].replace("Last ", "")}
          </p>

          <div className="grid *:min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Revenue" value={formatMoney(data.metrics.revenueCents)} changeBp={data.changes.revenueBp} hint={`${formatMoney(data.metrics.tipsCents)} tips`} />
            <StatTile label="Bookings" value={data.metrics.bookings} changeBp={data.changes.bookingsBp} hint={`${data.metrics.completed} completed`} />
            <StatTile label="Average ticket" value={formatMoney(data.metrics.averageTicketCents)} changeBp={data.changes.averageTicketBp} />
            <StatTile label="New clients" value={data.metrics.newClients} changeBp={data.changes.newClientsBp} hint={`${data.metrics.clients} seen`} />
          </div>

          <div className="grid *:min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Completion rate" value={formatPercentBp(data.metrics.completionRateBp)} />
            <StatTile label="Cancellation rate" value={formatPercentBp(data.metrics.cancellationRateBp)} hint={`${data.metrics.cancellations} cancelled`} />
            <StatTile label="No-show rate" value={formatPercentBp(data.metrics.noShowRateBp)} hint={`${data.metrics.noShows} no-shows`} />
            <StatTile label="Returning clients" value={formatPercentBp(data.metrics.returningRateBp)} hint={`${data.metrics.returningClients} returning`} />
          </div>

          <ColumnChart
            title="Revenue"
            valueHeader="Revenue"
            formatValue={compactMoney}
            data={data.series.map((point) => {
              const label =
                data.bucket === "month"
                  ? keyToLabel(point.key, { month: "short" })
                  : keyToLabel(point.key, { month: "short", day: "numeric" });
              const fullLabel =
                data.bucket === "month"
                  ? keyToLabel(point.key, { month: "long", year: "numeric" })
                  : data.bucket === "week"
                    ? `Week of ${keyToLabel(point.key, { month: "short", day: "numeric" })} – ${keyToLabel(addDaysToKey(point.key, 6), { month: "short", day: "numeric" })}`
                    : keyToLabel(point.key, { weekday: "short", month: "short", day: "numeric" });
              return {
                key: point.key,
                label,
                fullLabel,
                value: point.revenueCents,
                detail: `${point.completed} completed of ${point.bookings} booked · ${formatMoney(point.revenueCents)}`,
              };
            })}
            footer={data.definitions.revenue}
          />

          <div className="grid *:min-w-0 gap-4 lg:grid-cols-2">
            <ColumnChart
              title="Busiest days"
              valueHeader="Bookings"
              formatValue={(value) => String(Math.round(value))}
              data={data.busiestDays.map((count, day) => ({ day, count }))
                .slice(1)
                .concat({ day: 0, count: data.busiestDays[0] ?? 0 })
                .map(({ day, count }) => ({
                  key: String(day),
                  label: WEEKDAY_SHORT[day] ?? "",
                  fullLabel: WEEKDAY_LONG[day] ?? "",
                  value: count,
                  detail: `${count} booking${count === 1 ? "" : "s"}`,
                }))}
            />
            <ColumnChart
              title="Busiest start times"
              valueHeader="Bookings"
              formatValue={(value) => String(Math.round(value))}
              data={(() => {
                const used = data.busiestHours
                  .map((count, hour) => ({ count, hour }))
                  .filter((row) => row.count > 0);
                const first = Math.min(8, ...used.map((row) => row.hour));
                const last = Math.max(19, ...used.map((row) => row.hour));
                return data.busiestHours.slice(first, last + 1).map((count, index) => {
                  const hour = first + index;
                  return {
                    key: String(hour),
                    label: hourLabel(hour),
                    fullLabel: `${hourLabel(hour)} – ${hourLabel((hour + 1) % 24)}`,
                    value: count,
                    detail: `${count} booking${count === 1 ? "" : "s"}`,
                  };
                });
              })()}
            />
          </div>

          <div className="grid *:min-w-0 gap-4 xl:grid-cols-2">
            <Card title="Top services">
              {data.topServices.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No bookings in this period.</p>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs text-[var(--color-text-muted)] uppercase">
                      <tr>
                        <th scope="col" className="py-2 font-semibold">Service</th>
                        <th scope="col" className="py-2 text-right font-semibold">Booked</th>
                        <th scope="col" className="py-2 text-right font-semibold">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="[font-variant-numeric:tabular-nums]">
                      {data.topServices.map((service) => {
                        const top = data.topServices[0]?.revenueCents || 1;
                        return (
                          <tr key={service.serviceId} className="border-t border-[var(--color-border)]">
                            <td className="py-2.5 pr-3">
                              <span className="block truncate font-semibold text-[var(--color-text-primary)]">{service.name}</span>
                              <span aria-hidden="true" className="mt-1.5 block h-2 rounded-full bg-[var(--color-surface-strong)]">
                                <span
                                  className="block h-2 rounded-full bg-[var(--color-brand)]"
                                  style={{ width: `${(service.revenueCents / top) * 100}%` }}
                                />
                              </span>
                            </td>
                            <td className="py-2.5 text-right">{service.bookings}</td>
                            <td className="py-2.5 text-right font-semibold">{formatMoney(service.revenueCents)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {data.team.length > 0 ? (
              <Card title="Team performance">
                <div className="relative overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs text-[var(--color-text-muted)] uppercase">
                      <tr>
                        <th scope="col" className="py-2 font-semibold">Team member</th>
                        <th scope="col" className="py-2 text-right font-semibold">Completed</th>
                        <th scope="col" className="py-2 text-right font-semibold">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="[font-variant-numeric:tabular-nums]">
                      {data.team.map((row) => (
                        <tr key={row.teamMemberId ?? "owner"} className="border-t border-[var(--color-border)]">
                          <td className="py-2.5 font-semibold text-[var(--color-text-primary)]">{row.name}</td>
                          <td className="py-2.5 text-right">
                            {row.completed} / {row.bookings}
                          </td>
                          <td className="py-2.5 text-right font-semibold">{formatMoney(row.revenueCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card title="How these numbers work">
                <ul className="grid *:min-w-0 gap-2 text-sm text-[var(--color-text-muted)]">
                  {Object.entries(data.definitions).map(([key, text]) => (
                    <li key={key} className="flex gap-2">
                      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--color-brand)]" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
