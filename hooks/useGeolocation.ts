'use client';

import { useCallback, useState } from 'react';
import { reverseGeocodeCoordinates } from '@/lib/maps/geocoding';
import type { Coordinates } from '@/lib/maps/types';

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'timeout'
  | 'unsupported';

export type UseGeolocationResult = {
  coordinates: Coordinates | null;
  locationName: string | null;
  status: GeolocationStatus;
  requestLocation: () => void;
  clearLocation: () => void;
};

const GEOLOCATION_TIMEOUT_MS = 8_000;

/**
 * Every failure path here (unsupported, denied, timeout) lands on a status
 * the UI treats identically: hide the map's "detecting your location"
 * state and show the manual search input, prominently and focused, with
 * no browser-level error dialog and no in-app error banner. The spec is
 * explicit about this - a permission denial and a slow GPS fix are not
 * failures a user should ever have to read an error message about; they're
 * just "we'll ask you to type it instead."
 *
 * Browser-support and permission checks happen inside requestLocation()
 * itself, not at hook-mount time - `navigator` doesn't exist during SSR,
 * and checking eagerly on mount would mean either a server/client
 * hydration mismatch or an unwanted auto-prompt for permission before any
 * user gesture. Nothing here runs until a caller (typically a button, or
 * the map page's own mount effect - see MapPageClient) calls
 * requestLocation() explicitly.
 */
export function useGeolocation(): UseGeolocationResult {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }

    setStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoordinates(nextCoordinates);
        setStatus('granted');

        // Best-effort - a failed reverse-geocode should never revert a
        // successful location grant. The "Braiders near {name}" label
        // just falls back to omitting the name.
        reverseGeocodeCoordinates(nextCoordinates)
          .then((name) => setLocationName(name))
          .catch(() => setLocationName(null));
      },
      (error) => {
        setStatus(
          error.code === error.TIMEOUT ? 'timeout' : 'denied',
        );
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 0,
      },
    );
  }, []);

  const clearLocation = useCallback(() => {
    setStatus('idle');
    setCoordinates(null);
    setLocationName(null);
  }, []);

  return { coordinates, locationName, status, requestLocation, clearLocation };
}
