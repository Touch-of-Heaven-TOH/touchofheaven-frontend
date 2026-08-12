import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BraiderProfileContent } from "@/features/braiders/components/BraiderProfileContent";
import { serverApiFetch } from "@/lib/api/server";
import type {
  PortfolioMediaItem,
  PublicBraiderProfile,
  ReviewItem,
  ServiceItem,
} from "@/lib/braiders/types";

export const dynamic = "force-dynamic";

async function loadProfile(braiderId: string) {
  try {
    return await serverApiFetch<PublicBraiderProfile>(`/api/v1/braiders/${braiderId}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ braiderId: string }>;
}): Promise<Metadata> {
  const { braiderId } = await params;
  const profile = await loadProfile(braiderId);
  if (!profile) return { title: "Braider not found" };
  return {
    title: `${profile.professionalName} | Touch of Heaven`,
    description: profile.bio ?? `Book with ${profile.professionalName} on Touch of Heaven.`,
  };
}

export default async function BraiderProfilePage({
  params,
}: {
  params: Promise<{ braiderId: string }>;
}) {
  const { braiderId } = await params;
  const profile = await loadProfile(braiderId);
  if (!profile) notFound();

  // Each sub-resource degrades independently to an empty list rather than
  // failing the whole page - a braider with zero reviews yet is a normal,
  // expected state, not an error.
  const [portfolio, reviews, services] = await Promise.all([
    serverApiFetch<{ media: PortfolioMediaItem[] }>(
      `/api/v1/braiders/${braiderId}/portfolio`,
    )
      .then((r) => r.media)
      .catch(() => []),
    serverApiFetch<{ reviews: ReviewItem[] }>(`/api/v1/braiders/${braiderId}/reviews`)
      .then((r) => r.reviews)
      .catch(() => []),
    serverApiFetch<{ services: ServiceItem[] }>(`/api/v1/braiders/${braiderId}/services`)
      .then((r) => r.services)
      .catch(() => []),
  ]);

  return (
    <BraiderProfileContent
      profile={profile}
      portfolio={portfolio}
      reviews={reviews}
      services={services}
    />
  );
}
