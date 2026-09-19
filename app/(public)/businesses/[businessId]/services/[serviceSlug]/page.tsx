import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessServicePage } from "@/features/discovery/BusinessProfile";
import { loadPublicBusiness } from "@/features/discovery/business-data";

// The segment is named serviceSlug for historical reasons; it holds the
// service's ID, which is what the booking flow's ?serviceId= expects too.
type Params = { params: Promise<{ businessId: string; serviceSlug: string }> };

async function load(params: Params["params"]) {
  const { businessId, serviceSlug } = await params;
  const business = await loadPublicBusiness(businessId);
  const service = business?.services.find((candidate) => candidate.id === serviceSlug) ?? null;
  return business && service ? { business, service } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = await load(params);
  if (!found) notFound();
  const { business, service } = found;
  return {
    title: `${service.name} | ${business.profile.professionalName}`,
    description: service.description ?? `Book ${service.name} with ${business.profile.professionalName} on Touch of Heaven.`,
  };
}

export default async function BusinessServiceRoute({ params }: Params) {
  const found = await load(params);
  if (!found) notFound();
  return <BusinessServicePage business={found.business} service={found.service} />;
}
