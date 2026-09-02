'use client';

import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_MAP_CENTER, MAP_STYLE_URL } from '@/lib/maps/config';
import type { Coordinates } from '@/lib/maps/types';
import type { NearbyBraider } from '@/lib/discovery/types';
import {
  buildBraiderMarkerContent,
  buildUserLocationMarkerContent,
} from '@/components/map/marker-content';

const PAN_DEBOUNCE_MS = 600;
const SEARCH_THIS_AREA_THRESHOLD_METERS = 2_000;
const GEOLOCATION_FLY_TO_ZOOM = 12;

// MapLibre parses vector tiles off the main thread in a module Worker it
// builds from its own bundled URL (import.meta.url-relative) - under this
// app's Turbopack dev server, that resolution comes out wrong (it points
// at the current page's own URL instead of MapLibre's worker script),
// so the worker gets created, immediately fails to load real code, and
// silently closes - the map style/sprite still load fine, but no vector
// tile ever gets requested, rendering just the style's blank background.
// Pointing MapLibre at a copy of its own worker bundle served as a plain
// static file (public/, untouched by any bundler) sidesteps the bad
// resolution entirely. The worker script itself imports
// ./maplibre-gl-shared.mjs by a relative URL, so that file has to sit
// alongside it in public/ too - without it the worker loads, immediately
// 404s on that import, and closes just as silently. If maplibre-gl is
// upgraded, re-copy both node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs
// and node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs into public/.
maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');

export type MapMoveEvent = {
  center: Coordinates;
  zoom: number;
};

export type MapFocusRequest = {
  coordinates: Coordinates;
  zoom?: number;
};

export type BraiderMapProps = {
  braiders: NearbyBraider[];
  userCoordinates?: Coordinates | null;
  // Both of these carry a NearbyBraider's `id` (the location/service-area
  // row backing its pin) - not `braiderId` (the underlying user). A
  // braider can have more than one discoverable entry, and each entry gets
  // its own marker, so the pin/list selection contract has to key off the
  // entry, not the person. BraiderListSidebar uses this same `id`.
  onBraiderSelect?: (id: string) => void;
  onMapMove?: (event: MapMoveEvent) => void;
  isLoading?: boolean;
  selectedBraiderId?: string | null;
  // Set this to a *new object* (not a mutated one) to command the map to
  // pan/zoom there - e.g. when the search bar's place search resolves a
  // selection. Unlike userCoordinates (which only ever flies once, the
  // first time it's granted), every new focusRequest re-fires, since each
  // is a distinct, explicit user action. Plain map dragging never goes
  // through this - the camera is already where the user put it, so only
  // onMapMove/searchCenterRef need to know about that.
  focusRequest?: MapFocusRequest | null;
};

