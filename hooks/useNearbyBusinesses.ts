'use client';

import useSWR from 'swr';
import { browserApiFetch } from '@/lib/api/browser';
import type { Coordinates } from '@/lib/maps/types';
import type {
  DiscoveryFilters,
  NearbyBraider,
  NearbyBraidersResponse,
} from '@/lib/discovery/types';

const DEFAULT_RADIUS_KM = 25;

// A pan of a few hundred metres shouldn't re-fetch when the previous
// result set (a DISCOVERY_DEFAULT_RADIUS_KM=25 circle on the backend)
// already covers it. Rounding to 3 decimal places (~111m at the equator)
// before the coordinates become part of the SWR cache key means small
// jitters and re-visits reuse the existing entry; it's coarser than a
// city block and far finer than the search radius itself, so it never
// meaningfully changes which braiders come back.
const CACHE_KEY_PRECISION = 3;

// How long a cache entry is treated as fresh - see SWR's dedupingInterval:
// a second render asking for the same key within this window reuses the
// in-flight/last response instead of firing a new request.
const STALE_TIME_MS = 30_000;

export type UseNearbyBraidersResult = {
  braiders: NearbyBraider[];
  total: number;
  isLoading: boolean;
  error: string | null;
};

function roundForCacheKey(value: number): number {
  const factor = 10 ** CACHE_KEY_PRECISION;
  return Math.round(value * factor) / factor;
}

function buildNearbyPath(
  center: Coordinates,
  filters: DiscoveryFilters,
  radiusKm: number,
): string {
  const params = new URLSearchParams({
    lat: String(roundForCacheKey(center.lat)),
    lng: String(roundForCacheKey(center.lng)),
    radius: String(radiusKm),
  });
  if (filters.locationType) params.set('locationType', filters.locationType);
  if (filters.category) params.set('category', filters.category);
  if (filters.acceptingNewClients) params.set('acceptingNewClients', 'true');
  return `/api/v1/braiders/nearby?${params.toString()}`;
}

function fetchNearby(path: string): Promise<NearbyBraidersResponse> {
  return browserApiFetch<NearbyBraidersResponse>(path);
}

/**
 * Fetches braiders near `center` (Backend-of-TOH's public, rate-limited
 * GET /api/v1/braiders/nearby - see discovery.schemas.ts) via SWR, keyed
 * on the rounded coordinates plus every filter. `center` is null until the
 * map page has resolved a starting point (geolocation, its fallback, or a
 * search selection) - passing a null key to useSWR skips the request
 * entirely until then.
 *
 * keepPreviousData means a filter toggle or a pan into a new cache key
 * doesn't flash the list/map to empty while the new request is in
 * flight - the previous result set stays visible (isLoading still
 * reflects the in-flight request) until the new one resolves.
 */
export function useNearbyBraiders(
  center: Coordinates | null,
  filters: DiscoveryFilters,
  radiusKm: number = DEFAULT_RADIUS_KM,
): UseNearbyBraidersResult {
  const key = center ? buildNearbyPath(center, filters, radiusKm) : null;

  const { data, error, isLoading } = useSWR<NearbyBraidersResponse>(key, fetchNearby, {
    dedupingInterval: STALE_TIME_MS,
    keepPreviousData: true,
  });

  return {
    braiders: data?.braiders ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error ? errorMessage(error) : null,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load nearby braiders.';
}
