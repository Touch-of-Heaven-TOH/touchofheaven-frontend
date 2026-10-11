'use client';

import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LoaderCircle, LocateFixed } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_MAP_CENTER, MAP_STYLE_URL } from '@/lib/maps/config';
import { guardNullComparisons } from '@/lib/maps/style-guards';
import type { Coordinates } from '@/lib/maps/types';
import type { NearbyBraider } from '@/lib/discovery/types';
import {
  buildBraiderMarkerContent,
  buildUserLocationMarkerContent,
} from '@/components/map/marker-content';

const PAN_DEBOUNCE_MS = 600;
const SEARCH_THIS_AREA_THRESHOLD_METERS = 2_000;
const GEOLOCATION_FLY_TO_ZOOM = 12;
const KM_PER_DEGREE_LATITUDE = 111.32;

// The public theme's --color-brand. MapLibre paint properties are plain
// values, so the CSS variable can't be referenced here.
const SEARCH_AREA_COLOR = '#7a2fe0';
const SEARCH_AREA_SOURCE = 'toh-search-area';
// The popup's offset from its pin plus a little breathing room.
const POPUP_CLEARANCE_PX = 44;

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
  /** Radius of the largest circle around `center` that fits in view. */
  radiusKm: number;
};

export type MapFocusRequest = {
  coordinates: Coordinates;
  zoom?: number;
  /** Frame a circle of this radius instead of using a fixed zoom. */
  radiusKm?: number;
};

export type MapSearchArea = {
  center: Coordinates;
  radiusKm: number;
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
  /**
   * When set, the selected pin opens a popup on the map holding whatever
   * this returns. Closing it (its own close control, or a click on the
   * map) calls onPopupClose.
   */
  renderPopup?: (braider: NearbyBraider) => ReactNode;
  onPopupClose?: () => void;
  /** Shows a "Locate me" button on the map when provided. */
  onLocateMe?: () => void;
  locating?: boolean;
  /** Outlines the area the current results were searched in. */
  searchArea?: MapSearchArea | null;
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

function kmPerDegreeLongitude(lat: number) {
  return KM_PER_DEGREE_LATITUDE * Math.max(0.01, Math.cos((lat * Math.PI) / 180));
}

/** The circle's bounding box, for fitBounds. */
function circleBounds(center: Coordinates, radiusKm: number): maplibregl.LngLatBoundsLike {
  const latDelta = radiusKm / KM_PER_DEGREE_LATITUDE;
  const lngDelta = radiusKm / kmPerDegreeLongitude(center.lat);
  return [
    [center.lng - lngDelta, Math.max(-85, center.lat - latDelta)],
    [center.lng + lngDelta, Math.min(85, center.lat + latDelta)],
  ];
}

/** A 64-sided polygon approximating the search circle. */
function circlePolygon(center: Coordinates, radiusKm: number) {
  const steps = 64;
  const ring: [number, number][] = [];
  for (let step = 0; step <= steps; step += 1) {
    const angle = (step / steps) * 2 * Math.PI;
    ring.push([
      center.lng + (radiusKm / kmPerDegreeLongitude(center.lat)) * Math.cos(angle),
      center.lat + (radiusKm / KM_PER_DEGREE_LATITUDE) * Math.sin(angle),
    ]);
  }
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [ring] },
  };
}

function visibleRadiusKm(map: maplibregl.Map): number {
  const center = map.getCenter();
  const bounds = map.getBounds();
  const here: Coordinates = { lat: center.lat, lng: center.lng };
  const toNorth = haversineMeters(here, { lat: bounds.getNorth(), lng: center.lng });
  const toEast = haversineMeters(here, { lat: center.lat, lng: bounds.getEast() });
  return Math.min(toNorth, toEast) / 1000;
}

