'use client';

import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BraiderListSidebar from '@/components/map/BraiderListSidebar';
import type { MapFocusRequest } from '@/components/map/BraiderMap';
import BraiderProfileCard from '@/components/map/BraiderProfileCard';
import MapSearchPanel from '@/components/map/MapSearchPanel';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyBraiders } from '@/hooks/useNearbyBraiders';
import { KATHLEEN_GEORGIA_CENTER } from '@/lib/maps/config';
import type { Coordinates } from '@/lib/maps/types';
import {
  EMPTY_DISCOVERY_FILTERS,
  type DiscoveryFilters,
  type NearbyBraider,
} from '@/lib/discovery/types';

const TERMINAL_UNRESOLVED_STATUSES = new Set(['denied', 'timeout', 'unsupported']);

// The Google Maps JS SDK (and BraiderMap's own client-only DOM/marker
// work) has no business being in the server-rendered payload or the
// initial client bundle - it's pure browser interactivity, and `ssr:
// false` plus this loading fallback keep it out of both until the page
// actually needs it.
const BraiderMap = dynamic(() => import('@/components/map/BraiderMap'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading map"
      className="flex h-full w-full items-center justify-center bg-purple-50"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-300 border-t-purple-700" />
    </div>
  ),
});

/**
 * Wires the discovery map's pieces together: useGeolocation resolves a
 * starting point (falling back to Kathleen, GA if it can't), which feeds
 * useNearbyBraiders, whose results feed BraiderMap and BraiderListSidebar
 * in parallel. Selection state is shared between the two - see
 * BraiderMapProps's doc comment on why it's keyed by NearbyBraider.id.
 * Rendered by app/(public)/map/page.tsx, which owns the page's metadata.
 */
export default function MapPageClient() {
  const router = useRouter();
  const geolocation = useGeolocation();
  const [searchCenter, setSearchCenter] = useState<Coordinates | null>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>(EMPTY_DISCOVERY_FILTERS);
  const [selectedBraiderId, setSelectedBraiderId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [searchLabel, setSearchLabel] = useState<string | null>(null);

  const { braiders, total, isLoading, error } = useNearbyBraiders(searchCenter, filters);

  // Ask for the visitor's location once on mount. Every terminal outcome -
  // granted, or any of denied/timeout/unsupported - resolves searchCenter,
  // which is what actually unblocks useNearbyBraiders above.
  useEffect(() => {
    geolocation.requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  // searchCenter's *initial* value is pure derived state from geolocation
  // (once resolved, one way or another) - not something to sync via an
  // effect. This is React's documented "adjust state during render"
  // pattern (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes):
  // comparing against the last-seen status and updating synchronously in
  // the render body itself applies the value in the same commit, instead
  // of an effect-triggered extra render. Guarded by
  // appliedGeolocationStatus so it only ever fires once per resolution,
  // not every render - after that, searchCenter is free to be overridden
  // by panning or a search selection without this pattern fighting it.
  const [appliedGeolocationStatus, setAppliedGeolocationStatus] = useState<string | null>(null);
  if (geolocation.status !== appliedGeolocationStatus) {
    if (geolocation.status === 'granted' && geolocation.coordinates) {
      setAppliedGeolocationStatus(geolocation.status);
      setSearchCenter(geolocation.coordinates);
    } else if (TERMINAL_UNRESOLVED_STATUSES.has(geolocation.status)) {
      setAppliedGeolocationStatus(geolocation.status);
      setSearchCenter(KATHLEEN_GEORGIA_CENTER);
    }
  }

  const selectedBraider = braiders.find((braider) => braider.id === selectedBraiderId) ?? null;

  function handleSelectBraider(id: string) {
    setSelectedBraiderId(id);
    setMobileListOpen(false);
  }

  // /book/[braiderId] exists as a route today but only renders a "coming
  // soon" RouteStatusPage stub - the real booking flow (Model 9/10) isn't
  // built yet. Navigating there anyway is still the honest behavior: it's
  // the platform's actual intended URL for this action, and landing on a
  // real, intentional stub is correct where fabricating booking logic
  // that belongs to a different feature would not be.
  function handleBookNow(braider: NearbyBraider) {
    router.push(`/book/${braider.braiderId}`);
  }

  function handleMapMove(event: { center: Coordinates }) {
    setSearchCenter(event.center);
  }

  function handlePlaceSelected(coordinates: Coordinates, label: string) {
    setSearchCenter(coordinates);
    setFocusRequest({ coordinates });
    setSelectedBraiderId(null);
    setSearchLabel(label);
  }

  const locationLabel = searchLabel ?? geolocation.locationName;
  const resultsSummary = isLoading
    ? 'Searching…'
    : locationLabel
      ? `${total} braider${total === 1 ? '' : 's'} near ${locationLabel}`
      : `${total} braider${total === 1 ? '' : 's'} nearby`;

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      <aside className="hidden w-96 shrink-0 overflow-hidden border-r border-gray-100 md:flex md:flex-col">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{resultsSummary}</p>
        </div>
        <div className="min-h-0 flex-1">
          <BraiderListSidebar
            braiders={braiders}
            selectedBraiderId={selectedBraiderId}
            onSelectBraider={handleSelectBraider}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        <BraiderMap
          braiders={braiders}
          userCoordinates={geolocation.status === 'granted' ? geolocation.coordinates : null}
          onBraiderSelect={handleSelectBraider}
          onMapMove={handleMapMove}
          isLoading={isLoading}
          selectedBraiderId={selectedBraiderId}
          focusRequest={focusRequest}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3 md:justify-start">
          <div className="pointer-events-auto w-full max-w-md">
            <MapSearchPanel
              filters={filters}
              onFiltersChange={setFilters}
              onPlaceSelected={handlePlaceSelected}
            />
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="absolute inset-x-0 top-3 z-20 mx-auto w-fit rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow ring-1 ring-red-200"
          >
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setMobileListOpen(true)}
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white shadow-lg md:hidden"
        >
          {isLoading ? 'Searching…' : `List (${total})`}
        </button>

        <BraiderProfileCard
          braider={selectedBraider}
          onClose={() => setSelectedBraiderId(null)}
          onBookNow={handleBookNow}
        />
      </div>

      <AnimatePresence>
        {mobileListOpen ? (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-30 flex h-[80dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Nearby braiders list"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{resultsSummary}</p>
              <button
                type="button"
                onClick={() => setMobileListOpen(false)}
                aria-label="Close list"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <BraiderListSidebar
                braiders={braiders}
                selectedBraiderId={selectedBraiderId}
                onSelectBraider={handleSelectBraider}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
