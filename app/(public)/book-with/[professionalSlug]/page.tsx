import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectBookingLinkPage } from "@/features/discovery/BusinessProfile";
import { loadPublicBusiness } from "@/features/discovery/business-data";

// The segment holds the business's ID (the same one /businesses/[id] uses).
type Params = { params: Promise<{ professionalSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const business = await loadPublicBusiness((await params).professionalSlug);
  if (!business) notFound();
  const name = business.profile.professionalName;
  return {
    title: `Book with ${name} | Touch of Heaven`,
    description: `The official Touch of Heaven booking link for ${name}.`,
  };
}

export default async function DirectBookingRoute({ params }: Params) {
  const business = await loadPublicBusiness((await params).professionalSlug);
  if (!business) notFound();
  return <DirectBookingLinkPage business={business} />;
}
