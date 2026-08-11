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
  label: string;
  priceDeltaCents: number;
  durationDeltaMins: number;
};

export type ServiceItem = {
  id: string;
  name: string;
  description: string | null;
  basePriceCents: number;
  baseDurationMins: number;
  variations: ServiceVariation[];
};
