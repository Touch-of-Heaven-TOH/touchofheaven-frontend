import { NOMINATIM_CONTACT_EMAIL } from "@/lib/maps/config";
import type { Coordinates } from "@/lib/maps/types";

export type GeocodeResult = {
  label: string;
  coordinates: Coordinates;
};

/**
 * Free-text place search against Nominatim (OpenStreetMap's geocoder) - the
 * replacement for Google Places Autocomplete, which this app never actually
 * had a working key for and which was hard-restricted to US results only
 * (see the old MapSearchPanel.tsx's `includedRegionCodes: ['us']`). This
 * has no region restriction, so a search for a Douala or Yaounde
 * neighborhood works the same as one for an American city.
 *
 * No API key, but Nominatim's usage policy asks every client to identify
 * itself - the `email` param below is that identification, not a login.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "6");
  url.searchParams.set("email", NOMINATIM_CONTACT_EMAIL);

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error(`Nominatim search failed with status ${response.status}`);
  }

  const results = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  return results.map((result) => ({
    label: result.display_name,
    coordinates: { lat: Number(result.lat), lng: Number(result.lon) },
  }));
}

/**
 * Coordinates -> human-readable label, via Nominatim's reverse endpoint -
 * used right after a real navigator.geolocation fix (e.g. "Use my current
 * location") to fill in a readable address instead of leaving raw numbers
 * in a text field.
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(coordinates.lat));
  url.searchParams.set("lon", String(coordinates.lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("email", NOMINATIM_CONTACT_EMAIL);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const result = (await response.json()) as { display_name?: string };
  return result.display_name ?? null;
}
