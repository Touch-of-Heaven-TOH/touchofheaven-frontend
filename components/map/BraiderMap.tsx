'use client';

import { useEffect, useRef, useState } from 'react';
import { isMapsConfigured, KATHLEEN_GEORGIA_CENTER } from '@/lib/maps/config';
import { loadMapsLibrary } from '@/lib/maps/loader';

/**
 * Step 1 of the braider discovery map: proves the Google Maps JavaScript
 * API initializes correctly. Deliberately no business logic yet (no
 * markers, no data fetching, no geolocation) - later steps extend this
 * same component in place rather than replacing it.
 */
export default function BraiderMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  // Pure and synchronous - computed directly during render rather than via
  // an effect+state pair, since there's no side effect here to synchronize,
  // just a derived value from env vars that are already known at render time.
  const configured = isMapsConfigured();

  useEffect(() => {
    if (!configured) {
      console.error(
        '[BraiderMap] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and/or NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID are not set. The map cannot render until both are configured.',
      );
      return;
    }

    let cancelled = false;

    loadMapsLibrary()
      .then(({ Map }) => {
        if (cancelled || !containerRef.current) return;
        new Map(containerRef.current, {
          center: KATHLEEN_GEORGIA_CENTER,
          zoom: 10,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
          disableDefaultUI: false,
          clickableIcons: false,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('[BraiderMap] Failed to load Google Maps.', error);
        setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [configured]);

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

  return <div ref={containerRef} className="h-full w-full" />;
}
