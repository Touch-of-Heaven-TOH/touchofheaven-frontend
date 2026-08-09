'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { isMapsConfigured } from '@/lib/maps/config';
import { loadPlacesLibrary } from '@/lib/maps/loader';
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

/**
 * The map's search bar (Google Places autocomplete - typing a city or
 * address re-centres the map via onPlaceSelected) plus the three filter
 * chip rows (style/availability/location-type), which just flow straight
 * through to the nearby-braiders API's matching query params - see
 * Backend-of-TOH's discovery.schemas.ts.
 */
export default function MapSearchPanel({
  filters,
  onFiltersChange,
  onPlaceSelected,
}: MapSearchPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);

  // Read through a ref, not the prop directly, so the mount-once effect
  // below never needs onPlaceSelected in its dependency array - see the
  // identical pattern (and the stale-closure bug it fixes) in BraiderMap.
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  const configured = isMapsConfigured();

  useEffect(() => {
    if (!configured || !containerRef.current || elementRef.current) return;

    let cancelled = false;

    loadPlacesLibrary()
      .then(({ PlaceAutocompleteElement }) => {
        if (cancelled || !containerRef.current || elementRef.current) return;

        const element = new PlaceAutocompleteElement({
          includedRegionCodes: ['us'],
        });
        element.classList.add('toh-place-autocomplete');
        containerRef.current.appendChild(element);
        elementRef.current = element;

        element.addEventListener('gmp-select', (event) => {
          void (async () => {
            const { placePrediction } = event as google.maps.places.PlacePredictionSelectEvent;
            const place = placePrediction.toPlace();
            await place.fetchFields({ fields: ['location', 'formattedAddress'] });
            const { location } = place;
            if (!location) return;
            onPlaceSelectedRef.current(
              { lat: location.lat(), lng: location.lng() },
              place.formattedAddress ?? placePrediction.text.text,
            );
          })();
        });
      })
      .catch((error: unknown) => {
        console.error('[MapSearchPanel] Failed to load Google Places.', error);
      });

    return () => {
      cancelled = true;
      elementRef.current?.remove();
      elementRef.current = null;
    };
  }, [configured]);

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
      {configured ? (
        <div ref={containerRef} className="toh-place-autocomplete-host w-full" />
      ) : (
        <input
          type="text"
          disabled
          placeholder="Search coming soon"
          aria-label="Search by city or address (unavailable)"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
        />
      )}

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
