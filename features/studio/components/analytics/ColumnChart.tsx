"use client";

import { useId, useState, type ReactNode } from "react";

export type ColumnDatum = {
  key: string;
  /** Axis label - kept short; long names belong in the tooltip. */
  label: string;
  /** Full label for the tooltip and table view. */
  fullLabel: string;
  value: number;
  /** Secondary line in the tooltip, e.g. "4 bookings". */
  detail?: string;
};

function niceMax(value: number) {
  if (value <= 0) return 1;
  const exponent = 10 ** Math.floor(Math.log10(value));
  const fraction = value / exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * exponent;
}

/**
 * A single-series column chart built from plain HTML so every bar is a
 * real focusable element with its own tooltip. Follows the data-viz spec:
 * one hue, columns capped at 24px with a 4px rounded data-end and a square
 * baseline, a 2px gap between neighbours, hairline gridlines, sparse axis
 * labels, and a table view that exposes every value without hovering.
 */
export function ColumnChart({
  title,
  data,
  formatValue,
  valueHeader,
  emptyText = "No data for this period.",
  footer,
}: {
  title: string;
  data: ColumnDatum[];
  formatValue: (value: number) => string;
  valueHeader: string;
  emptyText?: string;
  footer?: ReactNode;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const titleId = useId();
  const max = niceMax(Math.max(0, ...data.map((datum) => datum.value)));
  const ticks = [max, max / 2, 0];
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));
  const isEmpty = data.every((datum) => datum.value === 0);
  const activeDatum = active === null ? null : data[active];

  return (
    <section
      aria-labelledby={titleId}
      className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)] sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id={titleId} className="text-base font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => setAsTable((value) => !value)}
          className="min-h-9 rounded-full px-3 text-xs font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
          aria-pressed={asTable}
        >
          {asTable ? "Show chart" : "View as table"}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[var(--color-text-muted)] uppercase">
              <tr>
                <th scope="col" className="py-2 font-semibold">Period</th>
                <th scope="col" className="py-2 text-right font-semibold">{valueHeader}</th>
              </tr>
            </thead>
            <tbody className="[font-variant-numeric:tabular-nums]">
              {data.map((datum) => (
                <tr key={datum.key} className="border-t border-[var(--color-border)]">
                  <td className="py-2">{datum.fullLabel}</td>
                  <td className="py-2 text-right font-semibold">
                    {formatValue(datum.value)}
                    {datum.detail ? (
                      <span className="block text-xs font-normal text-[var(--color-text-muted)]">{datum.detail}</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isEmpty ? (
        <p className="grid h-48 place-items-center rounded-xl bg-[var(--color-surface-strong)]/60 text-sm text-[var(--color-text-muted)]">
          {emptyText}
        </p>
      ) : (
        <div className="flex gap-2">
          <div className="relative h-48 w-12 shrink-0 text-right text-[11px] text-[var(--color-text-muted)] [font-variant-numeric:tabular-nums]">
            {ticks.map((tick, index) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2 whitespace-nowrap"
                style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
              >
                {formatValue(tick)}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative h-48" onPointerLeave={() => setActive(null)}>
              {ticks.map((tick, index) => (
                <div
                  key={tick}
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-[var(--color-border)]"
                  style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
                />
              ))}
              <div className="absolute inset-0 flex items-end">
                {data.map((datum, index) => {
                  const height = (datum.value / max) * 100;
                  return (
                    <button
                      key={datum.key}
                      type="button"
                      aria-label={`${datum.fullLabel}: ${formatValue(datum.value)}${datum.detail ? `, ${datum.detail}` : ""}`}
                      onPointerEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      onBlur={() => setActive(null)}
                      className="group flex h-full min-w-0 flex-1 items-end justify-center px-px focus-visible:outline-offset-0"
                    >
                      <span
                        aria-hidden="true"
                        className={`block w-full max-w-6 rounded-t-[4px] transition-colors ${
                          active === index ? "bg-[var(--color-brand-strong)]" : "bg-[var(--color-brand)]"
                        }`}
                        style={{ height: `${datum.value > 0 ? Math.max(height, 1.5) : 0}%` }}
                      />
                    </button>
                  );
                })}
              </div>
              {activeDatum && active !== null ? (
                <div
                  role="status"
                  className="pointer-events-none absolute top-0 z-10 w-max max-w-48 -translate-x-1/2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left shadow-[var(--shadow-soft)]"
                  style={{
                    left: `clamp(4.5rem, ${((active + 0.5) / data.length) * 100}%, calc(100% - 4.5rem))`,
                  }}
                >
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{formatValue(activeDatum.value)}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{activeDatum.fullLabel}</p>
                  {activeDatum.detail ? (
                    <p className="text-xs text-[var(--color-text-muted)]">{activeDatum.detail}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {/* Sparse labels are centred on their bar and free to be wider
                than one bar's slot - squeezing each into its own slot is what
                truncated "Aug 18" to "Aug ...". */}
            <div aria-hidden="true" className="relative mt-2 h-4 text-[11px] text-[var(--color-text-muted)]">
              {data.map((datum, index) =>
                index % labelEvery === 0 ? (
                  <span
                    key={datum.key}
                    className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
                    style={{
                      left: `clamp(1.25rem, ${((index + 0.5) / data.length) * 100}%, calc(100% - 1.25rem))`,
                    }}
                  >
                    {datum.label}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        </div>
      )}
      {footer ? <div className="mt-3 text-xs text-[var(--color-text-muted)]">{footer}</div> : null}
    </section>
  );
}
