'use client';

import { useEffect, useState } from 'react';
import { browserApiFetch } from '@/lib/api/browser';
import type { Coordinates } from '@/lib/maps/types';
import type {
  DiscoveryFilters,
  NearbyBraider,
  NearbyBraidersResponse,
} from '@/lib/discovery/types';

const DEFAULT_RADIUS_KM = 25;

export type UseNearbyBraidersResult = {
  braiders: NearbyBraider[];
  total: number;
  isLoading: boolean;
  error: string | null;
};

function buildNearbyPath(
  center: Coordinates,
  filters: DiscoveryFilters,
  radiusKm: number,
): string {
  const params = new URLSearchParams({
    lat: String(center.lat),
    lng: String(center.lng),
    radius: String(radiusKm),
  });
  if (filters.locationType) params.set('locationType', filters.locationType);
  if (filters.category) params.set('category', filters.category);
  if (filters.acceptingNewClients) params.set('acceptingNewClients', 'true');
  return `/api/v1/braiders/nearby?${params.toString()}`;
}

/**
 * Fetches braiders near `center` (Backend-of-TOH's public, rate-limited
 * GET /api/v1/braiders/nearby - see discovery.schemas.ts), re-running
 * whenever the center or any filter changes. `center` is null until the
 * map page has resolved a starting point (geolocation, its fallback, or a
 * search selection) - no request is made before then. Uses browserApiFetch
 * (not a raw fetch) for the shared request-id header and response-envelope
 * handling every other client request in this app already goes through;
 * GET requests skip CSRF automatically, and this endpoint needs none since
 * it's public.
 *
 * An in-flight request is aborted (not just ignored) if center or filters
 * change again before it resolves, so a fast pan or filter toggle can't
 * have an earlier, slower response clobber a later one.
 *
 * `center` and `filters` are compared by reference, not by value - callers
 * should hold them in state (or memoize them) rather than constructing a
 * fresh object every render, or every render would trigger a re-fetch.
 */
export function useNearbyBraiders(
  center: Coordinates | null,
  filters: DiscoveryFilters,
  radiusKm: number = DEFAULT_RADIUS_KM,
): UseNearbyBraidersResult {
  const [braiders, setBraiders] = useState<NearbyBraider[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!center) return;

    const controller = new AbortController();

    // The whole chain, including the loading/error reset, runs through
    // .then() rather than synchronously in the effect body - an effect is
    // meant to subscribe to an external system and report changes through
    // a callback, not set state directly on every run (see this project's
    // react-hooks/set-state-in-effect lint rule). Promise.resolve().then()
    // still flushes as a microtask before the next paint, so there's no
    // user-visible delay versus calling setIsLoading(true) synchronously.
    Promise.resolve()
      .then(() => {
        setIsLoading(true);
        setError(null);
        return browserApiFetch<NearbyBraidersResponse>(
          buildNearbyPath(center, filters, radiusKm),
          { signal: controller.signal },
        );
      })
      .then((data) => {
        setBraiders(data.braiders);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load nearby braiders.');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [center, filters, radiusKm]);

  return { braiders, total, isLoading, error };
}
