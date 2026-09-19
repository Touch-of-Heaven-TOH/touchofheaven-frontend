import { browserApiFetch } from "@/lib/api/browser";
import type {
  DiscoveryLocationType,
  NearbyBraider,
  NearbyBraidersResponse,
} from "@/lib/discovery/types";

/**
 * Real provider discovery, backed by the backend's public
 * GET /api/v1/braiders/nearby (PostGIS radius search over VERIFIED
 * businesses). This replaces the sample records in discovery-data.ts that
 * the discovery map and results list used to read from.
 *
 * The backend decides what is safe to show: a PRIVATE_STUDIO's pin arrives
 * already shifted about 400 m from the real address, and a mobile
 * provider's origin is shifted the same way. Nothing here adjusts
 * coordinates; the map plots exactly what the API returns.
 */

/** Matches the search radius the map opens with before the visitor zooms. */
export const DEFAULT_SEARCH_RADIUS_KM = 10;

/** The backend accepts 1-500 km (DISCOVERY_MIN/MAX_RADIUS_KM). */
export const MIN_SEARCH_RADIUS_KM = 1;
export const MAX_SEARCH_RADIUS_KM = 500;

/** Radius choices offered in the filters, and the "search wider" ladder. */
export const SEARCH_RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100, 250, 500] as const;

/** The backend caps a page at 20 results (DISCOVERY_MAX_LIMIT). */
export const NEARBY_PAGE_SIZE = 20;

export type NearbyProviderFilters = {
  locationType?: DiscoveryLocationType | null;
  acceptingNewClients?: boolean;
  page?: number;
};

export type NearbyProvider = NearbyBraider;

export function clampRadiusKm(radiusKm: number): number {
  if (!Number.isFinite(radiusKm)) return DEFAULT_SEARCH_RADIUS_KM;
  const clamped = Math.min(MAX_SEARCH_RADIUS_KM, Math.max(MIN_SEARCH_RADIUS_KM, radiusKm));
  return Math.round(clamped);
}

/**
 * The next radius up the ladder, for the empty state's "search a wider
 * area" action. Null once the search already covers the maximum.
 */
export function widerRadiusKm(radiusKm: number): number | null {
  return SEARCH_RADIUS_OPTIONS_KM.find((option) => option > radiusKm) ?? null;
}

/**
 * Coordinates are sent with a fixed number of decimals: the backend only
 * accepts plain decimal numbers, and String() would render a tiny value
 * such as 0.0000001 as "1e-7". Five decimals is about a metre.
 */
function coordinateParam(value: number): string {
  return value.toFixed(5);
}

export const fetchNearbyProviders = async (
  lat: number,
  lng: number,
  radius: number = DEFAULT_SEARCH_RADIUS_KM,
  filters: NearbyProviderFilters = {},
): Promise<NearbyBraidersResponse> => {
  const params = new URLSearchParams({
    lat: coordinateParam(lat),
    lng: coordinateParam(lng),
    radius: String(clampRadiusKm(radius)),
    limit: String(NEARBY_PAGE_SIZE),
  });
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.locationType) params.set("locationType", filters.locationType);
  if (filters.acceptingNewClients) params.set("acceptingNewClients", "true");

  // browserApiFetch resolves NEXT_PUBLIC_API_URL (the API runs on its own
  // origin, so a relative /api/v1 URL would hit this Next.js app and 404),
  // unwraps the { success, data } envelope and throws on a non-2xx answer.
  return browserApiFetch<NearbyBraidersResponse>(
    `/api/v1/braiders/nearby?${params.toString()}`,
  );
};

/**
 * Whether a result can be drawn as a pin. Mobile-only providers come back
 * as a service area (a travel radius around a shifted origin), not a place
 * a client can go to, so they are listed but not pinned. Anything without
 * usable coordinates is skipped rather than dropped at 0,0 off the coast of
 * Africa.
 */
export function hasMappableLocation(provider: NearbyProvider): boolean {
  if (provider.kind !== "location") return false;
  const { latitude, longitude } = provider;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false;
  return !(latitude === 0 && longitude === 0);
}

const LOCATION_TYPE_LABELS: Record<DiscoveryLocationType, string> = {
  PUBLIC_SALON: "Salon",
  PRIVATE_STUDIO: "Private studio",
  MOBILE: "Comes to you",
};

export function locationTypeLabel(type: DiscoveryLocationType): string {
  return LOCATION_TYPE_LABELS[type];
}

/** The provider's headline service, for a card or a pin's popup. */
export function mainServiceType(provider: NearbyProvider): string {
  return provider.specialties[0] ?? locationTypeLabel(provider.locationModel);
}

export function formatRating(provider: NearbyProvider): string | null {
  const { average, count } = provider.rating;
  if (count === 0 || average === null) return null;
  return `${average.toFixed(1)} (${count} review${count === 1 ? "" : "s"})`;
}

/**
 * "Today, 14:00" / "Tomorrow, 09:30" / "Mon 21 Sep, 09:00", in the
 * visitor's own timezone. The backend already looked 14 days ahead, so a
 * missing value means no opening in that window.
 */
export function formatNextOpening(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "No openings in the next 2 weeks";
  const slot = new Date(iso);
  if (Number.isNaN(slot.getTime())) return "Check the calendar for openings";

  const time = slot.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDifference = Math.round((startOfDay(slot) - startOfDay(now)) / 86_400_000);
  if (dayDifference <= 0) return `Today, ${time}`;
  if (dayDifference === 1) return `Tomorrow, ${time}`;
  const day = slot.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return `${day}, ${time}`;
}

export function providerInitials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "");
  return letters.join("") || "TH";
}

export function profileHref(provider: Pick<NearbyProvider, "braiderId">): string {
  return `/businesses/${provider.braiderId}`;
}

export function bookingHref(provider: Pick<NearbyProvider, "braiderId">): string {
  return `/book/${provider.braiderId}`;
}
