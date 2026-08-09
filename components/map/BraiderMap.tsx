'use client';

import { MarkerClusterer, type Renderer } from '@googlemaps/markerclusterer';
import { useEffect, useRef, useState } from 'react';
import { isMapsConfigured, KATHLEEN_GEORGIA_CENTER } from '@/lib/maps/config';
import { loadMapsLibrary, loadMarkerLibrary } from '@/lib/maps/loader';
import type { Coordinates } from '@/lib/maps/types';
import type { NearbyBraider } from '@/lib/discovery/types';
import {
  buildBraiderMarkerContent,
  buildUserLocationMarkerContent,
} from '@/components/map/marker-content';

// Below this zoom, individual pins merge into clustered count circles - see
// the clusterer's SuperClusterAlgorithm maxZoom below.
const CLUSTER_MAX_ZOOM = 9;
const PAN_DEBOUNCE_MS = 600;
const SEARCH_THIS_AREA_THRESHOLD_METERS = 2_000;
const GEOLOCATION_FLY_TO_ZOOM = 12;

export type MapMoveEvent = {
  center: Coordinates;
  zoom: number;
};

export type BraiderMapProps = {
  braiders: NearbyBraider[];
  userCoordinates?: Coordinates | null;
  onBraiderSelect?: (braiderId: string) => void;
  onMapMove?: (event: MapMoveEvent) => void;
  isLoading?: boolean;
  selectedBraiderId?: string | null;
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

function buildClusterRenderer(): Renderer {
  return {
    render: ({ count, position }) => {
      const diameter = Math.min(56, 32 + count * 2);
      const el = document.createElement('div');
      el.setAttribute('aria-label', `${count} braiders in this area`);
      el.setAttribute('role', 'button');
      el.style.width = `${diameter}px`;
      el.style.height = `${diameter}px`;
      el.style.borderRadius = '9999px';
      el.style.background = 'var(--color-brand-purple)';
      el.style.color = '#ffffff';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = '600';
      el.style.fontSize = '13px';
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.35)';
      el.style.cursor = 'pointer';
      el.textContent = String(count);
      // The global `google` namespace comes from @types/google.maps; by
      // the time the clusterer ever calls this renderer, the "marker"
      // library has already been loaded (BraiderMap awaits
      // loadMarkerLibrary() before constructing the MarkerClusterer).
      return new google.maps.marker.AdvancedMarkerElement({ position, content: el });
    },
  };
}

/**
 * The braider discovery map. Renders custom photo markers for every
 * braider, clusters them below zoom 10, tracks the user's own pulsing
 * location dot, and reports user-initiated pans (not the map's own
 * programmatic moves, like flying to a newly-granted location) so the
 * caller can offer a "Search this area" re-fetch.
 */
