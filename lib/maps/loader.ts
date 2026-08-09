import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_API_KEY } from '@/lib/maps/config';

/**
 * setOptions() must run exactly once, before the first importLibrary()
 * call - the package's own functional API replaced the older Loader class
 * (still exported but deprecated as of the version installed here; see
 * node_modules/@googlemaps/js-api-loader/dist/index.d.ts). This flag makes
 * "exactly once" hold even if multiple components call loadMapsLibrary()
 * (etc.) independently during the same page session.
 */
let optionsConfigured = false;

function ensureOptionsConfigured(): void {
  if (optionsConfigured) return;
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set - cannot load Google Maps.',
    );
  }
  setOptions({ key: GOOGLE_MAPS_API_KEY, v: 'weekly' });
  optionsConfigured = true;
}

export async function loadMapsLibrary(): Promise<google.maps.MapsLibrary> {
  ensureOptionsConfigured();
  return importLibrary('maps');
}

export async function loadMarkerLibrary(): Promise<google.maps.MarkerLibrary> {
  ensureOptionsConfigured();
  return importLibrary('marker');
}

export async function loadGeocodingLibrary(): Promise<google.maps.GeocodingLibrary> {
  ensureOptionsConfigured();
  return importLibrary('geocoding');
}

export async function loadPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  ensureOptionsConfigured();
  return importLibrary('places');
}
