"use client";

import dynamic from "next/dynamic";
import {
  Calendar,
  ChevronDown,
  CircleAlert,
  Info,
  ListIcon,
  LoaderCircle,
  Map as MapIcon,
  Navigation,
  RotateCw,
  SearchX,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapFocusRequest, MapMoveEvent } from "@/components/map/BusinessMap";
import { ClientShell, classNames } from "@/features/discovery/DiscoveryShell";
import {
  ProviderCardSkeleton,
  ProviderGridCard,
  ProviderListCard,
  ProviderPopup,
} from "@/features/discovery/ProviderCards";
import { PlatformSearch } from "@/components/search/PlatformSearch";
import {
  DEFAULT_FILTERS,
  FilterSelect,
  FiltersDialog,
  LOCATION_TYPE_OPTIONS,
  type Filters,
} from "@/features/discovery/sections/FiltersBar";
import {
  formatSearchDate,
  isExactDate,
  matchesSearchDate,
  type SearchDate,
} from "@/components/search/search-date";

type DiscoverySearchInput = { query: string; location: string };
import { discoveryCategory, type DiscoveryCategory } from "@/features/discovery/categories";
import {
  DEFAULT_SEARCH_RADIUS_KM,
  SEARCH_RADIUS_OPTIONS_KM,
  clampRadiusKm,
  hasMappableLocation,
  widerRadiusKm,
  type NearbyProvider,
} from "@/features/discovery/nearby";
import { useNearbyProviders, type NearbySearch } from "@/features/discovery/useNearbyProviders";
import type { DiscoveryLocationType, NearbyBraider } from "@/lib/discovery/types";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_CENTER_LABEL } from "@/lib/maps/config";
import { DeviceLocationError, getDeviceLocation } from "@/lib/maps/device-location";
import { searchPlaces } from "@/lib/maps/geocode";
import { reverseGeocodeCoordinates } from "@/lib/maps/geocoding";
import type { Coordinates } from "@/lib/maps/types";

/*
 * Discovery results: the list (/businesses, /explore/search) and the map
 * (/map, /explore/map). Every provider shown here comes from the backend's
 * GET /api/v1/braiders/nearby.
 *
 * History, for whoever reads this next: the map originally ran on that
 * endpoint (components/map/MapPageClient.tsx, August 2026). The Codex
 * redesign in c30fd43 replaced it with the sample records in
 * discovery-data.ts and rendered the map with `braiders={[]}`, so it showed
 * tiles but never a pin, next to invented counts ("128 professionals
 * found"), a "Washington, DC" default and filter buttons wired to nothing.
 * This file restores the real data path inside the redesigned layout.
 */

const RealMap = dynamic(() => import("@/components/map/BusinessMap"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading map"
      className="flex h-full w-full items-center justify-center bg-[#f3efe8]"
    >
      <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)]" />
    </div>
  ),
});

export type DiscoveryView = "grid" | "map";

export type DiscoveryRouteSearch = {
  q?: string;
  location?: string;
  category?: string;
  /** From the shared search bar: "today" or "week" seeds the availability
   *  filter, so a date chosen before searching is not silently dropped. */
  date?: string;
};

// How long to wait for the device location before searching the default
// city instead. A fix that arrives later still moves the search, as long
// as the visitor hasn't picked a place themselves in the meantime.
const DEVICE_LOCATION_TIMEOUT_MS = 5_000;

type CenterSource = "device" | "fallback" | "place" | "map";

type SearchCenter = {
  coordinates: Coordinates;
  label: string;
  source: CenterSource;
};

type SortOrder = "distance" | "rating" | "soonest";


const LOCATION_MESSAGES: Record<DeviceLocationError["reason"], string> = {
  denied: "Location access is blocked for this site. Allow it in your browser settings, or search for a place.",
  timeout: "We couldn't get your location in time. Try again, or search for a place.",
  unavailable: "Your device couldn't find its location. Try again, or search for a place.",
  unsupported: "This browser can't share its location. Search for a place instead.",
};

function sameCoordinates(a: Coordinates, b: Coordinates) {
  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;
}

