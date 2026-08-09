// Google Maps JavaScript API configuration. Both values are client-exposed
// (NEXT_PUBLIC_*) by necessity - the Maps JS SDK runs entirely in the
// browser - but the API key must be restricted to this app's domain(s) in
// the Google Cloud Console, and the Map ID has no security implications on
// its own (it only selects a cloud-configured style/marker capability).
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
export const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

/**
 * A Map ID (configured in the Cloud Console, can carry a custom style) is
 * required for google.maps.marker.AdvancedMarkerElement - the modern
 * marker API the braider map uses for custom photo pins (see
 * BraiderMap.tsx) instead of the legacy, deprecated google.maps.Marker.
 */
export function isMapsConfigured(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_MAP_ID);
}

export const KATHLEEN_GEORGIA_CENTER = { lat: 32.694, lng: -83.6185 };
