export type PublicBraiderProfile = {
  braiderId: string;
  professionalName: string;
  bio: string | null;
  acceptsNewClients: boolean;
  rating: { average: number | null; count: number };
  specialties: string[];
};

export type PortfolioMediaItem = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
};

export type ReviewItem = {
  id: string;
  rating: number;
  reviewBody: string;
  createdAt: string;
  service: { id: string; name: string };
  response: { responseBody: string; respondedAt: string } | null;
};

export type ServiceVariation = {
  id: string;
  variationType?: string;
  label: string;
  priceDeltaCents: number;
  durationDeltaMins: number;
};

export type ServiceMediaItem = {
  id: string;
  url: string;
  altText: string;
  mediaType: "IMAGE" | "VIDEO";
};

export type ServiceItem = {
  id: string;
  name: string;
  description: string | null;
  basePriceCents: number;
  baseDurationMins: number;
  depositPercentage: number;
  /** A policy code such as "standard-v1"; see lib/businesses/policies.ts. */
  cancellationPolicy: string;
  variations: ServiceVariation[];
  media: ServiceMediaItem[];
};

export type PublicLocation = {
  id: string;
  locationType: "PUBLIC_SALON" | "PRIVATE_STUDIO";
  label: string | null;
  /** Null for a private studio unless the viewer has a confirmed booking. */
  address: string | null;
  /** Null for a private studio: its position is never published. */
  latitude: string | number | null;
  longitude: string | number | null;
};

/** Everything a public business page shows, loaded together. */
export type PublicBusiness = {
  profile: PublicBraiderProfile;
  services: ServiceItem[];
  portfolio: PortfolioMediaItem[];
  reviews: ReviewItem[];
  locations: PublicLocation[];
};
