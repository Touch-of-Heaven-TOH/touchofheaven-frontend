"use client";

import { useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { DiscoveryLocationType, NearbyBraidersResponse } from "@/lib/discovery/types";
import type { Coordinates } from "@/lib/maps/types";
import { ApiClientError } from "@/lib/api/errors";
import {
  NEARBY_PAGE_SIZE,
  fetchNearbyProviders,
  type NearbyProvider,
} from "@/features/discovery/nearby";

export type NearbySearch = {
  center: Coordinates;
  radiusKm: number;
  locationType: DiscoveryLocationType | null;
  acceptingNewClients: boolean;
};

type NearbyKey = readonly [
  "nearby-providers",
  lat: number,
  lng: number,
  radiusKm: number,
  locationType: DiscoveryLocationType | null,
  acceptingNewClients: boolean,
  page: number,
];

// Four decimals is about 11 m: close enough that a map nudge reuses the
// cached answer, far finer than any search radius.
function roundForKey(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

async function loadPage(key: NearbyKey): Promise<NearbyBraidersResponse> {
  const [, lat, lng, radiusKm, locationType, acceptingNewClients, page] = key;
  return fetchNearbyProviders(lat, lng, radiusKm, { locationType, acceptingNewClients, page });
}

function describeError(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 429) {
    return "Too many searches in a short time. Wait a minute and try again.";
  }
  return "Could not load providers";
}

export type UseNearbyProvidersResult = {
  providers: NearbyProvider[];
  total: number;
  /** True while the first page for the current search is loading. */
  isLoading: boolean;
  /** True while any request is in flight, including a retry or "load more". */
  isFetching: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  retry: () => void;
  loadMore: () => void;
};

/**
 * Providers near `search.center`, a page at a time. `search` is null until
 * the page has decided where to look (device location, the fallback city,
 * or a place the visitor searched for), and nothing is requested before
 * then.
 */
export function useNearbyProviders(search: NearbySearch | null): UseNearbyProvidersResult {
  const getKey = (pageIndex: number, previous: NearbyBraidersResponse | null): NearbyKey | null => {
    if (!search) return null;
    if (previous && (pageIndex * NEARBY_PAGE_SIZE >= previous.total || previous.braiders.length === 0)) {
      return null;
    }
    return [
      "nearby-providers",
      roundForKey(search.center.lat),
      roundForKey(search.center.lng),
      search.radiusKm,
      search.locationType,
      search.acceptingNewClients,
      pageIndex + 1,
    ];
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    getKey,
    loadPage,
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 30_000,
      keepPreviousData: true,
    },
  );

  const providers = useMemo(() => {
    const seen = new Set<string>();
    const merged: NearbyProvider[] = [];
    for (const page of data ?? []) {
      for (const provider of page.braiders) {
        if (seen.has(provider.id)) continue;
        seen.add(provider.id);
        merged.push(provider);
      }
    }
    return merged;
  }, [data]);

  const total = data?.[0]?.total ?? 0;
  const isLoadingMore = Boolean(data && size > data.length && isValidating);

  return {
    providers,
    total,
    isLoading,
    isFetching: isLoading || isValidating,
    isLoadingMore,
    hasMore: providers.length < total,
    error: error ? describeError(error) : null,
    retry: () => void mutate(),
    loadMore: () => void setSize(size + 1),
  };
}
