import type { Metadata } from "next";
import { ProfessionalProfilePage } from "@/features/discovery/DiscoveryModule";
import { getProfessional } from "@/features/discovery/discovery-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessId: string }>;
}): Promise<Metadata> {
  const { businessId } = await params;
  const profile = getProfessional(businessId);
  return {
    title: `${profile.businessName} | Touch of Heaven`,
    description: `Book with ${profile.businessName} on Touch of Heaven.`,
  };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  return <ProfessionalProfilePage slug={businessId} />;
}
