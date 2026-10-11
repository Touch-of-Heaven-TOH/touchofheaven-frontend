import type { Metadata } from "next";
import { VenuePage } from "@/features/app/businesses/VenuePage";
import { serverApiFetch } from "@/lib/api/server";
import type { BusinessProfile } from "@/lib/app/types";

type Params = { params: Promise<{ businessId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    const business = await serverApiFetch<BusinessProfile>(`/api/v1/braiders/${(await params).businessId}`);
    const name = business.businessName || business.professionalName;
    return { title: name, description: business.bio ?? `Book with ${name} on Touch of Heaven.` };
  } catch {
    return { title: "Business" };
  }
}

export default async function BusinessProfileRoute({ params }: Params) {
  return <VenuePage id={(await params).businessId} />;
}
