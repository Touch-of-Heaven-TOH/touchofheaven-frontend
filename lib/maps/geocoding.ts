import { loadGeocodingLibrary } from '@/lib/maps/loader';
import type { Coordinates } from '@/lib/maps/types';

/**
 * Turns coordinates into a short, human-readable "city, region" string -
 * "Warner Robins, Georgia", "Lagos, Nigeria", "London, United Kingdom" -
 * used for the "Braiders near {locationName}" search bar label. Falls back
 * through locality -> postal_town -> sublocality (Google's address
 * component types vary by country) and prefers state/province for US
 * results, country for everywhere else, matching how people actually
 * refer to their own location at this zoom level.
 */
export async function reverseGeocodeCoordinates(
  coordinates: Coordinates,
): Promise<string | null> {
  const { Geocoder } = await loadGeocodingLibrary();
  const geocoder = new Geocoder();

  const response = await geocoder.geocode({
    location: { lat: coordinates.lat, lng: coordinates.lng },
  });
  const result = response.results[0];
  if (!result) return null;

  const byType = new Map<string, string>();
  for (const component of result.address_components) {
    for (const type of component.types) {
      if (!byType.has(type)) byType.set(type, component.long_name);
    }
  }

  const locality =
    byType.get('locality') ??
    byType.get('postal_town') ??
    byType.get('sublocality');
  const country = byType.get('country');
  const region =
    country === 'United States' ? byType.get('administrative_area_level_1') : country;

  const parts = [locality, region].filter(
    (part): part is string => Boolean(part),
  );
  if (parts.length > 0) return parts.join(', ');
  return result.formatted_address ?? null;
}
