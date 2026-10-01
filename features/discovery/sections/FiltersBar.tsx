"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { SearchDate } from "@/components/search/search-date";
import { classNames } from "@/features/discovery/DiscoveryShell";
import { DEFAULT_SEARCH_RADIUS_KM, SEARCH_RADIUS_OPTIONS_KM } from "@/features/discovery/nearby";
import type { DiscoveryLocationType } from "@/lib/discovery/types";

/*
 * The discovery filter controls: the inline selects on a wide screen and
 * the sheet a phone opens instead.
 *
 * Split out of DiscoveryResults so the filters can be dropped into the one
 * merged discovery page without carrying a thousand lines of list and map
 * code with them. The filter shape itself lives here too, because this is
 * the file that decides what a filter is.
 */

export type Filters = {
  radiusKm: number;
  locationType: DiscoveryLocationType | null;
  acceptingNewClients: boolean;
  availability: SearchDate;
  minRating: number;
};

export const DEFAULT_FILTERS: Filters = {
  radiusKm: DEFAULT_SEARCH_RADIUS_KM,
  locationType: null,
  acceptingNewClients: false,
  availability: "any",
  minRating: 0,
};

export const LOCATION_TYPE_OPTIONS: Array<{
  value: DiscoveryLocationType | null;
  label: string;
}> = [
  { value: null, label: "Any" },
  { value: "PUBLIC_SALON", label: "Salon" },
  { value: "PRIVATE_STUDIO", label: "Private studio" },
  { value: "MOBILE", label: "Comes to you" },
];

export function FilterSelect({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative inline-flex min-h-12 shrink-0 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white pl-4 pr-9 text-sm font-semibold shadow-[var(--shadow-subtle)] focus-within:border-[var(--color-brand)]">
      {icon}
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 cursor-pointer appearance-none bg-transparent pr-1 font-semibold outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3" />
    </label>
  );
}

type DialogFilters = Pick<Filters, "locationType" | "acceptingNewClients">;

export function FiltersDialog({
  open,
  filters,
  onClose,
  onApply,
}: {
  open: boolean;
  filters: Filters;
  onClose: () => void;
  onApply: (filters: DialogFilters) => void;
}) {
  if (!open) return null;
  return (
    <FiltersDialogPanel
      initial={{ locationType: filters.locationType, acceptingNewClients: filters.acceptingNewClients }}
      onClose={onClose}
      onApply={onApply}
    />
  );
}

function FiltersDialogPanel({
  initial,
  onClose,
  onApply,
}: {
  initial: DialogFilters;
  onClose: () => void;
  onApply: (filters: DialogFilters) => void;
}) {
  const [draft, setDraft] = useState<DialogFilters>(initial);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[var(--z-overlay,60)] flex justify-end bg-black/45">
      <button type="button" aria-label="Close filters" className="hidden flex-1 sm:block" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
        className="flex h-dvh w-full flex-col bg-[var(--color-page)] shadow-[var(--shadow-soft)] sm:max-w-lg"
      >
        <header className="flex min-h-[76px] items-center justify-between gap-3 border-b border-[var(--color-border)] px-5">
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-[var(--radius-control)] hover:bg-[var(--color-brand-soft)]"
          >
            <X size={26} aria-hidden="true" />
          </button>
          <h2 id="filters-title" className="font-serif text-3xl font-semibold">
            More filters
          </h2>
          <button
            type="button"
            onClick={() => setDraft({ locationType: null, acceptingNewClients: false })}
            className="min-h-11 rounded-[var(--radius-control)] px-3 font-semibold text-[var(--color-copper)]"
          >
            Clear all
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white">
            <fieldset className="border-b border-[var(--color-border)] p-5">
              <legend className="sr-only">Where the service happens</legend>
              <p aria-hidden="true" className="mb-4 text-lg font-semibold">Where the service happens</p>
              <div className="flex flex-wrap gap-2">
                {LOCATION_TYPE_OPTIONS.map((option) => {
                  const active = draft.locationType === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setDraft((current) => ({ ...current, locationType: option.value }))}
                      className={classNames(
                        "inline-flex min-h-11 items-center rounded-[var(--radius-control)] border px-4 text-sm font-semibold transition",
                        active
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                          : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Private studios show an approximate area until a booking is confirmed.
              </p>
            </fieldset>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p id="accepting-label" className="text-lg font-semibold">Taking new clients</p>
                <p className="text-sm text-[var(--color-text-muted)]">Hide businesses that only see existing clients.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.acceptingNewClients}
                aria-labelledby="accepting-label"
                onClick={() => setDraft((current) => ({ ...current, acceptingNewClients: !current.acceptingNewClients }))}
                className={classNames(
                  "relative h-8 w-14 shrink-0 rounded-full transition",
                  draft.acceptingNewClients ? "bg-[var(--color-brand)]" : "bg-[var(--color-skeleton)]",
                )}
              >
                <span
                  className={classNames(
                    "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all",
                    draft.acceptingNewClients ? "left-7" : "left-1",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        <footer className="grid grid-cols-[0.8fr_1.2fr] gap-3 border-t border-[var(--color-border)] bg-[var(--color-page)] p-5">
          <button type="button" onClick={onClose} className="min-h-12 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="min-h-12 rounded-[var(--radius-control)] bg-[var(--color-brand)] font-bold text-white transition hover:bg-[var(--color-brand-strong)]"
          >
            Show results
          </button>
        </footer>
      </section>
    </div>
  );
}
