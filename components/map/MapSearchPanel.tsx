'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { searchPlaces, type GeocodeResult } from '@/lib/maps/geocode';
import type { Coordinates } from '@/lib/maps/types';
import type { DiscoveryFilters, DiscoveryLocationType } from '@/lib/discovery/types';

export type MapSearchPanelProps = {
  filters: DiscoveryFilters;
  onFiltersChange: (filters: DiscoveryFilters) => void;
  onPlaceSelected: (coordinates: Coordinates, label: string) => void;
};

const STYLE_CHIPS: { slug: string; label: string }[] = [
  { slug: 'braids', label: 'Braids' },
  { slug: 'twists', label: 'Twists' },
  { slug: 'locs', label: 'Locs' },
  { slug: 'cornrows', label: 'Cornrows' },
  { slug: 'natural-styles', label: 'Natural Styles' },
];

const LOCATION_TYPE_CHIPS: { value: DiscoveryLocationType | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'PUBLIC_SALON', label: 'Salon' },
  { value: 'PRIVATE_STUDIO', label: 'Private studio' },
  { value: 'MOBILE', label: 'Mobile' },
];

const CHIP_BASE_CLASSES =
  'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition whitespace-nowrap';
// The brand gold (#c9963c) only contrasts white text at 2.65:1 - well
// under WCAG AA's 4.5:1 for normal text (axe-core: color-contrast). This
// darker shade keeps the same hue but reaches ~4.9:1; the lighter brand
// gold is still used everywhere it's decorative (borders, the rating
// star), just not behind white text.
const CHIP_ACTIVE_CLASSES = 'border-[#8f6a1e] bg-[#8f6a1e] text-white';
const CHIP_INACTIVE_CLASSES =
  'border-gray-200 bg-white text-gray-700 hover:border-(--color-gold,#c9963c)';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * The map's search bar (free-text place search via Nominatim - typing a
 * city or address re-centres the map via onPlaceSelected, no region
 * restriction so it works the same in Douala as in Atlanta) plus the three
 * filter chip rows (style/availability/location-type), which just flow
 * straight through to the nearby-braiders API's matching query params -
 * see Backend-of-TOH's discovery.schemas.ts.
 */
export default function MapSearchPanel({
  filters,
  onFiltersChange,
  onPlaceSelected,
}: MapSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 3) {
      // Clearing stale results the instant the query drops below the
      // search threshold, not syncing from an external system.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      searchPlaces(query, controller.signal)
        .then((found) => {
          setResults(found);
          setOpen(true);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          console.error('[MapSearchPanel] Place search failed.', error);
        })
        .finally(() => setSearching(false));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  function selectResult(result: GeocodeResult) {
    setQuery(result.label);
    setOpen(false);
    setResults([]);
    onPlaceSelected(result.coordinates, result.label);
  }

  function toggleCategory(slug: string) {
    onFiltersChange({
      ...filters,
      category: filters.category === slug ? null : slug,
    });
  }

  function setLocationType(value: DiscoveryLocationType | null) {
    onFiltersChange({ ...filters, locationType: value });
  }

  function toggleAcceptingNewClients() {
    onFiltersChange({ ...filters, acceptingNewClients: !filters.acceptingNewClients });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-auto flex flex-col gap-2 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-black/10 backdrop-blur"
    >
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search by city or address"
          aria-label="Search by city or address"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-(--color-gold,#c9963c)"
        />
        {searching ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Searching…
          </span>
        ) : null}
        {open && results.length > 0 ? (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {results.map((result) => (
              <li key={`${result.coordinates.lat}-${result.coordinates.lng}`}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectResult(result)}
                  className="block w-full truncate px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {result.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        role="group"
        aria-label="Filter by style"
        className="flex gap-1.5 overflow-x-auto pb-0.5"
      >
        {STYLE_CHIPS.map((chip) => {
          const active = filters.category === chip.slug;
          return (
            <button
              key={chip.slug}
              type="button"
              aria-pressed={active}
              onClick={() => toggleCategory(chip.slug)}
              className={`${CHIP_BASE_CLASSES} ${active ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES}`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div
        role="group"
        aria-label="Filter by location type"
        className="flex gap-1.5 overflow-x-auto pb-0.5"
      >
        {LOCATION_TYPE_CHIPS.map((chip) => {
          const active = filters.locationType === chip.value;
          return (
            <button
              key={chip.label}
              type="button"
              aria-pressed={active}
              onClick={() => setLocationType(chip.value)}
              className={`${CHIP_BASE_CLASSES} ${active ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES}`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={filters.acceptingNewClients}
        onClick={toggleAcceptingNewClients}
        className={`${CHIP_BASE_CLASSES} self-start ${filters.acceptingNewClients ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES}`}
      >
        Accepting new clients
      </button>
    </motion.div>
  );
}