function haversineMeters(a: Coordinates, b: Coordinates): number {
  const earthRadiusMeters = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

/**
 * The braider discovery map. Renders custom photo markers for every
 * braider, tracks the user's own pulsing location dot, and reports
 * user-initiated pans (not the map's own programmatic moves, like flying to
 * a newly-granted location) so the caller can offer a "Search this area"
 * re-fetch.
 *
 * Runs on MapLibre GL JS against OpenFreeMap's free vector tiles - no API
 * key required, see lib/maps/config.ts. Marker clustering (the previous
 * Google Maps build had one below zoom 9) isn't reimplemented here yet;
 * individual pins render at every zoom level.
 */
export default function BraiderMap({
  braiders,
  userCoordinates,
  onBraiderSelect,
  onMapMove,
  isLoading,
  selectedBraiderId,
  focusRequest,
}: BraiderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const searchCenterRef = useRef<Coordinates>({ ...DEFAULT_MAP_CENTER });
  const hasFlownToUserRef = useRef(false);
  const userGestureRef = useRef(false);
  const panDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loadError, setLoadError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);

  // The mount-once effect below wires the "idle" listener a single time,
  // but onMapMove is free to change identity on every parent render (it
  // won't always be wrapped in useCallback). Reading it through a ref -
  // updated on every render, not just at mount - keeps that listener
  // calling the latest callback instead of closing over a stale one.
  const onMapMoveRef = useRef(onMapMove);
  useEffect(() => {
    onMapMoveRef.current = onMapMove;
  }, [onMapMove]);

  // Mount the map exactly once.
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [searchCenterRef.current.lng, searchCenterRef.current.lat],
      zoom: 10,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('error', (event: maplibregl.ErrorEvent) => {
      if (cancelled) return;
      console.error('[BraiderMap] MapLibre failed to load.', event.error);
      setLoadError(true);
    });

    map.on('load', () => {
      if (cancelled) return;
      setMapReady(true);
    });

    // Distinguish a user-driven pan/zoom from our own programmatic camera
    // moves (the geolocation fly-to, or centering on a selected braider) -
    // only the former should ever surface "Search this area" or trigger a
    // re-fetch. See this component's doc comment.
    map.on('dragstart', () => {
      userGestureRef.current = true;
    });
    map.on('wheel', () => {
      userGestureRef.current = true;
    });
    map.on('touchstart', () => {
      userGestureRef.current = true;
    });

    map.on('idle', () => {
      if (panDebounceRef.current) clearTimeout(panDebounceRef.current);
      panDebounceRef.current = setTimeout(() => {
        if (!userGestureRef.current) return;
        userGestureRef.current = false;

        const center = map.getCenter();
        const zoom = map.getZoom();

        const currentCenter: Coordinates = { lat: center.lat, lng: center.lng };
        const distanceFromSearchCenter = haversineMeters(
          searchCenterRef.current,
          currentCenter,
        );

        // Within the threshold: chase the pan silently, same as the spec's
        // "debounced pan -> re-fetch". Beyond it: only surface the "Search
        // this area" pill and wait for an explicit click
        // (handleSearchThisArea) rather than re-fetching out from under the
        // user - a small nudge shouldn't refetch the same way a fast pan
        // across the map to a different city does.
        if (distanceFromSearchCenter > SEARCH_THIS_AREA_THRESHOLD_METERS) {
          setShowSearchThisArea(true);
          return;
        }

        searchCenterRef.current = currentCenter;
        setShowSearchThisArea(false);
        onMapMoveRef.current?.({ center: currentCenter, zoom });
      }, PAN_DEBOUNCE_MS);
    });

    return () => {
      cancelled = true;
      if (panDebounceRef.current) clearTimeout(panDebounceRef.current);
      map.remove();
      mapRef.current = null;
    };
    // Mount-once: none of this effect's captured values are meant to react
    // to prop changes - see the dedicated effects below for that.
  }, []);

  // Rebuild braider markers when the result set changes.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    for (const braider of braiders) {
      const content = buildBraiderMarkerContent(braider);
      content.addEventListener('click', () => onBraiderSelect?.(braider.id));
      content.addEventListener('keydown', (event) => {
        if (event instanceof KeyboardEvent && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onBraiderSelect?.(braider.id);
        }
      });

      const marker = new maplibregl.Marker({ element: content })
        .setLngLat([braider.longitude, braider.latitude])
        .addTo(map);
      markersRef.current.set(braider.id, marker);
    }
  }, [braiders, mapReady, onBraiderSelect]);

  // Toggle the active (selected) marker's highlight class.
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.getElement().classList.toggle('toh-marker--active', id === selectedBraiderId);
    }
  }, [selectedBraiderId, braiders]);

  // Track the user's own location: create/update the pulsing marker, and
  // fly to it once (not on every re-render) the first time it's granted.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (!userCoordinates) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      hasFlownToUserRef.current = false;
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userCoordinates.lng, userCoordinates.lat]);
    } else {
      userMarkerRef.current = new maplibregl.Marker({
        element: buildUserLocationMarkerContent(),
      })
        .setLngLat([userCoordinates.lng, userCoordinates.lat])
        .addTo(map);
    }

    if (!hasFlownToUserRef.current) {
      hasFlownToUserRef.current = true;
      searchCenterRef.current = userCoordinates;
      map.flyTo({ center: [userCoordinates.lng, userCoordinates.lat], zoom: GEOLOCATION_FLY_TO_ZOOM });
      setShowSearchThisArea(false);
    }
  }, [userCoordinates, mapReady]);

  // Pan/zoom to an explicit focus request (e.g. a search bar selection).
  // Keyed on object identity, not coordinate value, so re-selecting the
  // same place still re-centres the map - see MapFocusRequest's doc
  // comment on BraiderMapProps.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !focusRequest) return;
    searchCenterRef.current = focusRequest.coordinates;
    mapRef.current.flyTo({
      center: [focusRequest.coordinates.lng, focusRequest.coordinates.lat],
      zoom: focusRequest.zoom ?? GEOLOCATION_FLY_TO_ZOOM,
    });
    setShowSearchThisArea(false);
  }, [focusRequest, mapReady]);

  function handleSearchThisArea() {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    const currentCenter: Coordinates = { lat: center.lat, lng: center.lng };
    searchCenterRef.current = currentCenter;
    setShowSearchThisArea(false);
    onMapMove?.({ center: currentCenter, zoom });
  }

  if (loadError) {
    return (
      <div
        role="status"
        className="flex h-full w-full flex-col items-center justify-center gap-2 bg-purple-50 p-8 text-center"
      >
        <p className="text-lg font-medium text-purple-900">Map coming soon</p>
        <p className="max-w-sm text-sm text-purple-700">
          We&apos;re still setting up braider discovery in your area. Check
          back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {isLoading ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-white/30"
        />
      ) : null}

      {showSearchThisArea ? (
        <button
          type="button"
          onClick={handleSearchThisArea}
          className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-purple-900 shadow-lg ring-1 ring-black/10 transition hover:shadow-xl"
        >
          Search this area
        </button>
      ) : null}
    </div>
  );
}
