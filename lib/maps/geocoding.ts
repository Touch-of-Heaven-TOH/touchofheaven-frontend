import { NOMINATIM_CONTACT_EMAIL } from '@/lib/maps/config';
import type { Coordinates } from '@/lib/maps/types';

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
};

/**
 * Turns coordinates into a short, human-readable "city, region" string -
 * "Warner Robins, Georgia", "Douala, Littoral", "London, United Kingdom" -
 * used for the "Braiders near {locationName}" search bar label. Falls back
 * through city -> town -> village -> municipality (OSM's address tagging
 * varies by place) and prefers state/province for US results, country for
 * everywhere else, matching how people actually refer to their own
 * location at this zoom level.
 *
 * Runs on Nominatim (OpenStreetMap's free reverse geocoder) - no API key,
 * see lib/maps/config.ts.
 */
export async function reverseGeocodeCoordinates(
  coordinates: Coordinates,
): Promise<string | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(coordinates.lat));
  url.searchParams.set('lon', String(coordinates.lng));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('email', NOMINATIM_CONTACT_EMAIL);
  // Name the place in the visitor's language ("Cameroon", not the local
  // "Cameroun"), falling back to OpenStreetMap's local names.
  if (typeof navigator !== 'undefined' && navigator.language) {
    url.searchParams.set('accept-language', navigator.language);
  }

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const result = (await response.json()) as {
    address?: NominatimAddress;
    display_name?: string;
  };
  const address = result.address;
  if (!address) return result.display_name ?? null;

  const locality = address.city ?? address.town ?? address.village ?? address.municipality;
  const region = address.country === 'United States' ? address.state : address.country;

  const parts = [locality, region].filter((part): part is string => Boolean(part));
  if (parts.length > 0) return parts.join(', ');
  return result.display_name ?? null;
}
