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
    title: `${profile.businessName} portfolio | Touch of Heaven`,
    description: `Browse verified portfolio work from ${profile.businessName}.`,
  };
}

export default async function BusinessPortfolioPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  return <ProfessionalProfilePage slug={businessId} section="portfolio" />;
}