function isPlottable(braider: NearbyBraider) {
  return (
    Number.isFinite(braider.latitude) &&
    Number.isFinite(braider.longitude) &&
    !(braider.latitude === 0 && braider.longitude === 0)
  );
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
  renderPopup,
  onPopupClose,
  onLocateMe,
  locating = false,
  searchArea,
}: BraiderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const silentPopupCloseRef = useRef(false);
  const searchCenterRef = useRef<Coordinates>({ ...DEFAULT_MAP_CENTER });
  const hasFlownToUserRef = useRef(false);
  const userGestureRef = useRef(false);
  const panDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loadError, setLoadError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  // The popup's React content is portalled into this node, which MapLibre
  // positions over the map. This component only ever renders in the
  // browser (every caller loads it with ssr: false), but the guard keeps a
  // stray server render from crashing.
  const [popupContainer] = useState<HTMLDivElement | null>(() =>
    typeof document === 'undefined' ? null : document.createElement('div'),
  );

  // The mount-once effect below wires listeners a single time, but these
  // callbacks are free to change identity on every parent render. Reading
  // them through refs keeps those listeners calling the latest version.
  const onMapMoveRef = useRef(onMapMove);
  const onBraiderSelectRef = useRef(onBraiderSelect);
  const onPopupCloseRef = useRef(onPopupClose);
  useEffect(() => {
    onMapMoveRef.current = onMapMove;
    onBraiderSelectRef.current = onBraiderSelect;
    onPopupCloseRef.current = onPopupClose;
  }, [onMapMove, onBraiderSelect, onPopupClose]);

  // Mount the map exactly once.
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let loaded = false;

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [searchCenterRef.current.lng, searchCenterRef.current.lat],
      zoom: 10,
    });
    // Loaded through setStyle so the style can be patched before use - see
    // guardNullComparisons for the console warnings this prevents.
    map.setStyle(MAP_STYLE_URL, {
      transformStyle: (_previous, next) => guardNullComparisons(next),
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('error', (event: maplibregl.ErrorEvent) => {
      if (cancelled) return;
      // Once the style has loaded, errors are things like one tile failing
      // to download, which MapLibre retries on its own. Only a failure to
      // load the map at all replaces it with the fallback message.
      if (loaded) return;
      console.error('[BraiderMap] MapLibre failed to load.', event.error);
      setLoadError(true);
    });

    map.on('load', () => {
      if (cancelled) return;
      loaded = true;
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
        onMapMoveRef.current?.({ center: currentCenter, zoom, radiusKm: visibleRadiusKm(map) });
      }, PAN_DEBOUNCE_MS);
    });

    const markers = markersRef.current;
    return () => {
      cancelled = true;
      if (panDebounceRef.current) clearTimeout(panDebounceRef.current);
      if (popupRef.current) {
        silentPopupCloseRef.current = true;
        popupRef.current.remove();
        popupRef.current = null;
      }
      markers.clear();
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
      if (!isPlottable(braider)) continue;
      const content = buildBraiderMarkerContent(braider);
      content.addEventListener('click', (event) => {
        // Keep the click from reaching the map, which would read it as a
        // click on empty map and close the popup this click is opening.
        event.stopPropagation();
        onBraiderSelectRef.current?.(braider.id);
      });
      content.addEventListener('keydown', (event) => {
        if (event instanceof KeyboardEvent && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onBraiderSelectRef.current?.(braider.id);
        }
      });

      const marker = new maplibregl.Marker({ element: content })
        .setLngLat([braider.longitude, braider.latitude])
        .addTo(map);
      markersRef.current.set(braider.id, marker);
    }
  }, [braiders, mapReady]);

  // Toggle the active (selected) marker's highlight class.
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.getElement().classList.toggle('toh-marker--active', id === selectedBraiderId);
    }
  }, [selectedBraiderId, braiders, mapReady]);

  // Open, move or close the selected pin's popup.
  const popupBraider =
    renderPopup && selectedBraiderId
      ? (braiders.find((braider) => braider.id === selectedBraiderId && isPlottable(braider)) ?? null)
      : null;
  const popupId = popupBraider?.id ?? null;
  const popupLat = popupBraider?.latitude ?? null;
  const popupLng = popupBraider?.longitude ?? null;

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !popupContainer) return;

    if (popupId === null || popupLat === null || popupLng === null) {
      if (popupRef.current) {
        silentPopupCloseRef.current = true;
        popupRef.current.remove();
      }
      return;
    }

    let popup = popupRef.current;
    if (!popup) {
      popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: true,
        focusAfterOpen: false,
        maxWidth: '320px',
        offset: 30,
        className: 'toh-map-popup',
      });
      popup.setDOMContent(popupContainer);
      popup.on('close', () => {
        popupRef.current = null;
        if (silentPopupCloseRef.current) {
          silentPopupCloseRef.current = false;
          return;
        }
        onPopupCloseRef.current?.();
      });
      popupRef.current = popup;
    }

    popup.setLngLat([popupLng, popupLat]);
    if (!popup.isOpen()) popup.addTo(map);

    // A pin picked from the results list may be off screen, and on a short
    // (phone-sized) map a pin near the top edge leaves no room for the
    // popup either side of it. In both cases, bring the pin low enough
    // that the whole popup opens above it.
    const mapHeight = map.getContainer().clientHeight;
    const pin = map.project([popupLng, popupLat]);
    const needed = (popup.getElement()?.offsetHeight ?? 0) + POPUP_CLEARANCE_PX;
    const fitsAbove = pin.y >= needed;
    const fitsBelow = mapHeight - pin.y >= needed;
    if (!map.getBounds().contains([popupLng, popupLat]) || (!fitsAbove && !fitsBelow)) {
      const pinY = Math.min(mapHeight - POPUP_CLEARANCE_PX, needed + 8);
      map.easeTo({ center: [popupLng, popupLat], offset: [0, pinY - mapHeight / 2] });
    }
  }, [mapReady, popupContainer, popupId, popupLat, popupLng]);

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
    const map = mapRef.current;
    if (!mapReady || !map || !focusRequest) return;
    const { coordinates, radiusKm, zoom } = focusRequest;
    searchCenterRef.current = coordinates;
    if (radiusKm !== undefined && zoom === undefined) {
      map.fitBounds(circleBounds(coordinates, radiusKm), { padding: 32, duration: 900 });
    } else {
      map.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: zoom ?? GEOLOCATION_FLY_TO_ZOOM,
      });
    }
    setShowSearchThisArea(false);
  }, [focusRequest, mapReady]);

  // Outline the searched area.
  const areaLat = searchArea?.center.lat ?? null;
  const areaLng = searchArea?.center.lng ?? null;
  const areaRadius = searchArea?.radiusKm ?? null;
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const source = map.getSource(SEARCH_AREA_SOURCE) as maplibregl.GeoJSONSource | undefined;
    const data =
      areaLat === null || areaLng === null || areaRadius === null
        ? { type: 'FeatureCollection' as const, features: [] }
        : {
            type: 'FeatureCollection' as const,
            features: [circlePolygon({ lat: areaLat, lng: areaLng }, areaRadius)],
          };

    if (source) {
      source.setData(data);
      return;
    }
    if (areaLat === null) return;

    map.addSource(SEARCH_AREA_SOURCE, { type: 'geojson', data });
    map.addLayer({
      id: `${SEARCH_AREA_SOURCE}-fill`,
      type: 'fill',
      source: SEARCH_AREA_SOURCE,
      paint: { 'fill-color': SEARCH_AREA_COLOR, 'fill-opacity': 0.05 },
    });
    map.addLayer({
      id: `${SEARCH_AREA_SOURCE}-line`,
      type: 'line',
      source: SEARCH_AREA_SOURCE,
      paint: {
        'line-color': SEARCH_AREA_COLOR,
        'line-opacity': 0.45,
        'line-width': 1.5,
        'line-dasharray': [2, 2],
      },
    });
  }, [mapReady, areaLat, areaLng, areaRadius]);

  function handleSearchThisArea() {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const currentCenter: Coordinates = { lat: center.lat, lng: center.lng };
    searchCenterRef.current = currentCenter;
    setShowSearchThisArea(false);
    onMapMove?.({ center: currentCenter, zoom, radiusKm: visibleRadiusKm(map) });
  }

  if (loadError) {
    return (
      <div
        role="status"
        className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--color-surface-strong)] p-8 text-center"
      >
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">The map could not load</p>
        <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
          Check your internet connection, then refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full${renderPopup ? ' toh-map--popups' : ''}`}>
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
          className="absolute top-4 left-1/2 z-[2] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--color-brand)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--color-border)] transition hover:bg-[var(--color-brand-soft)]"
        >
          Search this area
        </button>
      ) : null}

      {onLocateMe ? (
        <button
          type="button"
          onClick={onLocateMe}
          disabled={locating}
          aria-busy={locating}
          className="absolute top-3 right-3 z-[2] inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[var(--color-brand)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--color-border)] transition hover:bg-[var(--color-brand-soft)] disabled:cursor-wait disabled:opacity-80"
        >
          {locating ? (
            <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <LocateFixed size={18} aria-hidden="true" />
          )}
          {locating ? 'Locating…' : 'Locate me'}
        </button>
      ) : null}

      {popupContainer && popupBraider && renderPopup
        ? createPortal(renderPopup(popupBraider), popupContainer)
        : null}
    </div>
  );
}
