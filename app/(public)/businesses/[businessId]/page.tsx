import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessProfileContent } from "@/features/businesses/components/BusinessProfileContent";
import { serverApiFetch } from "@/lib/api/server";
import type {
  PortfolioMediaItem,
  PublicBraiderProfile,
  ReviewItem,
  ServiceItem,
} from "@/lib/businesses/types";

export const dynamic = "force-dynamic";

async function loadProfile(businessId: string) {
  try {
    return await serverApiFetch<PublicBraiderProfile>(`/api/v1/braiders/${businessId}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessId: string }>;
}): Promise<Metadata> {
  const { businessId } = await params;
  const profile = await loadProfile(businessId);
  if (!profile) return { title: "Business not found" };
  return {
    title: `${profile.professionalName} | Touch of Heaven`,
    description: profile.bio ?? `Book with ${profile.professionalName} on Touch of Heaven.`,
  };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const profile = await loadProfile(businessId);
  if (!profile) notFound();

  // Each sub-resource degrades independently so one unavailable feed does not
  // take down the whole public profile.
  const [portfolio, reviews, services] = await Promise.all([
    serverApiFetch<{ media: PortfolioMediaItem[] }>(
      `/api/v1/braiders/${businessId}/portfolio`,
    )
      .then((r) => r.media)
      .catch(() => []),
    serverApiFetch<{ reviews: ReviewItem[] }>(`/api/v1/braiders/${businessId}/reviews`)
      .then((r) => r.reviews)
      .catch(() => []),
    serverApiFetch<{ services: ServiceItem[] }>(`/api/v1/braiders/${businessId}/services`)
      .then((r) => r.services)
      .catch(() => []),
  ]);

  return (
    <BusinessProfileContent
      profile={profile}
      portfolio={portfolio}
      reviews={reviews}
      services={services}
    />
  );
}
