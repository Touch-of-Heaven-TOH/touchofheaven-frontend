"use client";

import { useRouter } from "next/navigation";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { type FormEvent, useState } from "react";
import { classNames } from "@/features/discovery/DiscoveryShell";

export type DiscoverySearchInput = {
  query: string;
  location: string;
};

/**
 * The "service or professional" + "where" search bar. On its own it sends
 * the visitor to the results page; the results page passes `onSearch` to
 * run the search in place instead of reloading.
 */
export function SearchCard({
  initialQuery = "",
  initialLocation = "",
  compact = false,
  onSearch,
  onUseMyLocation,
}: {
  initialQuery?: string;
  initialLocation?: string;
  compact?: boolean;
  onSearch?: (input: DiscoverySearchInput) => void;
  onUseMyLocation?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);

  function resultsHref(input: DiscoverySearchInput) {
    const params = new URLSearchParams();
    if (input.query.trim()) params.set("q", input.query.trim());
    if (input.location.trim()) params.set("location", input.location.trim());
    const search = params.toString();
    return search ? `/businesses?${search}` : "/businesses";
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { query: query.trim(), location: location.trim() };
    if (onSearch) {
      onSearch(input);
      return;
    }
    router.push(resultsHref(input));
  }

  function searchNearMe() {
    setLocation("");
    if (onUseMyLocation) {
      onUseMyLocation();
      return;
    }
    // Without a location the results page starts from the device's.
    router.push(resultsHref({ query, location: "" }));
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className={classNames(
        "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)_auto] gap-0 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)]",
        compact
          ? "p-1.5 sm:p-2 md:grid-cols-[1.1fr_1fr_auto]"
          : "p-1.5 sm:p-3 md:grid-cols-[1.2fr_1fr_auto]",
      )}
    >
      <label className="flex min-h-12 min-w-0 items-center gap-2 border-r border-[var(--color-border)] px-2 sm:min-h-14 sm:gap-3 sm:px-3">
        <Search className="shrink-0" size={19} aria-hidden="true" />
        <span className="sr-only">Service or professional</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Service or professional"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)] sm:text-base"
        />
      </label>
      <div className="flex min-h-12 min-w-0 items-center gap-2 border-r border-[var(--color-border)] px-2 sm:min-h-14 sm:gap-3 sm:px-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <MapPin className="shrink-0" size={19} aria-hidden="true" />
          <span className="sr-only">Location</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Near me"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)] sm:text-base"
          />
        </label>
        <button
          type="button"
          onClick={searchNearMe}
          aria-label="Use my location"
          title="Use my location"
          className="hidden size-9 shrink-0 place-items-center rounded-[var(--radius-control)] text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)] sm:grid"
        >
          <LocateFixed size={18} aria-hidden="true" />
        </button>
      </div>
      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-3 text-sm font-bold text-white transition hover:bg-[var(--color-brand-strong)] sm:min-h-14 sm:px-8 sm:text-base"
      >
        Search
      </button>
    </form>
  );
}
