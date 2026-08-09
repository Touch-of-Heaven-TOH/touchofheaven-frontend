/** Mirrors modules/discovery/discovery.service.ts's NearbyBraider shape in
 * Backend-of-TOH. Kept in sync by hand - the two repos don't share types
 * directly, since this app never imports backend code. */
export type NextAvailableSlotBucket = 'TODAY' | 'THIS_WEEK' | 'LATER' | 'NONE';

export type DiscoveryLocationType = 'PUBLIC_SALON' | 'PRIVATE_STUDIO' | 'MOBILE';

/** The map search panel's filter state - mirrors
 * discovery.schemas.ts's locationType/category/acceptingNewClients query
 * params in Backend-of-TOH (nulls/false mean "no filter applied"). */
export type DiscoveryFilters = {
  locationType: DiscoveryLocationType | null;
  category: string | null;
  acceptingNewClients: boolean;
};

export const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = {
  locationType: null,
  category: null,
  acceptingNewClients: false,
};

export type NearbyBraider = {
  id: string;
  kind: 'location' | 'serviceArea';
  braiderId: string;
  professionalName: string;
  bio: string | null;
  locationLabel: string | null;
  locationModel: DiscoveryLocationType;
  isApproximateLocation: boolean;
  address: string | null;
  latitude: number;
  longitude: number;
  radiusMiles: number | null;
  photo: { url: string; altText: string } | null;
  photos: { url: string; altText: string }[];
  specialties: string[];
  rating: { average: number | null; count: number };
  nextAvailableSlotAt: string | null;
  nextAvailableSlotBucket: NextAvailableSlotBucket;
  acceptsNewClients: boolean;
  distanceKm: number;
};

export type NearbyBraidersResponse = {
  braiders: NearbyBraider[];
  total: number;
  searchCenter: { latitude: number; longitude: number };
};
