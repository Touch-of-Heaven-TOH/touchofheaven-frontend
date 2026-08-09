/** Mirrors modules/discovery/discovery.service.ts's NearbyBraider shape in
 * Backend-of-TOH. Kept in sync by hand - the two repos don't share types
 * directly, since this app never imports backend code. */
export type NextAvailableSlotBucket = 'TODAY' | 'THIS_WEEK' | 'LATER' | 'NONE';

export type NearbyBraider = {
  id: string;
  kind: 'location' | 'serviceArea';
  braiderId: string;
  professionalName: string;
  bio: string | null;
  locationLabel: string | null;
  locationModel: 'PUBLIC_SALON' | 'PRIVATE_STUDIO' | 'MOBILE';
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
