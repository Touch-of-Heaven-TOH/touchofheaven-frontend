import type { Metadata } from "next";
import { DirectBookingPage } from "@/features/discovery/DiscoveryModule";
import { getProfessional } from "@/features/discovery/discovery-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ professionalSlug: string }>;
}): Promise<Metadata> {
  const { professionalSlug } = await params;
  const profile = getProfessional(professionalSlug);

  return {
    title: `Book with ${profile.businessName} | Touch of Heaven`,
    description: `Open the official Touch of Heaven booking link for ${profile.businessName}.`,
  };
}

export default async function DirectBookingRoute({
  params,
}: {
  params: Promise<{ professionalSlug: string }>;
}) {
  const { professionalSlug } = await params;
  return <DirectBookingPage slug={professionalSlug} />;
}
