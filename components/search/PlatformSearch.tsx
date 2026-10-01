"use client";

import { useRouter } from "next/navigation";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DateField } from "@/components/search/DateField";
import type { SearchDate } from "@/components/search/search-date";

export type { SearchDate } from "@/components/search/search-date";

/*
 * The one search bar for the platform.
 *
 * There used to be a different one on each surface - the home page hero, the
 * client dashboard, and discovery - each with its own fields, its own styling
 * and its own idea of which query parameters to send. Two of the three threw
 * the typed term away: the hero sent `style=`, which no page reads, and the
 * dashboard sent its fields to /explore, which reads none of them. Styling a
 * change or fixing a bug meant finding every copy.
 *
 * This is the dashboard's three-field design, which is the one to keep, with
 * a single place that decides where a search goes and under which names.
 */

export type PlatformSearchValue = {
  q: string;
  location: string;
  date: SearchDate;
};

/**
 * Where a search goes. /businesses is the results page - the only one that
 * reads these parameters back - so every bar points there.
 */
export function searchResultsHref(value: PlatformSearchValue) {
  const params = new URLSearchParams();
  if (value.q.trim()) params.set("q", value.q.trim());
  if (value.location.trim()) params.set("location", value.location.trim());
  if (value.date !== "any") params.set("date", value.date);
  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

function sanitize(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

const RECENT_KEY = "toh_recent_searches";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 4).filter(Boolean) : [];
  } catch {
    // Recent searches are a convenience; a blocked or empty store is fine.
    return [];
  }
}

export function PlatformSearch({
  initialQuery = "",
  initialLocation = "",
  initialDate = "any",
  locationPlaceholder = "Location",
  showDate = true,
  showRecent = false,
  compact = false,
  onSearch,
  onUseMyLocation,
}: {
  initialQuery?: string;
  initialLocation?: string;
  initialDate?: SearchDate;
  /** The area results are anchored to, when the page knows it. */
  locationPlaceholder?: string;
  showDate?: boolean;
  showRecent?: boolean;
  /** Tighter padding, for a bar that sits in a row with other controls. */
  compact?: boolean;
  /** Given, the page searches in place instead of navigating. */
  onSearch?: (value: PlatformSearchValue) => void;
  onUseMyLocation?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [date, setDate] = useState<SearchDate>(initialDate);
  const [recent, setRecent] = useState<string[]>(readRecent);

  function remember(term: string) {
    const clean = sanitize(term);
    if (!clean) return;
    const next = [clean, ...recent.filter((item) => item !== clean)].slice(0, 4);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Not worth failing a search over.
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value: PlatformSearchValue = {
      q: sanitize(q),
      location: sanitize(location),
      date,
    };
    remember(value.q);
    if (onSearch) {
      onSearch(value);
      return;
    }
    router.push(searchResultsHref(value));
  }

  function useMyLocation() {
    setLocation("");
    if (onUseMyLocation) {
      onUseMyLocation();
      return;
    }
    // With no location the results page starts from the device's own.
    router.push(searchResultsHref({ q: sanitize(q), location: "", date }));
  }

  // Equal thirds: no field is the important one.
  const columns = showDate
    ? "lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
    : "lg:grid-cols-[repeat(2,minmax(0,1fr))_auto]";

  return (
    <div className="grid gap-3">
      <form
        role="search"
        onSubmit={submit}
        className={`grid gap-2 rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] ${compact ? "p-1.5 lg:p-1" : "p-2 lg:p-1.5"} ${columns} lg:items-center lg:gap-0 lg:rounded-full`}
      >
        <label className="sr-only" htmlFor="platform-search-q">
          Service or professional
        </label>
        <div className="flex min-w-0 items-center gap-2 px-3">
          <Search
            aria-hidden="true"
            className="size-5 shrink-0 text-[var(--color-text-muted)]"
          />
          <input
            id="platform-search-q"
            name="q"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search services or professionals"
            className="min-h-11 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <label className="sr-only" htmlFor="platform-search-location">
          Location
        </label>
        <div className="flex min-w-0 items-center gap-2 border-t border-[var(--color-border)] px-3 lg:border-t-0 lg:border-l">
          <MapPin
            aria-hidden="true"
            className="size-5 shrink-0 text-[var(--color-text-muted)] lg:hidden"
          />
          <input
            id="platform-search-location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={locationPlaceholder}
            className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            onClick={useMyLocation}
            aria-label="Use my location"
            title="Use my location"
            className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)]"
          >
            <LocateFixed aria-hidden="true" size={18} />
          </button>
        </div>

        {showDate ? (
          <div className="border-t border-[var(--color-border)] lg:border-t-0 lg:border-l">
            <label className="sr-only" htmlFor="platform-search-date">
              Date
            </label>
            <DateField id="platform-search-date" value={date} onChange={setDate} />
          </div>
        ) : null}

        <button
          type="submit"
          className="btn-primary min-h-12 lg:rounded-full lg:px-8"
        >
          Search
        </button>
      </form>

      {/* In normal flow, not an overlay. The hero clips its own box, which is
          what cut the old floating suggestions panel in half. */}
      {showRecent && recent.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Recent
          </span>
          {recent.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQ(term);
                router.push(searchResultsHref({ q: term, location, date }));
              }}
              className="min-h-9 rounded-full border border-[var(--color-border)] bg-white px-3 text-xs font-bold text-[var(--color-brand-strong)] transition hover:border-[var(--color-brand)]"
            >
              {term}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
