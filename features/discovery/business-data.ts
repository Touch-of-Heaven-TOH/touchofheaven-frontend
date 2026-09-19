import { cache } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { serverApiFetch } from "@/lib/api/server";
import type {
  PortfolioMediaItem,
  PublicBraiderProfile,
  PublicBusiness,
  PublicLocation,
  ReviewItem,
  ServiceItem,
} from "@/lib/businesses/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A business's public page data, from the same public endpoints the
 * booking flow uses. Returns null when the business doesn't exist or isn't
 * verified (the backend answers 404 for both, deliberately
 * indistinguishable), so the page can show a real 404.
 *
 * Wrapped in React's cache() so generateMetadata and the page itself share
 * one set of requests per render.
 */
export const loadPublicBusiness = cache(async (businessId: string): Promise<PublicBusiness | null> => {
  // Business IDs are UUIDs. Anything else (an old sample slug such as
  // "amara-braids-beauty") can't name a business, so answer without a
  // round trip. The API says 404 for these too.
  if (!UUID_PATTERN.test(businessId)) return null;
  const base = `/api/v1/braiders/${encodeURIComponent(businessId)}`;

  let profile: PublicBraiderProfile;
  try {
    profile = await serverApiFetch<PublicBraiderProfile>(base);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }

  // Each part degrades on its own: a failed reviews feed shouldn't take
  // the whole page down with it.
  const [services, portfolio, reviews, locations] = await Promise.all([
    serverApiFetch<{ services: ServiceItem[] }>(`${base}/services`)
      .then((result) => result.services)
      .catch(() => []),
    serverApiFetch<{ media: PortfolioMediaItem[] }>(`${base}/portfolio`)
      .then((result) => result.media)
      .catch(() => []),
    serverApiFetch<{ reviews: ReviewItem[] }>(`${base}/reviews`)
      .then((result) => result.reviews)
      .catch(() => []),
    serverApiFetch<{ locations: PublicLocation[] }>(`${base}/locations`)
      .then((result) => result.locations)
      .catch(() => []),
  ]);

  return { profile, services, portfolio, reviews, locations };
});