/** Straight-line distance, accurate enough to tell a zoom from a pan. */
function distanceKm(a: Coordinates, b: Coordinates) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x = toRad(b.lng - a.lng) * Math.cos(toRad((a.lat + b.lat) / 2));
  const y = toRad(b.lat - a.lat);
  return Math.sqrt(x * x + y * y) * 6371;
}

function matchesText(provider: NearbyProvider, text: string) {
  const haystack = [provider.professionalName, provider.locationLabel, provider.bio, ...provider.specialties]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function matchesCategory(provider: NearbyProvider, category: DiscoveryCategory | null) {
  if (!category) return true;
  const services = provider.specialties.join(" ").toLowerCase();
  return category.keywords.some((keyword) => services.includes(keyword));
}

function sortProviders(providers: NearbyProvider[], order: SortOrder) {
  if (order === "distance") return providers;
  const sorted = [...providers];
  if (order === "rating") {
    sorted.sort((a, b) => (b.rating.average ?? -1) - (a.rating.average ?? -1) || b.rating.count - a.rating.count);
  } else {
    const time = (provider: NearbyProvider) =>
      provider.nextAvailableSlotAt ? new Date(provider.nextAvailableSlotAt).getTime() : Number.POSITIVE_INFINITY;
    sorted.sort((a, b) => time(a) - time(b));
  }
  return sorted;
}

function resultsQueryString(search: {
  q?: string;
  location?: string;
  category?: string;
  date?: string;
  view?: DiscoveryView;
}) {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.location) params.set("location", search.location);
  if (search.category) params.set("category", search.category);
  if (search.date && search.date !== "any") params.set("date", search.date);
  if (search.view === "map") params.set("view", "map");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function SearchResultsPage({
  initialSearch,
  initialView = "grid",
  showFiltersInitially = false,
}: {
  initialSearch?: DiscoveryRouteSearch;
  initialView?: DiscoveryView;
  showFiltersInitially?: boolean;
}) {
  const [view, setView] = useState<DiscoveryView>(initialView);
  const categoryId = initialSearch?.category;
  const categoryFilter = useMemo(() => discoveryCategory(categoryId), [categoryId]);
  const category = categoryFilter?.id;
  const initialPlace = initialSearch?.location?.trim() ?? "";

  const [query, setQuery] = useState(initialSearch?.q?.trim() ?? "");
  const [place, setPlace] = useState(initialPlace);
  const [center, setCenter] = useState<SearchCenter | null>(null);
  const [deviceCoordinates, setDeviceCoordinates] = useState<Coordinates | null>(null);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [locating, setLocating] = useState(!initialPlace);
  const [lookingUpPlace, setLookingUpPlace] = useState(Boolean(initialPlace));
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(() => {
    // A date chosen in the search bar arrives as ?date=today|week and seeds
    // the availability filter, so the visitor sees it already applied rather
    // than having to set it a second time.
    const date = initialSearch?.date;
    if (date === "today" || date === "week" || (date && isExactDate(date))) {
      return { ...DEFAULT_FILTERS, availability: date as SearchDate };
    }
    return DEFAULT_FILTERS;
  });
  const [sort, setSort] = useState<SortOrder>("distance");
  const [filtersOpen, setFiltersOpen] = useState(showFiltersInitially);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapPanelRef = useRef<HTMLDivElement>(null);

  // Read by async callbacks (a late GPS fix, a reverse-geocode answer) that
  // must not act on a search the visitor has since replaced.
  const centerRef = useRef<SearchCenter | null>(null);
  const radiusRef = useRef(filters.radiusKm);
  useEffect(() => {
    centerRef.current = center;
    radiusRef.current = filters.radiusKm;
  }, [center, filters.radiusKm]);

  const moveTo = useCallback((next: SearchCenter, radiusKm: number) => {
    centerRef.current = next;
    setCenter(next);
    setSelectedId(null);
    setFocusRequest({ coordinates: next.coordinates, radiusKm });
  }, []);

  const applyDeviceFix = useCallback(
    (coordinates: Coordinates) => {
      setDeviceCoordinates(coordinates);
      setLocating(false);
      setLocationNotice(null);
      moveTo({ coordinates, label: "you", source: "device" }, radiusRef.current);
      // Name the place for the heading; the search itself doesn't wait.
      reverseGeocodeCoordinates(coordinates)
        .then((name) => {
          if (!name) return;
          setCenter((current) =>
            current && current.source === "device" && sameCoordinates(current.coordinates, coordinates)
              ? { ...current, label: name }
              : current,
          );
        })
        .catch(() => undefined);
    },
    [moveTo],
  );

  const applyFallbackCity = useCallback(
    (notice: string | null) => {
      setLocating(false);
      setLocationNotice(notice);
      moveTo({ coordinates: DEFAULT_MAP_CENTER, label: DEFAULT_MAP_CENTER_LABEL, source: "fallback" }, radiusRef.current);
    },
    [moveTo],
  );

  // Decide where to search when the page opens: a place from the URL, or
  // the device's location, or the default city if neither is available.
  useEffect(() => {
    let cancelled = false;

    if (initialPlace) {
      searchPlaces(initialPlace)
        .then((results) => {
          if (cancelled) return;
          setLookingUpPlace(false);
          const match = results[0];
          if (match) {
            moveTo({ coordinates: match.coordinates, label: initialPlace, source: "place" }, radiusRef.current);
          } else {
            applyFallbackCity(`We couldn't find “${initialPlace}”. Showing ${DEFAULT_MAP_CENTER_LABEL} instead.`);
          }
        })
        .catch(() => {
          if (cancelled) return;
          setLookingUpPlace(false);
          applyFallbackCity(`Place search isn't reachable right now. Showing ${DEFAULT_MAP_CENTER_LABEL} instead.`);
        });
      return () => {
        cancelled = true;
      };
    }

    getDeviceLocation({
      timeoutMs: DEVICE_LOCATION_TIMEOUT_MS,
      maximumAgeMs: 5 * 60_000,
      onLateFix: (coordinates) => {
        // Only take over from the fallback city; never from a place the
        // visitor chose or an area they moved the map to.
        if (!cancelled && centerRef.current?.source === "fallback") applyDeviceFix(coordinates);
      },
    })
      .then((coordinates) => {
        if (!cancelled) applyDeviceFix(coordinates);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const reason = error instanceof DeviceLocationError ? error.reason : "unavailable";
        applyFallbackCity(
          reason === "denied"
            ? `Location is off, so these are providers around ${DEFAULT_MAP_CENTER_LABEL}. Search for a place to look somewhere else.`
            : `We couldn't get your location quickly, so these are providers around ${DEFAULT_MAP_CENTER_LABEL}. Use “Locate me” to try again.`,
        );
      });

    return () => {
      cancelled = true;
    };
    // Runs once per page visit: initialPlace comes from the URL the page
    // was opened with, and the callbacks are stable.
  }, [initialPlace, moveTo, applyDeviceFix, applyFallbackCity]);

  function replaceUrl(next: { q: string; location: string; view?: DiscoveryView }) {
    const url = `${window.location.pathname}${resultsQueryString({
      q: next.q || undefined,
      location: next.location || undefined,
      category,
      date: filters.availability,
      view: next.view ?? view,
    })}`;
    window.history.replaceState(null, "", url);
  }

  // Switching view is a state change now, not a navigation, so the filters,
  // the scroll position and the loaded providers all survive it.
  function showView(next: DiscoveryView) {
    setView(next);
    replaceUrl({ q: query, location: place, view: next });
  }

  async function locateMe() {
    setLocating(true);
    setLocationNotice(null);
    try {
      // A fresh fix: the visitor pressed the button because they may have moved.
      const coordinates = await getDeviceLocation({ timeoutMs: DEVICE_LOCATION_TIMEOUT_MS, maximumAgeMs: 0 });
      setPlace("");
      replaceUrl({ q: query, location: "" });
      applyDeviceFix(coordinates);
    } catch (error) {
      setLocating(false);
      const reason = error instanceof DeviceLocationError ? error.reason : "unavailable";
      setLocationNotice(LOCATION_MESSAGES[reason]);
      if (!centerRef.current) applyFallbackCity(LOCATION_MESSAGES[reason]);
    }
  }

  async function runSearch(input: DiscoverySearchInput) {
    setQuery(input.query);
    replaceUrl({ q: input.query, location: input.location });

    if (!input.location) {
      setPlace("");
      if (centerRef.current?.source === "place") void locateMe();
      return;
    }
    if (input.location === place && centerRef.current?.source === "place") return;

    setPlace(input.location);
    setLookingUpPlace(true);
    setLocationNotice(null);
    try {
      const results = await searchPlaces(input.location);
      const match = results[0];
      if (match) {
        moveTo({ coordinates: match.coordinates, label: input.location, source: "place" }, radiusRef.current);
      } else {
        setLocationNotice(`We couldn't find “${input.location}”. Try a city or neighbourhood name.`);
      }
    } catch {
      setLocationNotice("Place search isn't reachable right now. Try again in a moment.");
    } finally {
      setLookingUpPlace(false);
    }
  }

  function handleMapMove(event: MapMoveEvent) {
    const radiusKm = clampRadiusKm(event.radiusKm);
    const previous = centerRef.current;
    // A zoom barely moves the centre: keep searching "near Buea", just
    // over the area now in view. A real pan is a new place.
    const moved = !previous || distanceKm(previous.coordinates, event.center) >= 1;
    const next: SearchCenter = moved
      ? { coordinates: event.center, label: "this area", source: "map" }
      : { ...previous, coordinates: event.center };
    centerRef.current = next;
    setCenter(next);
    setFilters((current) => ({ ...current, radiusKm }));
    if (moved && place) {
      setPlace("");
      replaceUrl({ q: query, location: "" });
    }
  }

  function selectFromList(id: string) {
    setSelectedId(id);
    // Below the desktop layout the list sits under the map.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      mapPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function changeRadius(radiusKm: number) {
    setFilters((current) => ({ ...current, radiusKm }));
    if (center) setFocusRequest({ coordinates: center.coordinates, radiusKm });
  }

  const search = useMemo<NearbySearch | null>(
    () =>
      center
        ? {
            center: center.coordinates,
            radiusKm: filters.radiusKm,
            locationType: filters.locationType,
            acceptingNewClients: filters.acceptingNewClients,
          }
        : null,
    [center, filters.radiusKm, filters.locationType, filters.acceptingNewClients],
  );

  const nearby = useNearbyProviders(search);
  const loadedProviders = useMemo(() => (nearby.error ? [] : nearby.providers), [nearby.error, nearby.providers]);

  const visibleProviders = useMemo(() => {
    const filtered = loadedProviders.filter((provider) => {
      if (query && !matchesText(provider, query)) return false;
      if (!matchesCategory(provider, categoryFilter)) return false;
      if (!matchesSearchDate(filters.availability, provider)) return false;
      if (filters.minRating > 0 && (provider.rating.average ?? 0) < filters.minRating) return false;
      return true;
    });
    return sortProviders(filtered, sort);
  }, [loadedProviders, query, categoryFilter, filters.availability, filters.minRating, sort]);

  const pinnedProviders = useMemo<NearbyBraider[]>(
    () => visibleProviders.filter(hasMappableLocation),
    [visibleProviders],
  );

  const resolvingLocation = !center && (locating || lookingUpPlace);
  const showSkeleton = resolvingLocation || (nearby.isLoading && loadedProviders.length === 0);
  const clientFiltersActive =
    Boolean(query) || Boolean(category) || filters.availability !== "any" || filters.minRating > 0;
  const serverFiltersActive = filters.locationType !== null || filters.acceptingNewClients;
  const nextRadius = widerRadiusKm(filters.radiusKm);
  const categoryLabel = categoryFilter?.label;

  const where = center ? center.label : "you";
  const title = query
    ? `“${query}” near ${where}`
    : categoryLabel
      ? `${categoryLabel} near ${where}`
      : `Providers near ${where}`;

  const resultsLine = showSkeleton
    ? resolvingLocation
      ? lookingUpPlace
        ? `Looking up ${place}…`
        : "Finding your location…"
      : "Finding providers near you…"
    : nearby.error
      ? "Results unavailable"
      : `${visibleProviders.length} provider${visibleProviders.length === 1 ? "" : "s"} found within ${filters.radiusKm} km${
          nearby.hasMore ? ` · ${nearby.total} in this area` : ""
        }`;

  function clearFilters() {
    setFilters((current) => ({ ...DEFAULT_FILTERS, radiusKm: current.radiusKm }));
    setQuery("");
    setSort("distance");
    replaceUrl({ q: "", location: place });
  }

  const emptyState = (
    <ResultsMessage
      icon={<SearchX size={26} aria-hidden="true" />}
      title={
        loadedProviders.length > 0 || clientFiltersActive || serverFiltersActive
          ? "No providers match your filters"
          : "No providers found in this area"
      }
      body={
        loadedProviders.length > 0 || clientFiltersActive || serverFiltersActive
          ? "Try clearing a filter or searching a wider area."
          : `Nobody on Touch of Heaven is listed within ${filters.radiusKm} km of ${where} yet.`
      }
    >
      {nextRadius ? (
        <button type="button" onClick={() => changeRadius(nextRadius)} className={primaryButton}>
          Search within {nextRadius} km
        </button>
      ) : null}
      {clientFiltersActive || serverFiltersActive ? (
        <button type="button" onClick={clearFilters} className={secondaryButton}>
          Clear filters
        </button>
      ) : null}
    </ResultsMessage>
  );

  const errorState = (
    <ResultsMessage
      icon={<CircleAlert size={26} aria-hidden="true" />}
      title={nearby.error ?? "Could not load providers"}
      body="The map still works. Check your connection and try again."
      tone="danger"
    >
      <button type="button" onClick={nearby.retry} className={primaryButton} disabled={nearby.isFetching}>
        <RotateCw size={17} aria-hidden="true" className={nearby.isFetching ? "animate-spin" : undefined} />
        {nearby.isFetching ? "Retrying…" : "Retry"}
      </button>
    </ResultsMessage>
  );

  const listBody = nearby.error ? (
    errorState
  ) : showSkeleton ? (
    <div className={view === "map" ? "grid gap-3" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"} role="status" aria-label="Loading providers">
      {Array.from({ length: view === "map" ? 3 : 6 }, (_, index) => (
        <ProviderCardSkeleton key={index} layout={view === "map" ? "list" : "grid"} />
      ))}
    </div>
  ) : visibleProviders.length === 0 ? (
    emptyState
  ) : (
    <>
      <ul role="list" className={view === "map" ? "grid gap-3" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"}>
        {visibleProviders.map((provider) => (
          <li key={provider.id}>
            {view === "map" ? (
              <ProviderListCard
                provider={provider}
                onMap={hasMappableLocation(provider)}
                selected={selectedId === provider.id}
                onSelect={() => selectFromList(provider.id)}
              />
            ) : (
              <ProviderGridCard provider={provider} />
            )}
          </li>
        ))}
      </ul>
      {nearby.hasMore ? (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={nearby.loadMore} disabled={nearby.isLoadingMore} className={secondaryButton}>
            {nearby.isLoadingMore ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : null}
            {nearby.isLoadingMore ? "Loading…" : "Show more providers"}
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <ClientShell>
      <div className="border-b border-[var(--color-border)] bg-white/72">
        <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-6 lg:px-10">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <PlatformSearch
              key={`${query}|${place}`}
              initialQuery={query}
              initialLocation={place}
              initialDate={filters.availability}
              compact
              onSearch={(value) => {
                // The date field and the Availability filter are the same
                // thing shown twice; keep them in step.
                setFilters((current) => ({ ...current, availability: value.date }));
                void runSearch({ query: value.q, location: value.location });
              }}
              onUseMyLocation={() => void locateMe()}
            />
            <div className="flex gap-3 overflow-x-auto pb-1">
              <FilterSelect
                icon={<Navigation size={18} aria-hidden="true" />}
                label="Distance"
                value={String(filters.radiusKm)}
                onChange={(value) => changeRadius(Number(value))}
                options={[
                  ...(SEARCH_RADIUS_OPTIONS_KM.includes(filters.radiusKm as (typeof SEARCH_RADIUS_OPTIONS_KM)[number])
                    ? []
                    : [{ value: String(filters.radiusKm), label: `Map area (${filters.radiusKm} km)` }]),
                  ...SEARCH_RADIUS_OPTIONS_KM.map((km) => ({ value: String(km), label: `Within ${km} km` })),
                ]}
              />
              <FilterSelect
                icon={<Calendar size={18} aria-hidden="true" />}
                label="Availability"
                value={filters.availability}
                onChange={(value) => setFilters((current) => ({ ...current, availability: value as SearchDate }))}
                options={[
                  { value: "any", label: "Any time" },
                  { value: "today", label: "Opening today" },
                  { value: "week", label: "Opening this week" },
                  ...(isExactDate(filters.availability)
                    ? [
                        {
                          value: filters.availability,
                          label: `Free by ${formatSearchDate(filters.availability)}`,
                        },
                      ]
                    : []),
                ]}
              />
              <FilterSelect
                icon={<Star size={18} aria-hidden="true" />}
                label="Rating"
                value={String(filters.minRating)}
                onChange={(value) => setFilters((current) => ({ ...current, minRating: Number(value) }))}
                options={[
                  { value: "0", label: "Any rating" },
                  { value: "4", label: "4.0 and up" },
                  { value: "4.5", label: "4.5 and up" },
                ]}
              />
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className={classNames(
                  "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] border bg-white px-4 text-sm font-semibold shadow-[var(--shadow-subtle)]",
                  serverFiltersActive
                    ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                    : "border-[var(--color-border)] text-[var(--color-brand)]",
                )}
              >
                <SlidersHorizontal size={18} aria-hidden="true" />
                More filters
                {serverFiltersActive ? (
                  <span className="grid size-5 place-items-center rounded-full bg-[var(--color-brand)] text-[0.68rem] font-bold text-white">
                    {Number(filters.locationType !== null) + Number(filters.acceptingNewClients)}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-4xl font-semibold leading-tight [overflow-wrap:anywhere] md:text-5xl">{title}</h1>
            <p className="mt-2 flex items-center gap-2 text-lg text-[var(--color-text-muted)]" aria-live="polite">
              {showSkeleton || nearby.isFetching ? (
                <LoaderCircle size={18} className="shrink-0 animate-spin" aria-hidden="true" />
              ) : null}
              {resultsLine}
            </p>
            {locationNotice ? (
              <p role="status" className="mt-3 flex max-w-2xl items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-muted)]">
                <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-copper)]" />
                <span className="flex-1">{locationNotice}</span>
                <button
                  type="button"
                  onClick={() => setLocationNotice(null)}
                  aria-label="Dismiss"
                  className="-my-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-full hover:bg-[var(--color-brand-soft)]"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => showView("map")}
              aria-current={view === "map" ? "page" : undefined}
              className={classNames(
                "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border px-4 text-sm font-semibold lg:hidden",
                view === "map"
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] bg-white text-[var(--color-brand)]",
              )}
            >
              <MapIcon size={18} aria-hidden="true" />
              Map
            </button>
            <button
              type="button"
              onClick={() => showView("grid")}
              aria-current={view === "grid" ? "page" : undefined}
              className={classNames(
                "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border px-4 text-sm font-semibold lg:hidden",
                view === "grid"
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] bg-white text-[var(--color-brand)]",
              )}
            >
              <ListIcon size={18} aria-hidden="true" />
              List view
            </button>
            <label className="flex items-center gap-2 text-sm">
              <span>Sort by</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOrder)}
                className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-3"
              >
                <option value="distance">Nearest first</option>
                <option value="rating">Highest rated</option>
                <option value="soonest">Soonest available</option>
              </select>
            </label>
          </div>
        </div>

        {/* Results and map together, the way a local-search page reads: you
            see where while you read who. The map is a column from lg up
            rather than a view you switch to; below that the toggle above
            picks one, because both at once on a phone helps nobody. */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
          <div className={view === "map" ? "hidden lg:block" : undefined}>
            {listBody}
          </div>

          <div
            className={classNames(
              "overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] lg:sticky lg:top-24",
              view === "map" ? "" : "hidden lg:block",
            )}
          >
            <div
              ref={mapPanelRef}
              className="relative h-[62vh] min-h-[420px] scroll-mt-24 lg:h-[calc(100dvh-11rem)] lg:min-h-[560px]"
            >
              <RealMap
                braiders={pinnedProviders}
                userCoordinates={deviceCoordinates}
                selectedBraiderId={selectedId}
                onBraiderSelect={setSelectedId}
                onMapMove={handleMapMove}
                focusRequest={focusRequest}
                isLoading={nearby.isFetching && !nearby.error}
                onLocateMe={() => void locateMe()}
                locating={locating}
                searchArea={center ? { center: center.coordinates, radiusKm: filters.radiusKm } : null}
                renderPopup={(provider) => (
                  <ProviderPopup provider={provider} onClose={() => setSelectedId(null)} />
                )}
                onPopupClose={() => setSelectedId(null)}
              />
              <MapStatus
                resolvingLocation={resolvingLocation}
                lookingUpPlace={lookingUpPlace}
                place={place}
                loading={nearby.isLoading || (nearby.isFetching && loadedProviders.length === 0)}
                error={nearby.error}
                retrying={nearby.isFetching}
                onRetry={nearby.retry}
                empty={Boolean(center) && !nearby.isFetching && !nearby.error && visibleProviders.length === 0}
                onlyUnpinned={visibleProviders.length > 0 && pinnedProviders.length === 0}
              />
            </div>
          </div>
        </div>
      </div>

      <FiltersDialog
        open={filtersOpen}
        filters={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => {
          setFilters((current) => ({ ...current, ...next }));
          setFiltersOpen(false);
        }}
      />
    </ClientShell>
  );
}

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-brand-strong)] disabled:cursor-wait disabled:opacity-80";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-5 text-sm font-bold text-[var(--color-brand)] transition hover:border-[var(--color-brand)] disabled:cursor-wait disabled:opacity-80";

function ResultsMessage({
  icon,
  title,
  body,
  tone = "neutral",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone?: "neutral" | "danger";
  children?: React.ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className="grid justify-items-center gap-3 rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] bg-white px-5 py-10 text-center"
    >
      <span
        className={classNames(
          "grid size-12 place-items-center rounded-full",
          tone === "danger"
            ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
            : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
        )}
      >
        {icon}
      </span>
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-[var(--color-text-muted)]">{body}</p>
      {children ? <div className="mt-1 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

/** What the map says while it has nothing to show, over the tiles. */
function MapStatus({
  resolvingLocation,
  lookingUpPlace,
  place,
  loading,
  error,
  retrying,
  onRetry,
  empty,
  onlyUnpinned,
}: {
  resolvingLocation: boolean;
  lookingUpPlace: boolean;
  place: string;
  loading: boolean;
  error: string | null;
  retrying: boolean;
  onRetry: () => void;
  empty: boolean;
  onlyUnpinned: boolean;
}) {
  const pill = "pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--color-border)]";

  let content: React.ReactNode = null;
  if (error) {
    content = (
      <div role="alert" className={pill}>
        <CircleAlert size={17} aria-hidden="true" className="text-[var(--color-danger)]" />
        Could not load providers
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3 py-1 text-xs font-bold text-white disabled:opacity-80"
        >
          <RotateCw size={13} aria-hidden="true" className={retrying ? "animate-spin" : undefined} />
          Retry
        </button>
      </div>
    );
  } else if (resolvingLocation || loading) {
    content = (
      <div role="status" className={pill}>
        <LoaderCircle size={17} aria-hidden="true" className="animate-spin text-[var(--color-brand)]" />
        {resolvingLocation
          ? lookingUpPlace
            ? `Looking up ${place}…`
            : "Finding your location…"
          : "Finding providers near you…"}
      </div>
    );
  } else if (empty) {
    content = (
      <div role="status" className={pill}>
        <SearchX size={17} aria-hidden="true" className="text-[var(--color-brand)]" />
        No providers found in this area
      </div>
    );
  } else if (onlyUnpinned) {
    content = (
      <div role="status" className={pill}>
        <Info size={17} aria-hidden="true" className="text-[var(--color-brand)]" />
        These providers travel to you, so they have no pin
      </div>
    );
  }

  if (!content) return null;
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-10 z-[3] flex justify-center">{content}</div>
  );
}
