import type { Metadata } from "next";
import { ServiceDetailsPage } from "@/features/discovery/DiscoveryModule";
import {
  getProfessional,
  getService,
} from "@/features/discovery/discovery-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessId: string; serviceSlug: string }>;
}): Promise<Metadata> {
  const { businessId, serviceSlug } = await params;
  const profile = getProfessional(businessId);
  const service = getService(profile, serviceSlug);

  return {
    title: `${service.name} | ${profile.businessName}`,
    description: `${service.description} Book safely on Touch of Heaven.`,
  };
}

export default async function ServiceDetailRoute({
  params,
}: {
  params: Promise<{ businessId: string; serviceSlug: string }>;
}) {
  const { businessId, serviceSlug } = await params;
  return <ServiceDetailsPage slug={businessId} serviceSlug={serviceSlug} />;
}
