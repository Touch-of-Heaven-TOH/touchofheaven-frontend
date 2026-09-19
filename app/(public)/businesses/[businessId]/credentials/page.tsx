import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessProfilePage } from "@/features/discovery/BusinessProfile";
import { loadPublicBusiness } from "@/features/discovery/business-data";

type Params = { params: Promise<{ businessId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const business = await loadPublicBusiness((await params).businessId);
  if (!business) notFound();
  const name = business.profile.professionalName;
  return {
    title: `${name} credentials | Touch of Heaven`,
    description: `Verification and booking policies for ${name}.`,
  };
}

export default async function BusinessProfileRoute({ params }: Params) {
  const business = await loadPublicBusiness((await params).businessId);
  if (!business) notFound();
  return <BusinessProfilePage business={business} section="credentials" />;
}