export default function BraiderMap({
  braiders,
  userCoordinates,
  onBraiderSelect,
  onMapMove,
  isLoading,
  selectedBraiderId,
}: BraiderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(
    new Map(),
  );
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchCenterRef = useRef<Coordinates>({
    lat: KATHLEEN_GEORGIA_CENTER.lat,
    lng: KATHLEEN_GEORGIA_CENTER.lng,
  });
  const hasFlownToUserRef = useRef(false);
  const userGestureRef = useRef(false);
  const panDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loadError, setLoadError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);

  const configured = isMapsConfigured();

  // Mount the map exactly once.
  useEffect(() => {
    if (!configured) {
      console.error(
        '[BraiderMap] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and/or NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID are not set. The map cannot render until both are configured.',
      );
      return;
    }

    let cancelled = false;

    Promise.all([loadMapsLibrary(), loadMarkerLibrary()])
      .then(([{ Map }]) => {
        if (cancelled || !containerRef.current) return;

        const map = new Map(containerRef.current, {
          center: searchCenterRef.current,
          zoom: 10,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
          disableDefaultUI: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;

        // Distinguish a user-driven pan/zoom from our own programmatic
        // camera moves (the geolocation fly-to, or centering on a
        // selected braider) - only the former should ever surface
        // "Search this area" or trigger a re-fetch. See this component's
        // doc comment.
        map.addListener('dragstart', () => {
          userGestureRef.current = true;
        });
        containerRef.current.addEventListener(
          'wheel',
          () => {
            userGestureRef.current = true;
          },
          { passive: true },
        );
        containerRef.current.addEventListener(
          'touchstart',
          () => {
            userGestureRef.current = true;
          },
          { passive: true },
        );

        map.addListener('idle', () => {
          if (panDebounceRef.current) clearTimeout(panDebounceRef.current);
          panDebounceRef.current = setTimeout(() => {
            if (!userGestureRef.current) return;
            userGestureRef.current = false;

            const center = map.getCenter();
            const zoom = map.getZoom();
            if (!center || zoom === undefined) return;

            const currentCenter: Coordinates = { lat: center.lat(), lng: center.lng() };
            onMapMove?.({ center: currentCenter, zoom });

            const distanceFromSearchCenter = haversineMeters(
              searchCenterRef.current,
              currentCenter,
            );
            setShowSearchThisArea(
              distanceFromSearchCenter > SEARCH_THIS_AREA_THRESHOLD_METERS,
            );
          }, PAN_DEBOUNCE_MS);
        });

        setMapReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('[BraiderMap] Failed to load Google Maps.', error);
        setLoadError(true);
      });

    return () => {
      cancelled = true;
      if (panDebounceRef.current) clearTimeout(panDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once;
    // onMapMove is read through a stable ref-free closure intentionally,
    // matching the "wire the map up once" contract of the Maps JS API.
  }, [configured]);

  // Rebuild braider markers and the clusterer when the result set changes.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    let cancelled = false;
    loadMarkerLibrary().then(({ AdvancedMarkerElement }) => {
      if (cancelled || !mapRef.current) return;

      clustererRef.current?.clearMarkers();
      markersRef.current.clear();

      const markers = braiders.map((braider) => {
        const content = buildBraiderMarkerContent(braider);
        content.addEventListener('click', () => onBraiderSelect?.(braider.braiderId));
        content.addEventListener('keydown', (event) => {
          if (event instanceof KeyboardEvent && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onBraiderSelect?.(braider.braiderId);
          }
        });

        const marker = new AdvancedMarkerElement({
          position: { lat: braider.latitude, lng: braider.longitude },
          content,
        });
        markersRef.current.set(braider.id, marker);
        return marker;
      });

      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers,
        renderer: buildClusterRenderer(),
        algorithmOptions: { maxZoom: CLUSTER_MAX_ZOOM },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [braiders, mapReady, onBraiderSelect]);

  // Toggle the active (selected) marker's highlight class.
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const content = marker.content;
      if (!(content instanceof HTMLElement)) continue;
      content.classList.toggle('toh-marker--active', id === selectedBraiderId);
    }
  }, [selectedBraiderId, braiders]);

  // Track the user's own location: create/update the pulsing marker, and
  // fly to it once (not on every re-render) the first time it's granted.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    let cancelled = false;
    loadMarkerLibrary().then(({ AdvancedMarkerElement }) => {
      if (cancelled || !mapRef.current) return;

      if (!userCoordinates) {
        if (userMarkerRef.current) userMarkerRef.current.map = null;
        userMarkerRef.current = null;
        hasFlownToUserRef.current = false;
        return;
      }

      if (userMarkerRef.current) {
        userMarkerRef.current.position = userCoordinates;
      } else {
        userMarkerRef.current = new AdvancedMarkerElement({
          map: mapRef.current,
          position: userCoordinates,
          content: buildUserLocationMarkerContent(),
          zIndex: 1,
        });
      }

      if (!hasFlownToUserRef.current) {
        hasFlownToUserRef.current = true;
        searchCenterRef.current = userCoordinates;
        mapRef.current.panTo(userCoordinates);
        mapRef.current.setZoom(GEOLOCATION_FLY_TO_ZOOM);
        setShowSearchThisArea(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userCoordinates, mapReady]);

  function handleSearchThisArea() {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    if (!center || zoom === undefined) return;
    const currentCenter: Coordinates = { lat: center.lat(), lng: center.lng() };
    searchCenterRef.current = currentCenter;
    setShowSearchThisArea(false);
    onMapMove?.({ center: currentCenter, zoom });
  }

  if (!configured || loadError) {
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
